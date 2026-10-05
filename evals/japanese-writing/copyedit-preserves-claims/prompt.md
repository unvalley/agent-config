---
name: japanese-writing/copyedit-preserves-claims
description: Copyediting pasted Japanese cuts formulaic phrases but keeps numbers, links, hedges, and attribution.
tags: [quality]
plugins: ["../../../skills/japanese-writing"]
max_turns: 6
allowed_tools: [Read, Glob, Grep, Skill]
---

次の文章を、社内ブログ向けに自然な日本語へ整えて。段落は1つのままにして。

昨今の急速に変化するデジタル社会において、私たちのチームは先日、決済サービスを新しいキューへ移行することを実施しました。ベンダー自身のベンチマークによれば、新しいキューは p95 レイテンシを最大 37% 削減できる可能性があるとのことですが、本番環境ではまだ再現できていません。ステージングで 1,204 件のリクエストを使って検証を行ったところ、p95 レイテンシは 480 ms から 410 ms へと改善されました。この移行は、丁寧なエンジニアリングが重要な役割を果たすことを示していると言えるでしょう。詳細は https://example.org/checkout-queue にまとめています。
