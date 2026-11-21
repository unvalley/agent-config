// Draws a drawing.ts made by the ascii-painting skill as real, selectable
// text in a React app. Copy this file beside the drawing; the drawing
// imports its type from "./AsciiArt". No dependencies beyond React.
import type { ReactNode } from "react";

/** A colour for a light page and one for a dark page. */
export type Palette = Record<string, readonly [light: string, dark: string]>;

export type AsciiDrawing = {
  /** Size of a cell in CSS px; only its shape matters, the art fills its box. */
  cellWidth: number;
  cellHeight: number;
  columns: number;
  /** Palette keys of the flowers (from --sparkle-hue), for effects over them. */
  flowerKeys: string;
  palette: Palette;
  /** Other palettes over the same keys; inside `data-scheme="n"` the art takes `schemes[n - 1]`. */
  schemes?: Palette[];
  /** A glyph per cell, a row per line. */
  art: string[];
  /** The palette key of each cell. */
  tone: string[];
};

/**
 * Drawing in blocks, as the garland and the sky on unvalley.me are: each cell
 * with a density glyph gets a tile of its own colour under the glyph, paler
 * under a light glyph and stronger under a dense one, with a gap along its
 * top and left. Line glyphs (/ \ | - _) keep no tile. A drawing converted
 * with --blocks says the values it was made for in its header.
 */
export type Blocks = Readonly<{
  /** The gap along a tile's top and left, in the drawing's CSS px. */
  gap: number;
  /** How much of its cell's colour a tile takes, in %: under the ramp's lightest glyph and its densest. */
  shade: readonly [number, number];
  /** The drawing's density ramp, lightest to densest, when it was not converted with the default. */
  ramp?: string;
}>;

const RAMP = ".:+*ox%#@";

