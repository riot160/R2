// ═══════════════════════════════════════════════════
//  RIOT MD - CONFIGURATION
//  Developer: Sydney Sider
//  Node.js v20 | ES Modules
// ═══════════════════════════════════════════════════

import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

export const config = {
  // ── Bot Identity ──────────────────────────────────
  BOT_NAME:    process.env.BOT_NAME    || 'RIOT MD',
  BOT_VERSION: process.env.BOT_VERSION || 'v1.0.0',
  DEVELOPER:   process.env.DEVELOPER   || 'Sydney Sider',
  PREFIX:      process.env.PREFIX      || '.',
  MODE:        process.env.MODE        || 'public',   // public | private

  // ── Owner ─────────────────────────────────────────
  OWNER_NUMBER: (process.env.OWNER_NUMBER || '254700000000').replace(/[^0-9]/g, ''),
  OWNER_NAME:   process.env.OWNER_NAME   || 'Sydney',

  // ── Server ────────────────────────────────────────
  PORT:           parseInt(process.env.PORT || '3000'),
  API_SECRET:     process.env.API_SECRET     || 'riot-md-secret-key-change-this',
  DASHBOARD_PASS: process.env.DASHBOARD_PASS || 'riotmd2024',

  // ── Database ──────────────────────────────────────
  MONGO_URI: process.env.MONGO_URI || '',   // leave blank → JSON fallback
  DB_PATH:   process.env.DB_PATH   || './database/db.json',

  // ── Sessions ──────────────────────────────────────
  SESSION_DIR:  process.env.SESSION_DIR  || './sessions',
  MAX_SESSIONS: parseInt(process.env.MAX_SESSIONS || '1000'),

  // ── Features ──────────────────────────────────────
  AUTO_READ:       process.env.AUTO_READ       !== 'false',
  AUTO_TYPING:     process.env.AUTO_TYPING     !== 'false',
  ANTI_CALL:       process.env.ANTI_CALL       === 'true',
  SEND_READ:       process.env.SEND_READ       !== 'false',
  LOG_LEVEL:       process.env.LOG_LEVEL       || 'info',

  // ── Cooldowns (ms) ────────────────────────────────
  CMD_COOLDOWN:     parseInt(process.env.CMD_COOLDOWN     || '3000'),
  PAIR_CODE_EXPIRY: parseInt(process.env.PAIR_CODE_EXPIRY || '120000'),
};

export default config;
