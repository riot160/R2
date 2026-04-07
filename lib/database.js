// ═══════════════════════════════════════════════════
//  RIOT MD - DATABASE  (JSON flat-file + MongoDB opt)
// ═══════════════════════════════════════════════════

import fs from 'fs-extra';
import path from 'path';
import { config } from '../config.js';

let _mongo = null;   // Mongoose connection (optional)

// ──────────────────────────────────────────────────
//  JSON flat-file store
// ──────────────────────────────────────────────────
class JSONStore {
  constructor(filePath) {
    this.file = filePath;
    this._data = null;
  }

  async _load() {
    if (this._data) return;
    await fs.ensureFile(this.file);
    const raw = await fs.readFile(this.file, 'utf-8').catch(() => '{}');
    try { this._data = JSON.parse(raw); } catch { this._data = {}; }
  }

  async _save() {
    await fs.outputFile(this.file, JSON.stringify(this._data, null, 2));
  }

  async get(key) {
    await this._load();
    return this._data[key] ?? null;
  }

  async set(key, value) {
    await this._load();
    this._data[key] = value;
    await this._save();
    return value;
  }

  async del(key) {
    await this._load();
    delete this._data[key];
    await this._save();
  }

  async all() {
    await this._load();
    return { ...this._data };
  }
}

const store = new JSONStore(config.DB_PATH);

// ──────────────────────────────────────────────────
//  Public API
// ──────────────────────────────────────────────────
export async function dbGet(key)        { return store.get(key); }
export async function dbSet(key, value) { return store.set(key, value); }
export async function dbDel(key)        { return store.del(key); }
export async function dbAll()           { return store.all(); }

// ── User helpers ──
export async function getUser(number) {
  return (await dbGet(`user:${number}`)) || {
    number, premium: false, banned: false, warns: 0,
    commandsUsed: 0, joinedAt: Date.now(),
  };
}

export async function saveUser(number, data) {
  return dbSet(`user:${number}`, data);
}

// ── Group helpers ──
export async function getGroup(jid) {
  return (await dbGet(`group:${jid}`)) || {
    jid, antilink: false, antibadword: false,
    welcome: false, welcomeMsg: 'Welcome, @user!',
    goodbye: false, goodbyeMsg: 'Goodbye, @user!',
  };
}

export async function saveGroup(jid, data) {
  return dbSet(`group:${jid}`, data);
}

// ── Connect (optional Mongoose) ──
export async function connectDB() {
  if (!config.MONGO_URI) {
    console.log('  🗄️   Using JSON database (no MONGO_URI set)');
    return;
  }
  try {
    const mongoose = await import('mongoose');
    _mongo = await mongoose.default.connect(config.MONGO_URI);
    console.log('  🗄️   MongoDB connected');
  } catch (e) {
    console.warn('  ⚠️   MongoDB failed, falling back to JSON:', e.message);
  }
}
