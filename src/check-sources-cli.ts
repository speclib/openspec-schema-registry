/**
 * `npm run check-sources` over the registry file.
 *
 * Fetches each entry's `schema.yaml` once and asks three questions of the answer:
 * does the source resolve, does `name` still match, do `artifacts` still match.
 *
 * Exits non-zero on any real difference. An entry whose source could not be
 * reached does not fail the run, because a badge that flips on a GitHub blip
 * teaches the reader to ignore it. Those entries are reported instead, so a pass
 * that skipped entries is visible rather than silent.
 */

import { relative, resolve } from 'node:path';
import { loadRegistry, RegistryLoadError, type RegistryEntry } from './core/registry.js';
import {
  compareAgainstUpstream,
  formatDrift,
  isRealDrift,
  missingSource,
  undeterminedSource,
  unreadableSource,
  type Drift,
} from './core/drift.js';
import { parseUpstreamSchema, UpstreamSchemaError } from './core/schema-yaml.js';

/** Just enough of `fetch` to be injectable in a test. */
export type Fetcher = (url: string, init?: { headers?: Record<string, string> }) => Promise<{
  ok: boolean;
  status: number;
  text: () => Promise<string>;
}>;

export interface CheckOptions {
  fetcher?: Fetcher;
  token?: string | undefined;
  /** Attempts per entry, including the first. Retries only help an unreachable source. */
  attempts?: number;
  /** Milliseconds before a retry, multiplied by the attempt number. Zero in tests. */
  backoffMs?: number;
  log?: (line: string) => void;
}

/** GitHub serves a file at a ref through this path, and `HEAD` means the default branch. */
export function rawUrl(entry: RegistryEntry): string {
  const source = entry['source'] as Record<string, unknown>;
  const repo = String(source['repo']).replace(/\/+$/, '');
  const slug = repo.replace(/^https:\/\/github\.com\//, '');
  const ref = typeof source['ref'] === 'string' && source['ref'] !== '' ? source['ref'] : 'HEAD';
  return `https://raw.githubusercontent.com/${slug}/${ref}/${String(source['path'])}/schema.yaml`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((done) => {
    setTimeout(done, ms);
  });
}

type Attempt =
  | { outcome: 'found'; body: string }
  | { outcome: 'missing' }
  | { outcome: 'unreachable'; reason: string };

/**
 * A definitive "not there" is an answer. Rate limiting, a server error and a
 * network failure are refusals to answer, and must not be read as a missing file.
 */
async function attemptOnce(url: string, fetcher: Fetcher, token?: string): Promise<Attempt> {
  const headers: Record<string, string> = { accept: 'text/plain' };
  if (token !== undefined && token !== '') {
    headers['authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetcher(url, { headers });
    if (response.ok) {
      return { outcome: 'found', body: await response.text() };
    }
    if (response.status === 404) {
      return { outcome: 'missing' };
    }
    if (response.status === 403 || response.status === 429) {
      return { outcome: 'unreachable', reason: `rate limited (HTTP ${response.status})` };
    }
    if (response.status >= 500) {
      return { outcome: 'unreachable', reason: `server error (HTTP ${response.status})` };
    }
    return { outcome: 'unreachable', reason: `unexpected HTTP ${response.status}` };
  } catch (cause) {
    return { outcome: 'unreachable', reason: `network failure (${(cause as Error).message})` };
  }
}

async function fetchSchema(
  url: string,
  fetcher: Fetcher,
  token: string | undefined,
  attempts: number,
  backoffMs: number,
): Promise<Attempt> {
  let last: Attempt = { outcome: 'unreachable', reason: 'not attempted' };
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    last = await attemptOnce(url, fetcher, token);
    if (last.outcome !== 'unreachable') {
      return last;
    }
    if (attempt < attempts && backoffMs > 0) {
      await sleep(backoffMs * attempt);
    }
  }
  return last;
}

async function checkEntry(
  entry: RegistryEntry,
  options: Required<Pick<CheckOptions, 'fetcher' | 'attempts' | 'backoffMs'>> & {
    token: string | undefined;
  },
): Promise<Drift[]> {
  const url = rawUrl(entry);
  const attempt = await fetchSchema(
    url,
    options.fetcher,
    options.token,
    options.attempts,
    options.backoffMs,
  );

  if (attempt.outcome === 'missing') {
    return [missingSource(entry, url)];
  }
  if (attempt.outcome === 'unreachable') {
    return [undeterminedSource(entry, attempt.reason)];
  }

  try {
    return compareAgainstUpstream(entry, parseUpstreamSchema(attempt.body));
  } catch (cause) {
    if (cause instanceof UpstreamSchemaError) {
      return [unreadableSource(entry, cause.message)];
    }
    throw cause;
  }
}

export async function runCheckSources(argv: string[], options: CheckOptions = {}): Promise<number> {
  const log = options.log ?? ((line: string) => process.stdout.write(`${line}\n`));
  const fetcher = options.fetcher ?? (globalThis.fetch as unknown as Fetcher);
  const attempts = options.attempts ?? 3;
  const backoffMs = options.backoffMs ?? 500;
  const token = options.token ?? process.env['GITHUB_TOKEN'];

  const target = resolve(argv[0] ?? 'openspec-schemas.json');
  const nearby = relative(process.cwd(), target);
  const shown = nearby !== '' && !nearby.startsWith('..') ? nearby : target;

  let entries: RegistryEntry[];
  try {
    entries = loadRegistry(target);
  } catch (cause) {
    log(cause instanceof RegistryLoadError ? cause.message : `${shown}: ${(cause as Error).message}`);
    return 1;
  }

  const found: Drift[] = [];
  for (const entry of entries) {
    found.push(...(await checkEntry(entry, { fetcher, attempts, backoffMs, token })));
  }

  log(formatDrift(found, entries.length));
  return found.some(isRealDrift) ? 1 : 0;
}
