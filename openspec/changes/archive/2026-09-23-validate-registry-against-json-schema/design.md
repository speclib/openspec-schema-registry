## Context

See proposal.md for motivation. The design is driven by three facts discovered before
writing it.

**JSON Schema cannot express the registry's central invariant.** `id` is the only unique
handle an entry has, and JSON Schema has `uniqueItems` for whole array elements but no
uniqueness by a property, and no ordering at all. So the bean's framing, a meta-schema that
validates the file, is not achievable by a schema alone.

**The gate has no network.** `nix flake check` builds in a sandbox, so anything that
resolves an entry's source cannot run there.

**The data exercises half the model.** Of the twelve fields the entry model defines, the
13 seeded entries use six in every entry, `license` in twelve, `source.ref` in one, and
`status`, `superseded_by`, `language` and `requires.openspec` in none. The schema is
therefore the only machine-readable definition those four have.

## Goals / Non-Goals

**Goals:**
- Make a malformed registry unshippable.
- Give a schema author a failure they can act on without knowing JSON Schema.
- One definition of valid, shared by the gate and the contributor.

**Non-Goals:**
- Checking anything that needs the network. That is `openspec-schema-registry-66lh`.
- Publishing the schema or giving it a canonical URI. That is
  `openspec-schema-registry-9hi8`.
- Adding GitHub Actions. The gate already fails on an invalid file through the test suite.

## Decisions

### The schema is the source of truth for shape, and code covers the rest

The split follows what each mechanism can actually do:

```
   JSON Schema        required fields, types, id pattern, description maxLength,
                      status enum, source shape, superseded_by implies deprecated,
                      unknown fields rejected

   code               id unique across entries
                      entries sorted ascending by id
                      superseded_by names an entry that exists

   not here           source resolves, name and artifacts match upstream (network)
                      the repository publishes the schema for reuse (human)
```

Writing the shape rules in code as well would duplicate the schema, and the schema has to
exist anyway because editors read it. Writing the other three in the schema is not
possible. So the boundary is drawn by capability rather than by preference.

### `additionalProperties: false`

The usual objection is that strictness makes adding a field a breaking change. It does not
here, because the schema and the data ship in the same commit and can never disagree.

Strictness earns its place twice over. It is the only enforcement anywhere of the
requirement that an entry carries no maintainer field, which is otherwise a sentence in a
spec that nothing checks. And the error it catches most often will be a misspelling,
`licence` for `license`, which a permissive schema would accept while the field silently
did nothing.

One trap comes with it: a document-level `additionalProperties: false` that lists only
`schemas` would reject the `$schema` key this change adds. The document schema names both.

### Validation stays offline, and the gate runs it through the tests

The sandbox settles the first half. The second half is about avoiding two definitions of
valid: if `npm run validate` had its own rules and the test suite had others, they would
drift within a month.

So the validator is a function in `src/core/`, the test suite calls it against the real
registry file, and `npm run validate` is a thin command over the same function. The gate
already runs the tests, so no flake change is needed to enforce it. The four assertions in
`test/registry.test.ts` written during the seed change, checking unique ids, sort order and
description length by hand, were a stand-in for this and are replaced by one call.

### `check-jsonschema` leaves the dev shell

It can validate shape and nothing else, so with the validator in place it is a second tool
covering a subset of one job. Removing it means one answer to the question "how do I check
this file".

### Errors are written for a schema author

The register matters here, because the people who hit these errors are schema authors
submitting an entry, not maintainers of this repository. ajv's output is addressed to
whoever wrote the schema:

```
   /schemas/8/description must NOT have more than 100 characters
```

That names a position nobody knows, states a rule in schema vocabulary, and withholds the
value. Four properties fix it, each a deliberate choice rather than a library default:

- **Identify by `id`, never by index.** A contributor knows their entry is
  `kmhalvin/qrspi`. Nobody knows it is element 8.
- **State the rule and show the value.** "118 characters, the limit is 100" beats "must NOT
  have more than 100 characters", and printing the text saves a round trip to the file.
- **Suggest the nearest field on an unknown key.** Strict mode exists to catch `licence`,
  so the message should answer it rather than only reject it.
- **Report everything at once, grouped per entry.** Stopping at the first error turns one
  bad entry into several runs.

Ordering and uniqueness get the same treatment: which two entries a misplaced entry belongs
between, and both positions of a duplicated `id`.

This is the bulk of the work. The schema itself is a few dozen lines.

### `$id` and a schema version are deferred

Both describe external consumption, and nothing external consumes the schema yet. A version
number would be a field to maintain that no reader uses while the schema and the data ship
together. An `$id` written today would name a URL that does not resolve, which is worse
than no `$id`, because tooling may try to fetch it. Both become real when
`openspec-schema-registry-9hi8` publishes the file, and adding them then breaks nothing.

The data file's `$schema` is the exception and is added now, because it is what wires up
editors, which the epic asks for. It is a relative path so it works in the repository
without a published URL, leaving the published case to `9hi8`.

## Risks / Trade-offs

- **Four fields have no data behind them.** `status`, `superseded_by`, `language` and
  `requires.openspec` appear in no entry, so a mistake in how the schema defines them is
  invisible. → Test the schema against hand-written fixtures that use them, not only
  against the real registry.
- **A good message layer can drift from the schema.** Add a field to the schema and the
  message layer may describe it generically or not at all. → Keep the layer driven by ajv's
  error objects rather than by a hand-written list of rules, so an unmapped error still
  produces something usable.
- **Strictness will reject a well-meant extension.** Someone will add a field they find
  useful and be refused. → That is the intent, and the message names the defined fields so
  the refusal is instructive rather than blunt.
- **Offline validation can pass on an entry that points nowhere.** A perfectly shaped entry
  with a dead source URL is valid by this change's rules. → Stated plainly rather than
  papered over. The networked half belongs to `openspec-schema-registry-66lh`, and until it
  exists nothing catches a dead source.

## Open Questions

- Whether a future contribution flow wants a validator that accepts a single entry rather
  than a whole file, so a submitter can check their entry before it is placed. It does not
  change the rules, only the entry point, so it can wait for
  `openspec-schema-registry-la9x`.
