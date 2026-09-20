---
name: swift-principles
description: Principles for writing, reviewing, and optimizing Swift, SwiftUI, AppKit, UIKit, and TextKit - memory ownership, concurrency, main-thread discipline, state management, platform idiom, and measured performance. Use when writing or changing Swift, reviewing a Swift diff or pull request, weighing actors, Combine, SwiftUI state, AppKit behavior, or Xcode warnings, and when profiling or speeding up Swift, investigating launch time, typing latency, UI stalls, recomputation, layout work, main-thread I/O, image cost, memory churn, Instruments, signposts, or p50/p95 evidence.
---

# Swift Principles

How Swift should be written here, and what to judge it against when reviewing.
Native apps exist to be fast and feel native; correctness on the main thread and
memory discipline are what deliver that. Prioritize those first, then
maintainability, then measured performance.

Follow the repository's established conventions over these defaults where the
two disagree. When reviewing, cite the file and line and explain the concrete
failure mode; the review procedure and report format belong to the
`code-reviewer` agent and the `/review` command, not here.

## Memory & ownership

- Trace who retains each escaping closure. Use `[weak self]` only when it breaks
  a real cycle or intentionally permits work to disappear; a weak capture can
  silently drop required work. Use `unowned` only when the lifetime relationship
  is proven.
- Verify delegate and observer ownership against the framework contract. Use a
  weak delegate when the owner retains its delegate; retain and remove
  token-based observations deliberately.
- Value semantics by default: `struct` unless identity or reference sharing is
  required. Flag classes that could be structs.

## Concurrency

- Keep UI state and UI-touching methods on the main actor. Do not isolate
  parsing, I/O, or other expensive non-UI work there merely because a type is
  called a view model.
- Structured concurrency over ad-hoc GCD: `async/await`, `Task`, actors.
  Flag `Task { }` fire-and-forget with no cancellation story.
- Data races: mutable state shared across tasks must be actor-isolated or
  `Sendable`-safe. Take strict-concurrency warnings seriously.

## AppKit / text-editing specifics

- One source of truth for document state (e.g. `NSTextStorage`); views observe
  it rather than holding copies.
- Batch text mutations inside `beginEditing`/`endEditing`; avoid layout passes
  per keystroke.
- Coalesce expensive work triggered by typing (highlighting, parsing) with
  debounce or incremental invalidation; never reprocess the whole document on
  every edit.

## SwiftUI

- State ownership is explicit: use `@State` for local value state and owned
  `@Observable` references, `@StateObject` for owned `ObservableObject`
  instances, and `@Bindable` or `@ObservedObject` for injected observable models
  when those wrappers match the observation system in use.
- Body stays cheap: no allocation-heavy work or side effects in `body`.
- Identity is stable in `ForEach`; no `UUID()` as an inline id.

## Error handling & API design

- Prefer `throws` over optional-as-error for linear control flow. Use `Result`
  when an error value must be stored, transported, or bridged through a callback
  and that matches the surrounding API.
- No `try!` / force-unwrap outside tests and provably-safe invariants.
- Prefer protocol-oriented seams that already exist in the codebase; extend
  them rather than adding parallel abstractions.

## Performance

Prove the bottleneck before changing code. Preserve correctness and platform
behavior, optimize the measured hot path, and keep only measurable wins. Flag
recomputation, layout work, main-thread I/O, allocation churn, or contention
only when the code is plausibly hot or the cost scales with unbounded input. An
optimization is not a fix without evidence that the path matters.

Read [measurement-recipes.md](references/measurement-recipes.md) before choosing
tools or changing SwiftUI, AppKit/TextKit, I/O, image, or network code.

### Measure before you change

1. Define one user-visible operation and one primary metric. State the device,
   OS, build configuration, data size, and cache/network state.
2. Build an optimized configuration with symbols. Warm up only when the target
   scenario is warm; preserve cold conditions when measuring launch, disk,
   image, or network behavior.
3. Capture a baseline with repeated samples. Report the distribution, normally
   p50 and p95, rather than a single best run.
4. Profile the baseline and identify the dominant cost. Form one falsifiable
   hypothesis tied to evidence from Instruments, signposts, or a benchmark.
5. Change one variable. Preserve an easy path to revert and avoid unrelated
   cleanup in the measurement diff.
6. Re-run the same measurement under the same conditions. Check correctness,
   memory, energy, and responsiveness for regressions.
7. Keep the change only when the improvement is repeatable and worthwhile. If
   noise covers the result or another metric regresses, report that honestly
   and revert the optimization.

Record the before/after numbers: scenario, metric, baseline and after with
p50/p95 and sample count, the one intervention, the evidence, and the
tradeoffs. Do not claim a speedup from code shape, fewer lines, or intuition.
Say when no meaningful win was found. Run the relevant correctness tests after
the experiment, and add a repeatable benchmark or XCTest performance test when
it protects a durable hot path without becoming flaky.

### Measurement rules

- Prefer a production-like Release build; never compare Debug with Release.
- Place `os_signpost` or points of interest around the user-visible operation,
  not only around a convenient helper.
- Use XCTest metrics for repeatable local workloads and regression coverage;
  use Instruments for attribution across CPU, hangs, allocation, I/O, rendering,
  and concurrency.
- Separate cold and warm runs. Never present a cache hit as a network or decode
  improvement.
- Record raw samples or an exportable trace when practical. Note sample count,
  units, and environmental differences.
- Optimize total user-visible latency before micro-optimizing isolated functions.

### Diagnose before optimizing

- For SwiftUI updates, measure body recomputation and layout before changing
  state ownership. Inspect unstable identity, broad observation, expensive work
  in `body`, and reference churn.
- For AppKit or TextKit typing, measure the edit-to-display interval. Inspect
  whole-document parsing, broad layout invalidation, repeated attribute edits,
  and missing incremental ranges or edit batching.
- For UI stalls, identify file, database, decode, or synchronization work on the
  main thread before introducing queues or tasks. Preserve actor isolation and
  cancellation semantics when moving work.
- For images, separate fetch, disk read, decode, downsample, upload, and render.
  Decode off the main thread, downsample to the rendered size, and evaluate
  memory and disk caches independently.
- For remote data, report cold network, validated/revalidated cache, and memory
  cache measurements separately. Control connection reuse and simulated network
  conditions when they affect the claim.
