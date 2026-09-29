## Why

`openspec-schemas.json` is already reachable, over raw.githubusercontent and over jsDelivr,
because a public repository publishes itself whether or not anyone decided to. What does not
exist is a committed address: a URL this project promises, that a consumer can hold us to.

A consumer exists now. A TUI is being written against the registry, and the moment it bakes a
URL in, changing that URL becomes a breaking change for someone other than us.

Epic: [.beans/openspec-schema-registry-9hi8--publish-at-a-stable-url.md](../../../.beans/openspec-schema-registry-9hi8--publish-at-a-stable-url.md)

## What Changes

- **The canonical URL becomes
  `https://registry.speclib.org/api/v1/openspec-schemas.json`**, served by AWS Amplify
  Hosting from account 104144963194, which is where `speclib.org` DNS already lives. Its
  JSON Schema sits beside it at `https://registry.speclib.org/api/v1/schema.json`.
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
- **No framework.** The published site is a directory of static files. The registry is a
  JSON file at a stable URL, so a page can fetch it rather than bake it, which leaves the
  site with no data dependency and therefore nothing to compile. The build that does exist
  validates and copies, and is the publication gate rather than a compilation step.
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

- **New**: the published site directory, an `amplify.yml` that validates and assembles it,
  and `openspec/specs/registry-publication/spec.md` after archiving.
- **Changed**: `openspec-schemas.json` gains an absolute `$schema`,
  `schema/openspec-schemas.schema.json` gains an `$id`, and the README documents the URL.
- **Completes**: `openspec-schema-registry-9hi8`.
- **Prepares**: `openspec-schema-registry-h885`, which puts a page at `/` fetching
  `/api/v1/openspec-schemas.json`. This change reserves that root and does not use it.
- **Depends on a change in another repository**: the Amplify app, its `main` branch and its
  domain association for `registry.speclib.org` are declared in
  `wasnel-awsaccount-104144963194-main`, which already owns the `speclib.org` zone. Amplify
  writes the certificate validation records and the host record into that zone itself, so
  nothing here configures DNS. Until that app exists, nothing is promised as canonical and
  the raw URL is what a consumer uses.
- **Connecting Amplify needs a GitHub token**, held as an SSM SecureString in that AWS
  account. The repository is public, but Amplify still needs a token to read it and to
  install its webhook.
- **Claims one hostname, not the domain**: the association claims
  `registry.speclib.org` only. A later Amplify app can take the apex, because the constraint
  is one CloudFront distribution per hostname rather than one app per domain. Doing so from
  the Amplify console would take the whole domain and break this association, so it has to be
  declared, not clicked.
- **Not included**: reproducible releases in the sense of versioned snapshots of the registry
  file. The registry is a catalogue whose contents change as entries arrive, and a consumer
  that needs a fixed copy pins a commit through the raw URL. Adding `v1` to the path covers
  the shape, which is the part a consumer cannot recover from on its own.
