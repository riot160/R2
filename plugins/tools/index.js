// ═══════════════════════════════════════════════════
//  RIOT MD  ·  TOOLS / UTILITY COMMANDS
// ═══════════════════════════════════════════════════
import fetch from 'node-fetch';
import { config } from '../../config.js';

// ── .time ──────────────────────────────────────────
export const timeCmd = {
  command: ['time', 'date'],
  desc: 'Show current date and time',
  run: async ({ args, reply }) => {
    const tz = args.join(' ') || 'Africa/Nairobi';
    try {
      const now = new Date().toLocaleString('en-US', { timeZone: tz, dateStyle: 'full', timeStyle: 'long' });
      await reply(`🕐 *Time (${tz})*\n\n${now}`);
    } catch {
      await reply(`🕐 *UTC Time*\n\n${new Date().toUTCString()}`);
    }
  },
};

// ── .calc ──────────────────────────────────────────
export const calcCmd = {
  command: ['calc', 'math'],
  desc: 'Evaluate a math expression',
  run: async ({ text, reply }) => {
    if (!text) return reply('Usage: .calc 2 + 2 * 10');
    try {
      // Safe eval for basic math only
      const cleaned = text.replace(/[^0-9+\-*/.() %^]/g, '');
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${cleaned})`)();
      await reply(`🧮 *Calculator*\n\n${cleaned} = *${result}*`);
    } catch {
      await reply('❌ Invalid expression');
    }
  },
};

// ── .shortlink ─────────────────────────────────────
export const shortlinkCmd = {
  command: ['shortlink', 'shorten'],
  desc: 'Shorten a URL',
  run: async ({ args, reply }) => {
    const url = args[0];
    if (!url) return reply('Usage: .shortlink <url>');
    try {
      const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
      const short = await res.text();
      await reply(`🔗 *Shortened URL*\n\n${short}`);
    } catch {
      await reply('❌ Could not shorten URL');
    }
  },
};

// ── .ip ────────────────────────────────────────────
export const ipCmd = {
  command: 'ip',
  desc: 'Look up IP information',
  run: async ({ args, reply }) => {
    const ip = args[0] || '';
    try {
      const res = await fetch(`https://ipapi.co/${ip}/json/`);
      const d = await res.json();
      await reply(
`🌐 *IP Info: ${d.ip}*

📍 Location : ${d.city}, ${d.region}, ${d.country_name}
🏢 ISP      : ${d.org}
🌍 Timezone : ${d.timezone}
💱 Currency : ${d.currency}`
      );
    } catch {
      await reply('❌ IP lookup failed');
    }
  },
};

// ── .encode / .decode ──────────────────────────────
export const encodeCmd = {
  command: 'encode',
  desc: 'Base64 encode text',
  run: async ({ text, reply }) => {
    if (!text) return reply('Usage: .encode <text>');
    await reply(`🔐 *Encoded*\n\n${Buffer.from(text).toString('base64')}`);
  },
};
export const decodeCmd = {
  command: 'decode',
  desc: 'Base64 decode text',
  run: async ({ text, reply }) => {
    if (!text) return reply('Usage: .decode <base64>');
    try {
      await reply(`🔓 *Decoded*\n\n${Buffer.from(text, 'base64').toString()}`);
    } catch {
      await reply('❌ Invalid base64 string');
    }
  },
};

// ── .profile ───────────────────────────────────────
export const profileCmd = {
  command: ['profile', 'pp'],
  desc: 'Get profile picture of a contact',
  run: async ({ sock, jid, args, msg, reply }) => {
    const target = args[0]
      ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net'
      : msg.key.remoteJid;
    try {
      const url = await sock.profilePictureUrl(target, 'image');
      await sock.sendMessage(jid,
        { image: { url }, caption: `👤 Profile picture of ${target.split('@')[0]}` },
        { quoted: msg }
      );
    } catch {
      await reply('❌ Could not get profile picture (private or not set)');
    }
  },
};

// ── .alive ─────────────────────────────────────────
export const aliveCmd = {
  command: 'alive',
  desc: 'Check if bot is alive',
  run: async ({ reply }) => {
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);
    await reply(
`⚡ *RIOT MD is alive!*

🤖 Bot     : ${config.BOT_NAME} ${config.BOT_VERSION}
⏱️ Uptime   : ${h}h ${m}m ${s}s
🟢 Node.js  : ${process.version}
📦 RAM      : ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB`
    );
  },
};

// ── .speedtest (simple ping measure) ──────────────
export const speedCmd = {
  command: ['speed', 'speedtest'],
  desc: 'Measure bot response speed',
  run: async ({ reply }) => {
    const t = Date.now();
    await reply(`⚡ *Speed Test*\n\n⏱️ Latency : *${Date.now() - t}ms*\n🌐 Status  : Online`);
  },
};

// ── .tts ───────────────────────────────────────────
export const ttsCmd = {
  command: 'tts',
  desc: 'Text to speech (sends audio)',
  run: async ({ text, sock, jid, msg, reply }) => {
    if (!text) return reply('Usage: .tts <text>');
    try {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=gtx`;
      await sock.sendMessage(jid,
        { audio: { url }, mimetype: 'audio/mpeg', ptt: true },
        { quoted: msg }
      );
    } catch (e) {
      await reply('❌ TTS failed: ' + e.message);
    }
  },
};

// ── .report ────────────────────────────────────────
export const reportCmd = {
  command: 'report',
  desc: 'Report an issue to bot owner',
  run: async ({ text, sock, senderNumber, pushName, reply }) => {
    if (!text) return reply('Usage: .report <your message>');
    await reply('✅ Report sent to bot owner. Thank you!');
    const ownerJid = config.OWNER_NUMBER + '@s.whatsapp.net';
    await sock.sendMessage(ownerJid, {
      text: `📢 *New Report*\nFrom: ${pushName} (${senderNumber})\n\n${text}`
    }).catch(() => {});
  },
};
