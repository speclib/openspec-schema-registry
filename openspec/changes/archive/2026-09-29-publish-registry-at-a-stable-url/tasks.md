## 1. Point the document and the schema at their addresses

- [x] 1.1 Change `$schema` in `openspec-schemas.json` from the relative path to
      `https://registry.speclib.org/api/v1/schema.json`. Verify `npm run validate` still
      passes and the JSON Schema still permits the key.
- [x] 1.2 Add `"$id": "https://registry.speclib.org/api/v1/schema.json"` to the JSON Schema.
      Verify ajv compiles it without complaint and the suite still passes.
- [x] 1.3 Confirm the schema no longer needs to sit in a `schema/` subdirectory for the
      pointer to resolve, since it is absolute. Verify by loading a copy of the registry from
      a directory holding nothing else.

## 2. Assemble what gets published

- [x] 2.1 Add a script that assembles the publishable directory: `openspec-schemas.json` at
      `api/v1/openspec-schemas.json` and the JSON Schema at `api/v1/schema.json`. Verify the
      output contains exactly those two files.
- [x] 2.2 Assert the published copy is byte-identical to the repository's. Verify with a test
      comparing the bytes rather than the parsed values, so a reformatting would fail it.
- [x] 2.3 Add a test that the assembled directory places nothing at its root, keeping the
      root free for a page. Verify it fails if a file is added there.

## 3. Deploy it

- [x] 3.1 Add an `amplify.yml` whose build phase runs `npm run validate` and then assembles
      the publishable directory, with the assembled directory as the artifact base. Verify it
      parses as the Amplify build spec format and that validation runs before the assembly
      step.
- [x] 3.2 Confirm the deploy cannot happen when validation fails. Verify by reading the build
      spec rather than by breaking the registry: a non-zero command in the build phase fails
      the build, and a failed build leaves the previous deployment serving.
- [x] 3.3 Confirm the build needs no credential of its own. Verify that `amplify.yml`
      references no secret and no environment variable beyond what the assembly script reads
      from the repository.

## 4. Document the contract

- [x] 4.1 Document the canonical URL in `README.md`, along with what a consumer may rely on:
      the address is stable, the contents change as entries arrive, and one request returns
      every entry. Verify all three statements are present.
- [x] 4.2 Document what `v1` means, using the definition that the version changes when a
      consumer reading the current version correctly would misread the new document, and that
      a published version keeps being served. Verify both halves appear.
- [x] 4.3 Document the raw URL as a fallback outside the contract, and as the place to fetch
      a commit-addressed copy when a consumer needs a fixed one. Verify the distinction from
      the canonical URL is explicit.
- [x] 4.4 Note in `docs/registry-inclusion.md` that a merged entry appears at the canonical
      URL on the next deploy. Verify the statement is present.

## 5. Close out

- [x] 5.1 Run `npm run coverage` and verify overall line coverage is at least 70% and
      `src/core/` at least 80%. Done 2026-09-29: 95.18% overall, 97.65% on `src/core/`.
- [x] 5.2 Run `nix flake check` and verify it passes. Done 2026-09-29: all checks passed.
- [x] 5.3 Add the publication to `CHANGELOG.md` under `## [Unreleased]` / `### Added`, naming
      the canonical URL. Verify it follows the existing Keep a Changelog structure.
- [x] 5.4 Run `openspec validate publish-registry-at-a-stable-url --strict` and verify it
      reports the change as valid.

## 6. Go live, once the Amplify app exists

- [x] 6.1 Have the Amplify app, its `main` branch and its domain association for
      `registry.speclib.org` declared and applied in
      `wasnel-awsaccount-104144963194-main`. This step belongs to that repository and gates
      the rest of this group. Done 2026-09-29 by that repository's change
      `add-speclib-registry-site`: app `d2tc6q5rksf2gj` in account 104144963194,
      eu-central-1, branch `main`, association `AVAILABLE`, and the AWS Amplify GitHub App
      installed on the `speclib` org. The app builds this repository, so `amplify.yml` from
      group 3 is what it will run.
- [x] 6.2 Confirm Amplify wrote the certificate validation records and the host record into
      the `speclib.org` zone, and that `registry.speclib.org` resolves and serves HTTPS.
      Verify from a resolver rather than from the Amplify console. Done 2026-09-29:
      `dig @1.1.1.1 registry.speclib.org` returns a CNAME to `d17jskweo18ulc.cloudfront.net`,
      and an HTTPS request to the host completes with a certificate that verifies.
- [x] 6.3 Fetch `https://registry.speclib.org/api/v1/openspec-schemas.json` and verify it
      returns the 13 entries with `content-type: application/json`. Done 2026-09-29: 200,
      `content-type: application/json`, 13 entries, and the bytes compare equal to
      `openspec-schemas.json` in the repository.
- [x] 6.4 Fetch `https://registry.speclib.org/api/v1/schema.json` and verify the document's
      `$schema` resolves to it. Done 2026-09-29: the published document's `$schema` is that
      URL, the URL returns 200 with the matching `$id`, and its bytes compare equal to
      `schema/openspec-schemas.schema.json`.
- [x] 6.5 Verify the root answers without serving the registry from it, confirming the
      reserved-root requirement holds against the real host rather than against the assembled
      directory alone. Done 2026-09-29: the root answers 404 with an empty body, so nothing
      is served from it and the address is free for the page `h885` will add.
