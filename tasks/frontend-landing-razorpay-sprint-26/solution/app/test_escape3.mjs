import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/sprint/26');
  await page.waitForTimeout(2000);
  await page.keyboard.press('Control+k');
  await page.waitForTimeout(500);
  await page.type('#palette-search', 'test');
  await page.waitForTimeout(500);
  let isFocused = await page.evaluate(() => document.activeElement.id);
  console.log('Focused?', isFocused);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  let isOpen = await page.evaluate(() => document.querySelector('#command-palette').style.display !== 'none');
  let newFocused = await page.evaluate(() => document.activeElement.id);
  console.log('Palette open after Esc?', isOpen, 'Focused?', newFocused);
  await browser.close();
})();
