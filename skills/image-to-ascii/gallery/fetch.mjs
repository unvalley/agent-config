#!/usr/bin/env node
// Downloads the gallery's images from the addresses in sources.json into
// images/ (ignored by git: their rights vary, so they are not committed),
// upright and at most 1600 px on their long side, as the gallery expects.
//   node fetch.mjs [--force]
// Run it from a folder that has sharp (the site repo). Images already there
// are kept unless --force.
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const here = path.dirname(fileURLToPath(import.meta.url));
let sharp;
for (const from of [process.cwd(), path.join(here, "../scripts")]) {
  try {
    sharp = createRequire(path.join(from, "noop.js"))("sharp");
    break;
  } catch {}
}
if (!sharp) throw new Error("Run from a folder that has sharp, such as the site repo.");

const { values } = parseArgs({ options: { force: { type: "boolean" } } });
const sources = JSON.parse(readFileSync(path.join(here, "sources.json"), "utf8"));
mkdirSync(path.join(here, "images"), { recursive: true });
let fetched = 0;
for (const s of sources) {
  const file = path.join(here, s.file);
  if (existsSync(file) && !values.force) continue;
  const response = await fetch(s.url);
  if (!response.ok) {
    console.error(`${s.name}: ${response.status} from ${s.url}`);
    continue;
  }
  const body = Buffer.from(await response.arrayBuffer());
  const image = sharp(body).rotate().resize(1600, 1600, { fit: "inside", withoutEnlargement: true });
  await (file.endsWith(".png") ? image.png() : image.jpeg({ quality: 90 })).toFile(file);
  fetched++;
  console.log(`${s.name}: ${s.from}`);
}
console.log(`${fetched} fetched, ${sources.length - fetched} already there or failed`);
