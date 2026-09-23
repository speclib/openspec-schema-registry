/**
 * Comparing a registry entry against the schema it points at.
 *
 * Nothing here performs IO. The caller fetches; this decides what a difference
 * means, because the response differs per class and a check that treats them
 * alike is a check people learn to ignore.
 */

import type { RegistryEntry } from './registry.js';
import type { UpstreamSchema } from './schema-yaml.js';

/**
 * What a difference costs whoever follows the entry.
 *
 * `fatal`        the source does not resolve, so a consumer gets nothing
 * `semantic`     `name` changed, so the install directory and the `--schema`
 *                argument both changed. Someone has to decide whether it is
 *                still the same schema.
 * `benign`       `artifacts` changed. The registry's copy is stale but nothing
 *                a consumer does breaks meanwhile.
 * `undetermined` the source could not be reached. Not a difference at all, and
 *                reporting it as one is how a scheduled check becomes noise.
 */
export type DriftClass = 'fatal' | 'semantic' | 'benign' | 'undetermined';

export interface Drift {
  entry: string;
  kind: DriftClass;
  message: string;
}

/** A difference of these classes means the registry no longer matches its sources. */
export function isRealDrift(drift: Drift): boolean {
  return drift.kind !== 'undetermined';
}

function idOf(entry: RegistryEntry): string {
  return String(entry['id'] ?? '(entry without an id)');
}

/** The source answered definitively that there is nothing there. */
export function missingSource(entry: RegistryEntry, where: string): Drift {
  return {
    entry: idOf(entry),
    kind: 'fatal',
    message: `no schema.yaml at ${where}. A consumer following this entry gets nothing.`,
  };
}

/** The source refused to answer, which is not the same as answering "gone". */
export function undeterminedSource(entry: RegistryEntry, reason: string): Drift {
  return {
    entry: idOf(entry),
    kind: 'undetermined',
    message: `could not be checked: ${reason}.`,
  };
}

/** An upstream file that is not a schema we can compare against. */
export function unreadableSource(entry: RegistryEntry, reason: string): Drift {
  return { entry: idOf(entry), kind: 'fatal', message: `${reason}.` };
}

function listing(items: string[]): string {
  return items.join(', ');
}

/**
 * Compare one entry against what its source declares. Returns every difference
 * found, which is empty when the entry still matches.
 */
export function compareAgainstUpstream(entry: RegistryEntry, upstream: UpstreamSchema): Drift[] {
  const drifts: Drift[] = [];
  const id = idOf(entry);

  const name = String(entry['name'] ?? '');
  if (name !== upstream.name) {
    drifts.push({
      entry: id,
      kind: 'semantic',
      message:
        `name is "${name}" here and "${upstream.name}" upstream. ` +
        'That changes the install directory and the --schema argument, ' +
        'so it needs a decision rather than a correction.',
    });
  }

  const ours = Array.isArray(entry['artifacts'])
    ? (entry['artifacts'] as unknown[]).map(String)
    : [];
  if (ours.join(' ') !== upstream.artifacts.join(' ')) {
    const added = upstream.artifacts.filter((artifact) => !ours.includes(artifact));
    const removed = ours.filter((artifact) => !upstream.artifacts.includes(artifact));
    const parts: string[] = [];
    if (added.length > 0) {
      parts.push(`upstream added ${listing(added)}`);
    }
    if (removed.length > 0) {
      parts.push(`upstream no longer has ${listing(removed)}`);
    }
    if (parts.length === 0) {
      parts.push(`upstream declares them in a different order: ${listing(upstream.artifacts)}`);
    }
    drifts.push({
      entry: id,
      kind: 'benign',
      message: `artifacts are stale: ${parts.join(', and ')}.`,
    });
  }

  return drifts;
}

/** Render every finding, grouped by entry, with undetermined entries listed last. */
export function formatDrift(drifts: Drift[], checked: number): string {
  const real = drifts.filter(isRealDrift);
  const undetermined = drifts.filter((drift) => !isRealDrift(drift));

  const lines: string[] = [];
  const order: string[] = [];
  const grouped = new Map<string, Drift[]>();
  for (const drift of real) {
    const existing = grouped.get(drift.entry);
    if (existing) {
      existing.push(drift);
    } else {
      order.push(drift.entry);
      grouped.set(drift.entry, [drift]);
    }
  }

  for (const entry of order) {
    lines.push(entry);
    for (const drift of grouped.get(entry) ?? []) {
      lines.push(`  ${drift.kind}: ${drift.message}`);
    }
    lines.push('');
  }

  if (real.length === 0) {
    lines.push(`Every checked entry matches its source. ${checked} checked.`);
  } else {
    const word = real.length === 1 ? 'difference' : 'differences';
    lines.push(`${real.length} ${word} across ${grouped.size} of ${checked} entries.`);
  }

  if (undetermined.length > 0) {
    lines.push('');
    lines.push(`${undetermined.length} could not be checked, so their state is unknown:`);
    for (const drift of undetermined) {
      lines.push(`  ${drift.entry} ${drift.message}`);
    }
  }

  return lines.join('\n');
}
