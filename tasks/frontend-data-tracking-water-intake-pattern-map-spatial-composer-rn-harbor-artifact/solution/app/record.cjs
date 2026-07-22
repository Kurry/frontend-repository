const { chromium } = require('playwright');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  console.log("Starting server...");
  const server = exec('npm start', { cwd: __dirname });

  // Wait for server to boot
  await wait(3000);

  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: { dir: __dirname }
  });

  const page = await context.newPage();

  try {
    console.log("Navigating...");
    await page.goto('http://localhost:3000');
    await wait(1000);

    console.log("Selecting record...");
    // Find the first record in the list and click it
    await page.evaluate(() => {
      const records = document.querySelectorAll('[role="button"]');
      if (records.length > 0) {
        records[0].click();
      }
    });
    await wait(1000);

    console.log("Placing in composer...");
    // Click in the spatial composer center
    await page.evaluate(() => {
      const composer = document.querySelector('[aria-label="Composer canvas"]');
      if (composer) {
        const rect = composer.getBoundingClientRect();
        const event = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true,
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2
        });
        composer.dispatchEvent(event);
      }
    });
    await wait(1500);

    console.log("Undoing...");
    // Click undo
    await page.evaluate(() => {
      const undoBtn = document.querySelector('[aria-label="Undo last mutation"]');
      if (undoBtn) undoBtn.click();
    });
    await wait(1000);

    console.log("Exporting...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const exportBtn = buttons.find(b => b.textContent.includes('Export'));
      if (exportBtn) exportBtn.click();
    });
    await wait(1000);

  } catch (e) {
    console.error("Error during playwright:", e);
  } finally {
    console.log("Closing browser...");
    await context.close();
    await browser.close();

    server.kill();

    // Find the generated webm file and rename it
    const files = fs.readdirSync(__dirname);
    const webmFile = files.find(f => f.endsWith('.webm') && f !== 'evidence.webm');

    if (webmFile) {
      fs.renameSync(path.join(__dirname, webmFile), path.join(__dirname, 'evidence.webm'));
      console.log("Renamed video to evidence.webm");
    } else {
      console.log("No webm file found.");
    }

    process.exit(0);
  }
}

run();
