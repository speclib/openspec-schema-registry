---
# openspec-schema-registry-c0d7
title: JSON Schema for the registry file
status: completed
type: epic
priority: normal
created_at: 2026-09-22T14:05:24Z
updated_at: 2026-09-22T22:08:39Z
parent: openspec-schema-registry-7pxx
openspec-link: openspec/changes/archive/2026-09-23-validate-registry-against-json-schema
---

Write the meta-schema that validates openspec-schemas.json, and wire it up so editors and CI both use it.

## Summary of Changes

Wrote `schema/openspec-schemas.schema.json` and wired it into both editors and the gate.

The epic's framing needed correcting: a JSON Schema cannot validate this file on its own.
It has no uniqueness by a property and no ordering, so `id` uniqueness, ascending order and
`superseded_by` resolving to a real entry are checked in code alongside the schema. Strict
`additionalProperties` turned out to be the only enforcement anywhere of the entry model's
rule that an entry carries no maintainer field.

`npm run validate` is one offline command covering all of it, deliberately offline because
the gate builds in a sandbox with no network. The same function backs the test suite, so a
malformed registry cannot ship. Failures name the entry by `id` rather than by array
position, state the rule with the offending value, and suggest the nearest field when one is
misspelled.

`openspec-schemas.json` now carries a `$schema` key, which changed the `registry-file`
capability. The schema's own `$id` and any version were deferred to
`openspec-schema-registry-9hi8`, since both describe external consumption that does not
exist until the file is published. `check-jsonschema` left the dev shell, as it covers only
a subset of the job.
