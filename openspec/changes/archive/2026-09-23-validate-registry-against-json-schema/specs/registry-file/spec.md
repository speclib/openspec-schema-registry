## MODIFIED Requirements

### Requirement: The registry is a single JSON document holding an array of entries

The registry SHALL be one JSON file, `openspec-schemas.json`, containing a top-level object
with a `schemas` array. Each element of that array SHALL be a registry entry. The document
MAY carry a `$schema` key naming the JSON Schema that describes it, so that an editor can
validate the file while it is being edited. The registry SHALL NOT split entries across
several files.

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
