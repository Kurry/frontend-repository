#!/bin/bash
set -e

cd solution/app
npm run build

# Start a background server on port 3000
npm run start &
SERVER_PID=$!

# Wait for server to be ready
sleep 5

# Start a playwright video recording
cat << 'PWSCRIPT' > record.cjs
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: '.',
      size: { width: 1280, height: 720 }
    },
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  try {
    await page.goto('http://localhost:3000');

    // Wait for the app to load
    await page.waitForSelector('text=Brew Log');

    // Click on a record to select it
    await page.click('text=Ethiopia Yirgacheffe Test');
    await page.waitForTimeout(1000);

    // Click on Quarantine Lineage
    await page.click('text=Quarantine Lineage');
    await page.waitForTimeout(1000);

    // Type reason
    await page.fill('textarea', 'High temperature probe fault during roast');
    await page.waitForTimeout(1000);

    // Click Quarantine
    await page.click('button:has-text("Quarantine")');
    await page.waitForTimeout(2000);

    // Click New
    await page.click('text=New');
    await page.waitForTimeout(1000);

    // Type in new experiment
    await page.fill('input[placeholder="Experiment Title"]', 'Guatemala Antigua Draft');
    await page.fill('input[placeholder="e.g. Colombia"]', 'Guatemala');
    await page.waitForTimeout(1000);

    // Export
    await page.click('text=Export');
    await page.waitForTimeout(2000);

    // Undo
    await page.click('button[title="Undo last action"]');
    await page.waitForTimeout(2000);

  } catch (e) {
    console.error('Playwright error:', e);
  } finally {
    await context.close();
    await browser.close();
  }
})();
PWSCRIPT

node record.cjs

# Rename the recorded webm file
mv *.webm ../../evidence.webm

kill $SERVER_PID
wait $SERVER_PID || true
