---
name: local-first-filesystem
description: Design, implement, or review portable local-first persistence built on user-visible files and sync folders. Use when handling atomic file writes, concurrent or external edits, conflict copies, file watchers, rename or delete races, cloud placeholders, Unicode filenames, rebuildable indexes, or failure-injection tests for filesystem-backed applications.
---

# Local-First Filesystem

Treat user-visible files as durable truth. Preserve every independently edited
version, tolerate filesystem and sync-provider behavior, and make caches fully
rebuildable.

## Establish the contract

1. Define the canonical files and their supported encodings and formats.
2. Classify all databases, indexes, thumbnails, and search structures as
   derived state. Rebuild them from canonical files without data loss.
3. Define one persistence boundary that owns reads, signatures, commits,
   conflict copies, and reconciliation. Keep UI and domain logic unaware of
   watcher quirks.
4. State behavior for concurrent edit, external rename, external delete,
   unavailable placeholder, malformed content, and failed commit before coding.

Never treat an index as more authoritative than the files it describes. Never
silently recreate, replace, or delete a canonical file after external change.

## Read and commit snapshots

Return a snapshot from each read containing the bytes or parsed value, path,
and a signature of the observed file. Prefer a signature that combines stable
file identity when available, content hash, size, and sufficiently precise
metadata. Do not rely on modification time alone; timestamp granularity and
preservation can hide changes.

Commit with optimistic concurrency:

1. Write the proposed bytes to a unique temporary file in the destination
   directory.
2. Flush and close it; sync file and directory metadata when the durability
   contract requires survival across power loss.
3. Re-read or re-sign the destination immediately before replacement.
4. Replace atomically only when its signature still matches the base snapshot.
5. If it differs, preserve the proposed bytes as a uniquely named conflict copy
   and leave the destination untouched.
6. Publish the committed signature to in-memory state only after replacement
   succeeds.

Keep temporary files on the same filesystem as the destination. Preserve
required permissions and metadata deliberately. Treat disk-full, permission,
flush, replace, and directory-sync failures as visible commit failures; do not
advance state or report success.

Name conflict copies predictably but collision-safely. Include the original
name, a conflict marker, and enough local identity such as device plus timestamp
or a random suffix. Never overwrite an earlier conflict copy.

## Reconcile external changes

Treat watcher events as invalidation hints, not an ordered transaction log.
Events may be duplicated, reordered, merged, delayed, or omitted.

- Coalesce bursts, then rescan the affected scope and compare snapshots.
- Suppress self-write notifications by matching the committed identity and
  signature; avoid timer-only suppression.
- Detect rename through stable identity when the platform exposes it. Otherwise
  report delete plus create and avoid guessing when candidates are ambiguous.
- On external delete, retain unsaved local content and require an explicit
  restore, save-as, or discard decision.
- On external modification with local edits, keep the external file intact and
  offer merge or conflict-copy recovery.
- Make reconciliation idempotent so repeated scans converge to the same state.

## Handle portable path semantics

Treat cloud placeholders as unavailable content, not empty files. Request
hydration through the platform or provider when supported, surface offline and
timeout states, and retry only with bounded policy. Do not index placeholder
metadata as file contents.

Normalize Unicode only for comparison or lookup keys. Preserve the user's
actual filename and display spelling. Detect normalized or case-folded key
collisions explicitly; never merge two paths because a target filesystem might
consider them equivalent. Avoid assuming case sensitivity, stable inode-like
identities, atomic cross-volume moves, or uniform timestamp precision.

## Rebuild derived state

Build indexes from a complete scan plus content signatures. Apply incremental
updates only as an optimization. Store enough schema/version information to
discard incompatible or corrupt derived state, then rebuild it. Reconcile a
scan taken during concurrent mutation before publishing it, or repeat until the
result corresponds to an observed filesystem snapshot.

Do not put content that cannot be reconstructed into the index. If an index
contains user-authored metadata, move that metadata into canonical files or
give it an equally explicit durability and conflict contract.

## Verify failure behavior

Read [failure-and-test-matrix.md](references/failure-and-test-matrix.md) when
designing persistence tests or reviewing recovery coverage. Inject failures at
each I/O boundary and assert both file contents and reported state. Test with
real filesystem operations in addition to unit-test fakes; fakes rarely model
rename, flush, watcher, Unicode, or provider behavior accurately.

Require these durable properties:

- A failed commit leaves the previous canonical version readable.
- A detected concurrent edit preserves both versions.
- Replaying watcher events or rescanning converges without duplicate effects.
- Deleting every derived artifact and rebuilding produces equivalent results.
- A crash at any injected boundary produces either the old version or the new
  version, never a partially written canonical file.
