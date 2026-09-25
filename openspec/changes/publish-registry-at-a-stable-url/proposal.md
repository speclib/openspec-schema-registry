## Why

`openspec-schemas.json` is already reachable, over raw.githubusercontent and over jsDelivr,
because a public repository publishes itself whether or not anyone decided to. What does not
exist is a committed address: a URL this project promises, that a consumer can hold us to.

A consumer exists now. A TUI is being written against the registry, and the moment it bakes a
URL in, changing that URL becomes a breaking change for someone other than us.

Epic: [.beans/openspec-schema-registry-9hi8--publish-at-a-stable-url.md](../../../.beans/openspec-schema-registry-9hi8--publish-at-a-stable-url.md)

## What Changes

- **The canonical URL becomes
  `https://registry.speclib.org/api/v1/openspec-schemas.json`**, served from GitHub Pages on
  a custom subdomain. Its JSON Schema sits beside it at
  `https://registry.speclib.org/api/v1/schema.json`.
- **The published file is byte-identical to the one in the repository.** Nothing is
  generated, rewritten or reordered on the way out, so what a consumer fetches is what
  `npm run validate` checked.
- **`$schema` changes from a relative path to the absolute published URL**, and the JSON
  Schema gains the matching `$id`. A relative pointer breaks as soon as a consumer caches the
  file locally, which is exactly what a TUI does.
- **`v1` gains a defined meaning.** The version in the path changes when a consumer that
  reads `v1` correctly would misread the new document. Adding entries or optional fields is
  not that. When a `v2` appears, `v1` keeps being served.
- **Publishing is gated on validation.** An invalid registry never reaches the URL.
- **No site build.** The published site is a directory of static files. The registry is a
  JSON file at a stable URL, so a page can fetch it rather than bake it, which leaves the
  site with no data dependency and therefore nothing to compile.
- **The raw URL is documented as a permanent fallback**, unversioned and outside the
  contract, since a public repository serves it whether we promise it or not.

## Capabilities

### New Capabilities
- `registry-publication`: where the registry is published, what a consumer may rely on at
  that address, what the version in the path means, and what is deliberately promised about
  nothing else.

### Modified Capabilities
- `registry-file`: the document's `$schema` becomes the absolute published URL rather than a
  relative path, so the requirement describing that key changes.

## Impact

- **New**: the published site directory, a GitHub Actions workflow that deploys it, a `CNAME`
  file, and `openspec/specs/registry-publication/spec.md` after archiving.
- **Changed**: `openspec-schemas.json` gains an absolute `$schema`,
  `schema/openspec-schemas.schema.json` gains an `$id`, and the README documents the URL.
- **Completes**: `openspec-schema-registry-9hi8`.
- **Prepares**: `openspec-schema-registry-h885`, which puts a page at `/` fetching
  `/api/v1/openspec-schemas.json`. This change reserves that root and does not use it.
- **Blocked on DNS**: `registry.speclib.org` does not resolve yet. The `CNAME` file must land
  only after it does, because GitHub treats a configured custom domain as authoritative and
  redirects the github.io address to it, so committing it early makes the site unreachable at
  both addresses.
- **Not included**: reproducible releases in the sense of versioned snapshots of the registry
  file. The registry is a catalogue whose contents change as entries arrive, and a consumer
  that needs a fixed copy pins a commit through the raw URL. Adding `v1` to the path covers
  the shape, which is the part a consumer cannot recover from on its own.
