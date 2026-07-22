import { test, expect } from '@playwright/test';

test('Branchable Celebration Campaign Studio user journey', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('h1')).toHaveText('Branchable Celebration Campaign Studio');
  await expect(page.getByText('Canvas (5x7)')).toBeVisible();

  // Click next step in workflow
  await page.getByText('source review').click();
  await expect(page.locator('.border-l-4.border-blue-600')).toHaveText('source review');
});
