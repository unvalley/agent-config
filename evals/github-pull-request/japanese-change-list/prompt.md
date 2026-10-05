---
name: github-pull-request/japanese-change-list
description: Japanese PR copy is a bullet change list in 体言止め, grounded in the diff.
tags: [quality]
plugins: ["../../../skills/github-pull-request"]
max_turns: 6
allowed_tools: [Read, Glob, Grep, Skill]
---

このブランチの PR タイトルと本文を日本語で書いて。リポジトリに PR テンプレートはない。
PR はまだ作らないで、タイトルと本文だけを返して。

コミット:

- `fix(pagination): round page count up`
- `test(pagination): cover partial last page`

差分:

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
