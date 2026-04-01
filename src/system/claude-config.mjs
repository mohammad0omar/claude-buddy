import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

export function getClaudeUserId() {
  const paths = [
    join(homedir(), '.claude.json'),
    join(homedir(), '.claude', '.config.json'),
  ];

  for (const p of paths) {
    if (!existsSync(p)) continue;
    try {
      const config = JSON.parse(readFileSync(p, 'utf-8'));
      const id = config.oauthAccount?.accountUuid ?? config.userID;
      if (id) return id;
    } catch {
      continue;
    }
  }
  return 'anon';
}

export function getClaudeConfigPath() {
  const paths = [
    join(homedir(), '.claude.json'),
    join(homedir(), '.claude', '.config.json'),
  ];
  for (const p of paths) {
    if (existsSync(p)) return p;
  }
  return null;
}

export function getCompanionInfo() {
  const configPath = getClaudeConfigPath();
  if (!configPath) return null;
  try {
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    return config.companion ?? null;
  } catch {
    return null;
  }
}

export function setCompanionField(field, value) {
  const configPath = getClaudeConfigPath();
  if (!configPath) throw new Error('Claude config not found');
  const config = JSON.parse(readFileSync(configPath, 'utf-8'));
  if (!config.companion) config.companion = {};
  const updated = { ...config, companion: { ...config.companion, [field]: value } };
  writeFileSync(configPath, JSON.stringify(updated, null, 2) + '\n', { mode: 0o600 });
}
