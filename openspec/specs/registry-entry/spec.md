# registry-entry Specification

## Purpose
Defines the shape of a single entry in `openspec-schemas.json`: which fields an entry must
carry, what each optional field means when absent, and which properties the registry
guarantees to a consumer that installs from it.

## Requirements

### Requirement: An entry describes exactly one workflow schema

The registry SHALL contain one entry per workflow schema. A source repository that
publishes several schemas SHALL contribute one entry per schema, each addressing its own
subpath. An entry SHALL NOT describe agent skills, slash commands, plugins, or any payload
other than a workflow schema. An entry SHALL describe a schema that is installed from a
source, so a schema shipped with the OpenSpec CLI SHALL NOT be listed.

#### Scenario: A repository publishing several schemas

- **WHEN** a source repository contains two schema directories, each with its own
  `schema.yaml`
- **THEN** the registry holds two entries, with distinct identifiers and distinct
  `source.path` values pointing at the same repository

#### Scenario: A submission that installs more than a schema

- **WHEN** a submitted entry addresses a directory that is not a workflow schema directory,
  or asks for files outside that directory to be installed
- **THEN** the entry is out of scope for the registry and is rejected

#### Scenario: A schema that ships with the CLI

- **WHEN** a schema is built into the OpenSpec CLI and is present in a project without
  being installed from a source
- **THEN** it has no entry, and a consumer listing every available schema merges the
  built-in schemas with the registry itself

### Requirement: An entry carries six required fields

Every entry SHALL carry `id`, `name`, `description`, `artifacts`, `source.repo` and
`source.path`. An entry missing any of them SHALL be invalid.

#### Scenario: A complete minimal entry

- **WHEN** an entry declares `id`, `name`, `description`, `artifacts`, `source.repo` and
  `source.path`, and no other field
- **THEN** the entry is valid and a consumer has everything needed to install the schema

#### Scenario: An entry without a description

- **WHEN** an entry omits `description`
- **THEN** the entry is invalid, because the registry's purpose is to let a consumer choose
  a schema without fetching it

### Requirement: The entry identifier is namespaced, unique and permanent

Each entry SHALL carry an `id` of the form `<owner>/<name>`, unique across the registry.
An `id` SHALL be lowercase, while `name` keeps the casing the upstream schema declares. The
`id` SHALL NOT change once published, including when the source repository is renamed,
transferred to another owner, or when the upstream schema changes its declared name.

#### Scenario: Two owners publish a schema with the same declared name

- **WHEN** two different owners each publish a schema whose declared name is `minimalist`
- **THEN** both entries are admissible, because their identifiers differ

#### Scenario: A source repository moves to a new owner

- **WHEN** an entry's repository is transferred and `source.repo` is updated
- **THEN** the entry keeps its original `id`, so references to that `id` stay valid

#### Scenario: A duplicate identifier is submitted

- **WHEN** a submitted entry declares an `id` that an existing entry already uses
- **THEN** the submission is rejected

#### Scenario: An upstream schema declares a capitalised name

- **WHEN** a schema declares `name: SuperSpec` and its owner is `danielhanold`
- **THEN** the entry's `id` is `danielhanold/superspec` and its `name` stays `SuperSpec`,
  so that identifiers sort predictably and two entries cannot differ by casing alone

### Requirement: The source address is a repository, a subpath and an optional ref

An entry SHALL address its schema through `source.repo` (the repository URL) and
`source.path` (the directory inside that repository holding `schema.yaml`). An entry MAY
carry `source.ref` naming a tag, branch or commit. When `source.ref` is absent, a consumer
SHALL resolve the source at the repository's default branch.

#### Scenario: An entry without a ref

- **WHEN** an entry omits `source.ref`
- **THEN** a consumer installs the schema as it stands on the repository's default branch

#### Scenario: An entry pinned to a tag

- **WHEN** an entry declares `source.ref` naming a released tag
- **THEN** a consumer installs the schema as it stands at that tag, and does not follow
  later commits on the default branch

#### Scenario: A source address that does not resolve

- **WHEN** `source.repo`, `source.ref` or `source.path` does not resolve to a directory
  containing a `schema.yaml` that the OpenSpec CLI accepts
- **THEN** the entry is invalid

### Requirement: The registry is a catalogue, not a lockfile

The registry SHALL NOT guarantee that installing the same entry twice yields the same
files. A consumer that requires a reproducible install SHALL resolve the source to a commit
at install time and record that commit in its own project.

#### Scenario: Upstream changes after an install

- **WHEN** a consumer installs an entry without `source.ref`, and the upstream default
  branch then receives new commits
- **THEN** a later install of the same entry may produce different files, and the registry
  is unchanged and still correct

#### Scenario: A consumer that wants reproducibility

- **WHEN** a consumer installs an entry and wants to reproduce the install later
- **THEN** the consumer records the resolved commit in its own project, because the
  registry entry does not carry it

### Requirement: The declared schema name is reported, not guaranteed unique

