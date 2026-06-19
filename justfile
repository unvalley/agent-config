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

# Restore global third-party skills from the skills.sh lock (~/.agents/.skill-lock.json).
third-party:
    #!/usr/bin/env bash
    set -euf -o pipefail
    lock="$HOME/.agents/.skill-lock.json"
    [ -f "$lock" ] || { echo "no skills.sh lock at $lock — run 'chezmoi apply' or 'npx skills add <src> -g' first"; exit 0; }
    jq -r '.skills | to_entries | group_by(.value.source) | .[]
        | (.[0].value.source) + " " + ([.[] | "-s " + .key] | join(" "))' "$lock" \
    | while IFS= read -r line; do
        npx -y skills add $line -g -a claude-code -a codex -a github-copilot -y
    done

# Show what's installed where (target: all | claude | codex).
status target="all":
    {{cli}} status -t {{target}}

# Remove this repo's links (target: all | claude | codex).
uninstall target="all":
    {{cli}} uninstall -t {{target}}

# Validate a skill against the agentskills.io spec, e.g. `just validate rust-review`.
validate skill:
    npx skills-ref validate ./skills/{{skill}}
