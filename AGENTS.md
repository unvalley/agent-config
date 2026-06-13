# Agent Config

unvalley's portable AI agent configuration: skills and rules for AI coding
agents (Claude Code, Copilot, Cursor, Codex, and any agent that supports the
[agentskills.io](https://agentskills.io) standard).

## Stack

Senior software engineer and designer. Primary stack: Rust, TypeScript, Node.js.

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
| [`ts-review`](skills/ts-review/SKILL.md) | Strict TypeScript / Node.js review: types, async, modules |
| [`design-review`](skills/design-review/SKILL.md) | UI/UX critique: hierarchy, spacing, a11y, interaction polish |
| [`conventional-commits`](skills/conventional-commits/SKILL.md) | Conventional Commit messages and PR descriptions |

See [README.md](README.md) for installation and distribution.
