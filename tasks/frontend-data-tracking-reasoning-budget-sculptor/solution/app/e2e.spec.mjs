import { test, expect } from '@playwright/test';

test('reasoning budget sculptor flow', async ({ page }) => {
  await page.goto('/');

  // Verify headers and base loaded
  await expect(page.locator('h1')).toContainText('Reasoning-Budget Sculptor');

  // Take screenshot
  await page.screenshot({ path: 'screenshot.png' });

  // Do some basic operations just to verify it runs without crashing
  const p1Lock = page.locator('[aria-label="Lock Phase 1"]');
  await p1Lock.click();

  // Just take another screenshot for visual verification
  await page.screenshot({ path: 'screenshot2.png' });
});
