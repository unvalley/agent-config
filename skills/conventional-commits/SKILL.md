---
name: conventional-commits
description: Write Conventional Commit messages and pull request descriptions. Use when committing changes, writing or fixing commit messages, or drafting PR titles and descriptions, or when the user mentions commits, czg, conventional commits, or changelog.
license: MIT
metadata:
  author: unvalley
  version: "0.1.0"
---

# Conventional Commits

Write commit messages and PR descriptions that follow the Conventional Commits spec.
The message explains intent, not just the diff.

## Format

```
<type>(<scope>)<!>: <description>

<body>

<footer>
```

- `<type>` and `<description>` are required; scope, `!`, body, footer optional.
- Description: imperative mood, lowercase, no trailing period, <= 72 chars.

## Types

| type       | use for                                                        |
| ---------- | -------------------------------------------------------------- |
| `feat`     | a new feature (MINOR)                                          |
| `fix`      | a bug fix (PATCH)                                              |
| `docs`     | documentation only                                            |
| `refactor` | code change that neither fixes a bug nor adds a feature        |
| `perf`     | performance improvement                                        |
| `test`     | adding or fixing tests                                         |
| `build`    | build system or dependencies                                  |
| `ci`       | CI configuration                                              |
| `chore`    | maintenance that doesn't touch src or tests                   |
| `revert`   | reverts a previous commit                                     |

## Breaking changes

Either append `!` after type/scope, or add a `BREAKING CHANGE:` footer (or both):

```
feat(api)!: drop support for Node 18

BREAKING CHANGE: minimum supported runtime is now Node 20.
```

## Rules

- Scope is a noun describing the area (`feat(auth):`, `fix(parser):`). Keep it short and consistent with the codebase's existing scopes.
- Body explains *why* and notable *what*, wrapped at ~72 cols. Reference issues in the footer: `Refs: #123`, `Closes: #123`.
- Never invent changes that aren't in the diff. Review the staged diff first.
- Follow the PR template if the repo has one, or write a body that explains the motivation and context. Reference related issues or PRs.

## Workflow

1. Inspect what's staged: `git diff --cached`.
2. Pick the single most accurate type; choose a scope from existing history (`git log --oneline` to match conventions).
3. Write the subject, then a body if the change isn't self-evident.
