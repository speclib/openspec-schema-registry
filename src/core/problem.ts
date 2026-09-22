/**
 * A single thing wrong with the registry, described for the person who caused it.
 *
 * Problems carry the entry's `id` rather than its position, because a contributor
 * knows their entry is `kmhalvin/qrspi` and has no idea it is element 8.
 */
export interface Problem {
  /** The entry the problem belongs to, or null for a problem with the document itself. */
  entry: string | null;
  /** The field at fault, written as a reader would say it, such as `source.path`. */
  field: string | null;
  /** The rule, stated in a sentence. */
  message: string;
}

/**
 * Group problems under the entry they belong to and render them for a terminal.
 * Document-level problems come first, under the file's own name.
 */
export function formatProblems(problems: Problem[], file: string): string {
  if (problems.length === 0) {
    return '';
  }

  const order: (string | null)[] = [];
  const grouped = new Map<string | null, Problem[]>();
  for (const problem of problems) {
    const existing = grouped.get(problem.entry);
    if (existing) {
      existing.push(problem);
    } else {
      order.push(problem.entry);
      grouped.set(problem.entry, [problem]);
    }
  }

  const blocks = order.map((entry) => {
    const heading = entry ?? file;
    const lines = (grouped.get(entry) ?? []).map((problem) => {
      const where = problem.field ? `${problem.field}: ` : '';
      return `  ${where}${problem.message}`;
    });
    return [`${heading}`, ...lines].join('\n');
  });

  const count = problems.length === 1 ? '1 problem' : `${problems.length} problems`;
  return `${blocks.join('\n\n')}\n\n${count} in ${file}`;
}
