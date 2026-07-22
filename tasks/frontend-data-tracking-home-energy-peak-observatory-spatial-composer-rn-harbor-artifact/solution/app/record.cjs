const { chromium } = require('playwright');
const path = require('path');

async function record() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: __dirname,
      size: { width: 1280, height: 720 },
    },
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  // Wait for the server to be ready
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  // Perform actions to demonstrate the app
  console.log("Adding new reading...");
  await page.fill('input[type="text"]', 'Living Room');
  await page.fill('input[type="number"]:first-of-type', '80');
  await page.fill('input[type="number"]:last-of-type', '30');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);

  console.log("Selecting Sub Panel B to demonstrate conflict...");
  await page.click('text=Sub Panel B');
  await page.waitForTimeout(1000);

  console.log("Using spatial composer to rebalance...");
  // Interact with range slider for Sub Panel B
  await page.fill('input[type="range"]', '120');
  await page.click('button:has-text("Apply Mutation")');
  await page.waitForTimeout(1000);

  console.log("Selecting Living Room...");
  await page.click('text=Living Room');
  await page.waitForTimeout(1000);

  console.log("Filtering by ready...");
  await page.click('text=Ready');
  await page.waitForTimeout(500);

  console.log("Filtering all...");
  await page.click('text=All');
  await page.waitForTimeout(500);

  console.log("Undoing...");
  await page.click('text=Undo (Ctrl+Z)');
  await page.waitForTimeout(1000);

  console.log("Exporting...");
  await page.click('button:has-text("Export")');
  await page.waitForTimeout(1000);

  console.log("Clearing...");
  await page.click('button:has-text("Clear")');
  await page.waitForTimeout(1000);

  await context.close();
  await browser.close();

  const fs = require('fs');
  const files = fs.readdirSync(__dirname);
  const webmFile = files.find(f => f.endsWith('.webm'));
  if (webmFile) {
    fs.renameSync(
      path.join(__dirname, webmFile),
      path.join(__dirname, 'evidence.webm')
    );
    console.log('Video saved to evidence.webm');
  } else {
    console.error('No .webm file generated.');
  }
}

record().catch(console.error);
