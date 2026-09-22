import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { runValidate } from '../src/validate-cli.js';

function fixture(name: string): string {
  return fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
}

function run(...argv: string[]): { code: number; output: string } {
  const lines: string[] = [];
  const code = runValidate(argv, (line) => lines.push(line));
  return { code, output: lines.join('\n') };
}

describe('the validate command', () => {
  it('exits zero and says so when the registry is valid', () => {
    const { code, output } = run(fixture('valid.json'));

    expect(code).toBe(0);
    expect(output).toContain('is valid.');
  });

  it('exits non-zero and prints the problems when it is not', () => {
    const { code, output } = run(fixture('licence-typo.json'));

    expect(code).toBe(1);
    expect(output).toContain('Did you mean license?');
    expect(output).toContain('1 problem');
  });

  it('exits non-zero when the file is missing, naming it', () => {
    const missing = fixture('there-is-no-such-file.json');
    const { code, output } = run(missing);

    expect(code).toBe(1);
    expect(output).toContain(missing);
    expect(output).toContain('does not exist');
  });

  it('exits non-zero when the file is not valid JSON', () => {
    const { code, output } = run(fixture('not-json.json'));

    expect(code).toBe(1);
    expect(output).toContain('not-json.json');
  });

  it('defaults to the registry at the repository root', () => {
    const { code, output } = run();

    expect(code).toBe(0);
    expect(output).toContain('openspec-schemas.json is valid.');
  });
});
