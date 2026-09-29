---
# openspec-schema-registry-h885
title: Frontend Page with search and detail with preview
status: draft
type: feature
priority: normal
created_at: 2026-09-22T14:32:23Z
updated_at: 2026-09-29T19:55:22Z
---

## Where this page should live (noted 2026-09-29)

Since 2026-09-29 `https://speclib.org` is its own AWS Amplify site, built from
`github.com/speclib/speclib.org`, with `www.speclib.org` answering 301 to it. It
is a separate Amplify app from the registry, because an app binds to one
repository. Hosting for both lives in
`wasnel-awsaccount-104144963194-main`.

`registry-publication` reserves the root of `registry.speclib.org` for this page.
That was decided when the apex did not exist. If the apex becomes the project's
front page, this page probably belongs there instead, and the reserved root is a
second frontend nobody asked for.

Settle that before building, because the answer decides which repository this
work happens in. The reserved-root requirement stands until then.
