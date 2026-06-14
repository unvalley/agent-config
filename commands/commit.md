---
description: Review the staged diff and create a Conventional Commit following the conventional-commits skill.
argument-hint: [optional scope or note]
disable-model-invocation: true
allowed-tools: Bash(git:*), Read
---

Create a commit from the currently staged changes.

1. Run `git diff --cached`. If nothing is staged, stop and tell the user to stage
   changes first (do not stage for them).
2. Apply the `conventional-commits` skill to craft the message: pick the most
   accurate `type`, a scope consistent with `git log --oneline`, an imperative
   subject (<= 72 chars), and a body explaining *why* when the change isn't
   self-evident.
3. Treat `$ARGUMENTS` as a hint about scope or intent, if provided.
4. Show the proposed message, then commit with `git commit`. Do not push.

Never invent changes that aren't in the staged diff.
