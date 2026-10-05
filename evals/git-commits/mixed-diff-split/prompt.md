---
name: git-commits/mixed-diff-split
description: A staged diff mixing unrelated changes gets flagged and split, not papered over with a vague subject.
tags: [quality]
plugins: ["../../../skills/git-commits"]
max_turns: 6
allowed_tools: [Read, Glob, Grep, Skill]
---

Draft a commit message for this staged diff.

```diff
diff --git a/src/pagination.ts b/src/pagination.ts
index 3f1c2aa..9b7e4d1 100644
--- a/src/pagination.ts
+++ b/src/pagination.ts
@@ -15,3 +15,3 @@ export function pageCount(total: number, pageSize: number): number {
   }
-  return Math.floor(total / pageSize);
+  return Math.ceil(total / pageSize);
 }
diff --git a/README.md b/README.md
index 81c0d2e..5a4f7b3 100644
--- a/README.md
+++ b/README.md
@@ -8,3 +8,3 @@ ## Usage
 
-Clients recieve a cursor with every page.
+Clients receive a cursor with every page.
 
diff --git a/package.json b/package.json
index 7d1e9a0..c2b6f48 100644
--- a/package.json
+++ b/package.json
@@ -21,3 +21,3 @@
   "dependencies": {
-    "zod": "^3.22.4"
+    "zod": "^3.23.8"
   }
```
