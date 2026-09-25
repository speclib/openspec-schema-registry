import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const buildSpecFile = fileURLToPath(new URL('../amplify.yml', import.meta.url));
const source = readFileSync(buildSpecFile, 'utf8');
const spec = parse(source) as {
  version: number;
  frontend: {
    phases: Record<string, { commands: string[] }>;
    artifacts: { baseDirectory: string; files: string[] };
    cache?: { paths: string[] };
  };
};

const build = spec.frontend.phases['build'] as { commands: string[] };

describe('the build spec is the shape Amplify reads', () => {
  it('declares version 1 with a frontend section', () => {
    expect(spec.version).toBe(1);
    expect(Object.keys(spec.frontend.phases)).toEqual(['preBuild', 'build']);
  });

  it('publishes the assembled directory and nothing else', () => {
    expect(spec.frontend.artifacts.baseDirectory).toBe('site');
    expect(spec.frontend.artifacts.files).toEqual(['**/*']);
  });
});

describe('validation gates the deploy', () => {
  it('runs validation in the build phase, where a non-zero exit fails the build', () => {
    expect(build.commands).toContain('npm run validate');
  });

  it('runs validation before anything is assembled', () => {
    expect(build.commands.indexOf('npm run validate')).toBeLessThan(
      build.commands.indexOf('npm run assemble-site'),
    );
  });

  it('assembles the site rather than publishing the repository as it stands', () => {
    expect(build.commands).toContain('npm run assemble-site');
  });
});

describe('the build needs no credential of its own', () => {
  it('names no secret and no environment variable', () => {
    expect(spec.frontend).not.toHaveProperty('environmentVariables');
    expect(source).not.toMatch(/secrets?:/i);
    expect(source).not.toMatch(/\$\{?[A-Z_]{3,}/);
  });

  it('runs only npm, so every input comes from the repository', () => {
    const commands = Object.values(spec.frontend.phases).flatMap((phase) => phase.commands);

    expect(commands.every((command) => command.startsWith('npm '))).toBe(true);
  });
});
