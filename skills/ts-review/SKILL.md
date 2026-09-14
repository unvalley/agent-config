---
name: ts-review
description: Review TypeScript, JavaScript, or Node.js code for type safety, async correctness, error handling, boundary validation, and module hygiene. Use when the user asks to review, audit, or assess a TypeScript or Node.js diff, pull request, API, tsconfig, ESM setup, unsafe casts, any usage, or promise handling.
---

# TypeScript / Node.js Review

Review with the standards of a senior TypeScript engineer. The type system is a
tool for correctness, not decoration. Prioritize runtime correctness and type
soundness first, then maintainability, then measured performance risk. Audit
and report by default; do not edit, commit, or push unless the user asks for a
fix. Cite the file and line and explain the concrete failure mode.

## Workflow

1. Read repository guidance and resolve the package, runtime, review scope, and
   comparison base.
2. Discover and run the repository's documented, relevant typecheck, lint, and
   test commands through its package manager. Do not substitute a generic
   `tsc`, `eslint`, or test invocation when the project wraps or scopes it.
3. Read exported signatures and public types before implementations, then trace
   each suspected defect through runtime inputs and callers.
4. Report only actionable findings supported by a reachable failure, violated
   invariant, diagnostic, or concrete maintenance cost. Separate new issues from
   pre-existing failures when the base revision is available.

Do not infer a contract from names or style alone. If required behavior,
reachability, input bounds, or caller expectations cannot be established,
report the uncertainty as a question or residual risk rather than a finding.

## What to check

### Type safety
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
  migration state; do not turn a scoped review into an unrequested config
  migration.

### Async correctness
- Every promise is awaited or explicitly handled; no floating promises.
- Use `Promise.all` only when work is independent, bounded, and its failure
  semantics fit. Preserve sequential order or apply a concurrency limit when
  required.
- Ensure each rejection has an intentional owner. Catch where the code can add
  context, recover, translate, or clean up; otherwise allow propagation.
- Flag callback and promise mixtures when they risk double completion, lost
  errors, or unclear cancellation rather than banning interop itself.

### Error handling
- Throw `Error` (or subclasses), never strings or plain objects.
- Catch narrowly; rethrow with context rather than logging-and-continuing.
- At API boundaries, validate input with a schema rather than trusting types.

### Modules & Node
- Follow the repository's ESM/CJS, extension, export, and barrel conventions.
  Flag module structure only when it breaks a supported runtime or public API.
- No deep imports into other packages' internals.
- Avoid Node built-ins in code meant to be isomorphic; gate platform code.
- Check for `process.env` access without validation/defaults.

### Performance
- Flag redundant work, serialization, unbounded concurrency, or allocation in
  loops only when the code is plausibly hot or the cost scales with unbounded
  input.
- Do not present an optimization as a fix without before/after evidence that
  the path matters.

### Quality nits
- Prefer `const`; `let` only when reassigned. No `var`.
- Name things by intent; avoid abbreviations that aren't domain terms.
- Dead code, unused exports, and unreachable branches get flagged (knip helps).

## Output format

For each finding:

```
[severity] path/to/file.ts:LINE - <one-line problem>
why: <the rule / consequence>
fix: <concrete change, with a snippet if non-trivial>
```

End with the checks run and their outcomes. If there are no findings, say so
explicitly and note any untested paths or residual risks.
