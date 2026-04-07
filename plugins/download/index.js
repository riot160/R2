// ═══════════════════════════════════════════════════
//  RIOT MD  ·  DOWNLOAD COMMANDS
//  Uses yt-dlp CLI or free APIs for media downloads
// ═══════════════════════════════════════════════════
import fetch from 'node-fetch';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import { randomUUID } from 'crypto';

const execAsync = promisify(exec);
const TMP = '/tmp/riotmd';
await fs.ensureDir(TMP);

// ── helper: download buffer from URL ──
async function getBuffer(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  return Buffer.from(await res.arrayBuffer());
}

// ── .play / .ytmp3 ─────────────────────────────────
export const playCmd = {
  command: ['play', 'ytmp3', 'music'],
  desc: 'Download YouTube audio (.play <song name>)',
  run: async ({ text, sock, jid, msg, reply }) => {
    if (!text) return reply('Usage: .play <song title or YouTube URL>');
    await reply(`🎵 Searching: *${text}*…`);
    try {
      // cobalt.tools public API
      const searchUrl = text.startsWith('http') ? text
        : `https://www.youtube.com/results?search_query=${encodeURIComponent(text)}`;

      // Try cobalt-tools direct download approach
      const id = randomUUID().slice(0, 8);
      const out = path.join(TMP, `${id}.mp3`);
      await execAsync(`yt-dlp -x --audio-format mp3 -o "${out}" "${text}" --no-playlist`, { timeout: 60000 });
      const buf = await fs.readFile(out);
      await sock.sendMessage(jid,
        { audio: buf, mimetype: 'audio/mpeg', fileName: `${text}.mp3` },
        { quoted: msg }
      );
      await fs.remove(out);
    } catch (e) {
      await reply(`❌ Download failed: ${e.message}\n\nMake sure yt-dlp is installed: \`npm install -g yt-dlp\``);
    }
  },
};

// ── .ytmp4 / .video ────────────────────────────────
export const ytmp4Cmd = {
  command: ['ytmp4', 'video', 'ytvideo'],
  desc: 'Download YouTube video (.ytmp4 <url>)',
  run: async ({ text, sock, jid, msg, reply }) => {
    if (!text) return reply('Usage: .ytmp4 <YouTube URL>');
    await reply(`🎬 Downloading video…`);
    try {
      const id = randomUUID().slice(0, 8);
      const out = path.join(TMP, `${id}.mp4`);
      await execAsync(`yt-dlp -f "best[height<=480]" -o "${out}" "${text}" --no-playlist`, { timeout: 120000 });
      const buf = await fs.readFile(out);
      await sock.sendMessage(jid,
        { video: buf, caption: '🎬 Downloaded by RIOT MD' },
        { quoted: msg }
      );
      await fs.remove(out);
    } catch (e) {
      await reply(`❌ Video download failed: ${e.message}`);
    }
  },
};

// ── .tiktok ────────────────────────────────────────
export const tiktokCmd = {
  command: ['tiktok', 'tt'],
  desc: 'Download TikTok video without watermark',
  run: async ({ text, sock, jid, msg, reply }) => {
    if (!text) return reply('Usage: .tiktok <tiktok url>');
    await reply('⬇️ Downloading TikTok video…');
    try {
      // Tikwm public API
      const res = await fetch(
        `https://www.tikwm.com/api/?url=${encodeURIComponent(text)}&hd=1`
      );
      const d = await res.json();
      if (!d?.data?.play) throw new Error(d.msg || 'No video found');
      const buf = await getBuffer(d.data.play);
      await sock.sendMessage(jid,
        { video: buf, caption: `🎵 ${d.data.title || 'TikTok Video'}\n👤 @${d.data.author?.unique_id || '?'}` },
        { quoted: msg }
      );
    } catch (e) {
      await reply('❌ TikTok download failed: ' + e.message);
    }
  },
};

// ── .instagram ─────────────────────────────────────
export const instagramCmd = {
  command: ['instagram', 'ig', 'insta'],
  desc: 'Download Instagram post/reel',
  run: async ({ text, sock, jid, msg, reply }) => {
    if (!text) return reply('Usage: .instagram <instagram url>');
    await reply('⬇️ Downloading Instagram media…');
    try {
      const id = randomUUID().slice(0, 8);
      const out = path.join(TMP, `${id}.%(ext)s`);
      await execAsync(`yt-dlp -o "${out}" "${text}"`, { timeout: 60000 });
      const files = (await fs.readdir(TMP)).filter(f => f.startsWith(id));
      if (!files.length) throw new Error('No file downloaded');
      const file = path.join(TMP, files[0]);
      const buf  = await fs.readFile(file);
      const isVideo = file.endsWith('.mp4') || file.endsWith('.mov');
      await sock.sendMessage(jid,
        isVideo ? { video: buf, caption: '📸 Instagram Media' } : { image: buf, caption: '📸 Instagram Media' },
        { quoted: msg }
      );
      await fs.remove(file);
    } catch (e) {
      await reply('❌ Instagram download failed: ' + e.message);
    }
  },
};

// ── .spotify ───────────────────────────────────────
export const spotifyCmd = {
  command: 'spotify',
  desc: 'Search Spotify track info',
  run: async ({ text, reply }) => {
    if (!text) return reply('Usage: .spotify <song name>');
    try {
      const res = await fetch(
        `https://saavn.dev/api/search/songs?query=${encodeURIComponent(text)}&page=1&limit=1`
      );
      const d = await res.json();
      const track = d?.data?.results?.[0];
      if (!track) return reply('❌ No results found');
      await reply(
`🎵 *${track.name}*
👤 Artist : ${track.artists?.primary?.map(a => a.name).join(', ') || '?'}
💿 Album  : ${track.album?.name || '?'}
📅 Year   : ${track.year || '?'}
⏱️ Duration: ${Math.floor((track.duration || 0) / 60)}:${String((track.duration || 0) % 60).padStart(2,'0')}`
      );
    } catch (e) {
      await reply('❌ Spotify search failed: ' + e.message);
    }
  },
};
