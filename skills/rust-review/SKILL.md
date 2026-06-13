---
name: rust-review
description: Review Rust code for idiomatic style, ownership and borrowing correctness, error handling, clippy lints, unsafe soundness, and performance. Use when reviewing or writing Rust, or when the user mentions Rust, cargo, clippy, ownership, lifetimes, traits, async, or crate API design.
license: MIT
metadata:
  author: unvalley
  version: "0.1.0"
---

# Rust Review

Review Rust with the standards of a senior Rust engineer. Prioritize correctness
and soundness first, then idiom and clarity, then performance. Be specific: cite
the file and line, name the rule, and show the fix.

## Workflow

1. Run the toolchain before reading by eye. Trust the compiler and clippy.
   - `cargo build` / `cargo check`
   - `cargo clippy --all-targets --all-features -- -D warnings`
   - `cargo fmt --check`
   - `cargo test` (and `cargo nextest run` if configured)
2. Read the public API surface first (`pub` items, trait bounds, return types),
   then the implementation.
3. Report findings grouped by severity: soundness > correctness > idiom > nits.

## What to check

### Ownership & borrowing
- Prefer borrowing (`&T`, `&str`, `&[T]`) over owned args unless ownership is needed.
- Avoid needless `.clone()` and `.to_owned()`; flag clones in hot paths.
- Take `impl AsRef<Path>` / `impl Into<String>` for ergonomic APIs where it fits.
- Watch for lifetimes that leak implementation details into the public API.

### Error handling
- Libraries: typed errors via `thiserror`. Applications: `anyhow` with `.context()`.
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
- Avoid allocations in loops; reuse buffers, prefer iterators over intermediate
  `Vec`s, use `&str`/`Cow` to avoid copies.
- `collect()` into the right type; avoid `clone` in iterator chains.
- Flag `String` concatenation in loops (use `write!`/`push_str`).

## Output format

For each finding:

```
[severity] path/to/file.rs:LINE - <one-line problem>
why: <the rule / consequence>
fix: <concrete change, with a code snippet if non-trivial>
```

End with a short summary: blocking issues, then suggestions, then nits.
