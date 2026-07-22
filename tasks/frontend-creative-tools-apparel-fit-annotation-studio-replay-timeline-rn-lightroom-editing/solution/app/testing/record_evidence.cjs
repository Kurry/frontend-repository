const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: path.join(__dirname),
      size: { width: 1280, height: 720 }
    }
  });

  const page = await context.newPage();

  try {
    await page.goto('http://localhost:3000');

    // Wait for the app to be fully loaded
    await page.waitForSelector('text=Apparel Fit Annotation Studio', { state: 'visible' });
    await page.waitForTimeout(1000);

    // Click on a record to view its timeline
    await page.click('text=Jacket Armhole');
    await page.waitForTimeout(1000);

    // Edit the record
    await page.fill('input#title', 'Jacket Armhole - Edit 1');
    await page.click('button:has-text("Save Changes")');
    await page.waitForTimeout(1000);

    // Edit again
    await page.fill('input#title', 'Jacket Armhole - Final');
    await page.click('button:has-text("Save Changes")');
    await page.waitForTimeout(1000);

    // Scrub timeline
    const timelineNodes = await page.locator('div[class*="flex flex-col items-center group cursor-pointer"]');
    await timelineNodes.first().click({ force: true });
    await page.waitForTimeout(1000);

    // Click restore
    await page.evaluate(() => window.confirm = () => true); // Auto-accept confirm dialog
    await page.click('button:has-text("Restore")');
    await page.waitForTimeout(1000);

    // Export session (via UI since we want to show it in the video if possible, but actually we will just use the download button)
    // We just click Export to trigger download, though we don't strictly need to save the file.
    await page.click('button:has-text("Export")');
    await page.waitForTimeout(2000);

  } catch (error) {
    console.error('Error during recording:', error);
  } finally {
    const videoPath = await page.video().path();
    await context.close();
    await browser.close();

    // Rename video to evidence.webm
    const fs = require('fs');
    fs.renameSync(videoPath, path.join(__dirname, 'evidence.webm'));
    console.log('Saved evidence to evidence.webm');
  }
})();
