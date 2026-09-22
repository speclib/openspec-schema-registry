## Context

See proposal.md for motivation. The constraints that shaped this model came from the
material the registry has to describe:

- `speclib/openspec-tinychange-schema`, the seed entry, has no git tags and no licence
  file. Any field required at entry level has to be satisfiable by that repository.
- Several schema repositories in the wild publish more than one schema in a single
  repository, so a repository is not a useful unit.
- Installing the seed schema means copying one directory into `openspec/schemas/<name>/`
  and running `openspec schema validate <name>`. Nothing else.
- Entries arrive as pull requests from people who do not work on this repository and have
  no access to its tooling.
- The `schema.yaml` format is flagged experimental by the OpenSpec CLI, so an entry can be
  correct today and stale tomorrow through no fault of its author.
- Reading the schemas that exist today shows their declared descriptions run from 66 to
  roughly 1400 characters, and the longest is a release history rather than a description.
- One of them declares `name: SuperSpec` while storing itself in a `superspec/` directory,
  so a declared name is not a safe identifier component.

## Goals / Non-Goals

**Goals:**
- An entry a stranger can write correctly by reading their own repository.
- A registry that answers "which schemas exist and what do they do" from the file alone,
  with no network requests.
- Every required field mechanically checkable against the upstream source.
- Identifiers that survive repository moves and upstream renames.

**Non-Goals:**
- Reproducible installs guaranteed by the registry. The entry addresses a source; it does
  not freeze one.
- Describing anything other than a workflow schema.
- Encoding the model as a JSON Schema, as seed data, or as tests. Those are separate
  epics that consume this model.

## Decisions

### An entry is a schema, not a repository

The alternative was one entry per repository with a list of schemas inside it. Rejected
because every consumer operation (install, select, deprecate, collide) acts on a single
schema, so a repository-shaped entry would force every consumer to flatten it first. The
cost is that `source.path` becomes required, which is a small price.

### The entry addresses the source; the install destination is a convention

Considered carrying an install target per entry. Rejected once the scope narrowed to
workflow schemas: the destination is always `openspec/schemas/<name>/`, so a per-entry
field could only ever repeat it or contradict it. Removing the field also removes a class
of malicious submission, since an entry cannot ask to write outside the schemas directory.

A side effect worth naming: the install procedure becomes one function of
`(repo, ref, path, name)`, identical for every entry. The registry documents it once, and
a schema author never writes install prose again. The seed repository's `AGENT_INSTALL.md`
becomes redundant rather than a thing each new repository has to copy.

### `id` is `<owner>/<name>` and permanent; `name` is neither

Two properties are wanted from one string and they conflict. Install needs the schema's own
declared name, because it determines the directory and the CLI argument, and that name is
neither unique across the ecosystem nor stable under upstream renames. Cross-referencing
needs a permanent, unique handle. So they are two fields.

Namespacing `id` by owner makes it self-assigning: a submission cannot squat a name another
author might want, and review never has to referee a naming dispute. Deriving `id` from the
repository URL at read time was considered and rejected, because a repository transfer
would then silently change the identifier and break every reference to it. The convention
describes how an `id` is chosen, not how it is computed, so an `id` may outlive the
correspondence with its repository owner. That is acceptable: an `id` is a slug, not a
claim.

An `id` is also lowercased, while `name` keeps whatever casing upstream declares. A real
schema declares `name: SuperSpec`, which would otherwise produce `danielhanold/SuperSpec`.
Under ASCII ordering that sorts before every lowercase entry, so any alphabetical rule the
contribution guidelines adopt would need a special case nobody would remember. Worse, a
case-insensitive filesystem cannot hold `SuperSpec` and `superspec` apart, so two entries
differing only in casing would be one entry at install time. Lowercasing the slug removes
both problems and costs nothing, since `name` still carries the casing that matters.

### `source.ref` is optional and defaults to the repository's default branch

The alternative was requiring a tag or commit, making the registry reproducible from the
file alone. Rejected on evidence: the seed repository has no tags, and most schema
repositories in the wild have none either. Requiring a pin would mean asking authors to cut
a release in their own repository before the registry could list them, and would turn this
repository into a lockfile for other people's code, needing a pull request for every
upstream release.

The consequence is deliberate: the registry is a catalogue, and pinning moves to the
consumer, which resolves a commit at install time and records it in its own project. This
matches the same principle applied to name collisions, where the registry reports and the
consumer decides.

### `name` and `artifacts` are copied from upstream, not pointed at

Both restate what the upstream `schema.yaml` says. Pointing at the source instead would
keep the registry from ever being wrong, but would make discovery cost one network request
per entry, which defeats the point of a single file. Copying is therefore chosen, and
correctness is maintained by verification rather than by construction: each copied field is
checkable against upstream, and the check is a test rather than a promise.

