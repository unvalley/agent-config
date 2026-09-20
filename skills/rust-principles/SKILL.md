---
name: rust-principles
description: Principles for writing, reviewing, and optimizing Rust - ownership and borrowing, error handling, types and API design, unsafe soundness, async behavior, and measured performance. Use when writing or changing Rust, reviewing a Rust diff, pull request, or crate API, weighing clippy findings, lifetimes, traits, or async, and when profiling, benchmarking, or speeding up Rust, reducing latency or allocations, or considering flamegraph, criterion, CompactString, Cow, interning, bumpalo, FxHashMap, or SmallVec.
---

# Rust Principles

How Rust should be written here, and what to judge it against when reviewing.
Correctness and soundness come first, then maintainability, then measured
performance. Performance never justifies a wrong answer or undefined behavior.

Follow the repository's established conventions over these defaults where the
two disagree. When reviewing, cite the file and line and explain the concrete
failure mode, and raise what the code does not establish as a question rather
than a finding.

## Ownership & borrowing

- Prefer borrowing (`&T`, `&str`, `&[T]`) over owned args unless ownership is needed.
- Avoid needless `.clone()` and `.to_owned()`; flag clones in hot paths.
- Avoid unnecessary ownership transfers at API boundaries. Follow the
  codebase's public-API conventions instead of adding generic conversion bounds
  mechanically.
- Watch for lifetimes that leak implementation details into the public API.

## Error handling

- Follow the repository's error model. Preserve typed errors where callers need
  to branch and add context where failures cross subsystem boundaries.
- No `.unwrap()` / `.expect()` on fallible paths outside tests, `main`, or cases
  with a proven invariant (document it with a comment).
- Use `?` over manual `match` on `Result`. Prefer `Result<T, E>` over panics for
  recoverable errors.
- Check that error types are `Send + Sync + 'static` when they cross threads.

## Types & API design

- Make illegal states unrepresentable: enums over bool flags, newtypes over
  primitive obsession, `NonZeroU32` / `&[T]` where invariants apply.
- Derive `Debug`; derive `Clone`/`PartialEq`/`Eq`/`Hash` only when needed.
- Accept generic bounds (`impl Iterator`, `impl Trait`) at the boundary; return
  concrete or `impl Trait`. Avoid leaking `Box<dyn ...>` without reason.
- Honor API guidelines: constructors named `new`/`with_*`, `From`/`TryFrom`,
  `#[must_use]` on builders and pure returns.

## Unsafe

- Every `unsafe` block needs a `// SAFETY:` comment justifying each invariant.
- Verify no aliasing violations, no use-after-free, correct `Send`/`Sync` impls.
- Prefer safe abstractions; flag unsafe that a safe API would replace.
- `unsafe` for speed needs a proven bottleneck and a `// SAFETY:` proof; a safe
  version is almost always fast enough.

## Async & concurrency

- No blocking calls (`std::fs`, `std::thread::sleep`, heavy CPU) inside async fns
  on the runtime; use the runtime's spawn_blocking or async equivalents.
- Hold `Mutex`/`RwLock` guards across `.await` only when intended; prefer not to.
- Check `Arc`/`Mutex` granularity and for obvious deadlock ordering.

## Performance

Optimize the hot path, leave the cold path readable, and prove every change
with a number. Flag allocation, copying, hashing, dispatch, or contention only
when the code is plausibly hot or the cost scales with unbounded input. An
optimization is not a fix without evidence that the path matters.

### Measure before you change

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
   Record the before/after numbers: scenario, metric, baseline and after with
   p50/p95 and sample count, the one intervention, the evidence, and the
   tradeoffs. Say when no meaningful win was found.
4. **Guard durable hot paths** with a repeatable benchmark when it will remain
   stable. Add a target-aware size assertion only when layout is an intentional
   invariant rather than an incidental compiler result.

Do not claim a speedup from code shape, fewer lines, or intuition. Reject "this
is probably faster" without a benchmark; readability loss must buy a real,
measured win. Micro-optimizing cold code wastes effort and harms clarity.

The candidates below are experiment ideas to reach for only after profiling
identifies the corresponding cost. They are not default replacements.

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
- Cloning to dodge the borrow checker is a hidden allocation - fix the lifetimes.

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
  reserve `#[inline(always)]` for rare cases supported by evidence - everywhere
  it bloats code and can slow things down.
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

### Build profile

Treat settings such as these as whole-program experiments, not a universal
release profile:

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
