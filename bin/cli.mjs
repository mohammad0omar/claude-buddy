#!/usr/bin/env node

import { SPECIES, RARITIES, EYES, HATS } from '../src/core/constants.mjs';

const args = process.argv.slice(2);
const command = args.find(a => !a.startsWith('-')) ?? 'interactive';

console.log(`claude-buddy v0.1.0`);
console.log(`Command: ${command}`);
console.log(`Species: ${SPECIES.length}, Rarities: ${RARITIES.length}, Eyes: ${EYES.length}, Hats: ${HATS.length}`);
