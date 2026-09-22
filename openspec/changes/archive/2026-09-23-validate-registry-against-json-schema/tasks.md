## 1. Write the schema

- [x] 1.1 Add a JSON Schema at `schema/openspec-schemas.schema.json` describing the
      document: a top-level object permitting `$schema` and requiring `schemas` as an
      array. Verify a document carrying `$schema` validates and one with an unrelated
      top-level key does not.
- [x] 1.2 Describe an entry: `id`, `name`, `description`, `artifacts`, `source.repo` and
      `source.path` required, with types for each. Verify an entry missing any one of them
      fails.
- [x] 1.3 Constrain the values: `id` matching a lowercase namespaced pattern,
      `description` at most 100 characters, `artifacts` a non-empty array of unique
      strings, `status` an enum of `active` and `deprecated`, `source.ref` optional.
      Verify each constraint rejects a value that breaks it.
- [x] 1.4 Set `additionalProperties: false` on the entry and on `source`, and express that
      `superseded_by` may appear only on a deprecated entry. Verify an entry with
      `maintainer` fails, one with `licence` fails, and one with `superseded_by` while
      `active` fails.

## 2. Write the validator

- [x] 2.1 Add ajv and validate the loaded registry against the schema in `src/core/`.
      Verify a conforming registry passes and a non-conforming one produces ajv errors.
- [x] 2.2 Check `id` uniqueness across entries, reporting both entries in a collision.
      Verify against a fixture with a duplicated `id`.
- [x] 2.3 Check entries are sorted ascending by `id`, reporting which two entries a
      misplaced entry belongs between. Verify against a fixture with one entry out of
      place.
- [x] 2.4 Check every `superseded_by` names an `id` present in the registry. Verify against
      a fixture pointing at an absent entry.
- [x] 2.5 Confirm the validator makes no network request, so it runs in the sandboxed gate.
      Verify by running the suite with networking unavailable.

## 3. Make the errors readable

- [x] 3.1 Report each problem against the entry's `id` rather than its array index, and
      group every problem for one entry together. Verify with a fixture where two entries
      are each wrong in two ways that all four problems appear in one run under two
      headings.
- [x] 3.2 State each rule in a sentence and include the offending value, so a description
      over the limit reports its actual length and its text. Verify the message contains
      both.
- [x] 3.3 Suggest the closest defined field name when an unknown field is close to one,
      so `licence` suggests `license`. Verify the suggestion appears, and that a field
      resembling nothing is reported without a misleading guess.
- [x] 3.4 Write a fixture exercising `status`, `superseded_by`, `language` and
      `requires.openspec`, none of which any real entry uses, and verify the schema accepts
      valid values and rejects invalid ones for each.

## 4. Wire it up

- [x] 4.1 Add a `validate` script to `package.json` running the validator over
      `openspec-schemas.json` and exiting non-zero on failure. Verify `npm run validate`
      passes on the current registry and fails on a deliberately broken copy.
- [x] 4.2 Replace the four stand-in assertions in `test/registry.test.ts` with one test
      asserting the real registry validates. Verify the suite still fails if the registry
      breaks any rule.
- [x] 4.3 Add `"$schema": "./schema/openspec-schemas.schema.json"` to
      `openspec-schemas.json`. Verify the file still loads, still validates, and that an
      editor offers completion from the schema.
- [x] 4.4 Remove `check-jsonschema` from the dev shell in `flake.nix`. Verify
      `nix flake check` still passes and the dev shell still builds.
- [x] 4.5 Run `npm run coverage` and verify overall line coverage is at least 70% and
      `src/core/` at least 80%.

## 5. Close out

- [x] 5.1 Document `npm run validate` in `AGENTS.md` next to the other commands, and point
      `docs/registry-inclusion.md` at it as the way to check an entry before submitting.
      Verify both mention it.
- [x] 5.2 Add the validation to `CHANGELOG.md` under `## [Unreleased]` / `### Added`.
      Verify it follows the existing Keep a Changelog structure.
- [x] 5.3 Run `openspec validate validate-registry-against-json-schema --strict` and verify
      it reports the change as valid.
