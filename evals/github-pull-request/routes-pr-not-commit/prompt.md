---
name: github-pull-request/routes-pr-not-commit
description: A PR-copy request fires github-pull-request and leaves git-commits alone.
tags: [routing]
plugins: ["../../../skills/github-pull-request", "../../../skills/git-commits"]
max_turns: 6
allowed_tools: [Read, Glob, Grep, Skill]
---

Write the PR title and description for my branch. It has one commit,
`fix(pagination): round page count up`, which changes `Math.floor` to
`Math.ceil` in `pageCount` in `src/pagination.ts`.
