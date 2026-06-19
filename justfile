# agent-config — link skills/agents/commands into local AI agent dirs.
# Run `just --list` to see recipes.

# The installer CLI, run from source (no install step needed).
cli := "cargo run --quiet --"

_default:
    @just --list

# Link own assets (target: all | claude | codex), then third-party skills.
install target="all": (_own target) third-party

_own target="all":
    {{cli}} install -t {{target}}

# Install third-party skills declared in third-party-skills.txt (skills.sh).
third-party:
    #!/usr/bin/env bash
    set -euf -o pipefail
    while IFS= read -r line; do
        line="${line%%#*}"
        [ -z "${line// /}" ] && continue
        npx -y skills add $line -g -a claude-code -a codex -a github-copilot -y
    done < third-party-skills.txt

# Show what's installed where (target: all | claude | codex).
status target="all":
    {{cli}} status -t {{target}}

# Remove this repo's links (target: all | claude | codex).
uninstall target="all":
    {{cli}} uninstall -t {{target}}

# Validate a skill against the agentskills.io spec, e.g. `just validate rust-review`.
validate skill:
    npx skills validate ./skills/{{skill}}
