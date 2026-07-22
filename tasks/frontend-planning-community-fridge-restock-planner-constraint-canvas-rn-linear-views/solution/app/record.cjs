const { chromium } = require('playwright');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

(async () => {
  const server = exec('npm start', { cwd: __dirname });

  // wait for server to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: { dir: '.' }
  });
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:3000');

    // Select the 'Water' item using a more specific selector
    const draggedItem = await page.locator('h4:text-is("Water")').locator('..');

    await draggedItem.click();
    await page.waitForTimeout(500);

    const targetLane = await page.locator('[aria-label="Ready lane"]');

    // Attempt to drag to Ready -> triggers conflict error
    await draggedItem.dragTo(targetLane);
    await page.waitForTimeout(1000);

    // Resolve the conflict by clicking the fix button
    await page.click('text=Fix Quantity (Set to 1)');
    await page.waitForTimeout(1000);

    // Try drag again
    await draggedItem.dragTo(targetLane);
    await page.waitForTimeout(1000);

    // Undo
    await page.click('button:has-text("Undo")');
    await page.waitForTimeout(500);

    // Open Export
    await page.click('button:has-text("Export / Import")');
    await page.waitForTimeout(1000);

    // Close export
    await page.click('button:has-text("×")');
    await page.waitForTimeout(500);

  } catch (e) {
    console.error(e);
  } finally {
    const videoPath = await page.video().path();
    await context.close();
    await browser.close();

    fs.renameSync(videoPath, path.join(__dirname, 'evidence.webm'));
    server.kill();
    process.exit(0);
  }
})();
