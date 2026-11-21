// Shared by convert.mts and hues.mts.
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/** sharp from the current directory (the site repo has it) or beside these scripts. */
export function loadSharp(): typeof import("sharp").default {
  for (const from of [process.cwd(), here]) {
    try {
      return createRequire(path.join(from, "noop.js"))("sharp");
    } catch {}
  }
  console.error(
    `sharp is not installed here or in ${here}. Install it once with:\n  npm install --prefix "${here}"`,
  );
  process.exit(2);
}

export const hueOf = (r: number, g: number, b: number) => {
  const hi = Math.max(r, g, b);
  const d = hi - Math.min(r, g, b);
  if (!d) return 0;
  const h = hi === r ? (g - b) / d + (g < b ? 6 : 0) : hi === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return h * 60;
};

/** A vivid pixel: chroma at least 70, and not near black or white. */
export const isVivid = (r: number, g: number, b: number) => {
  const hi = Math.max(r, g, b);
  const lo = Math.min(r, g, b);
  const l = (hi + lo) / 510;
  return hi - lo >= 70 && l > 0.15 && l < 0.85;
};

export const hex = (c: number[]) =>
  `#${c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
