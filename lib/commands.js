// ═══════════════════════════════════════════════════
//  RIOT MD - PLUGIN LOADER & COMMAND REGISTRY
// ═══════════════════════════════════════════════════

import fs from 'fs-extra';
import path from 'path';
import { pathToFileURL } from 'url';
import { config } from '../config.js';

export const commands   = new Map();   // command name → plugin object
export const cooldowns  = new Map();   // userId:command → timestamp
export const pluginList = [];          // metadata for dashboard

// ──────────────────────────────────────────────────
//  Load all plugins from ./plugins/**
// ──────────────────────────────────────────────────
export async function loadPlugins(dir = './plugins') {
  commands.clear();
  pluginList.length = 0;

  const categories = await fs.readdir(dir).catch(() => []);
  let loaded = 0;

  for (const cat of categories) {
    const catPath = path.join(dir, cat);
    const stat    = await fs.stat(catPath).catch(() => null);
    if (!stat?.isDirectory()) continue;

    const files = (await fs.readdir(catPath)).filter(f => f.endsWith('.js'));

    for (const file of files) {
      const fullPath = path.resolve(catPath, file);
      try {
        const mod = await import(pathToFileURL(fullPath).href + `?t=${Date.now()}`);
        const plugin = mod.default || mod;

        if (!plugin?.command) continue;

        const cmds = Array.isArray(plugin.command) ? plugin.command : [plugin.command];
        for (const cmd of cmds) {
          commands.set(cmd.toLowerCase(), { ...plugin, category: cat });
        }

        pluginList.push({
          command:  cmds[0],
          aliases:  cmds.slice(1),
          desc:     plugin.desc     || 'No description',
          category: cat,
          owner:    plugin.owner    || false,
          admin:    plugin.admin    || false,
          group:    plugin.group    || false,
          enabled:  plugin.enabled  !== false,
        });

        loaded++;
      } catch (e) {
        console.error(`  ⚠️  Plugin load error [${file}]:`, e.message);
      }
    }
  }

  console.log(`  📦  Loaded ${loaded} plugins across ${categories.length} categories`);
  return loaded;
}

// ──────────────────────────────────────────────────
//  Check / set cooldown
// ──────────────────────────────────────────────────
export function checkCooldown(userId, command) {
  const key  = `${userId}:${command}`;
  const last = cooldowns.get(key) || 0;
  const now  = Date.now();
  if (now - last < config.CMD_COOLDOWN) {
    return Math.ceil((config.CMD_COOLDOWN - (now - last)) / 1000);
  }
  cooldowns.set(key, now);
  return 0;
}
