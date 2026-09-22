## Why

`openspec-schemas.json` is a contract with 13 entries and nothing checks it. The gate asks
only whether the file is valid JSON. Every rule the `registry-entry` and `registry-file`
capabilities state is currently upheld by whoever edited the file last being careful: six
required fields, a lowercase namespaced `id`, a description within 100 characters, entries
sorted by `id`. A typo ships silently, and `npm run validate` is documented in `AGENTS.md`
but does not exist.

Epic: [.beans/openspec-schema-registry-c0d7--json-schema-for-the-registry-file.md](../../../.beans/openspec-schema-registry-c0d7--json-schema-for-the-registry-file.md)

## What Changes

- **A JSON Schema describes the registry file**, covering what a schema can express: the
  required fields, types, the `id` pattern, the 100-character description cap, the `status`
  enum, the shape of `source`, and a rule that `superseded_by` only appears on a deprecated
  entry.
- **Unknown fields are rejected.** `additionalProperties: false` is what actually enforces
  the requirement that an entry carries no maintainer field, and it catches the mistake a
  contributor will really make, which is `licence` for `license`.
- **Three rules that a JSON Schema cannot express become code**: `id` unique across the
  registry, entries sorted ascending by `id`, and `superseded_by` naming an entry that
  exists. JSON Schema has no uniqueness-by-property and no ordering, so the meta-schema
  alone cannot validate this file.
- **`npm run validate` is one offline command** covering the schema and those three rules.
  It stays offline deliberately: `nix flake check` builds in a sandbox with no network, so
  a validator that resolved upstream sources could not run in the gate. Resolution and
  drift checks stay with `openspec-schema-registry-66lh` and belong in GitHub Actions.
- **Validation errors are written for schema authors, not for JSON tooling.** Errors name
  the entry by its `id` rather than its array index, state the rule in a sentence with the
  offending value, suggest the nearest valid field name for an unknown key, and report
  every problem at once grouped per entry.
- **One implementation, three consumers.** The validator lives in `src/core/`, vitest
  exercises it inside the Nix gate, and `npm run validate` is a thin command over the same
  function. The four hand-written assertions in `test/registry.test.ts` are replaced by a
  call to it.
- **`openspec-schemas.json` gains a `$schema` key** pointing at the schema by a relative
  path, which is what wires up editors. The document schema explicitly permits that key.
- **`check-jsonschema` leaves the dev shell.** It validates shape only, so it cannot do the
  job on its own, and keeping it means two tools for one file.

## Capabilities

### New Capabilities
- `registry-validation`: what makes the registry file valid, which rules live in the JSON
  Schema and which cannot, and what a validation failure tells the person who caused it.

### Modified Capabilities
- `registry-file`: the document may carry a `$schema` key alongside `schemas`, so the
  requirement describing the document's shape changes.

## Impact

- **New**: the JSON Schema file, the validator in `src/core/`, a `validate` npm script,
  tests, and `openspec/specs/registry-validation/spec.md` after archiving.
- **Changed**: `openspec-schemas.json` gains `$schema`, `test/registry.test.ts` loses its
  stand-in assertions, and `flake.nix` drops `check-jsonschema` from the dev shell.
- **Unblocks**: the rest of `openspec-schema-registry-66lh`, whose conformance checks need
  a schema to conform to.
- **Deferred to `openspec-schema-registry-9hi8`**: the schema's `$id` and any version of
  it. Both describe external consumption, and nothing external consumes the schema until it
  is published. Writing a URL now bakes in an address that does not resolve.
- **No CI yet**: this change does not add GitHub Actions. The gate runs the validator
  through the test suite, which is enough to make a malformed file unshippable.
