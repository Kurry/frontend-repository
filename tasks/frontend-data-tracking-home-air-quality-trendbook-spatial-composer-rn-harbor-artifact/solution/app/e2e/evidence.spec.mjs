import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('record walkthrough', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(1000);

  // Select a record
  await page.locator('text=Living Room Sensor').click();
  await page.waitForTimeout(500);

  // Mutate in spatial composer
  const slider = page.locator('input[type="range"]');
  await slider.fill('80');
  await page.locator('text=Apply Rebalance').click();

  await page.waitForTimeout(1000);

  // Test export
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('text=Export').click()
  ]);

  const path = await download.path();
  expect(path).toBeTruthy();

  await page.waitForTimeout(1000);
});
