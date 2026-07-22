import { chromium } from '@playwright/test';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: path.resolve('../../environment/reference-screenshots/'),
      size: { width: 1280, height: 720 },
    },
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    await page.waitForSelector('text=Practice Segments');

    await page.click('text=Add New Segment');
    await page.fill('input[type="text"]', 'Guitar Riff 1');

    const inputs = await page.locator('input[type="text"]').all();
    await inputs[0].fill('Guitar Riff 1');
    await inputs[1].fill('Electric Guitar');
    await page.fill('input[type="number"]', '120');
    await page.selectOption('select', { label: 'Draft' });
    await page.click('button[type="submit"]');

    await page.waitForSelector('text=Guitar Riff 1');

    await page.click('text=Audit');

    await page.waitForSelector('h2:has-text("Guitar Riff 1")');

    await page.fill('textarea', 'https://example.com/guitar-riff-1-recording');
    await page.click('text=Attach to Record');

    await page.waitForTimeout(1000);

    await page.click('text=Download JSON');

    await page.waitForTimeout(2000);

  } catch (error) {
    console.error('Error during recording:', error);
  } finally {
    await context.close();
    await browser.close();
  }
})();
