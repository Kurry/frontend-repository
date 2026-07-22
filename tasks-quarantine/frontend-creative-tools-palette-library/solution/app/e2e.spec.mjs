import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test('app renders main layout and title', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveTitle(/Palette Library/i);
  await expect(page.locator('#app, body')).toBeVisible();
});

test('zero console errors on load', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  expect(errors).toHaveLength(0);
});

test('responsive mobile view', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
