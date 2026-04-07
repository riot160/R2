// ═══════════════════════════════════════════════════
//  RIOT MD  ·  FUN COMMANDS
// ═══════════════════════════════════════════════════
import fetch from 'node-fetch';

const TRUTH = [
  "What is your biggest fear?","Have you ever lied to a best friend?",
  "What is your most embarrassing moment?","Have you ever cheated on a test?",
  "What's the most childish thing you still do?","Have you ever stolen anything?",
  "What's your biggest secret?","Who is your secret crush?",
  "Have you ever blamed someone else for your mistake?","What's your worst habit?",
];
const DARE = [
  "Send a voice note singing a song","Change your profile picture for 24 hours",
  "Do 10 push-ups right now","Speak in rhymes for the next 5 messages",
  "Send a funny selfie","Write a love poem in 2 minutes",
  "Text your crush hello right now","Walk around for 1 minute making animal sounds",
  "Tell a joke in another language","Post 'I love carrots' as your status for 1 hour",
];
const JOKES = [
  "Why don't scientists trust atoms? Because they make up everything! 😂",
  "I told my wife she was drawing her eyebrows too high. She looked surprised.",
  "What do you call a fake noodle? An impasta!",
  "Why did the scarecrow win an award? He was outstanding in his field!",
  "I'm reading a book about anti-gravity. It's impossible to put down.",
  "Did you hear about the mathematician who's afraid of negative numbers? He'll stop at nothing to avoid them.",
  "What do you call cheese that isn't yours? Nacho cheese!",
  "Why can't you give Elsa a balloon? Because she'll let it go.",
];
const QUOTES = [
  "The secret of getting ahead is getting started. — Mark Twain",
  "Life is what happens when you're busy making other plans. — John Lennon",
  "Spread love everywhere you go. — Mother Teresa",
  "Be yourself; everyone else is already taken. — Oscar Wilde",
  "In the middle of every difficulty lies opportunity. — Albert Einstein",
  "You miss 100% of the shots you don't take. — Wayne Gretzky",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "It does not matter how slowly you go as long as you do not stop. — Confucius",
];

const rand = arr => arr[Math.floor(Math.random() * arr.length)];

export const jokeCmd = {
  command: 'joke',
  desc: 'Get a random joke',
  run: async ({ reply }) => reply(`😂 *Random Joke*\n\n${rand(JOKES)}`),
};

export const quoteCmd = {
  command: ['quote', 'inspire'],
  desc: 'Get an inspirational quote',
  run: async ({ reply }) => reply(`💭 *Quote of the Moment*\n\n_${rand(QUOTES)}_`),
};

export const truthCmd = {
  command: 'truth',
  desc: 'Get a truth question',
  run: async ({ reply }) => reply(`🙈 *TRUTH*\n\n${rand(TRUTH)}`),
};

export const dareCmd = {
  command: 'dare',
  desc: 'Get a dare challenge',
  run: async ({ reply }) => reply(`🔥 *DARE*\n\n${rand(DARE)}`),
};

export const flipCmd = {
  command: ['flip', 'coin'],
  desc: 'Flip a coin',
  run: async ({ reply }) => reply(`🪙 *Coin Flip*\n\n${Math.random() > 0.5 ? '✅ Heads' : '❌ Tails'}`),
};

export const rollCmd = {
  command: ['roll', 'dice'],
  desc: 'Roll a dice',
  run: async ({ args, reply }) => {
    const sides = parseInt(args[0]) || 6;
    const result = Math.floor(Math.random() * sides) + 1;
    reply(`🎲 Rolled a *${sides}-sided* dice: *${result}*`);
  },
};

export const eightballCmd = {
  command: ['8ball', 'magic'],
  desc: 'Ask the magic 8-ball',
  run: async ({ text, reply }) => {
    if (!text) return reply('Ask a yes/no question: .8ball <question>');
    const answers = [
      '✅ It is certain','✅ Without a doubt','✅ Yes, definitely',
      '✅ You may rely on it','⚠️ Ask again later','⚠️ Cannot predict now',
      '❌ Don\'t count on it','❌ My reply is no','❌ Very doubtful',
    ];
    reply(`🎱 *8-Ball says:*\n\n_"${text}"_\n\n*${rand(answers)}*`);
  },
};

export const memeCmd = {
  command: 'meme',
  desc: 'Get a random meme',
  run: async ({ sock, jid, msg, reply }) => {
    try {
      const res = await fetch('https://meme-api.com/gimme');
      const d = await res.json();
      await sock.sendMessage(jid,
        { image: { url: d.url }, caption: `😂 *${d.title}*` },
        { quoted: msg }
      );
    } catch {
      await reply('❌ Could not fetch meme right now.');
    }
  },
};

export const stickerCmd = {
  command: ['sticker', 'stk'],
  desc: 'Convert image/video to sticker',
  run: async ({ sock, jid, msg, reply }) => {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const type   = quoted?.imageMessage ? 'imageMessage' : quoted?.videoMessage ? 'videoMessage' : null;
    if (!type) return reply('Reply to an image or video with .sticker');
    try {
      const media = await downloadContentFromMessage(quoted[type], type.replace('Message',''));
      const buf = Buffer.concat(await Array.fromAsync(media));
      await sock.sendMessage(jid,
        { sticker: buf, mimetype: 'image/webp' },
        { quoted: msg }
      );
    } catch (e) {
      await reply('❌ Sticker error: ' + e.message);
    }
  },
};
