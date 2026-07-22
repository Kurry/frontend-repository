import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: { dir: 'videos/', size: { width: 1440, height: 900 } }
  });
  const page = await context.newPage();

  await page.goto('http://localhost:3000');

  await page.waitForTimeout(2000);

  const mapBtns = await page.locator('button:has-text("Map")');
  const count = await mapBtns.count();
  for(let i = 0; i < Math.min(3, count); i++) {
    await mapBtns.nth(i).click();
    await page.waitForTimeout(500);
  }

  const slider = await page.locator('input[type="range"]').first();
  if (await slider.count() > 0) {
    await slider.fill('80');
    await page.waitForTimeout(500);
  }

  await page.waitForTimeout(1000);

  // Take screenshot
  await page.screenshot({ path: 'screenshot.png' });

  await context.close();
  await browser.close();
})();
