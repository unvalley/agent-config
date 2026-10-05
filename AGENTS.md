# Agent Config

Portable configuration for AI coding agents.

- Use the matching [`skills/`](skills/) instructions when a task triggers one.
- Claude Code can also use [`agents/`](agents/).
- Skill evals live in [`evals/<skill>/<case>/`](evals/) and run on Claude Code.
  After changing a skill that has cases, run `just eval <skill>`, and add a
  case when you add behavior worth guarding.
- [`skills/benchmark.md`](skills/benchmark.md) holds the latest `just eval-all`
  scores. Update it when a change moves them.

See [README.md](README.md) for installation and how evals work.
