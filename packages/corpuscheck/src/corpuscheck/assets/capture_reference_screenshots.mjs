#!/usr/bin/env node
// Capture standardized reference screenshots from each task's oracle
// (tasks/<slug>/solution/app), doubling as an oracle smoke-validation pass.
//
// Per task:
//   1. Serve solution/app on a local port (npm start if the package defines it,
//      else `npx serve`). Fail loudly if it never responds — that alone
//      validates the oracle is runnable.
//   2. Load it in headless Chromium at a 1440x900 desktop viewport, recording
//      console errors and page errors (oracle validation signal).
//   3. Capture:
//      - overview.png — full-page DESKTOP layout rendered at 768px width via
//        deviceScaleFactor (a shrunken desktop render, NOT a responsive
//        tablet reflow). Fits any model's image budget; shows composition.
//      - segment-NN.png — 1440x900 viewport captures stepping down the page
//        with 100px overlap. Each is fully legible under Claude's ~1568px
//        long-edge budget and cheap for GPT-style 512px tiling.
//      - overview-tablet.png / overview-mobile.png — full-page RESPONSIVE
//        reflows at 1024x768 (tablet) and 390x844 (mobile) viewports, so
//        fidelity judging can compare real breakpoint layouts, not a
//        shrunken desktop render.
//   4. Write validation.json (served, console/page errors, page height,
//      segment count, viewports) next to the images.
//
// Output: reference-screenshots/<slug>/ at the repo root — intentionally
// OUTSIDE tasks/ so screenshots can never bloat task packages or artifacts.
//
// Usage: corpuscheck screenshots capture [--viewports=desktop,tablet,mobile] [slug ...]
//        (runs this script via node with cwd at the repo root; no args =
//        every tasks/*/solution/app; default captures all three viewports —
//        pass --viewports to restrict, e.g. --viewports=desktop for the
//        legacy desktop-only output)

import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { observePageFailures, resolvePlaywright, waitForServer } from './browser_smoke_shared.mjs';

