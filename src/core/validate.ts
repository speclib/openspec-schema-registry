/**
 * Checking that `openspec-schemas.json` is legal.
 *
 * Two mechanisms, split by what each can do. The JSON Schema states the shape of
 * the document and of every entry. Three rules it cannot state are checked here:
 * JSON Schema has no uniqueness by a property and no ordering, so `id` uniqueness,
 * ascending order and `superseded_by` pointing at a real entry need code.
 *
 * Nothing here touches the network. The gate that runs it builds in a sandbox with
 * no network access, and a contributor should be able to check an entry offline.
 */

import { Ajv2020, type ErrorObject, type ValidateFunction } from 'ajv/dist/2020.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadRegistry, readRegistryDocument, type RegistryEntry } from './registry.js';
import type { Problem } from './problem.js';

/** The JSON Schema shipped alongside the registry. */
export function defaultSchemaPath(): string {
  return fileURLToPath(new URL('../../schema/openspec-schemas.schema.json', import.meta.url));
}

function compile(schemaPath: string): ValidateFunction {
  const ajv = new Ajv2020({ allErrors: true, strict: true, verbose: true });
  return ajv.compile(JSON.parse(readFileSync(schemaPath, 'utf8')));
}

/** Edit distance, used only to guess which field a misspelling meant. */
function distance(a: string, b: string): number {
  const rows: number[][] = [];
  for (let i = 0; i <= a.length; i += 1) {
    rows.push([i, ...Array<number>(b.length).fill(0)]);
  }
  const first = rows[0] as number[];
  for (let j = 0; j <= b.length; j += 1) {
    first[j] = j;
  }
  for (let i = 1; i <= a.length; i += 1) {
    const row = rows[i] as number[];
    const previous = rows[i - 1] as number[];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(
        (previous[j] as number) + 1,
        (row[j - 1] as number) + 1,
        (previous[j - 1] as number) + cost,
      );
    }
  }
  return (rows[a.length] as number[])[b.length] as number;
}

/**
 * The closest defined field to a misspelling, or null when nothing is close
 * enough. A guess that is not close is worse than no guess.
 */
function nearestField(unknown: string, defined: string[]): string | null {
  let best: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of defined) {
    const d = distance(unknown.toLowerCase(), candidate.toLowerCase());
    if (d < bestDistance) {
      bestDistance = d;
      best = candidate;
    }
  }
  const limit = Math.max(1, Math.floor(unknown.length / 3));
  return best !== null && bestDistance <= limit ? best : null;
}

/** `/schemas/8/source/path` becomes `source.path`; the document itself has no field. */
function fieldOf(instancePath: string): string | null {
  const parts = instancePath.split('/').filter((part) => part !== '');
  if (parts[0] === 'schemas' && parts.length >= 2) {
    const rest = parts.slice(2);
    return rest.length > 0 ? rest.join('.') : null;
  }
  return parts.length > 0 ? parts.join('.') : null;
}

/** Which entry an ajv error belongs to, by id, or null for the document. */
function entryOf(instancePath: string, entries: RegistryEntry[]): string | null {
  const parts = instancePath.split('/').filter((part) => part !== '');
  if (parts[0] !== 'schemas' || parts.length < 2) {
    return null;
  }
  const index = Number(parts[1]);
  const entry = entries[index];
  const id = entry?.['id'];
  return typeof id === 'string' && id.length > 0 ? id : `entry ${index + 1} (no id)`;
}

