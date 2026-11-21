# Skill benchmark

What each skill adds, measured with `just eval-all` on 2026-10-06, and for
`ascii-painting` with `just eval ascii-painting` on 2026-11-21. Each case
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
| ascii-painting | cutout-to-html | 3 | 1.00 | 0.56 | +0.44 | 3/3 |
| ascii-painting | described-cat | 3 | 1.00 | 0.44 | +0.56 | 3/3 |
| ascii-painting | garland-blocks | 3 | 1.00 | 0.44 | +0.56 | 3/3 |
| ascii-painting | no-grid-poppy | 3 | 1.00 | 1.00 | 0.00 | 3/3 |
| ascii-painting | painted-sky | 3 | 1.00 | 0.44 | +0.56 | 3/3 |
| ascii-painting | poppy-sparkles-module | 3 | 1.00 | 0.00 | +1.00 | 3/3 |
| ascii-painting | white-lily-garland | 3 | 1.00 | 0.67 | +0.33 | 3/3 |
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
- `ascii-painting` was named `image-to-ascii` when its rows were measured.
  After the rename and its new description, one run of each case scored
  1.00 with the skill, which fired every time.
- `ascii-painting/no-grid-poppy` first scored 0.89: the judge failed a
  reply that said in words it had no grid (マス目なし) for not naming
  `--no-grid`. The check now says what counts, and its row is from a rerun
  of that case alone.
- Without `ascii-painting`, no reply about `painted-sky` says how the sky
  reads on a dark page, where its clouds become dim gaps.
- `ascii-painting/no-grid-poppy` only guards against regressions: without
  the skill the agent writes its own converter, which also leaves out the
  grid and saves plain text.
- Without `ascii-painting`, `garland-blocks` replies never said the page
  follows light and dark, and two of three drew the drawing in a way that
  is not text on tiles.
- `typescript-principles` shows no gain: the agent finds all three defects
  without the skill, so this case only guards against regressions.
- These skills have no cases yet: `design-principles`, `git-ghq`,
  `github-fix-ci`, `local-first-filesystem`, `release-engineering`,
  `rust-principles`, and `swift-principles`.

## Setup

- Claude Code 2.1.289 running `claude plugin eval` with the Opus model
  (`opus[1m]`); `llm` checks use the default judge model, Haiku.
- 9 cases and 54 runs, finished in about three minutes. The `ascii-painting`
  rows came from Claude Code 2.1.322: 7 cases and 42 runs in about eleven
  minutes.
- Cases live in [`evals/`](../evals). `just eval-all` reproduces the tables.
