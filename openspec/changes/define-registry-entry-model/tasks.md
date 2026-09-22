## 1. Contributor-facing field reference

- [ ] 1.1 Write `docs/registry-entry.md` with a field table covering `id`, `name`,
      `description`, `artifacts`, `source.repo`, `source.path`, `source.ref`,
      `requires.openspec`, `status`, `superseded_by`, `license` and `language`, each row
      stating required or optional and the meaning when absent. State the 100-character
      cap on `description` and the rule that `id` is lowercase while `name` keeps
      upstream's casing. Verify by reading it against the delta spec: every requirement in
      `specs/registry-entry/spec.md` is either a row in the table or a note under it.
- [ ] 1.2 Add a worked example to `docs/registry-entry.md`: the `speclib/tinychange` entry
      with only its required fields, plus a second example showing the optional fields.
      Verify by extracting each JSON block and parsing it (`python3 -m json.tool`).
- [ ] 1.3 State in `docs/registry-entry.md` that the install destination is always
      `openspec/schemas/<name>/` and is not entry data, and that pinning is the consumer's
      responsibility. Verify both statements appear and match the wording of the
      corresponding requirements.
- [ ] 1.4 State in `README.md` that the registry lists schemas you install, so the
      `spec-driven` schema built into the OpenSpec CLI is not listed and a consumer showing
      every available schema merges the two lists. Verify the statement is present.
- [ ] 1.5 Link `docs/registry-entry.md` from `README.md` and `AGENTS.md` under a
      "Registry entry" heading. Verify the relative paths resolve from the repository root.

## 2. Validate the model against real schemas

- [ ] 2.1 Write the entry that `speclib/openspec-tinychange-schema` would get and check
      each required field against the upstream repository: `source.path` holds
      `schema.yaml`, `name` matches its declared `name`, and `artifacts` matches its
      declared artifact ids. Verify the entry needs no optional field to be complete.
- [ ] 2.2 Write the entries that a multi-schema repository would get, using
      `intent-driven-dev/openspec-schemas` and its five schemas, and verify that one entry
      per schema with distinct `source.path` values describes it without loss.
- [ ] 2.3 Write the entry for `Lukk17/openspec-schemas`, the one candidate that publishes
      both tags (`v0.1.0`, `v0.2.0`) and a licence, with `source.ref` and `license` set.
      Verify the optional fields carry what the repository actually declares, and that its
      `master` default branch needs no special case.
- [ ] 2.4 Write the entry for `danielhanold/superspec`, which declares `name: SuperSpec`
      inside a `superspec/` directory. Verify `id` comes out lowercase, `name` keeps its
      casing, and `source.path` is not derivable from either.
- [ ] 2.5 Write a registry description of at most 100 characters for each schema in 2.1
      to 2.4, and verify none of them can be the upstream description unchanged.
- [ ] 2.6 Record any field the cases above could not express in a short "findings"
      section at the end of `docs/registry-entry.md`, or state that they were all
      expressible. Verify the section exists and names each repository checked.

## 3. Close out

- [ ] 3.1 Add the entry model to `CHANGELOG.md` under `## [Unreleased]` / `### Added`,
      naming the capability rather than the file. Verify the entry follows the existing
      Keep a Changelog structure.
- [ ] 3.2 Run `openspec validate define-registry-entry-model --strict` and verify it
      reports the change as valid before archiving.
