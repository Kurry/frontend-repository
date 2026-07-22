import { test, expect } from '@playwright/test';

test('Cognitive Load Day Sculptor flow', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Wait for the app to load
  await expect(page.locator('text=Cognitive Load Day Sculptor').first()).toBeVisible();

  // Create Checkpoint
  await page.click('text=Checkpoint');

  // Start focus (if blocks are present)
  // Our blocks are initially empty, so we just verify the state.
  await expect(page.locator('text=Capacity Time-Block Canvas').first()).toBeVisible();
  await expect(page.locator('text=Backlog').first()).toBeVisible();
});
