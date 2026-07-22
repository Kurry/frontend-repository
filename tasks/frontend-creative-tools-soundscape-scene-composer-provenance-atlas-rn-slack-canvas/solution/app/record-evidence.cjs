const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const envDir = path.join(__dirname, '..', '..', 'environment', 'reference-screenshots');
  if (!fs.existsSync(envDir)) {
    fs.mkdirSync(envDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: envDir,
      size: { width: 1280, height: 720 }
    }
  });

  const page = await context.newPage();

  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  // Basic interaction
  await page.click('text=City Ambience Base');
  await page.waitForTimeout(1000);

  // Expand a node
  await page.click('text=Mic 2 (Pedestrians)');
  await page.waitForTimeout(1000);

  // Quarantine it
  await page.click('text=Quarantine Bad Lineage');
  await page.waitForTimeout(1000);

  // Undo
  await page.keyboard.press('Control+Z');
  await page.waitForTimeout(1000);

  // Export - click the visible desktop one
  const exportBtns = await page.locator('text=Export');
  await exportBtns.nth(1).click();
  await page.waitForTimeout(1000);

  // Close context to save video
  await context.close();
  await browser.close();

  const files = fs.readdirSync(envDir);
  const webmFile = files.find(f => f.endsWith('.webm') && f !== 'evidence.webm');

  if (webmFile) {
    fs.renameSync(path.join(envDir, webmFile), path.join(envDir, 'evidence.webm'));
    console.log('Video saved as evidence.webm');
  }
})();
