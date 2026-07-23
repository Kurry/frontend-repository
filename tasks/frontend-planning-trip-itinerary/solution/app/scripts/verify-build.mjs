// verify:build gate for the Riviera Trip Planner oracle.
// The app is a dependency-free vanilla ES-module SPA, so "building" means:
// the entry assets exist, and every shipped JS module parses cleanly. This
// catches syntax errors before the verifier tries to serve the app, mirroring
// what a bundler step would catch. Exits 0 on success, non-zero on any failure.
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = dirname(fileURLToPath(import.meta.url)) + "/..";
const REQUIRED = ["index.html", "app.css", "favicon.svg", "server.mjs", "src/main.js"];

let failures = 0;
function fail(msg) {
  console.error("[verify:build] FAIL " + msg);
  failures++;
}

for (const rel of REQUIRED) {
  const p = join(ROOT, rel);
  if (!existsSync(p)) fail(`missing required file: ${rel}`);
}

// index.html must load the module entry and the stylesheet, and set a Riviera title.
if (existsSync(join(ROOT, "index.html"))) {
  const html = readFileSync(join(ROOT, "index.html"), "utf8");
  if (!/src\/main\.js/.test(html)) fail("index.html does not reference src/main.js");
  if (!/app\.css/.test(html)) fail("index.html does not reference app.css");
  if (!/<title>[\s\S]*Riviera[\s\S]*<\/title>/i.test(html))
    fail("index.html <title> must reference the Riviera trip");
}

// Syntax-check every shipped JS module (and the server) with node --check.
const jsFiles = [];
function walk(dir) {
  for (const name of readFileSync ? requireDir(dir) : []) jsFiles.push(name);
}
function requireDir(dir) {
  // tiny readdir without extra import surface
  return listDir(dir);
}
import { readdirSync } from "node:fs";
function listDir(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listDir(full));
    else if (entry.name.endsWith(".js") || entry.name.endsWith(".mjs")) out.push(full);
  }
  return out;
}

for (const dir of [join(ROOT, "src"), ROOT]) {
  if (dir === ROOT) {
    if (existsSync(join(ROOT, "server.mjs"))) jsFiles.push(join(ROOT, "server.mjs"));
    continue;
  }
  if (existsSync(dir)) jsFiles.push(...listDir(dir));
}

for (const f of [...new Set(jsFiles)]) {
  try {
    execFileSync(process.execPath, ["--check", f], { stdio: "pipe" });
  } catch (e) {
    fail(`syntax error in ${f.replace(ROOT + "/", "")}: ${e.stderr?.toString().trim() || e.message}`);
  }
}

if (failures > 0) {
  console.error(`[verify:build] ${failures} problem(s) found`);
  process.exit(1);
}
console.log("[verify:build] OK — entry assets present and all JS modules parse");
