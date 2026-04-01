import chalk from 'chalk';
import { ORIGINAL_SALT } from '../core/constants.mjs';
import { rollPet } from '../core/pet.mjs';
import { getClaudeUserId } from '../system/claude-config.mjs';
import { loadConfig } from '../system/config.mjs';
import { showPet } from '../ui/sprites.mjs';

export function runCurrent() {
  const userId = getClaudeUserId();

  const defaultPet = rollPet(userId, ORIGINAL_SALT);
  showPet(defaultPet, 'Your default pet (original salt)');

  const config = loadConfig();
  if (config?.salt && config.salt !== ORIGINAL_SALT) {
    const patchedPet = rollPet(userId, config.salt);
    showPet(patchedPet, 'Your active patched pet');
  } else {
    console.log(chalk.dim('  No custom pet applied.\n'));
  }
}
