# openspec-schema-registry

[![Sources](https://github.com/speclib/openspec-schema-registry/actions/workflows/check-sources.yml/badge.svg)](https://github.com/speclib/openspec-schema-registry/actions/workflows/check-sources.yml)

Registry of openspec schemas in the wild.

## Fetching the registry

```
https://registry.speclib.org/api/v1/openspec-schemas.json
https://registry.speclib.org/api/v1/schema.json
```

That is the address this project supports, and three things hold at it:

- **The address is stable.** It does not move while the version stays the same.
- **The contents change.** The registry is a catalogue, so entries arrive, get corrected
  and get deprecated. Both of two fetches that return different things were correct.
- **One request is enough.** The response carries every entry, so nothing has to be paged
  or followed.

The published file is byte-identical to `openspec-schemas.json` in this repository. Nothing
is generated, reordered or added on the way out, so what you fetch is what `npm run validate`
checked. A deploy only happens when that validation passes; when it fails the previous
document stays in place.

The root of the site serves a placeholder page, kept in `public/index.html`. Every machine
address stays under `/api/v1/`, so the page and the registry never collide.

### What `v1` means

The version changes when a consumer that reads the current version correctly would misread
the new document. Adding an entry, correcting an entry, and adding an optional field are not
that. Renaming a field, adding a required one, or changing what an existing field means are.

When a `v2` is published, `v1` keeps being served. That is the whole point of the segment.

### The raw URL, and pinning a commit

GitHub serves the same file directly:

```
https://raw.githubusercontent.com/speclib/openspec-schema-registry/main/openspec-schemas.json
```

This one sits outside the contract. It is unversioned, it is not what the project promises,
and its shape changes with the file. Use it as a fallback when the canonical address is
unreachable, since it keeps working for as long as this repository is public.

It is also where you pin. The canonical address always serves the current registry and offers
no way to ask for an older one, so a consumer that needs a fixed copy swaps `main` for a
commit sha and fetches that.

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
