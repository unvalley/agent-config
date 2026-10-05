---
type: llm
---

Line 7 of the reviewed code is `const user = (await req.json()) as User;`,
which casts unvalidated request input to `User`.

PASS if the review flags that cast as unsafe because the request body is not
validated at runtime.

FAIL if the review does not raise it.
