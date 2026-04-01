import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { availableParallelism } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKER_PATH = join(__dirname, '..', 'worker-entry.mjs');

export function findSalt(userId, criteria, { onProgress, parallel = false } = {}) {
  const numWorkers = parallel ? Math.max(1, availableParallelism() - 1) : 1;

  return new Promise((resolve, reject) => {
    const workers = [];
    let totalAttempts = 0;
    let resolved = false;

    for (let i = 0; i < numWorkers; i++) {
      const worker = new Worker(WORKER_PATH, {
        workerData: { userId, criteria },
      });

      worker.on('message', (msg) => {
        if (resolved) return;

        if (msg.type === 'found') {
          resolved = true;
          for (const w of workers) {
            if (w !== worker) w.terminate();
          }
          resolve({ salt: msg.salt, attempts: msg.attempts, elapsed: msg.elapsed });
        }

        if (msg.type === 'progress' && onProgress) {
          totalAttempts += 25000;
          onProgress({ attempts: totalAttempts, elapsed: msg.elapsed });
        }
      });

      worker.on('error', (err) => {
        if (!resolved) reject(err);
      });

      workers.push(worker);
    }
  });
}
