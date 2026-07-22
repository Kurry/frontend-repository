import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/sprint/26');
  await page.waitForTimeout(2000);
  await page.keyboard.press('Control+k');
  await page.waitForTimeout(500);
  let isOpen = await page.evaluate(() => document.querySelector('#command-palette').style.display !== 'none');
  console.log('Palette open?', isOpen);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  isOpen = await page.evaluate(() => document.querySelector('#command-palette').style.display !== 'none');
  console.log('Palette open after Esc?', isOpen);
  await browser.close();
})();
