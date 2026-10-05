---
type: regex
# Checks the rewritten paragraph only (the text before the first blank line),
# so a note that quotes the removed phrases is left to `rewrite-only`.
pattern: '^(?:[^\n]|\n(?!\n))*?(?:fast-paced|digital landscape|worth noting|testament to)'
flags: i
match: not_contains
---
