# Delegation

Applies to agents that can spawn subagents or invoke other models (Claude Code,
etc). Skip if the runtime has no delegation mechanism.

- The main model orchestrates, reviews, and verifies; mechanical or
  well-specified implementation goes to cheaper models (e.g. subagents with
  `model: sonnet` / `haiku`, or `codex exec`).
- Delegate with a complete spec: files, expected behavior, and how to verify.
  Vague delegation wastes more than it saves.
- Always verify delegated output yourself (build, tests, targeted reading)
  before reporting it as done.
