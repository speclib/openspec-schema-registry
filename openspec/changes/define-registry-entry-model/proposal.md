## Why

`openspec-schemas.json` is read by OpenSpec utilities to discover and install schemas, so
its entry shape is a contract rather than a convenience. Three sibling epics (the JSON
Schema in `openspec-schema-registry-c0d7`, the seed data in `openspec-schema-registry-ir8u`,
and the install contract in `openspec-schema-registry-58p4`) all block on knowing what an
entry contains and which of its fields are required. This change settles that model and
nothing else.

Epic: [.beans/openspec-schema-registry-1djr--registry-entry-model.md](../../../.beans/openspec-schema-registry-1djr--registry-entry-model.md)

## What Changes

- **Entry granularity**: one entry describes one workflow schema, not one repository. A
  repository that publishes several schemas contributes several entries, each addressing a
  subpath.
- **Scope of an entry**: an entry may describe a workflow schema and nothing else. Agent
  skills, slash commands and plugins are out of scope, which makes the install procedure
  identical for every entry. So is the `spec-driven` schema built into the OpenSpec CLI,
  because it is present without being installed from a source.
- **Six required fields**: `id`, `name`, `description`, `artifacts`, `source.repo` and
  `source.path`.
- **Optional fields with defined defaults**: `source.ref` (defaults to the repository's
  default branch), `requires.openspec`, `status` (defaults to `active`), `superseded_by`,
  `license` (absent means unknown, not unlicensed) and `language` (defaults to `en`).
- **`id` is namespaced, lowercase and permanent**: the form is `<owner>/<name>`, it is
  unique across the registry, it is lowercased while `name` keeps upstream's casing, and it
  does not change when the source repository moves or when the upstream schema is renamed.
- **`description` is written for the registry**: one line of at most 100 characters,
  authored here rather than copied, because upstream descriptions run from 66 to roughly
  1400 characters and the longest is a release history. `name` and `artifacts` stay copied
  from upstream and checkable against it.
- **`name` is reported, not guaranteed**: it carries the schema's own declared name, which
  determines the install directory and the `--schema` argument. Two entries may declare the
  same `name`. The registry records the fact and leaves the collision to the consumer.
- **No install target field**: the destination is `openspec/schemas/<name>/` for every
  entry, so it is a convention rather than per-entry data.
- **No maintainer field**: `source.repo` already names who publishes the schema, and a
  second hand-written name goes stale when a repository changes hands.
- **Pinning belongs to the consumer**: because `source.ref` defaults to the default branch,
  the registry is a catalogue and not a lockfile. A consumer that wants reproducibility
  resolves and records the commit itself.

## Capabilities

### New Capabilities
- `registry-entry`: the shape of a single entry in `openspec-schemas.json`, which fields
  are required, what each optional field defaults to, and which of them the registry
  guarantees.

### Modified Capabilities

None. There are no existing specs.

## Impact

- **New**: `openspec/specs/registry-entry/spec.md` after archiving, and a field reference
  in the repository documentation that contributors can read without reading the spec.
- **Needs CI**: the 100-character cap on `description` is enforced by a lint rather than by
  review, which adds a GitHub Actions check alongside the existing `nix flake check` gate
  and touches `openspec-schema-registry-7pxx`.
- **Unblocks**: `openspec-schema-registry-c0d7` (the JSON Schema encodes these
  requirements), `openspec-schema-registry-ir8u` (seed entries take this shape) and
  `openspec-schema-registry-66lh` (the test suite asserts them).
- **Constrains**: `openspec-schema-registry-58p4` and `openspec-schema-registry-ftt2`,
  because a default-branch `ref` moves version pinning into the consuming project.
- **No code**: `openspec-schemas.json` itself is not written by this change, and neither
  is its JSON Schema.
- **Open question left to `openspec-schema-registry-66lh`**: whether the copied fields
  (`name`, `description`, `artifacts`) are verified against upstream on every pull request,
  on a schedule, or both. A default-branch `ref` lets upstream drift with no pull request
  to this repository, so some scheduled check is needed.
