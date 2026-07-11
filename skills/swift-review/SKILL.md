---
name: swift-review
description: Review Swift, SwiftUI, AppKit, or UIKit code for correctness, memory ownership, concurrency, main-thread discipline, state management, platform idiom, and performance risks. Use when the user asks to review, audit, or assess Swift code, a Swift diff or pull request, actors, Combine, SwiftUI state, AppKit behavior, or Xcode warnings.
---

# Swift / AppKit / SwiftUI Review

Review with the standards of a senior native-platform engineer. Native apps
exist to be fast and feel native; correctness on the main thread and memory
discipline are what deliver that. Cite file and line, name the rule, show the
fix.

## Workflow

1. Run tooling first:
   - `xcodebuild build` (or `swift build`) — compiler warnings are findings
   - SwiftLint / swift-format if the project uses them
   - targeted tests: `xcodebuild test -only-testing:<Suite>/<Case>` — prefer
     narrow runs over full-suite loops
2. Read public types and protocol conformances before implementations.
3. Group findings: memory/concurrency > correctness > platform idiom > nits.

## What to check

### Memory & ownership
- Retain cycles: `[weak self]` in escaping closures that outlive the caller;
  `unowned` only when the lifetime relationship is proven.
- Delegates are `weak`. NotificationCenter/KVO observers are removed (or use
  the token-based APIs).
- Value semantics by default: `struct` unless identity or reference sharing is
  required. Flag classes that could be structs.

### Concurrency
- UI work on the main thread only: `@MainActor` on view models and UI-touching
  types; no `DispatchQueue.main.async` sprinkled as a bandage over an unclear
  threading model.
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
  debounce or incremental invalidation — never reprocess the whole document on
  every edit.

### SwiftUI
- State ownership is explicit: `@State` for local, `@Observable`/
  `@StateObject` for owned models, plain `let` for passed-in data. Flag
  `@ObservedObject` used where the view actually owns the object.
- Body stays cheap: no allocation-heavy work or side effects in `body`.
- Identity is stable in `ForEach`; no `UUID()` as an inline id.

### Error handling & API design
- `throws` over optional-as-error; `Result` only at callback boundaries.
- No `try!` / force-unwrap outside tests and provably-safe invariants.
- Prefer protocol-oriented seams that already exist in the codebase; extend
  them rather than adding parallel abstractions.

## Performance claims

Any change justified by performance needs before/after numbers (Instruments,
signposts, or a benchmark target). No measurable gain → say so and revert.

## Output format

```
[severity] path/to/File.swift:LINE - <one-line problem>
why: <the rule / consequence>
fix: <concrete change, with a snippet if non-trivial>
```

End with a summary: blocking issues, then suggestions, then nits.
