---
name: rust-performance
description: Measure, optimize, and review Rust runtime performance, including allocations, strings, hashing, type layout, dispatch, iteration, and build profiles. Use when the user asks to profile or speed up Rust, reduce latency or allocations, benchmark a hot path, or mentions flamegraph, criterion, CompactString, Cow, interning, bumpalo, FxHashMap, SmallVec, or throughput.
---

# Rust Performance

Make Rust faster without breaking it. Correctness and soundness come first;
performance never justifies a wrong answer or undefined behavior. Optimize the
hot path, leave the cold path readable, and prove every change with a number.

Resolve the requested mode before editing. For diagnosis or performance review,
capture the baseline, identify the dominant cost, and report the evidence and
measurement plan without changing production behavior. Implement an
optimization only when the user asks to improve or fix the measured path.

## Workflow: measure, change one thing, measure again

1. **Establish a baseline before changing production behavior.** Add minimal,
   isolated instrumentation or a benchmark when needed, then find the real hot
   path.
   - `cargo flamegraph` or [`samply`](https://github.com/mstange/samply) for CPU.
   - [`criterion`](https://crates.io/crates/criterion) or `cargo bench` for
     micro-benchmarks; `divan` for lighter ones.
   - `dhat` / `valgrind --tool=dhat` or `--tool=callgrind` for allocations.
   - `cargo-instruments` on macOS for system-level traces.
2. **Use a representative optimized build** for measurements. Keep build
   profiles, target CPU, features, data, and environment identical between
   baseline and after runs.
3. **Change one variable**, re-run the same benchmark, keep the win or revert.
   Record the before/after numbers in the PR.
4. **Guard durable hot paths** with a repeatable benchmark when it will remain
   stable. Add a target-aware size assertion only when layout is an intentional
   invariant rather than an incidental compiler result.

## Optimization candidates

Use the following only after profiling identifies the corresponding cost. They
are experiment ideas, not default replacements.

### Allocation

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

### Strings

- **`CompactString`** ([`compact_str`](https://crates.io/crates/compact_str)):
  stores many short strings inline. Confirm the current crate and target layout,
  the workload's length distribution, API conversion cost, binary impact, and
  measured allocation reduction before adopting it.
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

### Hashing

- **Test an alternate hasher** when hashing is measured as material. The
  standard map default is security-oriented; `FxHashMap` / `FxHashSet` from
  [`rustc-hash`](https://crates.io/crates/rustc-hash) or `ahash` for
  non-adversarial internal keys can trade collision resistance and dependency
  cost for speed.
- Reserve capacity (`HashMap::with_capacity_and_hasher`).
- For small integer keys, consider a plain `Vec` indexed by id over a hash map.

### Type layout and size

- **Keep enums small.** An enum is as large as its biggest variant; one fat
  variant bloats every value. `Box` the large/rare variant (`Box<BigThing>`) so
  the common variants stay cheap to move and store.
- **Check sizes**: `std::mem::size_of::<T>()`, and lock them with a
  `const` assert so growth is caught in review.
- Inspect actual target layout before changing representation. Niche-friendly
  types such as `NonZeroU32` can shrink some `Option`s, but lock layout only when
  that size is part of the performance or ABI contract.

### Inlining and dispatch

- **`#[inline]`** on small, hot functions that cross crate boundaries (the
  optimizer may need an inline hint or LTO to see). Test runtime and code size;
  reserve `#[inline(always)]` for rare cases supported by evidence.
- **Prefer static dispatch in hot loops**: generics/`impl Trait` monomorphize;
  `dyn Trait` adds a vtable indirection per call. Use enum dispatch over
  `Box<dyn>` when the set of types is closed.
- **`#[cold]` / `#[inline(never)]`** on measured error or slow paths only when
  profiles or generated code show that separation helps the hot path.

### Iteration

- Prefer the clearest idiomatic loop or iterator first. Compare generated code
  or benchmark results before claiming bounds-check elimination or fusion.
- Avoid intermediate collections when profiles show their allocation or copies
  matter.
- Hoist invariant work out of loops; precompute outside.

### Build profile (last-mile, whole-program)

Treat settings such as these as experiments, not a universal release profile:

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
experiment: <one change that targets the measured cost>
measure: <benchmark or profile to confirm the win>
```

End with the top 1-3 changes by expected impact, and explicitly note anything
that needs a benchmark before committing.
