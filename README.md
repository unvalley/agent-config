# agent-config

unvalley's portable AI agent configuration — reusable **skills** and **rules**
for AI coding agents, following the [agentskills.io](https://agentskills.io)
open standard. One repo, three distribution channels: **APM**, **skills.sh**,
and **gh skill**.

## Install

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

## Skills

| Skill | Use for |
| --- | --- |
| `rust-review` | Idiomatic Rust review — ownership, error handling, clippy, `unsafe` soundness, performance |
| `ts-review` | Strict TypeScript / Node.js review — type safety, async correctness, module hygiene |
| `design-review` | UI/UX critique — visual hierarchy, spacing, typography, accessibility, interaction polish |
| `conventional-commits` | Conventional Commit messages and PR descriptions |

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
