const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);

  const tasks = await page.evaluate(() => Array.from(document.querySelectorAll('.task, .card, [class*="task"], [class*="card"]')).map(e => ({ className: e.className, text: e.textContent.substring(0,20) })));
  console.log("Tasks:", tasks);
  await browser.close();
})();
