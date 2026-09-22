# What gets listed

The registry lists OpenSpec workflow schemas that someone published for other people to
install. Two tests decide whether a schema belongs, and both have to pass.

## The mechanical test

`source.repo` at `source.ref`, or at the repository's default branch, must hold a
`schema.yaml` under `source.path` that `openspec schema validate` accepts. This one a
machine can run.

Run `npm run validate` before submitting an entry. It checks everything that can be checked
without the network: the entry's shape against the JSON Schema, that no `id` repeats, that
entries stay sorted by `id`, and that a `superseded_by` names an entry that exists. It
names any entry it objects to and says what to change.

## The judgement

**Does this repository exist for the schema?**

A search of GitHub for `schema.yaml` files mentioning OpenSpec returns dozens of
repositories, and nearly all of them pass the mechanical test. Very few are offers. The
ones that are not fall into recognisable groups:

- a product repository that defines a custom workflow for its own development
- a project template whose schema is internal plumbing for what it generates
- a configuration repository carrying a copy of somebody else's schema among unrelated files

Installing any of those into your project would be meaningless. A valid schema is not the
same thing as a published one, so the mechanical check alone is never grounds for
inclusion.

When a schema author submits their own entry, the submission answers this question by
itself. The judgement matters most for entries added without a submission.

## Originals, not copies

Where the same schema appears in more than one repository, the registry lists the
repository that publishes it. A copy checked into an unrelated repository gets no entry.

Two schemas that began from a common ancestor and have since diverged are two originals,
and both are listed. The rule is about copied files, not about lineage.

## Ordering

Entries are sorted ascending by `id`. Because `id` is lowercase and namespaced by owner,
exactly one position in the array is correct for any entry, and a reviewer can confirm it
by looking at the two neighbours. Entries from one owner end up next to each other.

## Completeness is not a goal

The registry does not try to list every OpenSpec schema that exists. A valid schema that is
absent is absent by this rule, not by oversight. If your schema is published for reuse and
is not listed, submit it.

## Being listed without asking

The registry was seeded with schemas whose authors had not submitted them. Nobody was
contacted about it, so you may be reading this because you found your own schema in the
list.

Every entry links to the repository it came from, and this offer stands permanently. If
your schema is listed and you would rather it were not, ask and it will be removed. No
reason is needed, and there is nothing to discuss. If an entry says something inaccurate
about your schema, your correction is taken over ours: `name` and `artifacts` are copied
from your `schema.yaml`, but the description was written here, capped at 100 characters so
a listing stays readable.

## The seed audit

The seed came from the schemas curated in
[awesome-openspec](https://github.com/speclib/awesome-openspec). Twelve repositories were
listed there under schemas and extensions; five turned out to contain no `schema.yaml` at
all, being skills, kits or plugins rather than workflow schemas. The remaining seven, plus
`speclib/openspec-tinychange-schema`, were checked one by one.

| Repository | Schemas | Exists for the schema? |
| ---------- | ------- | ---------------------- |
| `danielhanold/superspec` | 1 | Yes. Describes itself as "OpenSpec + SuperPowers". |
| `griffithkk3-del/openspec-reviewed-workflow` | 1 | Yes. "A workflow extension, not a standalone tool." |
| `intent-driven-dev/openspec-schemas` | 5 | Yes. "Custom OpenSpec schemas packaged as copyable folders." |
| `JiangWay/openspec-schemas` | 1 | Yes. "Each schema is a self-contained bundle that you copy into your project." |
| `kmhalvin/openspec-schemas` | 2 | Yes. "A collection of workflow schemas for OpenSpec." |
| `Lukk17/openspec-schemas` | 1 | Yes. "Community OpenSpec schemas for spec-driven AI workflows." |
| `speclib/openspec-tinychange-schema` | 1 | Yes. The repository is the schema. |
| `Veath/openspec-spec-driven-superpowers` | 1 | Yes. "A stronger OpenSpec workflow" for others to adopt. |

Three of them publish schemas in the same superpowers family, so their `schema.yaml` files
were compared directly. No pair was identical: the closest two differ across hundreds of
lines. They are relatives, not copies, so all three are listed.

That gives 13 entries from 8 repositories.
