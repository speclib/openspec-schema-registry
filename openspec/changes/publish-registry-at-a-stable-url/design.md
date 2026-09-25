## Context

See proposal.md for motivation. Four findings from measuring the current situation shaped
this, and the first one reframes the epic.

**The registry is already published.** `raw.githubusercontent.com` serves it with a 300 second
cache and an ETag, and jsDelivr serves it with `application/json`. A live fetch returns the 13
entries. A public repository publishes itself, so nothing here is about making the file
reachable. It is about committing to one address.

**A path can move, and moving it is still a permanent cost.** Amplify serves custom
redirect rules, so a moved path can 301 and an ordinary HTTP client follows it. That makes a
move survivable, not free: the redirect becomes something the project serves forever, every
stored copy points at an address the document has left, and a consumer that recorded the old
URL pays a round trip on every fetch. So an origin moves for free and a path moves at a price
that never stops being paid.

**Amplify binds one hostname to one distribution, not one domain to one app.** Two apps can
serve `speclib.org` as long as they claim different hostnames, provided the associations are
declared through the API rather than added in the console, which insists on taking the whole
domain. So `registry.` costs nothing that the apex might later want.

**`speclib.org` is registered, its zone is managed by nivis in account 104144963194, and
nothing resolves yet.** The domain being available makes the permanent address a choice rather
than a migration. Because the zone and the Amplify app share an account, Amplify writes the
validation records and the host record itself, so no DNS work is authored anywhere.

## Goals / Non-Goals

**Goals:**
- One address this project supports, chosen as though permanent, because it is.
- A published document identical to the validated one.
- A version segment that means something specific.

**Non-Goals:**
- A human-facing page. The root is reserved for `openspec-schema-registry-h885` and left
  empty.
- Versioned snapshots of the registry's contents.
- Replacing the raw URL, which keeps working and is documented as a fallback outside the
  contract.

## Decisions

### Every segment of the address, and why it survives

```
   https://registry.speclib.org/api/v1/openspec-schemas.json
           └────┬───┘ └───┬───┘ └┬┘ └┬┘ └────────┬────────┘
                │         │      │   │           │
                │         │      │   │           the same name as the file in git
                │         │      │   a change a consumer cannot absorb
                │         │      reserves / for the page
                │         .org is the public data domain, .eu is commercial
                one hostname per Amplify app; the apex can take its own later
```

The usual instinct is to strip a URL to its shortest honest form. That instinct is wrong here,
because the costs are asymmetric: a segment included and never used costs one segment forever,
and a segment omitted and later needed costs a redirect the project serves forever and a round
trip on every fetch by a consumer that stored the old address. Amplify makes that recoverable
where GitHub Pages would not have, which lowers the stake without changing the answer. So the
test is not "is this needed today" but "what does its absence cost for the rest of time".

`/api/` looks redundant beside `registry.`, and earns its place as a partition rather than as a
label. It keeps the machine addresses out of the namespace where `h885` will add page routes.

### `$schema` becomes absolute, which also unblocks `$id`

The document currently points at its schema by a relative path, which was correct when no
permanent URL existed. It stops being correct the moment a consumer caches the file:

```
   consumer writes the document to ~/.cache/…/openspec-schemas.json
   the copy says   "$schema": "./schema/openspec-schemas.schema.json"
   nothing is there
```

A TUI caching the registry is not a hypothetical, it is the consumer that prompted this epic.
So the pointer becomes the absolute published URL, and the schema gains the matching `$id`.
That `$id` was deferred here twice, from the JSON Schema epic and again during the seed, for
exactly this reason: it could not be written before an address existed.

Placing the schema at `/api/v1/schema.json` rather than under a nested `schema/` directory
falls out of the pointer being absolute. Once nothing depends on relative resolution, the flat
layout is simpler.

### `v1` gets a definition, or it is decoration

A version in a path is a maintenance promise, so the trigger has to be written down:

> the version changes when a consumer that reads `v1` correctly would misread the new document

