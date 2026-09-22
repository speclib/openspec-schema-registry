/**
 * `npm run validate` over the registry file.
 *
 * Exits 0 when the file is legal and 1 when it is not, printing every problem
 * grouped by the entry it belongs to. Offline by design: it runs inside the
 * sandboxed gate, and a contributor can check an entry before pushing it.
 */

import { relative, resolve } from 'node:path';
import { formatProblems } from './core/problem.js';
import { validateRegistry } from './core/validate.js';
import { RegistryLoadError } from './core/registry.js';

export function runValidate(argv: string[], log: (line: string) => void): number {
  const target = resolve(argv[0] ?? 'openspec-schemas.json');
  const nearby = relative(process.cwd(), target);
  const shown = nearby !== '' && !nearby.startsWith('..') ? nearby : target;

  let problems;
  try {
    problems = validateRegistry(target);
  } catch (cause) {
    log(cause instanceof RegistryLoadError ? cause.message : `${shown}: ${(cause as Error).message}`);
    return 1;
  }

  if (problems.length === 0) {
    log(`${shown} is valid.`);
    return 0;
  }

  log(formatProblems(problems, shown));
  return 1;
}
