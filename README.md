# openspec-schema-registry

[![Sources](https://github.com/speclib/openspec-schema-registry/actions/workflows/check-sources.yml/badge.svg)](https://github.com/speclib/openspec-schema-registry/actions/workflows/check-sources.yml)

Registry of openspec schemas in the wild.

## Registry entry

`openspec-schemas.json` lists schemas you install from a source. The `spec-driven` schema
built into the OpenSpec CLI is not listed, because it is present in a project without being
installed, so a tool showing every schema available to a project merges the built-in list
with this registry.

[docs/registry-entry.md](docs/registry-entry.md) is the field reference: what an entry must
carry, what each optional field means when absent, and where an installed schema lands.

[docs/registry-inclusion.md](docs/registry-inclusion.md) covers what gets listed: the two
admission tests, why entries are sorted by `id`, and how an author who was listed without
asking can correct or withdraw their entry.

## Sources

Twelve of the thirteen entries resolve at their repository's default branch, so a schema can
be renamed, restructured or deleted upstream without any change here. A workflow checks every
entry against its source on each push, on each contribution, and nightly. The badge above
reports the result.

Run it yourself with `npm run check-sources`. When it is red, the report says which class
each difference belongs to:

- **fatal**: the source no longer resolves. Anyone following the entry gets nothing, so the
  entry needs correcting or removing.
- **semantic**: `name` changed upstream. That changes both the directory the schema installs
  into and the `--schema` argument, so it needs a decision rather than a correction: is it
  still the same schema?
- **benign**: `artifacts` changed upstream. Nothing a consumer does breaks while our copy is
  stale, and the fix is a one-line edit. It still fails the check, so that a green badge means
  every entry matches its source rather than meaning nothing is badly broken.

An entry the check could not reach is reported separately and does not fail the run. A badge
that flips on a network blip is a badge people learn to ignore.

## Dependency hash

`nix flake check` builds the npm project through `buildNpmPackage`, which needs the hash of
the fetched npm dependencies. That hash lives in `nix/npm-deps-hash.txt` and changes
whenever `package-lock.json` does.

When it no longer matches, the gate fails with a hash mismatch and prints the value it
expected:

```
specified: sha256-AAAA...
   got:    sha256-n4Z4...
```

Copy the `got:` value into `nix/npm-deps-hash.txt`, stage it, and run the gate again. Nix
reads the flake from the git tree, so an unstaged file is invisible to it.
