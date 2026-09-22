## Purpose

Defines what makes `openspec-schemas.json` valid: which rules a JSON Schema states, which
rules it cannot state and are checked in code, and what a validation failure tells the
person who caused it.

## ADDED Requirements

### Requirement: A JSON Schema describes the registry file

The registry SHALL be described by a JSON Schema covering the document's shape and each
entry's fields: which are required, their types, the `id` pattern, the maximum length of
`description`, the permitted values of `status`, and the shape of `source`. The schema
SHALL reject an entry carrying a field it does not define. The schema SHALL permit a
`$schema` key on the document.

#### Scenario: An entry missing a required field

- **WHEN** an entry omits `artifacts`
- **THEN** validation fails and names the missing field

#### Scenario: An entry with an unknown field

- **WHEN** an entry carries a field the schema does not define, such as `maintainer` or a
  misspelled `licence`
- **THEN** validation fails, because an undefined field is a mistake rather than an
  extension

#### Scenario: A document carrying a schema pointer

- **WHEN** the registry document carries a `$schema` key alongside `schemas`
- **THEN** validation succeeds, because the pointer is part of the document rather than an
  unknown field

### Requirement: Rules a JSON Schema cannot express are checked in code

Validation SHALL additionally check that every `id` is unique across the registry, that
entries appear in ascending order by `id`, and that a `superseded_by` value names an entry
present in the registry. These SHALL be checked because JSON Schema can express neither
uniqueness by a property nor ordering, so schema conformance alone does not make the
registry valid.

#### Scenario: Two entries share an identifier

- **WHEN** two entries carry the same `id`
- **THEN** validation fails and names both entries, even though each conforms to the schema

#### Scenario: An entry in the wrong position

- **WHEN** an entry appears out of ascending order by `id`
- **THEN** validation fails and says which two entries it belongs between

#### Scenario: A supersession pointing nowhere

- **WHEN** an entry's `superseded_by` names an `id` no entry carries
- **THEN** validation fails, because a reader following the reference would find nothing

### Requirement: Validation runs offline

Validation SHALL complete without network access, so that it runs inside the sandboxed
build that gates this repository and so that a contributor can check an entry before
pushing it. Checks that require fetching an entry's source SHALL NOT be part of it.

#### Scenario: Validation inside the sandboxed gate

- **WHEN** the repository's gate runs with no network available
- **THEN** validation completes and its result is trustworthy

#### Scenario: A contributor checking an entry before pushing

- **WHEN** a contributor runs validation locally while offline
- **THEN** every rule that does not require the network is checked

### Requirement: One validator serves the gate and the contributor

The same validation SHALL back both the repository's automated checks and the command a
contributor runs. A rule SHALL NOT be enforced in one and absent from the other.

#### Scenario: The gate rejects an invalid registry

- **WHEN** the registry file breaks any validation rule
- **THEN** the repository's test suite fails, so the file cannot ship

#### Scenario: A contributor runs validation

- **WHEN** a contributor runs the validation command against the registry
- **THEN** it applies exactly the rules the gate applies, and reports them for people to
  read

### Requirement: A validation failure is addressed to the person who caused it

A failure SHALL identify each faulty entry by its `id` rather than by its position in the
array. Each reported problem SHALL state the rule in a sentence and show the value that
broke it. An unknown field SHALL be reported with the closest defined field name when one
is close enough to be a likely misspelling. All problems SHALL be reported together,
grouped per entry, rather than one per run.

#### Scenario: A description over the limit

- **WHEN** an entry's description exceeds 100 characters
- **THEN** the failure names the entry's `id`, gives the actual length against the limit,
  and shows the text

#### Scenario: A misspelled field name

- **WHEN** an entry carries `licence` instead of `license`
- **THEN** the failure says the field is not defined and suggests `license`

#### Scenario: Several problems at once

- **WHEN** the registry has problems in more than one entry, or several in one entry
- **THEN** every problem is reported in a single run, grouped under the entry it belongs to
