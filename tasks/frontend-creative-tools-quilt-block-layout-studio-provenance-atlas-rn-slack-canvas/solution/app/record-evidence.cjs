const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: path.join(__dirname, '..'), // output to solution/
      size: { width: 1280, height: 720 }
    }
  });
  const page = await context.newPage();

  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);

  // Add a block
  await page.click('button:has-text("Add")');
  await page.waitForTimeout(500);

  // Click block to select
  await page.click('text=New Block');
  await page.waitForTimeout(500);

  // Edit the block by clicking on the block again or using a more robust selector
  // Let's just double click the block to see if it triggers, or use the direct locator
  const editButtons = await page.$$('button:has(svg.lucide-edit2)');
  if (editButtons.length > 0) {
      await editButtons[0].click();
  } else {
      // Fallback
      await page.evaluate(() => {
          const editBtn = document.querySelector('svg.lucide-edit2')?.parentElement;
          if (editBtn) editBtn.click();
      });
  }

  await page.waitForTimeout(500);

  // If input appears, fill it
  if (await page.locator('input[placeholder="Name"]').count() > 0) {
      await page.fill('input[placeholder="Name"]', 'Log Cabin Block');
      await page.click('button:has-text("Save")');
      await page.waitForTimeout(1000);
  }

  // Enter trace & quarantine
  await page.fill('textarea', 'Found inconsistent edge lengths in source pattern');
  await page.click('button:has-text("Quarantine Bad Lineage")');
  await page.waitForTimeout(1500);

  // Undo
  await page.click('button:has-text("Undo")');
  await page.waitForTimeout(1000);

  // Export
  await page.click('button:has-text("Export")');
  await page.waitForTimeout(1000);

  await context.close();
  await browser.close();

  const files = fs.readdirSync(path.join(__dirname, '..'));
  const webmFile = files.find(f => f.endsWith('.webm'));
  if (webmFile) {
    fs.renameSync(
      path.join(__dirname, '..', webmFile),
      path.join(__dirname, '..', 'evidence.webm')
    );
    console.log('Video saved to solution/evidence.webm');
  }
})();