An entry's `name` SHALL carry the schema's own declared name, which determines both the
directory the schema installs into and the value passed to the OpenSpec CLI when selecting
the schema. The registry SHALL NOT require `name` to be unique across entries and SHALL NOT
rename a schema. Resolving a collision is the consumer's responsibility.

#### Scenario: Two entries declare the same name

- **WHEN** two entries carry the same `name`
- **THEN** both entries remain valid, and a consumer reading the registry can detect the
  collision by inspecting the entries

#### Scenario: The declared name disagrees with upstream

- **WHEN** an entry's `name` differs from the `name` declared in the upstream `schema.yaml`
- **THEN** the entry is invalid, because a consumer would install into the wrong directory

### Requirement: The install destination is a convention, not entry data

An entry SHALL NOT carry an install destination. A consumer SHALL install every entry into
`openspec/schemas/<name>/` within the target project, where `<name>` is the entry's `name`.

#### Scenario: Installing any entry

- **WHEN** a consumer installs an entry
- **THEN** the schema directory lands at `openspec/schemas/<name>/`, with no per-entry
  destination consulted

#### Scenario: The destination already exists

- **WHEN** `openspec/schemas/<name>/` already exists in the target project
- **THEN** the consumer reports the conflict rather than overwriting, and the registry has
  no say in the outcome

### Requirement: The description is written for the registry and bounded in length

An entry's `description` SHALL be a single line written for the registry, at most 100
characters. It SHALL NOT be required to match the description the upstream `schema.yaml`
declares, because an upstream description serves a different purpose and has no length
discipline.

#### Scenario: An upstream description too long to list

- **WHEN** an upstream `schema.yaml` declares a description of several hundred characters,
  or one that records the schema's release history
- **THEN** the entry carries a registry-authored line of at most 100 characters instead,
  and the difference from upstream is not an error

#### Scenario: A description over the limit

- **WHEN** a submitted entry declares a `description` longer than 100 characters
- **THEN** the submission is rejected

### Requirement: An entry records the schema's artifact pipeline

An entry SHALL carry `artifacts`, the ordered list of artifact identifiers the schema
declares, so that a consumer can describe the workflow without fetching the schema. The
list SHALL match the artifact identifiers declared in the upstream `schema.yaml`.

#### Scenario: Listing schemas without fetching them

- **WHEN** a consumer reads the registry to show the available schemas and their workflows
- **THEN** each entry's `artifacts` supplies the pipeline shape, and no upstream request is
  made

#### Scenario: The recorded pipeline disagrees with upstream

- **WHEN** an entry's `artifacts` differs from the artifact identifiers in the upstream
  `schema.yaml`
- **THEN** the entry is invalid and needs correcting

### Requirement: Optional fields have defined meanings when absent

An entry MAY carry `requires.openspec`, `status`, `superseded_by`, `license` and
`language`. An absent `status` SHALL mean `active`. An absent `language` SHALL mean `en`.
An absent `license` SHALL mean that the licence is unknown, and SHALL NOT be read as the
schema being unlicensed. An absent `requires.openspec` SHALL mean the entry states no
minimum OpenSpec version, and its presence is advisory rather than enforced by the
registry.

#### Scenario: An entry without a licence field

- **WHEN** an entry omits `license` because its source repository carries no licence file
- **THEN** the entry is valid, and a consumer treats the licence as unknown rather than
  absent

#### Scenario: An entry stating a minimum OpenSpec version

- **WHEN** an entry declares `requires.openspec`
- **THEN** a consumer may warn when the installed OpenSpec CLI is older, and the registry
  does not verify the claim

### Requirement: An entry signals deprecation and supersession

An entry MAY declare `status` as `active` or `deprecated`. A deprecated entry SHALL remain
in the registry rather than being deleted, and MAY declare `superseded_by` naming the `id`
of the entry that replaces it. The registry SHALL NOT carry a separate field for a moved
repository, because a move is recorded by updating `source.repo` while the `id` stays
fixed.

#### Scenario: A schema is retired in favour of another

- **WHEN** a schema author retires a schema and names its replacement
- **THEN** the entry's `status` becomes `deprecated`, `superseded_by` names the replacing
  entry's `id`, and the entry stays in the registry so existing references still resolve

#### Scenario: A schema moves to a new repository

- **WHEN** a schema's source repository moves
- **THEN** `source.repo` is updated, `status` stays `active`, and no supersession is
  recorded

### Requirement: An entry is authored by hand and verifiable by machine

Every required field SHALL be writable by a contributor without privileged access to any
external service, and every required field SHALL be checkable against the upstream source.
The registry SHALL NOT require a field that only an enrichment tool can supply. In
particular, the entry SHALL NOT carry a maintainer field, since `source.repo` already
identifies who publishes the schema.

#### Scenario: A community submission

- **WHEN** a schema author submits an entry without access to this repository's tooling or
  credentials
- **THEN** every required field can be written by reading their own repository

#### Scenario: A proposed field that cannot be checked

- **WHEN** a field is proposed that cannot be verified against the upstream source
- **THEN** it is not a required field, and is either optional and advisory or left out
