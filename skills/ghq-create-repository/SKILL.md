---
name: ghq-create-repository
description: Create or reconcile a GitHub repository and its local clone under the canonical ghq root. Use when the user asks to create, initialize, or set up a new GitHub repository and wants it placed in the local ghq tree, including shared package repositories such as typescript-kit or swift-kit.
---

# Create a ghq Repository

Create the GitHub repository and local ghq checkout as one idempotent workflow.
Default to the smallest safe repository and never overwrite a conflicting path.

## Resolve the Request

- Mutate GitHub only when the user explicitly asks to create or set up the
  repository. For brainstorming or previews, run only the preflight checks.
- Require a repository name. Preserve an explicit name; when deriving one from
  a concept, use lowercase hyphenated form and state the derived name.
- Default the owner to the active `gh` account and visibility to `private`.
  Respect an explicitly requested organization, `public`, or `internal` value.
- Omit description, README, license, gitignore, template, topics, and package
  scaffolding unless requested. Do not silently turn repository creation into
  package initialization.
- If the user also requests package scaffolding, complete and verify this
  workflow first, then work inside the resulting checkout.

## Preflight

1. Require `git`, `gh`, and `ghq`. Run `gh auth status` and stop on an
   authentication failure.
2. Resolve the default owner with `gh api user --jq .login` and the ghq root
   with `ghq root`.
3. Validate the owner and repository components before using them in shell
   commands. Do not use `eval`, and do not silently strip or replace an
   explicitly supplied character.
4. Resolve these values:

   ```text
   REPO_REF  = OWNER/REPOSITORY
   REPO_PATH = <ghq root>/github.com/OWNER/REPOSITORY
   ```

5. Query the remote with:

   ```sh
   gh repo view "$REPO_REF" --json nameWithOwner,url,visibility
   ```

   Treat only a confirmed not-found response as absence. Stop on network,
   authorization, host, or rate-limit errors instead of assuming the name is
   available.
6. Inspect `REPO_PATH` without changing it. If it exists, require a Git worktree
   whose `origin` identifies the same `github.com/OWNER/REPOSITORY`, accepting
   equivalent HTTPS and SSH URL forms. Stop on a non-Git directory, a different
   origin, or an unresolved ownership mismatch.

Use this state table:

| GitHub | Local ghq path | Action |
| --- | --- | --- |
| absent | absent | Create, then clone with ghq |
| present | absent | Reuse remote, then clone with ghq |
| present | matching | No-op; verify both |
| absent | matching | Stop; ask whether to publish the existing local repository |
| any | conflicting | Stop without modifying either side |

## Create and Clone

Before the external write, state the resolved repository reference, visibility,
and local path. An explicit creation request authorizes proceeding with the
safe defaults above; do not ask again merely to confirm those defaults.

Create only when the remote is confirmed absent:

```sh
gh repo create "$REPO_REF" --private
```

Replace `--private` with the explicitly requested visibility. Add only the
requested `gh repo create` flags. Do not use `--clone`, because that clones into
the current directory rather than guaranteeing ghq placement.

Clone only when the verified local path is absent:

```sh
ghq get "https://github.com/${REPO_REF}.git"
```

If remote creation succeeds but cloning fails, keep the remote repository.
Report the URL, the exact clone error, and the safe retry command; never delete
the repository as an automatic rollback. If creation fails because another
actor won a race for the name, re-query the remote and verify ownership before
deciding whether it can be reused.

## Verify and Report

Verify the end state with all of the following:

```sh
gh repo view "$REPO_REF" --json nameWithOwner,url,visibility
ghq list --full-path --exact "$REPO_REF"
git -C "$REPO_PATH" remote get-url origin
git -C "$REPO_PATH" status --short --branch
```

Require the ghq result to resolve to `REPO_PATH` and the origin to identify the
same repository. Report:

- whether the GitHub repository was created or reused;
- whether the local checkout was cloned or reused;
- the verified visibility and GitHub URL;
- the absolute local path;
- any intentionally omitted initialization, such as package scaffolding.

Never claim success from `gh repo create` alone. Success requires both the
verified GitHub repository and the verified ghq checkout.
