const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'New Note' }).click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'new-note-debug.png' });
  await browser.close();
})();
