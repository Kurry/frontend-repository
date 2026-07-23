// Authoring-time behavior probe: nav click active state, GET ACCESS hover
// color, and the video modal open/close cycle.
import { createRequire } from "node:module";
const require = createRequire("/tmp/pwtest/");
const { chromium } = require("playwright-core");

const exe = `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1228/chrome-linux/headless_shell`;
const browser = await chromium.launch({
  executablePath: exe,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`http://127.0.0.1:${process.env.TEST_PORT || 3004}/sprint/26`, {
  waitUntil: "domcontentloaded",
});
await page.waitForTimeout(16000);

// Nav click -> section scrolls into view + active state
await page.evaluate(() => window.scrollTo(0, document.querySelector(".threejs-scroll-section")?.offsetHeight || 4000));
await page.waitForTimeout(800);
await page.click('a[href="#agentic-stack"]');
await page.waitForTimeout(900);
const nav = await page.evaluate(() => {
  const cell = document.querySelector('a[data-section="agentic-stack"][href="#agentic-stack"]');
  const rect = document.getElementById("agentic-stack").getBoundingClientRect();
  return {
    activeClass: cell.className,
    activeBg: getComputedStyle(cell).backgroundColor,
    sectionTop: Math.round(rect.top),
    hash: location.hash,
  };
});
console.log("nav:", JSON.stringify(nav));

// GET ACCESS rail hover color
const railHover = await page.evaluate(() => {
  const el = document.querySelector(".access-rail__link");
  return getComputedStyle(el).backgroundColor;
});
await page.hover(".access-rail__link");
await page.waitForTimeout(500);
const railAfter = await page.evaluate(
  () => getComputedStyle(document.querySelector(".access-rail__link")).backgroundColor
);
console.log("rail bg before/after hover:", railHover, "->", railAfter);

// Video modal
await page.click('[data-video="ezDrzlSsBno"]');
await page.waitForTimeout(700);
const modal = await page.evaluate(() => {
  const m = document.querySelector(".video-modal");
  const v = document.getElementById("dynamic-video");
  return {
    opacity: m.style.opacity,
    src: v.getAttribute("src"),
    poster: v.getAttribute("poster"),
    bodyOverflow: document.body.style.overflow,
  };
});
console.log("modal open:", JSON.stringify(modal));
await page.click(".video-close-button");
await page.waitForTimeout(500);
const closed = await page.evaluate(() => ({
  opacity: document.querySelector(".video-modal").style.opacity,
  bodyOverflow: document.body.style.overflow,
}));
console.log("modal closed:", JSON.stringify(closed));

// Rive hydration count after scroll through page
const rive = await page.evaluate(() => document.querySelectorAll("[data-rive] canvas").length);
console.log("hydrated rive canvases near viewport:", rive);
await browser.close();
