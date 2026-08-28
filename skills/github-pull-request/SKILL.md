---
name: github-pull-request
description: Write or update a pull request description as a terse change list grounded in the actual diff. Use when the user asks to write, draft, review, or fix a PR description or body, open a pull request, fill in a PR template, or turn branch commits into PR copy.
---

# Write PR

Write PR descriptions a reviewer can scan in seconds: a short list of changes
grounded in the actual diff. Use `git-commits` for the PR title and
for grounding rules. This skill drafts or edits copy; it does not by itself
authorize pushing, opening, or updating a pull request.

## Style

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
  is the change list plus optional context — still no invented headings.
- Mark sections that do not apply with `N/A` instead of deleting them or
  padding them with filler.

## Workflow

1. Resolve the target: a new PR (base-to-head diff, branch commits) or an
   existing one (`gh pr view`, `gh pr diff`). Inspect the complete diff, not
   just filenames.
2. Read the repo's PR template if present.
3. Draft the change list per the style rules, in the language the repo's PRs
   or the user use. Group mechanical churn (formatting, lockfiles) into one
   bullet.
4. Re-check every bullet against the diff before delivering: no invented
   changes, no ですます調 in Japanese copy, no extra headings.
