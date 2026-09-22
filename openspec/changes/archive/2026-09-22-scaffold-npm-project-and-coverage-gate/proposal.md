## Why

`nix flake check` is the gate every change in this repository has to pass, and it currently
fails for two reasons that no planning change can fix. `build-test-coverage` fails
unconditionally because there is no `package-lock.json`, and `registry-json` fails because
`openspec-schemas.json` does not exist. Until both are addressed, no change can be
archived, committed or pushed through `scripts/ship-change.sh`.

This change makes the gate runnable. It is the smallest npm project that satisfies it
honestly: a real module with real tests, rather than a stub that games the coverage
threshold.

Epic: [.beans/openspec-schema-registry-66lh--test-suite-and-coverage-gate.md](../../../.beans/openspec-schema-registry-66lh--test-suite-and-coverage-gate.md)

## What Changes

- **An npm project is created**: `package.json`, `tsconfig.json`, a vitest configuration,
  and `package-lock.json`, with the npm dependency hash recorded in
  `nix/npm-deps-hash.txt` so `nix flake check` can build it.
- **A core module reads the registry file.** `src/core/` gains a loader that reads
  `openspec-schemas.json`, rejects a malformed document, and returns its entries. This is
  the module everything downstream builds on, and it is what the 80% core coverage
  threshold applies to.
- **`openspec-schemas.json` is created empty**, as a top-level object with an empty
  `schemas` array. The flake treats a parsing registry file as an invariant independent of
  the npm project around it, so the file exists from this change onward and
  `openspec-schema-registry-ir8u` fills it.
- **`npm test` and `npm run coverage` work**, with coverage written as a `json-summary`
  report because the flake's gate reads `coverage/coverage-summary.json`.
- **The gate goes green**, so subsequent changes can ship.

## Capabilities

### New Capabilities
- `registry-loading`: reading the registry file into memory, and what happens when the file
  is missing, unparseable, or shaped wrongly.

### Modified Capabilities

None.

## Impact

- **New**: `package.json`, `package-lock.json`, `tsconfig.json`, the vitest config,
  `src/core/`, `test/`, `nix/npm-deps-hash.txt`, `openspec-schemas.json`, and
  `openspec/specs/registry-loading/spec.md` after archiving.
- **Unblocks**: every other change in the repository, since none of them can pass the gate
  today.
- **Partially delivers** `openspec-schema-registry-66lh`. That epic also wants a suite that
  checks entry conformance, unique ids and resolvable sources, which needs the JSON Schema
  from `openspec-schema-registry-c0d7` and real entries from `openspec-schema-registry-ir8u`.
  Those arrive later, so the epic stays open after this change.
- **Not included**: `npm run validate`, documented in `CLAUDE.md`, needs the JSON Schema
  that `openspec-schema-registry-c0d7` writes. It stays absent until then.
