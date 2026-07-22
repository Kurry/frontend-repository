import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: '.',
      size: { width: 1280, height: 720 }
    }
  });
  const page = await context.newPage();

  await page.goto('http://localhost:3000');

  await page.waitForTimeout(1000);

  // Click on cutout-07 to select it
  await page.click('#svg-rect-cutout-07');
  await page.waitForTimeout(1000);

  // Click slot 4 on depth rail
  const buttons = page.locator('button');
  await buttons.filter({ hasText: '4' }).click();
  await page.waitForTimeout(1000);

  // Click confirm move
  await page.click('text=Confirm Move');
  await page.waitForTimeout(1000);

  // Scrub the viewer offset
  await page.fill('input[type="range"]', '40');
  await page.waitForTimeout(1000);

  await page.fill('input[type="range"]', '-40');
  await page.waitForTimeout(1000);

  // Export packet
  await page.click('text=Export Packet');
  await page.waitForTimeout(1000);

  await context.close();
  await browser.close();

  const files = fs.readdirSync('.');
  const webmFile = files.find(f => f.endsWith('.webm'));
  if (webmFile) {
    fs.renameSync(webmFile, 'evidence.webm');
  }
})();
