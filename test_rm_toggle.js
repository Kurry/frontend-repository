const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');

  // start normal, wait 100ms
  await page.waitForTimeout(100);

  // enable RM mid-flight
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(50);

  const kpiValues = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.kpi-core strong')).map(el => el.innerText);
  });

  console.log("Values after toggling RM on:", kpiValues);

  // toggle off
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForTimeout(100);

  const kpiValuesOff = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.kpi-core strong')).map(el => el.innerText);
  });

  console.log("Values after toggling RM off (should restart count):", kpiValuesOff);

  await browser.close();
})();
