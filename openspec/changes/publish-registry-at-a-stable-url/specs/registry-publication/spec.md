## Purpose

Defines where the registry is published, what a consumer fetching that address may rely on,
what the version in the path means, and what the project deliberately does not promise.

## ADDED Requirements

### Requirement: The registry has one canonical address

The registry SHALL be published at `https://registry.speclib.org/api/v1/openspec-schemas.json`
and its JSON Schema at `https://registry.speclib.org/api/v1/schema.json`. That address SHALL
be the one the project documents and supports. The path SHALL NOT change while the version
stays the same, because a JSON document cannot redirect a consumer to a new location and the
host offers no control over redirects.

#### Scenario: A consumer fetches the registry

- **WHEN** a consumer requests the canonical address
- **THEN** it receives the registry document, and needs no other request to enumerate every
  entry

#### Scenario: The address is moved

- **WHEN** the registry would need to be served from a different path
- **THEN** it is published under a new version segment and the old path keeps serving, rather
  than the old path being retired

### Requirement: The published file is the file in the repository

The published document SHALL be byte-identical to `openspec-schemas.json` in the repository.
No field SHALL be generated, rewritten, reordered or added during publication, so that what a
consumer fetches is exactly what validation checked.

#### Scenario: Comparing published against source

- **WHEN** the published document is compared against the repository's copy at the same commit
- **THEN** they are identical

#### Scenario: A field that would describe the publication itself

- **WHEN** a timestamp, build number or deployment marker would be convenient to add on the
  way out
- **THEN** it is not added, because the document is hand-authored and validated as it stands

### Requirement: An invalid registry is never published

Publication SHALL run the registry's offline validation first and SHALL NOT publish when it
fails. A document that would be rejected by the project's own validation SHALL never reach the
canonical address.

#### Scenario: A malformed registry reaches the default branch

- **WHEN** a change to the registry file fails validation
- **THEN** publication stops and the previously published document remains in place

#### Scenario: A valid registry

- **WHEN** validation passes
- **THEN** the document is published

### Requirement: The document names its schema by an absolute URL

The registry document SHALL carry a `$schema` naming the published JSON Schema by its full
URL, and that schema SHALL carry a matching `$id`. A relative pointer SHALL NOT be used,
because a consumer that stores a copy of the document would be left with a pointer to a file
that is not beside it.

#### Scenario: A consumer caches the registry locally

- **WHEN** a consumer writes the fetched document to its own cache directory
- **THEN** the `$schema` in that copy still resolves, because it names an absolute location

#### Scenario: An editor opens the registry in the repository

- **WHEN** the registry file is edited in a tool that follows `$schema`
- **THEN** it resolves the published schema and validates against it

### Requirement: The version in the path marks a change a consumer cannot absorb

The version segment SHALL change when a consumer that reads the current version correctly
would misread the new document. Adding entries, adding an optional field to an entry, and
correcting the content of an entry SHALL NOT change it. When a new version is published, the
previous version SHALL continue to be served.

#### Scenario: Entries are added or corrected

- **WHEN** entries are added, removed or edited
- **THEN** the version is unchanged, because a consumer reading the document still reads it
  correctly

#### Scenario: An optional field is introduced

- **WHEN** an entry gains a field that was not defined before, and existing consumers can
  ignore it
- **THEN** the version is unchanged

#### Scenario: A change a consumer would misread

- **WHEN** a required field is added, a field is renamed, or an existing field's meaning
  changes
- **THEN** a new version is published at a new path and the previous version keeps being
  served

### Requirement: The project promises the address, not the contents

A consumer SHALL be told that the registry is a catalogue whose entries change as schemas are
added, corrected and deprecated, and that the canonical address always serves the current
contents. A consumer needing a fixed copy SHALL be pointed at a commit-addressed source rather
than at the canonical address.

#### Scenario: A consumer wanting the current registry

- **WHEN** a consumer fetches the canonical address twice, with entries added in between
- **THEN** the second fetch returns the newer contents, and both responses were correct

#### Scenario: A consumer needing a fixed copy

- **WHEN** a consumer needs the registry exactly as it was at some point
- **THEN** the documentation points it at a commit-addressed location, because the canonical
  address does not offer that

### Requirement: The root of the published site is reserved

The root of the published site SHALL be reserved for a human-facing page, so that machine
addresses and page routes never collide. The current publication SHALL NOT place the registry
document or its schema outside the versioned path.

#### Scenario: A page is added later

- **WHEN** a human-facing page is published at the root
- **THEN** it needs no change to any address under the versioned path

#### Scenario: Someone opens the site root

- **WHEN** the root is requested before any page exists
- **THEN** the canonical address is unaffected, because nothing serves the document from the
  root
