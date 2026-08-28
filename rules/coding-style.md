# Coding Style

- Match the surrounding code. Mirror its naming, structure, idioms, and comment density before introducing your own style.
- Make illegal states unrepresentable. Use the type system to encode invariants rather than runtime checks alone.
- Handle errors explicitly. No silent catches.
- Validate input at boundaries; trust types within them.
- Keep single-use logic inline; extract it after real reuse appears.
- Prefer a small Rust CLI when internal shell tooling grows beyond a few lines.
