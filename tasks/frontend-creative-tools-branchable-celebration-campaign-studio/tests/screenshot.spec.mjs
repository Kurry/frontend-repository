import { test, expect } from '@playwright/test';

test('capture screenshot', async ({ page }) => {
  await page.goto('/');
  await page.screenshot({ path: '../environment/reference-screenshots/screenshot.png', fullPage: true });
});
