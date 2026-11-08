#!/usr/bin/env node
// Converts every gallery image and lays the results out for judging:
// each image as source | light page | dark page, eight to a sheet.
//   node run.mjs <outDir> [--defaults] [--width 480] [--only name,name] [--extra="--glyphs density"]
// Without --defaults, each image uses its "options" from sources.json (the
// settings the skill's guidance leads to); with it, the converter's
// defaults only, to see what the automatic choices do. Run it from a folder
// that has sharp (the site repo). Prints each image's report line.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const here = path.dirname(fileURLToPath(import.meta.url));
const convert = path.join(here, "../scripts/convert.mjs");
let sharp;
for (const from of [process.cwd(), path.join(here, "../scripts")]) {
  try {
    sharp = createRequire(path.join(from, "noop.js"))("sharp");
    break;
  } catch {}
}
if (!sharp) throw new Error("Run from a folder that has sharp, such as the site repo.");

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    defaults: { type: "boolean" },
    width: { type: "string" },
    only: { type: "string" },
    extra: { type: "string" },
  },
});
const out = positionals[0];
if (!out) {
  console.log("Usage: node run.mjs <outDir> [--defaults] [--width 480] [--only name,name]");
  process.exit(1);
}
const only = values.only?.split(",");
const images = JSON.parse(readFileSync(path.join(here, "sources.json"), "utf8")).filter(
  (s) => !only || only.includes(s.name),
);
const missing = images.filter((s) => !existsSync(path.join(here, s.file)));
if (missing.length) {
  console.error(`${missing.length} images are missing; download them with: node ${path.join(here, "fetch.mjs")}`);
  process.exit(1);
}
mkdirSync(out, { recursive: true });

const results = [];
for (const s of images) {
  const options = [...(values.defaults ? [] : (s.options ?? [])), ...(values.extra?.split(" ").filter(Boolean) ?? [])];
  const args = [convert, path.join(here, s.file), path.join(out, s.name), "--width", values.width ?? s.width ?? "480", ...options, "--name", s.name.replace(/-(.)/g, (_, c) => c.toUpperCase())];
  try {
    const report = JSON.parse(execFileSync("node", args, { stdio: ["ignore", "pipe", "pipe"] }).toString());
    delete report.out;
    results.push({ name: s.name, kind: s.kind, options, report });
    console.log(`${s.name.padEnd(22)} ${JSON.stringify(report)}`);
  } catch (e) {
    results.push({ name: s.name, kind: s.kind, options, error: String(e.stderr).trim() });
    console.log(`${s.name.padEnd(22)} ERROR ${String(e.stderr).trim()}`);
  }
}
writeFileSync(path.join(out, "results.json"), JSON.stringify(results, null, 1));

// Sheets: eight images each, a strip of three 300 × 300 tiles per image.
const T = 300;
const label = (text) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${T * 3 + 8}" height="22"><rect width="100%" height="100%" fill="#18181b"/><text x="6" y="16" font-family="Helvetica" font-size="13" fill="#fafafa">${text.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text></svg>`,
  );
const tile = (file, bg) =>
  sharp(file).resize(T, T, { fit: "contain", background: bg }).flatten({ background: bg }).png().toBuffer();
const done = results.filter((r) => !r.error);
for (let sheet = 0; sheet * 8 < done.length; sheet++) {
  const part = done.slice(sheet * 8, sheet * 8 + 8);
  const comp = [];
  for (let i = 0; i < part.length; i++) {
    const r = part[i];
    const s = images.find((x) => x.name === r.name);
    const x = (i % 2) * (T * 3 + 20);
    const y = Math.floor(i / 2) * (T + 30);
    const opts = r.options.length ? r.options.join(" ") : "defaults";
    comp.push({ input: label(`${r.name} — ink ${r.report.ink}, ${r.report.colours} colours — ${opts}`), left: x, top: y });
    comp.push({ input: await tile(path.join(here, s.file), "#ffffff"), left: x, top: y + 24 });
    comp.push({ input: await tile(path.join(out, r.name, "light.png"), "#ffffff"), left: x + T + 4, top: y + 24 });
    comp.push({ input: await tile(path.join(out, r.name, "dark.png"), "#0a0a0a"), left: x + 2 * (T + 4), top: y + 24 });
  }
  await sharp({
    create: { width: T * 6 + 28, height: Math.ceil(part.length / 2) * (T + 30), channels: 3, background: "#a1a1aa" },
  })
    .composite(comp)
    .png()
    .toFile(path.join(out, `sheet-${sheet + 1}.png`));
}
console.log(`${done.length}/${results.length} converted; sheets in ${out}`);
