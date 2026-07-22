const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: '../../environment/reference-screenshots/',
      size: { width: 1280, height: 720 }
    }
  });
  const page = await context.newPage();

  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);

  // Click first conflict item
  await page.evaluate(() => {
    const conflictItems = Array.from(document.querySelectorAll('.border-red-300'));
    if (conflictItems.length > 0) conflictItems[0].click();
  });

  await page.waitForTimeout(1000);

  // Type in textarea
  await page.evaluate(() => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
        textarea.value = 'Resolved by checking offline record.';
        const event = new Event('input', { bubbles: true });
        textarea.dispatchEvent(event);
    }
  });

  await page.waitForTimeout(1000);

  // Click resolve
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Resolve Audit Discrepancy'));
    if (btn) btn.click();
  });

  await page.waitForTimeout(1000);

  await context.close();
  await browser.close();

  const fs = require('fs');
  const dir = '../../environment/reference-screenshots/';
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.webm'));
  if (files.length > 0) {
      fs.renameSync(
          path.join(dir, files[0]),
          'evidence.webm'
      );
  }
})();
