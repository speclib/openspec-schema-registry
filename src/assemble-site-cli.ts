/**
 * `npm run assemble-site` over the repository.
 *
 * This is the second half of the publication build: `npm run validate` runs first
 * and a non-zero exit there stops the build before anything is assembled, which is
 * how an invalid registry is kept off the canonical address.
 */

import { relative, resolve } from 'node:path';
import { assembleSite, PublishError } from './core/publish.js';

export function runAssembleSite(argv: string[], log: (line: string) => void): number {
  const target = resolve(argv[0] ?? 'site');
  const nearby = relative(process.cwd(), target);
  const shown = nearby !== '' && !nearby.startsWith('..') ? nearby : target;

  let published;
  try {
    published = assembleSite(target);
  } catch (cause) {
    log(cause instanceof PublishError ? cause.message : `${shown}: ${(cause as Error).message}`);
    return 1;
  }

  for (const path of published) {
    log(`${shown}/${path}`);
  }
  return 0;
}
