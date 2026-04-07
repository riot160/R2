// ═══════════════════════════════════════════════════
//  RIOT MD - WEB SERVER  (Express + Socket.io)
// ═══════════════════════════════════════════════════

import express from 'express';
import { createServer } from 'http';
import { Server as IOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { createSession, removeSession, sessions,
         sessionEvents, getSessionStats, restoreAllSessions }
  from './lib/session.js';
import { pluginList } from './lib/commands.js';
import { dbAll } from './lib/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Express & HTTP ──
export const app  = express();
export const http = createServer(app);
export const io   = new IOServer(http, { cors: { origin: '*' } });

// ── Middleware ──
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'dashboard/public')));

// ── Rate limiter ──
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests' },
}));

// ──────────────────────────────────────────────────
//  Auth middleware
// ──────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, config.API_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ──────────────────────────────────────────────────
//  REST API
// ──────────────────────────────────────────────────

// POST /api/login
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password !== config.DASHBOARD_PASS) {
    return res.status(401).json({ error: 'Wrong password' });
  }
  const token = jwt.sign({ admin: true }, config.API_SECRET, { expiresIn: '7d' });
  res.json({ token, botName: config.BOT_NAME, version: config.BOT_VERSION });
});

// POST /api/pair  →  start session + return pairing code
app.post('/api/pair', authMiddleware, async (req, res) => {
  const { phoneNumber, userId } = req.body;
  if (!phoneNumber || !userId) {
    return res.status(400).json({ error: 'phoneNumber and userId required' });
  }

  try {
    const session = await createSession(userId, phoneNumber, true);

    // Wait up to 30 s for pairing code
    let waited = 0;
    while (!session.pairingCode && waited < 30000) {
      await new Promise(r => setTimeout(r, 500));
      waited += 500;
    }

    if (!session.pairingCode) {
      return res.status(504).json({ error: 'Pairing code timeout. Try again.' });
    }

    res.json({
      success: true,
      pairingCode: session.pairingCode,
      userId,
      phoneNumber,
      message: `Enter code in WhatsApp → Linked Devices`,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/sessions
app.get('/api/sessions', authMiddleware, (req, res) => {
  const list = [...sessions.entries()].map(([id, s]) => ({
    userId: id,
    phoneNumber: s.phoneNumber,
    status: s.status,
    connectedAt: s.connectedAt,
    messages: s.messageCount,
    commands: s.commandCount,
  }));
  res.json({ sessions: list, stats: getSessionStats() });
});

// DELETE /api/sessions/:userId
app.delete('/api/sessions/:userId', authMiddleware, async (req, res) => {
  await removeSession(req.params.userId);
  res.json({ success: true });
});

// GET /api/status
app.get('/api/status', (req, res) => {
  res.json({
    bot: config.BOT_NAME,
    version: config.BOT_VERSION,
    uptime: process.uptime(),
    ...getSessionStats(),
    node: process.version,
  });
});

// POST /api/send
app.post('/api/send', authMiddleware, async (req, res) => {
  const { userId, jid, message } = req.body;
  const session = sessions.get(userId);
  if (!session || session.status !== 'connected') {
    return res.status(404).json({ error: 'Session not found or not connected' });
  }
  try {
    await session.sock.sendMessage(jid, { text: message });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/plugins
app.get('/api/plugins', authMiddleware, (req, res) => {
  res.json({ plugins: pluginList, total: pluginList.length });
});

// GET /api/users (from DB)
app.get('/api/users', authMiddleware, async (req, res) => {
  const all  = await dbAll();
  const users = Object.entries(all)
    .filter(([k]) => k.startsWith('user:'))
    .map(([, v]) => v);
  res.json({ users, total: users.length });
});

// GET /api/logs
app.get('/api/logs', authMiddleware, (req, res) => {
  res.json({ logs: logBuffer });
});

// ──────────────────────────────────────────────────
//  Socket.io – live dashboard updates
// ──────────────────────────────────────────────────
export const logBuffer = [];

function pushLog(level, msg) {
  const entry = { time: new Date().toISOString(), level, msg };
  logBuffer.push(entry);
  if (logBuffer.length > 500) logBuffer.shift();
  io.emit('log', entry);
}

// Relay session events to dashboard
sessionEvents.on('pairingCode', (d) => {
  io.emit('pairingCode', d);
  pushLog('info', `Pairing code generated for ${d.phoneNumber}: ${d.code}`);
});
sessionEvents.on('connected',   (d) => {
  io.emit('sessionUpdate', { ...d, status: 'connected' });
  pushLog('success', `Session [${d.userId}] connected`);
  io.emit('stats', getSessionStats());
});
sessionEvents.on('disconnected', (d) => {
  io.emit('sessionUpdate', { ...d, status: d.loggedOut ? 'logged_out' : 'reconnecting' });
  pushLog('warn', `Session [${d.userId}] disconnected (code ${d.code})`);
  io.emit('stats', getSessionStats());
});
sessionEvents.on('removed', (d) => {
  io.emit('sessionRemoved', d);
  io.emit('stats', getSessionStats());
});

// Emit stats every 5 s
setInterval(() => io.emit('stats', getSessionStats()), 5000);

io.on('connection', (socket) => {
  socket.emit('stats', getSessionStats());
  socket.emit('history', logBuffer.slice(-100));
});

// ──────────────────────────────────────────────────
//  Start server
// ──────────────────────────────────────────────────
export async function startServer() {
  return new Promise((resolve) => {
    http.listen(config.PORT, () => {
      pushLog('info', `RIOT MD server running on port ${config.PORT}`);
      resolve();
    });
  });
}
