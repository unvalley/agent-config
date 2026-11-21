#!/usr/bin/env node
// Turns an image (PNG, JPEG, WebP, SVG, ...) into coloured ASCII art on a
// grid of cells, the way the unvalley.me flower garland was made: the image
// is cut into cells of 4 × 6.5 CSS pixels, a cell with enough ink gets a
// glyph from a density ramp by how dark it is, or a line glyph (/ \ | - _)
// when a strong edge runs through it, and a colour from a small k-means
// palette with a [light page, dark page] pair. The cells can be shown as a
// grid of thin lines under the glyphs (the default) or not (--no-grid), and
// drawn in blocks (--blocks): a tile of each cell's colour under its glyph,
// as the garland and the sky on unvalley.me are drawn.
//
//   node convert.mts <image> <outDir> [options]     (--help lists them)
//
// Writes to outDir: ascii.json, ascii.txt (plain text), index.html
// (standalone, selectable text), drawing.ts (an AsciiDrawing module),
// light.png, dark.png and preview.png (source, light and dark stacked, for
// judging the result).
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { hex, hueOf, isVivid, loadSharp } from "./lib.mts";

type RGB = number[];
type Page = "light" | "dark";
type Region = { left: number; top: number; width: number; height: number };
type Sample = { rgb: RGB; u: number; v: number; opaque: boolean };
type Named = { j: number; n: number; colour: RGB };
type Cell = {
  r: number;
  c: number;
  coverage: number;
  colour: RGB;
  dark: number;
  strength: number;
  coherence: number;
  edge: number;
  my: number;
  vivid: RGB | null;
  named: Named | null;
  bin?: number;
  accent?: boolean;
  glyph: string;
  xc: number[];
  k: number;
};

// ---------------------------------------------------------------- options
const PRESETS: Record<string, Record<string, string>> = {
  // Exactly the settings the garland on unvalley.me was made with.
  garland: {
    width: "1000",
    cell: "4x6.5",
    colours: "12",
    edges: "0.9",
    ink: "paper",
    recolour: "garland",
    "sparkle-hue": "180-225",
    "min-contrast": "0",
    accent: "0",
    "palette-space": "rgb",
    "edge-coherence": "0",
    grid: "false",
    darkness: "lightness",
  },
};
const DEFAULTS = {
  width: "672",
  cell: "4x6.5",
  ramp: ".:+*ox%#@",
  colours: "12",
  edges: "0.9",
  coverage: "0.17",
  ink: "auto",
  "ink-threshold": "0.1",
  recolour: "none",
  "sparkle-hue": "none",
  "sparkle-sat": "0.2",
  "min-contrast": "1.8",
  accent: "0.15",
  "type-from": "./AsciiArt",
  weight: "bold",
  "palette-space": "oklab",
  "edge-coherence": "0.25",
  local: "0",
  darkness: "paint",
  grid: "true",
  "block-gap": "1",
  "block-shade": "14,42",
};
const HELP = `Usage: node convert.mts <image> <outDir> [options]

Size
  --width <px>          Width of the drawing in CSS px (default 672). Columns = width / cell width.
  --columns <n>         Or give the number of columns directly. With --width too, the cells are
                        width / columns wide and keep the --cell shape (big cells for a bold grid).
  --cell <w>x<h>        Cell size in CSS px (default 4x6.5, the garland's: Menlo at 6.67px, line height 0.975).
Glyphs
  --ramp <chars>        Density ramp, lightest to darkest (default ".:+*ox%#@").
  --edges <q>           Quantile of edge strength above which a thin cell becomes / \\ | - _ (default 0.9).
  --no-edges            Only density glyphs.
  --edge-coherence <c>  Least coherence (0–1) of an edge for a line glyph (default 0.25), so
                        texture does not turn into stray slashes.
  --coverage <f>        Share of a cell that must be ink to draw it (default 0.17).
  --local <k>           Local contrast, 0 (default) to about 1: darker and lighter than the cells
                        around it count for more, so a big shape of one colour shows its modelling.
What counts as ink
  --ink <mode>          auto | paper | chroma | alpha | background | all (default auto).
                        paper: darker or more colourful than white paper (the garland's rule).
                        chroma: anything not near-white and grey, for pale petals on white.
                        alpha: opaque pixels of a transparent cut-out.
                        background: differs from the border's colour (plain dark or coloured backgrounds).
                        all: every pixel (full-bleed photos and paintings).
  --darkness <rule>     paint | lightness (default paint): how dark a cell on white paper or a
                        cut-out is. paint: its colour's distance from white, colourfulness counted
                        twice, so bright yellows and pinks get dense glyphs. lightness: the
                        garland's rule, lightness alone.
  --ink-threshold <f>   Colour distance from the background for --ink background (default 0.1).
  --fill                Count pale areas enclosed by ink as ink (highlights inside petals).
  --flop                Mirror left to right.
Colour
  --colours <k>         Palette size before unused colours drop (default 12).
  --palette-space <s>   oklab | rgb (default oklab): where the palette's k-means measures distance.
  --seed <#hex,...>     Extra palette seeds, to keep a small accent (e.g. flower centres) apart.
  --accent <share>      A cell takes the colour of its vivid pixels when they are at least this share
                        of its ink and differ in hue from the rest, e.g. poppies in grass, a red
                        dot on a black body; such colours also get their own palette entries
                        (default 0.15; 0 = plain averages, as the garland).
  --accent-hue <a-b>    Name an accent by its hue range, e.g. 345-25 for poppies among grass: a cell
                        where pixels of that hue are at least --accent of its ink takes their colour
                        and a palette entry of their own. Repeatable, comma separated.
  --recolour <mode>     none | garland (violets to sky blue, fresher leaves) (default none).
  --hue-map <a-b:c-d>   Map hues a..b onto c..d, e.g. 225-350:196-206. Repeatable, comma separated.
  --min-contrast <r>    Darken light-page colours / lighten dark-page colours to at least this
                        contrast with the page (default 1.8, the garland's own lowest; 0 keeps them as sampled).
  --sparkle-hue <a-b>   Hue range of the palette colours that are flowers, for the site's sparkles
                        (default none).
  --sparkle-sat <f>     Least saturation of a flower colour (default 0.2).
Output
  --no-grid             Draw the glyphs alone. By default the previews and index.html show the cells
                        as a grid of thin lines under the glyphs, and index.html has a switch for it.
  --blocks              Draw in blocks, as the garland and the sky on unvalley.me are: each cell with
                        a density glyph gets a tile of its own colour under the glyph, paler under a
                        light glyph and stronger under a dense one, with a gap along its top and
                        left; line glyphs keep no tile. Cells default to 5x8.125 and the grid to
                        off; index.html gets a switch for the blocks.
  --block-gap <px>      Gap along a tile's top and left, in CSS px (default 1).
  --block-shade <a,b>   How much of its cell's colour a tile takes, in %, under the lightest glyph
                        and under the densest (default 14,42, the garland's).
  --name <ident>        Export name in drawing.ts (default from the file name).
  --title <text>        Title and label of index.html (default from the file name).
  --lang <code>         Language of index.html, e.g. ja (default en).
  --type-from <path>    Where drawing.ts imports AsciiDrawing from (default ./AsciiArt, the skill's
                        assets/AsciiArt.tsx copied beside it; ./flowerVineArt on unvalley.me).
  --weight <w>          Font weight of the previews (default bold, as on the site).
  --score               Add "fidelity" to the report: how closely the light page follows the source
                        inside the drawing (tone and detail, correlations up to 1), to compare settings.
  --preset garland      The garland's exact settings; later options still override.
`;

