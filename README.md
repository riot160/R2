# ⚡ RIOT MD — Multi-User WhatsApp Bot Platform

```
██████╗ ██╗ ██████╗ ████████╗    ███╗   ███╗██████╗
██╔══██╗██║██╔═══██╗╚══██╔══╝    ████╗ ████║██╔══██╗
██████╔╝██║██║   ██║   ██║       ██╔████╔██║██║  ██║
██╔══██╗██║██║   ██║   ██║       ██║╚██╔╝██║██║  ██║
██║  ██║██║╚██████╔╝   ██║       ██║ ╚═╝ ██║██████╔╝
╚═╝  ╚═╝╚═╝ ╚═════╝    ╚═╝       ╚═╝     ╚═╝╚═════╝
```

**Version:** v1.0.0 | **Developer:** Sydney Sider | **Node.js:** v20+

---

## 📋 Features

| Feature | Status |
|---|---|
| Multi-user pairing code login | ✅ |
| Dynamic plugin loader | ✅ |
| Dark web dashboard + live logs | ✅ |
| REST API + JWT auth | ✅ |
| MongoDB + JSON DB fallback | ✅ |
| Docker / Railway / Render deploy | ✅ |
| 60+ commands across 6 categories | ✅ |
| PM2 + auto-restart | ✅ |

---

## 🚀 Quick Start

### Prerequisites
- Node.js v20.18+
- npm v10+
- (optional) yt-dlp for download commands

### 1. Clone & Install
```bash
git clone https://github.com/your-username/riot-md.git
cd riot-md
npm install
```

### 2. Configure
```bash
cp .env.example .env
nano .env   # Set OWNER_NUMBER, DASHBOARD_PASS, etc.
```

### 3. Start
```bash
node index.js
```

The console will show the ASCII banner and a **pairing instructions** block:
```
══════════════ PAIR YOUR DEVICE ══════════════
  POST /api/login          → get JWT token
  POST /api/pair           → generate pairing code
  Body: { "phoneNumber": "+254XXXXXXXXX", "userId": "user1" }
  Or use the web dashboard to pair visually.
═══════════════════════════════════════════════
```

---

## 📱 Pairing Your WhatsApp

### Option A — Web Dashboard (Recommended)
1. Open `http://localhost:3000` in your browser
2. Log in with your `DASHBOARD_PASS`
3. Go to **Pair Device**
4. Enter a User ID and your phone number
5. Copy the 8-character code
6. On your phone: **WhatsApp → Settings → Linked Devices → Link with Phone Number**
7. Enter the code — you're connected!

### Option B — API (curl)
```bash
# Step 1: Get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"password":"riotmd2024"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Step 2: Request pairing code
curl -X POST http://localhost:3000/api/pair \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"phoneNumber":"+254700000000","userId":"user1"}'
```

---

## 🌐 Dashboard Pages

| Page | URL | Description |
|---|---|---|
| Overview | `/` | Stats, session counts, uptime |
| Pair Device | `/#pair` | Generate pairing codes |
| Sessions | `/#sessions` | Manage active sessions |
| Plugins | `/#plugins` | View all loaded commands |
| Logs | `/#logs` | Live real-time log stream |

---

## 🔌 REST API Reference

