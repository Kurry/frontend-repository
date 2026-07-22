const { chromium } = require('playwright');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Starting server...');
  const server = exec('npm run start');

  // Wait for server to boot
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: { dir: '.' },
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  try {
    console.log('Navigating...');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);

    // Select first record
    console.log('Selecting record...');
    await page.click('text=#1');
    await page.waitForTimeout(500);

    // Click on ribbon
    console.log('Interacting with ribbon...');
    const ribbon = await page.locator('[role="slider"]');
    const box = await ribbon.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width * 0.75, box.y + box.height / 2);
    }
    await page.waitForTimeout(1000);

    // Create new
    console.log('Creating new record...');
    await page.click('text=New');
    await page.fill('#record-id', '3');
    await page.fill('#record-value', '150');
    await page.selectOption('#record-status', 'ready');
    await page.click('text=Create Record');
    await page.waitForTimeout(1000);

    // Edit
    console.log('Editing record...');
    await page.locator('span.font-medium:has-text("#3")').click();
    await page.click('text=Artifact');
    await page.waitForTimeout(1000);

    // Export/Import modal
    console.log('Export/Import...');
    await page.click('text=Import');
    await page.waitForTimeout(1000);
    await page.click('button[aria-label="Close modal"]');
    await page.waitForTimeout(500);

  } catch (e) {
    console.error('Error during recording:', e);
  } finally {
    console.log('Closing browser...');
    await context.close();
    await browser.close();

    // Find and rename the webm file
    const files = fs.readdirSync('.');
    const webmFile = files.find(f => f.endsWith('.webm') && f !== 'evidence.webm');
    if (webmFile) {
      // If evidence.webm exists, remove it first
      if (fs.existsSync('evidence.webm')) {
         fs.unlinkSync('evidence.webm');
      }
      fs.renameSync(webmFile, 'evidence.webm');
      console.log('Saved evidence.webm');
    }

    console.log('Killing server...');
    server.kill();
    process.exit(0);
  }
}

main();
