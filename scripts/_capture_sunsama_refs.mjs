#!/usr/bin/env node
// One-shot capture of Downloads/Sunsama.html into
// reference-screenshots/frontend-dayforge/ using the same conventions as
// capture_reference_screenshots.mjs (1440x900 segments + 768px overview).
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const requireCjs = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SLUG = 'frontend-dayforge';
const OUT_DIR = path.join(ROOT, 'reference-screenshots', SLUG);
const URL = 'http://127.0.0.1:8765/Sunsama.html';
const VIEWPORT = { width: 1440, height: 900 };
const OVERLAP = 100;
const OVERVIEW_WIDTH = 768;
const SETTLE_MS = 2000;

const { chromium } = requireCjs(path.join(ROOT, 'node_modules', 'playwright'));

async function preparePage(page) {
  // Expand left navigation (saved snapshot starts with it off-screen).
  await page.evaluate(() => {
    const nav = document.querySelector('.navigation-container');
    if (nav) nav.classList.remove('hidden-offscreen');
  });
  // Prefer the real >> toggle if class removal didn't stick.
  const angles = page.locator('.fa-angles-right, .fa-angles-left').first();
  if (await angles.count()) {
    const stillHidden = await page.evaluate(() =>
      document.querySelector('.navigation-container')?.classList.contains('hidden-offscreen'));
    if (stillHidden) {
      await angles.click().catch(() => {});
    }
  }
  await page.waitForTimeout(300);

  // Scroll the kanban board so today's columns (with task cards) are in view.
  await page.evaluate(() => {
    const kanban = document.querySelector('.kanban-container');
    const sat = [...document.querySelectorAll('[role="region"]')]
      .find((r) => /Saturday,\s*July\s*18/i.test(r.getAttribute('aria-label') || ''));
    if (sat && kanban) {
      const satLeft = sat.getBoundingClientRect().left
        - kanban.getBoundingClientRect().left + kanban.scrollLeft;
      kanban.scrollLeft = Math.max(0, satLeft - 16);
    }
  });
  await page.waitForTimeout(400);

  // Strip non-product chrome (Intercom / floating chat overlays).
  await page.evaluate(() => {
    for (const sel of [
      '#intercom-container',
      '.intercom-lightweight-app',
      '[class*="intercom"]',
      'iframe[name^="intercom"]',
    ]) {
      document.querySelectorAll(sel).forEach((el) => { el.style.display = 'none'; });
    }
    document.querySelectorAll('button').forEach((btn) => {
      const name = (btn.getAttribute('aria-label') || '').toLowerCase();
      if (name.includes('intercom') || name === 'open chat') {
        btn.style.display = 'none';
      }
    });
  });
}

async function main() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const result = {
    slug: SLUG,
    served: false,
    consoleErrors: [],
    pageErrors: [],
    pageHeight: null,
    segments: 0,
    capturedAt: null,
    source: URL,
  };

  const res = await fetch(URL);
  result.served = res.ok;
  if (!result.served) throw new Error(`Sunsama page not reachable at ${URL}`);

  const browser = await chromium.launch({ headless: true });
  try {
    const ctx = await browser.newContext({ viewport: VIEWPORT });
    const page = await ctx.newPage();
    page.on('console', (m) => {
      if (m.type() === 'error') result.consoleErrors.push(m.text().slice(0, 300));
    });
    page.on('pageerror', (e) => result.pageErrors.push(String(e).slice(0, 300)));

    await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(SETTLE_MS);
    await preparePage(page);
    await page.waitForTimeout(500);

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
        path: path.join(OUT_DIR, `segment-${String(idx).padStart(2, '0')}.png`),
      });
      if (idx >= 30) break;
    }
    result.segments = idx;
    await ctx.close();

    const scale = OVERVIEW_WIDTH / VIEWPORT.width;
    const octx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: scale });
    const opage = await octx.newPage();
    await opage.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
    await opage.waitForTimeout(SETTLE_MS);
    await preparePage(opage);
    await opage.waitForTimeout(500);
    await opage.screenshot({
      path: path.join(OUT_DIR, 'overview.png'),
      fullPage: true,
      scale: 'device',
    });
    await octx.close();
  } finally {
    await browser.close();
  }

  result.capturedAt = new Date().toISOString();
  fs.writeFileSync(path.join(OUT_DIR, 'validation.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
