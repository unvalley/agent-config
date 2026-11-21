# Drawing a subject that has no image

When the user names a subject ("a cat", "a sunflower", "Mt. Fuji at dawn")
and gives no image, draw the subject as an SVG and convert that. Do not
type the ASCII by hand: hand-typed art drifts out of proportion within a few
rows, while the converter places every glyph by measurement, picks its
colour, and traces the outline with line glyphs. Your job is a clear
picture; the converter's job is the glyphs.

Start from [`assets/subject.svg`](../assets/subject.svg), a shaded apple
that shows each point below. Write the new file into the output folder,
for example `out/cat.svg`, and convert it like any image:

```bash
node <skill-dir>/scripts/convert.mts out/cat.svg out/cat --columns 100 --width 400
```

The first panel of `preview.png` is the SVG as the converter saw it. If the
subject does not read there, fix the SVG; no option of the converter will.

## Plan in cells

Decide the columns first (see "Pick the size" in SKILL.md), then think of
the viewBox as that many cells across. A cell is `viewBox width ÷ columns`
units wide and about 1.6 times as tall.

- **Parts that must show are at least two cells across**: eyes, a nose, a
  flower's centre. A part of one cell becomes one glyph and may vanish in
  the average with its neighbours.
- **Lines that should read as lines are strokes about one cell wide**:
  stems, whiskers, veins, a horizon. They become `/ \ | - _`. Much thinner
  and they may drop out; much thicker and they fill with density glyphs.
- **Simplify**. At 80–120 columns the drawing is closer to a woodcut than to
  a photo: a strong silhouette, a few big masses, a few telling details.

## Shade every large area

Glyph density follows how much paint a cell holds, so a flat fill becomes a
block of the same glyph. Give each large area a gradient instead:
highlight, body colour, shadow, with light from one side. The cat's body
in a radial gradient from light orange to a darker rim becomes `+ * o x %`
running round its form, which reads as volume. Dark accents (stripes,
pupils, seeds) become `# @`.

For a painted look on top of that, wrap the drawing in the template's
`paint` filter, which multiplies it by soft grey noise. Keep the noise grey:
coloured noise muddies the palette.

## Colour

- Use a handful of clearly different colours for the parts that must stay
  apart (green eyes in orange fur): the palette has about 12 entries, and
  similar colours merge.
- Bright colours count as paint, so a yellow sunflower gets dense glyphs.
  Very pale fills (cream, white, pastel) still draw sparsely and look faint
  on a white page: deepen them a little, or give them a darker rim.
- A small vivid detail (a pink nose, a red ladybird) can average away into
  its surroundings. Make it two cells or more, and if it still turns brown,
  convert with `--accent-hue` set to its hue range.
- Do not outline every shape in black: an outline becomes a solid rim of
  `@`. The converter already traces silhouettes with line glyphs. Where two
  parts of one colour need separating, use a deeper shade of that colour.

## Background

- **No background** (transparent) for a subject on an empty page, the look
  of the garland. The converter treats the transparent area as paper.
- **A full background** only for a scene the user asked for (a landscape, a
  sky behind a mountain): draw it edge to edge and convert with
  `--ink all`, then say that the drawing fills its whole box.

## Check, then adjust

Look at `preview.png`: is the subject recognisable at a glance, do its
parts stay apart, and do the lines read? Usual fixes, in the SVG:

| What you see | Change in the SVG |
| --- | --- |
| A part is an even block of one glyph | shade it with a gradient |
| A detail vanished | make it bigger (two cells or more) or a more distinct colour |
| A line broke into dots | make the stroke about one cell wide |
| Two parts merged | separate their colours, or put a deeper line between them |
| Too heavy overall (all `#` and `@`) | lighter colours, or a lighter body with darker accents only |
| Too faint overall | deeper colours |

Then adjust the conversion as for any image (SKILL.md, step 3).
