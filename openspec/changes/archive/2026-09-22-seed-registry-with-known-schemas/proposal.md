## Why

`openspec-schemas.json` is the product, and it does not exist yet. Until it holds real
entries, nothing downstream can be built against it: the JSON Schema has no document to
validate, the test suite has no entries to resolve, and a consumer has nothing to fetch.

Seeding is also the one moment in this registry's life where it lists people who never
asked to be listed. Every entry after the seed arrives as a submission, and a submission is
its own proof of intent. The seed has no such proof, so it needs an admission rule and a
way for a listed author to object.

Epic: [.beans/openspec-schema-registry-ir8u--seed-the-registry-with-known-schemas.md](../../../.beans/openspec-schema-registry-ir8u--seed-the-registry-with-known-schemas.md)

## What Changes

- **`openspec-schemas.json` is created**, holding a single top-level object with a
  `schemas` array. The envelope stays minimal here; `openspec-schema-registry-c0d7` gives
  it a JSON Schema.
- **Admission has two tests, not one.** The mechanical test from the entry model still
  applies: the source must resolve to a `schema.yaml` the OpenSpec CLI accepts. On top of
  it sits a judgement the machine cannot make: does this repository exist for the schema?
  A product repository with a private workflow, a template with an embedded schema, and a
  configuration repository carrying a copy all pass the mechanical test and all fail this
  one.
- **The seed is the schemas already curated in `awesome-openspec`**, which is 13 schemas
  across 8 repositories. That list was human-reviewed once already, so the intent
  judgement is inherited rather than invented. The two lists stay independent afterwards.
- **Only originals are listed.** A mechanical copy of another repository's schema gets no
  entry. Two schemas that share an ancestor and have since diverged are two originals, not
  a copy, so both are listed.
- **Entries are ordered alphabetically by `id`**, ascending. This gives a submitter an
  unambiguous insertion point and a reviewer an obvious check. The rule is documented for
  contributors by `openspec-schema-registry-la9x`.
- **Every seed entry carries `language: en` by default.** The four Chinese-language
  candidates in the curated list all fail the mechanical test, so the seed does not
  exercise the field at all.
- **No author is contacted.** Every entry links to its source repository, and the
  documented path to correct or withdraw an entry is unconditional. An author who finds
  their schema listed can have it removed without giving a reason.

## Capabilities

### New Capabilities
- `registry-file`: the document that holds the entries. What it contains, how entries are
  ordered within it, which schemas qualify for inclusion, and what happens when a listed
  author objects.

### Modified Capabilities

None. `registry-entry` describes a single entry and is unchanged by this work; this
capability describes the document around it.

## Impact

- **New**: `openspec-schemas.json` at the repository root, and
  `openspec/specs/registry-file/spec.md` after archiving.
- **Depends on**: `openspec-schema-registry-1djr`, whose entry model every seed entry is
  written against. That change should ship first.
- **Unblocks**: `openspec-schema-registry-c0d7` gets a real document to validate,
  `openspec-schema-registry-66lh` gets 13 entries to resolve, and
  `openspec-schema-registry-9hi8` gets a file to publish.
- **Constrains**: `openspec-schema-registry-la9x`, which documents the ordering rule and
  the admission judgement for contributors, and inherits the correction path the
  notification issues promise.
- **Nothing outward-facing**: no issues are opened and no author is contacted. The
  registry's only contact with the listed repositories is reading their public
  `schema.yaml`.
