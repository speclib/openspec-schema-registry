import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { validateRegistry } from '../src/core/validate.js';
import { formatProblems } from '../src/core/problem.js';

function fixture(name: string): string {
  return fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
}

const registryFile = fileURLToPath(new URL('../openspec-schemas.json', import.meta.url));

function messagesFor(name: string): string[] {
  return validateRegistry(fixture(name)).map((problem) =>
    [problem.entry, problem.field, problem.message].filter(Boolean).join(' '),
  );
}

describe('a JSON Schema describes the registry file', () => {
  it('accepts a conforming registry', () => {
    expect(validateRegistry(fixture('valid.json'))).toEqual([]);
  });

  it('accepts a document carrying a schema pointer', () => {
    expect(validateRegistry(fixture('valid-with-schema-key.json'))).toEqual([]);
  });

  it('rejects an unrelated top-level key', () => {
    expect(messagesFor('unknown-top-level-key.json').join('\n')).toContain('generated_at');
  });

  it('names a missing required field', () => {
    const problems = validateRegistry(fixture('missing-artifacts.json'));

    expect(problems).toHaveLength(1);
    expect(problems[0]?.entry).toBe('a/one');
    expect(problems[0]?.message).toBe('artifacts is required and is missing.');
  });

  it('rejects a maintainer field, which the entry model excludes', () => {
    expect(messagesFor('maintainer-field.json').join('\n')).toContain('maintainer is not a field');
  });

  it('rejects an id that is not lowercase', () => {
    expect(messagesFor('uppercase-id.json').join('\n')).toContain('does not match');
  });

  it('rejects an empty artifacts list', () => {
    expect(messagesFor('empty-artifacts.json').join('\n')).toContain('at least 1 item');
  });

  it('rejects superseded_by on an entry that is not deprecated', () => {
    expect(messagesFor('superseded-while-active.json').join('\n')).toContain(
      'only allowed on an entry whose status is deprecated',
    );
  });
});

describe('rules a JSON Schema cannot express are checked in code', () => {
  it('names both positions of a duplicated id', () => {
    const problems = validateRegistry(fixture('duplicate-id.json'));

    expect(problems).toHaveLength(1);
    expect(problems[0]?.entry).toBe('a/one');
    expect(problems[0]?.message).toContain('positions 1 and 2');
  });

  it('says which two entries a misplaced entry belongs between', () => {
    const problems = validateRegistry(fixture('out-of-order.json'));

    expect(problems.length).toBeGreaterThan(0);
    expect(problems.map((problem) => problem.message).join('\n')).toContain(
      'between a/one and z/nine',
    );
  });

  it('rejects a supersession naming an entry that is not present', () => {
    const problems = validateRegistry(fixture('dangling-supersession.json'));

    expect(problems).toHaveLength(1);
    expect(problems[0]?.field).toBe('superseded_by');
    expect(problems[0]?.message).toContain('which no entry in the registry carries');
  });
});

describe('optional fields no real entry uses', () => {
  it('accepts every optional field with a valid value', () => {
    expect(validateRegistry(fixture('all-optional-fields.json'))).toEqual([]);
  });

  it('rejects a status outside the enum', () => {
    expect(messagesFor('bad-status.json').join('\n')).toContain('"retired" is not allowed');
  });

  it('rejects a language that is not a tag', () => {
    expect(messagesFor('bad-language.json').join('\n')).toContain('does not match');
  });

  it('rejects an unknown key under requires', () => {
    expect(messagesFor('bad-requires.json').join('\n')).toContain('node is not a field');
  });
});

describe('a failure is addressed to the person who caused it', () => {
  it('reports a description over the limit with its length and its text', () => {
    const problems = validateRegistry(fixture('long-description.json'));

    expect(problems[0]?.entry).toBe('a/one');
    expect(problems[0]?.field).toBe('description');
    expect(problems[0]?.message).toContain('is 118 characters. The limit is 100, so trim 18.');
    expect(problems[0]?.message).toContain('xxx');
  });

  it('suggests the nearest field for a misspelling', () => {
    const problems = validateRegistry(fixture('licence-typo.json'));

    expect(problems[0]?.message).toBe('licence is not a field. Did you mean license?');
  });

  it('does not guess when nothing is close', () => {
    const message = validateRegistry(fixture('unrecognisable-field.json'))[0]?.message ?? '';

    expect(message).toContain('zzzzzzzz is not a field');
    expect(message).not.toContain('Did you mean');
    expect(message).toContain('The fields are');
  });

  it('reports every problem in one run, grouped per entry', () => {
    const problems = validateRegistry(fixture('two-entries-two-problems-each.json'));

    expect(problems).toHaveLength(4);
    const rendered = formatProblems(problems, 'openspec-schemas.json');
    expect(rendered).toContain('a/one');
    expect(rendered).toContain('b/two');
    expect(rendered).toContain('4 problems in openspec-schemas.json');
    expect(rendered.indexOf('a/one')).toBeLessThan(rendered.indexOf('b/two'));
  });

  it('renders nothing when there are no problems', () => {
    expect(formatProblems([], 'openspec-schemas.json')).toBe('');
  });

  it('counts a single problem in the singular', () => {
    const rendered = formatProblems(
      [{ entry: 'a/one', field: 'id', message: 'is wrong.' }],
      'f.json',
    );

    expect(rendered).toContain('1 problem in f.json');
  });

  it('files a document-level problem under the file name', () => {
    const rendered = formatProblems([{ entry: null, field: null, message: 'is broken.' }], 'f.json');

    expect(rendered.startsWith('f.json')).toBe(true);
  });
});

describe('the shipped registry', () => {
  it('validates', () => {
    expect(formatProblems(validateRegistry(registryFile), 'openspec-schemas.json')).toBe('');
  });
});
