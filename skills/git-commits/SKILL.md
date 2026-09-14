---
name: git-commits
description: Write and review Conventional Commit messages from the staged diff. Use when the user asks to commit changes, draft or fix a commit message, follow Conventional Commits, use czg, or produce changelog-friendly history. For pull request titles and descriptions, use github-pull-request.
---

# Conventional Commits

Write commit messages that follow the Conventional Commits spec. The message
explains intent, not just the diff. This skill drafts or reviews commit copy;
it does not by itself authorize staging, committing, or pushing. Pull request
titles and descriptions belong to `github-pull-request`.

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

- Scope is a noun describing the area (`feat(auth):`, `fix(parser):`). Keep it
  short and consistent with the codebase's existing scopes.
- Body explains *why* and notable *what*, wrapped at ~72 cols. Reference issues
  in the footer: `Refs: #123`, `Closes: #123`.
- Never invent changes, validation, impact, or issue relationships that are not
  supported by the diff and repository evidence.
- One commit, one change. If the staged diff mixes unrelated changes, say so
  and propose the split instead of writing a vague subject.

## Workflow

1. Inspect the staged diff with `git diff --cached`. If the user explicitly
   wants a draft for unstaged work, inspect that diff and say it is not the
   staged commit scope.
2. Identify the intent, user-visible effect, root cause when relevant, and
   validation actually performed. Do not summarize only filenames.
3. Pick the single most accurate type and a scope consistent with recent
   history (`git log --oneline`), then add a body or footer only when it
   carries useful context.
4. Re-check the result against the diff before delivering: one change, one
   type, nothing invented.
