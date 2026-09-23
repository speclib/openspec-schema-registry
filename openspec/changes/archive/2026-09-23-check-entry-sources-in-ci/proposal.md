## Why

Twelve of the registry's thirteen entries resolve at their repository's default branch, so
upstream can rename a schema, restructure its artifacts, or delete the directory, and this
repository would never know. `npm run validate` cannot catch any of it: it runs inside a
sandbox with no network, deliberately, so that it gates every change.

The registry is already safe from a malformed entry. It is not safe from a rotten one. That
is the half of this epic still open, and it is the last thing standing between the registry
and being published.

Epic: [.beans/openspec-schema-registry-66lh--test-suite-and-coverage-gate.md](../../../.beans/openspec-schema-registry-66lh--test-suite-and-coverage-gate.md)

## What Changes

- **A source check fetches each entry's `schema.yaml`** and compares it against the entry:
  does the source resolve, does `name` still match, do `artifacts` still match. One fetch
  answers all three.
- **Differences are classified rather than lumped together.** A transient failure is not
  drift. A missing source is fatal. A changed `name` is semantic, because it changes both
  the install directory and the `--schema` argument. A changed `artifacts` list is benign,
  because nothing a consumer does breaks while our copy is stale.
- **Every real class fails the check, and transient failures do not.** Benign drift fails
  too: the fix is a one-line commit, and a badge that means "everything matches upstream" is
  worth more than one that means "nothing is catastrophically broken". A transient failure
  is retried, and a check that still cannot reach a source reports that it could not tell
  rather than claiming drift.
- **This repository gets its first GitHub Actions workflow**, with three triggers: a push to
  `main` touching `openspec-schemas.json`, a pull request touching it, and a nightly
  schedule over every entry. The push trigger matters most today, because
  `scripts/ship-change.sh` pushes straight to `main` and this project has never opened a
  pull request.
- **A badge in the README reports the result.** One workflow means one badge, and a
  workflow badge reflects the latest run on the default branch, so pull request runs do not
  colour it.
- **The classification is pure and the fetching is thin**, mirroring the offline validator:
  comparing an entry against a parsed `schema.yaml` is a function in `src/core/` tested with
  fixtures, and a separate command fetches, retries and reports.
- **`npm run check-sources` runs the same thing by hand**, so a contributor can check an
  entry before it is submitted and a maintainer can check after a nightly failure.

## Capabilities

### New Capabilities
- `source-checking`: what it means for an entry to still match its source, how a difference
  is classified, and what a check does when it cannot reach a source at all.

### Modified Capabilities

None. `registry-validation` covers what can be checked offline and is unchanged; this
capability covers what cannot.

## Impact

- **New**: `.github/workflows/`, the classifier in `src/core/`, a fetching command, a
  `check-sources` npm script, a README badge, a YAML parser as a development dependency,
  and `openspec/specs/source-checking/spec.md` after archiving.
- **Completes**: `openspec-schema-registry-66lh`, and with it the
  `openspec-schema-registry-7pxx` milestone.
- **Unblocks**: `openspec-schema-registry-9hi8`. Publishing a catalogue nobody checks for
  rot means publishing something that gets worse over time.
- **Not in the gate**: `nix flake check` is unchanged. It builds without network, so the
  source check cannot run there and does not try.
- **Deliberately out of scope**: running `openspec schema validate` against each entry
  nightly, which would mean downloading every schema directory and installing the OpenSpec
  CLI in CI. The admission rule already puts that check on the reviewer at the moment an
  entry is admitted. Also out of scope: reporting that a pinned entry has fallen behind a
  newer upstream tag, which is an opportunity rather than a fault and would dilute the
  signal.
