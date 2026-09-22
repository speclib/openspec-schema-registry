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

### Changed

### Fixed
