---
# openspec-schema-registry-ir8u
title: Seed the registry with known schemas
status: completed
type: epic
created_at: 2026-09-22T14:05:24Z
updated_at: 2026-09-22T16:44:54Z
parent: openspec-schema-registry-pbx8
openspec-link: openspec/changes/archive/2026-09-22-seed-registry-with-known-schemas
---

Collect the OpenSpec schemas that exist today, starting with tinychange at https://github.com/speclib/openspec-tinychange-schema, and write them into openspec-schemas.json.

## Summary of Changes

Seeded `openspec-schemas.json` with 13 workflow schemas from 8 repositories, sorted
ascending by `id`, every entry checked against its upstream `schema.yaml` for `name` and
`artifacts` and given a registry-authored description within the 100-character cap.

Admission takes two tests, both recorded in `docs/registry-inclusion.md`: the mechanical
one (the source resolves to a schema the CLI accepts) and a judgement no machine can make
(does the repository exist for the schema). The seed came from the schemas already curated
in `awesome-openspec`, of which five turned out to hold no `schema.yaml` at all. Each of
the eight remaining repositories was checked against what it says about itself, and the
three superpowers-family schemas were compared directly: no pair was identical, so all
three are listed as originals.

Notifying the seven third-party authors was planned and then dropped. Instead every entry
links to its source repository and the documented removal path is unconditional.
