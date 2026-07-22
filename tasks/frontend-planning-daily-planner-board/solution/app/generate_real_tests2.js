const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');

  // Wait for dynamic render
  await page.waitForTimeout(1000);

  const cards = await page.$$('.card');
  console.log("Cards count:", cards.length);
  const cardText = await page.evaluate(() => Array.from(document.querySelectorAll('.card')).map(e => e.textContent));
  console.log("Card texts:", cardText);

  console.log("Export text:", await page.evaluate(() => document.querySelector('button, [role="button"]') ? Array.from(document.querySelectorAll('button')).map(b => b.textContent).join('|') : ''));
  await browser.close();
})();