const { values: given, positionals } = parseArgs({
  allowPositionals: true,
  allowNegative: true,
  options: {
    width: { type: "string" },
    columns: { type: "string" },
    cell: { type: "string" },
    ramp: { type: "string" },
    edges: { type: "string" },
    "no-edges": { type: "boolean" },
    "edge-coherence": { type: "string" },
    "palette-space": { type: "string" },
    coverage: { type: "string" },
    local: { type: "string" },
    darkness: { type: "string" },
    score: { type: "boolean" },
    ink: { type: "string" },
    "ink-threshold": { type: "string" },
    fill: { type: "boolean" },
    flop: { type: "boolean" },
    colours: { type: "string" },
    accent: { type: "string" },
    "accent-hue": { type: "string", multiple: true },
    seed: { type: "string" },
    recolour: { type: "string" },
    "hue-map": { type: "string", multiple: true },
    "min-contrast": { type: "string" },
    "sparkle-hue": { type: "string" },
    "sparkle-sat": { type: "string" },
    name: { type: "string" },
    title: { type: "string" },
    lang: { type: "string" },
    "type-from": { type: "string" },
    weight: { type: "string" },
    grid: { type: "boolean" },
    blocks: { type: "boolean" },
    "block-gap": { type: "string" },
    "block-shade": { type: "string" },
    preset: { type: "string" },
    help: { type: "boolean", short: "h" },
  },
});
if (given.help || positionals.length < 2) {
  console.log(HELP);
  process.exit(given.help ? 0 : 1);
}
if (given.preset && !PRESETS[given.preset]) {
  console.error(`Unknown preset "${given.preset}". Known: ${Object.keys(PRESETS).join(", ")}`);
  process.exit(1);
}
const opt = { ...DEFAULTS, ...(given.preset ? PRESETS[given.preset] : {}), ...given };
const BLOCKS = Boolean(opt.blocks);
// Blocks show the cells themselves, so the grid is off with them unless asked for.
const GRID = given.grid ?? (BLOCKS ? false : String(opt.grid) !== "false");
const sharp = loadSharp();
const [input, outDir] = positionals;
function fail(message: string): never {
  console.error(message);
  process.exit(1);
}
if (!existsSync(input)) fail(`No such image: ${input}`);

// Blocks need room for a gap and a tile: the garland in blocks has cells of
// 5 × 8.125, the shape of its usual 4 × 6.5.
const CELL = given.cell ?? (BLOCKS ? "5x8.125" : opt.cell);
const [CELL_W0, CELL_H0] = CELL.split("x").map(Number);
if (!(CELL_W0 > 0 && CELL_H0 > 0)) fail(`--cell must look like 4x6.5, not "${CELL}"`);
// --columns with --width: the cells grow or shrink to fit, keeping their shape.
const sized = given.columns !== undefined && given.width !== undefined;
const COLS = opt.columns ? Math.round(Number(opt.columns)) : Math.round(Number(opt.width) / CELL_W0);
const CELL_W = sized ? +(Number(opt.width) / COLS).toFixed(4) : CELL_W0;
const CELL_H = sized ? +((CELL_W * CELL_H0) / CELL_W0).toFixed(4) : CELL_H0;
const WIDTH = opt.columns ? COLS * CELL_W : Number(opt.width);
if (!(WIDTH > 0)) fail(`--width must be a number of px, not "${opt.width}"`);
if (!(COLS >= 4)) fail("The drawing needs at least 4 columns.");
const SX = 4;
const SY = 6;
const RAMP = opt.ramp;
if (RAMP.length < 2) fail("--ramp needs at least two glyphs.");
const BLOCK_GAP = Number(opt["block-gap"]);
if (!(BLOCK_GAP >= 0 && BLOCK_GAP < Math.min(CELL_W, CELL_H)))
  fail(`--block-gap is a number of px smaller than a cell, not "${opt["block-gap"]}"`);
const BLOCK_SHADE = opt["block-shade"].split(",").map(Number);
if (BLOCK_SHADE.length !== 2 || !BLOCK_SHADE.every((v) => v >= 0 && v <= 100))
  fail(`--block-shade is two percentages such as 14,42, not "${opt["block-shade"]}"`);
/** How much of its colour a cell's tile takes, in %, or null for no tile (a line glyph, a space). */
const tileShare = (glyph: string) => {
  const i = RAMP.indexOf(glyph);
  if (glyph === " " || i < 0) return null;
  return Math.round(BLOCK_SHADE[0] + ((BLOCK_SHADE[1] - BLOCK_SHADE[0]) * i) / (RAMP.length - 1));
};
const K = Math.round(Number(opt.colours));
const SEEDS = opt.seed ? opt.seed.split(",").map((h) => rgbOf(h.trim())) : [];
if (!(K >= 1) || K + SEEDS.length > 52) fail("--colours plus seeds must be between 1 and 52.");
const EDGE_Q = Number(opt.edges);
const COVERAGE = Number(opt.coverage);
const MIN_CONTRAST = Number(opt["min-contrast"]);
if (!["oklab", "rgb"].includes(opt["palette-space"]))
  fail(`--palette-space is oklab or rgb, not "${opt["palette-space"]}"`);
const EDGE_COH = Number(opt["edge-coherence"]);
const ACCENT_HUES = (opt["accent-hue"] ?? [])
  .flatMap((m) => m.split(","))
  .filter(Boolean)
  .map((m) => {
    const x = /^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/.exec(m.trim());
    if (!x) fail(`--accent-hue takes a-b, not "${m}"`);
    return [Number(x[1]), Number(x[2])];
  });
const ACCENT = Number(opt.accent) || (ACCENT_HUES.length ? 0.15 : 0);
const DARKNESS = opt.darkness;
if (!["paint", "lightness"].includes(DARKNESS)) fail(`--darkness is paint or lightness, not "${DARKNESS}"`);
const PAPER: RGB = [255, 255, 255];

// ---------------------------------------------------------------- colour
function rgbOf(h: string): RGB {
  const m = /^#?([0-9a-f]{6})$/i.exec(h);
  if (!m) fail(`Not a #rrggbb colour: "${h}"`);
  return [0, 2, 4].map((i) => Number.parseInt(m[1].slice(i, i + 2), 16));
}
function rgbToHsl([r, g, b]: RGB): number[] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}
function hslToRgb([h, s, l]: number[]): RGB {
  h /= 360;
  if (s === 0) return [l, l, l].map((v) => Math.round(v * 255));
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map((v) => Math.round(v * 255));
}
const lum = ([r, g, b]: RGB) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
const chroma = (c: RGB) => Math.max(...c) - Math.min(...c);
// OKLab (Björn Ottosson), for perceptual distances.
const toLin = (v: number) => {
  v /= 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const fromLin = (v: number) => Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055));
