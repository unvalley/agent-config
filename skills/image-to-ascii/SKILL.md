---
name: image-to-ascii
description: Turn an image (a watercolour, illustration, flower, plant, logo, product photo, cut-out or painting) into coloured ASCII art in the style of the flower garland on unvalley.me. Glyphs are picked by darkness from .:+*ox%#@, line glyphs / \ | - _ follow thin stems and edges, and a small palette gives each colour one value for light pages and one for dark. It delivers preview images, a standalone HTML page of selectable text, or an AsciiDrawing module for the site's AsciiArt component. Use this whenever the user wants an image or photo turned into ASCII art or text art (including requests in Japanese for ASCII art, AA or text art), wants something like our flowers or like the garland, or wants a new ASCII drawing, vine, plant or decoration on unvalley.me, even if they never say ASCII.
---

# Image to ASCII

The garland at the foot of unvalley.me is a watercolour of clematis turned
into text: every cell of 4 × 6.5 CSS pixels that holds enough paint gets a
glyph, denser for darker paint, and a slanted or straight line glyph where a
thin stem or petal edge runs through it. Each cell takes one of about a
dozen colours, and each colour has two values, a deeper one that reads on a
white page and a lighter one for a dark page. It is real text, so it can be
selected and copied, and it scales with its box.

`scripts/convert.mjs` does all of that from any image. Its `--preset garland`
reproduces the garland exactly (same glyphs, colours and palette as the
drawing on the site), so its defaults are the garland's choices and the job
here is mostly choosing the input and a few options well.

What makes the garland look good is that it is a subject on an empty page:
the paper between flowers stays blank, so the shapes read. Keep that in mind
for every image. A subject on plain paper or a transparent cut-out works
best; a full-bleed photo or painting becomes a solid block of text, which
can still be nice but looks different, so say so.

## 1. Look at the image

Read the image before converting, and decide what counts as ink:

| The image | Do |
| --- | --- |
| Subject on white paper (watercolour, illustration) | defaults (`--ink auto` picks `paper`) |
| Plate on cream, aged or tinted paper | defaults (`auto` picks `background`, so the paper stays blank) |
| White or pale petals on white paper | `--ink chroma`; see "White petals" below. Not on tinted paper, where chroma draws the paper too |
| Transparent PNG cut-out | defaults (`auto` picks `alpha`) |
| Subject on a plain dark or coloured ground (flowers on black, a woodblock on orange or navy) | defaults (`auto` picks `background`); if the subject is as dark as the ground, cut it out first |
| Graded ground (bokashi, a studio vignette) | defaults fit the gradient; if part of it is still drawn, `--ink-threshold 0.2`–`0.25` |
| Picture in a frame or mat | defaults: a thin frame of one colour is found and the picture inside it used (the report shows `frame`) |
| Photo with a busy background | cut the subject out first (below), then convert the PNG |
| Full-bleed painting or scene, wanted whole | `--ink all --colours 24` (auto picks `all` only when no colour dominates the border) and tell the user it fills the whole box |

Also look for small vivid details that matter: poppies in a field, a red
dot on a black camera, gold stamens. A cell's colour is the average of its
paint, which would turn a red dab among grass brown. The converter keeps a
vivid minority colour that stands out from its surroundings on its own, but
when you can name the detail, name its hue range with `--accent-hue`; its
cells then take that colour and a palette entry of their own.

Measure the range rather than guessing it: painted reds, creams and
yellow-greens overlap more than their names suggest.

```bash
node <skill-dir>/scripts/hues.mjs <image> --box 0.4,0.6,0.6,0.4   # x,y,w,h as fractions or px
```

It prints the vivid pixels in 10° bins with their mean colours. Measure the
detail and its surroundings, and pick a range that covers the detail but
not its neighbours' bins. If the detail has two tones (deep red dabs and
salmon drifts), give two ranges, `345-22,22-32`, and each gets its own
entry.

To cut a subject out, unvalley.me uses rembg (as `scripts/thing-cutout.mjs`
does): `uvx --from "rembg[cpu,cli]" rembg i in.jpg cut.png`. rembg downloads
its model (about 170 MB) the first time, so tell the user before the first
run.

## 2. Convert

```bash
node <skill-dir>/scripts/convert.mjs <image> <outDir> [options]
```

It needs `sharp`. It is found from the current directory (unvalley.me has it)
or the skill's own `scripts/`; if neither has it, the script prints the one
command that installs it there (`npm install --prefix <skill-dir>/scripts`).

Pick the width for where the drawing will live. Columns are width ÷ 4:

- the garland: 1000 (wider than the text column, centred on the page)
- the site's text column: 672
- a side vine down a margin: about 150
- a standalone page: whatever shows the subject; 480–1000 is usual

More columns show more detail but more text: keep columns × rows under about
40,000 for anything going on a web page.

It writes into `outDir`:

- `preview.png`: the source, the drawing on a light page and on a dark page,
  stacked (side by side for a tall drawing). Look at this one first.
