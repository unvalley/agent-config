# Failure and Test Matrix

Use deterministic fault injection around the persistence boundary, then add
integration tests on each supported filesystem and sync provider. Assert
canonical bytes, conflict artifacts, temporary-file cleanup, in-memory state,
and the error shown to the caller.

| Scenario | Inject or arrange | Required result |
| --- | --- | --- |
| Temporary-file creation fails | Deny directory write or return an I/O error | Keep the canonical file and base signature unchanged; report failure. |
| Partial temporary write | Fail after each possible chunk boundary | Never expose partial bytes at the canonical path; report failure. |
| Flush or close fails | Fail after writing all bytes | Do not replace the canonical file or publish the proposed signature. |
| Destination changes before replace | Modify bytes after the base read, including with the same size and timestamp | Preserve the external destination and write the proposal to a unique conflict copy. |
| Atomic replace fails | Deny replacement or remove destination directory | Preserve the last canonical version when it still exists; report an unresolved commit. |
| Crash around replacement | Terminate before and after each write, flush, replace, and directory sync | Recover either the complete old version or complete new version, never a partial canonical version. |
| Disk becomes full | Exhaust space during write and metadata sync | Do not claim success; keep the prior canonical version readable. |
| External rename | Rename while the document is clean and while it has local edits | Follow stable identity only when unambiguous; otherwise surface delete/create without losing local edits. |
| External delete | Delete before save and during save | Do not silently recreate the path; retain local content and require restore, save-as, or discard. |
| Watcher burst | Reorder, duplicate, omit, and merge create/modify/rename/delete hints | A coalesced rescan converges to actual filesystem state and remains idempotent. |
| Self-write notification | Deliver the app's events late and mixed with an external edit | Suppress only the matching committed signature; do not suppress the external edit. |
| Cloud placeholder | Present unhydrated, offline, timed-out, and evicted files | Never interpret unavailable content as empty; surface availability and retry policy. |
| Unicode-equivalent names | Create NFC/NFD variants and case variants where supported | Preserve distinct original names and flag lookup-key collisions instead of merging. |
| Identity reuse or absence | Remove stable IDs or reuse one after delete/create | Fall back to signatures and conservative reconciliation; never attach edits by identity alone. |
| Corrupt or stale index | Truncate it, change schema version, or delete it | Discard and rebuild it entirely from canonical files with equivalent observable results. |
| Scan races with mutation | Change files between enumeration and content reads | Detect inconsistent signatures and reconcile or repeat before publishing the index. |
| Malformed or unsupported content | Corrupt encoding or schema in one canonical file | Preserve original bytes, isolate the error, and continue indexing unaffected files. |
| Conflict-name collision | Pre-create the expected conflict filename repeatedly | Choose a new unique name and preserve every version. |

## Test layers

1. Model persistence operations behind injectable boundaries for deterministic
   unit tests. Fail every operation before and after it mutates state.
2. Run integration tests against real temporary directories. Exercise actual
   replacement, permissions, case behavior, Unicode names, and watcher delivery.
3. Run provider tests for supported sync folders with hydration, eviction,
   offline operation, and two-client concurrent edits.
4. Run crash-recovery tests in subprocesses. Kill the writer at recorded fault
   points, restart, clean orphaned temporary files safely, and verify recovery.
5. Run property or state-machine tests over read, edit, commit, rename, delete,
   event delivery, rescan, and rebuild sequences. Assert preservation and
   convergence invariants after every step.

Record platform, filesystem, provider, timestamp resolution, and case behavior
with results. Do not generalize one platform's passing result to another.
