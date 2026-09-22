## Context

See proposal.md for motivation. The approach is shaped by what a survey of the ecosystem
turned up, so the numbers come first.

Two searches, two very different answers:

```
   awesome-openspec, "Schemas & Extensions"     12 curated repositories
        │ does it contain a schema.yaml?
        ▼
   7 yes, 5 no                                  the 5 are skills, kits and plugins
        │
        ▼
   12 schemas, plus tinychange = 13 entries


   GitHub code search, filename:schema.yaml     77 distinct repositories
                                                (capped at 100 hits, so a floor)
```

The 77 fall into five groups, and only the first is a candidate:

- published for reuse: the repository exists to share the schema
- project-local: a product repository with its own private workflow
- embedded in a template: the schema is the template's internal plumbing
- vendored copies: someone else's schema checked into an unrelated repository
- the CLI built-in, which the entry model already excludes

Every one of the 77 passes the mechanical admission test from `registry-entry`. Most of
them would be nonsense to install.

## Goals / Non-Goals

**Goals:**
- A registry that holds real, resolvable, useful entries on day one.
- An admission rule that a reviewer can apply consistently and explain to a contributor.
- Consent for every third party listed, obtained after the fact but genuinely obtained.

**Non-Goals:**
- Completeness. The registry does not attempt to list every schema that exists.
- Discovering schemas by sweeping GitHub. Submission is the long-term intake path.
- Formalising the document envelope. That is the JSON Schema epic's job; this change
  writes the minimum structure the file needs to exist.

## Decisions

### Admission needs a judgement the machine cannot make

The entry model's test is necessary and nowhere near sufficient. What separates a candidate
from the other 76 is intent: was this schema published for other people to install? No API
field answers that. The question that comes closest, and that a reviewer can answer by
opening the repository, is whether the repository exists for the schema.

Submission answers the same question by construction, which is why this rule matters most
during seeding and fades afterwards. It stays in the spec because a reviewer still needs it
when a submission arrives from a repository that is about something else.

### The seed is the curated list, not the sweep

Three options were weighed: tinychange alone, the schemas already curated in
`awesome-openspec`, and an audited sweep of the 77.

The curated list wins on the property that matters, which is not its size. Those
repositories passed a human review once already to get onto that list, so the intent
judgement is inherited from a review that happened for an unrelated reason and was not
bent to fit this registry. The sweep would mean 60-odd fresh judgement calls made by us
alone, at the exact moment the registry has no track record to justify them.

Listing tinychange alone was rejected for a plain reason: a registry with one entry gives a
consumer no reason to fetch it, and the first submitter no pattern to copy.

### Fork metadata cannot identify originals, so a reviewer does

Not one of the eight seed repositories is a GitHub fork, and neither is the one known
vendored copy. Every derivative in this ecosystem was copied by hand. So `fork: true`,
`parent` and creation dates are all useless here, and the origin question collapses back
into the admission question: a repository that exists for the schema is publishing it, and
a repository that merely contains it is not.

One nuance the data forced: two of the candidates were created a day apart, share an
opening sentence, and now declare different artifact pipelines. They are relatives, not
copies. The rule is about mechanical copies of files, not about lineage, so both are
listed.

### Sort by `id`, not by `name`

`name` is not unique across the registry, so it cannot give a deterministic position, and
an author with several schemas would find their entries scattered through the file. Sorting
by `id` groups an owner's entries together and makes a submission's insertion point
computable from the entry alone, which is what makes the rule cheap to review and, later,
cheap to lint. The neighbouring `awesome-openspec` repository already lints alphabetical
order, so the pattern is established.

### The envelope stays minimal

The file needs a shape before it can hold anything, so this change settles the least that
works: a top-level object with a `schemas` array. An object rather than a bare array, so
the JSON Schema epic can add a `$schema` pointer or a document version without a breaking
change. Everything beyond that is deferred rather than guessed.

### Notification is a task, not a courtesy

Seven authors get listed without asking. Opening an issue on each repository is what turns
an inferred consent into a real one, and it recruits the person best placed to keep the
entry accurate. It also creates the correction path the registry promises, which is why the
spec requires honouring a removal request without argument: the alternative is a registry
that publishes claims about other people's work over their objection.

It runs last, after the entries are verified, because the issue shows the author their
entry. An issue that shows them a wrong entry costs more goodwill than it earns.

## Risks / Trade-offs

- **Listing people who did not ask.** Even with notification, the first contact is a fait
  accompli. → Keep the entry to verifiable facts plus a short description, make the
  withdrawal path unconditional, and keep the set small enough that each entry was checked
  by hand.
- **The description is written by us for someone else's work.** A registry-authored line
  can misrepresent a schema's intent. → The notification issue shows the author exactly
  that line, and their correction wins over ours.
- **Inherited judgement can be wrong.** A repository on the curated list might not really
  be published for reuse. → The admission question is applied to each of the 8 repositories
  rather than assumed from the list membership.
- **Thirteen entries go stale together.** Nothing pins them, and all but one lack tags. →
  The drift check belongs to the test suite epic; the seed's job is to make sure it has
  something to check.
- **The sweep found 77 repositories and the seed lists 8.** Somebody will notice the gap
  and read it as an incomplete registry. → State in the documentation that inclusion
  requires publication for reuse, so the gap reads as a rule rather than an oversight.

## Open Questions

- Whether a future audited sweep of the remaining repositories is worth doing at all, or
  whether submission alone should fill the registry from here. Answering it needs to see
  how the submission path performs, so it cannot be settled now.
