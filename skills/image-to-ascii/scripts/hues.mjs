#!/usr/bin/env node
// Measures the hues of an image's vivid pixels, to choose --accent-hue,
// --sparkle-hue and --hue-map ranges from the image rather than by guess.
//   node hues.mjs <image> [--box x,y,w,h]
// --box takes pixels, or fractions of the image when all four are 0–1, so a
// detail (a flower, a dot) can be measured apart from its surroundings.
// Prints a row per 10° bin with its share of the vivid pixels and their mean
// colour, the same "vivid" as the converter's accents (chroma ≥ 70, not near
// black or white).
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const here = path.dirname(fileURLToPath(import.meta.url));
let sharp;
for (const from of [process.cwd(), here]) {
  try {
    sharp = createRequire(path.join(from, "noop.js"))("sharp");
    break;
  } catch {}
}
if (!sharp) {
  console.error(`sharp is not installed. Install it once with:\n  npm install --prefix "${here}"`);
  process.exit(2);
}
const { values, positionals } = parseArgs({ allowPositionals: true, options: { box: { type: "string" } } });
if (!positionals[0]) {
  console.log("Usage: node hues.mjs <image> [--box x,y,w,h]");
  process.exit(1);
}
let img = sharp(positionals[0]).rotate().toColourspace("srgb");
const meta = await sharp(await img.png().toBuffer()).metadata();
if (values.box) {
  let [x, y, w, h] = values.box.split(",").map(Number);
  if ([x, y, w, h].every((v) => v >= 0 && v <= 1)) {
    x = Math.round(x * meta.width);
    y = Math.round(y * meta.height);
    w = Math.round(w * meta.width);
    h = Math.round(h * meta.height);
  }
  img = img.extract({ left: x, top: y, width: Math.min(w, meta.width - x), height: Math.min(h, meta.height - y) });
}
const { data, info } = await img
  .flatten({ background: "#ffffff" })
  .resize({ width: 1500, withoutEnlargement: true })
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const bins = Array.from({ length: 36 }, () => ({ n: 0, sum: [0, 0, 0] }));
let vivid = 0;
const total = info.width * info.height;
for (let i = 0; i < data.length; i += 3) {
  const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
  const hi = Math.max(r, g, b);
  const lo = Math.min(r, g, b);
  const l = (hi + lo) / 510;
  if (hi - lo < 70 || l <= 0.15 || l >= 0.85) continue;
  const d = hi - lo;
  let h = hi === r ? (g - b) / d + (g < b ? 6 : 0) : hi === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  const bin = bins[Math.floor(h / 10) % 36];
  bin.n++;
  bin.sum[0] += r;
  bin.sum[1] += g;
  bin.sum[2] += b;
  vivid++;
}
const hex = (c) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
console.log(`${info.width}×${info.height} px, ${((vivid / total) * 100).toFixed(1)}% vivid`);
console.log("hue      share of vivid   mean colour");
bins.forEach((bin, i) => {
  if (!bin.n) return;
  const share = bin.n / vivid;
  if (share < 0.002) return;
  const bar = "█".repeat(Math.max(1, Math.round(share * 60)));
  console.log(`${String(i * 10).padStart(3)}-${String(i * 10 + 10).padEnd(3)}  ${(share * 100).toFixed(1).padStart(5)}%  ${hex(bin.sum.map((v) => v / bin.n))}  ${bar}`);
});
