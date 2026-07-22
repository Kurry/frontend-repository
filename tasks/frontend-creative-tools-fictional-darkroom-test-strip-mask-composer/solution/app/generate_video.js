import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ recordVideo: { dir: './', size: { width: 1440, height: 900 } } });
  const page = await context.newPage();

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/');

  await page.waitForTimeout(1000);

  // Click pass-04
  await page.click('text="Proposed 4"');
  await page.waitForTimeout(500);

  // Focus and use keyboard to move
  await page.keyboard.press('Alt+ArrowRight');
  await page.waitForTimeout(200);
  await page.keyboard.press('Alt+ArrowRight');
  await page.waitForTimeout(500);

  // Select Zone
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('span')).find(e => e.textContent === 'z-04');
    if (el) el.click();
  });
  await page.waitForTimeout(500);

  // Make decision
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('button')).find(e => e.textContent === 'Make Decision');
    if (el) el.click();
  });
  await page.waitForTimeout(1000);

  // Rebase
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('button')).find(e => e.textContent === 'Simulate 0.9x Corr');
    if (el) el.click();
  });
  await page.waitForTimeout(1000);

  // Review
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('button')).find(e => e.textContent === 'Review & Approve');
    if (el) el.click();
  });
  await page.waitForTimeout(1000);

  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('button')).find(e => e.textContent === 'Approve Recipe');
    if (el) el.click();
  });
  await page.waitForTimeout(1000);

  await context.close();
  await browser.close();

  const files = fs.readdirSync('./');
  for (const file of files) {
    if (file.endsWith('.webm') && file !== 'evidence.webm') {
      fs.renameSync(file, 'evidence.webm');
      break;
    }
  }
  console.log("Video generated.");
})();
