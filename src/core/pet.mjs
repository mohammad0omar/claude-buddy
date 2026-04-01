import { wyhash } from './wyhash.mjs';
import { mulberry32, pick, rollWeighted } from './prng.mjs';
import {
  SPECIES, RARITY_WEIGHTS, RARITY_FLOOR,
  EYES, HATS, STAT_NAMES,
} from './constants.mjs';

export function rollPetFromSeed(seed) {
  const rng = mulberry32(seed);
  return rollFromRng(rng);
}

export function rollPet(userId, salt) {
  const key = userId + salt;
  const hash = wyhash(key);
  const seed = Number(hash & 0xFFFFFFFFn);
  return rollPetFromSeed(seed);
}

function rollFromRng(rng) {
  const rarity = rollWeighted(rng, RARITY_WEIGHTS);
  const species = pick(rng, SPECIES);
  const eye = pick(rng, EYES);
  const hat = rarity === 'common' ? 'none' : pick(rng, HATS);
  const shiny = rng() < 0.01;
  const stats = rollStats(rng, rarity);
  const inspirationSeed = Math.floor(rng() * 1e9);

  return { rarity, species, eye, hat, shiny, stats, inspirationSeed };
}

function rollStats(rng, rarity) {
  const floor = RARITY_FLOOR[rarity];
  const peak = pick(rng, STAT_NAMES);
  let dump = pick(rng, STAT_NAMES);
  while (dump === peak) dump = pick(rng, STAT_NAMES);

  const stats = {};
  for (const name of STAT_NAMES) {
    if (name === peak) {
      stats[name] = Math.min(100, floor + 50 + Math.floor(rng() * 30));
    } else if (name === dump) {
      stats[name] = Math.max(1, floor - 10 + Math.floor(rng() * 15));
    } else {
      stats[name] = floor + Math.floor(rng() * 40);
    }
  }
  return stats;
}
