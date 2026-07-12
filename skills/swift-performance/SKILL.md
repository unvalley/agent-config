---
name: swift-performance
description: Measure and optimize runtime performance in Swift, SwiftUI, AppKit, UIKit, or TextKit applications. Use when the user asks to profile or speed up Swift code, reduce launch time, typing latency, UI stalls, recomputation, layout work, main-thread I/O, image cost, memory churn, or network/cache latency; requests Instruments, signposts, XCTest performance metrics, p50/p95 measurements, or before-and-after evidence; or wants a suspected Swift hot path verified and improved.
---

# Swift Performance

Prove the bottleneck before changing code. Preserve correctness and platform
behavior, optimize the measured hot path, and keep only measurable wins. Use
`swift-review` instead when the request is a broad correctness or idiom review
without a concrete performance investigation.

## Workflow

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

Read [measurement-recipes.md](references/measurement-recipes.md) before choosing
tools or changing SwiftUI, AppKit/TextKit, I/O, image, or network code.

## Measurement Rules

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

## Diagnose Before Optimizing

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

## Verification and Reporting

Run the relevant correctness tests after the performance experiment. Add a
repeatable benchmark or XCTest performance test when it protects a durable hot
path without becoming flaky.

Report:

```text
scenario: <user-visible operation and conditions>
metric: <duration, CPU, allocations, memory, frames, or other unit>
baseline: p50 <value>, p95 <value>, n=<count>
after: p50 <value>, p95 <value>, n=<count>
change: <one measured intervention>
evidence: <trace, signpost interval, or test command>
tradeoffs: <memory, energy, complexity, behavior, or none observed>
decision: keep | revert | inconclusive
```

Do not claim a speedup from code shape, fewer lines, or intuition. Say when no
meaningful win was found.
