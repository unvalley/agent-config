# Agent Config

unvalley's portable AI agent configuration: skills and rules for AI coding
agents (Claude Code, Copilot, Cursor, Codex, and any agent that supports the
[agentskills.io](https://agentskills.io) standard).

## Rules

Always-on behavior rules. Project-specific instructions override these.

- [Coding style](rules/coding-style.md)
- [Git workflow](rules/git-workflow.md)
- [Communication](rules/communication.md)

## Skills

On-demand capabilities in [`skills/`](skills/). Each is a standard `SKILL.md`
activated when a task matches its description.

| Skill | Use for |
| --- | --- |
| [`rust-review`](skills/rust-review/SKILL.md) | Idiomatic Rust review: ownership, errors, clippy, unsafe, perf |
| [`rust-performance`](skills/rust-performance/SKILL.md) | Rust speed: allocations, CompactString, arenas, FxHashMap, layout, inlining |
| [`ts-review`](skills/ts-review/SKILL.md) | Strict TypeScript / Node.js review: types, async, modules |
| [`design-review`](skills/design-review/SKILL.md) | UI/UX critique: hierarchy, spacing, a11y, interaction polish |
| [`conventional-commits`](skills/conventional-commits/SKILL.md) | Conventional Commit messages and PR descriptions |

## Subagents

Specialized workers in [`agents/`](agents/) (Claude Code), each with its own
context window. Read-only by design.

| Agent | Use for |
| --- | --- |
| [`code-reviewer`](agents/code-reviewer.md) | Reviews a diff/PR/files for bugs, security, idiom; returns findings by severity |
| [`planner`](agents/planner.md) | Investigates the codebase and returns a step-by-step implementation plan |

## Commands

Slash commands in [`commands/`](commands/) (Claude Code).

| Command | Use for |
| --- | --- |
| `/commit` | Review the staged diff and create a Conventional Commit (manual-only) |
| `/review` | Review the current diff or given files |
| `/plan` | Produce an implementation plan before coding |

See [README.md](README.md) for installation and distribution.
