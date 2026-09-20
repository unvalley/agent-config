---
description: Review the current uncommitted diff (or specified files) for bugs and quality issues.
argument-hint: [files | "all" | "branch"]
allowed-tools: Read, Grep, Glob, Bash(git:*)
---

Review code and report problems. Do not edit.

Scope:
- No `$ARGUMENTS`, or `all`: review `git diff` plus `git diff --cached`.
- `branch`: review `git diff main...HEAD`.
- Otherwise: treat `$ARGUMENTS` as the file paths to review.

Delegate to the `code-reviewer` subagent when the diff is large, so the review
runs in its own context. Apply the `rust-principles`, `typescript-principles`,
`swift-principles`, or `design-principles` skill according to the languages
present, and judge the code against it.

Report findings grouped by severity (blocking / should-fix / nit) with
`path:line`, the rule, and a concrete fix. End with a verdict.
