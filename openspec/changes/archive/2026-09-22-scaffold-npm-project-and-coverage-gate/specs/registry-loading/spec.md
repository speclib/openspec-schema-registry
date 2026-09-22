## Purpose

Covers reading `openspec-schemas.json` into memory: what a caller gets back from a valid
file, and how the loader behaves when the file is missing, unparseable, or shaped wrongly.

## ADDED Requirements

### Requirement: The loader reads the registry file into entries

The loader SHALL read a registry file and return its entries as a list, preserving the
order they appear in the file. An empty registry SHALL yield an empty list rather than an
error.

#### Scenario: A registry with entries

- **WHEN** the loader reads a registry file whose `schemas` array holds several entries
- **THEN** it returns those entries in file order

#### Scenario: An empty registry

- **WHEN** the loader reads a registry file whose `schemas` array is empty
- **THEN** it returns an empty list, because an empty registry is a valid registry

### Requirement: The loader rejects a file it cannot trust

The loader SHALL raise an error when the file does not exist, when its content is not
valid JSON, when the top level is not an object, or when `schemas` is missing or is not an
array. Each error SHALL name the file it applies to.

#### Scenario: The file is missing

- **WHEN** the loader is pointed at a path that does not exist
- **THEN** it raises an error naming that path

#### Scenario: The file is not valid JSON

- **WHEN** the file's content cannot be parsed as JSON
- **THEN** it raises an error naming the file, rather than returning a partial result

#### Scenario: The top level is not an object

- **WHEN** the file parses but its top level is an array, a string or null
- **THEN** it raises an error, because the registry is a document with room to grow beyond
  its entries

#### Scenario: The schemas key is missing or wrongly typed

- **WHEN** the file parses to an object without a `schemas` key, or with a `schemas` value
  that is not an array
- **THEN** it raises an error naming the file
