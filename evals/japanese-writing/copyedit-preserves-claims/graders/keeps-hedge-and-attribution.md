---
type: llm
---

The source text says that, according to the vendor's own benchmark, the new
queue may cut p95 latency by up to 37% (最大 37% 削減できる可能性がある), and that
this has not yet been reproduced in production (本番環境ではまだ再現できていません).

PASS if the rewrite still attributes the 37% figure to the vendor's benchmark,
still presents it as a possibility rather than an achieved result, and still
says it has not been reproduced in production.

FAIL if the rewrite states the 37% reduction as fact, drops the attribution to
the vendor, or drops the statement that it is not yet reproduced in production.
