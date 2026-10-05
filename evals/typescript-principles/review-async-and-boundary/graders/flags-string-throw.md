---
type: llm
---

Line 9 of the reviewed code is `throw "email is required";`, which throws a
string instead of an `Error`.

PASS if the review flags throwing a string and says to throw an `Error` or an
`Error` subclass.

FAIL if the review does not raise it.
