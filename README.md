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

The simplest path is `just install`, which links this repo's own assets **and**
installs the third-party skills declared in `third-party-skills.txt`:

```sh
just install              # own assets (all agents) + third-party skills
just install claude       # own assets for one agent (all | claude | codex)
just status               # show what's installed where
just uninstall            # remove this repo's links
just third-party          # (re)install only the third-party skills
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

`just install` runs the Rust installer for own assets and `npx skills add` for
each line in `third-party-skills.txt`. The skills.sh lock at
`~/.agents/.skill-lock.json` (restored by chezmoi in step 1) just pins the
resolved versions.

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
npx skills validate ./skills/<name>   # check against the agentskills.io spec
```

Third-party skills are declared in `third-party-skills.txt` (one source per
line) — the source of truth for *which* skills to install. Edit it, then:

```sh
just third-party                  # install everything in third-party-skills.txt
npx skills list -g                # list installed
npx skills update -g              # update to latest
npx skills remove <name>          # uninstall (also drop its line from the file)
chezmoi add ~/.agents/.skill-lock.json   # re-track the lock after any change
```

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