// This script ships inside the corpuscheck python package; the repository is
// located by walking up from the working directory (the CLI wrapper runs it
// with cwd at the repo root) to a directory holding both tasks/ and packages/.
function findRepoRoot(start) {
  let dir = path.resolve(start);
  for (;;) {
    if (fs.existsSync(path.join(dir, 'tasks')) && fs.existsSync(path.join(dir, 'packages'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(
        `cannot locate repository root from ${start} (no ancestor contains tasks/ + packages/); ` +
        'run from inside the repository (corpuscheck screenshots capture does this for you)'
      );
    }
    dir = parent;
  }
}

const ROOT = findRepoRoot(process.cwd());
const OUT_ROOT = path.join(ROOT, 'reference-screenshots');
const PORT = 45871;
const VIEWPORT = { width: 1440, height: 900 };
const OVERLAP = 100;
const OVERVIEW_WIDTH = 768;
const SETTLE_MS = 1500;
// Responsive overview presets: real viewport reflows (deviceScaleFactor 1),
// captured full-page as overview-<name>.png.
const RESPONSIVE_VIEWPORTS = {
  tablet: { width: 1024, height: 768 },
  mobile: { width: 390, height: 844 },
};
const ALL_VIEWPORTS = ['desktop', ...Object.keys(RESPONSIVE_VIEWPORTS)];

const { chromium } = resolvePlaywright(ROOT);

function taskSlugs() {
  return fs.readdirSync(path.join(ROOT, 'tasks'))
    .filter((d) => fs.existsSync(path.join(ROOT, 'tasks', d, 'solution', 'app')))
    .sort();
}

function startServer(appDir) {
  const pkgPath = path.join(appDir, 'package.json');
  let cmd, args;
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const start = pkg.scripts?.start || '';
    const usesServePkg = /(npx\s+(-y\s+|--yes\s+)?serve\b|\bserve@\d)/.test(start) && !start.includes('&&');
    if (start && !usesServePkg) {
      // real app server (e.g. vite): needs deps
      if (!fs.existsSync(path.join(appDir, 'node_modules'))) {
        execSync('npm install --no-audit --no-fund', { cwd: appDir, stdio: 'ignore' });
      }
      // rewrite any hardcoded port via PORT env; vite-style scripts use --port 3000,
      // http-server uses -p 3000, serve uses -l 3000
      const patched = start
        .replace(/--port[= ]\s*\d+/g, `--port ${PORT}`)
        .replace(/-p\s+\d+/g, `-p ${PORT}`)
        .replace(/-l\s+\d+/g, `-l ${PORT}`);
      return spawn('sh', ['-c', patched.includes(String(PORT)) ? patched : `${start} --port ${PORT}`], {
        cwd: appDir, stdio: 'ignore', detached: true,
        env: { ...process.env, PORT: String(PORT),
               PATH: `${path.join(appDir, 'node_modules', '.bin')}:${process.env.PATH}` },
      });
    }
  }
  // static folder
  return spawn('npx', ['-y', 'serve', '-l', String(PORT), '-n', '.'], {
    cwd: appDir, stdio: 'ignore', detached: true,
  });
}

function stopServer(proc) {
  try { process.kill(-proc.pid, 'SIGKILL'); } catch { try { proc.kill('SIGKILL'); } catch { /* gone */ } }
}

async function captureTask(slug, viewports = ALL_VIEWPORTS) {
  const appDir = path.join(ROOT, 'tasks', slug, 'solution', 'app');
  const outDir = path.join(OUT_ROOT, slug);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const result = {
    slug, served: false, consoleErrors: [], pageErrors: [], failedUrls: [],
    pageHeight: null, segments: 0, viewports, capturedAt: null,
  };

  const url = `http://localhost:${PORT}`;
  // the port must be FREE before we start — otherwise we'd screenshot whatever
  // unrelated service already lives there and call it the oracle
  try {
    await fetch(url);
    throw new Error(`port ${PORT} is already in use by another service`);
  } catch (err) {
    if (String(err).includes('already in use')) throw err; // fetch succeeded = occupied
  }
  const server = startServer(appDir);
  try {
    result.served = await waitForServer(url);
    if (!result.served) {
      result.capturedAt = new Date().toISOString();
      fs.writeFileSync(path.join(outDir, 'validation.json'), JSON.stringify(result, null, 2));
      return result;
    }

    const browser = await chromium.launch({ headless: true });
    try {
      // segments + validation at desktop viewport (error listeners live here;
      // the overview passes below reuse the same server and stay listener-free
      // so errors are not double-counted)
      const ctx = await browser.newContext({ viewport: VIEWPORT });
      const page = await ctx.newPage();
      observePageFailures(page, result);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(SETTLE_MS);

      const height = await page.evaluate(() =>
        Math.max(document.body.scrollHeight, document.documentElement.scrollHeight));
      result.pageHeight = height;

      const step = VIEWPORT.height - OVERLAP;
      let idx = 0;
      for (let y = 0; y === 0 || y < height - OVERLAP; y += step) {
        await page.evaluate((top) => window.scrollTo(0, top), y);
        await page.waitForTimeout(300);
        idx += 1;
        await page.screenshot({
          path: path.join(outDir, `segment-${String(idx).padStart(2, '0')}.png`),
        });
        if (idx >= 30) break; // safety bound for infinite-scroll pages
      }
      result.segments = idx;
      await ctx.close();

      // overview: desktop layout downscaled to 768px width
      if (viewports.includes('desktop')) {
        const scale = OVERVIEW_WIDTH / VIEWPORT.width;
        const octx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: scale });
        const opage = await octx.newPage();
        await opage.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await opage.waitForTimeout(SETTLE_MS);
        await opage.screenshot({
          path: path.join(outDir, 'overview.png'), fullPage: true, scale: 'device',
        });
        await octx.close();
      }

      // responsive overviews: real reflows at tablet/mobile viewports
      for (const [name, vp] of Object.entries(RESPONSIVE_VIEWPORTS)) {
        if (!viewports.includes(name)) continue;
        const rctx = await browser.newContext({ viewport: vp });
        const rpage = await rctx.newPage();
        await rpage.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await rpage.waitForTimeout(SETTLE_MS);
        await rpage.screenshot({
          path: path.join(outDir, `overview-${name}.png`), fullPage: true,
        });
        await rctx.close();
      }
    } finally {
      await browser.close();
    }
  } finally {
    stopServer(server);
    await new Promise((r) => setTimeout(r, 500));
  }
  result.capturedAt = new Date().toISOString();
  fs.writeFileSync(path.join(outDir, 'validation.json'), JSON.stringify(result, null, 2));
  return result;
}

const rawArgs = process.argv.slice(2);
let viewports = ALL_VIEWPORTS;
const slugArgs = [];
for (let i = 0; i < rawArgs.length; i += 1) {
  const a = rawArgs[i];
  if (a === '--viewports') {
    viewports = String(rawArgs[++i] || '').split(',').map((v) => v.trim()).filter(Boolean);
  } else if (a.startsWith('--viewports=')) {
    viewports = a.slice('--viewports='.length).split(',').map((v) => v.trim()).filter(Boolean);
  } else {
    slugArgs.push(a);
  }
}
const badViewports = viewports.filter((v) => !ALL_VIEWPORTS.includes(v));
if (badViewports.length || !viewports.length) {
  console.error(`invalid --viewports value(s): ${badViewports.join(', ') || '(empty)'} — allowed: ${ALL_VIEWPORTS.join(', ')}`);
  process.exit(2);
}
const slugs = slugArgs.length ? slugArgs : taskSlugs();
let failures = 0;
for (const slug of slugs) {
  try {
    const r = await captureTask(slug, viewports);
    const status = !r.served ? 'SERVE-FAIL'
      : r.pageErrors.length ? 'PAGE-ERRORS'
      : r.consoleErrors.length ? 'CONSOLE-ERRORS' : 'OK';
    if (status !== 'OK') failures += 1;
    console.log(`${slug}: ${status} height=${r.pageHeight} segments=${r.segments} consoleErr=${r.consoleErrors.length} pageErr=${r.pageErrors.length}`);
  } catch (err) {
    failures += 1;
    console.log(`${slug}: CAPTURE-FAIL ${String(err).slice(0, 200)}`);
  }
}
console.log(`done: ${slugs.length - failures}/${slugs.length} clean`);
process.exit(failures ? 1 : 0);
