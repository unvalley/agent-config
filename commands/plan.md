---
description: Produce a concrete implementation plan for a task before any code is written.
argument-hint: <task description>
---

Produce an implementation plan for: $ARGUMENTS

Delegate to the `planner` subagent so the codebase investigation runs in its own
context. Return an ordered plan with: goal, approach (and why), steps (naming the
files to touch), risks/unknowns, and how to test it.

Do not write any implementation code. If the task is ambiguous, ask one or two
clarifying questions before planning.
