/**
 * Reading the parts of an upstream `schema.yaml` the registry copies.
 *
 * A regular expression over the raw text was enough to verify the seed by hand and
 * would be wrong here: a quoted name or a folded description would fool it, and a
 * false drift report costs more than no report at all. So this parses properly.
 */

import { parse } from 'yaml';

/** What an upstream schema declares that a registry entry restates. */
export interface UpstreamSchema {
  name: string;
  artifacts: string[];
}

/** Raised when a fetched `schema.yaml` is not a schema we can compare against. */
export class UpstreamSchemaError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'UpstreamSchemaError';
  }
}

/**
 * Parse a `schema.yaml` and return the name and artifact ids it declares, in
 * declaration order.
 */
export function parseUpstreamSchema(source: string): UpstreamSchema {
  let document: unknown;
  try {
    document = parse(source);
  } catch (cause) {
    throw new UpstreamSchemaError(`schema.yaml is not valid YAML (${(cause as Error).message})`);
  }

  if (document === null || typeof document !== 'object' || Array.isArray(document)) {
    throw new UpstreamSchemaError('schema.yaml does not hold a mapping');
  }

  const record = document as Record<string, unknown>;
  const name = record['name'];
  if (typeof name !== 'string' || name.trim() === '') {
    throw new UpstreamSchemaError('schema.yaml declares no name');
  }

  const declared = record['artifacts'];
  if (!Array.isArray(declared)) {
    throw new UpstreamSchemaError('schema.yaml declares no artifacts');
  }

  const artifacts = declared.map((artifact, index) => {
    const id =
      artifact !== null && typeof artifact === 'object'
        ? (artifact as Record<string, unknown>)['id']
        : undefined;
    if (typeof id !== 'string' || id.trim() === '') {
      throw new UpstreamSchemaError(`artifact ${index + 1} in schema.yaml declares no id`);
    }
    return id;
  });

  return { name: name.trim(), artifacts };
}