function oklab([r, g, b]: RGB): number[] {
  const R = toLin(r);
  const G = toLin(g);
  const B = toLin(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
function fromOklab([L, a, b]: number[]): RGB {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((v) => Math.max(0, Math.min(255, fromLin(Math.max(0, v)))));
}
// How much ink a colour is on a page or ground: its OKLab distance from it,
// with colourfulness counted twice, since a vivid orange reads as more ink
// than a grey of the same lightness.
const CHROMA_WEIGHT = 2;
const inkAmount = (rgb: RGB, ref: RGB) => {
  const p = oklab(rgb);
  const q = oklab(ref);
  return Math.hypot(p[0] - q[0], CHROMA_WEIGHT * Math.hypot(p[1] - q[1], p[2] - q[2]));
};

const hueMaps = (opt["hue-map"] ?? [])
  .flatMap((m) => m.split(","))
  .filter(Boolean)
  .map((m) => {
    const x = /^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/.exec(m.trim());
    if (!x) fail(`--hue-map takes a-b:c-d, not "${m}"`);
    return x.slice(1).map(Number);
  });
const inRange = (h: number, a: number, b: number) => (a <= b ? h >= a && h <= b : h >= a || h <= b);
const span = (a: number, b: number) => (b - a + 360) % 360 || 360;

/** The recolouring of the source, before shading and palette. */
function recolour(rgb: RGB): RGB {
  if (opt.recolour === "garland") {
    // Violets and mauves become sky blue; leaves get a little fresher.
    const [h, s, l] = rgbToHsl(rgb);
    if (h >= 225 && h <= 350 && s > 0.1) {
      const t = (h - 225) / 125;
      return hslToRgb([196 + t * 10, Math.min(1, s * 1.3 + 0.2), Math.min(0.86, l + 0.1)]);
    }
    if (h >= 50 && h <= 140 && s > 0.08)
      return hslToRgb([Math.min(140, h + 14), Math.min(1, s * 1.2 + 0.05), l]);
    return rgb;
  }
  if (opt.recolour !== "none") fail(`--recolour is none or garland, not "${opt.recolour}"`);
  if (!hueMaps.length) return rgb;
  const [h, s, l] = rgbToHsl(rgb);
  if (s <= 0.1) return rgb;
  for (const [a, b, c, d] of hueMaps) {
    if (!inRange(h, a, b)) continue;
    const t = ((h - a + 360) % 360) / span(a, b);
    return hslToRgb([(c + t * span(c, d)) % 360, s, l]);
  }
  return rgb;
}
// Thin glyphs need more colour on a light page and more light on a dark one.
const lightVariant = (rgb: RGB) => {
  const [h, s, l] = rgbToHsl(rgb);
  const blue = (h >= 180 && h <= 230) || h >= 300;
  return hslToRgb([h, Math.min(1, s * (blue ? 1.25 : 1.0)), l > 0.55 ? l * 0.8 : l * 0.93]);
};
const darkVariant = (rgb: RGB) => {
  const [h, s, l] = rgbToHsl(rgb);
  return hslToRgb([h, Math.min(1, s * 1.05), Math.min(0.9, l * 1.05 + 0.04)]);
};

// WCAG contrast, for checking the palette against the page.
const PAGE: Record<Page, RGB> = { light: [255, 255, 255], dark: [10, 10, 10] };
const linear = (v: number) => {
  v /= 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const relLum = ([r, g, b]: RGB) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
const contrast = (a: RGB, b: RGB) => {
  const [x, y] = [relLum(a), relLum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
// Toward black on a light page and toward white on a dark one, so a cream
// turns warm grey rather than mustard (darkening in HSL keeps saturation).
function reach(rgb: RGB, page: Page, target: number): RGB {
  if (!(target > 0) || contrast(rgb, PAGE[page]) >= target) return rgb;
  let out = rgb;
  for (let t = 0.01; t <= 1 && contrast(out, PAGE[page]) < target; t += 0.01)
    out = rgb.map((v) => Math.round(page === "light" ? v * (1 - t) : v + (255 - v) * t));
  return out;
}

// ---------------------------------------------------------------- source
// Upright by EXIF, mirrored if asked, 8-bit sRGB whatever came in. A vector
// image (an SVG drawn for a described subject) is rasterised large enough
// that every cell gets many pixels, whatever size its viewBox has.
const inputMeta = await sharp(input)
  .metadata()
  .catch((error: Error) => fail(`Cannot read ${input} as an image: ${error.message}`));
const density =
  inputMeta.format === "svg" && inputMeta.width
    ? Math.min(72 * 40, Math.max(72, (72 * Math.max(2000, COLS * SX * 4)) / inputMeta.width))
    : undefined;
let base = sharp(input, { limitInputPixels: false, ...(density ? { density } : {}) }).rotate();
if (opt.flop) base = base.flop();
const source = await base
  .toColourspace("srgb")
  .png()
  .toBuffer()
  .catch((error: Error) => fail(`Cannot read ${input} as an image: ${error.message}`));
const meta = await sharp(source).metadata();

// Look at the border to decide what counts as ink when asked to: its
// median colour, how much is transparent, and how much of it is far from
// that colour (a picture that runs off the edge has no dominant colour).
const FULL: Region = { left: 0, top: 0, width: meta.width, height: meta.height };
const distance = (a: RGB, b: RGB) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) / 255 / Math.sqrt(3);
async function borderOf(region: Region, inset = 0) {
  const W0 = 96;
  const H0 = Math.max(8, Math.round((region.height / region.width) * W0));
  const { data } = await sharp(source)
    .ensureAlpha()
    .extract(region)
    .resize(W0, H0, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const px: number[] = [];
  for (let x = inset; x < W0 - inset; x++) px.push(inset * W0 + x, (H0 - 1 - inset) * W0 + x);
  for (let y = inset + 1; y < H0 - 1 - inset; y++) px.push(y * W0 + inset, y * W0 + W0 - 1 - inset);
  const rgba = px.map((i) => [data[i * 4], data[i * 4 + 1], data[i * 4 + 2], data[i * 4 + 3]]);
  const at = px.map((i) => [((i % W0) + 0.5) / W0, (Math.floor(i / W0) + 0.5) / H0]);
  const transparent = rgba.filter((p) => p[3] < 250).length / rgba.length;
  const opaque = rgba.filter((p) => p[3] >= 250);
  const median = (k: number) => {
    const v = opaque.map((p) => p[k]).sort((a, b) => a - b);
    return v.length ? v[Math.floor(v.length / 2)] : 255;
  };
  const colour = [median(0), median(1), median(2)];
  const far = (d: number) => opaque.filter((p) => distance(p, colour) > d).length / Math.max(1, opaque.length);
  const samples: Sample[] = rgba.map((p, k) => ({ rgb: p.slice(0, 3), u: at[k][0], v: at[k][1], opaque: p[3] >= 250 }));
  return { transparent, colour, far: far(0.12), uneven: far(0.07), samples: samples.filter((q) => q.opaque) };
}
// A frame or mat: a thin margin of one colour on all four sides, and a
// plain ground of another colour just inside it. The picture is inside.
const frame = await (async () => {
  if (opt.ink !== "auto") return null;
  const t = await sharp(source)
    .flatten({ background: "#ffffff" })
    .trim({ threshold: 18 })
    .toBuffer({ resolveWithObject: true })
    .catch(() => null);
  if (!t) return null;
  const inner: Region = {
    left: -(t.info.trimOffsetLeft ?? 0),
    top: -(t.info.trimOffsetTop ?? 0),
    width: t.info.width,
    height: t.info.height,
  };
  const margins = [
    inner.left / meta.width,
    inner.top / meta.height,
    (meta.width - inner.left - inner.width) / meta.width,
    (meta.height - inner.top - inner.height) / meta.height,
  ];
  if (!margins.every((m) => m > 0 && m <= 0.1)) return null;
  const { data: corner } = await sharp(source)
    .flatten({ background: "#ffffff" })
    .extract({ left: 0, top: 0, width: 1, height: 1 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const ring = await borderOf(inner, 1);
  return distance([corner[0], corner[1], corner[2]], ring.colour) > 0.12 && ring.uneven < 0.5 ? inner : null;
})();
const region = frame ?? FULL;
// A ring a little inside the edge: scans and prints often have a pale margin
// or a dark edge right at the border that is not the ground.
const border = await borderOf(region, 3);
// Transparency is judged at the very edge, which a cut-out never fills.
const edgeTransparent = (await borderOf(region, 0)).transparent;
// White paper is not ink by the paper rule; cream, aged or tinted paper is.
const paperIsInk = (c: RGB) => {
  const [, s] = rgbToHsl(c);
  return 1 - lum(c) > 0.1 || (s > 0.25 && 1 - lum(c) > 0.04);
};
let INK: string = opt.ink;
if (INK === "auto") {
  if (meta.hasAlpha && edgeTransparent > 0.5) INK = "alpha";
  else if (border.far > 0.8) INK = "all";
  else if (lum(border.colour) >= 0.85 && !paperIsInk(border.colour)) INK = "paper";
  else INK = "background";
}
if (!["paper", "chroma", "alpha", "background", "all"].includes(INK))
  fail(`--ink is auto, paper, chroma, alpha, background or all, not "${opt.ink}"`);

// A plain ground is often not one colour: a woodblock's bokashi fades top to
// bottom, a studio backdrop has a vignette. The ground is a smooth surface
// over the picture (1, u, v, uv, u², v²), fitted to the border by least
// squares, refitted without the border samples it does not match, which are
// where the subject runs off the edge.
const ground = (() => {
  if (INK !== "background" || border.samples.length < 12) return null;
  const basis = (u: number, v: number) => [1, u, v, u * v, u * u, v * v];
  const fit = (pts: Sample[]) => {
    const n = 6;
    const ata = Array.from({ length: n }, () => new Float64Array(n));
    const atb = [0, 1, 2].map(() => new Float64Array(n));
    for (const q of pts) {
      const b = basis(q.u, q.v);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) ata[i][j] += b[i] * b[j];
        for (let c = 0; c < 3; c++) atb[c][i] += b[i] * q.rgb[c];
      }
    }
    for (let i = 0; i < n; i++) ata[i][i] += 1e-6;
    return atb.map((rhs) => {
      const m = ata.map((row, i) => [...row, rhs[i]]);
      for (let i = 0; i < n; i++) {
        let piv = i;
        for (let r = i + 1; r < n; r++) if (Math.abs(m[r][i]) > Math.abs(m[piv][i])) piv = r;
        [m[i], m[piv]] = [m[piv], m[i]];
        for (let r = 0; r < n; r++) {
          if (r === i || !m[i][i]) continue;
          const f = m[r][i] / m[i][i];
          for (let k = i; k <= n; k++) m[r][k] -= f * m[i][k];
        }
      }
      return m.map((row, i) => (row[i] ? row[n] / row[i] : 0));
    });
  };
  const evalAt = (coef: number[][], u: number, v: number) => {
    const b = basis(u, v);
    return coef.map((c) => Math.max(0, Math.min(255, c.reduce((t, w, i) => t + w * b[i], 0))));
  };
  let inliers = border.samples.filter((q) => distance(q.rgb, border.colour) <= 0.15);
  if (inliers.length < 12) return null;
  let coef = fit(inliers);
  for (let iter = 0; iter < 4; iter++) {
    const next = border.samples.filter((q) => distance(q.rgb, evalAt(coef, q.u, q.v)) <= 0.1);
    if (next.length < 12) break;
    inliers = next;
    coef = fit(inliers);
  }
  return {
    at: (u: number, v: number) => evalAt(coef, Math.max(0, Math.min(1, u)), Math.max(0, Math.min(1, v))),
    matched: inliers.length / border.samples.length,
  };
})();

// A sky, a sea or a landscape can have one colour over most of its border
// and still no ground: the picture is the subject. When auto chose
// background but the fitted ground matches little of the border and would
// leave half the picture or more as ink, the picture is drawn whole
// instead. Two painted skies matched 58-62% of their border and left 57-59%
// as ink; a woodblock on a graded orange ground matches about as little of
// its border (60%) but leaves only 41% as ink.
if (opt.ink === "auto" && INK === "background" && ground && ground.matched < 0.65) {
  const W1 = 64;
  const H1 = Math.max(8, Math.round((region.height / region.width) * W1));
  const { data: low } = await sharp(source)
    .flatten({ background: "#ffffff" })
    .extract(region)
    .resize(W1, H1, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let inked = 0;
  for (let y = 0; y < H1; y++)
    for (let x = 0; x < W1; x++) {
      const i = (y * W1 + x) * 3;
      const [r, g, b] = ground.at((x + 0.5) / W1, (y + 0.5) / H1);
      const d = Math.sqrt(0.3 * (low[i] - r) ** 2 + 0.59 * (low[i + 1] - g) ** 2 + 0.11 * (low[i + 2] - b) ** 2) / 255;
      if (d > Number(opt["ink-threshold"])) inked++;
    }
  if (inked / (W1 * H1) > 0.5) INK = "all";
}

// The box to draw: the picture (inside any frame) trimmed to its ink, with a
// small margin.
async function boxOf(): Promise<Region> {
  if (INK === "all") return region;
  const framed = region !== FULL;
  let pipeline = INK === "alpha" ? sharp(source) : sharp(source).flatten({ background: "#ffffff" });
  if (framed) pipeline = sharp(await pipeline.extract(region).png().toBuffer());
  const trimmed = await pipeline
    .trim({ threshold: 18 })
    .toBuffer({ resolveWithObject: true })
    .catch(() => null);
  if (!trimmed) return region;
  const left = region.left - (trimmed.info.trimOffsetLeft ?? 0);
  const top = region.top - (trimmed.info.trimOffsetTop ?? 0);
  const margin = 3;
  const x0 = Math.max(region.left, left - margin);
  const y0 = Math.max(region.top, top - margin);
  return {
    left: x0,
    top: y0,
    width: Math.min(region.left + region.width - x0, trimmed.info.width + (left - x0) + margin),
    height: Math.min(region.top + region.height - y0, trimmed.info.height + (top - y0) + margin),
  };
}
const box = await boxOf();
const ROWS = Math.max(1, Math.round((box.height * (WIDTH / box.width)) / CELL_H));
const SW = COLS * SX;
const SH = ROWS * SY;
const { data } = await sharp(source)
  .flatten({ background: "#ffffff" })
  .extract(box)
  .resize(SW, SH, { fit: "fill", kernel: "lanczos3" })
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const alpha =
  INK === "alpha"
    ? await sharp(source)
        .ensureAlpha()
        .extract(box)
        .resize(SW, SH, { fit: "fill", kernel: "lanczos3" })
        .extractChannel(3)
        .raw()
        .toBuffer()
    : null;
// Vivid accents are found on the source's own pixels (nearest, up to 4× the
// cell grid), so a small dab of red is not blurred into the grass first.
const AF = ACCENT > 0 || ACCENT_HUES.length ? Math.max(1, Math.min(4, Math.round(box.width / SW))) : 0;
const vividBuf = AF
  ? await sharp(source)
      .flatten({ background: "#ffffff" })
      .extract(box)
      .resize(SW * AF, SH * AF, { fit: "fill", kernel: "nearest" })
      .removeAlpha()
      .raw()
      .toBuffer()
  : null;
const px = (x: number, y: number): RGB => {
  const i = (Math.min(SH - 1, Math.max(0, y)) * SW + Math.min(SW - 1, Math.max(0, x))) * 3;
  return [data[i], data[i + 1], data[i + 2]];
};
const L = new Float32Array(SW * SH);
for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) L[y * SW + x] = lum(px(x, y));
const Lat = (x: number, y: number) => L[Math.min(SH - 1, Math.max(0, y)) * SW + Math.min(SW - 1, Math.max(0, x))];

// Where a sample (x, y) of the grid lies in the region the ground was fitted over.
const groundAt = (x: number, y: number): RGB =>
  ground
    ? ground.at(
        (box.left + ((x + 0.5) / SW) * box.width - region.left) / region.width,
        (box.top + ((y + 0.5) / SH) * box.height - region.top) / region.height,
      )
    : border.colour;
const rawInk = (x: number, y: number) => {
  const c = px(x, y);
  switch (INK) {
    case "paper":
      return paperIsInk(c);
    case "chroma":
      return lum(c) < 0.955 || chroma(c) >= 9;
    case "alpha":
      return alpha![y * SW + x] >= 128;
    case "background": {
      const [r, g, b] = groundAt(x, y);
      const d = Math.sqrt(0.3 * (c[0] - r) ** 2 + 0.59 * (c[1] - g) ** 2 + 0.11 * (c[2] - b) ** 2) / 255;
      return d > Number(opt["ink-threshold"]);
    }
    default:
      return true;
  }
};
const inkMask = new Uint8Array(SW * SH);
for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) inkMask[y * SW + x] = rawInk(x, y) ? 1 : 0;
if (opt.fill && INK !== "all") {
  // Paper is what can be reached from the border without crossing ink; any
  // other pale pixel is a highlight inside a shape, so it counts as ink.
  const paper = new Uint8Array(SW * SH);
  const stack: number[] = [];
  for (let x = 0; x < SW; x++) stack.push(x, (SH - 1) * SW + x);
  for (let y = 0; y < SH; y++) stack.push(y * SW, y * SW + SW - 1);
  while (stack.length) {
    const i = stack.pop()!;
    if (paper[i] || inkMask[i]) continue;
    paper[i] = 1;
    const x = i % SW;
    const y = (i - x) / SW;
    if (x > 0) stack.push(i - 1);
    if (x < SW - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - SW);
    if (y < SH - 1) stack.push(i + SW);
  }
  for (let i = 0; i < SW * SH; i++) if (!paper[i]) inkMask[i] = 1;
}
const isInk = (x: number, y: number) => inkMask[y * SW + x] === 1;

// ---------------------------------------------------------------- cells
const cells: (Cell | null)[] = [];
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    let n = 0;
    const sum = [0, 0, 0];
    let my = 0;
    let jxx = 0;
    let jyy = 0;
    let jxy = 0;
    for (let sy = 0; sy < SY; sy++)
      for (let sx = 0; sx < SX; sx++) {
        const x = c * SX + sx;
        const y = r * SY + sy;
        // Sobel gradients, summed into a structure tensor for the cell.
        const gx =
          Lat(x + 1, y - 1) + 2 * Lat(x + 1, y) + Lat(x + 1, y + 1) -
          Lat(x - 1, y - 1) - 2 * Lat(x - 1, y) - Lat(x - 1, y + 1);
        const gy =
          Lat(x - 1, y + 1) + 2 * Lat(x, y + 1) + Lat(x + 1, y + 1) -
          Lat(x - 1, y - 1) - 2 * Lat(x, y - 1) - Lat(x + 1, y - 1);
        jxx += gx * gx;
        jyy += gy * gy;
        jxy += gx * gy;
        if (!isInk(x, y)) continue;
        n++;
        const p = px(x, y);
        sum[0] += p[0];
        sum[1] += p[1];
        sum[2] += p[2];
        my += sy / (SY - 1) - 0.5;

      }
    const coverage = n / (SX * SY);
    if (coverage < COVERAGE || n === 0) {
      cells.push(null);
      continue;
    }
    const colour = recolour(sum.map((v) => v / n));
    // The cell's vivid pixels, if they are at least --accent of its ink.
    let vivid: RGB | null = null;
    let named: Named | null = null;
    if (vividBuf) {
      let vn = 0;
      const vsum = [0, 0, 0];
      const hn = ACCENT_HUES.map(() => 0);
      const hsum = ACCENT_HUES.map(() => [0, 0, 0]);
      const VW = SW * AF;
      for (let y = r * SY * AF; y < (r + 1) * SY * AF; y++)
        for (let x = c * SX * AF; x < (c + 1) * SX * AF; x++) {
          const i = (y * VW + x) * 3;
          if (!isVivid(vividBuf[i], vividBuf[i + 1], vividBuf[i + 2])) continue;
          vn++;
          vsum[0] += vividBuf[i];
          vsum[1] += vividBuf[i + 1];
          vsum[2] += vividBuf[i + 2];
          if (!ACCENT_HUES.length) continue;
          const h = hueOf(vividBuf[i], vividBuf[i + 1], vividBuf[i + 2]);
          ACCENT_HUES.forEach(([a, b], j) => {
            if (!inRange(h, a, b)) return;
            hn[j]++;
            for (let k = 0; k < 3; k++) hsum[j][k] += vividBuf[i + k];
          });
        }
      const enough = ACCENT * coverage * SX * SY * AF * AF;
      if (vn && vn >= enough) vivid = recolour(vsum.map((v) => v / vn));
      hn.forEach((count, j) => {
        if (count && count >= enough && (!named || count > named.n))
          named = { j, n: count, colour: recolour(hsum[j].map((v) => v / count)) };
      });
    }
    const strength = Math.sqrt((jxx - jyy) ** 2 + 4 * jxy * jxy) / (SX * SY);
    // The gradient's orientation; the edge runs across it.
    const theta = (0.5 * Math.atan2(2 * jxy, jxx - jyy) * 180) / Math.PI;
    // How much paint the cell holds: its colour's distance from the ground in
    // OKLab, colourfulness counted twice, so a bright yellow petal counts as
    // paint although it is light. The garland used lightness alone, which
    // suits its blues and greens but turns yellows and pinks into dots.
    const dark =
      INK === "background"
        ? inkAmount(colour, groundAt((c + 0.5) * SX, (r + 0.5) * SY))
        : DARKNESS === "lightness"
          ? 1 - lum(colour)
          : inkAmount(colour, PAPER);
    // How much the gradients agree on one direction: high along a stem or an
    // outline, low in texture.
    const coherence = jxx + jyy > 0 ? Math.sqrt((jxx - jyy) ** 2 + 4 * jxy * jxy) / (jxx + jyy) : 0;
    cells.push({
      r,
      c,
      coverage,
      colour,
      dark,
      strength,
      coherence,
      edge: theta + 90,
      my: my / n,
      vivid,
      named,
      glyph: "",
      xc: [],
      k: -1,
    });
  }
}
const pts = cells.filter((cell): cell is Cell => cell !== null);
// A vivid hue that stands out from the cells around it and is rare in the
// drawing is an accent: a poppy's red among grass, a red dot on a black
// body, gold stamens. Its cells take the vivid colour (an average would turn
// the poppy brown and the dot grey) and get a palette entry of their own.
// Vivid colours that fill whole areas, like a flower's petals or a
// painting's greens, keep plain averages, as the garland does.
// Hue bins centred on 0°, 30°, …, so red is one bin, not split at 360°.
const binOf = (rgb: RGB) => Math.floor(((rgbToHsl(rgb)[0] + 15) % 360) / 30);
for (const p of pts) if (p.vivid) p.bin = binOf(p.vivid);
const standsOut = (p: Cell) => {
  // Against the cells around it (5 × 5) that are not of its own hue: it is
  // sparse among them, and differs in hue or they are grey.
  const sum = [0, 0, 0];
  let n = 0;
  let same = 0;
  let total = 0;
  for (let r = p.r - 2; r <= p.r + 2; r++)
    for (let c = p.c - 2; c <= p.c + 2; c++) {
      const q = r >= 0 && c >= 0 && r < ROWS && c < COLS ? cells[r * COLS + c] : null;
      if (!q || q === p) continue;
      total++;
      if (q.bin === p.bin) {
        same++;
        continue;
      }
      for (let i = 0; i < 3; i++) sum[i] += q.colour[i];
      n++;
    }
  if (!n || same / total > 0.4) return false;
  const [hn, sn] = rgbToHsl(sum.map((v) => v / n));
  const [hv] = rgbToHsl(p.vivid!);
  const dh = Math.min(Math.abs(hn - hv), 360 - Math.abs(hn - hv));
  return sn < 0.15 || dh > 50;
};
const namedBins = ACCENT_HUES.map((_, j) => pts.filter((p) => p.named?.j === j)).filter((b) => b.length);
for (const bin of namedBins)
  for (const p of bin) {
    p.vivid = p.named!.colour;
    p.bin = -1 - p.named!.j;
  }
const accentBins = ((): Cell[][] => {
  if (!AF) return [];
  const bins = new Map<number | undefined, Cell[]>();
  for (const p of pts) {
    if (!p.vivid || p.named || !standsOut(p)) continue;
    if (!bins.has(p.bin)) bins.set(p.bin, []);
    bins.get(p.bin)!.push(p);
  }
  return [...bins.values()]
    .filter((b) => b.length >= 3 && b.length <= pts.length * 0.04)
    .sort((a, b) => b.length - a.length)
    .slice(0, Math.max(0, Math.min(6, 52 - K - SEEDS.length - namedBins.length)));
})();
accentBins.unshift(...namedBins.slice(0, Math.max(0, 52 - K - SEEDS.length)));
for (const bin of accentBins)
  for (const p of bin) {
    p.colour = p.vivid!;
    p.accent = true;
  }
if (!pts.length)
  fail(
    `Nothing to draw: no cell had ink (--ink ${INK}). Try --ink all, --ink chroma, a lower --coverage, or more --width.`,
  );

// --local: each cell's darkness is pushed away from the mean of the ink
// cells around it (a Gaussian of about three cells across, rows weighted by
// the cell's shape), so the modelling inside a big shape of one colour (an
// octopus's body, a pale rose) shows instead of an even texture.
const LOCAL = Number(opt.local);
if (!(LOCAL >= 0)) fail(`--local takes a number from 0 (off) to about 1, not "${opt.local}"`);
const LOCAL_R = 3;
if (LOCAL > 0) {
  const R = Math.ceil(LOCAL_R * 2);
  const w = (dr: number, dc: number) => Math.exp(-(dr * dr + dc * dc * (CELL_W / CELL_H) ** 2) / (2 * LOCAL_R * LOCAL_R));
  const means = pts.map((p) => {
    let sw = 0;
    let sd = 0;
    for (let r = p.r - R; r <= p.r + R; r++)
      for (let c = p.c - R; c <= p.c + R; c++) {
        const q = r >= 0 && c >= 0 && r < ROWS && c < COLS ? cells[r * COLS + c] : null;
        if (!q) continue;
        const k = w(r - p.r, c - p.c);
        sw += k;
        sd += k * q.dark;
      }
    return sd / sw;
  });
  pts.forEach((p, i) => {
    p.dark = p.dark + LOCAL * (p.dark - means[i]);
  });
}
// Darkness is spread over the ramp from the drawing's palest cells (5th
// percentile) to its darkest (97th), so every drawing uses the whole ramp.
const darks = pts.map((c) => c.dark).sort((a, b) => a - b);
const q = (p: number) => darks[Math.floor(p * (darks.length - 1))];
// The palest glyph is for faint paint. On white paper or a cut-out, when
// even the palest cells hold a lot of paint (a sunflower's yellow petals),
// the ramp starts at 0.1 instead, so they are not drawn as dots. On a
// coloured or dark ground every cell is far from the ground, and starting
// low would make the whole subject one dense block, so the ramp stretches
// from the palest cells there, as it does with the garland's lightness rule.
const lo = DARKNESS === "lightness" || INK === "background" ? q(0.05) : Math.min(q(0.05), 0.1);
const hi = q(0.97);
const strengths = pts.map((c) => c.strength).sort((a, b) => a - b);
const EDGE = strengths[Math.floor(EDGE_Q * (strengths.length - 1))];
const lineGlyph = (angle: number, my: number) => {
  let a = angle % 180;
  if (a < 0) a += 180;
  if (a < 22.5 || a >= 157.5) return my > 0.15 ? "_" : "-";
  if (a < 67.5) return "\\";
  if (a < 112.5) return "|";
  return "/";
};

let edgeGlyphs = 0;
for (const cell of pts) {
  if (!opt["no-edges"] && cell.strength >= EDGE && cell.coverage < 0.7 && cell.coherence >= EDGE_COH) {
    cell.glyph = lineGlyph(cell.edge, cell.my);
    edgeGlyphs++;
  } else {
    // Cells less than 45% covered stop at the third glyph, so edges stay light.
    const t = Math.max(0, Math.min(1, (cell.dark - lo) / (hi - lo)));
    const i = Math.round(t * (RAMP.length - 1));
    cell.glyph = RAMP[cell.coverage < 0.45 ? Math.min(i, 2) : i];
  }
}

// ---------------------------------------------------------------- palette
// k-means on the cells' colours, seeded along their lightness, plus any
// --seed colours so a small accent keeps its own entry.
let centres: number[][] = [];
let accentKeys = 0;
{
  // Accents keep their own entries: k-means would fold them into the
  // colours around them.
  const own = accentBins;
  const fixed = new Set(own.flat());
  const rest = pts.filter((p) => !fixed.has(p));
  if (rest.length) {
    // In OKLab, distances follow what the eye sees; in RGB (the garland's
    // choice) they are weighted by how bright each channel looks.
    const LAB = opt["palette-space"] === "oklab";
    const at = (rgb: RGB) => (LAB ? oklab(rgb) : rgb);
    for (const p of rest) p.xc = at(p.colour);
    const sorted = [...rest].sort((a, b) => lum(a.colour) - lum(b.colour));
    for (let k = 0; k < K; k++) centres.push([...sorted[Math.floor(((k + 0.5) / K) * sorted.length)].xc]);
    centres.push(...SEEDS.map((s) => at(s)));
    for (let iter = 0; iter < 20; iter++) {
      const acc = centres.map(() => [0, 0, 0, 0]);
      for (const p of rest) {
        let best = 0;
        let bd = Number.POSITIVE_INFINITY;
        centres.forEach((c, k) => {
          const d = LAB
            ? (c[0] - p.xc[0]) ** 2 + (c[1] - p.xc[1]) ** 2 + (c[2] - p.xc[2]) ** 2
            : (c[0] - p.xc[0]) ** 2 * 0.3 + (c[1] - p.xc[1]) ** 2 * 0.59 + (c[2] - p.xc[2]) ** 2 * 0.11;
          if (d < bd) {
            bd = d;
            best = k;
          }
        });
        p.k = best;
        const a = acc[best];
        a[0] += p.xc[0];
        a[1] += p.xc[1];
        a[2] += p.xc[2];
        a[3]++;
      }
      centres = centres.map((c, k) =>
        acc[k][3] ? acc[k].slice(0, 3).map((v) => (LAB ? v / acc[k][3] : Math.round(v / acc[k][3]))) : c,
      );
    }
    if (LAB) centres = centres.map(fromOklab);
  }
  for (const bin of own) {
    const k = centres.length;
    centres.push([0, 1, 2].map((i) => Math.round(bin.reduce((t, p) => t + p.colour[i], 0) / bin.length)));
    for (const p of bin) p.k = k;
  }
  accentKeys = own.length;
}
const KEYS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const used = [...new Set(pts.map((p) => p.k))].sort((a, b) => lum(centres[a]) - lum(centres[b]));
const keyOf = new Map(used.map((k, i) => [k, KEYS[i]]));
const palette: Record<string, string[]> = Object.fromEntries(
  used.map((k, i) => [
    KEYS[i],
    [hex(reach(lightVariant(centres[k]), "light", MIN_CONTRAST)), hex(reach(darkVariant(centres[k]), "dark", MIN_CONTRAST))],
  ]),
);
let flowerKeys = "";
if (opt["sparkle-hue"] !== "none") {
  const m = /^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/.exec(opt["sparkle-hue"]);
  if (!m) fail(`--sparkle-hue takes a-b or none, not "${opt["sparkle-hue"]}"`);
  const [a, b] = [Number(m[1]), Number(m[2])];
  flowerKeys = used
    .filter((k) => {
      const [h, s] = rgbToHsl(centres[k]);
      return inRange(h, a, b) && s > Number(opt["sparkle-sat"]);
    })
    .map((k) => keyOf.get(k))
    .join("");
}

// ---------------------------------------------------------------- rows
let art: string[] = [];
let tone: string[] = [];
for (let r = 0; r < ROWS; r++) {
  let a = "";
  let t = "";
  for (let c = 0; c < COLS; c++) {
    const cell = cells[r * COLS + c];
    a += cell ? cell.glyph : " ";
    t += cell ? keyOf.get(cell.k) : " ";
  }
  art.push(a);
  tone.push(t);
}
// Drop empty rows at the top and bottom; the columns stay, so the width
// in CSS px is what was asked for.
const filled = art.map((row, i) => (row.trim() ? i : -1)).filter((i) => i >= 0);
const firstRow = filled[0];
art = art.slice(filled[0], filled.at(-1)! + 1);
tone = tone.slice(filled[0], filled.at(-1)! + 1);
const rows = art.length;

// ---------------------------------------------------------------- write
mkdirSync(outDir, { recursive: true });
const base0 = path.basename(input).replace(/\.[^.]+$/, "");
const camel = base0
  .replace(/[^A-Za-z0-9]+(.)?/g, (_, ch?: string) => (ch ? ch.toUpperCase() : ""))
  .replace(/^./, (ch) => ch.toLowerCase());
const name = opt.name ?? (/^[A-Za-z_$]/.test(camel) ? camel : `drawing${camel}`);
if (!/^[A-Za-z_$][\w$]*$/.test(name)) fail(`--name must be a JavaScript identifier, not "${name}"`);
const words = (id: string) => id.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase().replace(/^./, (ch) => ch.toUpperCase());
const label = opt.title ?? (opt.name ? words(opt.name) : base0);
const shellQuote = (v: string) => (/^[\w./:=,+-]+$/.test(v) ? v : `'${v.replace(/'/g, "'\\''")}'`);
const argv = Object.entries(given)
  .filter(([k]) => k !== "help")
  .flatMap(([k, v]) =>
    v === true
      ? [`--${k}`]
      : v === false
        ? [`--no-${k}`]
        : (Array.isArray(v) ? v : [v]).flatMap((x) => [`--${k}`, shellQuote(String(x))]),
  )
  .join(" ");
const command = `node convert.mts ${shellQuote(path.basename(input))} <outDir>${argv ? ` ${argv}` : ""}`;

writeFileSync(
  path.join(outDir, "ascii.json"),
  `${JSON.stringify(
    {
      source: path.basename(input),
      command,
      ink: INK,
      width: COLS * CELL_W,
      cellW: CELL_W,
      cellH: CELL_H,
      cols: COLS,
      rows,
      text: art,
      colour: tone,
      palette,
      flowerKeys,
      grid: GRID,
      blocks: BLOCKS ? { gap: BLOCK_GAP, shade: BLOCK_SHADE } : null,
    },
    null,
    1,
  )}\n`,
);
// ascii.txt: the glyphs alone, to paste where colour cannot go.
writeFileSync(path.join(outDir, "ascii.txt"), `${art.map((row) => row.trimEnd()).join("\n")}\n`);

// drawing.ts: an AsciiDrawing for the skill's assets/AsciiArt.tsx, or for
// components/AsciiArt.tsx on unvalley.me (--type-from ./flowerVineArt).
const rawSafe = art.every((row) => !row.includes("`") && !row.includes("${"));
const block = (rowsOf: string[], raw: string | null) =>
  raw
    ? `lines(${raw === "raw" ? "String.raw" : ""}\`\n${rowsOf.map((row) => row.trimEnd()).join("\n")}\n\`)`
    : JSON.stringify(rowsOf.map((row) => row.trimEnd()), null, 4).replace(/\n\]$/, "\n  ]");
writeFileSync(
  path.join(outDir, "drawing.ts"),
  `// Generated by the image-to-ascii skill from ${path.basename(input)}:
//   ${command}${
    BLOCKS
      ? `
// Drawn in blocks: <AsciiArt drawing={${name}} blocks={{ gap: ${BLOCK_GAP}, shade: [${BLOCK_SHADE.join(", ")}] }} />`
      : ""
  }
import type { AsciiDrawing } from "${opt["type-from"]}";

const lines = (text: string) => text.split("\\n").slice(1, -1);

/** ${label}, as coloured ASCII. */
export const ${name}: AsciiDrawing = {
  cellWidth: ${CELL_W},
  cellHeight: ${CELL_H},
  columns: ${COLS},
  flowerKeys: "${flowerKeys}",
  palette: {
${Object.entries(palette)
  .map(([k, [l, d]]) => `    ${k}: ["${l}", "${d}"],`)
  .join("\n")}
  },
  art: ${block(art, rawSafe ? "raw" : null)},
  tone: ${block(tone, "plain")},
};
`,
);

// index.html: the drawing as selectable text, on its own.
const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const vars = (i: number) =>
  Object.entries(palette)
    .map(([k, pair]) => `--${k}:${pair[i]}`)
    .join(";");
let body = "";
art.forEach((row, r) => {
  let run: string | null = null;
  let text = "";
  const flush = () => {
    if (!text) return;
    body += run ? `<span class="${run}">${esc(text)}</span>` : esc(text);
    text = "";
  };
  const trimmed = row.trimEnd();
  for (let c = 0; c < trimmed.length; c++) {
    const key = trimmed[c] === " " ? null : tone[r][c];
    if (key !== null && key !== run) {
      flush();
      run = key;
    }
    text += trimmed[c];
  }
  flush();
  run = null;
  if (r < rows - 1) body += "\n";
});
// The font size makes the columns fill the box in a font whose glyphs are
// 0.6em wide (Menlo, SF Mono, DejaVu Sans Mono, Courier New). Cells are
// measured in `ch`, the font's own glyph width, so the glyphs and the grid
// stay in their cells, and the cells keep their shape, in any monospace font.
const GLYPH = 0.6;
const ASPECT = +(CELL_H / CELL_W).toFixed(4);
const title = opt.title ?? `${label} in ASCII`;
// The tiles, as the site draws them: one path per colour and shade, in the
// drawing's own pixels, stretched over the text's box.
const tilePaths = new Map<string, string>();
art.forEach((row, r) => {
  for (let c = 0; c < COLS; c++) {
    const share = tileShare(row[c] ?? " ");
    if (share === null) continue;
    const id = `${tone[r][c]}:${share}`;
    const x = +(c * CELL_W + BLOCK_GAP).toFixed(3);
    const y = +(r * CELL_H + BLOCK_GAP).toFixed(3);
    const w = +(CELL_W - BLOCK_GAP).toFixed(3);
    const h = +(CELL_H - BLOCK_GAP).toFixed(3);
    tilePaths.set(id, `${tilePaths.get(id) ?? ""}M${x} ${y}h${w}v${h}h${-w}z`);
  }
});
const tilesSvg = BLOCKS
  ? `<svg class="tiles" aria-hidden="true" viewBox="0 0 ${+(COLS * CELL_W).toFixed(3)} ${+(rows * CELL_H).toFixed(3)}" preserveAspectRatio="none" shape-rendering="crispEdges">${[
      ...tilePaths,
    ]
      .map(([id, d]) => {
        const [key, share] = id.split(":");
        return `<path d="${d}" style="fill:color-mix(in oklab,var(--${key}) ${share}%,transparent)"/>`;
      })
      .join("")}</svg>`
  : "";
const toggle = (attr: string, on: string, off: string) =>
  `const d=document.documentElement;d.dataset.${attr}=d.dataset.${attr}==='${on}'?'${off}':'${on}'`;
writeFileSync(
  path.join(outDir, "index.html"),
  `<!doctype html>
<html lang="${esc(opt.lang ?? "en")}" data-grid="${GRID ? "on" : "off"}"${BLOCKS ? ' data-blocks="on"' : ""}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
:root{--page:#ffffff;--ui:#6b7280;--line:rgb(0 0 0/.16);${vars(0)};color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--page:#0a0a0a;--ui:#9ca3af;--line:rgb(255 255 255/.2);${vars(1)};color-scheme:dark}}
:root[data-theme=dark]{--page:#0a0a0a;--ui:#9ca3af;--line:rgb(255 255 255/.2);${vars(1)};color-scheme:dark}
body{margin:0;min-height:100vh;background:var(--page);display:grid;place-items:center;padding:48px 16px;box-sizing:border-box}
main{width:min(100%,${+(COLS * CELL_W).toFixed(2)}px);container-type:inline-size}
.art{position:relative;width:fit-content;margin:0 auto}
.tiles{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
[data-blocks=off] .tiles{display:none}
pre{position:relative;margin:0 auto;width:${COLS}ch;overflow:hidden;font:700 calc(100cqw / ${+(COLS * GLYPH).toFixed(3)}) Menlo,ui-monospace,"SF Mono","DejaVu Sans Mono","Liberation Mono","Courier New",monospace;line-height:calc(1ch * ${ASPECT})}
[data-grid=on] pre{background-image:linear-gradient(to right,var(--line) 1px,transparent 1px),linear-gradient(to bottom,var(--line) 1px,transparent 1px);background-size:1ch calc(1ch * ${ASPECT});box-shadow:1px 1px 0 0 var(--line)}
${Object.keys(palette)
  .map((k) => `.${k}{color:var(--${k})}`)
  .join("")}
nav{position:fixed;top:8px;right:8px;display:flex;gap:4px}
button{font:500 13px/1 system-ui,sans-serif;color:var(--ui);background:none;border:0;padding:8px;cursor:pointer}
[data-grid=on] .grid,[data-blocks=on] .blocks{color:inherit}
</style>
</head>
<body>
<nav>
${
  BLOCKS
    ? `<button type="button" class="blocks" aria-pressed="true" onclick="${toggle("blocks", "on", "off")};this.setAttribute('aria-pressed',d.dataset.blocks==='on')">blocks</button>
`
    : ""
}<button type="button" class="grid" aria-pressed="${GRID}" onclick="${toggle("grid", "on", "off")};this.setAttribute('aria-pressed',d.dataset.grid==='on')">grid</button>
<button type="button" onclick="const d=document.documentElement;const dark=d.dataset.theme?d.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches;d.dataset.theme=dark?'light':'dark'">light / dark</button>
</nav>
<main><div class="art">${tilesSvg}<pre aria-label="${esc(opt.title ?? `${label}, drawn in ASCII`)}">${body}</pre></div></main>
</body>
</html>
`,
);

// Previews: each glyph placed in its cell, in Menlo bold as on the site, and
// set on its baseline as a browser sets a line of that height (Menlo's
// ascent 0.928em and descent 0.236em, centred in the line), so the previews
// match index.html. The grid is a line of one device pixel along the top
// and left of every cell, and along the right and bottom of the drawing,
// under the glyphs, in the colours index.html uses. Blocks are tiles of each
// cell's colour at its share, between the grid and the glyphs.
const FONT = CELL_W / 0.602;
const BASELINE = (CELL_H - 1.164 * FONT) / 2 + 0.928 * FONT;
async function render(page: Page, index: number, scale: number, colours = palette, grid = GRID, blocks = BLOCKS) {
  let g = "";
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < COLS; c++) {
      const ch = art[r][c];
      if (ch === " ") continue;
      g += `<text x="${+(c * CELL_W).toFixed(3)}" y="${+(r * CELL_H + BASELINE).toFixed(3)}" fill="${colours[tone[r][c]][index]}">${esc(ch)}</text>`;
    }
  const W = COLS * CELL_W;
  const H = rows * CELL_H;
  const PW = Math.round(W * scale);
  const PH = Math.round(H * scale);
  let lines = "";
  if (grid) {
    // In device pixels, on pixel centres, so each line is one crisp pixel.
    const at = (v: number, max: number) => Math.min(max - 0.5, Math.floor(v * scale) + 0.5);
    let d = "";
    for (let c = 0; c <= COLS; c++) d += `M${at(c * CELL_W, PW)} 0V${PH}`;
    for (let r = 0; r <= rows; r++) d += `M0 ${at(r * CELL_H, PH)}H${PW}`;
    const [stroke, opacity] = page === "light" ? ["#000000", 0.16] : ["#ffffff", 0.2];
    lines = `<path d="${d}" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1" shape-rendering="crispEdges" fill="none"/>`;
  }
  let tiles = "";
  if (blocks) {
    // In device pixels, so every gap is the same width.
    const paths = new Map<string, string>();
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < COLS; c++) {
        const share = tileShare(art[r][c]);
        if (share === null) continue;
        const id = `${colours[tone[r][c]][index]}:${share}`;
        const x0 = Math.round((c * CELL_W + BLOCK_GAP) * scale);
        const y0 = Math.round((r * CELL_H + BLOCK_GAP) * scale);
        const x1 = Math.round((c + 1) * CELL_W * scale);
        const y1 = Math.round((r + 1) * CELL_H * scale);
        paths.set(id, `${paths.get(id) ?? ""}M${x0} ${y0}H${x1}V${y1}H${x0}z`);
      }
    for (const [id, d] of paths) {
      const [fill, share] = id.split(":");
      tiles += `<path d="${d}" fill="${fill}" fill-opacity="${Number(share) / 100}" shape-rendering="crispEdges"/>`;
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PW}" height="${PH}"><rect width="100%" height="100%" fill="${hex(PAGE[page])}"/>${lines}${tiles}<g transform="scale(${scale})" font-family="Menlo, DejaVu Sans Mono, monospace" font-weight="${opt.weight}" font-size="${FONT}" xml:space="preserve">${g}</g></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}
// With the grid or blocks, large enough that a cell is about 12 device pixels wide.
const scale = Math.max(1, Math.min(GRID || BLOCKS ? 3 : 2, 3000 / (COLS * CELL_W)));
const [light, dark] = await Promise.all([render("light", 0, scale), render("dark", 1, scale)]);
writeFileSync(path.join(outDir, "light.png"), light);
writeFileSync(path.join(outDir, "dark.png"), dark);
{
  const { width: pw, height: ph } = await sharp(light).metadata();
  const src = await sharp(source)
    .flatten({ background: "#ffffff" })
    .extract(box)
    .resize(pw, ph, { fit: "contain", background: "#ffffff" })
    .png()
    .toBuffer();
  const gap = 8;
  // Stacked for wide drawings, side by side for tall ones.
  const tall = ph > pw;
  await sharp({
    create: {
      width: tall ? pw * 3 + gap * 2 : pw,
      height: tall ? ph : ph * 3 + gap * 2,
      channels: 3,
      background: "#888888",
    },
  })
    .composite(
      [src, light, dark].map((input, i) => ({
        input,
        left: tall ? (pw + gap) * i : 0,
        top: tall ? 0 : (ph + gap) * i,
      })),
    )
    .png()
    .toFile(path.join(outDir, "preview.png"));
}
// flowers.png: where the sparkles go, the flowerKeys cells in colour and the
// rest in pale grey.
if (flowerKeys) {
  const shown = Object.fromEntries(
    Object.entries(palette).map(([k, pair]) => [k, flowerKeys.includes(k) ? pair : ["#d4d4d4", "#d4d4d4"]]),
  );
  writeFileSync(path.join(outDir, "flowers.png"), await render("light", 0, scale, shown));
}

// ---------------------------------------------------------------- report
const minContrast = (i: number, page: Page) =>
  Math.min(...Object.values(palette).map((pair) => contrast(rgbOf(pair[i]), PAGE[page])));
const lowest = { light: +minContrast(0, "light").toFixed(2), dark: +minContrast(1, "dark").toFixed(2) };
const warnings: string[] = [];
if (pts.length / (COLS * ROWS) > 0.92 && INK !== "all")
  warnings.push("Almost every cell is drawn: the background may be counted as ink. Try --ink paper, background or alpha, or cut the subject out first.");
if (pts.length < 40) warnings.push("Very few glyphs: try a wider --width, --ink chroma or --fill.");
if (lowest.light < 1.3 || lowest.dark < 1.3) warnings.push("Some colours barely show on one page: raise --min-contrast.");
// --score: how closely the light page follows the source inside the
// drawing. Both maps are darkness per cell (the source's ink, and the
// rendered glyphs in their colours on white); tone correlates them lightly
// blurred, detail correlates what a blur of three cells takes away (folds,
// veins, outlines inside the subject). For comparing settings on one image.
let fidelity: { tone: number; detail: number } | undefined;
if (opt.score) {
  const n = COLS * rows;
  const srcD = new Float64Array(n);
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < COLS; c++) {
      let t = 0;
      for (let sy = 0; sy < SY; sy++)
        for (let sx = 0; sx < SX; sx++) {
          const x = c * SX + sx;
          const y = (r + firstRow) * SY + sy;
          if (!isInk(x, y)) continue;
          const p = px(x, y);
          t += INK === "background" ? inkAmount(p, groundAt(x, y)) : 1 - lum(p);
        }
      srcD[r * COLS + c] = t / (SX * SY);
    }
  // Measured on the glyphs alone, without the grid, which would add the same
  // lines to every cell, or blocks, and at the scale the previews have
  // without them, so the score is the same with or without either.
  const plain =
    GRID || BLOCKS ? await render("light", 0, Math.max(1, Math.min(2, 3000 / (COLS * CELL_W))), palette, false, false) : light;
  const { data: lp } = await sharp(plain)
    .resize(COLS, rows, { fit: "fill", kernel: "cubic" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const outD = new Float64Array(n);
  for (let i = 0; i < n; i++) outD[i] = 1 - lum([lp[i * 3], lp[i * 3 + 1], lp[i * 3 + 2]]);
  // Inside the drawing only: the cells that have a glyph, so the outline of
  // the subject, which any drawing gets right, does not dominate.
  const M = new Uint8Array(n);
  for (let r = 0; r < rows; r++) for (let c = 0; c < COLS; c++) M[r * COLS + c] = art[r][c] === " " ? 0 : 1;
  const blur = (m: Float64Array, sigma: number) => {
    const res = new Float64Array(n);
    const R = Math.ceil(sigma * 2.5);
    const sy = sigma * (CELL_W / CELL_H);
    const Ry = Math.ceil(sy * 2.5);
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < COLS; c++) {
        if (!M[r * COLS + c]) continue;
        let a = 0;
        let w = 0;
        for (let dr = -Ry; dr <= Ry; dr++)
          for (let dc = -R; dc <= R; dc++) {
            const rr = r + dr;
            const cc = c + dc;
            if (rr < 0 || cc < 0 || rr >= rows || cc >= COLS || !M[rr * COLS + cc]) continue;
            const k = Math.exp(-(dc * dc) / (2 * sigma * sigma) - (dr * dr) / (2 * sy * sy));
            a += k * m[rr * COLS + cc];
            w += k;
          }
        res[r * COLS + c] = a / w;
      }
    return res;
  };
  const corr = (x: Float64Array, y: Float64Array) => {
    const inside = [...M.keys()].filter((i) => M[i]);
    const mx = inside.reduce((t, i) => t + x[i], 0) / inside.length;
    const my = inside.reduce((t, i) => t + y[i], 0) / inside.length;
    let sxy = 0;
    let sxx = 0;
    let syy = 0;
    for (const i of inside) {
      sxy += (x[i] - mx) * (y[i] - my);
      sxx += (x[i] - mx) ** 2;
      syy += (y[i] - my) ** 2;
    }
    return sxy / Math.sqrt(sxx * syy || 1);
  };
  const s1 = blur(srcD, 1);
  const o1 = blur(outD, 1);
  const s3 = blur(srcD, 3);
  const o3 = blur(outD, 3);
  fidelity = {
    tone: +corr(s1, o1).toFixed(3),
    detail: +corr(s1.map((v, i) => v - s3[i]), o1.map((v, i) => v - o3[i])).toFixed(3),
  };
}
const report = {
  out: outDir,
  ink: INK,
  ...(frame ? { frame: [frame.left, frame.top, frame.width, frame.height] } : {}),
  columns: COLS,
  rows,
  width: COLS * CELL_W,
  height: +(rows * CELL_H).toFixed(1),
  glyphs: pts.length,
  edgeGlyphs,
  accentCells: pts.filter((p) => p.accent).length,
  accentKeys,
  colours: used.length,
  flowerKeys,
  grid: GRID,
  blocks: BLOCKS,
  minContrast: lowest,
  ...(fidelity ? { fidelity } : {}),
  ...(warnings.length ? { warnings } : {}),
};
console.log(JSON.stringify(report));
