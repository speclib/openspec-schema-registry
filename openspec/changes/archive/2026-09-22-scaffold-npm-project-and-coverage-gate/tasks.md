## 1. Create the npm project

- [x] 1.1 Add `package.json` with the `build`, `test` and `coverage` scripts named in
      `CLAUDE.md`, and `tsconfig.json` for a TypeScript ES module build. Verify
      `npm run build` type-checks and emits without error.
- [x] 1.2 Add vitest with a coverage provider configured to write a `json-summary` report
      to `coverage/`. Verify `npm run coverage` produces `coverage/coverage-summary.json`.
- [x] 1.3 Run `npm install` to produce `package-lock.json`. Verify the lock file exists and
      `npm ci` succeeds from it.

## 2. Write the loader

- [x] 2.1 Create `openspec-schemas.json` holding a top-level object with an empty `schemas`
      array. Verify it parses with `jq empty`.
- [x] 2.2 Implement the loader in `src/core/` so it returns entries in file order and an
      empty list for an empty registry. Verify against the first requirement's scenarios.
- [x] 2.3 Implement the failure behaviour: a missing file, invalid JSON, a non-object top
      level, and a missing or wrongly typed `schemas` key each raise an error naming the
      file. Verify against the second requirement's four scenarios.
- [x] 2.4 Export the loader from `src/index.ts`. Verify the built output exposes it.

## 3. Cover it

- [x] 3.1 Write tests covering every scenario in `specs/registry-loading/spec.md`, using
      fixture files rather than the real registry. Verify each scenario has at least one
      test.
- [x] 3.2 Add a test that loads the real `openspec-schemas.json` and asserts it returns an
      empty list, so the shipped file stays loadable. Verify it passes.
- [x] 3.3 Run `npm run coverage` and verify overall line coverage is at least 70% and
      `src/core/` is at least 80%.

## 4. Wire up the gate

- [x] 4.1 Record the npm dependency hash in `nix/npm-deps-hash.txt`, taking the value
      `nix flake check` reports on mismatch. Verify the flake stops reporting a hash
      mismatch.
- [x] 4.2 Run `nix flake check` and verify both checks pass: `registry-json` and
      `build-test-coverage`.
- [x] 4.3 Add a `.gitignore` entry for `node_modules/` and `coverage/` if not already
      present. Verify `git status` shows neither.

## 5. Close out

- [x] 5.1 Document in `README.md` how to repair a dependency hash mismatch, since the
      failure message is the only place the expected hash appears. Verify the instruction
      is present.
- [x] 5.2 Add the scaffolding to `CHANGELOG.md` under `## [Unreleased]` / `### Added`.
      Verify it follows the existing Keep a Changelog structure.
- [x] 5.3 Run `openspec validate scaffold-npm-project-and-coverage-gate --strict` and
      verify it reports the change as valid.
