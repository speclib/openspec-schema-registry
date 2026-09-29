---
# openspec-schema-registry-9hi8
title: Publish at a stable URL
status: completed
type: epic
priority: normal
created_at: 2026-09-22T14:05:24Z
updated_at: 2026-09-29T00:00:00Z
parent: openspec-schema-registry-7cot
openspec-link: openspec/changes/archive/2026-09-29-publish-registry-at-a-stable-url
---

Pick and document the canonical URL for openspec-schemas.json, and make releases reproducible.

## Summary of Changes

The registry is published at `https://registry.speclib.org/api/v1/openspec-schemas.json`,
with its JSON Schema beside it at `/api/v1/schema.json`. AWS Amplify serves it from account
104144963194, which already held the `speclib.org` zone, so Amplify wrote the certificate
and host records itself and no DNS was authored anywhere.

Measuring first reframed the epic. The file was already reachable over raw.githubusercontent
and jsDelivr, because a public repository publishes itself. So nothing here made the file
reachable; it committed to one address. Every segment was chosen against what its absence
would cost forever rather than against taste, since Amplify serves redirects and that makes a
move survivable but never free.

`$schema` became the absolute published URL and the schema gained the matching `$id`, both
deferred from `openspec-schema-registry-c0d7` until an address existed. A relative pointer
breaks the moment a consumer caches the document, which is what the TUI that prompted this
epic does.

The published file is byte-identical to the repository's. A `generated_at` was refused: the
registry is hand-authored and validated as it stands, so a generated field would be the one
part of the document validation never saw, and HTTP already answers the freshness question
through ETag and Last-Modified.

`amplify.yml` runs `npm run validate` before `npm run assemble-site`, which puts the gate in
the one place a push to `main` cannot bypass. No framework was adopted: the registry is the
published product at a fixed URL, so the page in `openspec-schema-registry-h885` can fetch it
rather than bake it, leaving the site with nothing to compile. The root is left empty and
answers 404 until that page ships.

The half of this that declares the Amplify app, its branch and its domain association lives
in `wasnel-awsaccount-104144963194-main`, beside the zone it writes into. The association
claims `registry.speclib.org` only, so the apex stays free, and it is edited there rather
than in the console, which would take the whole domain.

Reproducible releases were dropped as a goal. The registry is a catalogue whose contents
change as entries arrive; a consumer needing a fixed copy pins a commit through the raw URL,
which the README documents as a fallback outside the contract.
