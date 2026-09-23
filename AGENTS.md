# openspec-schema-registry

A registry of OpenSpec schemas in the wild.

The product is one JSON file, `openspec-schemas.json`, which lists every known
OpenSpec schema: what it is called, what it is for, where its source lives, and
what installing it does to a project. OpenSpec utilities read this file to
discover schemas and to install one into a project's `openspec/` directory,
so the file is a contract, not a README in JSON clothing.

Around that file sit a JSON Schema that validates it, a test suite that checks
every entry resolves, and a published URL that consumers can fetch.

## Commands

```bash
npm install            # install dependencies
npm run build          # type-check and build
npm test               # run the vitest suite
npm run coverage       # tests with a coverage report
npm run validate       # check openspec-schemas.json: schema, unique ids, ordering
npm run check-sources  # check every entry against its upstream schema.yaml (network)

nix develop            # dev shell with node and the tooling
nix flake check        # build + tests + coverage gate (>=70% overall, >=80% core)

beans list             # show milestones, epics and tasks
openspec list          # show active changes

scripts/ship-change.sh <change-name> [commit-subject]
```

## Registry entry

The shape of one entry in `openspec-schemas.json` is documented in
[docs/registry-entry.md](docs/registry-entry.md). Read it before adding or editing an entry;
the normative version is `openspec/specs/registry-entry/spec.md`.

## Beans

When I refer to issues like openspec-schema-registry-rn3b checkout the task
in @.beans/openspec-schema-registry-rn3b-*.md

In this project we will use these tasks as epics for making openspec proposals.

WHEN you create a proposal at a link to this task in the proposal.md.
WHEN a bean is used to create an proposal change the status to "in-progress"
WHEN a proposal is archived add the link to the archived proposal in the frontmatter of this task like this:

```
openspec-link: openspec/changes/archive/....
```

You are allowed to update these statuses in the task frontmatter:

- in-progress
- todo
- draft
- completed
- scrapped

When making changes you are allowed to update the date/time in `updated_at` in the task frontmatter

Besides updating status and openspec-link, you are NOT ALLOWED to modify the contents of the task file.
