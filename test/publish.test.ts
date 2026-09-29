import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assembleSite,
  publishedFiles,
  PublishError,
  repositoryRoot,
  versionedPrefix,
} from '../src/core/publish.js';
import { validateRegistry } from '../src/core/validate.js';

const root = repositoryRoot();
const registryFile = fileURLToPath(new URL('../openspec-schemas.json', import.meta.url));
const schemaFile = fileURLToPath(new URL('../schema/openspec-schemas.schema.json', import.meta.url));
const pageFile = fileURLToPath(new URL('../public/index.html', import.meta.url));

let workspace: string;
let site: string;

beforeEach(() => {
  workspace = mkdtempSync(join(tmpdir(), 'registry-publish-'));
  site = join(workspace, 'site');
});

afterEach(() => {
  rmSync(workspace, { recursive: true, force: true });
});

/** Every file under a directory, as paths relative to it, sorted. */
function tree(directory: string): string[] {
  const found: string[] = [];
  const walk = (current: string): void => {
    for (const item of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, item.name);
      if (item.isDirectory()) {
        walk(path);
      } else {
        found.push(relative(directory, path).split('\\').join('/'));
      }
    }
  };
  walk(directory);
  return found.sort();
}

describe('the publishable directory holds the files it serves', () => {
  it('assembles exactly the page, the registry and its schema', () => {
    assembleSite(site, root);

    expect(tree(site)).toEqual([
      'api/v1/openspec-schemas.json',
      'api/v1/schema.json',
      'index.html',
    ]);
  });

  it('reports the published paths, which are the paths in the URL', () => {
    expect(assembleSite(site, root)).toEqual([
      'index.html',
      'api/v1/openspec-schemas.json',
      'api/v1/schema.json',
    ]);
  });

  it('places only the page at the root, which the root is reserved for', () => {
    assembleSite(site, root);

    expect(tree(site).filter((path) => !path.includes('/'))).toEqual(['index.html']);
  });

  it('keeps every machine address under the versioned path', () => {
    assembleSite(site, root);

    expect(tree(site).filter((path) => path.endsWith('.json'))).toEqual([
      'api/v1/openspec-schemas.json',
      'api/v1/schema.json',
    ]);
  });

  it('would fail if a second file were added at the root', () => {
    assembleSite(site, root);
    writeFileSync(join(site, 'openspec-schemas.json'), '{}');

    expect(tree(site).filter((path) => !path.includes('/'))).toEqual([
      'index.html',
      'openspec-schemas.json',
    ]);
  });

  it('drops a file left behind by an earlier assembly', () => {
    assembleSite(site, root);
    mkdirSync(join(site, 'api', 'v0'), { recursive: true });
    writeFileSync(join(site, 'api', 'v0', 'openspec-schemas.json'), '{}');

    assembleSite(site, root);

    expect(tree(site)).toEqual([
      'api/v1/openspec-schemas.json',
      'api/v1/schema.json',
      'index.html',
    ]);
  });
});

describe('the root serves a page rather than the registry', () => {
  it('publishes a page a browser can render', () => {
    assembleSite(site, root);
    const page = readFileSync(join(site, 'index.html'), 'utf8');

    expect(page).toMatch(/^<!doctype html>/i);
    expect(page).toContain('</html>');
  });

  it('publishes the page byte for byte', () => {
    assembleSite(site, root);

    expect(readFileSync(join(site, 'index.html'))).toEqual(readFileSync(pageFile));
  });

  it('serves no registry entry from the root', () => {
    assembleSite(site, root);
    const page = readFileSync(join(site, 'index.html'), 'utf8');

    expect(page).not.toContain('"schemas"');
  });

  it('loads no subresource from anywhere else, so the page is one request', () => {
    const page = readFileSync(pageFile, 'utf8');
    const external = page.match(
      /<(?:script|link|img|source|iframe)\b[^>]*\b(?:src|href)="(?:https?:)?\/\//gi,
    );

    expect(external).toBeNull();
  });
});

describe('the published file is the file in the repository', () => {
  it('publishes the registry byte for byte', () => {
    assembleSite(site, root);

    expect(readFileSync(join(site, 'api/v1/openspec-schemas.json'))).toEqual(
      readFileSync(registryFile),
    );
  });

  it('publishes the schema byte for byte', () => {
    assembleSite(site, root);

    expect(readFileSync(join(site, 'api/v1/schema.json'))).toEqual(readFileSync(schemaFile));
  });

  it('adds no field of its own, so the published document parses to the same value', () => {
    assembleSite(site, root);
    const published = JSON.parse(readFileSync(join(site, 'api/v1/openspec-schemas.json'), 'utf8'));

    expect(Object.keys(published)).toEqual(['$schema', 'schemas']);
    expect(published).toEqual(JSON.parse(readFileSync(registryFile, 'utf8')));
  });

  it('publishes a registry that still validates against the published schema', () => {
    assembleSite(site, root);

    expect(
      validateRegistry(join(site, 'api/v1/openspec-schemas.json'), join(site, 'api/v1/schema.json')),
    ).toEqual([]);
  });
});

describe('the schema pointer survives the document being copied away', () => {
  it('names the published schema by an absolute URL', () => {
    const document = JSON.parse(readFileSync(registryFile, 'utf8')) as { $schema: string };

    expect(document.$schema).toBe('https://registry.speclib.org/api/v1/schema.json');
  });

  it('carries a matching $id on the schema itself', () => {
    const schema = JSON.parse(readFileSync(schemaFile, 'utf8')) as { $id: string };

    expect(schema.$id).toBe('https://registry.speclib.org/api/v1/schema.json');
  });

  it('validates a copy sitting in a directory that holds nothing else', () => {
    const alone = join(workspace, 'cache');
    mkdirSync(alone);
    const copy = join(alone, 'openspec-schemas.json');
    writeFileSync(copy, readFileSync(registryFile));

    expect(readdirSync(alone)).toEqual(['openspec-schemas.json']);
    expect(validateRegistry(copy)).toEqual([]);
  });
});

describe('assembling refuses a target it should not empty', () => {
  it('refuses a directory holding the repository', () => {
    expect(() => assembleSite(root, root)).toThrow(PublishError);
    expect(() => assembleSite(root, root)).toThrow(/contains the repository/);
  });

  it('refuses a directory holding anything the site does not serve', () => {
    mkdirSync(site);
    writeFileSync(join(site, 'notes.md'), 'mine');

    expect(() => assembleSite(site, root)).toThrow(/refusing to empty a directory/);
  });

  it('names a file it was asked to publish and could not find', () => {
    const empty = join(workspace, 'empty-checkout');
    mkdirSync(empty);

    expect(() => assembleSite(site, empty)).toThrow(/does not exist/);
  });
});

describe('the layout is stated once', () => {
  it('lists the page and the two machine addresses', () => {
    expect(publishedFiles.map((file) => file.published)).toEqual([
      'index.html',
      'api/v1/openspec-schemas.json',
      'api/v1/schema.json',
    ]);
  });

  it('puts every file that is not the page under the versioned path', () => {
    const machine = publishedFiles.filter((file) => file.published !== 'index.html');

    expect(machine.every((file) => file.published.startsWith(versionedPrefix))).toBe(true);
  });
});
