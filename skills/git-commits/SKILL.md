---
name: git-commits
description: Write and review Conventional Commit messages and pull request titles or descriptions from the actual diff. Use when the user asks to commit changes, draft or fix a commit message, prepare PR copy, follow Conventional Commits, use czg, or produce changelog-friendly history.
---

# Conventional Commits

Write commit messages and PR descriptions that follow the Conventional Commits spec.
The message explains intent, not just the diff.
This skill drafts or reviews copy. It does not by itself authorize staging,
committing, pushing, or updating a pull request.

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
- Never invent changes, validation, impact, or issue relationships that are not
  supported by the diff and repository evidence.
- Follow the PR template if the repo has one. Use a Conventional Commit-style PR
  title only when repository history or checks expect it.

## Workflow

1. Resolve the requested artifact and inspect its complete source:
   - Commit message: inspect `git diff --cached`. If the user explicitly wants a
     draft for unstaged work, inspect that diff and say it is not the staged
     commit scope.
   - New PR title or description: inspect the target base-to-head diff, branch
     commits, repository template, and linked issues.
   - Existing PR copy: inspect the PR metadata and `gh pr diff <pr>` or the
     equivalent base-to-head range.
2. Identify the intent, user-visible effect, root cause when relevant, and
   validation actually performed. Do not summarize only filenames.
3. For a commit, pick the single most accurate type and a scope consistent with
   recent history, then add a body or footer only when it carries useful context.
4. For a PR, write a concise title and a body that explains why, what changed,
   impact, and validation without forcing commit-message syntax onto every
   section.
