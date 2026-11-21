# Putting a drawing on unvalley.me

The site draws these with `components/AsciiArt.tsx` (type `AsciiDrawing` in
`components/flowerVineArt.ts`), the way `components/FlowerVine.tsx` draws
the garland above the footer. Work from the site's `main` on GitHub: a
local checkout may be behind it, without `blocks` or `components/sky/`.

## Convert for the site

- Convert with `--type-from ./flowerVineArt`, so `drawing.ts` imports the
  site's type rather than the skill's `AsciiArt.tsx`.
- Widths: the garland is 1000 px (wider than the text column, centred on
  the page), the text column 672 px, a side vine down a margin about 150 px.
- `--preset garland` gives the garland's exact settings (the `lightness`
  darkness rule, its recolouring, 12 colours in RGB, no grid). Use it, then
  override what differs, when a drawing should match the garland closely.
- The garland and the sky are drawn in blocks, so "like the garland" or
  "like the sky" means `--blocks`. `--preset garland --blocks` gives exactly
  the glyphs of the garland in blocks (`components/garlandBlocks.ts`, 200
  columns of 5 × 8.125 px).
- A decoration usually goes without the grid; use the grid when the drawing
  is a figure in an article, as in the kanji-flowers post.

## Add it

1. Put the `drawing.ts` export in a module beside the components, for
   example `components/<name>Art.ts`. Name the export with `--name` and
   rewrite its doc comment to say what the drawing is, in plain words, as
   the site's comments do. Keep the header line with the command, so it can
   be regenerated.
2. Render it with `<AsciiArt name="<unique-name>" drawing={...} />`. The
   name scopes its colour variables, so each drawing needs its own. Mark it
   `aria-hidden` when it is decoration, as the garland is. For blocks, pass
   `blocks={{ gap: 1, shade: [14, 42] }}`, as `FlowerVine.tsx` does (the
   values `drawing.ts` names in its header).
3. For a grid over it, pass an overlay as its child, sized to the drawing's
   columns and rows, as `components/kanji-flowers/AsciiGarland.tsx` does with
   `kanji-flowers/Grid.tsx`. That `Grid` follows the article's switch; for a
   grid that is always on, use the same background on an absolutely
   positioned span without the switch.

## The garland in blocks

`components/garlandBlocks.ts` is the garland's watercolour drawn again on
5 × 8.125 px cells and coloured with the garland's own keys, so it keeps
its colour schemes and sparkles. The site's `AsciiArt` draws its glyphs at
full size, across the gap, where this skill (and the sky) fit each glyph
inside its tile; for the garland to fit too, the site's `AsciiArt` needs
the same fitting as the skill's `assets/AsciiArt.tsx` (`fitGlyphs`). `scripts/garland/README.md` says how to
make it again: convert with `--preset garland --blocks` (its README still
names the older `convert.mjs` and `--cell 5x8.125`, which give the same
glyphs), then pass the `ascii.json` to `scripts/garland/blocks.mts`.

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

The home page's sky (`components/AsciiSky*` and `components/sky/`) is drawn
live by its own engine, from assets made by `scripts/sky/`: tiles of the
sky's blue on 6 × 9.75 px cells, clouds as shaded white tiles that drift,
and air the pointer stirs. This skill does not make it. For a still sky in
the same look, convert a painting with `--ink all --blocks`: it is tiled
edge to edge, blue tiles under blue glyphs and pale ones in the clouds.
That reads like the site's sky on a light page; on a dark page the clouds
become dim gaps, where the site's engine draws them as the brightest tiles.

## Colour schemes

For random colour schemes like the garland's, add `schemes`: more palettes
over the same keys (see the garland in `flowerVineArt.ts`).

## Before calling it done

Check it in the dev server on both themes and at phone width. Committing or
pushing to `main` deploys the site, so do that only when the user asks.

## Changing the converter

The converter's test gallery (28 images, two of them skies) and the check
that `--preset garland` still equals the site's garland live in this
repository, in `scripts/ascii-gallery/`. Its README also says how the
converter decides, for tuning. Run them after any change to `convert.mts`,
with `ASCII_PAINTING_DIR` set to the skill folder being changed.
