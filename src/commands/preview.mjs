import { rollPet } from '../core/pet.mjs';
import { getClaudeUserId } from '../system/claude-config.mjs';
import { showPet } from '../ui/sprites.mjs';
import { selectSpecies, selectRarity, selectEye, selectHat } from '../ui/prompts.mjs';

export async function runPreview(flags) {
  const userId = getClaudeUserId();

  const species = flags.species ?? await selectSpecies();
  const eye = flags.eye ?? await selectEye();
  const rarity = flags.rarity ?? await selectRarity();
  const hat = rarity === 'common' ? 'none' : (flags.hat ?? await selectHat());

  showPet(
    { species, rarity, eye, hat, shiny: false, stats: null, inspirationSeed: 0 },
    'Preview (approximate — stats determined by salt)',
  );
}
