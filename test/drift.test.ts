import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseUpstreamSchema, UpstreamSchemaError } from '../src/core/schema-yaml.js';
import {
  compareAgainstUpstream,
  formatDrift,
  isRealDrift,
  missingSource,
  undeterminedSource,
  unreadableSource,
} from '../src/core/drift.js';
import type { RegistryEntry } from '../src/core/registry.js';

function yaml(name: string): string {
  return readFileSync(fileURLToPath(new URL(`./fixtures/yaml/${name}`, import.meta.url)), 'utf8');
}

function entry(overrides: Partial<RegistryEntry> = {}): RegistryEntry {
  return {
    id: 'owner/thing',
    name: 'thing',
    description: 'A workflow schema.',
    artifacts: ['specs', 'tasks'],
    source: { repo: 'https://github.com/owner/repo', path: 'openspec/schemas/thing' },
    ...overrides,
  };
}

describe('reading an upstream schema.yaml', () => {
  it('reads a plain schema', () => {
    expect(parseUpstreamSchema(yaml('plain.yaml'))).toEqual({
      name: 'tinychange',
      artifacts: ['specs', 'tasks'],
    });
  });

  it('is not fooled by a quoted name or a folded description', () => {
    const upstream = parseUpstreamSchema(yaml('quoted-and-folded.yaml'));

    expect(upstream.name).toBe('SuperSpec');
    expect(upstream.artifacts).toEqual(['brainstorm', 'proposal']);
  });

  it('rejects a file that is not valid YAML', () => {
    expect(() => parseUpstreamSchema(yaml('not-yaml.yaml'))).toThrow(UpstreamSchemaError);
  });

  it('rejects a file that is not a mapping', () => {
    expect(() => parseUpstreamSchema(yaml('not-a-mapping.yaml'))).toThrow('does not hold a mapping');
  });

  it('rejects a schema declaring no name', () => {
    expect(() => parseUpstreamSchema(yaml('no-name.yaml'))).toThrow('declares no name');
  });

  it('rejects a schema declaring no artifacts', () => {
    expect(() => parseUpstreamSchema(yaml('no-artifacts.yaml'))).toThrow('declares no artifacts');
  });

  it('rejects an artifact without an id', () => {
    expect(() => parseUpstreamSchema(yaml('artifact-without-id.yaml'))).toThrow(
      'artifact 1 in schema.yaml declares no id',
    );
  });
});

describe('classifying a difference by what it costs a consumer', () => {
  it('finds nothing when the entry still matches', () => {
    const drifts = compareAgainstUpstream(entry(), { name: 'thing', artifacts: ['specs', 'tasks'] });

    expect(drifts).toEqual([]);
  });

  it('calls a renamed schema semantic and names both values', () => {
    const drifts = compareAgainstUpstream(entry(), {
      name: 'thingy',
      artifacts: ['specs', 'tasks'],
    });

    expect(drifts).toHaveLength(1);
    expect(drifts[0]?.kind).toBe('semantic');
    expect(drifts[0]?.message).toContain('"thing" here and "thingy" upstream');
    expect(drifts[0]?.message).toContain('install directory');
  });

  it('calls added artifacts benign and names what was added', () => {
    const drifts = compareAgainstUpstream(entry(), {
      name: 'thing',
      artifacts: ['specs', 'tasks', 'plan'],
    });

    expect(drifts[0]?.kind).toBe('benign');
    expect(drifts[0]?.message).toContain('upstream added plan');
  });

  it('names what was removed', () => {
    const drifts = compareAgainstUpstream(entry(), { name: 'thing', artifacts: ['specs'] });

    expect(drifts[0]?.message).toContain('upstream no longer has tasks');
  });

  it('notices a reordered pipeline', () => {
    const drifts = compareAgainstUpstream(entry(), {
      name: 'thing',
      artifacts: ['tasks', 'specs'],
    });

    expect(drifts[0]?.kind).toBe('benign');
    expect(drifts[0]?.message).toContain('different order');
  });

  it('reports both differences when name and artifacts moved together', () => {
    const drifts = compareAgainstUpstream(entry(), { name: 'other', artifacts: ['specs'] });

    expect(drifts.map((drift) => drift.kind)).toEqual(['semantic', 'benign']);
  });

  it('tolerates an entry with no artifacts array', () => {
    const drifts = compareAgainstUpstream(entry({ artifacts: undefined }), {
      name: 'thing',
      artifacts: ['specs'],
    });

    expect(drifts[0]?.kind).toBe('benign');
  });

  it('names an entry without an id rather than failing', () => {
    const drifts = compareAgainstUpstream(entry({ id: undefined }), {
      name: 'other',
      artifacts: ['specs', 'tasks'],
    });

    expect(drifts[0]?.entry).toBe('(entry without an id)');
  });
});

describe('sources that do not answer normally', () => {
  it('treats a missing source as fatal', () => {
    const drift = missingSource(entry(), 'https://example.invalid/schema.yaml');

    expect(drift.kind).toBe('fatal');
    expect(isRealDrift(drift)).toBe(true);
    expect(drift.message).toContain('A consumer following this entry gets nothing');
  });

  it('treats an unreachable source as undetermined, which is not drift', () => {
    const drift = undeterminedSource(entry(), 'rate limited (HTTP 403)');

    expect(drift.kind).toBe('undetermined');
    expect(isRealDrift(drift)).toBe(false);
  });

  it('treats an unreadable schema as fatal', () => {
    expect(unreadableSource(entry(), 'schema.yaml declares no name').kind).toBe('fatal');
  });
});

describe('the report', () => {
  it('says so when everything matches', () => {
    expect(formatDrift([], 13)).toBe('Every checked entry matches its source. 13 checked.');
  });

  it('groups differences by entry and counts them', () => {
    const report = formatDrift(
      [
        { entry: 'a/one', kind: 'semantic', message: 'renamed.' },
        { entry: 'a/one', kind: 'benign', message: 'artifacts moved.' },
        { entry: 'b/two', kind: 'fatal', message: 'gone.' },
      ],
      13,
    );

    expect(report).toContain('3 differences across 2 of 13 entries.');
    expect(report.indexOf('a/one')).toBeLessThan(report.indexOf('b/two'));
    expect(report).toContain('semantic: renamed.');
  });

  it('uses the singular for one difference', () => {
    expect(formatDrift([{ entry: 'a/one', kind: 'fatal', message: 'gone.' }], 13)).toContain(
      '1 difference across 1 of 13 entries.',
    );
  });

  it('lists undetermined entries separately, even when nothing drifted', () => {
    const report = formatDrift(
      [{ entry: 'a/one', kind: 'undetermined', message: 'could not be checked: rate limited.' }],
      13,
    );

    expect(report).toContain('Every checked entry matches its source.');
    expect(report).toContain('1 could not be checked, so their state is unknown:');
    expect(report).toContain('a/one');
  });
});
