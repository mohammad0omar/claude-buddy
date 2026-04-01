import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { rollPet, rollPetFromSeed } from '../src/core/pet.mjs';
import { SPECIES, RARITIES, EYES, HATS, STAT_NAMES } from '../src/core/constants.mjs';

describe('rollPetFromSeed', () => {
  it('returns a valid pet structure', () => {
    const pet = rollPetFromSeed(12345);
    assert.ok(RARITIES.includes(pet.rarity));
    assert.ok(SPECIES.includes(pet.species));
    assert.ok(EYES.includes(pet.eye));
    assert.ok(HATS.includes(pet.hat));
    assert.equal(typeof pet.shiny, 'boolean');
    assert.equal(typeof pet.inspirationSeed, 'number');
    for (const stat of STAT_NAMES) {
      assert.ok(pet.stats[stat] >= 1 && pet.stats[stat] <= 100, `${stat} = ${pet.stats[stat]}`);
    }
  });

  it('is deterministic', () => {
    const a = rollPetFromSeed(42);
    const b = rollPetFromSeed(42);
    assert.deepStrictEqual(a, b);
  });

  it('common rarity always has hat = none', () => {
    for (let seed = 0; seed < 10000; seed++) {
      const pet = rollPetFromSeed(seed);
      if (pet.rarity === 'common') {
        assert.equal(pet.hat, 'none');
        return;
      }
    }
    assert.fail('Could not find a common pet in 10000 seeds');
  });

  it('stats have correct peak/dump structure', () => {
    const pet = rollPetFromSeed(99);
    const values = Object.values(pet.stats);
    const max = Math.max(...values);
    const min = Math.min(...values);
    assert.ok(max > min, 'peak should be higher than dump');
  });
});

describe('rollPet', () => {
  it('generates pet from userId + salt via wyhash', () => {
    const pet = rollPet('test-user-id', 'friend-2026-401');
    assert.ok(SPECIES.includes(pet.species));
    assert.ok(RARITIES.includes(pet.rarity));
  });

  it('is deterministic for same userId + salt', () => {
    const a = rollPet('user-123', 'abcdefghijklmno');
    const b = rollPet('user-123', 'abcdefghijklmno');
    assert.deepStrictEqual(a, b);
  });

  it('differs for different salts', () => {
    const a = rollPet('user-123', 'salt-aaaaaaaaa01');
    const b = rollPet('user-123', 'salt-bbbbbbbbb02');
    const same = a.species === b.species && a.rarity === b.rarity
      && a.eye === b.eye && a.hat === b.hat;
    assert.ok(!same, 'different salts should produce different pets');
  });
});
