# openspec-schema-registry
Registry of openspec schemas in the wild.

## Registry entry

`openspec-schemas.json` lists schemas you install from a source. The `spec-driven` schema
built into the OpenSpec CLI is not listed, because it is present in a project without being
installed, so a tool showing every schema available to a project merges the built-in list
with this registry.

[docs/registry-entry.md](docs/registry-entry.md) is the field reference: what an entry must
carry, what each optional field means when absent, and where an installed schema lands.

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
