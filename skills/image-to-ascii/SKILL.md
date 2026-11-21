---
name: image-to-ascii
description: Draw coloured ASCII art on a grid of cells, from an image (a watercolour, illustration, flower, logo, product photo, cut-out or painting) or from only a description of a subject (a cat, a sunflower, a mountain), in the style of the flower garland on unvalley.me. Glyphs are picked by how much paint a cell holds from .:+*ox%#@, line glyphs / \ | - _ follow stems and edges, each colour has a value for light pages and one for dark, and the cells show as a faint grid unless the user wants the glyphs alone. Delivers previews, a standalone HTML page of selectable text, plain text, or a module for a React site. Use this whenever the user wants an image or photo turned into ASCII art or text art, asks for a drawing of something in ASCII or text (including Japanese requests for ASCII art, AA or text art), wants something like our flowers or the garland, or wants a new ASCII drawing, vine, plant or decoration on unvalley.me, even if they never say ASCII.
---

# ASCII art on a grid

The garland at the foot of unvalley.me is a watercolour of clematis turned
into text. The picture is cut into a grid of cells, 4 × 6.5 CSS pixels each;
a cell that holds enough paint gets a glyph, denser for more paint, or a
slanted or straight line glyph where a thin stem or petal edge runs through
it. Each cell takes one of about a dozen colours, and each colour has two
values, a deeper one that reads on a white page and a lighter one for a
dark page. It is real text, so it can be selected and copied, and it scales
with its box.

`scripts/convert.mts` does all of that from any image, SVG included. By
default it also shows the cells as a grid of thin lines under the glyphs,
like squared paper; `--no-grid` leaves the glyphs alone on the page.

What makes the garland look good is that it is a subject on an empty page:
the paper between flowers stays blank, so the shapes read. Keep that in mind
for every drawing. A subject on plain paper or a transparent cut-out works
best; a full-bleed photo or painting becomes a solid block of text, which
can still be nice but looks different, so say so.

## 1. Get a picture

- **The user gave an image**: use it, and read it before converting (step 2).
- **The user only named a subject**: draw it as an SVG and convert that.
  Read [references/drawing-a-subject.md](references/drawing-a-subject.md)
  and start from [assets/subject.svg](assets/subject.svg). Never type the
  ASCII by hand; it drifts out of proportion within a few rows.
- **A photo with a busy background**: cut the subject out first. rembg
  does this well: `uvx --from "rembg[cpu,cli]" rembg i in.jpg cut.png`. It
  downloads its model (about 170 MB) the first time, so ask before the
  first run.

Ask the user only what the request leaves open and the result depends on:
usually nothing. Pick a size and the grid by the rules below and say what
you picked.

## 2. Look at the image

Decide what counts as ink:

| The image | Do |
| --- | --- |
| Subject on white paper (watercolour, illustration) | defaults (`--ink auto` picks `paper`) |
| Plate on cream, aged or tinted paper | defaults (`auto` picks `background`, so the paper stays blank) |
| White or pale petals on white paper | `--ink chroma`; see "White petals" below. Not on tinted paper, where chroma draws the paper too |
| Transparent PNG cut-out, or an SVG with no background | defaults (`auto` picks `alpha`) |
| Subject on a plain dark or coloured ground (flowers on black, a woodblock on orange or navy) | defaults (`auto` picks `background`); if the subject is as dark as the ground, cut it out first |
| Graded ground (bokashi, a studio vignette) | defaults fit the gradient; if part of it is still drawn, `--ink-threshold 0.2`–`0.25` |
| Picture in a frame or mat | defaults: a thin frame of one colour is found and the picture inside it used (the report shows `frame`) |
| Full-bleed painting or scene, wanted whole | `--ink all --colours 24` (auto picks `all` when no colour dominates the border, or when the one that does would leave half the picture as ink) and tell the user it fills the whole box |
| A sky, sea or other scene mostly of one colour (clouds over blue) | as above; the report should show `all`, not `background`. It reads like the painting on a light page. On a dark page the clouds become dim gaps, because both pages share the glyphs and a cloud holds little paint: say so |

Also look for small vivid details that matter: poppies in a field, a red
dot on a black camera, gold stamens. A cell's colour is the average of its
paint, which would turn a red dab among grass brown. The converter keeps a
vivid minority colour that stands out from its surroundings on its own, but
when you can name the detail, name its hue range with `--accent-hue`; its
cells then take that colour and a palette entry of their own.

Measure the range rather than guessing it: painted reds, creams and
yellow-greens overlap more than their names suggest.

```bash
node <skill-dir>/scripts/hues.mts <image> --box 0.4,0.6,0.6,0.4   # x,y,w,h as fractions or px
```

It prints the vivid pixels in 10° bins with their mean colours. Measure the
detail and its surroundings, and pick a range that covers the detail but
not its neighbours' bins. If the detail has two tones (deep red dabs and
salmon drifts), give two ranges, `345-22,22-32`, and each gets its own
entry.

## 3. Convert

```bash
node <skill-dir>/scripts/convert.mts <image> <outDir> [options]
```

It is TypeScript that Node runs directly, so it needs Node 22.18 or newer,
and `sharp`. sharp is found from the current directory or the skill's own
`scripts/`; if neither has it, the script prints the one command that
installs it there (`npm install --prefix <skill-dir>/scripts`). Every option
is listed with `--help`.

### Pick the size

Columns = width ÷ cell width (4 px by default). More columns show more
detail but make more text: keep columns × rows under about 40,000 for
anything going on a web page.

