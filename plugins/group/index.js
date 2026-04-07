// ═══════════════════════════════════════════════════
//  RIOT MD  ·  GROUP COMMANDS
// ═══════════════════════════════════════════════════
import { getGroup, saveGroup } from '../../lib/database.js';

// ── helper: get participant JIDs ──
function participants(metadata) {
  return (metadata?.participants || []).map(p => p.id);
}

// ── .kick ──────────────────────────────────────────
export const kickCmd = {
  command: 'kick',
  desc: 'Remove a member from group',
  group: true,
  admin: true,
  run: async ({ sock, msg, jid, reply }) => {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentioned.length) return reply('Mention someone to kick: .kick @user');
    await sock.groupParticipantsUpdate(jid, mentioned, 'remove');
    await reply(`✅ Kicked ${mentioned.length} member(s)`);
  },
};

// ── .promote ───────────────────────────────────────
export const promoteCmd = {
  command: 'promote',
  desc: 'Promote member to admin',
  group: true,
  admin: true,
  run: async ({ sock, msg, jid, reply }) => {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentioned.length) return reply('Mention someone: .promote @user');
    await sock.groupParticipantsUpdate(jid, mentioned, 'promote');
    await reply(`⬆️ Promoted ${mentioned.length} member(s) to admin`);
  },
};

// ── .demote ────────────────────────────────────────
export const demoteCmd = {
  command: 'demote',
  desc: 'Demote admin to member',
  group: true,
  admin: true,
  run: async ({ sock, msg, jid, reply }) => {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentioned.length) return reply('Mention someone: .demote @user');
    await sock.groupParticipantsUpdate(jid, mentioned, 'demote');
    await reply(`⬇️ Demoted ${mentioned.length} admin(s)`);
  },
};

// ── .tagall ────────────────────────────────────────
export const tagallCmd = {
  command: ['tagall', 'everyone', 'all'],
  desc: 'Tag all group members',
  group: true,
  run: async ({ sock, jid, text, reply }) => {
    const meta = await sock.groupMetadata(jid);
    const members = participants(meta);
    const mentions = members;
    const body = text
      ? `📢 *${text}*\n\n${members.map(m => `@${m.split('@')[0]}`).join(' ')}`
      : `📢 ${members.map(m => `@${m.split('@')[0]}`).join(' ')}`;
    await sock.sendMessage(jid, { text: body, mentions });
  },
};

// ── .groupinfo ─────────────────────────────────────
export const groupinfoCmd = {
  command: 'groupinfo',
  desc: 'Show group information',
  group: true,
  run: async ({ sock, jid, reply }) => {
    const meta = await sock.groupMetadata(jid);
    const admins = meta.participants.filter(p => p.admin).length;
    await reply(
`\`\`\`
📋 GROUP INFO
${'─'.repeat(26)}
Name    : ${meta.subject}
JID     : ${jid}
Members : ${meta.participants.length}
Admins  : ${admins}
Created : ${new Date(meta.creation * 1000).toLocaleDateString()}
\`\`\``
    );
  },
};

// ── .antilink ──────────────────────────────────────
export const antilinkCmd = {
  command: 'antilink',
  desc: 'Toggle antilink protection',
  group: true,
  admin: true,
  run: async ({ jid, args, reply }) => {
    const g = await getGroup(jid);
    g.antilink = args[0] === 'on';
    await saveGroup(jid, g);
    await reply(`🔗 Antilink is now *${g.antilink ? 'ON' : 'OFF'}*`);
  },
};

// ── .antibadword ───────────────────────────────────
export const antibadwordCmd = {
  command: 'antibadword',
  desc: 'Toggle bad-word filter',
  group: true,
  admin: true,
  run: async ({ jid, args, reply }) => {
    const g = await getGroup(jid);
    g.antibadword = args[0] === 'on';
    await saveGroup(jid, g);
    await reply(`🤬 Bad-word filter is now *${g.antibadword ? 'ON' : 'OFF'}*`);
  },
};

// ── .welcome ───────────────────────────────────────
export const welcomeCmd = {
  command: 'welcome',
  desc: 'Toggle welcome messages',
  group: true,
  admin: true,
  run: async ({ jid, args, text, reply }) => {
    const g = await getGroup(jid);
    if (args[0] === 'on' || args[0] === 'off') {
      g.welcome = args[0] === 'on';
    } else if (text) {
      g.welcomeMsg = text;
    }
    await saveGroup(jid, g);
    await reply(`👋 Welcome messages: *${g.welcome ? 'ON' : 'OFF'}*\nMessage: _${g.welcomeMsg}_`);
  },
};

// ── .open / .close ─────────────────────────────────
export const openCmd = {
  command: 'open',
  desc: 'Open group for all members',
  group: true,
  admin: true,
  run: async ({ sock, jid, reply }) => {
    await sock.groupSettingUpdate(jid, 'not_announcement');
    await reply('🔓 Group is now *open*');
  },
};
export const closeCmd = {
  command: 'close',
  desc: 'Close group for admins only',
  group: true,
  admin: true,
  run: async ({ sock, jid, reply }) => {
    await sock.groupSettingUpdate(jid, 'announcement');
    await reply('🔒 Group is now *closed* (admins only)');
  },
};

// ── .invite ────────────────────────────────────────
export const inviteCmd = {
  command: 'invite',
  desc: 'Get group invite link',
  group: true,
  run: async ({ sock, jid, reply }) => {
    const code = await sock.groupInviteCode(jid);
    await reply(`🔗 Invite Link:\nhttps://chat.whatsapp.com/${code}`);
  },
};
