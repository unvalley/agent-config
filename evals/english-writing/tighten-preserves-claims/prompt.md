---
name: english-writing/tighten-preserves-claims
description: Tightening pasted prose cuts boilerplate but keeps every number, name, quote, link, hedge, and attribution.
tags: [quality]
plugins: ["../../../skills/english-writing"]
max_turns: 6
allowed_tools: [Read, Glob, Grep, Skill]
---

Tighten this paragraph for our engineering blog. Keep it as one paragraph.

In today's fast-paced digital landscape, it is worth noting that our team recently migrated the checkout service to the new queue. According to the vendor's own benchmark, the new queue may reduce p95 latency by up to 37%, although we have not yet reproduced that figure in production. In our staging tests across 1,204 requests, we observed that p95 latency fell from 480 ms to 410 ms. Dr. Amara Okafor, who leads the platform team, described the result as "encouraging but early". Ultimately, this migration stands as a testament to the power of thoughtful engineering. More details are available in the write-up at https://example.org/checkout-queue.
