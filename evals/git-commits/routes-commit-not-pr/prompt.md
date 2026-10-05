---
name: git-commits/routes-commit-not-pr
description: A commit-message request fires git-commits and leaves github-pull-request alone.
tags: [routing]
plugins: ["../../../skills/git-commits", "../../../skills/github-pull-request"]
max_turns: 6
allowed_tools: [Read, Glob, Grep, Skill]
---

I staged a change that renames `getUser` to `fetchUser` and updates its three
call sites. Write the commit message.
