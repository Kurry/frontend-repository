import { test, expect } from '@playwright/test';

test('record evidence walkthrough', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);

  // Brush timeline
  const timeline = page.locator('.cursor-crosshair');
  if (await timeline.count() > 0) {
      await timeline.click();
      await page.waitForTimeout(1000);
  }

  // Select badge 27
  const badge27 = page.locator('text=MERO').first();
  if (await badge27.count() > 0) {
      // Use evaluate since the overlay is intercepting
      await badge27.evaluate(node => node.click());
      await page.waitForTimeout(1000);
  }

  // Click Export
  const exportBtn = page.getByRole('button', { name: /Export Packet/i });
  if (await exportBtn.count() > 0) {
      await exportBtn.click();
      await page.waitForTimeout(2000);
  }

  // Final wait before ending record
  await page.waitForTimeout(1000);
});
