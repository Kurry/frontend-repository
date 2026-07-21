const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 375, height: 667 } });
  await page.goto('http://localhost:3000');

  const result = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, a')).map(el => {
      const box = el.getBoundingClientRect();
      return { class: el.className, text: el.innerText.trim(), h: box.height };
    }).filter(e => e.h > 0 && e.h < 44);
  });
  console.log(result);
  await browser.close();
})();