All protected endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/login` | Authenticate, get JWT token |
| POST | `/api/pair` | Start session + get pairing code |
| GET | `/api/sessions` | List all sessions |
| DELETE | `/api/sessions/:userId` | Delete a session |
| GET | `/api/status` | Bot status (public) |
| POST | `/api/send` | Send a message via a session |
| GET | `/api/plugins` | List all plugins |
| GET | `/api/users` | List all DB users |
| GET | `/api/logs` | Get log buffer |

---

## 🧩 Plugin System

Plugins are auto-loaded from `plugins/<category>/`.

### Plugin Structure
```js
// plugins/tools/myplugin.js
export const myCmd = {
  command: ['hello', 'hi'],        // command name(s)
  desc: 'Say hello',               // shown in .menu
  owner: false,                    // owner-only?
  group: false,                    // group-only?
  admin: false,                    // admin-only?

  run: async ({ reply, text, sock, jid, msg,
                senderNumber, isOwner, args }) => {
    await reply(`Hello! You said: ${text}`);
  },
};
```

### Context object available in `run(ctx)`:

| Property | Type | Description |
|---|---|---|
| `sock` | Baileys socket | Raw WhatsApp socket |
| `msg` | Object | Raw message object |
| `jid` | string | Chat JID |
| `sender` | string | Sender JID |
| `senderNumber` | string | Sender phone number |
| `isGroup` | boolean | Is this a group message? |
| `isOwner` | boolean | Is sender the bot owner? |
| `command` | string | Matched command |
| `args` | string[] | Arguments after command |
| `text` | string | Full text after command |
| `reply(content)` | fn | Send quoted reply |
| `react(emoji)` | fn | React to message |

---

## 📦 Commands Overview

### Owner `.`
`.menu` `.ping` `.info` `.setprefix` `.broadcast` `.block` `.unblock` `.reload` `.shutdown` `.ban` `.unban`

### Group
`.kick` `.promote` `.demote` `.tagall` `.groupinfo` `.antilink` `.antibadword` `.welcome` `.open` `.close` `.invite` `.warn` `.resetwarn` `.mute` `.unmute`

### AI & Utilities
`.ai` `.ask` `.chatgpt` `.image` `.translate` `.weather` `.define` `.qr`

### Fun
`.joke` `.quote` `.truth` `.dare` `.flip` `.roll` `.8ball` `.meme` `.sticker`

### Tools
`.time` `.calc` `.shortlink` `.ip` `.encode` `.decode` `.profile` `.alive` `.speed` `.tts` `.report` `.lyrics` `.crypto` `.news` `.currency` `.github` `.paste` `.color` `.random` `.remind` `.poll`

### Downloads
`.play` `.ytmp3` `.ytmp4` `.tiktok` `.instagram` `.spotify`

---

## 🐳 Docker Deployment

```bash
docker-compose up -d
```

Volumes `./sessions` and `./database` are persisted automatically.

---

## 🚂 Railway Deployment

1. Fork this repo
2. Connect to Railway → **Deploy from GitHub**
3. Add environment variables from `.env.example`
4. Railway auto-detects `railway.json` and builds the Dockerfile
5. Open the assigned URL → your dashboard is live

---

## 🎨 Render Deployment

1. New Web Service → Docker
2. Point to your repo
3. Set environment variables
4. Add a **Disk** mount at `/app/sessions` (5 GB)
5. Deploy

---

## 🖥️ VPS with PM2

```bash
npm install -g pm2
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

---

## 📁 Project Structure

```
RIOT-MD/
├── index.js                ← Entry point + banner
├── server.js               ← Express + Socket.io + REST API
├── config.js               ← All configuration
├── package.json
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── railway.json
├── render.yaml
├── ecosystem.config.cjs    ← PM2 config
│
├── lib/
│   ├── session.js          ← Baileys session manager
│   ├── handler.js          ← Message router
│   ├── commands.js         ← Plugin loader & cooldowns
│   └── database.js         ← JSON/MongoDB store
│
├── plugins/
│   ├── owner/              ← Bot admin commands
│   ├── group/              ← Group management
│   ├── ai/                 ← AI, weather, translate
│   ├── fun/                ← Games, jokes, memes
│   ├── tools/              ← Utilities
│   └── download/           ← Media downloaders
│
├── dashboard/
│   └── public/
│       └── index.html      ← Dark hacker dashboard UI
│
├── sessions/               ← Per-user Baileys auth (gitignored)
└── database/               ← JSON flat-file DB (gitignored)
```

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|---|---|---|
| `BOT_NAME` | RIOT MD | Bot display name |
| `OWNER_NUMBER` | 254700000000 | Owner phone (no +) |
| `PREFIX` | `.` | Command prefix |
| `MODE` | `public` | `public` or `private` |
| `DASHBOARD_PASS` | riotmd2024 | Dashboard login password |
| `API_SECRET` | _(change this)_ | JWT signing secret |
| `PORT` | 3000 | Web server port |
| `MONGO_URI` | _(blank)_ | MongoDB URI (optional) |
| `AUTO_READ` | true | Auto-read messages |
| `AUTO_TYPING` | true | Show typing indicator |
| `CMD_COOLDOWN` | 3000 | Cooldown between commands (ms) |

---

## 🛡️ Security Notes

- Change `DASHBOARD_PASS` and `API_SECRET` before deploying
- Keep your `.env` file out of version control (`.gitignore` handles this)
- The `sessions/` folder contains your WhatsApp auth — back it up
- Rate limiting is active on all `/api/` routes (200 req / 15 min)

---

## 👨‍💻 Developer

**Sydney Sider** — RIOT MD v1.0.0

---

## 📄 License

MIT — free to use, modify, and distribute.
