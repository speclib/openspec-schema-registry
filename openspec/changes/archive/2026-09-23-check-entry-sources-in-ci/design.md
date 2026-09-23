## Context

See proposal.md for motivation. Four measurements shaped this design.

**The check is cheap.** Running it by hand against all 13 entries takes 13 requests and
under six seconds. With `GITHUB_TOKEN` the rate limit is 5000 requests an hour. Cost is not
a constraint, so nothing here is designed around batching or sampling.

**Twelve of thirteen entries can drift.** Only `lukk17/e2e-runbooks` pins a ref. Every other
entry follows its repository's default branch.

**This project has never opened a pull request.** `scripts/ship-change.sh` runs the gate,
archives, commits and pushes straight to `main`. A pull-request-only trigger would have
checked nothing that has happened so far.

**The gate cannot do this.** `nix flake check` builds in a sandbox with no network, which is
exactly why the offline validator is worth having and exactly why it cannot cover sources.

## Goals / Non-Goals

**Goals:**
- Notice when the registry stops describing its sources accurately.
- A signal that stays trustworthy, so that a red badge always means something is wrong.
- The same check available by hand as in CI.

**Non-Goals:**
- Validating that an upstream schema is still a valid OpenSpec schema. The admission rule
  puts that on the reviewer when an entry is admitted.
- Correcting drift automatically. A rename may be deliberate, and deciding is a person's
  job.
- Changing what `nix flake check` does.

## Decisions

### A single fetch answers every question

`source.repo` plus `source.ref` plus `source.path` identifies one file, and that file
carries both `name` and `artifacts`. Fetching it tells us whether the source resolves and
whether either field has moved, so the check is one request per entry rather than three.

### Drift is classified, because the responses differ

```
   fatal      the source does not resolve
              a consumer following the entry gets nothing

   semantic   name changed upstream
              the install directory and the --schema argument both change.
              Someone has to decide whether it is still the same schema.

   benign     artifacts changed upstream
              our copy is stale; nothing a consumer does breaks meanwhile

   unreachable   rate limited, server error, network failure
              not a difference at all, and reporting it as one is how a
              scheduled check becomes noise that nobody reads
```

The fourth is the load-bearing one. A badge is a single bit, and a bit that flips on a
GitHub blip teaches the reader to ignore it. So an unreachable source is retried, and a check
that still cannot reach it says it could not tell rather than inventing a verdict. A
definitive "not there" is fatal; a refusal to answer is not.

`awesome-openspec` next door already separates these, treating `403` differently from `404`
in its stats fetcher. It records the error into its data rather than failing, because it is
building a site and a dead link should not stop a deploy. The inversion is deliberate here:
we want the failure loud, and we must not write results back into `openspec-schemas.json`,
because the registry is hand-authored and a bot editing it would fight the contribution
model.

### Benign drift fails the check too

This was the one genuine judgement call, because with a single badge the classes have to
collapse into one bit. Letting benign drift stay green keeps the badge quieter but makes it
mean "nothing is catastrophically broken", which is a much weaker promise than "the registry
matches its sources".

For thirteen entries the correction is a one-line commit and drift will be rare, so the
stricter reading costs little. The classification still exists in the report, so a reader can
see at a glance whether a red badge is an emergency or a chore.

### Three triggers, one workflow, one badge

```
   push to main, paths: openspec-schemas.json    how this project actually ships
   pull_request, paths: openspec-schemas.json    how contributors will ship, later
   schedule, nightly, every entry                the only trigger that catches drift
```

The push trigger is the one that matters today and would have been missed by following the
epic's framing. The pull request trigger exists for `openspec-schema-registry-la9x`, which
has no contributions yet.

Keeping all three in one workflow yields one badge, and a workflow badge reflects the latest
run on the default branch, so pull request runs do not colour it. The badge therefore says
"the registry was last seen matching its sources".

One caution recorded for later: a path-filtered workflow reports as skipped rather than
passed on unrelated pull requests, so making this a required check would block merges on
every pull request that does not touch the registry.

### Pure classification, thin fetching

The offline validator already splits this way, and the same split works here for the same
reason: the interesting logic is comparing two values, and the network is incidental.

```
   src/core/       compare an entry against a parsed schema.yaml, return a class.
                   No IO. Tested with fixtures, no mocking of anything.

   src/            fetch, retry, decide unreachable, render the report, exit non-zero.
                   Thin, injectable, tested the way the validate command is.
```

This also keeps the part that faces the 80% core coverage threshold free of network code.

### A YAML parser rather than regular expressions

The script used to verify the seed matched `name:` and `- id:` with regular expressions,
which was fine for a one-off and would be wrong shipped: a quoted name or a folded block
would fool it, and a false drift report is worse than none. That means a parser dependency.
It is a development dependency rather than a runtime one, since the checker is not part of
the published library surface.

## Risks / Trade-offs

- **The badge decays if it is ever red for a reason nobody acts on.** → Only real
  differences turn it red, unreachable sources never do, and the fix for the most common
  class is a one-line commit.
- **A permanently rate-limited run hides real drift while reporting green.** → The run uses
  `GITHUB_TOKEN`, which allows 5000 requests an hour against 13 entries. The report says
  explicitly which entries could not be determined, so a silent pass is visible in the log.
- **Nightly runs on a quiet repository get disabled by GitHub after 60 days of inactivity.**
  → Worth knowing rather than designing around. A repository being edited stays awake, and a
  registry nobody touches for two months has a bigger problem than a paused cron.
- **A deliberate upstream rename produces a red badge that stays red until a person
  decides.** → That is the intent. A semantic difference is exactly the case where automatic
  correction would be wrong.

## Open Questions

- Whether the check should eventually verify that an upstream schema still validates as an
  OpenSpec schema, rather than only that its `schema.yaml` resolves and matches. It is out
  of scope here, and the answer probably depends on whether an invalid upstream schema ever
  actually appears.
