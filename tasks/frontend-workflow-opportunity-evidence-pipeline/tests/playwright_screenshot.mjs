import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: '../environment/reference-screenshots',
      size: { width: 1280, height: 720 }
    }
  });
  const page = await context.newPage();

  await page.goto('http://localhost:3000');

  // Wait a bit to ensure it loads
  await page.waitForTimeout(2000);

  await context.close();
  await browser.close();
})();
