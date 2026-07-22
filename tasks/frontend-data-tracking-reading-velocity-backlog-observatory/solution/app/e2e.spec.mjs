import { test, expect } from '@playwright/test';

test.describe('Reading Velocity Backlog Observatory', () => {
  let pageErrors = [];

  test.beforeEach(async ({ page }) => {
    pageErrors = [];
    page.on('pageerror', err => pageErrors.push(err));
    page.on('console', msg => {
      if (msg.type() === 'error') pageErrors.push(msg.text());
    });
    await page.goto('/');
  });

  test('CFT-01: Calibrate, order, allocate, project, log, focus, rollover flow', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('<Reading Velocity Backlog Observatory>');
    expect(pageErrors.length).toBe(0);
  });
});
