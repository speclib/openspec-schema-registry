---
# openspec-schema-registry-7pxx
title: 02 Validation and CI gate
status: completed
type: milestone
priority: normal
created_at: 2026-09-22T14:05:13Z
updated_at: 2026-09-23T09:30:51Z
---

Make a malformed registry impossible to merge. A JSON Schema describes openspec-schemas.json, tests assert the real file conforms and that every entry resolves, and nix flake check runs build, tests and the coverage gate (>=70% overall, >=80% on core packages).
