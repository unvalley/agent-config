---
name: git-commits/fix-from-diff
description: A one-line bug fix yields a `fix` commit whose subject follows the format rules.
tags: [quality]
plugins: ["../../../skills/git-commits"]
max_turns: 6
allowed_tools: [Read, Glob, Grep, Skill]
---

Draft a commit message for this staged diff. Reply with the commit message only.

```diff
diff --git a/src/pagination.ts b/src/pagination.ts
index 3f1c2aa..9b7e4d1 100644
--- a/src/pagination.ts
+++ b/src/pagination.ts
@@ -12,7 +12,7 @@ export function pageCount(total: number, pageSize: number): number {
   if (pageSize <= 0) {
     throw new RangeError("pageSize must be positive");
   }
-  return Math.floor(total / pageSize);
+  return Math.ceil(total / pageSize);
 }
```