- a standalone page: 400–1000 px wide, which is 100–250 columns
- a figure in a text column: 672 px
- a side vine down a margin: about 150 px
- a bold grid where every glyph reads on its own: fewer, bigger cells, with
  `--columns` and `--width` together, e.g. `--columns 80 --width 480` for
  cells 6 px wide. The cells keep their shape.

### Grid or not

The grid is on by default: the previews and `index.html` draw the cells as
faint lines under the glyphs, and `index.html` has a switch to hide them.
Convert with `--no-grid` when the user asks for no grid ("without the grid",
グリッドなし, マス目なし, plain), or when the drawing is a decoration on a
page, as the garland is. The grid only changes how the drawing is shown:
the glyphs, `ascii.txt` and `drawing.ts` are the same either way.

### What it writes

Into `outDir`:

- `preview.png`: the source, the drawing on a light page and on a dark page,
  stacked (side by side for a tall drawing). Look at this one first.
- `light.png`, `dark.png`: the drawing alone on each page. Crop these to
  judge small details; the preview is scaled down.
- `index.html`: the drawing as selectable text, standalone, following the
  system theme, with grid and light/dark switches.
- `ascii.txt`: the glyphs alone, for a README, a code comment or a terminal.
- `drawing.ts`: an `AsciiDrawing` for [assets/AsciiArt.tsx](assets/AsciiArt.tsx)
  (or for unvalley.me, see step 5), with the command that made it in its
  header.
- `ascii.json`: the rows, colour keys, palette and grid setting, for other
  uses.
- `flowers.png`, when `--sparkle-hue` found flower colours: those cells in
  colour and the rest pale.

It prints a one-line JSON report: the ink mode it chose, columns, rows,
glyph count, accent cells and their palette entries, colours, `flowerKeys`,
the lowest contrast of the palette on each page, and warnings when the
background looks counted as ink, the drawing is almost empty, or a colour
barely shows.

## 4. Judge the preview and adjust

Read `preview.png` every time before showing anything, and compare it with
the source: can you tell what the subject is, is the background empty, and
does it read on both pages? Then adjust; one or two rounds are usual. To
compare two settings on the same image, add `--score` to both runs: the
report gains `fidelity`, how closely the light page follows the source's
tone and detail inside the drawing (correlations, 1 at best). Use it beside
your own eye, not instead of it.

| What you see | Change |
| --- | --- |
| The background is drawn as glyphs | `--ink paper` or `background`, a higher `--ink-threshold`, or cut the subject out |
| Pale petals or highlights are missing | `--ink chroma`, `--fill` |
| Speckle of single glyphs around the subject | raise `--coverage` (0.25–0.3) |
| Thin parts break up | lower `--coverage` (0.12), or more columns |
| Too many slashes, looks scratchy | `--edges 0.95`, a higher `--edge-coherence` (0.4), or `--no-edges` |
| A big shape of one colour is an even texture (a body, a pale rose) | `--local 0.5`–`1`, so its modelling shows |
| Too dense and heavy for a light, airy look | `--darkness lightness` (the garland's rule: pale colours get sparse glyphs) |
| A colour that differs from the page in hue but not lightness is faint (a red on navy, an orange on cream) | on a background colour already counts; on white paper, `--ink background` counts it too (it also moves the ink's edge a little, so compare) |
| Stems read as blobs | `--edges 0.85` |
| A small vivid detail came out brown or grey, or is missing | `--accent-hue <range>` measured with `hues.mts`; lower `--accent` (0.08) if it is only a few dabs |
| Petals or leaves turned the accent's colour | the `--accent-hue` range is too wide: narrow it away from their hues |
| A full-bleed drawing has no line glyphs | expected: with `--ink all` every cell is fully covered, and lines go only on thin parts |
| Colours look muddy | more `--colours` (16–24), or `--seed "#hex"` to give a colour its own entry |
| Pale parts are tiny dots that vanish on a white page | `--ramp "::+*ox%#@"`, so the palest cells get `:` |
| A colour barely shows on one page | raise `--min-contrast` (default 1.8; 2–2.5 for very pale or very dark subjects) |
| The accent should be redder, bluer, … | `--hue-map` its range onto the hue you want |
| Wrong way round, or should face the other way | `--flop` |
| The user wants other flower colours | `--hue-map 225-350:196-206` (violets to sky blue), or `--recolour garland` for the garland's own recolouring |

For a drawing made from your own SVG, fix in the SVG what the SVG got wrong
(references/drawing-a-subject.md) before reaching for these.

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

## 5. Deliver

In the reply, say in a line or two how the drawing was made, so the user
can ask for changes: its columns and width, the ink mode the report shows,
grid on or off, and each option you added and why (for a hue range, that
you measured it with `hues.mts` and what it covers).

**Standalone.** Send `preview.png` (or `light.png`) so the user sees it at
once, and point to `index.html`, which is the real thing: text that can be
selected and copied, sized to its box, light and dark, grid on or off. Give
it a `--title` (and `--lang ja` for a Japanese page); otherwise its title
comes from `--name` or the file name. Mention `ascii.txt` when the user
wants to paste the drawing somewhere.

**In a React site.** Copy [assets/AsciiArt.tsx](assets/AsciiArt.tsx) beside
`drawing.ts` and render `<AsciiArt name="<unique-name>" drawing={...} />`:
`grid` for the grid, `theme="class"` when the site marks dark mode with a
`dark` class, and `label` when the drawing is content rather than
decoration. The name scopes its colour variables, so each drawing on a page
needs its own.

**On unvalley.me.** Read [references/unvalley-me.md](references/unvalley-me.md):
the site has its own `AsciiArt` and type, sparkles over flowers, colour
schemes, and the garland's preset.
