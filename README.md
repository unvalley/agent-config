# agent-config

Portable skills, agents, and commands for AI coding agents.

See [`docs/ai-native/`](docs/ai-native/README.md) for the staged approach to
closed-loop agent execution.

## Install

```sh
just install              # all agents plus third-party skills and git hooks
just install claude       # claude | codex | all
just status
just uninstall
```

The Rust installer symlinks this repository's assets so local edits apply
immediately. Claude Code receives `skills/`, `agents/`, and `commands/`; Codex
receives `skills/` through `~/.agents/skills`.

Use the CLI directly when needed:

```sh
cargo run -- install -t all
cargo run -- status
cargo run -- uninstall
```

Available flags: `--copy`, `--force`, and `--dry-run`.

Codex configuration (`~/.codex/config.toml`) and the global skills lock
(`~/.agents/.skill-lock.json`) belong in dotfiles, not this repository.

## New machine

```sh
chezmoi init --apply unvalley
git clone https://github.com/unvalley/agent-config.git
cd agent-config
just install
```

`just install` links this repository's assets, restores third-party skills from
the skills.sh lock, and installs the configured git hooks.

## Skills

This repository's skills are symlinked from `skills/`. Third-party skills are
managed by [skills.sh](https://github.com/vercel-labs/skills) and restored by
`just third-party`.

```sh
npx skills add <owner>/<repo> -g
npx skills remove <name>
npx skills list -g
npx skills update -g
chezmoi add ~/.agents/.skill-lock.json
just third-party
```

Distribution alternatives:

```sh
apm install -g unvalley/agent-config/skills/rust-review
npx skills add unvalley/agent-config
gh skill install unvalley/agent-config/skills/design-review
```

`agents/` and `commands/` are Claude Code-only; install them with this
repository's CLI.

## Authoring a skill

1. Create `skills/<name>/SKILL.md` with `name` and `description` frontmatter.
2. Add `agents/openai.yaml` with `display_name`, `short_description`, and a
   `default_prompt` that invokes `$<name>`.
3. Put optional detail in `references/`, deterministic code in `scripts/`, and
   output resources in `assets/`.
4. Keep frontmatter ASCII-only and validate with `just validate <name>`.
