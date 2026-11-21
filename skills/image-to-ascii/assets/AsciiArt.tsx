// Draws a drawing.ts made by the image-to-ascii skill as real, selectable
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
}>;

const RAMP = ".:+*ox%#@";

/** The tiles under a drawing in blocks, one path per colour and shade. */
function Tiles({ scope, drawing, blocks }: { scope: string; drawing: AsciiDrawing; blocks: Blocks }) {
  const { art, tone, columns, cellWidth: cw, cellHeight: ch } = drawing;
  const { gap, shade } = blocks;
  const paths = new Map<string, string>();
  art.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      const i = RAMP.indexOf(row[c]);
      const key = tone[r]?.[c];
      if (row[c] === " " || i < 0 || !key || key === " ") continue;
      const share = Math.round(shade[0] + ((shade[1] - shade[0]) * i) / (RAMP.length - 1));
      const id = `${key}:${share}`;
      paths.set(id, `${paths.get(id) ?? ""}M${c * cw + gap} ${r * ch + gap}h${cw - gap}v${ch - gap}h${gap - cw}z`);
    }
  });
  return (
    <svg
      aria-hidden="true"
      className={scope}
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

type Segment = { key: string | null; text: string };

/** Runs of one colour; spaces and line breaks join the run they follow. */
function segmentsOf({ art, tone }: AsciiDrawing) {
  const segments: Segment[] = [];
  art.forEach((row, r) => {
    for (let c = 0; c <= row.length; c++) {
      const char = c === row.length ? (r < art.length - 1 ? "\n" : "") : row[c];
      if (!char) continue;
      const key = char === " " || char === "\n" ? null : (tone[r]?.[c] ?? null);
      const last = segments.at(-1);
      if (last && (key === null || last.key === key)) last.text += char;
      else segments.push({ key, text: char });
    }
  });
  return segments;
}

/**
 * Coloured ASCII that spans the width of its box: the font size follows the
 * box through a container query. Cells are measured in `ch`, the font's own
 * glyph width, so the glyphs and the grid stay in their cells in any
 * monospace font. `name` scopes the colour variables, so give each drawing
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
      <div style={{ position: "relative", width: "fit-content", margin: "0 auto" }}>
        {blocks && <Tiles scope={scope} drawing={drawing} blocks={blocks} />}
        <pre
          className={scope}
          aria-hidden={label ? undefined : true}
          aria-label={label}
          role={label ? "img" : undefined}
          style={{
            position: "relative",
            margin: 0,
            padding: 0,
            overflow: "hidden",
            width: `${columns}ch`,
            font: `700 calc(100cqw / ${columns * GLYPH_WIDTH}) ${FONTS}`,
            lineHeight: `calc(1ch * ${aspect})`,
            ...(grid
              ? {
                  backgroundImage:
                    "linear-gradient(to right, var(--ascii-line) 1px, transparent 1px), linear-gradient(to bottom, var(--ascii-line) 1px, transparent 1px)",
                  backgroundSize: `1ch calc(1ch * ${aspect})`,
                  boxShadow: "1px 1px 0 0 var(--ascii-line)",
                }
              : {}),
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
