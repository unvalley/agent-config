---
name: rust-performance
description: Optimize and review Rust for runtime performance - cutting allocations, fast string types (CompactString, Cow, interning), arena/bump allocation, FxHashMap hashing, small enum layout, inlining, iterator and build-profile tuning. Use when writing or optimizing hot Rust paths, profiling with flamegraph or criterion, or when the user mentions performance, latency, throughput, allocations, CompactString, compact_str, arena, bumpalo, FxHashMap, SmallVec, or making Rust faster.
license: MIT
metadata:
  author: unvalley
  version: "0.1.0"
---

# Rust Performance

Make Rust faster without breaking it. Correctness and soundness come first;
performance never justifies a wrong answer or undefined behavior. Optimize the
hot path, leave the cold path readable, and prove every change with a number.

## Workflow: measure, change one thing, measure again

1. **Profile before touching anything.** Find the real hot path; intuition is
   usually wrong.
   - `cargo flamegraph` or [`samply`](https://github.com/mstange/samply) for CPU.
   - [`criterion`](https://crates.io/crates/criterion) or `cargo bench` for
     micro-benchmarks; `divan` for lighter ones.
   - `dhat` / `valgrind --tool=dhat` or `--tool=callgrind` for allocations.
   - `cargo-instruments` on macOS for system-level traces.
2. **Build in release** (`--release`) for every measurement. Debug numbers lie.
3. **Change one variable**, re-run the same benchmark, keep the win or revert.
   Record the before/after numbers in the PR.
4. **Guard against regressions**: commit the benchmark, and add
   `const _: () = assert!(size_of::<T>() <= N);` for size-sensitive types.

## Allocation: the usual #1 cost

- **Reuse buffers** across iterations instead of allocating per loop. Hoist a
  `String` / `Vec` out of the loop and `.clear()` it.
- **`Vec::with_capacity` / `String::with_capacity`** when the size is known or
  estimable; avoid repeated reallocation/growth.
- **Arena / bump allocation** when you allocate many short-lived objects with a
  shared lifetime (AST nodes, graph nodes): [`bumpalo`](https://crates.io/crates/bumpalo).
  One contiguous region, freed all at once - no per-node `malloc`/`free`.
- **`SmallVec`** ([`smallvec`](https://crates.io/crates/smallvec)) for
  collections that are usually tiny: stores inline on the stack, spills to the
  heap only when it grows.
- **Avoid `collect()` into a throwaway `Vec`**: chain iterators, or
  `extend`/`for` into an existing buffer.

## Strings

- **`CompactString`** ([`compact_str`](https://crates.io/crates/compact_str)):
  drop-in `String` replacement that stores strings up to 24 bytes inline with no
  heap allocation. Great default when most strings are short.
- **Borrow, don't own**: take `&str`, return `Cow<str>` when output is sometimes
  unchanged, use `Box<str>` for immutable owned strings (smaller than `String`,
  no spare capacity).
- **Intern repeated strings** ([`string-interner`](https://crates.io/crates/string-interner)):
  turns string compares into pointer/index compares and dedupes storage.
- **Don't `format!` on the hot path**: prefer `push_str`, `write!` into a reused
  buffer, or `itoa`/`ryu` for number formatting.
- **ASCII fast paths**: iterate `bytes()` not `chars()` when the data is ASCII;
  use [`memchr`](https://crates.io/crates/memchr) for byte/substring search
  instead of `find` with a closure.

## Hashing

- **Swap the default hasher** in hot maps: std's `HashMap` uses SipHash (DoS
  resistant but slow). Use `FxHashMap` / `FxHashSet` from
  [`rustc-hash`](https://crates.io/crates/rustc-hash) or `ahash` for
  non-adversarial, internal keys.
- Reserve capacity (`HashMap::with_capacity_and_hasher`).
- For small integer keys, consider a plain `Vec` indexed by id over a hash map.

## Type layout and size

- **Keep enums small.** An enum is as large as its biggest variant; one fat
  variant bloats every value. `Box` the large/rare variant (`Box<BigThing>`) so
  the common variants stay cheap to move and store.
- **Check sizes**: `std::mem::size_of::<T>()`, and lock them with a
  `const` assert so growth is caught in review.
- Order struct fields to minimize padding when it matters; prefer niche-friendly
  types (`NonZeroU32`, `Option<&T>`) to shrink `Option`s.

## Inlining and dispatch

- **`#[inline]`** on small, hot functions that cross crate boundaries (the
  compiler won't inline across crates without it); reserve `#[inline(always)]`
  for the hottest, tiny functions. Don't sprinkle it everywhere - it can hurt
  I-cache and code size.
- **Prefer static dispatch in hot loops**: generics/`impl Trait` monomorphize;
  `dyn Trait` adds a vtable indirection per call. Use enum dispatch over
  `Box<dyn>` when the set of types is closed.
- **`#[cold]` / `#[inline(never)]`** on error and slow paths so the optimizer
  keeps the hot path tight; pull unlikely branches into a separate `#[cold] fn`.

## Iteration

- Iterators over manual indexing - they elide bounds checks and fuse well.
- Avoid intermediate `Vec`s between adapters; only `collect()` at the end.
- Hoist invariant work out of loops; precompute outside.

## Build profile (last-mile, whole-program)

A speed-maximizing release profile in `Cargo.toml`:

```toml
[profile.release]
opt-level     = 3
lto           = "fat"     # whole-program inlining/dedup; slower builds
codegen-units = 1         # one unit -> better optimization, slower builds
panic         = "abort"   # no unwind tables; changes panic semantics
```

- `RUSTFLAGS="-C target-cpu=native"` for local/known hardware (not portable
  binaries).
- A separate `[profile.bench]`/`profiling` profile with `debug = true` keeps
  symbols for flamegraphs.
- Tradeoffs: `lto`/`codegen-units=1` lengthen build time; `panic = "abort"`
  means destructors don't run on panic and `catch_unwind` won't catch - confirm
  that's acceptable.

## Pitfalls

- **No measurement, no change.** Reject "this is probably faster" without a
  benchmark; readability loss must buy a real, measured win.
- `#[inline(always)]` everywhere bloats code and can slow things down.
- Cloning to dodge the borrow checker is a hidden allocation - fix the lifetimes.
- `unsafe` for speed needs a proven bottleneck and a `// SAFETY:` proof; a safe
  version is almost always fast enough. (See `rust-review` for soundness.)
- Micro-optimizing cold code wastes effort and harms clarity.

## Output format

When reviewing for performance, for each finding:

```
[hot|warm|cold] path/to/file.rs:LINE - <what costs here>
cost: <allocation / hash / copy / indirection, and why it's on the hot path>
fix:  <concrete change + crate, e.g. "CompactString", "FxHashMap", "Box variant">
measure: <benchmark or profile to confirm the win>
```

End with the top 1-3 changes by expected impact, and explicitly note anything
that needs a benchmark before committing.
