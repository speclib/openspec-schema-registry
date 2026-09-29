import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { runAssembleSite } from '../src/assemble-site-cli.js';

let workspace: string;

beforeEach(() => {
  workspace = mkdtempSync(join(tmpdir(), 'registry-assemble-'));
});

afterEach(() => {
  rmSync(workspace, { recursive: true, force: true });
});

function run(...argv: string[]): { code: number; output: string } {
  const lines: string[] = [];
  const code = runAssembleSite(argv, (line) => lines.push(line));
  return { code, output: lines.join('\n') };
}

describe('the assemble-site command', () => {
  it('exits zero and lists what it published', () => {
    const site = join(workspace, 'site');
    const { code, output } = run(site);

    expect(code).toBe(0);
    expect(output).toContain('api/v1/openspec-schemas.json');
    expect(output).toContain('api/v1/schema.json');
    expect(readdirSync(site).sort()).toEqual(['api', 'index.html']);
  });

  it('defaults to a site directory beside the caller', () => {
    const previous = process.cwd();
    process.chdir(workspace);
    try {
      const { code, output } = run();

      expect(code).toBe(0);
      expect(output).toContain('site/api/v1/openspec-schemas.json');
    } finally {
      process.chdir(previous);
    }
  });

  it('exits non-zero and explains when the target cannot be emptied', () => {
    const site = join(workspace, 'site');
    mkdirSync(site);
    writeFileSync(join(site, 'notes.md'), 'mine');

    const { code, output } = run(site);

    expect(code).toBe(1);
    expect(output).toContain('refusing to empty a directory');
  });
});
