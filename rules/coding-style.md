# Coding Style

Reusable coding standards for any project.
Project-specific conventions always win over these defaults.

- Match the surrounding code. Mirror its naming, structure, idioms, and comment density before introducing your own style.
- Make illegal states unrepresentable. Use the type system to encode invariants rather than runtime checks alone.
- Handle errors explicitly. No silent catches.
- Validate input at boundaries; trust types within them.
- Don't extract single-use helpers. Inline them into the caller; extract a
  utility only after real reuse appears.
- For internal tooling, prefer a small Rust CLI over shell scripts once logic
  goes beyond a few lines.
