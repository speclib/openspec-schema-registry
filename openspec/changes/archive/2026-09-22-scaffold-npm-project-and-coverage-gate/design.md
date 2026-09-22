## Context

See proposal.md for motivation. The shape of this change is dictated almost entirely by
what `flake.nix` already demands, so the constraints are worth stating plainly:

- `buildNpmPackage` needs `package-lock.json` and a recorded dependency hash in
  `nix/npm-deps-hash.txt`. Without the lock file the flake substitutes a derivation that
  fails on purpose.
- The coverage gate reads `coverage/coverage-summary.json`, so the coverage run has to emit
  a `json-summary` report.
- The thresholds are 70% lines overall and 80% lines for anything matching `/src/core/`.
  The core threshold is skipped when no file matches, which means putting code under
  `src/core/` opts into the stricter number.
- A separate check requires `openspec-schemas.json` to exist and parse, independently of
  the npm project.

## Goals / Non-Goals

**Goals:**
- A gate that runs and passes, on code that deserves to pass it.
- A loader other changes can build on rather than replace.

**Non-Goals:**
- Validating entries against a JSON Schema. That is `openspec-schema-registry-c0d7`.
- Checking that entries resolve upstream. That is the rest of
  `openspec-schema-registry-66lh`, and it needs entries to exist first.
- Any CLI, build output or published artifact. Nothing consumes this module yet.

## Decisions

### The scaffold ships a real module, not a placeholder

The temptation with a coverage gate is to write whatever makes the number go green. A
loader is the honest minimum instead: every later piece of this project, the schema
validation, the resolution tests, the published file, starts by reading
`openspec-schemas.json`. Writing it now means the 80% core threshold is earned by tests
that will still be meaningful when the registry has entries in it.

It also fixes the failure behaviour early. A loader that returns an empty list for a
missing file would make every later check silently pass on a typo'd path, so the spec
requires an error that names the file.

### `openspec-schemas.json` is created here, empty

The registry file logically belongs to `openspec-schema-registry-ir8u`, which writes the
entries. It is created here anyway, because the flake treats a parsing registry file as an
invariant that holds regardless of the npm project, so no change can pass the gate until it
exists. Creating it empty keeps the ownership clean: this change makes the file exist, the
seed change decides what goes in it, and the envelope it uses is the one the seed change's
own spec settles.

The alternative was reordering the work so the seed ships first. Rejected because the seed
needs the entry model settled, and the entry model change is documentation only, so it
would still be stuck behind the same gate.

### The core threshold is opted into deliberately

Code placed under `src/core/` faces 80% rather than 70%. The loader could have been written
outside that directory to avoid the stricter number. Putting it inside is the point: the
part of this project that everything else depends on is the part worth holding to a higher
standard, and the gate was written that way on purpose.

## Risks / Trade-offs

- **The npm dependency hash is environment-sensitive.** `nix/npm-deps-hash.txt` has to match
  what npm actually fetched, and it changes whenever dependencies change. → The flake prints
  the expected hash when it mismatches, so the repair path is mechanical. Worth noting in
  the repository documentation so the next person is not surprised.
- **A small codebase makes coverage percentages volatile.** With few lines under
  `src/core/`, one uncovered branch can swing the figure past the threshold. → Accepted
  while the module is small; the numbers stabilise as the suite grows.
- **This change partially delivers its epic.** `openspec-schema-registry-66lh` also wants
  conformance and resolution checks that cannot be written yet. → The epic stays open, and
  the proposal says so, rather than the bean being closed on a half-delivery.

## Open Questions

- Whether the eventual test suite fetches third-party repositories from inside
  `nix flake check`. A sandboxed Nix build has no network access, so those checks likely
  belong to GitHub Actions instead. It does not affect this change, and
  `openspec-schema-registry-66lh` has to answer it when it writes them.
