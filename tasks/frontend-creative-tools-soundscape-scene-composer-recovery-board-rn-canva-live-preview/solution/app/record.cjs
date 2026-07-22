const { chromium } = require('@playwright/test');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  });
  const context = await browser.newContext({
    recordVideo: {
      dir: path.join(__dirname, '..', '..', 'environment', 'reference-screenshots'),
      size: { width: 1440, height: 900 }
    },
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  try {
    await page.goto('http://localhost:3000');

    // Wait for the app to load
    await page.waitForSelector('[data-testid="sound-layers-panel"]', { timeout: 10000 });

    // Show creating a new record
    const newBtn = await page.getByRole('button', { name: /create new layer/i });
    await newBtn.click();

    // Edit some fields
    await page.waitForSelector('input[type="text"]');
    const inputs = await page.locator('input[type="text"]').all();
    await inputs[0].fill('Epic Lead Synth'); // name

    const selects = await page.locator('select').all();
    await selects[1].selectOption('ready'); // status

    const saveBtn = await page.getByRole('button', { name: 'Save' });
    await saveBtn.click();

    // Wait a sec for state update
    await page.waitForTimeout(500);

    // Demonstrate selecting a failed record and recovering it (signature interaction)
    const recoveryBtn = await page.getByTestId(/recovery-item-/).first();
    await recoveryBtn.click();

    await page.waitForTimeout(500);

    const resolveSyncBtn = await page.getByTestId('resolve-sync');
    await resolveSyncBtn.click();

    // Verify it changed in summary
    await page.waitForTimeout(500);

    // Export session
    const exportBtn = await page.getByTestId('export-btn');
    await exportBtn.click();

    // Slight pause to capture the UI success state
    await page.waitForTimeout(1000);

  } catch (err) {
    console.error("Error during recording:", err);
  } finally {
    // Close context to finish recording and save file
    await context.close();
    await browser.close();

    // We need to rename the video to evidence.webm
    const fs = require('fs');
    const videoDir = path.join(__dirname, '..', '..', 'environment', 'reference-screenshots');
    const files = fs.readdirSync(videoDir);
    const webmFile = files.find(f => f.endsWith('.webm'));

    if (webmFile) {
      fs.renameSync(
        path.join(videoDir, webmFile),
        path.join(__dirname, 'evidence.webm')
      );
      console.log('Video saved as evidence.webm');
    }
  }
})();
