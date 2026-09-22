/**
 * Reading `openspec-schemas.json` into memory.
 *
 * Every other part of this project starts here, so the loader refuses a file it
 * cannot trust rather than returning something half-shaped. A missing file is an
 * error and not an empty registry: a typo'd path would otherwise look exactly
 * like a registry with nothing in it.
 */

import { readFileSync } from 'node:fs';

/** One entry in the registry. Its fields are settled by the registry-entry capability. */
export type RegistryEntry = Record<string, unknown>;

/** The registry document: an object with room to grow around its entries. */
export interface Registry {
  schemas: RegistryEntry[];
}

/** Raised when a registry file is missing or cannot be trusted. */
export class RegistryLoadError extends Error {
  readonly path: string;

  constructor(path: string, reason: string) {
    super(`${path}: ${reason}`);
    this.name = 'RegistryLoadError';
    this.path = path;
  }
}

function readRegistryFile(path: string): string {
  try {
    return readFileSync(path, 'utf8');
  } catch (cause) {
    const reason = (cause as NodeJS.ErrnoException).code === 'ENOENT'
      ? 'registry file does not exist'
      : `registry file could not be read (${(cause as Error).message})`;
    throw new RegistryLoadError(path, reason);
  }
}

function parseRegistry(path: string, source: string): unknown {
  try {
    return JSON.parse(source);
  } catch (cause) {
    throw new RegistryLoadError(path, `registry file is not valid JSON (${(cause as Error).message})`);
  }
}

/**
 * Read and parse a registry file without inspecting its contents.
 *
 * Shared with the validator so that a missing or unparseable file is reported
 * the same way whichever entry point the reader came through.
 */
export function readRegistryDocument(path: string): unknown {
  return parseRegistry(path, readRegistryFile(path));
}

/**
 * Read a registry file and return its entries in file order.
 *
 * An empty `schemas` array yields an empty list, because an empty registry is a
 * valid registry.
 */
export function loadRegistry(path: string): RegistryEntry[] {
  const document = readRegistryDocument(path);

  if (document === null || typeof document !== 'object' || Array.isArray(document)) {
    throw new RegistryLoadError(path, 'registry file must hold a JSON object at its top level');
  }

  const schemas = (document as Record<string, unknown>)['schemas'];
  if (!Array.isArray(schemas)) {
    throw new RegistryLoadError(
      path,
      'schemas' in (document as Record<string, unknown>)
        ? 'the schemas key must hold an array'
        : 'the schemas key is missing',
    );
  }

  return schemas as RegistryEntry[];
}
