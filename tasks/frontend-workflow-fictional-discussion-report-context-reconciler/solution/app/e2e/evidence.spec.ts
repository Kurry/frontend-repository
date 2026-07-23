import { test, expect } from '@playwright/test';

test('record evidence', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  // Wait for the app to be fully loaded and display content
  await expect(page.locator('#root')).toBeVisible();
  // Any assertion will do just to wait a bit
  await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

  // Replaced waitForTimeout with an expected visibility check for elements
  await expect(page.locator('text=Fictional Discussion Report')).toBeVisible();
});
