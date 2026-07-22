import { test, expect } from '@playwright/test';

test('record walkthrough', async ({ page }) => {
  page.on('pageerror', err => console.log('Page Error:', err));
  page.on('console', msg => console.log('Console:', msg.text()));

  await page.goto('http://127.0.0.1:3000');

  // Wait for the app to load
  await page.waitForSelector('text=Practice Segments', { timeout: 10000 });

  // Select a record (e.g., Practice Segment 2 since 1 is empty in our mock)
  await page.click('text=Practice Segment 2');

  // Wait for selected tool to update
  await page.waitForSelector('text=Selected Tool', { timeout: 10000 });

  // Click on a cell in the spatial composer to place the record
  const cells = await page.$$('[role="gridcell"]');
  if (cells.length > 55) {
      await cells[55].click();
  } else if (cells.length > 0) {
      await cells[0].click();
  }

  // Wait a bit to observe the change
  await page.waitForTimeout(1000);

  // Undo the placement
  await page.click('text=Undo');

  // Wait a bit
  await page.waitForTimeout(500);

  // Place it again somewhere else
  if (cells.length > 33) {
      await cells[33].click();
  }

  await page.waitForTimeout(1000);

  // Download the artifact
  await page.click('text=Download Artifact');

  // Wait for download to trigger
  await page.waitForTimeout(1000);
});
