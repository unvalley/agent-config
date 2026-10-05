---
type: llm
---

Line 12 of the reviewed code calls `sendAuditLog("user.imported", user.id);`
without `await` or any rejection handling, although it returns a promise.

PASS if the review flags that call as a floating or unhandled promise.

FAIL if the review does not raise it.