Adding entries is not that, and neither is adding an optional field. Renaming `schemas`, adding
a required field, or changing what an existing field means is. When `v2` arrives, `v1` keeps
being served, which is the commitment the segment makes on our behalf.

### The published file is byte-identical

The tempting thing is to add a `generated_at` on the way out, as the neighbouring
`awesome-openspec` does for its site data. It is refused here for two reasons. The registry is
hand-authored and validated as it stands, so a generated field would be the one part of the
document that validation never saw. And the freshness question HTTP already answers, through
the ETag and `Last-Modified` a consumer gets for free.

### A build that validates, and no framework

Amplify deploys what a build produces, so there is a build whether or not the site needs
compiling. That turns out to be where the validation gate belongs: the build runs
`npm run validate`, then copies. A failing build leaves the previous deployment serving, which
is exactly the behaviour the spec asks for, and it puts the gate in the one place that cannot
be bypassed by pushing to `main`.

What stays refused is a framework, and the reason it stays refused once `h885` arrives is
worth recording, because the neighbour's precedent points the other way. `awesome-openspec`
imports its `entries.json` into an Astro page and never serves it, so its page must be rebuilt
whenever the data changes. Our data is the published product at a fixed URL, so a page can
fetch it. That inverts the argument: the site has no data dependency, so it has nothing to
compile.

Adopting a framework later, if `h885` turns out to want components or server rendering, is a
contained change. Adopting one now would be inheritance rather than a decision, and it would
add a second lockfile and a second `npmDepsHash` to a Nix gate that has already gone stale
twice in two changes.

### The buildspec lives here, the app lives with the DNS

The Amplify app, its branch and its domain association are declared in
`wasnel-awsaccount-104144963194-main`, beside the `speclib.org` zone they write into. The
buildspec is an `amplify.yml` in this repository instead of inline in that one, because
`npm run validate` is this project's knowledge and would otherwise be restated in an AWS
account that has no other reason to know it.

That splits the change across two repositories, which is the price of the registry being
published by infrastructure someone else's repo owns. The ordering follows: nothing here is
canonical until that app exists. The raw URL works today and keeps working, which is what the
TUI can use in the meantime.

## Risks / Trade-offs

- **The address is a promise made before anyone depends on it.** Choosing wrongly is expensive
  and choosing late blocks the consumer. → Every segment was tested against what its absence
  would cost forever rather than against taste, and the version segment exists precisely so
  that one class of mistake stays fixable.
- **A custom domain is infrastructure that can lapse**, and it is now AWS infrastructure: a
  registration missed, a zone record removed, an Amplify app deleted, or an account problem
  takes the canonical address down. → The raw URL is documented as a fallback that nothing can
  switch off while the repository is public.
- **The console can break the association.** Adding a custom domain to any Amplify app through
  the console claims the whole of `speclib.org` and would take `registry.` with it. → The
  association is declared in the infrastructure repository, and that repository is the only
  place it is edited.
- **Amplify needs a token for a public repository.** A credential now exists whose loss stops
  deployments and whose leak grants repository access. → It lives as an SSM SecureString in
  the AWS account, never in either repository.
- **Publication now depends on a repository this project does not own.** A change to the
  address, the branch or the build contract needs work in two places. → The split is drawn so
  that this repository owns what it knows (validation, layout, buildspec) and the other owns
  what it knows (the app, the domain, the DNS).
- **`v1` is a commitment to keep serving old shapes.** → It is also the only alternative to
  breaking consumers, and the definition keeps the trigger narrow enough that it should rarely
  fire.
- **Reserving the root means the domain answers 404 until `h885` ships.** → Accepted for now.
  A reader who lands there sees nothing useful, which is worth fixing but is not worth spending
  `h885`'s scope on from here.

## Open Questions

- Whether to add an index page at the root ahead of `h885`, purely so that the domain does not
  answer 404 to a person who pastes it into a browser. It changes nothing about the contract
  and can be decided when the domain is live.
