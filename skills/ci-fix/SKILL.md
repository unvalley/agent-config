---
name: ci-fix
description: Diagnose or fix failing GitHub pull request checks that run on GitHub Actions. Use when the user asks to investigate red CI, inspect a failed PR check or workflow run, explain a GitHub Actions failure, or implement and verify a CI fix.
---

# CI Fix (GitHub Actions)

Locate failing PR checks with `gh`, read the actual logs, identify the root
cause with evidence, then fix when requested. Never guess from the check name
alone.

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
6. **Respect the requested scope**: if the user asked only for diagnosis,
   report the evidence and stop before editing, pushing, or rerunning jobs.
7. **Reproduce locally** when feasible (run the same test/lint command) so the
   fix is verified before pushing.
8. **Fix, then confirm** when explicitly requested: apply the fix, push, and re-check with
   `gh pr checks <pr> --watch` or a fresh `gh pr checks`.

## Reporting

For each failing check: name, run URL, a concise log snippet, root cause, and
what was done. Call out missing or truncated logs explicitly. If checks are
still red after the fix, say so — never report green without re-checking.
