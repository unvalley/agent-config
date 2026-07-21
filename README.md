# agent-config

@unvalley portable AI agent configuration.

## Contents

```
skills/        agentskills.io skills for review, performance, releases, and workflows
agents/        Claude Code subagents (code-reviewer, planner)
commands/      Claude Code slash commands (/commit, /review, /plan)
rules/         always-on behavior (coding style, git, communication)
src/           Rust installer CLI
AGENTS.md      entry point for any AGENTS.md-aware agent (read natively by Codex)
```

## Apply to this machine

The simplest path is `just install`, which links this repo's own assets **and**
restores the third-party skills recorded in the skills.sh lock:

```sh
just install              # own assets (all agents) + third-party skills
just install claude       # own assets for one agent (all | claude | codex)
just status               # show what's installed where
just uninstall            # remove this repo's links
just third-party          # restore third-party skills from ~/.agents/.skill-lock.json
```

Under the hood a small Rust CLI symlinks the assets, so repo edits are picked up
live. Claude gets `skills/` + `agents/` + `commands/` under `~/.claude`; Codex
gets `skills/` under `~/.agents/skills` — the user-level directory Codex scans
([docs](https://developers.openai.com/codex/skills)), shared with skills.sh.

```sh
cargo run -- install              # symlink own assets into ~/.claude (claude)
cargo run -- install -t all       # claude + codex
cargo run -- status               # show what's installed where
cargo run -- uninstall            # remove the links
```

Flags: `--copy` (copy instead of symlink), `--force` (replace existing),
`--dry-run`. The repo path is baked in at build time, so the command works from
any directory.

Codex's own config (`~/.codex/config.toml`) lives in dotfiles (chezmoi), not
here. Codex reads `AGENTS.md` per-project (not installed globally) and skills
from `~/.agents/skills`.

## New machine setup (full)

Reproduce the whole agent setup on a fresh machine:

```sh
# 1. dotfiles (chezmoi): restores ~/.codex/config.toml, ~/CLAUDE.md, and the
#    skills.sh lock at ~/.agents/.skill-lock.json
chezmoi init --apply unvalley

# 2. everything else: clone this repo, then one command links own assets
#    (~/.claude + ~/.agents/skills) and installs third-party skills
git clone https://github.com/unvalley/agent-config.git
cd agent-config
just install                      # own assets (all agents) + third-party skills
```

`just install` runs the Rust installer for own assets, then `just third-party`,
which reads the skills.sh lock at `~/.agents/.skill-lock.json` (restored by
chezmoi in step 1) and re-runs `npx skills add -g` for each source. skills.sh has
no global restore-from-lock command, so this small loop is the bridge.

## Managing skills

Two tracks coexist and never collide: own skills are symlinks into this repo;
third-party skills come from skills.sh. `agent-config` only ever touches its own
links. Where they land depends on the agent:

- **Claude** reads `~/.claude/skills` (own + third-party symlinked there).
- **Codex** reads `~/.agents/skills` (own symlinked there by `agent-config`,
  third-party stored there by skills.sh).

Own skills (source of truth = this git repo):

```sh
# add: create skills/<name>/SKILL.md (see "Authoring a new skill"), then
just install                      # link into ~/.claude/skills + ~/.agents/skills
agent-config status               # what this repo has linked, and where
agent-config uninstall -t all     # remove only this repo's links
npx skills-ref validate ./skills/<name>  # check against the agentskills.io spec
```

Third-party skills are managed entirely by skills.sh — its global lock
`~/.agents/.skill-lock.json` (tracked by chezmoi) is the source of truth. This
repo declares no separate list; manage them natively:

```sh
npx skills add <owner>/<repo> -g  # add a skill (and -s <name> to pick skills)
npx skills remove <name>          # remove one
npx skills list -g                # list installed
npx skills update -g              # update to latest
chezmoi add ~/.agents/.skill-lock.json   # re-track the lock after any change
just third-party                  # restore the whole lock onto a machine
```

`just third-party` exists only because skills.sh has no global restore-from-lock
command; it reads the lock and re-runs `npx skills add -g` per source.

Tell own from third-party at a glance:

```sh
readlink ~/.claude/skills/*
# -> .../agent-config/...   = own (this repo)
# -> ../../.agents/skills/  = third-party (skills.sh)
```

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
    - unvalley/agent-config/skills/rust-performance
    - unvalley/agent-config/skills/ts-review
    - unvalley/agent-config/skills/swift-review
    - unvalley/agent-config/skills/swift-performance
    - unvalley/agent-config/skills/local-first-filesystem
    - unvalley/agent-config/skills/release-engineering
    - unvalley/agent-config/skills/design-review
    - unvalley/agent-config/skills/conventional-commits
    - unvalley/agent-config/skills/ci-fix
    - unvalley/agent-config/skills/ghq-create-repository
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

1. Create `skills/<name>/` with a lowercase, hyphenated name (no
   leading/trailing/consecutive hyphens, ≤ 64 chars). Use the active agent's
   skill scaffolder when available.
2. Add `SKILL.md` with only `name` (matching the directory) and `description`
   in frontmatter. The description must state both **what** the skill does and
   **when** it should trigger.
3. Add `agents/openai.yaml` with quoted `display_name`, `short_description`, and
   a `default_prompt` that explicitly invokes `$<name>`.
4. Keep `SKILL.md` under ~500 lines; move optional detail into `references/`,
   deterministic code into `scripts/`, and output resources into `assets/`.
5. Keep frontmatter values ASCII-only (APM validation requirement).
6. Validate with the agentskills reference tool: `npx skills-ref validate
   ./skills/<name>` (or `just validate <name>`).
