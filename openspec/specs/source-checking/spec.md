# source-checking Specification

## Purpose
Defines what it means for a registry entry to still match the schema it points at: which
differences matter, how each is classified, what happens when a source cannot be reached,
and when the check runs.

## Requirements

### Requirement: An entry is checked against the source it points at

The check SHALL fetch each entry's `schema.yaml` from `source.repo` at `source.ref`, or at
the repository's default branch when no ref is given, under `source.path`. It SHALL compare
the entry's `name` and `artifacts` against what that file declares. A single fetch per entry
SHALL answer whether the source resolves and whether both fields still match.

#### Scenario: An entry that still matches

- **WHEN** an entry's source resolves and its `name` and `artifacts` equal what the upstream
  `schema.yaml` declares
- **THEN** the entry passes, and nothing is reported for it

#### Scenario: An entry pinned to a ref

- **WHEN** an entry declares `source.ref`
- **THEN** the check resolves the source at that ref rather than at the default branch

#### Scenario: A repository whose default branch is not `main`

- **WHEN** an entry has no `source.ref` and its repository's default branch is not `main`
- **THEN** the check resolves the source at the repository's actual default branch

### Requirement: A difference is classified by what it costs a consumer

Each difference SHALL be reported as one of three classes. A source that does not resolve
SHALL be fatal, because a consumer following the entry gets nothing. A changed `name` SHALL
be semantic, because it changes both the directory a schema installs into and the argument
that selects it. A changed `artifacts` list SHALL be benign, because nothing a consumer does
breaks while the registry's copy is stale.

#### Scenario: A source that no longer resolves

- **WHEN** an entry's repository, ref or path no longer holds a `schema.yaml`
- **THEN** the difference is reported as fatal

#### Scenario: An upstream rename

- **WHEN** the upstream `schema.yaml` declares a `name` other than the entry's
- **THEN** the difference is reported as semantic, naming both the old and the new value

#### Scenario: An upstream pipeline change

- **WHEN** the upstream `schema.yaml` declares artifacts the entry does not, or omits some
  the entry has
- **THEN** the difference is reported as benign, naming what was added and what was removed

### Requirement: Every class of real difference fails the check

The check SHALL fail when any entry has a fatal, semantic or benign difference. Benign
differences SHALL fail alongside the others, so that a passing check means every entry
matches its source rather than meaning no entry is catastrophically broken.

#### Scenario: One benign difference and nothing else

- **WHEN** a single entry's artifacts have changed upstream and every other entry matches
- **THEN** the check fails, because the registry no longer describes its sources accurately

#### Scenario: Several entries with differences

- **WHEN** more than one entry differs from its source
- **THEN** every difference is reported in one run, grouped by entry, rather than stopping
  at the first

### Requirement: An unreachable source is not reported as drift

A failure to reach a source SHALL be retried before any conclusion is drawn. A check that
still cannot reach a source SHALL report that it could not determine the entry's state, and
SHALL NOT report it as a difference. Rate limiting, server errors and network failures SHALL
be treated as unreachable rather than as a missing source.

#### Scenario: A transient server error

- **WHEN** fetching a source fails with a server error and a retry succeeds
- **THEN** the entry is checked normally and nothing is reported about the failed attempt

#### Scenario: A source that stays unreachable

- **WHEN** every attempt to reach a source fails with rate limiting, a server error or a
  network failure
- **THEN** the check reports that the entry could not be determined, and does not claim the
  entry has drifted

#### Scenario: Telling a missing source from an unreachable one

- **WHEN** a source responds that the file is not there
- **THEN** it is fatal, because that answer is definitive, unlike a refusal to answer

### Requirement: The check runs on every push, on contributions, and nightly

The check SHALL run when `openspec-schemas.json` changes on the project's default branch,
when a contribution proposes changing it, and on a schedule over every entry. The scheduled
run SHALL exist because a registry entry that follows a default branch can change with no
contribution to this repository at all.

#### Scenario: A maintainer pushes a new entry

- **WHEN** a change to the registry file reaches the default branch
- **THEN** the check runs, because this project ships by pushing to its default branch
  rather than through contributions

#### Scenario: A contributor proposes an entry

- **WHEN** a contribution proposes a change to the registry file
- **THEN** the check runs against it before it is accepted

#### Scenario: Upstream changes with nobody touching the registry

- **WHEN** an entry's source changes upstream and the registry file is untouched
- **THEN** the scheduled run finds the difference

### Requirement: The check reports its result where a reader will see it

The project SHALL show the latest result of the scheduled and default-branch runs on its
front page, so that a reader can tell whether the registry currently matches its sources
without opening a build log.

#### Scenario: The registry matches every source

- **WHEN** the most recent run on the default branch found no differences
- **THEN** the project's front page shows the check as passing

#### Scenario: An entry has drifted

- **WHEN** the most recent run found a difference of any class
- **THEN** the project's front page shows the check as failing until the entry is corrected

### Requirement: The check is available to run by hand

Comparing an entry against its source SHALL be runnable as a command outside any automated
run, so that a contributor can check an entry before proposing it and a maintainer can
reproduce a failure locally.

#### Scenario: A contributor checking before submitting

- **WHEN** someone runs the check locally against the registry
- **THEN** it performs the same comparison and reports the same classes as the automated run
