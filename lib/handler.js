// ═══════════════════════════════════════════════════
//  RIOT MD - MESSAGE HANDLER
// ═══════════════════════════════════════════════════

import { getContentType, jidDecode } from '@whiskeysockets/baileys';
import { config } from '../config.js';
import { commands, checkCooldown } from './commands.js';
import { sessions } from './session.js';

// ──────────────────────────────────────────────────
//  Extract text from any message type
// ──────────────────────────────────────────────────
function extractText(msg) {
  const m = msg.message;
  if (!m) return '';
  return (
    m.conversation                            ||
    m.extendedTextMessage?.text               ||
    m.imageMessage?.caption                  ||
    m.videoMessage?.caption                  ||
    m.buttonsResponseMessage?.selectedDisplayText ||
    m.listResponseMessage?.title             ||
    ''
  );
}

// ──────────────────────────────────────────────────
//  Build a rich context object for plugins
// ──────────────────────────────────────────────────
function buildContext(sock, msg, userId) {
  const jid    = msg.key.remoteJid || '';
  const isGroup = jid.endsWith('@g.us');
  const sender  = isGroup
    ? (msg.key.participant || msg.pushName || jid)
    : jid;

  const senderNumber = jidDecode(sender)?.user || sender.split('@')[0];
  const isOwner      = senderNumber === config.OWNER_NUMBER ||
                       senderNumber === (config.OWNER_NUMBER.startsWith('0')
                         ? '254' + config.OWNER_NUMBER.slice(1)
                         : config.OWNER_NUMBER);

  const body = extractText(msg);
  const prefix = config.PREFIX;
  const isCmd  = body.startsWith(prefix);
  const [rawCmd, ...argArr] = isCmd
    ? body.slice(prefix.length).trim().split(/\s+/)
    : ['', ...body.split(/\s+/)];
  const command = rawCmd.toLowerCase();
  const args    = argArr;
  const text    = args.join(' ');

  // ── Quick reply helper ──
  const reply = (content) => {
    if (typeof content === 'string') {
      return sock.sendMessage(jid, { text: content }, { quoted: msg });
    }
    return sock.sendMessage(jid, content, { quoted: msg });
  };

  // ── React helper ──
  const react = (emoji) =>
    sock.sendMessage(jid, { react: { text: emoji, key: msg.key } });

  return {
    sock, msg, userId, jid, sender, senderNumber,
    isGroup, isOwner, isCmd, command, args, text, body,
    prefix, reply, react,
    pushName: msg.pushName || senderNumber,
  };
}

// ──────────────────────────────────────────────────
//  Main handler  (called per message)
// ──────────────────────────────────────────────────
export async function messageHandler(sock, msg, userId) {
  if (!msg.message || msg.key.fromMe) return;

  // Skip status updates
  if (msg.key.remoteJid === 'status@broadcast') return;

  const ctx = buildContext(sock, msg, userId);

  // Auto-read
  if (config.AUTO_READ) {
    await sock.readMessages([msg.key]).catch(() => {});
  }

  // Auto-typing before reply
  if (config.AUTO_TYPING && ctx.isCmd) {
    await sock.sendPresenceUpdate('composing', ctx.jid).catch(() => {});
  }

  if (!ctx.isCmd) return;

  const plugin = commands.get(ctx.command);
  if (!plugin) return;

  // ── Permission checks ──
  if (plugin.owner && !ctx.isOwner) {
    return ctx.reply(`❌ *Owner only command.*`);
  }
  if (plugin.group && !ctx.isGroup) {
    return ctx.reply(`❌ *This command works in groups only.*`);
  }

  // ── Cooldown ──
  const wait = checkCooldown(ctx.senderNumber, ctx.command);
  if (wait > 0) {
    return ctx.reply(`⏳ Slow down! Wait *${wait}s* before using this command again.`);
  }

  // ── Track command count ──
  const session = sessions.get(userId);
  if (session) session.commandCount++;

  // ── Execute ──
  try {
    await ctx.react('⚙️');
    await plugin.run(ctx);
  } catch (err) {
    console.error(`  ❌  Command error [.${ctx.command}]:`, err.message);
    await ctx.reply(`❌ An error occurred: ${err.message}`);
  }
}
