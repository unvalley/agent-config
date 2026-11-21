# Putting a drawing on unvalley.me

The site draws these with `components/AsciiArt.tsx` (type `AsciiDrawing` in
`components/flowerVineArt.ts`), the way `components/FlowerVine.tsx` draws
the garland above the footer.

## Convert for the site

- Convert with `--type-from ./flowerVineArt`, so `drawing.ts` imports the
  site's type rather than the skill's `AsciiArt.tsx`.
- Widths: the garland is 1000 px (wider than the text column, centred on
  the page), the text column 672 px, a side vine down a margin about 150 px.
- `--preset garland` gives the garland's exact settings (the `lightness`
  darkness rule, its recolouring, 12 colours in RGB, no grid). Use it, then
  override what differs, when a drawing should match the garland closely.
- The site's garland has no grid. A decoration usually goes without one
  too; use the grid when the drawing is a figure in an article, as in the
  kanji-flowers post.

## Add it

1. Put the `drawing.ts` export in a module beside the components, for
   example `components/<name>Art.ts`. Name the export with `--name` and
   rewrite its doc comment to say what the drawing is, in plain words, as
   the site's comments do. Keep the header line with the command, so it can
   be regenerated.
2. Render it with `<AsciiArt name="<unique-name>" drawing={...} />`. The
   name scopes its colour variables, so each drawing needs its own. Mark it
   `aria-hidden` when it is decoration, as the garland is.
3. For a grid over it, pass an overlay as its child, sized to the drawing's
   columns and rows, as `components/kanji-flowers/AsciiGarland.tsx` does with
   `kanji-flowers/Grid.tsx`. That `Grid` follows the article's switch; for a
   grid that is always on, use the same background on an absolutely
   positioned span without the switch.

## Sparkles over flowers

Convert with `--sparkle-hue` set to the flowers' hues (the garland used
`180-225`, its sky blues) so `flowerKeys` lists their colours, then wrap the
drawing in `AsciiSparkles` with `sparkleCells(drawing)` as `FlowerVine.tsx`
does. For small flowers in a bigger picture, give `--accent-hue` and
`--sparkle-hue` the same range, so the sparkles land on exactly those cells;
`flowers.png` shows them. Most big stars appear in blank cells next to
flowers, so a full-bleed drawing with no blank cells gets fewer big stars
(only on the flowers themselves) and mostly small glints; say so.

## The sky

The home page's sky (`components/AsciiSky*`) is not made by this skill: its
own scripts in `scripts/sky/` sort the painting into parts by colour and
draw the clouds as shaded tiles over open sky. This skill draws a sky whole,
blue as dense glyphs and clouds as pale ones, which suits a light page; use
`scripts/sky/` to change the site's sky.

## Colour schemes

For random colour schemes like the garland's, add `schemes`: more palettes
over the same keys (see the garland in `flowerVineArt.ts`).

## Before calling it done

Check it in the dev server on both themes and at phone width. Committing or
pushing to `main` deploys the site, so do that only when the user asks.

## Changing the converter

The converter's test gallery (26 varied images) and the check that
`--preset garland` still equals the site's garland live in this repository,
in `scripts/ascii-gallery/`. Its README also says how the converter
decides, for tuning. Run them after any change to `convert.mts`, with
`IMAGE_TO_ASCII_DIR` set to the skill folder being changed.
