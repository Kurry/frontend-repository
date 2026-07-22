const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

(async () => {
  console.log('Starting local server...');
  const serverProcess = spawn('npm', ['start'], { stdio: 'pipe' });

  // Wait for server to start
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: path.join(__dirname, '../../environment/reference-screenshots'),
      size: { width: 1280, height: 720 }
    },
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  try {
    console.log('Navigating to app...');
    await page.goto('http://localhost:3000');

    console.log('Waiting for network idle...');
    await page.waitForLoadState('networkidle');

    console.log('Taking a moment for visual stabilization...');
    await page.waitForTimeout(2000);

    console.log('Interacting with the application...');

    // Select the record with discrepancy
    console.log('Selecting discrepancy record...');
    const recordRow = page.locator('div[role="listitem"]').filter({ hasText: 'Suspension Service' });
    await recordRow.click();
    await page.waitForTimeout(1000);

    // Click checkbox to attach evidence
    console.log('Attaching evidence...');
    await page.getByLabel('Attach Verification Evidence').check();
    await page.waitForTimeout(1000);

    // Click resolve button
    console.log('Resolving...');
    await page.getByRole('button', { name: 'Resolve & Update State' }).click();
    await page.waitForTimeout(2000);

    console.log('Closing browser to save video...');
  } catch (err) {
    console.error('Error during recording:', err);
  } finally {
    const video = await page.video();
    if (video) {
        const tempPath = await video.path();
        const finalPath = path.join(__dirname, '../../environment/reference-screenshots/evidence.webm');
        await context.close(); // Important: must close context to finalize video
        await browser.close();
        fs.renameSync(tempPath, finalPath);
        console.log('Video saved to:', finalPath);
    } else {
        await context.close();
        await browser.close();
    }
    serverProcess.kill();
  }
})();
