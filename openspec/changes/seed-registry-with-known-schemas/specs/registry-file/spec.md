## Purpose

Defines the document that holds the registry entries: its shape, the order entries appear
in, which schemas qualify for inclusion, and how a schema author who was listed without
asking can correct or withdraw their entry.

## ADDED Requirements

### Requirement: The registry is a single JSON document holding an array of entries

The registry SHALL be one JSON file, `openspec-schemas.json`, containing a top-level object
with a `schemas` array. Each element of that array SHALL be a registry entry. The registry
SHALL NOT split entries across several files.

#### Scenario: A consumer fetches the registry

- **WHEN** a consumer fetches the registry to discover the available schemas
- **THEN** one request returns every entry, and no further request is needed to enumerate
  them

#### Scenario: An entry is added

- **WHEN** a schema is added to the registry
- **THEN** it appears as one more element of the `schemas` array, and no other file changes

### Requirement: Entries are ordered alphabetically by identifier

The `schemas` array SHALL be sorted in ascending order by `id`. Because `id` is lowercase
and namespaced by owner, the position of any entry SHALL be computable without consulting
the rest of the file.

#### Scenario: A submitter adds an entry

- **WHEN** a contributor adds an entry to the registry
- **THEN** exactly one position in the array is correct for it, and a reviewer can confirm
  the position by comparing it against its two neighbours

#### Scenario: One owner publishes several schemas

- **WHEN** an owner publishes several schemas
- **THEN** their entries appear next to each other, because a shared owner prefix sorts
  together

### Requirement: A schema qualifies only if its repository publishes it for reuse

A schema SHALL be listed only when its source repository exists in order to publish that
schema. A repository that defines a schema for its own internal use, a template that
embeds a schema as part of its output, and a configuration repository that carries a schema
among unrelated files SHALL NOT be listed, even when their schemas are valid and resolvable.

#### Scenario: A repository published for the purpose

- **WHEN** a repository's stated purpose is to share a workflow schema, and its schema
  resolves and validates
- **THEN** it qualifies, and each schema it publishes gets an entry

#### Scenario: A product repository with a private workflow

- **WHEN** a product repository defines a custom workflow schema for its own development
- **THEN** it does not qualify, because the schema was never offered to anyone else

#### Scenario: A valid schema that is not an offer

- **WHEN** a candidate passes every mechanical check but its repository exists for some
  other purpose
- **THEN** it is not listed, and the mechanical check alone is never sufficient grounds for
  inclusion

### Requirement: The registry lists originals, not mechanical copies

Where the same schema appears in more than one repository, the registry SHALL list the
repository that publishes it and SHALL NOT list a copy checked into another repository. Two
schemas that share an ancestor but have since diverged SHALL each be listed as their own
entry.

#### Scenario: A schema vendored into another repository

- **WHEN** a schema's files are copied unchanged into an unrelated repository
- **THEN** the copy gets no entry, and the publishing repository keeps the only one

#### Scenario: Two schemas that share an ancestor

- **WHEN** two repositories publish schemas that began from the same source and now declare
  different artifacts
- **THEN** both are listed, because each is now published on its own terms

### Requirement: A listed author can correct or withdraw their entry

When an entry is added without its author submitting it, the registry SHALL notify that
author, SHALL show them the entry as listed, and SHALL offer a way to correct it or have it
removed. A removal request SHALL be honoured.

#### Scenario: An author is listed without asking

- **WHEN** an entry is added for a schema whose author did not submit it
- **THEN** the author is notified on their own repository, shown the entry, and told how to
  correct or withdraw it

#### Scenario: An author asks to be removed

- **WHEN** a listed author asks for their entry to be removed
- **THEN** the entry is removed, and no justification is required from them

#### Scenario: An author corrects their entry

- **WHEN** a listed author corrects a field in their entry
- **THEN** their correction is taken over the registry's original wording, because the
  schema is theirs
