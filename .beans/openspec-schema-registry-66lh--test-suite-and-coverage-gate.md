---
# openspec-schema-registry-66lh
title: Test suite and coverage gate
status: completed
type: epic
priority: normal
created_at: 2026-09-22T14:05:24Z
updated_at: 2026-09-23T09:30:44Z
parent: openspec-schema-registry-7pxx
openspec-link: openspec/changes/archive/2026-09-22-scaffold-npm-project-and-coverage-gate
---

Vitest suite over the registry: conformance to the meta-schema, unique ids, resolvable URLs. Coverage reported so nix flake check can enforce >=70% overall and >=80% on core packages.

## Summary of Changes

Completed in two changes. The scaffold change delivered the npm project, the vitest suite and
the coverage gate; this one delivered the checks over the registry itself.

Conformance and unique ids arrived with the JSON Schema epic. What remained was resolvable
sources, and the epic's framing had to bend: the gate builds in a sandbox with no network, so
a networked check cannot live in the suite the gate runs. It became this project's first
GitHub Actions workflow instead, on three triggers. The push trigger matters most, because
`scripts/ship-change.sh` pushes straight to `main` and no pull request has ever been opened
here.

A difference is classified by what it costs a consumer: fatal when the source has gone,
semantic when `name` changed (which moves the install directory and the `--schema` argument),
benign when `artifacts` changed. All three fail the check, so a green badge means every entry
matches its source. A source that could not be reached is retried, then reported as
undetermined without failing, because a badge that flips on a network blip stops being read.

Classification is a pure function in `src/core/` tested with fixtures; fetching is thin and
tested with an injected fetcher, so the suite makes no network request. `npm run
check-sources` runs the same check by hand.
