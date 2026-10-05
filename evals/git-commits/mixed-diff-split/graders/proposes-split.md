---
type: llm
---

The staged diff mixes three unrelated changes: a bug fix in
`src/pagination.ts`, a typo fix in `README.md`, and a `zod` version bump in
`package.json`.

PASS if the response says the diff mixes unrelated changes and proposes
splitting it into separate commits.

FAIL if it only offers a single commit message for the whole diff and does not
recommend a split.
