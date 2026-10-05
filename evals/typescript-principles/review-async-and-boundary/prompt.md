---
name: typescript-principles/review-async-and-boundary
description: A review finds the unvalidated cast, the floating promise, and the string throw, and cites lines.
tags: [quality]
plugins: ["../../../skills/typescript-principles"]
max_turns: 6
allowed_tools: [Read, Glob, Grep, Skill]
---

Review this new function in `src/users.ts`. `sendAuditLog` returns
`Promise<void>`.

```ts
 1  import { db } from "./db";
 2  import { sendAuditLog } from "./audit";
 3
 4  type User = { id: string; email: string; plan: "free" | "pro" };
 5
 6  export async function importUser(req: Request): Promise<User> {
 7    const user = (await req.json()) as User;
 8    if (!user.email) {
 9      throw "email is required";
10    }
11    await db.users.insert(user);
12    sendAuditLog("user.imported", user.id);
13    return user;
14  }
```
