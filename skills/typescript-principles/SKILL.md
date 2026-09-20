---
name: typescript-principles
description: Principles for writing and reviewing TypeScript, JavaScript, and Node.js - type safety, async correctness, error handling, boundary validation, module hygiene, and performance judgement. Use when writing or changing TypeScript or Node code, reviewing a TypeScript diff, pull request, or API, weighing tsconfig and strictness, ESM/CJS setup, unsafe casts, `any` usage, promise handling, or unbounded concurrency.
---

# TypeScript Principles

How TypeScript should be written here, and what to judge it against when
reviewing. The type system is a tool for correctness, not decoration.
Prioritize runtime correctness and type soundness first, then maintainability,
then measured performance.

Follow the repository's established conventions over these defaults where the
two disagree. When reviewing, cite the file and line and explain the concrete
failure mode; the review procedure and report format belong to the
`code-reviewer` agent and the `/review` command, not here.

## Type safety

- Contain and justify explicit `any`. Prefer `unknown` at untrusted boundaries
  and narrow with existing guards or schema validation. Treat implicit `any` as
  a finding when it defeats the project's intended type coverage.
- Flag casts that assert unvalidated runtime facts or hide a real type error.
  Allow localized casts for proven invariants or TypeScript limitations when
  the boundary and reason are clear.
- Prefer discriminated unions over optional-field grab-bags; make illegal states
  unrepresentable.
- Avoid non-null assertions (`!`) unless the invariant is proven and obvious.
- Prefer `type`/`interface` precision: `readonly`, literal types, `satisfies` to
  check without widening.
- Assess `strict` and `noUncheckedIndexedAccess` against the project's current
  migration state; do not turn a scoped change into an unrequested config
  migration.

## Async correctness

- Every promise is awaited or explicitly handled; no floating promises.
- Use `Promise.all` only when work is independent, bounded, and its failure
  semantics fit. Preserve sequential order or apply a concurrency limit when
  required.
- Ensure each rejection has an intentional owner. Catch where the code can add
  context, recover, translate, or clean up; otherwise allow propagation.
- Flag callback and promise mixtures when they risk double completion, lost
  errors, or unclear cancellation rather than banning interop itself.

## Error handling

- Throw `Error` (or subclasses), never strings or plain objects.
- Catch narrowly; rethrow with context rather than logging-and-continuing.
- At API boundaries, validate input with a schema rather than trusting types.

## Modules & Node

- Follow the repository's ESM/CJS, extension, export, and barrel conventions.
  Flag module structure only when it breaks a supported runtime or public API.
- No deep imports into other packages' internals.
- Avoid Node built-ins in code meant to be isomorphic; gate platform code.
- Check for `process.env` access without validation/defaults.

## Performance

Flag redundant work, serialization, unbounded concurrency, or allocation in
loops only when the code is plausibly hot or the cost scales with unbounded
input. An optimization is not a fix without before/after evidence that the path
matters: measure the same scenario before and after, report the distribution
rather than a single best run, and say when no meaningful win was found.

## Quality

- Prefer `const`; `let` only when reassigned. No `var`.
- Name things by intent; avoid abbreviations that aren't domain terms.
- Dead code, unused exports, and unreachable branches get flagged (knip helps).
