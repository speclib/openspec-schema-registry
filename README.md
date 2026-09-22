# openspec-schema-registry
Registry of openspec schemas in the wild.

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
