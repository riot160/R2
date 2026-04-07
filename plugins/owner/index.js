// ═══════════════════════════════════════════════════
//  RIOT MD  ·  OWNER COMMANDS
// ═══════════════════════════════════════════════════
import { config } from '../../config.js';
import { sessions } from '../../lib/session.js';
import { loadPlugins, pluginList } from '../../lib/commands.js';
import { getUser, saveUser } from '../../lib/database.js';

// ── .menu ──────────────────────────────────────────
export const menuCmd = {
  command: ['menu', 'help', 'list'],
  desc: 'Show all commands',
  run: async ({ reply }) => {
    const cats = {};
    for (const p of pluginList) {
      if (!cats[p.category]) cats[p.category] = [];
      cats[p.category].push(`.${p.command}`);
    }
    let text = `\`\`\`\n⚡ RIOT MD — COMMAND MENU\n${'═'.repeat(30)}\n\n`;
    for (const [cat, cmds] of Object.entries(cats)) {
      text += `📁 ${cat.toUpperCase()}\n${cmds.join('  ')}\n\n`;
    }
    text += `Total: ${pluginList.length} commands\n\`\`\``;
    await reply(text);
  },
};

// ── .ping ──────────────────────────────────────────
export const pingCmd = {
  command: 'ping',
  desc: 'Check bot speed',
  run: async ({ reply }) => {
    const start = Date.now();
    await reply('⏱️ Pinging…');
    await reply(`🏓 Pong! *${Date.now() - start}ms*`);
  },
};

// ── .info ──────────────────────────────────────────
export const infoCmd = {
  command: ['info', 'botinfo'],
  desc: 'Bot information',
  run: async ({ reply }) => {
    const mem = process.memoryUsage();
    await reply(
`\`\`\`
⚡ RIOT MD — BOT INFO
${'─'.repeat(28)}
Name    : ${config.BOT_NAME}
Version : ${config.BOT_VERSION}
Dev     : ${config.DEVELOPER}
Mode    : ${config.MODE}
Prefix  : ${config.PREFIX}
Node    : ${process.version}
Uptime  : ${Math.floor(process.uptime() / 60)}m
RAM     : ${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB
Commands: ${pluginList.length}
\`\`\``
    );
  },
};

// ── .setprefix ─────────────────────────────────────
export const setPrefixCmd = {
  command: 'setprefix',
  desc: 'Change bot prefix',
  owner: true,
  run: async ({ args, reply }) => {
    if (!args[0]) return reply('Usage: .setprefix <new_prefix>');
    config.PREFIX = args[0];
    await reply(`✅ Prefix changed to *${args[0]}*`);
  },
};

// ── .broadcast ─────────────────────────────────────
export const broadcastCmd = {
  command: 'broadcast',
  desc: 'Broadcast message to all users',
  owner: true,
  run: async ({ text, sock, reply }) => {
    if (!text) return reply('Usage: .broadcast <message>');
    let sent = 0;
    for (const [, s] of sessions) {
      if (s.status !== 'connected') continue;
      try { await s.sock.sendMessage(s.phoneNumber + '@s.whatsapp.net', { text: `📢 *Broadcast*\n\n${text}` }); sent++; } catch {}
    }
    await reply(`✅ Broadcast sent to *${sent}* session(s)`);
  },
};

// ── .block / .unblock ──────────────────────────────
export const blockCmd = {
  command: 'block',
  desc: 'Block a user',
  owner: true,
  run: async ({ args, sock, reply, jid }) => {
    const target = (args[0] || '').replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    await sock.updateBlockStatus(target, 'block');
    await reply(`🚫 Blocked ${args[0]}`);
  },
};
export const unblockCmd = {
  command: 'unblock',
  desc: 'Unblock a user',
  owner: true,
  run: async ({ args, sock, reply }) => {
    const target = (args[0] || '').replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    await sock.updateBlockStatus(target, 'unblock');
    await reply(`✅ Unblocked ${args[0]}`);
  },
};

// ── .reload ────────────────────────────────────────
export const reloadCmd = {
  command: 'reload',
  desc: 'Reload all plugins',
  owner: true,
  run: async ({ reply }) => {
    const n = await loadPlugins('./plugins');
    await reply(`♻️ Reloaded *${n}* plugins`);
  },
};

// ── .shutdown ──────────────────────────────────────
export const shutdownCmd = {
  command: 'shutdown',
  desc: 'Shutdown the bot',
  owner: true,
  run: async ({ reply }) => {
    await reply('👋 RIOT MD shutting down…');
    setTimeout(() => process.exit(0), 1000);
  },
};

// ── .ban / .unban ──────────────────────────────────
export const banCmd = {
  command: 'ban',
  desc: 'Ban a user from commands',
  owner: true,
  run: async ({ args, reply }) => {
    const num = (args[0] || '').replace(/[^0-9]/g, '');
    if (!num) return reply('Provide a phone number');
    const user = await getUser(num);
    user.banned = true;
    await saveUser(num, user);
    await reply(`🔨 *${num}* has been banned`);
  },
};
export const unbanCmd = {
  command: 'unban',
  desc: 'Unban a user',
  owner: true,
  run: async ({ args, reply }) => {
    const num = (args[0] || '').replace(/[^0-9]/g, '');
    const user = await getUser(num);
    user.banned = false;
    await saveUser(num, user);
    await reply(`✅ *${num}* has been unbanned`);
  },
};