function valueAt(instancePath: string, document: unknown): unknown {
  const parts = instancePath.split('/').filter((part) => part !== '');
  let current: unknown = document;
  for (const part of parts) {
    if (current === null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function quote(value: unknown): string {
  return typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
}

/** Turn one ajv error into a sentence a schema author can act on. */
function describe(error: ErrorObject, document: unknown): string {
  const value = valueAt(error.instancePath, document);
  const params = error.params as Record<string, unknown>;

  switch (error.keyword) {
    case 'required':
      return `${String(params['missingProperty'])} is required and is missing.`;

    case 'additionalProperties': {
      const unknown = String(params['additionalProperty']);
      const defined = Object.keys(
        (error.parentSchema as { properties?: Record<string, unknown> } | undefined)?.properties ??
          {},
      );
      const suggestion = nearestField(unknown, defined);
      return suggestion !== null
        ? `${unknown} is not a field. Did you mean ${suggestion}?`
        : `${unknown} is not a field. The fields are ${defined.join(', ')}.`;
    }

    case 'maxLength': {
      const limit = Number(params['limit']);
      const length = typeof value === 'string' ? value.length : 0;
      return `is ${length} characters. The limit is ${limit}, so trim ${length - limit}.\n    ${quote(value)}`;
    }

    case 'minLength':
      return `is empty and needs a value.`;

    case 'pattern':
      return `${quote(value)} does not match ${String(params['pattern'])}.`;

    case 'enum':
      return `${quote(value)} is not allowed. Use one of ${(params['allowedValues'] as unknown[]).map(quote).join(', ')}.`;

    case 'const':
      return `must be ${quote(params['allowedValue'])}, and is ${quote(value)}.`;

    case 'type':
      return `must be ${String(params['type'])}, and is ${quote(value)}.`;

    case 'minItems':
      return `needs at least ${String(params['limit'])} item, and has none.`;

    case 'uniqueItems':
      return `repeats an item at positions ${Number(params['j']) + 1} and ${Number(params['i']) + 1}.`;

    case 'if':
      return `superseded_by is only allowed on an entry whose status is deprecated.`;

    default:
      return `${error.message ?? 'is not valid'}.`;
  }
}

function schemaProblems(errors: ErrorObject[], document: unknown, entries: RegistryEntry[]): Problem[] {
  return errors
    .filter((error) => error.keyword !== 'allOf')
    .map((error) => ({
      entry: entryOf(error.instancePath, entries),
      field:
        error.keyword === 'required' || error.keyword === 'additionalProperties'
          ? fieldOf(error.instancePath)
          : fieldOf(error.instancePath),
      message: describe(error, document),
    }));
}

/** `id` is the only unique handle an entry has, and JSON Schema cannot check it. */
function duplicateIdProblems(entries: RegistryEntry[]): Problem[] {
  const positions = new Map<string, number[]>();
  entries.forEach((entry, index) => {
    const id = entry['id'];
    if (typeof id === 'string') {
      positions.set(id, [...(positions.get(id) ?? []), index + 1]);
    }
  });

  const problems: Problem[] = [];
  for (const [id, where] of positions) {
    if (where.length > 1) {
      problems.push({
        entry: id,
        field: 'id',
        message: `appears ${where.length} times, at positions ${where.join(' and ')}. Every id is unique.`,
      });
    }
  }
  return problems;
}

/** Ordering is not expressible in JSON Schema either. */
function orderProblems(entries: RegistryEntry[]): Problem[] {
  const ids = entries.map((entry) => String(entry['id'] ?? ''));
  const sorted = [...ids].sort();
  const problems: Problem[] = [];

  ids.forEach((id, index) => {
    if (id === sorted[index]) {
      return;
    }
    const belongsAt = sorted.indexOf(id);
    const before = belongsAt > 0 ? sorted[belongsAt - 1] : null;
    const after = belongsAt < sorted.length - 1 ? sorted[belongsAt + 1] : null;
    const between =
      before !== null && after !== null
        ? `between ${before} and ${after}`
        : before !== null
          ? `after ${before}`
          : `before ${String(after)}`;
    problems.push({
      entry: id,
      field: null,
      message: `is at position ${index + 1} but entries are sorted by id, so it belongs ${between}.`,
    });
  });

  return problems;
}

/** A supersession a reader cannot follow is worse than none. */
function supersessionProblems(entries: RegistryEntry[]): Problem[] {
  const ids = new Set(entries.map((entry) => String(entry['id'] ?? '')));
  const problems: Problem[] = [];

  for (const entry of entries) {
    const target = entry['superseded_by'];
    if (typeof target === 'string' && !ids.has(target)) {
      problems.push({
        entry: String(entry['id'] ?? ''),
        field: 'superseded_by',
        message: `names ${quote(target)}, which no entry in the registry carries.`,
      });
    }
  }
  return problems;
}

/**
 * Validate a registry file and return every problem found, grouped later by entry.
 * An empty list means the file is legal as far as anything offline can tell: a
 * well-formed entry whose source no longer exists still passes here.
 */
export function validateRegistry(
  registryPath: string,
  schemaPath: string = defaultSchemaPath(),
): Problem[] {
  const document: unknown = readRegistryDocument(registryPath);
  const validate = compile(schemaPath);

  if (!validate(document)) {
    const entries = Array.isArray((document as { schemas?: unknown }).schemas)
      ? ((document as { schemas: RegistryEntry[] }).schemas)
      : [];
    return schemaProblems(validate.errors ?? [], document, entries);
  }

  const entries = loadRegistry(registryPath);
  return [
    ...duplicateIdProblems(entries),
    ...orderProblems(entries),
    ...supersessionProblems(entries),
  ];
}
