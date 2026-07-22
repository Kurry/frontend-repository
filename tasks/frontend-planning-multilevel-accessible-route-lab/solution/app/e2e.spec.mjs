import { test, expect } from '@playwright/test';

test('Multilevel Accessible Route Lab Walkthrough', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Wait for the app to load
  await expect(page.getByText('Multilevel Accessible Route Lab')).toBeVisible();

  // Add stops
  await page.getByRole('button', { name: '+ Main Gate' }).click();
  await page.getByRole('button', { name: '+ South Lawn' }).click();

  // Wait to see the updated stops
  await expect(page.getByText('1. Main Gate')).toBeVisible();
  await expect(page.getByText('2. South Lawn')).toBeVisible();

  // Change dwell time on first stop
  const dwellInputs = page.locator('input[type="number"]');
  await dwellInputs.first().fill('10');

  // Change profile
  await page.locator('select').selectOption('step-free');

  // Change departure time
  await page.locator('input[type="range"]').fill('600'); // 10:00 AM

  // Add a third stop
  await page.getByRole('button', { name: '+ Library Stacks' }).click();

});
