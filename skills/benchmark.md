# Skill benchmark

What each skill adds, measured with `just eval-all` on 2026-10-06. Each case
ran three times with its skill loaded and three times without. A score is the
share of a case's checks that passed, averaged over the three runs.

## Quality

| Skill | Case | Checks | With | Without | Gain | Fired |
| --- | --- | --- | --- | --- | --- | --- |
| english-writing | tighten-preserves-claims | 5 | 1.00 | 0.80 | +0.20 | 3/3 |
| git-commits | fix-from-diff | 2 | 1.00 | 0.50 | +0.50 | 3/3 |
| git-commits | mixed-diff-split | 2 | 1.00 | 0.50 | +0.50 | 3/3 |
| github-pull-request | fills-template | 3 | 1.00 | 0.67 | +0.33 | 3/3 |
| github-pull-request | japanese-change-list | 4 | 1.00 | 0.67 | +0.33 | 3/3 |
| japanese-writing | copyedit-preserves-claims | 4 | 0.92 | 0.75 | +0.17 | 3/3 |
| typescript-principles | review-async-and-boundary | 4 | 1.00 | 1.00 | 0.00 | 3/3 |

"Fired" counts the runs in which the agent invoked the skill when it was
available.

## Routing

Routing cases load two sibling skills and check that the right one fires.

| Case | Expected skill fired | Sibling stayed quiet |
| --- | --- | --- |
| git-commits/routes-commit-not-pr | 3/3 | 3/3 |
| github-pull-request/routes-pr-not-commit | 3/3 | 3/3 |

## Findings

- `japanese-writing` appended a note about its edits after the rewrite in one
  of three runs. The skill says to return only the rewrite, so that run failed
  the `rewrite-only` check.
- `typescript-principles` shows no gain: the agent finds all three defects
  without the skill, so this case only guards against regressions.
- These skills have no cases yet: `design-principles`, `git-ghq`,
  `github-fix-ci`, `local-first-filesystem`, `release-engineering`,
  `rust-principles`, and `swift-principles`.

## Setup

- Claude Code 2.1.289 running `claude plugin eval` with the Opus model
  (`opus[1m]`); `llm` checks use the default judge model, Haiku.
- 9 cases and 54 runs, finished in about three minutes.
- Cases live in [`evals/`](../evals). `just eval-all` reproduces the tables.
