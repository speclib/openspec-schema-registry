import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { rawUrl, runCheckSources, type Fetcher } from '../src/check-sources-cli.js';

function fixture(name: string): string {
  return fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
}

const matching = 'name: one\nartifacts:\n  - id: specs\n  - id: tasks\n';

/** A fetcher that answers each call from a scripted list, recording every URL. */
function scripted(
  responses: (
    | { status: number; body?: string }
    | { throws: string }
  )[],
): Fetcher & { calls: string[] } {
  const calls: string[] = [];
  let next = 0;
  const fetcher = (async (url: string) => {
    calls.push(url);
    const response = responses[Math.min(next, responses.length - 1)];
    next += 1;
    if (response !== undefined && 'throws' in response) {
      throw new Error(response.throws);
    }
    const { status, body = '' } = response as { status: number; body?: string };
    return { ok: status >= 200 && status < 300, status, text: async () => body };
  }) as Fetcher & { calls: string[] };
  fetcher.calls = calls;
  return fetcher;
}

function run(
  file: string,
  fetcher: Fetcher,
  extra: { attempts?: number; token?: string } = {},
): Promise<{ code: number; output: string }> {
  const lines: string[] = [];
  return runCheckSources([fixture(file)], {
    fetcher,
    backoffMs: 0,
    attempts: extra.attempts ?? 3,
    token: extra.token,
    log: (line) => lines.push(line),
  }).then((code) => ({ code, output: lines.join('\n') }));
}

describe('resolving an entry to its source', () => {
  it('uses HEAD when the entry has no ref, so a master default branch resolves', () => {
    const url = rawUrl({
      id: 'a/one',
      source: { repo: 'https://github.com/owner/repo', path: 'openspec/schemas/one' },
    });

    expect(url).toBe('https://raw.githubusercontent.com/owner/repo/HEAD/openspec/schemas/one/schema.yaml');
  });

  it('uses the ref when the entry pins one', () => {
    const url = rawUrl({
      id: 'a/one',
      source: { repo: 'https://github.com/owner/repo/', path: 'p', ref: 'v0.2.0' },
    });

    expect(url).toBe('https://raw.githubusercontent.com/owner/repo/v0.2.0/p/schema.yaml');
  });
});

describe('checking sources', () => {
  it('passes and says so when every entry matches', async () => {
    const { code, output } = await run('one-entry.json', scripted([{ status: 200, body: matching }]));

    expect(code).toBe(0);
    expect(output).toContain('Every checked entry matches its source. 1 checked.');
  });

  it('fails on a semantic difference', async () => {
    const renamed = 'name: onefish\nartifacts:\n  - id: specs\n  - id: tasks\n';
    const { code, output } = await run('one-entry.json', scripted([{ status: 200, body: renamed }]));

    expect(code).toBe(1);
    expect(output).toContain('semantic:');
  });

  it('fails on a benign difference too, so a pass means everything matches', async () => {
    const extra = 'name: one\nartifacts:\n  - id: specs\n  - id: tasks\n  - id: plan\n';
    const { code, output } = await run('one-entry.json', scripted([{ status: 200, body: extra }]));

    expect(code).toBe(1);
    expect(output).toContain('benign:');
  });

  it('treats a 404 as fatal', async () => {
    const { code, output } = await run('one-entry.json', scripted([{ status: 404 }]));

    expect(code).toBe(1);
    expect(output).toContain('fatal:');
    expect(output).toContain('no schema.yaml at');
  });

  it('treats an upstream file that is not a schema as fatal', async () => {
    const { code, output } = await run('one-entry.json', scripted([{ status: 200, body: 'name: x\n' }]));

    expect(code).toBe(1);
    expect(output).toContain('declares no artifacts');
  });

  it('reports every difference in one run, grouped by entry', async () => {
    const wrong = 'name: nope\nartifacts:\n  - id: other\n';
    const { code, output } = await run('two-entries.json', scripted([{ status: 200, body: wrong }]));

    expect(code).toBe(1);
    expect(output).toContain('4 differences across 2 of 2 entries.');
  });
});

describe('sources that refuse to answer', () => {
  it('retries and succeeds without reporting the failed attempt', async () => {
    const fetcher = scripted([{ status: 503 }, { status: 200, body: matching }]);
    const { code, output } = await run('one-entry.json', fetcher);

    expect(code).toBe(0);
    expect(fetcher.calls).toHaveLength(2);
    expect(output).not.toContain('could not be checked');
  });

  it('gives up after the attempts and reports undetermined, without failing', async () => {
    const fetcher = scripted([{ status: 403 }]);
    const { code, output } = await run('one-entry.json', fetcher);

    expect(code).toBe(0);
    expect(fetcher.calls).toHaveLength(3);
    expect(output).toContain('1 could not be checked, so their state is unknown:');
    expect(output).toContain('rate limited (HTTP 403)');
  });

  it('treats a network failure as unreachable rather than as a missing source', async () => {
    const { code, output } = await run('one-entry.json', scripted([{ throws: 'socket hang up' }]));

    expect(code).toBe(0);
    expect(output).toContain('network failure (socket hang up)');
  });

  it('treats an unexpected status as unreachable', async () => {
    const { output } = await run('one-entry.json', scripted([{ status: 418 }]));

    expect(output).toContain('unexpected HTTP 418');
  });

  it('treats 429 as rate limiting', async () => {
    const { output } = await run('one-entry.json', scripted([{ status: 429 }]));

    expect(output).toContain('rate limited (HTTP 429)');
  });

  it('does not stop a real difference elsewhere from failing the run', async () => {
    const fetcher = scripted([{ status: 403 }, { status: 403 }, { status: 403 }, { status: 404 }]);
    const { code, output } = await run('two-entries.json', fetcher, { attempts: 3 });

    expect(code).toBe(1);
    expect(output).toContain('fatal:');
    expect(output).toContain('could not be checked');
  });
});

describe('the token', () => {
  it('sends an authorization header when a token is given', async () => {
    const seen: (Record<string, string> | undefined)[] = [];
    const fetcher: Fetcher = async (_url, init) => {
      seen.push(init?.headers);
      return { ok: true, status: 200, text: async () => matching };
    };

    await run('one-entry.json', fetcher, { token: 'secret' });

    expect(seen[0]?.['authorization']).toBe('Bearer secret');
  });

  it('works without one', async () => {
    const seen: (Record<string, string> | undefined)[] = [];
    const fetcher: Fetcher = async (_url, init) => {
      seen.push(init?.headers);
      return { ok: true, status: 200, text: async () => matching };
    };

    const { code } = await run('one-entry.json', fetcher, { token: '' });

    expect(code).toBe(0);
    expect(seen[0]?.['authorization']).toBeUndefined();
  });
});

describe('a registry that cannot be read', () => {
  it('exits non-zero naming the missing file', async () => {
    const lines: string[] = [];
    const code = await runCheckSources([fixture('there-is-no-such-file.json')], {
      fetcher: scripted([{ status: 200, body: matching }]),
      log: (line) => lines.push(line),
    });

    expect(code).toBe(1);
    expect(lines.join('\n')).toContain('does not exist');
  });
});