### `description` is curation, not a copy

`description` started out in the same group and had to leave it. Measured across the
schemas published today, declared descriptions run from 66 characters to roughly 1400, and
the longest one is a release history, complete with entries marked historical. A field that
a consumer shows in a list cannot inherit that, so an exact-match check against upstream
would fail on most entries while being right about none of them.

So `description` is written for the registry and capped at 100 characters. The cap is
enforced by a lint rather than by review, following the neighbouring `awesome-openspec`
repository, which caps a list item at 150 characters including its markdown link. Removing
the link overhead puts the equivalent discipline near 100, and the shortest real
descriptions already fit: 66 characters is enough to say what a schema is for.

The cost is that one required field is no longer machine-verifiable against its source.
That is accepted, because the alternative is a catalogue nobody can read.

### A name collision is reported, not resolved

The registry could reject a second entry declaring an existing `name`. Rejected because the
registry does not own those names, the upstream author does, and two unrelated authors may
both legitimately ship a `minimalist`. The collision only matters at install time in one
specific project, which is where it can be resolved. The registry stores no collision
field either, since it is derivable by reading the file and would go stale as soon as a new
entry lands.

### The CLI's built-in schema is out of scope

The OpenSpec CLI ships with `spec-driven`, and it is a workflow schema by every other test
this model applies. It is left out anyway, because every field in an entry describes how to
fetch and install something, and a built-in schema is already present without being
installed. Listing it would mean inventing a source address that no consumer should ever
resolve, or adding a marker field that exists for exactly one entry.

The consequence lands on the consumer: an interface showing every schema available to a
project merges the built-in list from the CLI with the registry list. That is a small
merge, and it keeps the registry honestly described as a list of schemas you install.

### No maintainer field; licence optional

`source.repo` already identifies who publishes the schema, so a maintainer field would be a
second hand-written name that rots when a repository changes hands. Licence is kept but
optional, and an absent value means unknown rather than unlicensed: the seed repository
carries no licence file, so the distinction is live from the first entry. Stating a licence
in this registry is a claim about someone else's repository, which argues for recording
what the author declares rather than inferring one.

### Deprecation is a status; a move is not

A move needs no field: `source.repo` changes and the permanent `id` absorbs the change.
Supersession does need one, because the replacement is a different entry, so `status` plus
`superseded_by` covers it. Deprecated entries stay in the file rather than being deleted,
so references to a retired `id` still resolve to an explanation.

## Risks / Trade-offs

- **Copied fields drift silently.** With `source.ref` defaulting to the default branch,
  upstream can rename a schema or restructure its artifacts with no pull request here, and
  the registry is quietly wrong. → Verification has to run on a schedule as well as on
  submission. Deferred to the test suite epic, which owns the cadence.
- **A registry-authored description can go stale silently.** If a schema's purpose shifts,
  upstream updates its own description and the registry's line keeps describing the old
  intent. No machine check can catch this, because the two texts are not meant to match.
  → Accepted as the price of a readable catalogue. A submitter correcting their own entry
  is the repair path, which the contribution workflow has to make easy.
- **Verification fetches third-party repositories.** Checking a submission means resolving
  URLs that a stranger supplied. → The narrow scope helps: only a `schema.yaml` under a
  declared subpath is fetched, and validation runs against a throwaway copy rather than the
  repository's own checkout.
- **The `id` convention can stop matching reality.** After a transfer, an `id` names an
  owner who no longer publishes the schema. → Accepted deliberately. Stability is worth
  more than cosmetic accuracy, and the specs state that `id` is a slug rather than a claim.
- **A pinned entry never upgrades.** An author who sets `source.ref` to a tag and then
  forgets it leaves consumers on an old schema indefinitely. → Visible rather than fixed:
  the pin is the author's stated intent, and consumers can read it.
- **No reproducibility from the file alone.** A consumer that ignores the pinning advice
  gets a different install on a different day. → The specs make this explicit rather than
  implied, so a consumer cannot mistake the registry for a lockfile.

## Open Questions

- Whether upstream verification of `name` and `artifacts` runs on every submission, on a
  schedule, or both. The 100-character description cap is settled as a GitHub Actions lint
  on submissions, but a default-branch `ref` lets upstream drift with no submission at all,
  so the drift cadence is still open. The entry model is the same either way, so this
  belongs to the test suite epic, `openspec-schema-registry-66lh`.
- Whether the seed entries are bootstrapped from the curated list in `awesome-openspec` or
  collected by hand. The two lists stay independent afterwards in both cases, so this
  belongs to the seed data epic, `openspec-schema-registry-ir8u`.
