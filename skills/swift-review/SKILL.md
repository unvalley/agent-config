---
name: swift-review
description: Review Swift, SwiftUI, AppKit, or UIKit code for correctness, memory ownership, concurrency, main-thread discipline, state management, platform idiom, and performance risks. Use when the user asks to review, audit, or assess Swift code, a Swift diff or pull request, actors, Combine, SwiftUI state, AppKit behavior, or the significance of Xcode warnings.
---

# Swift / AppKit / SwiftUI Review

Review with the standards of a senior native-platform engineer. Native apps
exist to be fast and feel native; correctness on the main thread and memory
discipline are what deliver that. Prioritize those first, then maintainability,
then measured performance risk. Audit and report by default; do not edit,
commit, or push unless the user asks for a fix. Cite the file and line and
explain the concrete failure mode.

## Workflow

1. Read repository guidance and resolve the review scope, platform target,
   scheme or package, and comparison base.
2. Discover and run the repository's documented, relevant build, lint, and
   targeted test commands. Do not guess an Xcode scheme or run every destination
   when a narrower supported check exists.
3. Read public types and protocol conformances before implementations, then
   trace each suspected defect through lifetimes, isolation, state ownership,
   and callers.
4. Report only actionable findings supported by a reachable failure, violated
   invariant, diagnostic, or concrete maintenance cost. Separate new issues from
   pre-existing failures when the base revision is available.

Do not infer a contract from names or style alone. If required behavior,
reachability, lifetime, or caller expectations cannot be established, report
the uncertainty as a question or residual risk rather than a finding.

## What to check

### Memory & ownership
- Trace who retains each escaping closure. Use `[weak self]` only when it breaks
  a real cycle or intentionally permits work to disappear; a weak capture can
  silently drop required work. Use `unowned` only when the lifetime relationship
  is proven.
- Verify delegate and observer ownership against the framework contract. Use a
  weak delegate when the owner retains its delegate; retain and remove
  token-based observations deliberately.
- Value semantics by default: `struct` unless identity or reference sharing is
  required. Flag classes that could be structs.

### Concurrency
- Keep UI state and UI-touching methods on the main actor. Do not isolate
  parsing, I/O, or other expensive non-UI work there merely because a type is
  called a view model.
- Structured concurrency over ad-hoc GCD: `async/await`, `Task`, actors.
  Flag `Task { }` fire-and-forget with no cancellation story.
- Data races: mutable state shared across tasks must be actor-isolated or
  `Sendable`-safe. Take strict-concurrency warnings seriously.

### AppKit / text-editing specifics
- One source of truth for document state (e.g. `NSTextStorage`); views observe
  it rather than holding copies.
- Batch text mutations inside `beginEditing`/`endEditing`; avoid layout passes
  per keystroke.
- Coalesce expensive work triggered by typing (highlighting, parsing) with
  debounce or incremental invalidation; never reprocess the whole document on
  every edit.

### SwiftUI
- State ownership is explicit: use `@State` for local value state and owned
  `@Observable` references, `@StateObject` for owned `ObservableObject`
  instances, and `@Bindable` or `@ObservedObject` for injected observable models
  when those wrappers match the observation system in use.
- Body stays cheap: no allocation-heavy work or side effects in `body`.
- Identity is stable in `ForEach`; no `UUID()` as an inline id.

### Error handling & API design
- Prefer `throws` over optional-as-error for linear control flow. Use `Result`
  when an error value must be stored, transported, or bridged through a callback
  and that matches the surrounding API.
- No `try!` / force-unwrap outside tests and provably-safe invariants.
- Prefer protocol-oriented seams that already exist in the codebase; extend
  them rather than adding parallel abstractions.

### Performance
- Flag recomputation, layout work, main-thread I/O, allocation churn, or
  contention only when the code is plausibly hot or the cost scales with
  unbounded input.
- Do not present an optimization as a fix without evidence that the path
  matters. Use `swift-performance` for profiling and before/after measurement.

## Output format

For each finding:

```
[severity] path/to/File.swift:LINE - <one-line problem>
why: <the rule / consequence>
fix: <concrete change, with a snippet if non-trivial>
```

End with the checks run and their outcomes. If there are no findings, say so
explicitly and note any untested paths or residual risks.
