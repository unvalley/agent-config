# agent-config — link skills/agents/commands into local AI agent dirs.
# Run `just --list` to see recipes.

# The installer CLI, run from source (no install step needed).
cli := "cargo run --quiet --"

_default:
    @just --list

# Link assets into every agent's dirs (target: all | claude | codex).
install target="all":
    {{cli}} install -t {{target}}

# Show what's installed where (target: all | claude | codex).
status target="all":
    {{cli}} status -t {{target}}

# Remove this repo's links (target: all | claude | codex).
uninstall target="all":
    {{cli}} uninstall -t {{target}}

# Validate a skill against the agentskills.io spec, e.g. `just validate rust-review`.
validate skill:
    npx skills validate ./skills/{{skill}}
