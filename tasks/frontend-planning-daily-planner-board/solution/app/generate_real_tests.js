// Inspect the actual rendered HTML by parsing the DOM using playwright
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');

  // Look for card class
  const cards = await page.$$('.card');
  console.log("Cards count:", cards.length);
  const cardText = await page.evaluate(() => Array.from(document.querySelectorAll('.card')).map(e => e.textContent));
  console.log("Card texts:", cardText);

  // Inspect cols
  const cols = await page.$$('.col');
  console.log("Cols count:", cols.length);

  // Inspect Delete/Export/Import
  console.log("Export text:", await page.evaluate(() => document.querySelector('button[data-chrome="Export"]')?.outerHTML));
  console.log("Import text:", await page.evaluate(() => document.querySelector('button[data-chrome="Import"]')?.outerHTML));
  console.log("App classes:", await page.evaluate(() => document.body.className + " " + document.querySelector('.app')?.className));

  await browser.close();
})();
