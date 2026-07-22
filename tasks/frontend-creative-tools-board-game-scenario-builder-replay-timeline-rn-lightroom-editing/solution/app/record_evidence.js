import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: 'testing/',
      size: { width: 1280, height: 720 },
    }
  });
  const page = await context.newPage();

  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);

  await page.click('text=Scenario 3');
  await page.waitForTimeout(500);

  const slider = page.locator('input[type="range"]');
  await slider.fill('50');
  await page.waitForTimeout(500);

  await page.click('button:has-text("New Scenario")');
  await page.waitForTimeout(500);

  await context.close();
  await browser.close();

  const files = fs.readdirSync('testing/');
  const videoFile = files.find(f => f.endsWith('.webm') && f !== 'evidence.webm');
  if (videoFile) {
      fs.renameSync(`testing/${videoFile}`, 'testing/evidence.webm');
  }
})();
