---
name: github-pull-request/fills-template
description: A PR template is filled in order with its headings kept and non-applicable sections marked N/A.
tags: [quality]
plugins: ["../../../skills/github-pull-request"]
max_turns: 6
allowed_tools: [Read, Glob, Grep, Skill]
---

Write the PR title and body for this branch. Do not open the PR yet; reply
with the title and body only.

The repository's `.github/PULL_REQUEST_TEMPLATE.md` is:

```markdown
## Summary

## Changes

## Screenshots

## Checklist

- [ ] Tests added or updated
```

Commits:

- `fix(pagination): round page count up`
- `test(pagination): cover partial last page`

Diff:

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
diff --git a/test/pagination.test.ts b/test/pagination.test.ts
index 4b2a1c7..e93d5f0 100644
--- a/test/pagination.test.ts
+++ b/test/pagination.test.ts
@@ -9,2 +9,6 @@ describe("pageCount", () => {
   });
+
+  it("counts a partial last page", () => {
+    expect(pageCount(21, 10)).toBe(3);
+  });
 });
```
