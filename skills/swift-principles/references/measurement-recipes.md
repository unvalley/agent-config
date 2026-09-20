# Swift Measurement Recipes

Use the smallest recipe that reproduces the user's symptom. Keep the baseline
and after run on the same device, OS, build, data set, cache state, and network
condition.

## Contents

- [Instruments and signposts](#instruments-and-signposts)
- [XCTest metrics](#xctest-metrics)
- [Distributions](#distributions)
- [SwiftUI recomputation and identity](#swiftui-recomputation-and-identity)
- [AppKit and TextKit editing](#appkit-and-textkit-editing)
- [Main-thread I/O](#main-thread-io)
- [Images](#images)
- [Network and cache states](#network-and-cache-states)
- [Keep-or-revert gate](#keep-or-revert-gate)

## Instruments and signposts

Choose the template that can confirm or reject the current hypothesis:

- Use Time Profiler for CPU attribution and excessive call counts.
- Use Hangs or Time Profiler for main-thread stalls.
- Use Allocations and Leaks for allocation rate, retained growth, and churn.
- Use SwiftUI instrumentation for view updates, body recomputation, and slow
  layout or rendering work.
- Use File Activity for unexpected synchronous disk access.
- Use Network for request timing, connection behavior, and transferred bytes.

Instrument the full user-visible interval with signposts. Give each operation a
stable name and attach identifiers needed to distinguish documents or requests,
but avoid high-cardinality or sensitive payloads.

```swift
import os

private let performanceLog = OSLog(
    subsystem: "com.example.app",
    category: .pointsOfInterest
)

let signpostID = OSSignpostID(log: performanceLog)
os_signpost(
    .begin,
    log: performanceLog,
    name: "RenderDocument",
    signpostID: signpostID
)
defer {
    os_signpost(
        .end,
        log: performanceLog,
        name: "RenderDocument",
        signpostID: signpostID
    )
}
```

Prefer begin/end intervals for latency and events for countable state changes.
Keep instrumentation in place when its runtime cost is negligible and the
operation is likely to regress.

## XCTest metrics

Use XCTest for deterministic local work such as parsing, indexing, image
processing, or a controlled UI interaction. Measure the metric that matches the
claim rather than defaulting to wall-clock time.

```swift
func testIndexingPerformance() throws {
    let fixture = try makeLargeFixture()

    measure(metrics: [
        XCTClockMetric(),
        XCTCPUMetric(),
        XCTMemoryMetric(),
    ]) {
        _ = index(fixture)
    }
}
```

Move fixture construction outside the measured closure. Control warm-up and
cache resets explicitly. Use `XCTOSSignpostMetric` when an existing signpost
defines the operation more accurately than the test closure. Avoid tight
thresholds on noisy shared CI machines; store comparable samples and investigate
distribution shifts.

## Distributions

Collect enough repeated samples to expose variance. Sort the samples and use a
consistent percentile method for both runs. Report at least:

- p50 for the typical experience;
- p95 for slow-tail behavior;
- sample count and units;
- cold or warm state;
- device, OS, and build configuration.

Treat overlapping noisy distributions as inconclusive even if the arithmetic
mean improves. Inspect outliers instead of deleting them unless a documented
external interruption invalidated the run.

## SwiftUI recomputation and identity

Measure view updates before rewriting the view hierarchy. Check:

- unstable `ForEach` IDs or inline `UUID()` values;
- replacing reference values when only a small field changed;
- observing a large model when the view needs a narrow projection;
- expensive formatting, sorting, filtering, image work, or object creation in
  `body`;
- broad environment or preference updates that invalidate many descendants.

Make one observation or identity change, then compare recomputation counts and
the full interaction interval. Do not add memoization unless invalidation and
memory lifetime are explicit.

## AppKit and TextKit editing

Measure from the edit event to visible completion. Correlate signposts with
layout, parsing, and attribute mutations. Check:

- whole-document parsing or highlighting for a local edit;
- invalidating all glyphs or layout fragments instead of the affected range;
- multiple unbatched `NSTextStorage` mutations;
- synchronous indexing, autosave, or link resolution during each keystroke;
- duplicated document state that forces full replacement.

Prefer incremental ranges, `beginEditing`/`endEditing`, coalescing, and one
source of truth. Verify selection, undo grouping, marked text, scrolling, and
accessibility after changing the edit pipeline.

## Main-thread I/O

Use Hangs, Time Profiler, and File Activity together to locate synchronous file,
database, image, or network work. Move only the expensive work off the main
actor; keep UI mutation isolated on it. Preserve ordering, cancellation, error
handling, and document consistency. Re-measure the complete interaction because
dispatching work can hide a stall while increasing time to final content.

## Images

Measure these stages independently:

1. network fetch or disk read;
2. image decode;
3. downsample or transform;
4. cache lookup and insertion;
5. GPU upload and presentation.

Decode away from the main thread and downsample near the actual rendered pixel
size. Compare source bytes, decoded memory, peak memory, and latency. Test memory
cache hit, disk cache hit, and cold miss separately. Set cache cost and eviction
from decoded size, not compressed file size, when decoded memory is the risk.

## Network and cache states

Publish separate results for:

- cold network with no local response or asset cache;
- disk cache hit;
- validated or revalidated response;
- in-memory cache hit.

Control or disclose DNS/TLS connection reuse, server location, response size,
and network simulation. A faster warm cache path does not demonstrate a faster
network request. When optimizing prefetch, include wasted bytes, memory, and
energy in the tradeoff.

## Keep-or-revert gate

Keep the change only when repeated measurements show a meaningful improvement
in the target metric without unacceptable correctness, tail latency, memory,
energy, or complexity cost. Revert when the effect is within noise, the hot path
moves without improving the user-visible interval, or the tradeoff exceeds the
benefit. Report inconclusive experiments as useful evidence, not as wins.
