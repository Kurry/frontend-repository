const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:3000');
  // Wait for the app to load
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'tasks/frontend-creative-tools-story-docs/solution/app/screenshot.png', fullPage: true });
  console.log('Screenshot saved');
  await browser.close();
})();
