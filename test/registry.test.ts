import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { loadRegistry, RegistryLoadError } from '../src/core/registry.js';
import * as api from '../src/index.js';

function fixture(name: string): string {
  return fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
}

const registryFile = fileURLToPath(new URL('../openspec-schemas.json', import.meta.url));

describe('the loader reads the registry file into entries', () => {
  it('returns entries in file order', () => {
    const entries = loadRegistry(fixture('three-entries.json'));

    expect(entries.map((entry) => entry['id'])).toEqual(['a/one', 'b/two', 'c/three']);
  });

  it('returns an empty list for an empty registry', () => {
    expect(loadRegistry(fixture('empty.json'))).toEqual([]);
  });
});

describe('the loader rejects a file it cannot trust', () => {
  it('raises an error naming a missing file', () => {
    const missing = fixture('there-is-no-such-file.json');

    expect(() => loadRegistry(missing)).toThrow(RegistryLoadError);
    expect(() => loadRegistry(missing)).toThrow(missing);
    expect(() => loadRegistry(missing)).toThrow(/does not exist/);
  });

  it('raises an error when the file is not valid JSON', () => {
    expect(() => loadRegistry(fixture('not-json.json'))).toThrow(/not valid JSON/);
    expect(() => loadRegistry(fixture('not-json.json'))).toThrow(fixture('not-json.json'));
  });

  it('raises an error when the top level is an array', () => {
    expect(() => loadRegistry(fixture('top-level-array.json'))).toThrow(/JSON object at its top level/);
  });

  it('raises an error when the top level is null', () => {
    expect(() => loadRegistry(fixture('top-level-null.json'))).toThrow(/JSON object at its top level/);
  });

  it('raises an error when the schemas key is missing', () => {
    expect(() => loadRegistry(fixture('no-schemas-key.json'))).toThrow(/schemas key is missing/);
  });

  it('raises an error when the schemas key is not an array', () => {
    expect(() => loadRegistry(fixture('schemas-not-array.json'))).toThrow(/schemas key must hold an array/);
  });

  it('names the file it could not read for any reason', () => {
    const directory = fileURLToPath(new URL('./fixtures', import.meta.url));

    expect(() => loadRegistry(directory)).toThrow(RegistryLoadError);
    expect(() => loadRegistry(directory)).toThrow(directory);
  });
});

describe('the shipped registry file', () => {
  it('loads', () => {
    expect(Array.isArray(loadRegistry(registryFile))).toBe(true);
  });

  it('gives every entry an id, and no two the same', () => {
    const ids = loadRegistry(registryFile).map((entry) => entry['id']);

    expect(ids.every((id) => typeof id === 'string' && id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('is sorted ascending by id', () => {
    const ids = loadRegistry(registryFile).map((entry) => String(entry['id']));

    expect(ids).toEqual([...ids].sort());
  });

  it('keeps every description within 100 characters', () => {
    const tooLong = loadRegistry(registryFile)
      .filter((entry) => String(entry['description']).length > 100)
      .map((entry) => entry['id']);

    expect(tooLong).toEqual([]);
  });
});

describe('the package entry point', () => {
  it('exports the loader and its error', () => {
    expect(api.loadRegistry).toBe(loadRegistry);
    expect(api.RegistryLoadError).toBe(RegistryLoadError);
  });
});
