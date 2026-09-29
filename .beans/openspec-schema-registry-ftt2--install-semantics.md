---
# openspec-schema-registry-ftt2
title: Install semantics
status: todo
type: epic
priority: normal
created_at: 2026-09-22T14:05:24Z
updated_at: 2026-09-29T21:01:08Z
parent: openspec-schema-registry-58p4
---

Specify what installing an entry does to a project: which files land where, how an existing install is upgraded, and how a conflict is reported.


## What the first consumer does (ossm, 2026-09-29)

`speclib/openspec-schema-manager` implements installing and ran the route end to
end before building on it. Three findings, the first of which answers the
question this bean exists for.

**There is no install-from-source command.** OpenSpec 1.10.0's `openspec schema`
offers `which`, `validate`, `fork` and `init` and nothing else, all marked
experimental. `fork` takes a schema OpenSpec can already resolve, not a path, so
it cannot install from a registry entry.

**The sanctioned route works and is now asserted.** Copy the folder to
`openspec/schemas/<name>/`, then:

- `openspec schema validate <name> --json` answers `"valid": true`
- `openspec schema which <name> --json` answers `"source": "project"`
- `openspec new change x --schema <name>` succeeds

An end to end test in ossm asserts all three against a schema it installed
itself.

**OpenSpec requires an artifact `description`.** A schema whose artifact omits
it is rejected:

```
Invalid schema: artifacts.0.description: Invalid input: expected string, received undefined
```

This is worth checking against what the registry lists. Any entry whose upstream
schema omits `description` on an artifact cannot be installed by anyone, and the
source-checking workflow in `openspec-schema-registry-66lh` would be the natural
place to catch it.

### On upgrading

`docs/registry-entry.md` already settles the destination (`openspec/schemas/<name>/`,
derived from `name`, never from entry data) and the collision rule (report,
never overwrite). What it does not settle is upgrading, and ossm cannot settle
it either:

**OpenSpec records no provenance.** Nothing written at install time says which
entry a schema came from or at which ref. So a consumer cannot tell whether the
directory holds this entry's schema, another entry's, or a hand edit.

ossm therefore does not offer an upgrade. It offers a comparison: fetch the
entry declaring the same name, compare the files, and report whether they
differ, saying plainly that it cannot tell an upstream change from a local edit.
Matching is by `name`, which this registry explicitly does not make unique, so
more than one match is its own answer naming the candidates.

Overwriting is available but is its own confirmation with its own key, and its
wording says why it is separate.

Worth deciding here: whether the registry wants to say anything about
provenance, or whether that is a request to make of OpenSpec rather than
something the registry can carry.
