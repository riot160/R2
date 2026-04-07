// ═══════════════════════════════════════════════════
//  RIOT MD  ·  EXTRA TOOLS  (batch 2)
// ═══════════════════════════════════════════════════
import fetch from 'node-fetch';

// ── .lyrics ────────────────────────────────────────
export const lyricsCmd = {
  command: 'lyrics',
  desc: 'Search song lyrics',
  run: async ({ text, reply }) => {
    if (!text) return reply('Usage: .lyrics <song name>');
    try {
      const res = await fetch(`https://lyrist.vercel.app/api/${encodeURIComponent(text)}`);
      const d = await res.json();
      if (!d?.lyrics) return reply('❌ No lyrics found for: ' + text);
      const preview = d.lyrics.slice(0, 800) + (d.lyrics.length > 800 ? '\n\n_(truncated)_' : '');
      await reply(`🎵 *${d.title}* — ${d.artist}\n\n${preview}`);
    } catch {
      await reply('❌ Lyrics service unavailable');
    }
  },
};

// ── .crypto ────────────────────────────────────────
export const cryptoCmd = {
  command: ['crypto', 'price', 'coin'],
  desc: 'Get crypto price — .crypto bitcoin',
  run: async ({ args, reply }) => {
    const coin = args[0]?.toLowerCase() || 'bitcoin';
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd,kes&include_24hr_change=true`
      );
      const d = await res.json();
      const c = d[coin];
      if (!c) return reply(`❌ Coin not found: ${coin}`);
      await reply(
`💰 *${coin.toUpperCase()}*

💵 USD  : $${c.usd?.toLocaleString()}
🇰🇪 KES  : KSh ${c.kes?.toLocaleString()}
📈 24h  : ${c.usd_24h_change?.toFixed(2)}%`
      );
    } catch {
      await reply('❌ Crypto price fetch failed');
    }
  },
};

// ── .news ──────────────────────────────────────────
export const newsCmd = {
  command: 'news',
  desc: 'Get latest news headlines',
  run: async ({ args, reply }) => {
    const topic = args.join(' ') || 'technology';
    try {
      const res = await fetch(
        `https://gnews.io/api/v4/search?q=${encodeURIComponent(topic)}&lang=en&max=5&apikey=demo`
      );
      const d = await res.json();
      if (!d.articles?.length) return reply('❌ No news found for: ' + topic);
      let text = `📰 *News: ${topic}*\n\n`;
      d.articles.slice(0, 5).forEach((a, i) => {
        text += `${i + 1}. *${a.title}*\n   🔗 ${a.url}\n\n`;
      });
      await reply(text);
    } catch {
      await reply('❌ News service unavailable');
    }
  },
};

// ── .currency ──────────────────────────────────────
export const currencyCmd = {
  command: ['currency', 'fx', 'convert'],
  desc: 'Convert currency — .currency 100 USD KES',
  run: async ({ args, reply }) => {
    const [amount, from, to] = args;
    if (!amount || !from || !to)
      return reply('Usage: .currency <amount> <FROM> <TO>\nExample: .currency 100 USD KES');
    try {
      const res = await fetch(
        `https://api.frankfurter.app/latest?amount=${amount}&from=${from.toUpperCase()}&to=${to.toUpperCase()}`
      );
      const d = await res.json();
      const result = d.rates?.[to.toUpperCase()];
      if (!result) return reply('❌ Invalid currency pair');
      await reply(`💱 *Currency Converter*\n\n${amount} ${from.toUpperCase()} = *${result.toFixed(2)} ${to.toUpperCase()}*`);
    } catch {
      await reply('❌ Currency API unavailable');
    }
  },
};

