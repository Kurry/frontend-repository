import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: '../../environment/reference-screenshots',
      size: { width: 1280, height: 720 }
    },
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);

  // Interaction
  await page.getByRole('checkbox', { name: 'Select Scale Warmup' }).check();
  await page.waitForTimeout(500);

  await page.getByRole('checkbox', { name: 'Select Arpeggios' }).check();
  await page.waitForTimeout(500);

  await page.getByRole('button', { name: 'Reconcile Batch to Ready' }).click();
  await page.waitForTimeout(1000);

  await page.getByRole('button', { name: 'New Segment' }).click();
  await page.waitForTimeout(1000);

  await page.getByPlaceholder('Segment Title').last().fill('Performance Piece');
  await page.waitForTimeout(500);

  await page.locator('input[type="number"]').last().fill('90');
  await page.waitForTimeout(1000);

  // Close context to ensure video is saved
  await context.close();
  await browser.close();
})();
