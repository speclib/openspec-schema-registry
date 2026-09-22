## 1. Confirm the candidate set

- [x] 1.1 For each of the 8 candidate repositories, answer in writing whether the
      repository exists for the schema: `speclib/openspec-tinychange-schema`,
      `intent-driven-dev/openspec-schemas`, `kmhalvin/openspec-schemas`,
      `JiangWay/openspec-schemas`, `Lukk17/openspec-schemas`, `danielhanold/superspec`,
      `Veath/openspec-spec-driven-superpowers`,
      `griffithkk3-del/openspec-reviewed-workflow`. Verify each answer cites what the
      repository says about itself, not its presence on the curated list.
- [x] 1.2 Check each candidate for a mechanical copy of another candidate's schema,
      comparing the `schema.yaml` files of `JiangWay/superpowers-bridge`,
      `danielhanold/superspec` and `Veath/spec-driven-superpowers`. Verify that any pair
      found identical is reduced to one entry and any pair found diverged keeps both.
- [x] 1.3 Record the final candidate list with a one-line reason per repository. Verify the
      count matches what task 2 writes.

## 2. Write the registry file

- [x] 2.1 Create `openspec-schemas.json` with a top-level object holding an empty `schemas`
      array. Verify it parses with `python3 -m json.tool`.
- [x] 2.2 Write an entry for each admitted schema using the fields the `registry-entry`
      capability requires, taking `name` and `artifacts` from each upstream `schema.yaml`.
      Verify every entry has the six required fields and that `name` and `artifacts` match
      upstream exactly.
- [x] 2.3 Write a registry description of at most 100 characters for each entry. Verify
      each one is within the limit and that none is an upstream description pasted
      unchanged.
- [x] 2.4 Set `license` from each repository's licence file, leaving it absent where there
      is none, and set `source.ref` only for `Lukk17/openspec-schemas`, the one candidate
      that publishes tags. Verify each value against the repository rather than from
      memory.
- [x] 2.5 Sort the `schemas` array ascending by `id`. Verify with a command that reads the
      ids out of the file and compares them against their sorted order.

## 3. Verify the file against reality

- [x] 3.1 For every entry, resolve `source.repo` at `source.ref` or the default branch and
      confirm `source.path` holds a `schema.yaml`. Verify all entries resolve, and note
      that `Lukk17/openspec-schemas` defaults to `master` rather than `main`.
- [x] 3.2 Install one entry end to end into a throwaway project and run
      `openspec schema validate <name>`. Verify it reports the schema as valid.
- [x] 3.3 Confirm no two entries share an `id`, and list any pair sharing a `name` so the
      collision is known rather than discovered by a consumer. Verify the check runs off
      the file itself.

## 4. Document the rule

- [x] 4.1 Document the admission rule in the repository: a schema is listed only when its
      repository exists to publish it, and the mechanical check alone is never enough.
      Verify the wording matches the requirement in `specs/registry-file/spec.md`.
- [x] 4.2 Document that entries are sorted ascending by `id` and why a submitter can
      compute their own insertion point. Verify the statement is present alongside the
      admission rule.
- [x] 4.3 State that the registry does not aim to be complete, so a valid schema absent
      from it is absent by rule rather than by oversight. Verify the statement is present.

## 5. Make the listing traceable

- [x] 5.1 Verify every entry links to its source repository, so a reader can reach the
      author who published the schema from the entry alone.
- [x] 5.2 Document the correction and removal path: unconditional, no reason needed, and
      the author's wording taken over the registry's. Verify it matches the requirement in
      `specs/registry-file/spec.md`.

## 6. Close out

- [x] 6.1 Add the seeded registry to `CHANGELOG.md` under `## [Unreleased]` / `### Added`,
      naming the file and the number of entries. Verify it follows the existing Keep a
      Changelog structure.
- [x] 6.2 Run `openspec validate seed-registry-with-known-schemas --strict` and verify it
      reports the change as valid before archiving.