// ── .github ────────────────────────────────────────
export const githubCmd = {
  command: 'github',
  desc: 'Get GitHub user or repo info',
  run: async ({ args, reply }) => {
    const input = args[0];
    if (!input) return reply('Usage: .github <username> or .github <user/repo>');
    try {
      const isRepo = input.includes('/');
      const url = isRepo
        ? `https://api.github.com/repos/${input}`
        : `https://api.github.com/users/${input}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'RIOT-MD' } });
      const d = await res.json();
      if (d.message) return reply('❌ Not found: ' + input);
      if (isRepo) {
        await reply(
`📦 *${d.full_name}*

📝 ${d.description || 'No description'}
⭐ Stars  : ${d.stargazers_count}
🍴 Forks  : ${d.forks_count}
🐛 Issues : ${d.open_issues_count}
🌐 URL    : ${d.html_url}`
        );
      } else {
        await reply(
`👤 *${d.name || d.login}* (@${d.login})

📝 ${d.bio || 'No bio'}
👥 Followers : ${d.followers}
📦 Repos     : ${d.public_repos}
🌐 URL       : ${d.html_url}`
        );
      }
    } catch {
      await reply('❌ GitHub API error');
    }
  },
};

// ── .paste ─────────────────────────────────────────
export const pasteCmd = {
  command: 'paste',
  desc: 'Upload text to pastebin — returns link',
  run: async ({ text, reply }) => {
    if (!text) return reply('Usage: .paste <text>');
    try {
      const res = await fetch('https://api.rentry.co/api/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded',
                   'Referer': 'https://rentry.co' },
        body: new URLSearchParams({ text }),
      });
      const d = await res.json();
      await reply(`📋 *Paste created!*\n🔗 ${d.url}`);
    } catch {
      await reply('❌ Paste service unavailable');
    }
  },
};

// ── .color ─────────────────────────────────────────
export const colorCmd = {
  command: 'color',
  desc: 'Convert / get info about a color — .color #ff5733',
  run: async ({ args, reply }) => {
    const hex = (args[0] || '').replace('#', '');
    if (!hex) return reply('Usage: .color <hex>  e.g. .color #ff5733');
    try {
      const res = await fetch(`https://www.thecolorapi.com/id?hex=${hex}`);
      const d = await res.json();
      await reply(
`🎨 *Color: ${d.name?.value || hex}*

#️⃣  HEX : #${hex.toUpperCase()}
🔴 RGB : ${d.rgb?.value}
🌈 HSL : ${d.hsl?.value}
👁️ Name: ${d.name?.value}`
      );
    } catch {
      await reply('❌ Color API failed');
    }
  },
};

// ── .random ────────────────────────────────────────
export const randomCmd = {
  command: ['random', 'rand'],
  desc: 'Random number — .random 1 100',
  run: async ({ args, reply }) => {
    const min = parseInt(args[0]) || 1;
    const max = parseInt(args[1]) || 100;
    if (min >= max) return reply('Min must be less than max');
    const n = Math.floor(Math.random() * (max - min + 1)) + min;
    await reply(`🎲 Random number between *${min}* and *${max}*: *${n}*`);
  },
};

// ── .remind ────────────────────────────────────────
export const remindCmd = {
  command: 'remind',
  desc: 'Set a reminder — .remind 5 Drink water',
  run: async ({ args, sock, jid, senderNumber, reply }) => {
    const minutes = parseInt(args[0]);
    const message = args.slice(1).join(' ');
    if (!minutes || !message) return reply('Usage: .remind <minutes> <message>\nExample: .remind 5 Drink water');
    await reply(`⏰ Reminder set for *${minutes} minute(s)*: _${message}_`);
    setTimeout(async () => {
      await sock.sendMessage(jid, {
        text: `⏰ *REMINDER*\n\n${message}`,
      }).catch(() => {});
    }, minutes * 60 * 1000);
  },
};

// ── .poll ──────────────────────────────────────────
export const pollCmd = {
  command: 'poll',
  desc: 'Create a WhatsApp poll — .poll Question | Option1 | Option2',
  group: true,
  run: async ({ sock, jid, text, msg, reply }) => {
    if (!text?.includes('|')) return reply('Usage: .poll Question | Option1 | Option2 | ...');
    const parts  = text.split('|').map(s => s.trim());
    const name   = parts[0];
    const values = parts.slice(1);
    if (values.length < 2) return reply('Need at least 2 options');
    await sock.sendMessage(jid, {
      poll: { name, values, selectableCount: 1 },
    });
  },
};
