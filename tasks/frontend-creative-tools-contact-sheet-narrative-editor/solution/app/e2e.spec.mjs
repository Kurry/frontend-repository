import { test, expect } from '@playwright/test';
import fs from 'fs';

test('WebM Video Recording of Narrative Editor flow', async ({ page, browser }) => {
  await page.goto('http://127.0.0.1:3000');
  await expect(page.locator('h1')).toContainText('Contact Sheet Narrative Editor');
  await page.locator('.cursor-pointer').nth(0).click();
  await page.locator('.cursor-pointer').nth(1).click({ modifiers: ['Shift'] });
  await page.waitForTimeout(1000);
  await page.locator('button:has-text("5★")').click();
  await page.waitForTimeout(2000);
});
