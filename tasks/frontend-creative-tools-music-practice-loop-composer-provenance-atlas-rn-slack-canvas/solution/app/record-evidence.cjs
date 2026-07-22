const { chromium } = require('@playwright/test');
const { execSync } = require('child_process');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: '.',
      size: { width: 1280, height: 720 },
    },
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);

  // Click segment and trace
  await page.click('text=Outro Solo');
  await page.waitForTimeout(500);
  await page.click('text=Trace & Quarantine');
  await page.waitForTimeout(1000);

  // Undo
  await page.click('text=Undo');
  await page.waitForTimeout(1000);

  // Close context to save video
  await context.close();
  await browser.close();

  // Rename video to evidence.webm
  execSync('mv *.webm evidence.webm');
})();
