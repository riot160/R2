// ═══════════════════════════════════════════════════
//  RIOT MD  ·  AI COMMANDS
// ═══════════════════════════════════════════════════
import fetch from 'node-fetch';

// ── .ai / .ask ─────────────────────────────────────
export const aiCmd = {
  command: ['ai', 'ask', 'chatgpt'],
  desc: 'Ask the AI a question',
  run: async ({ text, reply }) => {
    if (!text) return reply('Usage: .ai <your question>');
    await reply('🤖 Thinking…');
    try {
      // Uses the free pollinations.ai text API
      const res = await fetch(
        `https://text.pollinations.ai/${encodeURIComponent(text)}`,
        { headers: { 'User-Agent': 'RIOT-MD/1.0' } }
      );
      const answer = await res.text();
      await reply(`🤖 *RIOT AI*\n\n${answer.trim()}`);
    } catch (e) {
      await reply('❌ AI service unavailable: ' + e.message);
    }
  },
};

// ── .image ─────────────────────────────────────────
export const imageCmd = {
  command: ['image', 'imagine', 'dalle'],
  desc: 'Generate an AI image',
  run: async ({ text, sock, jid, msg, reply }) => {
    if (!text) return reply('Usage: .image <description>');
    await reply('🎨 Generating image…');
    try {
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(text)}?width=512&height=512&nologo=true`;
      await sock.sendMessage(jid,
        { image: { url }, caption: `🎨 *${text}*` },
        { quoted: msg }
      );
    } catch (e) {
      await reply('❌ Image generation failed: ' + e.message);
    }
  },
};

// ── .translate ─────────────────────────────────────
export const translateCmd = {
  command: ['translate', 'tr'],
  desc: 'Translate text — .tr en Hello World',
  run: async ({ args, reply }) => {
    const lang = args[0] || 'en';
    const phrase = args.slice(1).join(' ');
    if (!phrase) return reply('Usage: .tr <lang_code> <text>\nExample: .tr sw Hello World');
    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(phrase)}&langpair=auto|${lang}`
      );
      const d = await res.json();
      const translated = d.responseData?.translatedText || 'Translation failed';
      await reply(`🌐 *Translation (${lang.toUpperCase()})*\n\n${translated}`);
    } catch (e) {
      await reply('❌ Translation failed: ' + e.message);
    }
  },
};

// ── .weather ───────────────────────────────────────
export const weatherCmd = {
  command: 'weather',
  desc: 'Get current weather',
  run: async ({ args, reply }) => {
    const city = args.join(' ');
    if (!city) return reply('Usage: .weather <city>');
    try {
      const res = await fetch(
        `https://wttr.in/${encodeURIComponent(city)}?format=4`
      );
      const data = await res.text();
      await reply(`🌤️ *Weather — ${city}*\n\n${data}`);
    } catch (e) {
      await reply('❌ Weather fetch failed: ' + e.message);
    }
  },
};

// ── .define ────────────────────────────────────────
export const defineCmd = {
  command: ['define', 'dict', 'dictionary'],
  desc: 'Look up a word definition',
  run: async ({ args, reply }) => {
    const word = args[0];
    if (!word) return reply('Usage: .define <word>');
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      const d = await res.json();
      if (!Array.isArray(d)) return reply(`❌ No definition found for *${word}*`);
      const entry = d[0];
      const meaning = entry.meanings[0];
      const def = meaning.definitions[0];
      await reply(
`📖 *${entry.word}*  _(${meaning.partOfSpeech})_

${def.definition}

${def.example ? `_"${def.example}"_` : ''}`
      );
    } catch (e) {
      await reply('❌ Dictionary error: ' + e.message);
    }
  },
};

// ── .qr ────────────────────────────────────────────
export const qrCmd = {
  command: 'qr',
  desc: 'Generate QR code image from text/link',
  run: async ({ text, sock, jid, msg, reply }) => {
    if (!text) return reply('Usage: .qr <text or URL>');
    try {
      const url = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(text)}&size=300x300`;
      await sock.sendMessage(jid,
        { image: { url }, caption: `📱 QR Code for: ${text}` },
        { quoted: msg }
      );
    } catch (e) {
      await reply('❌ QR generation failed: ' + e.message);
    }
  },
};
