# Registry entry

One entry in `openspec-schemas.json` describes one OpenSpec workflow schema: where its
source lives, what it is called, and what its workflow looks like. This page is the
contributor-facing reference. The normative version lives in
`openspec/specs/registry-entry/spec.md`.

## Scope

An entry describes a workflow schema and nothing else. Agent skills, slash commands and
plugins are out of scope, which is what keeps the install procedure identical for every
entry. So is the `spec-driven` schema built into the OpenSpec CLI: the registry lists
schemas you install from a source, and a built-in schema is present without being
installed.

A repository publishing several schemas contributes one entry per schema, each with its own
`source.path`.

## Fields

| Field               | Required | Meaning when absent                              |
| ------------------- | -------- | ------------------------------------------------ |
| `id`                | yes      |                                                  |
| `name`              | yes      |                                                  |
| `description`       | yes      |                                                  |
| `artifacts`         | yes      |                                                  |
| `source.repo`       | yes      |                                                  |
| `source.path`       | yes      |                                                  |
| `source.ref`        | no       | the repository's default branch                  |
| `requires.openspec` | no       | the entry states no minimum OpenSpec version     |
| `status`            | no       | `active`                                         |
| `superseded_by`     | no       | nothing supersedes this entry                    |
| `license`           | no       | the licence is unknown, not that there is none   |
| `language`          | no       | `en`                                             |

### `id`

A registry-unique slug of the form `<owner>/<name>`, lowercase. It never changes once
published, not when the source repository is renamed, not when it is transferred to another
owner, and not when the upstream schema changes its declared name. An `id` is a slug, not a
claim about who currently owns the repository.

Namespacing by owner makes an `id` self-assigning: nobody has to referee a naming dispute,
because two owners publishing a schema with the same declared name still get distinct
identifiers.

### `name`

The schema's own declared name, copied from its `schema.yaml` with whatever casing it uses.
It decides two things outside the registry: the directory the schema installs into, and the
value passed to `openspec new change --schema <name>`.

`name` is not unique across the registry. Two entries may carry the same one, and the
registry neither rejects the second nor renames either. A consumer that installs both has a
collision to resolve in its own project.

Note the pairing with `id`: `danielhanold/superspec` is the identifier, `SuperSpec` is the
name.

### `description`

One line written for the registry, at most **100 characters**. It is not copied from the
upstream `schema.yaml` and is not required to match it. Upstream descriptions serve a
different purpose and have no length discipline; some run to several hundred characters and
one is a release history.

The limit is enforced by a lint, so an over-long description fails before review.

### `artifacts`

The ordered list of artifact ids the schema declares, copied from its `schema.yaml`. It
lets a consumer show the workflow shape without fetching anything, and it must match
upstream exactly.

### `source.repo`, `source.path`, `source.ref`

`source.repo` is the repository URL and `source.path` is the directory inside it holding
`schema.yaml`. The path is required because a repository may publish several schemas, and
because the directory name is not always the schema name.

`source.ref` names a tag, branch or commit and is optional. When it is absent, a consumer
resolves the source at the repository's default branch, which is not always `main`.

### `requires.openspec`

The minimum OpenSpec version the schema needs. It is advisory: the registry does not verify
it, and a consumer may warn rather than refuse.

### `status` and `superseded_by`

`status` is `active` or `deprecated`. A deprecated entry stays in the registry rather than
being deleted, so references to a retired `id` still resolve to an explanation, and it may
name its replacement in `superseded_by`.

A repository that moves needs neither field. `source.repo` is updated, the `id` stays
fixed, and the entry remains `active`.

### `license` and `language`

`license` is an SPDX identifier. Absent means the licence is unknown, which is not the same
as the schema being unlicensed. `language` describes the schema's own instructions and
templates rather than its repository's README.

## What an entry does not carry

Every required field is something a contributor can write by reading their own repository,
and something that can be checked against the upstream source. A field that only an
enrichment tool could supply is not required.

There is no maintainer field. `source.repo` already says who publishes the schema, and a
second hand-written name goes stale the moment a repository changes hands.

## The install destination is not entry data

Every entry installs to the same place:

```
openspec/schemas/<name>/
```

There is no destination field, and no entry can ask for one. The consumer derives the path
from `name`, so the install procedure is one function of `(repo, ref, path, name)` and is
identical for every entry in the registry.

If that directory already exists in the target project, the consumer reports the conflict
instead of overwriting it. The registry has no say in the outcome.

## Pinning is the consumer's responsibility

The registry is a catalogue, not a lockfile. Because `source.ref` defaults to the
repository's default branch, installing the same entry twice may produce different files.

A consumer that needs a reproducible install resolves the source to a commit at install
time and records that commit in its own project. The registry entry does not carry it.

## Examples

The minimum, which is what most entries look like:

```json
{
  "id": "speclib/tinychange",
  "name": "tinychange",
  "description": "Lean specs to tasks workflow for very small changes.",
  "artifacts": ["specs", "tasks"],
  "source": {
    "repo": "https://github.com/speclib/openspec-tinychange-schema",
    "path": "openspec/schemas/tinychange"
  }
}
```

An entry using the optional fields:

```json
{
  "id": "lukk17/e2e-runbooks",
  "name": "e2e-runbooks",
  "description": "Capability-level e2e runbooks with behaviour-only assertions.",
  "artifacts": ["proposal", "test-spec", "tasks-template", "run"],
  "source": {
    "repo": "https://github.com/Lukk17/openspec-schemas",
    "path": "openspec/schemas/e2e-runbooks",
    "ref": "v0.2.0"
  },
  "requires": { "openspec": ">=1.10" },
  "license": "MIT",
  "status": "active",
  "language": "en"
}
```

## Findings from checking the model against real schemas

The model was written against eight real schemas from four repositories before anything was
built on it: `speclib/openspec-tinychange-schema`, `intent-driven-dev/openspec-schemas`
(five schemas), `Lukk17/openspec-schemas` and `danielhanold/superspec`. Every one of them
was expressible, and each required field was checked against the upstream `schema.yaml`.

What the exercise confirmed:

- **`source.path` cannot be derived from `name`.** Seven of the eight sit at
  `openspec/schemas/<name>/`, which makes the eighth easy to miss: `danielhanold/superspec`
  declares `name: SuperSpec` while storing itself in `superspec/`. A consumer that computed
  the path from the name would fail on it.
- **A default branch is not always `main`.** `Lukk17/openspec-schemas` uses `master`.
  Fetching at `HEAD` resolves; fetching at `main` fails outright. Any implementation of the
  install procedure has to ask the repository rather than assume.
- **The registry description has to be written here.** Upstream descriptions across the
  eight run from 52 to 1753 characters, and the longest is a release history rather than a
  description. One of the eight, `intent-driven-dev/minimalist` at 52 characters, would fit
  the 100-character cap unchanged. That is the exception: reusing an upstream description
  is occasionally possible, never dependable.
- **Optional fields are genuinely optional.** `speclib/tinychange` is complete with the six
  required fields and nothing else. Only `Lukk17/openspec-schemas` publishes tags, so it is
  the one case where `source.ref` carries a pin.

No field was missing, and no candidate needed a field the model does not define.
