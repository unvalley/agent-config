# agent-config

Portable skills and agents for AI coding agents.

## Install

```sh
git clone https://github.com/unvalley/agent-config.git
cd agent-config
just install
```

`just install` links this repository's assets, restores third-party skills from
the skills.sh lock, and installs the git hooks. On a new machine run
`chezmoi init --apply unvalley` first, so the dotfiles and that lock are in
place. `just --list` has the rest: `status`, `uninstall`, `third-party`,
`validate`, `eval`, and `eval-all`.

Assets are symlinked, so local edits apply immediately. Claude Code receives
`skills/` and `agents/`; Codex receives `skills/` through `~/.agents/skills`.
The installer is a Rust CLI behind those recipes; `cargo run -- install --help`
covers its `--copy`, `--force`, and `--dry-run` flags.

Codex configuration (`~/.codex/config.toml`) and the global skills lock
(`~/.agents/.skill-lock.json`) belong in dotfiles, not here.

## Skills

Third-party skills are managed by
[skills.sh](https://github.com/vercel-labs/skills) and restored by
`just third-party`. Run `chezmoi add ~/.agents/.skill-lock.json` after changing
them so the lock stays in dotfiles.

This repository's own skills can also be installed elsewhere:

```sh
npx skills add unvalley/agent-config
gh skill install unvalley/agent-config/skills/design-principles
```

## Authoring a skill

1. Create `skills/<name>/SKILL.md` with `name` and `description` frontmatter.
2. Add `agents/openai.yaml` with `display_name`, `short_description`, and a
   `default_prompt` that invokes `$<name>`.
3. Put optional detail in `references/`, deterministic code in `scripts/`, and
   output resources in `assets/`.
4. Keep frontmatter ASCII-only and validate with `just validate <name>`.
5. Add eval cases under `evals/<name>/`, as described below.

## Evals

Skills are evaluated with Claude Code's `claude plugin eval`. A case lives in
`evals/<skill>/<case>/`:

- `prompt.md` holds the prompt; its `plugins` frontmatter names the skills to
  load, so a routing case can load a sibling skill too.
- Each file in `graders/` is one check: `regex` on the reply, `tool_used` for
  whether a skill fired, or `llm` for a rubric.

```sh
just eval git-commits   # one skill
just eval-all           # every skill
```

Each case runs with and without its skills, so the report shows what the skill
adds. Flags pass through to `claude plugin eval`, such as `--runs 1` or
`--tag routing`. Runs use your Claude Code login, and reports stay local in
`evals/results/`. The latest scores are in
[`skills/benchmark.md`](skills/benchmark.md).
