## 1. Classify a difference

- [x] 1.1 Add a YAML parser as a development dependency and a function in `src/core/` that
      reads a `schema.yaml` text and returns its declared `name` and artifact ids. Verify it
      handles a quoted name and a folded description, which regular expressions would get
      wrong.
- [x] 1.2 Add a pure function in `src/core/` comparing one entry against a parsed
      `schema.yaml` and returning no difference, or a difference classified as semantic or
      benign. Verify with fixtures for a match, a renamed schema, added artifacts and
      removed artifacts.
- [x] 1.3 Report a semantic difference with both the entry's `name` and the upstream one,
      and a benign difference with what was added and what was removed. Verify each message
      names the values rather than only stating that something changed.
- [x] 1.4 Represent a source that does not resolve as fatal, and one that could not be
      reached as undetermined, as values the classifier can return without performing any
      IO. Verify the two are distinct and that neither is confused with a benign difference.

## 2. Fetch and retry

- [x] 2.1 Add a command in `src/` that resolves each entry's `schema.yaml` from
      `source.repo` at `source.ref` or the repository's default branch, under
      `source.path`. Verify against a fixture registry with an injected fetcher, with no
      real network request in the test.
- [x] 2.2 Treat a definitive "not found" as fatal, and rate limiting, server errors and
      network failures as unreachable. Verify each status maps to the class the spec
      requires.
- [x] 2.3 Retry an unreachable source with a backoff before concluding anything, and report
      an entry as undetermined only after the retries are exhausted. Verify a source that
      fails once and then succeeds is checked normally and reports nothing.
- [x] 2.4 Use `GITHUB_TOKEN` when it is present so rate limiting does not hide drift, and
      work without it. Verify both paths.

## 3. Report and exit

- [x] 3.1 Report every difference in one run, grouped by entry, naming the class of each.
      Verify with a fixture registry where more than one entry differs.
- [x] 3.2 Exit non-zero on any fatal, semantic or benign difference, and zero when the only
      finding is that an entry could not be determined. Verify each case.
- [x] 3.3 State in the report which entries could not be determined, so a pass that skipped
      entries is visible rather than silent. Verify the count appears even when the command
      exits zero.
- [x] 3.4 Add a `check-sources` script to `package.json` running the command over
      `openspec-schemas.json`. Verify it passes against the current registry.

## 4. Run it in CI

- [x] 4.1 Add a GitHub Actions workflow running the check on a push to `main` touching
      `openspec-schemas.json`, on a pull request touching it, and on a nightly schedule.
      Verify the workflow file parses and its three triggers are present.
- [x] 4.2 Pass `GITHUB_TOKEN` to the check and confirm the workflow needs no other secret.
      Verify by reading the workflow: no secret beyond the one GitHub provides.
- [x] 4.3 Add the workflow's badge to `README.md`. Verify the badge URL matches the
      workflow's file name and that it renders.
- [x] 4.4 Note in `README.md` what a red badge means and what to do about each class, so a
      reader can tell an emergency from a chore. Verify all three classes are covered.

## 5. Close out

- [x] 5.1 Run `npm run coverage` and verify overall line coverage is at least 70% and
      `src/core/` at least 80%.
- [x] 5.2 Run `nix flake check` and verify it still passes and still performs no network
      request.
- [x] 5.3 Document `npm run check-sources` in `AGENTS.md` next to the other commands, and
      mention it in `docs/registry-inclusion.md` as the check that runs after an entry is
      merged. Verify both mention it.
- [x] 5.4 Add the source check to `CHANGELOG.md` under `## [Unreleased]` / `### Added`.
      Verify it follows the existing Keep a Changelog structure.
- [x] 5.5 Run `openspec validate check-entry-sources-in-ci --strict` and verify it reports
      the change as valid.
