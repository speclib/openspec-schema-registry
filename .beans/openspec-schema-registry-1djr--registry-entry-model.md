---
# openspec-schema-registry-1djr
title: Registry entry model
status: completed
type: epic
created_at: 2026-09-22T14:05:24Z
updated_at: 2026-09-22T16:17:00Z
parent: openspec-schema-registry-pbx8
openspec-link: openspec/changes/archive/2026-09-22-define-registry-entry-model
---

Decide the fields of a registry entry: id, name, description, source repository, install target, schema kind, maintainer, licence, and version. Decide what is required and what is optional.

## Summary of Changes

Settled the registry entry model: one entry per schema rather than per repository, six
required fields (`id`, `name`, `description`, `artifacts`, `source.repo`, `source.path`),
and a defined meaning for every optional field when absent. `id` is lowercase, namespaced
by owner and permanent; `name` carries upstream casing and is not unique across the
registry. `source.ref` defaults to the repository's default branch, which makes the
registry a catalogue and leaves pinning to the consumer. `description` is registry-authored
and capped at 100 characters. The install destination is a convention rather than entry
data, and there is no maintainer field.

Captured as the `registry-entry` spec capability and `docs/registry-entry.md`, then
validated against eight real schemas from four repositories. That exercise confirmed
`source.path` cannot be derived from `name`, a default branch is not always `main`, and an
upstream description is only occasionally short enough to reuse.