/** The tiles under a drawing in blocks, one path per colour and shade. */
function Tiles({ drawing, blocks }: { drawing: AsciiDrawing; blocks: Blocks }) {
  const { art, tone, columns, cellWidth: cw, cellHeight: ch } = drawing;
  const { gap, shade, ramp = RAMP } = blocks;
  const paths = new Map<string, string>();
  art.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      const i = ramp.indexOf(row[c]);
      const key = tone[r]?.[c];
      if (i < 0 || !key || key === " ") continue;
      const share = Math.round(shade[0] + ((shade[1] - shade[0]) * i) / (ramp.length - 1));
      const id = `${key}:${share}`;
      paths.set(id, `${paths.get(id) ?? ""}M${c * cw + gap} ${r * ch + gap}h${cw - gap}v${ch - gap}h${gap - cw}z`);
    }
  });
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${columns * cw} ${art.length * ch}`}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    >
      {[...paths].map(([id, d]) => {
        const [key, share] = id.split(":");
        return <path key={id} d={d} style={{ fill: `color-mix(in oklab, var(--${key}) ${share}%, transparent)` }} />;
      })}
    </svg>
  );
}

/** Advance width of a glyph in the fonts below, in em. */
const GLYPH_WIDTH = 0.6;
const FONTS = 'Menlo, ui-monospace, "SF Mono", "DejaVu Sans Mono", "Liberation Mono", "Courier New", monospace';

/**
 * In blocks every glyph sits inside its tile, as the sky on unvalley.me
 * draws them. How far the ink of .:+*ox%#@/\|-_ reaches together in Menlo
 * Bold, in em, from the pen (left, right) and the baseline (up, down), and
 * the font's ascent and descent, which place the baseline in a line.
 */
const INK = { up: 0.77, down: 0.24, left: 0, right: 0.61 };
const ASCENT = 0.928;
const DESCENT = 0.236;
/** Room kept clear inside a tile, around the glyph, in CSS px. */
const PAD = 0.25;

/**
 * The font size and the pen (x) and baseline (y) in a cell, in the
 * drawing's CSS px, that put the ink of every glyph inside its tile, clear
 * of the gap, centred in the room left.
 */
function fitGlyphs(cw: number, ch: number, gap: number) {
  const roomW = cw - gap - 2 * PAD;
  const roomH = ch - gap - 2 * PAD;
  const wide = INK.left + INK.right;
  const tall = INK.up + INK.down;
  const size = Math.min(roomW / wide, roomH / tall);
  return {
    size,
    x: gap + PAD + (roomW - wide * size) / 2 + INK.left * size,
    y: gap + PAD + (roomH - tall * size) / 2 + INK.up * size,
  };
}

type Segment = { key: string | null; text: string };

/** Runs of one colour; spaces and line breaks join the run they follow. */
function segmentsOf({ art, tone }: AsciiDrawing) {
  const segments: Segment[] = [];
  const add = (key: string | null, char: string) => {
    const last = segments.at(-1);
    if (last && (key === null || last.key === key)) last.text += char;
    else segments.push({ key, text: char });
  };
  art.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) add(row[c] === " " ? null : (tone[r]?.[c] ?? null), row[c]);
    if (r < art.length - 1) add(null, "\n");
  });
  return segments;
}

/**
 * Coloured ASCII that spans the width of its box: the font size follows the
 * box through a container query. `name` scopes the colour variables, so give each drawing
 * on a page its own. `theme` says how the page is dark: "media" follows the
 * system, "class" follows a `dark` class on an ancestor. `grid` draws the
 * cells as thin lines under the glyphs; `blocks` draws them in blocks (see
 * Blocks). `children` sit on top, in the same box.
 */
export function AsciiArt({
  name,
  drawing,
  grid = false,
  blocks,
  theme = "media",
  label,
  children,
}: {
  name: string;
  drawing: AsciiDrawing;
  grid?: boolean;
  blocks?: Blocks;
  theme?: "media" | "class";
  /** What the drawing shows, for screen readers; without it the art is hidden from them. */
  label?: string;
  children?: ReactNode;
}) {
  const { art, columns, cellWidth, cellHeight, palette, schemes = [] } = drawing;
  const scope = `ascii-${name}`;
  const aspect = cellHeight / cellWidth;
  /** A length in the drawing's CSS px, scaled with the box as the text is. */
  const scaled = (v: number) => `calc(100cqw * ${v / (columns * cellWidth)})`;
  const gridLines = {
    backgroundImage:
      "linear-gradient(to right, var(--ascii-line) 1px, transparent 1px), linear-gradient(to bottom, var(--ascii-line) 1px, transparent 1px)",
    boxShadow: "1px 1px 0 0 var(--ascii-line)",
  };
  // Without blocks a cell is the font's own glyph width, so the glyphs and
  // the grid stay in their cells in any monospace font. In blocks each glyph
  // is set smaller, inside its tile; letter-spacing keeps a glyph to a cell.
  const fit = blocks ? fitGlyphs(cellWidth, cellHeight, blocks.gap) : null;
  const text = fit
    ? {
        width: "100cqw",
        fontSize: scaled(fit.size),
        letterSpacing: `calc(100cqw / ${columns} - 1ch)`,
        lineHeight: scaled(cellHeight),
        transform: `translate(${scaled(fit.x)}, ${scaled(fit.y - ((cellHeight - (ASCENT + DESCENT) * fit.size) / 2 + ASCENT * fit.size))})`,
      }
    : {
        width: `${columns}ch`,
        fontSize: `calc(100cqw / ${columns * GLYPH_WIDTH})`,
        lineHeight: `calc(1ch * ${aspect})`,
        ...(grid ? { ...gridLines, backgroundSize: `1ch calc(1ch * ${aspect})` } : {}),
      };
  const variables = (colours: Palette, index: 0 | 1) =>
    Object.entries(colours)
      .map(([key, pair]) => `--${key}:${pair[index]}`)
      .join(";");
  const dark = (rule: string) =>
    theme === "class" ? `.dark ${rule}` : `@media (prefers-color-scheme:dark){${rule}}`;
  const css = [
    `.${scope}{--ascii-line:rgb(0 0 0/.16);${variables(palette, 0)}}`,
    dark(`.${scope}{--ascii-line:rgb(255 255 255/.2);${variables(palette, 1)}}`),
    ...schemes.flatMap((scheme, i) => [
      `[data-scheme="${i + 1}"] .${scope}{${variables(scheme, 0)}}`,
      dark(`[data-scheme="${i + 1}"] .${scope}{${variables(scheme, 1)}}`),
    ]),
  ].join("");

  return (
    <div style={{ containerType: "inline-size" }}>
      <style>{css}</style>
      <div
        className={scope}
        style={{
          position: "relative",
          width: "fit-content",
          margin: "0 auto",
          ...(fit && grid ? { ...gridLines, backgroundSize: `calc(100cqw / ${columns}) ${scaled(cellHeight)}` } : {}),
        }}
      >
        {blocks && <Tiles drawing={drawing} blocks={blocks} />}
        <pre
          aria-hidden={label ? undefined : true}
          aria-label={label}
          role={label ? "img" : undefined}
          style={{
            position: "relative",
            margin: 0,
            padding: 0,
            overflow: "hidden",
            fontWeight: 700,
            fontFamily: FONTS,
            ...text,
          }}
        >
          {segmentsOf(drawing).map((segment, i) =>
            segment.key ? (
              // biome-ignore lint/suspicious/noArrayIndexKey: static text, never reordered
              <span key={i} style={{ color: `var(--${segment.key})` }}>
                {segment.text}
              </span>
            ) : (
              segment.text
            ),
          )}
        </pre>
        {children}
      </div>
    </div>
  );
}
