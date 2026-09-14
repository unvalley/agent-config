---
name: rust-review
description: Review Rust code for correctness, ownership and borrowing, error handling, API design, async behavior, unsafe soundness, idiom, and performance risks. Use when the user asks to review, audit, or assess Rust code, a Rust diff or pull request, a crate API, clippy findings, unsafe code, lifetimes, traits, or async Rust.
---

# Rust Review

Review Rust with the standards of a senior Rust engineer. Prioritize correctness
and soundness first, then maintainability, then measured performance risk. Audit
and report by default; do not edit, commit, or push unless the user asks for a
fix. Cite the file and line and explain the concrete failure mode.

## Workflow

1. Read repository guidance and resolve the review scope and comparison base.
2. Discover and run the repository's documented checks that are relevant to the
   scope. Use `cargo check`, `clippy`, `fmt --check`, tests, or `nextest` only
   with the package, target, and feature set the repository supports.
3. Read the public API surface first (`pub` items, trait bounds, return types),
   then trace each suspected defect through the implementation and callers.
4. Report only actionable findings supported by a reachable failure, violated
   invariant, diagnostic, or concrete maintenance cost. Separate new issues from
   pre-existing failures when the base revision is available.

Do not infer a contract from names or style alone. If required behavior,
reachability, lifetime, or caller expectations cannot be established, report
the uncertainty as a question or residual risk rather than a finding.

## What to check

### Ownership & borrowing
- Prefer borrowing (`&T`, `&str`, `&[T]`) over owned args unless ownership is needed.
- Avoid needless `.clone()` and `.to_owned()`; flag clones in hot paths.
- Avoid unnecessary ownership transfers at API boundaries. Follow the
  codebase's public-API conventions instead of adding generic conversion bounds
  mechanically.
- Watch for lifetimes that leak implementation details into the public API.

### Error handling
- Follow the repository's error model. Preserve typed errors where callers need
  to branch and add context where failures cross subsystem boundaries.
- No `.unwrap()` / `.expect()` on fallible paths outside tests, `main`, or cases
  with a proven invariant (document it with a comment).
- Use `?` over manual `match` on `Result`. Prefer `Result<T, E>` over panics for
  recoverable errors.
- Check that error types are `Send + Sync + 'static` when they cross threads.

### Types & API design
- Make illegal states unrepresentable: enums over bool flags, newtypes over
  primitive obsession, `NonZeroU32` / `&[T]` where invariants apply.
- Derive `Debug`; derive `Clone`/`PartialEq`/`Eq`/`Hash` only when needed.
- Accept generic bounds (`impl Iterator`, `impl Trait`) at the boundary; return
  concrete or `impl Trait`. Avoid leaking `Box<dyn ...>` without reason.
- Honor API guidelines: constructors named `new`/`with_*`, `From`/`TryFrom`,
  `#[must_use]` on builders and pure returns.

### Unsafe
- Every `unsafe` block needs a `// SAFETY:` comment justifying each invariant.
- Verify no aliasing violations, no use-after-free, correct `Send`/`Sync` impls.
- Prefer safe abstractions; flag unsafe that a safe API would replace.

### Async & concurrency
- No blocking calls (`std::fs`, `std::thread::sleep`, heavy CPU) inside async fns
  on the runtime; use the runtime's spawn_blocking or async equivalents.
- Hold `Mutex`/`RwLock` guards across `.await` only when intended; prefer not to.
- Check `Arc`/`Mutex` granularity and for obvious deadlock ordering.

### Performance
- Flag allocation, copying, hashing, dispatch, or contention only when the code
  is plausibly hot or the cost scales with unbounded input.
- Do not present an optimization as a fix without evidence that the path
  matters. Use `rust-performance` for profiling and before/after measurement.

## Output format

For each finding:

```
[severity] path/to/file.rs:LINE - <one-line problem>
why: <the rule / consequence>
fix: <concrete change, with a snippet if non-trivial>
```

End with the checks run and their outcomes. If there are no findings, say so
explicitly and note any untested paths or residual risks.
