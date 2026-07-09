---
name: ci-fix
description: Triage and fix failing GitHub PR checks that run on GitHub Actions. Use when CI is red, a PR check fails, or the user mentions CI failed, GitHub Actions, gh pr checks, workflow runs, or fixing the build on a PR.
license: MIT
metadata:
  author: unvalley
  version: "0.1.0"
---

# CI Fix (GitHub Actions)

Locate failing PR checks with `gh`, read the actual logs, identify the root
cause with evidence, then fix. Never guess from the check name alone.

## Workflow

1. **Auth**: `gh auth status`. If unauthenticated, ask the user to run
   `gh auth login` (repo + workflow scopes).
2. **Resolve the PR**: current branch via `gh pr view --json number,url`, or
   the number/URL the user gave.
3. **Inspect failing checks**:
   - `gh pr checks <pr> --json name,state,bucket,link,workflow`
     (if a field is rejected, rerun with the fields `gh` reports as available)
   - For each failure, extract the run id from the details link:
     - `gh run view <run_id> --log-failed` (fall back to `--log`)
     - Still in progress? Fetch job logs directly:
       `gh api /repos/<owner>/<repo>/actions/jobs/<job_id>/logs`
4. **Scope**: only GitHub Actions. External providers (Buildkite, etc.) —
   report the details URL and stop there.
5. **Diagnose before editing**: quote the failing log snippet, state the root
   cause, and distinguish real code failures from infrastructure ones
   (billing/spending limits, runner outages, flaky network). Infrastructure
   failures are reported, not "fixed" with code churn.
6. **Reproduce locally** when feasible (run the same test/lint command) so the
   fix is verified before pushing.
7. **Fix, then confirm**: apply the fix, push, and re-check with
   `gh pr checks <pr> --watch` or a fresh `gh pr checks`.

## Reporting

For each failing check: name, run URL, a concise log snippet, root cause, and
what was done. Call out missing or truncated logs explicitly. If checks are
still red after the fix, say so — never report green without re-checking.
