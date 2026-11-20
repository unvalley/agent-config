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
 * cells as thin lines under the glyphs. `children` sit on top, in the same box.
 */
export function AsciiArt({
  name,
  drawing,
  grid = false,
  theme = "media",
  label,
  children,
}: {
  name: string;
  drawing: AsciiDrawing;
  grid?: boolean;
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
        <pre
          className={scope}
          aria-hidden={label ? undefined : true}
          aria-label={label}
          role={label ? "img" : undefined}
          style={{
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
