## 1. Point the document and the schema at their addresses

- [ ] 1.1 Change `$schema` in `openspec-schemas.json` from the relative path to
      `https://registry.speclib.org/api/v1/schema.json`. Verify `npm run validate` still
      passes and the JSON Schema still permits the key.
- [ ] 1.2 Add `"$id": "https://registry.speclib.org/api/v1/schema.json"` to the JSON Schema.
      Verify ajv compiles it without complaint and the suite still passes.
- [ ] 1.3 Confirm the schema no longer needs to sit in a `schema/` subdirectory for the
      pointer to resolve, since it is absolute. Verify by loading a copy of the registry from
      a directory holding nothing else.

## 2. Assemble what gets published

- [ ] 2.1 Add a script that assembles the publishable directory: `openspec-schemas.json` at
      `api/v1/openspec-schemas.json` and the JSON Schema at `api/v1/schema.json`. Verify the
      output contains exactly those two files.
- [ ] 2.2 Assert the published copy is byte-identical to the repository's. Verify with a test
      comparing the bytes rather than the parsed values, so a reformatting would fail it.
- [ ] 2.3 Add a test that the assembled directory places nothing at its root, keeping the
      root free for a page. Verify it fails if a file is added there.

## 3. Deploy it

- [ ] 3.1 Add a GitHub Actions workflow that runs `npm run validate`, assembles the directory
      and deploys it to GitHub Pages on a push to `main` touching the published files or the
      workflow. Verify the workflow parses and that validation runs before the deploy step.
- [ ] 3.2 Confirm the deploy step cannot run when validation fails. Verify by reading the job
      dependencies rather than by breaking the registry.
- [ ] 3.3 Give the workflow only the permissions Pages deployment needs. Verify no secret
      beyond the one GitHub provides is referenced.

## 4. Document the contract

- [ ] 4.1 Document the canonical URL in `README.md`, along with what a consumer may rely on:
      the address is stable, the contents change as entries arrive, and one request returns
      every entry. Verify all three statements are present.
- [ ] 4.2 Document what `v1` means, using the definition that the version changes when a
      consumer reading the current version correctly would misread the new document, and that
      a published version keeps being served. Verify both halves appear.
- [ ] 4.3 Document the raw URL as a fallback outside the contract, and as the place to fetch
      a commit-addressed copy when a consumer needs a fixed one. Verify the distinction from
      the canonical URL is explicit.
- [ ] 4.4 Note in `docs/registry-inclusion.md` that a merged entry appears at the canonical
      URL on the next deploy. Verify the statement is present.

## 5. Close out

- [ ] 5.1 Run `npm run coverage` and verify overall line coverage is at least 70% and
      `src/core/` at least 80%.
- [ ] 5.2 Run `nix flake check` and verify it passes.
- [ ] 5.3 Add the publication to `CHANGELOG.md` under `## [Unreleased]` / `### Added`, naming
      the canonical URL. Verify it follows the existing Keep a Changelog structure.
- [ ] 5.4 Run `openspec validate publish-registry-at-a-stable-url --strict` and verify it
      reports the change as valid.

## 6. Go live, once DNS resolves

- [ ] 6.1 Point `registry.speclib.org` at GitHub Pages and confirm it resolves. This step is
      the domain owner's and gates the rest of this group.
- [ ] 6.2 Add the `CNAME` file naming `registry.speclib.org`, and enable Pages for the
      repository. Verify only after 6.1 resolves, because a configured custom domain makes
      GitHub redirect the github.io address to it.
- [ ] 6.3 Fetch `https://registry.speclib.org/api/v1/openspec-schemas.json` and verify it
      returns the 13 entries with `content-type: application/json`.
- [ ] 6.4 Fetch `https://registry.speclib.org/api/v1/schema.json` and verify the document's
      `$schema` resolves to it.
