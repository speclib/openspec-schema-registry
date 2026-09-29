/**
 * Assembling the directory that gets published at `registry.speclib.org`.
 *
 * Files are copied and nothing is generated: the published document has to be
 * byte-identical to the one validation checked, so this reads and writes bytes
 * rather than parsing and re-serialising. A field added on the way out would be
 * the one part of the document nothing ever validated.
 *
 * The root holds the human-facing page and nothing else. Every machine address
 * sits under the versioned path, so page routes and machine addresses never have
 * to be untangled later.
 */

import { cpSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** One file of the published site: where it comes from, where it is served. */
export interface PublishedFile {
  /** Path in the repository, relative to its root. */
  source: string;
  /** Path under the published site, and therefore the path in the URL. */
  published: string;
}

/**
 * Everything the site serves. `api/` partitions the machine addresses away from
 * the page routes at the root, and `v1` changes only when a consumer reading the
 * current version correctly would misread the new document.
 */
export const publishedFiles: readonly PublishedFile[] = [
  { source: 'public/index.html', published: 'index.html' },
  { source: 'openspec-schemas.json', published: 'api/v1/openspec-schemas.json' },
  { source: 'schema/openspec-schemas.schema.json', published: 'api/v1/schema.json' },
];

/** The prefix every machine address sits under, which the root never encroaches on. */
export const versionedPrefix = 'api/v1/';

/** Raised when the output directory is one it would be reckless to empty. */
export class PublishError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PublishError';
  }
}

/** The repository root, found from this module rather than from the caller's cwd. */
export function repositoryRoot(): string {
  return fileURLToPath(new URL('../../', import.meta.url));
}

/**
 * The output directory is emptied before it is filled, so that a stale file from
 * an earlier assembly cannot be published. That makes it worth refusing a target
 * that holds anything other than a previous assembly.
 */
function refuseUnsafeTarget(outputDir: string, root: string): void {
  const toRoot = relative(outputDir, root);
  if (toRoot === '' || (!toRoot.startsWith('..') && !isAbsolute(toRoot))) {
    throw new PublishError(
      `${outputDir}: refusing to assemble into a directory that contains the repository`,
    );
  }

  let existing: string[];
  try {
    existing = readdirSync(outputDir);
  } catch {
    return;
  }

  const expected = new Set(publishedFiles.map((file) => file.published.split('/')[0]));
  const unexpected = existing.filter((name) => !expected.has(name));
  if (unexpected.length > 0) {
    throw new PublishError(
      `${outputDir}: refusing to empty a directory holding ${unexpected.join(', ')}`,
    );
  }
}

/**
 * Copy the published files into `outputDir` and return their published paths.
 *
 * Nothing is written to the root of the output, and nothing beyond these files is
 * written at all.
 */
export function assembleSite(outputDir: string, root: string = repositoryRoot()): string[] {
  const target = resolve(outputDir);
  refuseUnsafeTarget(target, resolve(root));

  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });

  for (const file of publishedFiles) {
    const from = join(root, file.source);
    try {
      statSync(from);
    } catch {
      throw new PublishError(`${from}: the file to publish does not exist`);
    }
    const to = join(target, file.published);
    mkdirSync(dirname(to), { recursive: true });
    cpSync(from, to);
  }

  return publishedFiles.map((file) => file.published);
}
