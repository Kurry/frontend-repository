import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: '../../environment/reference-screenshots/'
    }
  });
  const page = await context.newPage();

  await page.goto('http://127.0.0.1:3000');
  await page.waitForTimeout(1000);

  // Create
  await page.fill('input[placeholder="#ff0000, #00ff00"]', '#4ade80, #3b82f6');
  await page.selectOption('select', 'conflict');
  await page.click('button:has-text("Add")');
  await page.waitForTimeout(500);

  // Recover
  const recoverBtn = page.locator('button:has-text("Recover & Resolve")').first();
  await recoverBtn.click();
  await page.waitForTimeout(500);

  // Undo
  await page.click('button:has-text("Undo")');
  await page.waitForTimeout(500);

  // Export
  await page.click('button:has-text("Export/Import")');
  await page.waitForTimeout(1000);

  await context.close();
  await browser.close();

  const fs = await import('fs');
  const path = await import('path');
  const files = fs.readdirSync('../../environment/reference-screenshots/');
  const webmFile = files.find(f => f.endsWith('.webm'));
  if (webmFile) {
    fs.renameSync(
      path.join('../../environment/reference-screenshots/', webmFile),
      '../../solution/app/evidence.webm'
    );
  }
})();
