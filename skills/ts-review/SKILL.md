---
name: ts-review
description: Review TypeScript, JavaScript, or Node.js code for type safety, async correctness, error handling, boundary validation, and module hygiene. Use when the user asks to review, audit, or assess a TypeScript or Node.js diff, pull request, API, tsconfig, ESM setup, unsafe casts, any usage, or promise handling.
---

# TypeScript / Node.js Review

Review with the standards of a senior TypeScript engineer. The type system is a
tool for correctness, not decoration. Prioritize soundness, then clarity, then
ergonomics. Cite file and line, name the rule, show the fix.

## Workflow

1. Run tooling first:
   - `tsc --noEmit` (type errors are blocking)
   - the project's linter (`eslint` / `biome`) and formatter
   - the test suite (`vitest` / `jest` / `node --test`)
2. Read exported signatures and public types before implementations.
3. Group findings: type-safety > correctness > idiom > nits.

## What to check

### Type safety
- No `any`. Use `unknown` at boundaries and narrow with type guards or a schema
  validator (zod / valibot). Flag every implicit `any`.
- No unsafe casts (`as Foo`, `as unknown as Foo`) to silence the compiler; fix
  the underlying type instead. `as const` and narrowing casts are fine.
- Prefer discriminated unions over optional-field grab-bags; make illegal states
  unrepresentable.
- Avoid non-null assertions (`!`) unless the invariant is proven and obvious.
- Prefer `type`/`interface` precision: `readonly`, literal types, `satisfies` to
  check without widening.
- Confirm `tsconfig` has `strict: true` (and ideally `noUncheckedIndexedAccess`).

### Async correctness
- Every promise is awaited or explicitly handled; no floating promises.
- Use `Promise.all` for independent async work; don't `await` in a loop when the
  iterations are independent.
- `try/catch` around awaits that can reject; don't swallow errors silently.
- No mixing of callbacks and promises; promisify or use the promise API.

### Error handling
- Throw `Error` (or subclasses), never strings or plain objects.
- Catch narrowly; rethrow with context rather than logging-and-continuing.
- At API boundaries, validate input with a schema rather than trusting types.

### Modules & Node
- ESM: use explicit extensions where required, no default-export sprawl, keep
  the public surface in an `index.ts` barrel only if it earns its place.
- No deep imports into other packages' internals.
- Avoid Node built-ins in code meant to be isomorphic; gate platform code.
- Check for `process.env` access without validation/defaults.

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

End with a summary: blocking issues, then suggestions, then nits.
