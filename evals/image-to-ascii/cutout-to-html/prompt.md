---
name: image-to-ascii/cutout-to-html
description: A transparent cut-out becomes one standalone HTML page of selectable coloured text that works on light and dark pages.
tags: [quality]
plugins: ["../../../skills/image-to-ascii"]
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---

このカメラの切り抜き画像を色付きのアスキーアートにして、ブラウザで開くだけで見られる1枚のHTMLにしてほしい。文字としてコピーできるようにしたい。

画像: https://unvalley.me/static/things/original/sigma-fp.png
