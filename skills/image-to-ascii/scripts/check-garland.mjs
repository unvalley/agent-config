#!/usr/bin/env node
// Checks that --preset garland still draws the site's garland exactly: it
// converts the watercolour the garland was made from and compares the glyphs
// with the garland in components/flowerVineArt.ts.
//   node check-garland.mjs [path/to/site] [--source garland-source.png]
// The site defaults to the current directory; the watercolour, which is not
// in the repository, to ../gallery/images/garland-source.png. Exits 1 when
// they differ. Run it from the site repo, which has sharp.
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const here = path.dirname(fileURLToPath(import.meta.url));
const { values, positionals } = parseArgs({ allowPositionals: true, options: { source: { type: "string" } } });
const site = positionals[0] ?? process.cwd();
const watercolour = values.source ?? path.join(here, "../gallery/images/garland-source.png");
if (!existsSync(watercolour)) {
  console.error(`The garland's source watercolour is not at ${watercolour}; pass --source.`);
  process.exit(2);
}
const out = mkdtempSync(path.join(tmpdir(), "garland-"));
execFileSync("node", [path.join(here, "convert.mjs"), watercolour, out, "--preset", "garland"], {
  stdio: ["ignore", "ignore", "inherit"],
});
const ours = JSON.parse(readFileSync(path.join(out, "ascii.json"), "utf8")).text.map((row) => row.trimEnd());
const source = readFileSync(path.join(site, "components/flowerVineArt.ts"), "utf8");
const m = source.match(/export const garland[\s\S]*?art: lines\(String\.raw`\n([\s\S]*?)\n`\)/);
if (!m) {
  console.error("No garland art found in components/flowerVineArt.ts");
  process.exit(1);
}
const theirs = m[1].split("\n");
const differing = theirs.map((row, i) => (row === ours[i] ? -1 : i)).filter((i) => i >= 0);
if (ours.length === theirs.length && !differing.length) {
  console.log(`garland: exact (${theirs.length} rows)`);
} else {
  console.error(`garland: differs (${ours.length} rows vs ${theirs.length}; rows ${differing.slice(0, 8).join(", ")} differ)`);
  process.exit(1);
}
