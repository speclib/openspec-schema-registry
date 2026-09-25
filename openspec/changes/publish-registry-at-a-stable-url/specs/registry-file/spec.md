## MODIFIED Requirements

### Requirement: The registry is a single JSON document holding an array of entries

The registry SHALL be one JSON file, `openspec-schemas.json`, containing a top-level object
with a `schemas` array. Each element of that array SHALL be a registry entry. The document
SHALL carry a `$schema` key naming the published JSON Schema by its absolute URL, so that an
editor can validate the file while it is being edited and so that the pointer survives the
document being copied elsewhere. The registry SHALL NOT split entries across several files.

#### Scenario: A consumer fetches the registry

- **WHEN** a consumer fetches the registry to discover the available schemas
- **THEN** one request returns every entry, and no further request is needed to enumerate
  them

#### Scenario: An entry is added

- **WHEN** a schema is added to the registry
- **THEN** it appears as one more element of the `schemas` array, and no other file changes

#### Scenario: The document names its own schema

- **WHEN** the document carries a `$schema` key
- **THEN** a reader treats it as a description of the document rather than as an entry, and
  the registry's entries are unaffected

#### Scenario: The document is copied away from its neighbours

- **WHEN** the document is written to a consumer's cache, or to any location where the schema
  file is not beside it
- **THEN** its `$schema` still resolves, because it names an absolute URL rather than a
  neighbouring path
