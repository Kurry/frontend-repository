import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('evidence recording', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(1000);

  // Click on a record to select it (seed-1 is in the collection)
  await page.locator('text=Service #1').first().click();
  await page.waitForTimeout(1000);

  // Quarantine bad lineage (the button is "Quarantine Bad Lineage")
  await page.getByRole('button', { name: /Quarantine Bad Lineage/i }).click();
  await page.waitForTimeout(1000);

  // Click Undo
  await page.getByRole('button', { name: /Undo/i }).click();
  await page.waitForTimeout(1000);

  // Export JSON
  await page.getByRole('button', { name: /Export JSON/i }).click();
  await page.waitForTimeout(1000);

  // Close page to flush video
  await page.close();
});
