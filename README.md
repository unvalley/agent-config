# agent-config

@unvalley portable AI agent configuration.

## Contents

```
skills/        agentskills.io SKILL.md per dir (rust/ts/design review, commits)
agents/        Claude Code subagents (code-reviewer, planner)
commands/      Claude Code slash commands (/commit, /review, /plan)
rules/         always-on behavior (coding style, git, communication)
src/           Rust installer CLI
AGENTS.md      entry point for any AGENTS.md-aware agent (read natively by Codex)
```

## Apply to this machine

A small Rust CLI symlinks the assets into local agent dirs, so repo edits are
picked up live. Claude gets `skills/` + `agents/` + `commands/`; Codex gets
`skills/` (and reads `AGENTS.md` natively).

```sh
cargo run -- install              # symlink into ~/.claude/{skills,agents,commands}
cargo run -- install -t all       # claude + codex
cargo run -- status               # show what's installed where
cargo run -- uninstall            # remove the links

cargo install --path .            # then: agent-config install
```

Flags: `--copy` (copy instead of symlink), `--force` (replace existing),
`--dry-run`. The repo path is baked in at build time, so the command works from
any directory.

Codex's own config (`~/.codex/config.toml`) lives in dotfiles (chezmoi), not
here; this repo only supplies its skills.

## Install (distribution)

### APM ([microsoft/apm](https://github.com/microsoft/apm))

Install a single skill globally:

```sh
apm install -g unvalley/agent-config/skills/rust-review
```

Or declare them in a project's `apm.yml`:

```yaml
dependencies:
  apm:
    - unvalley/agent-config/skills/rust-review
    - unvalley/agent-config/skills/ts-review
    - unvalley/agent-config/skills/design-review
    - unvalley/agent-config/skills/conventional-commits
```

Then `apm install`.

### skills.sh ([vercel-labs/skills](https://github.com/vercel-labs/skills))

Discovers and installs every skill in the repo, auto-detecting your agents:

```sh
npx skills add unvalley/agent-config
```

### gh skill (GitHub CLI extension)

```sh
gh skill install unvalley/agent-config/skills/design-review
```

> `agents/` and `commands/` are Claude Code-only and aren't covered by the three
> skill channels above. Install them with the Rust CLI (`agent-config install`).

## Rules

`rules/` holds always-on behavior, referenced from [`AGENTS.md`](AGENTS.md):
coding style, git workflow, and communication preferences. Project-specific
instructions always override these defaults.

## Authoring a new skill

1. `mkdir -p skills/<name>` (lowercase, hyphens, no leading/trailing/consecutive
   hyphens, ≤ 64 chars).
2. Add `skills/<name>/SKILL.md` with frontmatter `name` (matching the dir) and a
   `description` that states **what** it does and **when** to use it.
3. Keep `SKILL.md` under ~500 lines; move detail into `references/`, code into
   `scripts/`, templates into `assets/`.
4. Keep frontmatter values ASCII-only (APM validation requirement).
5. Validate: `npx skills validate ./skills/<name>` or the agentskills `skills-ref`
   tool.