- `light.png`, `dark.png`: the drawing alone on each page. Crop these to
  judge small details; the preview is scaled down.
- `flowers.png`, when there are `flowerKeys`: the flower cells in colour and
  the rest pale, to check where the sparkles will land.
- `index.html`: the drawing as selectable text, standalone, following the
  system theme with a light/dark button.
- `drawing.ts`: an `AsciiDrawing` for unvalley.me, with the command that made
  it in its header.
- `ascii.json`: the rows, colour keys and palette, for other uses.

It prints a one-line JSON report: the ink mode it chose, columns, rows,
glyph count, how many cells became accents and how many palette entries
they got, colours, `flowerKeys`, the lowest contrast of the palette on each
page, and warnings when the background looks counted as ink, the drawing is
almost empty, or a colour barely shows. The command, shell-quoted, is also
written into the header of `drawing.ts`, so a drawing can be regenerated.

## 3. Judge the preview and adjust

Read `preview.png` every time before showing anything, and compare it with
the source: can you tell what the subject is, is the background empty, and
does it read on both pages? Then adjust; one or two rounds are usual.
Scripts of your own that use sharp (crops, overlays) find it when run from
a folder that has it, such as the site repo.

| What you see | Change |
| --- | --- |
| The background is drawn as glyphs | `--ink paper` or `background`, a higher `--ink-threshold`, or cut the subject out |
| Pale petals or highlights are missing | `--ink chroma`, `--fill` |
| Speckle of single glyphs around the subject | raise `--coverage` (0.25–0.3) |
| Thin parts break up | lower `--coverage` (0.12), or more `--width` |
| Too many slashes, looks scratchy | `--edges 0.95`, a higher `--edge-coherence` (0.4), or `--no-edges` |
| A colour that differs from the page in hue but not lightness is faint (a red on navy, an orange on cream) | on a background the default `--tone auto` already counts colour; on white paper, `--tone ink` (leaves and fills get heavier too) |
| Smooth washes or skies come out in bands of one glyph | `--dither` |
| Outlines should read as drawn lines (an engraving, a bird's silhouette) | `--glyphs shape`, which picks `_ / \ - ` and fills by shape at boundaries; busier, so compare with the default |
| Mid-tones should follow the font's real ink | `--ramp-map measured` (in Menlo bold `o` is darker than `x` and `%`, so fills shift toward `o`) |
| Stems read as blobs | `--edges 0.85` |
| A small vivid detail came out brown or grey, or is missing | `--accent-hue <range>` measured with `hues.mjs`; lower `--accent` (0.08) if it is only a few dabs |
| Petals or leaves turned the accent's colour | the `--accent-hue` range is too wide: narrow it away from their hues |
| A full-bleed drawing has no line glyphs | expected: with `--ink all` every cell is fully covered, and lines go only on thin parts |
| Colours look muddy | more `--colours` (16–24), or `--seed "#hex"` to give a colour its own entry |
| Pale parts are tiny dots that vanish on a white page | `--ramp "::+*ox%#@"`, so the palest cells get `:` |
| A colour barely shows on one page | raise `--min-contrast` (default 1.8; 2–2.5 for very pale or very dark subjects) |
| The accent should be redder, bluer, … | `--hue-map` its range onto the hue you want |
| Wrong way round, or should face the other way | `--flop` |
| The user wants other flower colours | `--hue-map 225-350:196-206` (violets to sky blue), or `--recolour garland` for the garland's own recolouring |

Every option is listed with `--help`.

### White petals

White flowers on white paper are the hardest case, because the page is the
colour of the petals. What works:

- `--ink chroma`, so cream or grey-white petals count as paint (on white
  paper only: it would draw cream paper too). Add `--fill` only if the
  petals then have holes: it also fills paper enclosed by stems, such as
  the inside of a tendril's loop;
- `--seed` with the petals' own colour (sample a cream or lavender-white from
  the image), so they get palette entries instead of sharing the stems';
- `--min-contrast 2` and `--ramp "::+*ox%#@"`, so they read on a light page.
  Colours are darkened toward black to reach the contrast, so a cream
  becomes a warm grey.

On a light page they will read as warm grey; on a dark page they look
white. Say so rather than pushing the contrast until they look beige.

## 4. Deliver

**Standalone.** Send `preview.png` (or `light.png`) so the user sees it at
once, and point to `index.html`, which is the real thing: text that can be
selected and copied, sized to its box, light and dark. Give it a `--title`
(and `--lang ja` for a Japanese page); otherwise its title comes from
`--name` or the file name.

**On unvalley.me.** The site draws these with `components/AsciiArt.tsx`
(type `AsciiDrawing` in `components/flowerVineArt.ts`), the way
`components/FlowerVine.tsx` draws the garland:

