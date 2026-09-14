---
name: github-pull-request
description: Create or update a GitHub pull request with gh, including the title, a terse change-list description grounded in the actual diff, and PR template compliance. Use when the user asks to open, create, write, draft, review, or fix a pull request, PR title, or PR body, fill in a PR template, or turn branch commits into PR copy. For commit messages, use git-commits.
---

# GitHub Pull Request

Create PRs a reviewer can scan in seconds: a short title and a change list
grounded in the actual diff. This skill owns the title, the body, and opening
or updating the PR with `gh`; `git-commits` owns commit messages. Drafting copy
does not by itself authorize pushing or opening a PR. Push, create, or edit
only when the user asks for that step.

## Title

- One imperative summary of the whole change, <= 72 chars, no trailing period.
- Match what the repository's history or checks expect. Use the Conventional
  Commit form (`feat(scope): ...`) only when they do; otherwise write a plain
  summary in the same spirit.
- In Japanese, use 体言止め, the same as the body.

## Body

- Express changes as a terse bullet list, one change per bullet. Add at most
  one or two lines of context above the list when the intent is not obvious
  from it.
- No prose paragraphs unless a template section explicitly asks for prose.
- In Japanese, end each bullet with 体言止め. Never use ですます調.
  - GOOD: `- ログイン失敗時のリトライ処理を追加`
  - BAD: `- ログイン失敗時のリトライ処理を追加しました`
- In English, use imperative fragments (`Add retry on login failure`),
  matching Conventional Commit description style.
- Never invent changes, impact, or validation not supported by the diff.

## Template

- If the repo has a PR template (`.github/PULL_REQUEST_TEMPLATE.md`,
  `PULL_REQUEST_TEMPLATE.md`, `docs/`, or a `PULL_REQUEST_TEMPLATE/`
  directory), fill its sections in order and keep its headings verbatim.
- Do not add headings the template does not have. With no template, the body
  is the change list plus optional context, still with no invented headings.
- Mark sections that do not apply with `N/A` instead of deleting them or
  padding them with filler.

## Create or update

- Before `gh pr create`, confirm the branch is pushed and matches its remote.
  Push only when the user asked to push or to open the PR.
- New PR: `gh pr create --base <base> --title <title> --body-file <file>`.
  Use the repository's default base unless told otherwise; use `--draft` only
  when requested.
- Existing PR: `gh pr edit <pr> --title <title> --body-file <file>`. Preserve
  sections you did not change.
- Write the body to a file and pass `--body-file`; do not inline multi-line
  bodies in the shell.
- Report the PR URL, and whether it was created or updated.

## Workflow

1. Resolve the target: a new PR (base-to-head diff, branch commits) or an
   existing one (`gh pr view`, `gh pr diff`). Inspect the complete diff, not
   just filenames.
2. Read the repo's PR template if present.
3. Write the title, then draft the change list per the body rules, in the
   language the repo's PRs or the user use. Group mechanical churn
   (formatting, lockfiles) into one bullet.
4. Re-check the title and every bullet against the diff: no invented changes,
   no ですます調 in Japanese copy, no extra headings.
5. When asked to create or update, run `gh pr create` or `gh pr edit` and
   report the URL.
