import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000); // wait for load
  await page.screenshot({ path: 'tasks/frontend-data-tracking-model-monitor/solution/app/preview.png', fullPage: true });
  await browser.close();
})();
