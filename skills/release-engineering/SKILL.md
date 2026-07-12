---
name: release-engineering
description: Plan, prepare, validate, publish, and verify reproducible software releases across macOS distribution, the Mac App Store, npm, Rust crates, and GitHub release artifacts. Use when the user asks to prepare or ship a release, align versions and tags, package or sign artifacts, configure notarization or App Store metadata, publish with npm provenance or cargo, build an artifact matrix, or verify release readiness.
---

# Release Engineering

Treat a release as a verified artifact and publication state, not merely a tag
or a successful local build. Keep source changes, environment-only setup, and
external publication status distinct.

## Workflow

1. **Resolve the release target.** Identify the product, version, channel,
   package registry or store, supported targets, and whether the user asked for
   preparation only or actual publication. Never infer permission to publish.
2. **Inspect the existing release system.** Read repository guidance, release
   workflows, package metadata, signing scripts, and the latest comparable
   release. Reuse the repository's conventions before introducing new tooling.
3. **Build a release matrix.** Record each artifact's source revision, version,
   target or architecture, build command, signing identity, validation command,
   destination, and required credential. Mark missing inputs explicitly.
4. **Make the source releaseable.** Align version sources and lockfiles, remove
   placeholders from public metadata, check licensing and bundled resources,
   and keep unrelated worktree changes out of the release slice.
5. **Build once from a clean revision.** Prefer a clean worktree or CI job.
   Preserve the exact artifact that passed validation instead of rebuilding a
   different binary during publication.
6. **Inspect the artifact itself.** Verify archive contents, architecture,
   checksums, signatures, entitlements, package metadata, and a fresh-install
   smoke path as applicable. A successful compiler exit is insufficient.
7. **Use the relevant platform reference.** Read
   [macOS and App Store](references/macos-app-store.md),
   [npm](references/npm.md), or [Rust and GitHub releases](references/rust.md)
   before changing provider-specific configuration.
8. **Publish deliberately.** Run dry-run or validation commands first. Create
   immutable tags and upload artifacts only when the tested revision and release
   metadata agree. Do not use a public registry or store as a test environment.
9. **Verify from the consumer side.** Query the registry or release page,
   install the published artifact in a clean environment, and exercise one
   representative path. Record external review or rollout status separately.

## Readiness states

Report the highest state actually demonstrated:

- **Source-ready:** versioning, tests, and release metadata are consistent.
- **Artifact-ready:** the exact package or binary passed artifact inspection.
- **Distribution-ready:** signing, credentials, and destination configuration
  are present, but nothing has been published.
- **Published:** the registry, store, or release service accepted the artifact.
- **Consumer-verified:** a clean install or download of the published artifact
  passed a smoke test.

Never call a release production-ready when credentials, signing, store review,
or a real consumer smoke path remain unverified. Report blockers with the exact
missing input and the last state that passed.

## Change discipline

- Keep local machine setup, credentials, and driver paths out of the upstream
  diff unless the repository intentionally manages them.
- Avoid compatibility shims for unreleased products unless the user requires
  them.
- Do not rewrite published tags or versions. Prefer a new patch release or a
  registry-supported yank/deprecation mechanism.
- Treat signing keys, API keys, provisioning profiles, and tokens as external
  secrets. Never print or commit them.
