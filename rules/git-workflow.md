# Git Workflow

- Use the `conventional-commits` skill.
- Keep PRs focused, small and reviewable. If a PR is too large, break it into smaller ones.
- Commit only the intended slice. In a dirty tree, stage the target files
  explicitly and verify with `git status` / `git diff --staged` before
  committing; keep unrelated diffs out (`git stash --keep-index` helps).
- Before pushing, check branch/remote parity and which worktree owns the
  branch; report a no-op push instead of pretending it did something.
- To undo published history, prefer an explicit `revert` (or a deliberate
  rebase + `--force-with-lease` when the branch allows it) over silently
  stacking a negating commit.
