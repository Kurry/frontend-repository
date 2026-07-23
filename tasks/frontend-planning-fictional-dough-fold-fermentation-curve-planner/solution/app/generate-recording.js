import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: { dir: './' }
  });
  const page = await context.newPage();

  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);

  // Basic interaction
  const eventF02 = await page.locator('text=EV-F02').first();
  if (await eventF02.count() > 0) {
    await eventF02.click();
    await page.waitForTimeout(500);
  }

  await context.close();
  await browser.close();

  const fs = await import('fs');
  const path = await import('path');
  const files = fs.readdirSync('./');
  const webmFile = files.find(f => f.endsWith('.webm'));
  if (webmFile) {
    fs.renameSync(webmFile, 'evidence.webm');
  }
})();
