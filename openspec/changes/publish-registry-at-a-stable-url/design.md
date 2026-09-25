## Context

See proposal.md for motivation. Four findings from measuring the current situation shaped
this, and the first one reframes the epic.

**The registry is already published.** `raw.githubusercontent.com` serves it with a 300 second
cache and an ETag, and jsDelivr serves it with `application/json`. A live fetch returns the 13
entries. A public repository publishes itself, so nothing here is about making the file
reachable. It is about committing to one address.

**A path can never change.** A JSON document cannot redirect a consumer the way an HTML page
can meta-refresh, and GitHub Pages offers no control over HTTP redirects beyond the automatic
one from the `github.io` address to a configured custom domain. So an origin can move for free
and a path cannot move at all.

**GitHub Pages binds one custom domain to one repository.** That decides subdomain against
path for a family of future public data.

**`speclib.org` is registered and its DNS is under your control, but nothing resolves yet.**
The domain being available makes the permanent address a choice rather than a migration, and
the timing of the `CNAME` file matters.

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
                one repository per subdomain, because Pages allows nothing else
```

The usual instinct is to strip a URL to its shortest honest form. That instinct is wrong here,
because the costs are asymmetric: a segment included and never used costs one segment forever,
and a segment omitted and later needed costs every consumer with no remedy. So the test is not
"is this needed today" but "would its absence ever be unfixable".

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

### No build

Publishing two static files needs no build step, and the reason it stays that way once `h885`
arrives is worth recording, because the neighbour's precedent points the other way.
`awesome-openspec` imports its `entries.json` into an Astro page and never serves it, so its
page must be rebuilt whenever the data changes. Our data is the published product at a fixed
URL, so a page can fetch it. That inverts the argument: the site has no data dependency, so it
has nothing to compile.

Adopting a framework later, if `h885` turns out to want components or server rendering, is a
contained change. Adopting one now would be inheritance rather than a decision, and it would
add a second lockfile and a second `npmDepsHash` to a Nix gate that has already gone stale
twice in two changes.

### The `CNAME` file lands last

Configuring a custom domain makes GitHub treat it as authoritative and redirect the `github.io`
address to it. Committing that before DNS resolves leaves the site unreachable at both
addresses. So the file goes in after `registry.speclib.org` resolves, and that step belongs to
whoever controls the DNS rather than to this change's implementation.

Until then nothing is promised as canonical. The raw URL works today and keeps working, which
is what the TUI can use in the meantime.

## Risks / Trade-offs

- **The address is a promise made before anyone depends on it.** Choosing wrongly is expensive
  and choosing late blocks the consumer. → Every segment was tested against the "unfixable if
  omitted" question rather than against taste, and the version segment exists precisely so that
  one class of mistake stays fixable.
- **A custom domain is infrastructure that can lapse.** A registration missed or a DNS record
  removed takes the canonical address down. → The raw URL is documented as a fallback that
  nothing can switch off while the repository is public.
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
