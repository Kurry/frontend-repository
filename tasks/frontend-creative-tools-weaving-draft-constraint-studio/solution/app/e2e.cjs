const { chromium } = require('@playwright/test');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: '../../environment/reference-screenshots',
      size: { width: 1440, height: 900 }
    },
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  try {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('text=Weaving Draft Constraint Studio');

    // Simulate pick
    await page.locator('button:has-text("Pick")').click();
    await page.locator('button:has-text("Pick")').click();

    // Create a fork
    const input = await page.locator('input[placeholder="New branch name..."]');
    await input.scrollIntoViewIfNeeded();
    await input.fill('Fix Float');
    await page.locator('button:has-text("Fork")').click();

    // Apply Repeat
    const startInput = await page.locator('input[type="number"]').first();
    await startInput.scrollIntoViewIfNeeded();
    await startInput.fill('0');
    const endInput = await page.locator('input[type="number"]').nth(1);
    await endInput.fill('3');
    await page.locator('button:has-text("Apply Repeat")').click();

    // Switch variant
    await page.locator('button:has-text("Compare/Switch")').first().scrollIntoViewIfNeeded();
    await page.locator('button:has-text("Compare/Switch")').first().click({ force: true });

    page.on('download', download => download.cancel());
    await page.locator('button', { hasText: /^JSON$/ }).scrollIntoViewIfNeeded();
    await page.locator('button', { hasText: /^JSON$/ }).click({ force: true });

    await page.waitForTimeout(2000);

    await context.close();
    const videoPath = await page.video().path();
    console.log(`Video saved to ${videoPath}`);
    fs.writeFileSync('video_path.txt', videoPath);

  } catch (e) {
    console.error('Test failed', e);
  } finally {
    await browser.close();
  }
})();
