const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(500);

  const kpiValues = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.kpi-core strong')).map(el => el.innerText);
  });

  console.log("Reduced motion KPI values:", kpiValues);
  await browser.close();
})();
