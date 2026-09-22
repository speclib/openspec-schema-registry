# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Project scaffolding: OpenSpec, Beans, a Nix flake, and the ship script.
- An npm project with TypeScript, vitest and a coverage report, so `nix flake check`
  runs the build, the tests and the coverage gate.
- A loader that reads `openspec-schemas.json` and refuses a file it cannot trust,
  naming the file in every error.
- `openspec-schemas.json`, created empty and ready for its entries.
- A registry entry model: six required fields, defined defaults for the optional ones,
  and a field reference in `docs/registry-entry.md`.
- `openspec-schemas.json` seeded with 13 workflow schemas from 8 repositories, sorted by
  `id`, each one checked against its upstream `schema.yaml`.
- `docs/registry-inclusion.md`: what qualifies for the registry, why entries are ordered
  by `id`, and how a listed author corrects or withdraws an entry.

### Changed

### Fixed
