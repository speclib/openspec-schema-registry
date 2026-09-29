---
# openspec-schema-registry-ozna
title: Fetch and cache behaviour
status: todo
type: epic
priority: normal
created_at: 2026-09-22T14:05:24Z
updated_at: 2026-09-29T21:01:08Z
parent: openspec-schema-registry-58p4
---

Specify how a utility fetches the registry, how long it caches, and what it does when offline or when the fetch fails.


## What the first consumer does (ossm, 2026-09-29)

`speclib/openspec-schema-manager` implements this and is the evidence for
whatever this bean settles on. Its behaviour, with the reasoning:

**The cache is shown first and refreshed behind it.** The cached registry is
read synchronously on start (a local file read, shorter than a frame) and drawn
before anything touches the network. When it is older than a configurable time
to live, default 24h, a fetch runs behind it and replaces the list when it
arrives. `r` forces a refresh whatever the age says.

**The cache records its own fetch time**, rather than reading the file's
modification time. A checkout, a restore or a backup tool moves that time
without anything having been fetched.

**The cache records the URL it came from.** Changing the configured registry URL
invalidates it, so a mirror's copy is never served as the canonical one.

**A response is validated before it is written**, then written to a temporary
file in the same directory and renamed. A bad copy on the server must not
destroy a good copy on disk. Tests assert the cache is byte for byte unchanged
after four kinds of failed fetch: an unreachable host, a body that is not JSON,
a body that is JSON but not a registry, and a registry holding a bad entry.

**Offline is a working state, not an error.** With a cache and no network the
list works and the age is shown. With neither, the tab says the registry has
never been fetched and offers to try again, rather than showing an empty list.

**Reading is deliberately more permissive than this repository's own
validation.** An unknown field in an entry is ignored, and the 100-character
description cap is not enforced. The registry may add a field before a consumer
knows about it, and refusing the whole document over one unknown key would
strand every user until they upgrade; the cap is this repository's gate to apply
before an entry is merged, and a consumer that also refuses it means one bad
entry breaks every user rather than one pull request.

A `file://` URL goes through the same fetcher, which is how ossm's tests point
at a fixture registry without a server.

Worth deciding here: whether any of this is a contract the registry states, or
whether it stays consumer policy. ossm needs nothing from this bean to work.
