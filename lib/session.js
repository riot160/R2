// ═══════════════════════════════════════════════════
//  RIOT MD - SESSION MANAGER
// ═══════════════════════════════════════════════════

import { makeWASocket, useMultiFileAuthState, DisconnectReason,
         fetchLatestBaileysVersion, makeCacheableSignalKeyStore }
  from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import fs from 'fs-extra';
import path from 'path';
import { EventEmitter } from 'events';
import { config } from '../config.js';
import { messageHandler } from './handler.js';

const logger = pino({ level: 'silent' });

// ── Active sessions map: userId → { socket, status, number } ──
export const sessions = new Map();
export const sessionEvents = new EventEmitter();

// ──────────────────────────────────────────────────
//  Create / restore a session
// ──────────────────────────────────────────────────
export async function createSession(userId, phoneNumber = null, pairingMode = true) {
  if (sessions.has(userId)) await removeSession(userId);

  const sessionPath = path.join(config.SESSION_DIR, userId);
  await fs.ensureDir(sessionPath);

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    browser: ['RIOT MD', 'Chrome', '120.0.0'],
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    getMessage: async () => ({ conversation: 'RIOT MD' }),
  });

  const session = {
    sock,
    userId,
    phoneNumber,
    status: 'connecting',
    pairingCode: null,
    connectedAt: null,
    messageCount: 0,
    commandCount: 0,
  };

  sessions.set(userId, session);

  // ── Request pairing code if first-time ──
  if (pairingMode && !state.creds.registered && phoneNumber) {
    await new Promise(r => setTimeout(r, 2000));
    try {
      const code = await sock.requestPairingCode(phoneNumber.replace(/[^0-9]/g, ''));
      const formatted = code.match(/.{1,4}/g)?.join('-') || code;
      session.pairingCode = formatted;
      sessionEvents.emit('pairingCode', { userId, code: formatted, phoneNumber });
      console.log(`\n  ┌─────────────────────────────────────┐`);
      console.log(`  │       RIOT MD PAIRING SYSTEM        │`);
      console.log(`  ├─────────────────────────────────────┤`);
      console.log(`  │  Number : ${phoneNumber.padEnd(26)}│`);
      console.log(`  │  Code   : ${formatted.padEnd(26)}│`);
      console.log(`  │  Status : Waiting for verification  │`);
      console.log(`  └─────────────────────────────────────┘\n`);
    } catch (e) {
      sessionEvents.emit('error', { userId, error: e.message });
    }
  }

  // ── Connection update handler ──
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (connection === 'open') {
      session.status    = 'connected';
      session.connectedAt = Date.now();
      session.pairingCode = null;
      await saveCreds();
      sessionEvents.emit('connected', { userId, phoneNumber });
      console.log(`  ✅  Session [${userId}] connected → ${phoneNumber || 'restored'}`);
    }

    if (connection === 'close') {
      const code    = (lastDisconnect?.error instanceof Boom)
                        ? lastDisconnect.error.output?.statusCode : 500;
      const loggedOut = code === DisconnectReason.loggedOut;

      session.status = loggedOut ? 'logged_out' : 'reconnecting';
      sessionEvents.emit('disconnected', { userId, code, loggedOut });

      if (loggedOut) {
        console.log(`  ⚠️   Session [${userId}] logged out.`);
        await removeSession(userId);
      } else {
        console.log(`  🔄  Session [${userId}] reconnecting… (code ${code})`);
        setTimeout(() => createSession(userId, phoneNumber, false), 5000);
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // ── Pass messages to handler ──
  sock.ev.on('messages.upsert', async (m) => {
    if (m.type !== 'notify') return;
    session.messageCount++;
    for (const msg of m.messages) {
      try { await messageHandler(sock, msg, userId); } catch (e) {
        console.error(`Handler error [${userId}]:`, e.message);
      }
    }
  });

  return session;
}

// ──────────────────────────────────────────────────
//  Remove session
// ──────────────────────────────────────────────────
export async function removeSession(userId) {
  const session = sessions.get(userId);
  if (session?.sock) {
    try { await session.sock.logout(); } catch {}
    try { session.sock.end(); } catch {}
  }
  sessions.delete(userId);
  sessionEvents.emit('removed', { userId });
}

// ──────────────────────────────────────────────────
//  Restore all persisted sessions on startup
// ──────────────────────────────────────────────────
export async function restoreAllSessions() {
  await fs.ensureDir(config.SESSION_DIR);
  const dirs = await fs.readdir(config.SESSION_DIR);
  let restored = 0;
  for (const userId of dirs) {
    const creds = path.join(config.SESSION_DIR, userId, 'creds.json');
    if (await fs.pathExists(creds)) {
      await createSession(userId, null, false);
      restored++;
    }
  }
  return restored;
}

// ──────────────────────────────────────────────────
//  Stats helper
// ──────────────────────────────────────────────────
export function getSessionStats() {
  const all = [...sessions.values()];
  return {
    total:        all.length,
    connected:    all.filter(s => s.status === 'connected').length,
    connecting:   all.filter(s => s.status === 'connecting').length,
    reconnecting: all.filter(s => s.status === 'reconnecting').length,
    messages:     all.reduce((a, s) => a + s.messageCount, 0),
    commands:     all.reduce((a, s) => a + s.commandCount, 0),
  };
}
