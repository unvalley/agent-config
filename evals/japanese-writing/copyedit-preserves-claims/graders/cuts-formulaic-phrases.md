---
type: regex
# Checks the rewritten paragraph only (the text before the first blank line),
# so a note that quotes the removed phrases is left to `rewrite-only`.
pattern: '^(?:[^\n]|\n(?!\n))*?(?:急速に変化するデジタル社会|と言えるでしょう|重要な役割を果た)'
match: not_contains
---
