// Authoring-time verification: screenshot one fixture viewport of the local
// candidate and diff it against the bundled ground-truth PNG.
// Usage: node verify-shot.mjs <name> <width> <height> <gtPath> [settleMs]
import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire("/tmp/pwtest/");
const { chromium } = require("playwright-core");
const { PNG } = require("pngjs");
const pixelmatch = (await import("/tmp/pwtest/node_modules/pixelmatch/index.js")).default;

const [name, w, h, gtPath, settleArg] = process.argv.slice(2);
const width = Number(w);
const height = Number(h);
const settle = Number(settleArg || 15000);
const exe =
  process.env.HEADLESS_SHELL ||
  `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1228/chrome-linux/headless_shell`;

const browser = await chromium.launch({
  executablePath: exe,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--enable-unsafe-swiftshader",
    "--use-angle=swiftshader",
    "--hide-scrollbars",
  ],
});
const page = await browser.newPage({ viewport: { width, height } });
page.on("console", (m) => {
  if (m.type() === "error") console.log("[console.error]", m.text().slice(0, 200));
});
page.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 300)));
const resp = await page.goto("http://127.0.0.1:3003/sprint/26", {
  waitUntil: "domcontentloaded",
  timeout: 20000,
});
console.log("status", resp.status());
await page.waitForTimeout(settle);
const info = await page.evaluate(() => ({
  title: document.title,
  loaderGone: !document.getElementById("site-loader"),
  canvas: !!document.querySelector("#canvas-container canvas"),
  canvasVisible: (() => {
    const c = document.getElementById("canvas-container");
    return c ? getComputedStyle(c).display !== "none" && c.style.opacity !== "0" : false;
  })(),
  bodyBg: getComputedStyle(document.body).backgroundColor,
  bodyFont: getComputedStyle(document.body).fontFamily,
  navLink: !!document.querySelector('a[href="#agentic-stack"]'),
  agentic: !!document.getElementById("agentic-stack"),
  footer: !!document.querySelector("footer"),
  scrollH: document.body.scrollHeight,
}));
console.log(JSON.stringify(info, null, 1));
const out = `/tmp/shot-${name}.png`;
await page.screenshot({ path: out });
await browser.close();

if (gtPath && fs.existsSync(gtPath)) {
  const a = PNG.sync.read(fs.readFileSync(out));
  const b = PNG.sync.read(fs.readFileSync(gtPath));
  if (a.width !== b.width || a.height !== b.height) {
    console.log(`dim mismatch: shot ${a.width}x${a.height} vs gt ${b.width}x${b.height}`);
  } else {
    const diff = new PNG({ width: a.width, height: a.height });
    const bad = pixelmatch(a.data, b.data, diff.data, a.width, a.height, {
      threshold: 0.25,
    });
    const pct = ((bad / (a.width * a.height)) * 100).toFixed(2);
    console.log(`pixel diff: ${bad} px (${pct}%)`);
    fs.writeFileSync(`/tmp/diff-${name}.png`, PNG.sync.write(diff));
  }
}
