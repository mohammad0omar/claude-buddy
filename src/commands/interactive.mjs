import chalk from 'chalk';
import { ORIGINAL_SALT } from '../core/constants.mjs';
import { rollPet } from '../core/pet.mjs';
import { estimateAttempts } from '../core/salt.mjs';
import { getClaudeUserId } from '../system/claude-config.mjs';
import { findClaudeBinary, findSaltInBinary, patchBinary } from '../system/binary.mjs';
import { loadConfig, saveConfig } from '../system/config.mjs';
import { findSalt } from '../system/worker.mjs';
import { isHookInstalled, installHook } from '../system/hooks.mjs';
import { showPet } from '../ui/sprites.mjs';
import { updateProgress, clearProgress } from '../ui/progress.mjs';
import {
  selectSpecies, selectRarity, selectEye, selectHat,
  selectStat, confirmAction,
} from '../ui/prompts.mjs';

export async function runInteractive(flags) {
  const binaryPath = findClaudeBinary();
  const userId = getClaudeUserId();
  console.log(chalk.dim(`Binary: ${binaryPath}`));
  console.log(chalk.dim(`User: ${userId === 'anon' ? 'anonymous' : userId.slice(0, 8) + '...'}`));

  const defaultPet = rollPet(userId, ORIGINAL_SALT);
  showPet(defaultPet, 'Your default pet');

  const config = loadConfig();
  if (config?.salt && config.salt !== ORIGINAL_SALT) {
    const patchedPet = rollPet(userId, config.salt);
    showPet(patchedPet, 'Your active patched pet');
  }

  const species = flags.species ?? await selectSpecies();
  const eye = flags.eye ?? await selectEye();
  const rarity = flags.rarity ?? await selectRarity();
  const hat = rarity === 'common' ? 'none' : (flags.hat ?? await selectHat());
  const shiny = flags.shiny ?? await confirmAction('Require shiny? (much longer search)', false);

  let peak = flags.peak ?? null;
  let dump = flags.dump ?? null;
  if (!peak && !dump) {
    const wantStats = await confirmAction('Customize stats (peak/dump)?', false);
    if (wantStats) {
      peak = await selectStat('Best stat:');
      dump = await selectStat('Worst stat:', peak);
    }
  }

  const criteria = { species, rarity, eye, hat, shiny, peak, dump };

  showPet({ ...criteria, stats: null, inspirationSeed: 0 }, 'Your selection');

  const proceed = flags.yes ?? await confirmAction('Find a matching salt and apply?');
  if (!proceed) {
    console.log(chalk.dim('Cancelled.'));
    return;
  }

  const expected = estimateAttempts(criteria);
  console.log(chalk.dim(`\nSearching (estimated ~${expected} attempts)...`));

  const result = await findSalt(userId, criteria, {
    parallel: shiny,
    onProgress: (p) => updateProgress(p.attempts, expected, p.elapsed),
  });
  clearProgress();

  console.log(chalk.green(`\nFound in ${result.attempts} attempts (${result.elapsed}ms)`));

  const newPet = rollPet(userId, result.salt);
  showPet(newPet, 'Your new pet');

  const { salt: currentSalt } = findSaltInBinary(binaryPath);
  const oldSalt = currentSalt ?? config?.salt ?? ORIGINAL_SALT;
  const patchResult = patchBinary(binaryPath, oldSalt, result.salt);

  if (patchResult.verified) {
    console.log(chalk.green(`Patched ${patchResult.replacements} occurrences`));
  } else {
    console.log(chalk.red('Patch verification failed — restoring backup'));
    return;
  }

  if (patchResult.codesigned) {
    console.log(chalk.dim('Re-signed binary (macOS)'));
  } else if (patchResult.codesignError) {
    console.log(chalk.yellow(`Codesign warning: ${patchResult.codesignError}`));
  }

  saveConfig({
    salt: result.salt,
    previousSalt: oldSalt,
    species, rarity, eye, hat,
    appliedTo: binaryPath,
    appliedAt: new Date().toISOString(),
  });

  if (!flags.noHook && !isHookInstalled()) {
    const setupHook = await confirmAction('Install auto-patch hook? (re-applies after updates)', false);
    if (setupHook) {
      installHook();
      console.log(chalk.green('Hook installed'));
    }
  }

  if (flags.name) {
    const { setCompanionField } = await import('../system/claude-config.mjs');
    setCompanionField('name', flags.name);
    console.log(chalk.dim(`Renamed companion to "${flags.name}"`));
  }

  console.log(chalk.bold.green('\nDone! Launch Claude Code to see your new companion.'));
}
