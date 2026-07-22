const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  const html = await page.content();
  console.log(html.substring(0, 1000));
  const buttons = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.innerText));
  console.log(buttons);
  await browser.close();
})();
