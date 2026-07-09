# Debugging

- No speculative fixes. Never push "try this" changes one after another.
  Trace the exact code path, add logging or a failing test, and confirm the
  root cause with evidence before editing.
- One hypothesis at a time. State the hypothesis, state what evidence would
  confirm or refute it, then gather that evidence.
- Performance changes require measurement. Take a baseline, apply the change,
  measure again with the same harness. No measurable gain → say so and revert.
- Distinguish "the symptom stopped" from "the cause is fixed". If you can't
  explain why the fix works, the investigation isn't done.