1. Put the `drawing.ts` export in a module beside them, for example
   `components/<name>Art.ts`, keeping `import type { AsciiDrawing } from
   "./flowerVineArt"`. Name the export with `--name` and rewrite its doc
   comment to say what the drawing is, in plain words, as the site's
   comments do (it starts from `--title`, `--name` or the file name). Keep the header line with the command, so it can be
   regenerated.
2. Render it with `<AsciiArt name="<unique-name>" drawing={...} />`. The
   name scopes its colour variables, so each drawing needs its own. Mark it
   `aria-hidden` when it is decoration, as the garland is.
3. For the twinkling sparkles over flowers, convert with `--sparkle-hue`
   set to the flowers' hues (the garland used `180-225`, its sky blues) so
   `flowerKeys` lists their colours, then wrap it in `AsciiSparkles` with
   `sparkleCells(drawing)` as `FlowerVine.tsx` does. For small flowers in a
   bigger picture, give `--accent-hue` and `--sparkle-hue` the same range,
   so the sparkles land on exactly those cells; `flowers.png` shows them.
   Most big stars appear in blank cells next to flowers, so a full-bleed
   drawing with no blank cells gets fewer big stars (only on the flowers
   themselves) and mostly small glints; say so.
4. For colour schemes like the garland's random ones, add `schemes`: more
   palettes over the same keys (see the garland in `flowerVineArt.ts`).
5. Check it in the dev server on both themes and at phone width before
   calling it done. Committing or pushing to `main` deploys the site, so do
   that only when the user asks.

## Changing the converter

`gallery/sources.json` lists 26 varied images (plates on white and aged
paper, white flowers, birds, woodblocks on coloured and graded grounds,
flowers on black) with where each came from and what is known of its rights.
The images are not in the repository; `node <skill-dir>/gallery/fetch.mjs`
downloads them into `gallery/images/`. After a change to `convert.mjs`, run
`node <skill-dir>/gallery/run.mjs <outDir>` (and again with `--defaults`)
from the site repo and look at the sheets. Then run
`node <skill-dir>/scripts/check-garland.mjs` from the site repo: it converts
the garland's own watercolour with `--preset garland` and fails unless the
glyphs equal the garland in `components/flowerVineArt.ts`. That watercolour
is not in the repository either; keep it at
`gallery/images/garland-source.png`.

## How it decides, for tuning

- `--ink auto` looks at a ring just inside the border. It picks `alpha` if
  the edge is transparent and `all` if no colour dominates the ring. It
  picks `paper` if the ring is white enough not to count as ink. Otherwise
  it picks `background`, with the ground fitted as a smooth surface to the
  ring, so a gradient stays blank too. A thin frame or mat of one colour
  with a different ground inside is cut off first.
- The image is turned upright from its EXIF orientation, trimmed to its ink
  with a 3 px margin, and resampled to 4 × 6 samples per cell.
- A cell is drawn when at least `--coverage` of its samples are ink. Its
  colour is the mean of those samples.
- Darkness is spread over the whole ramp from the 5th to the 97th percentile
  of the drawing's cells, so a pale drawing still uses dense glyphs.
  Cells less than 45% covered stop at the third glyph, so edges stay light.
  On a plain dark background, "darkness" is the difference from the
  background instead.
- Darkness is lightness on white paper. On a background (`--tone auto`) it
  is the OKLab distance from the fitted ground with colourfulness counted
  twice, so a subject that differs from its ground in colour but not in
  lightness still gets dense glyphs.
- Edges come from a structure tensor of Sobel gradients. A cell in the top
  `--edges` quantile of edge strength that is less than 70% covered, and
  whose gradients agree on a direction (coherence at least
  `--edge-coherence`, after the EdgeASCII node for ComfyUI), becomes the
  line glyph nearest the edge's direction: - _ \ | /.
- With `--glyphs shape` (after Alex Harri, "ASCII characters are not
  pixels"), each glyph is drawn in the font and measured in six staggered
  windows. A cell whose darkness is uneven across those windows takes the
  glyph nearest in shape, after a contrast boost (`--shape-contrast`).
  `|` is left out, because without a glyph that fills only half a cell,
  every vertical boundary would match it. `--ramp-map measured` uses the
  same measurement to space the ramp by real ink.
- `--dither` adds a 4 × 4 ordered dither between ramp steps.
- Accents are found on the source's own pixels (up to 4× the cell grid, no
  smoothing). A cell is an accent when its vivid pixels are at least
  `--accent` of its ink, their hue is rare in the drawing (under 4% of
  cells) and differs from the cells around it, or when its pixels in an
  `--accent-hue` range are. Accent cells take the vivid colour and each hue
  gets its own palette entry. `--accent 0` turns this off, as for the
  garland.
- The palette is k-means over the other cells' colours in OKLab (RGB for
  the garland preset), seeded along their lightness. Keys run A (darkest) to z. The light-page value is deepened
  (blues made more saturated) and the dark-page value lightened, then
  each is mixed toward black or white until it has `--min-contrast` with
  its page (white and #0a0a0a).
