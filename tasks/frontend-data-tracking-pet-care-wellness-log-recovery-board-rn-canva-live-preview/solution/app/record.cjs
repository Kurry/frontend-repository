const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

(async () => {
  // Start server
  const server = exec('npm start', { cwd: __dirname });

  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 3000));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: { dir: __dirname }
  });

  const page = await context.newPage();

  try {
    await page.goto('http://localhost:3000');

    // Wait for the app to render
    await page.waitForSelector('h1:has-text("Pet Care Wellness Log")');
    await page.waitForTimeout(1000);

    // 1. Move failed record into recovery
    await page.click('button:has-text("Recover")');
    await page.waitForTimeout(1000);

    // 2. Repair downstream consequences (fill form)
    await page.fill('#adjustedDate', '2024-10-15');
    await page.waitForTimeout(500);
    await page.fill('#resolutionNote', 'Bloodwork received and approved. Proceeding with surgery.');
    await page.waitForTimeout(1000);

    // 3. Resolve record
    await page.click('button:has-text("Resolve Record")');
    await page.waitForTimeout(1500);

    // 4. Export artifact
    await page.click('button:has-text("Export")');
    await page.waitForTimeout(1000);

    // 5. Clear state
    await page.click('button:has-text("Clear")');
    await page.waitForTimeout(1500);

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await context.close(); // Important for saving video
    await browser.close();

    // Rename video
    const files = fs.readdirSync(__dirname);
    const webmFile = files.find(f => f.endsWith('.webm') && f !== 'evidence.webm');
    if (webmFile) {
      fs.renameSync(
        path.join(__dirname, webmFile),
        path.join(__dirname, 'evidence.webm')
      );
      console.log('Video saved as evidence.webm');
    }

    server.kill();
    process.exit(0);
  }
})();
