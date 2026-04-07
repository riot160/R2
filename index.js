// ═══════════════════════════════════════════════════
//  RIOT MD  ·  index.js  ·  Node.js v20 ES Modules
//  Developer : Sydney Sider
// ═══════════════════════════════════════════════════

import chalk from 'chalk';
import { config } from './config.js';
import { connectDB } from './lib/database.js';
import { loadPlugins } from './lib/commands.js';
import { restoreAllSessions } from './lib/session.js';
import { startServer } from './server.js';

// ── Node version guard ────────────────────────────
const [major] = process.versions.node.split('.').map(Number);
if (major < 20) {
  console.error(chalk.red(`\n  ✖  RIOT MD requires Node.js v20+. You are on v${process.version}\n`));
  process.exit(1);
}

// ──────────────────────────────────────────────────
//  ASCII Banner
// ──────────────────────────────────────────────────
function printBanner() {
  const c = chalk;
  console.clear();
  console.log(c.cyan(`
  ██████╗ ██╗ ██████╗ ████████╗    ███╗   ███╗██████╗
  ██╔══██╗██║██╔═══██╗╚══██╔══╝    ████╗ ████║██╔══██╗
  ██████╔╝██║██║   ██║   ██║       ██╔████╔██║██║  ██║
  ██╔══██╗██║██║   ██║   ██║       ██║╚██╔╝██║██║  ██║
  ██║  ██║██║╚██████╔╝   ██║       ██║ ╚═╝ ██║██████╔╝
  ╚═╝  ╚═╝╚═╝ ╚═════╝    ╚═╝       ╚═╝     ╚═╝╚═════╝
  `));
  console.log(c.bold.white('  ════════════════════════════════════════════════'));
  console.log(c.yellow(`  🤖  Bot Name  : ${config.BOT_NAME}`));
  console.log(c.yellow(`  🏷️   Version   : ${config.BOT_VERSION}`));
  console.log(c.yellow(`  👤  Developer : ${config.DEVELOPER}`));
  console.log(c.yellow(`  ⚙️   Mode       : ${config.MODE}`));
  console.log(c.yellow(`  🔑  Prefix     : ${config.PREFIX}`));
  console.log(c.yellow(`  🟢  Node.js    : ${process.version}`));
  console.log(c.bold.white('  ════════════════════════════════════════════════\n'));
}

// ──────────────────────────────────────────────────
//  Boot sequence
// ──────────────────────────────────────────────────
async function boot() {
  printBanner();

  // 1. Database
  process.stdout.write(chalk.cyan('  [1/4] Connecting database...'));
  await connectDB();
  console.log(chalk.green(' ✔'));

  // 2. Plugins
  process.stdout.write(chalk.cyan('  [2/4] Loading plugins...'));
  const pluginCount = await loadPlugins('./plugins');
  console.log(chalk.green(` ✔  (${pluginCount} commands)`));

  // 3. Web server
  process.stdout.write(chalk.cyan('  [3/4] Starting web server...'));
  await startServer();
  console.log(chalk.green(` ✔  (port ${config.PORT})`));

  // 4. Restore saved sessions
  process.stdout.write(chalk.cyan('  [4/4] Restoring sessions...'));
  const restored = await restoreAllSessions();
  console.log(chalk.green(` ✔  (${restored} session(s) restored)\n`));

  // ── Ready banner ──
  console.log(chalk.bold.green('  ✅  RIOT MD is online!\n'));
  console.log(chalk.white(`  🌐  Dashboard : http://localhost:${config.PORT}`));
  console.log(chalk.white(`  📡  API Base  : http://localhost:${config.PORT}/api\n`));

  // ── Pairing helper printed to console ──
  console.log(chalk.bold.cyan('  ══════════════ PAIR YOUR DEVICE ══════════════'));
  console.log(chalk.white('  POST /api/login          → get JWT token'));
  console.log(chalk.white('  POST /api/pair           → generate pairing code'));
  console.log(chalk.white('  Body: { "phoneNumber": "+254XXXXXXXXX", "userId": "user1" }'));
  console.log(chalk.white('  Or use the web dashboard to pair visually.'));
  console.log(chalk.bold.cyan('  ═══════════════════════════════════════════════\n'));
}

// ──────────────────────────────────────────────────
//  Graceful shutdown
// ──────────────────────────────────────────────────
process.on('SIGINT',  () => { console.log(chalk.red('\n  🛑  RIOT MD shutting down...')); process.exit(0); });
process.on('SIGTERM', () => { console.log(chalk.red('\n  🛑  RIOT MD shutting down...')); process.exit(0); });
process.on('uncaughtException',  (e) => console.error(chalk.red('  ❌  Uncaught:'), e.message));
process.on('unhandledRejection', (e) => console.error(chalk.red('  ❌  Unhandled rejection:'), e));

boot();
