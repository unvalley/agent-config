# Gallery

26 images for judging the converter by eye: watercolour and engraved plates on
white, cream and aged paper, white flowers on white, pressed flowers, birds, an
octopus and a beetle, woodblock prints on plain and graded grounds, a framed
photograph, and flowers photographed on black. They were picked on 2026-11-09
from are.na channels and cosmos.so searches; `sources.json` says where each came
from, what it tests, and what is known about its rights.

Many are 18th- and 19th-century plates in the public domain, but not all: the
photographs and some prints have unknown rights. Keep them for local testing,
and check the rights of a source before publishing a drawing made from it.

The images themselves are not committed, since their rights vary. Download
them once into `images/` (ignored by git), then run the gallery:

```bash
# From a folder that has sharp (the site repo):
node ~/.claude/skills/image-to-ascii/gallery/fetch.mjs
node ~/.claude/skills/image-to-ascii/gallery/run.mjs /tmp/gallery-out             # with each image's options
node ~/.claude/skills/image-to-ascii/gallery/run.mjs /tmp/gallery-out --defaults  # the automatic choices only
```

It writes each image's outputs, `results.json` with the report lines, and
`sheet-N.png`, eight images to a sheet as source, light page, dark page. Run
both after changing `convert.mjs`, and keep `--preset garland` exact with
`scripts/check-garland.mjs`: its glyphs must still equal the garland in the
site's `components/flowerVineArt.ts`.

What the gallery showed (2026-11-09), and what was changed for it:

- Cream, aged or tinted paper counted as ink in `paper` mode, so the paper
  became a faint block. Auto now picks `background` when the paper itself
  would count as ink.
- Plain coloured grounds (woodblocks on orange, navy) and a grey gradient were
  drawn whole as `all`. Auto now picks `all` only when no colour dominates
  the border.
- A white frame round a black photograph hid the black ground. A thin frame
  or mat of one colour is now found and the picture inside it used.
- Graded grounds (bokashi, vignettes) are fitted as a smooth surface instead
  of one colour. A strong bokashi can still show; raise `--ink-threshold`.
- `--ink chroma` draws tinted paper: use it on white paper only.
