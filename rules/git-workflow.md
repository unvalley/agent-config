# Git Workflow

- Use the `git-commits` skill for commits and `github-pull-request` for pull requests.
- Keep PRs focused, small, and reviewable.
- Stage only the intended slice; inspect `git status` and `git diff --staged` in dirty trees.
- Before pushing, check branch and remote parity plus worktree ownership; report no-op pushes.
- Undo published history with `revert`, or deliberately rebase and use `--force-with-lease` when allowed.
