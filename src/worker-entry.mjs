import { parentPort, workerData } from 'node:worker_threads';
import { rollPet } from './core/pet.mjs';
import { randomSalt, matchesCriteria } from './core/salt.mjs';

const { userId, criteria } = workerData;
let attempts = 0;
const start = Date.now();

while (true) {
  attempts++;
  const salt = randomSalt();
  const pet = rollPet(userId, salt);

  if (matchesCriteria(pet, criteria)) {
    parentPort.postMessage({
      type: 'found',
      salt,
      attempts,
      elapsed: Date.now() - start,
    });
    process.exit(0);
  }

  if (attempts % 25000 === 0) {
    parentPort.postMessage({
      type: 'progress',
      attempts,
      elapsed: Date.now() - start,
    });
  }
}
