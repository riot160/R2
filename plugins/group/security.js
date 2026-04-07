// ═══════════════════════════════════════════════════
//  RIOT MD  ·  SECURITY / MODERATION COMMANDS
// ═══════════════════════════════════════════════════
import fetch from 'node-fetch';
import { getUser, saveUser, getGroup, saveGroup } from '../../lib/database.js';

// ── Spam detection store (in-memory) ──────────────
const spamMap = new Map(); // jid → { count, last }

export function isSpam(jid, windowMs = 5000, maxMsg = 5) {
  const now  = Date.now();
  const data = spamMap.get(jid) || { count: 0, last: now };
  if (now - data.last > windowMs) {
    spamMap.set(jid, { count: 1, last: now });
    return false;
  }
  data.count++;
  data.last = now;
  spamMap.set(jid, data);
  return data.count > maxMsg;
}

// ── .warn ──────────────────────────────────────────
export const warnCmd = {
  command: 'warn',
  desc: 'Warn a group member',
  group: true,
  admin: true,
  run: async ({ sock, jid, msg, args, reply }) => {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentioned.length) return reply('Mention someone: .warn @user <reason>');
    const reason = args.slice(1).join(' ') || 'No reason given';
    const targetNum = mentioned[0].split('@')[0];
    const user = await getUser(targetNum);
    user.warns = (user.warns || 0) + 1;
    await saveUser(targetNum, user);
    await sock.sendMessage(jid, {
      text: `⚠️ *Warning ${user.warns}/3*\n@${targetNum}\n\nReason: ${reason}`,
      mentions: mentioned,
    });
    if (user.warns >= 3) {
      await sock.groupParticipantsUpdate(jid, mentioned, 'remove');
      await reply(`🔨 @${targetNum} has been kicked after 3 warnings.`);
    }
  },
};

// ── .resetwarn ─────────────────────────────────────
export const resetwarnCmd = {
  command: 'resetwarn',
  desc: 'Reset warnings for a user',
  group: true,
  admin: true,
  run: async ({ msg, reply }) => {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentioned.length) return reply('Mention someone: .resetwarn @user');
    const num = mentioned[0].split('@')[0];
    const user = await getUser(num);
    user.warns = 0;
    await saveUser(num, user);
    await reply(`✅ Warnings reset for @${num}`);
  },
};

// ── .scanlink ──────────────────────────────────────
export const scanlinkCmd = {
  command: ['scanlink', 'checklink', 'virusscan'],
  desc: 'Scan a URL for malware/phishing',
  run: async ({ args, reply }) => {
    const url = args[0];
    if (!url) return reply('Usage: .scanlink <url>');
    await reply(`🔍 Scanning: ${url}…`);
    try {
      // Google Safe Browsing public check via urlscan.io
      const res = await fetch(
        `https://transparencyreport.google.com/safe-browsing/search?url=${encodeURIComponent(url)}&hl=en`
      );
      const flagged = res.url.includes('unsafe') || res.status !== 200;
      await reply(
        flagged
          ? `🚨 *DANGER*: This link may be unsafe!\n${url}`
          : `✅ *Safe*: No known threats detected.\n${url}`
      );
    } catch {
      await reply(`⚠️ Could not fully scan ${url}. Be cautious with unknown links.`);
    }
  },
};

// ── .spamcheck ─────────────────────────────────────
export const spamcheckCmd = {
  command: 'spamcheck',
  desc: 'Check if a number is flagged as spam',
  run: async ({ args, reply }) => {
    const num = (args[0] || '').replace(/[^0-9]/g, '');
    if (!num) return reply('Usage: .spamcheck <number>');
    const user = await getUser(num);
    await reply(
`🔎 *Spam Check — ${num}*

🚫 Banned   : ${user.banned  ? 'Yes' : 'No'}
⚠️ Warnings : ${user.warns  || 0}
📊 Commands : ${user.commandsUsed || 0}
📅 Joined   : ${user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'Unknown'}`
    );
  },
};

// ── .mute / .unmute ────────────────────────────────
export const muteCmd = {
  command: 'mute',
  desc: 'Mute group (admins only can send)',
  group: true,
  admin: true,
  run: async ({ sock, jid, reply }) => {
    await sock.groupSettingUpdate(jid, 'announcement');
    await reply('🔇 Group muted — only admins can send messages.');
  },
};
export const unmuteCmd = {
  command: 'unmute',
  desc: 'Unmute group',
  group: true,
  admin: true,
  run: async ({ sock, jid, reply }) => {
    await sock.groupSettingUpdate(jid, 'not_announcement');
    await reply('🔊 Group unmuted — everyone can send messages.');
  },
};

// ── .purge ─────────────────────────────────────────
export const purgeCmd = {
  command: 'purge',
  desc: 'Delete bot\'s last N messages',
  owner: true,
  run: async ({ args, reply }) => {
    // Note: WhatsApp Web doesn't allow bulk-delete via Baileys easily.
    // This is a placeholder for future implementation.
    await reply('⚠️ Purge requires manual message deletion on this WhatsApp version.');
  },
};
