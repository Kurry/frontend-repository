import { expect, test } from '@playwright/test';

test('filter-add-clear and reload always expose the exact persisted net worth', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('main')).toBeVisible();

  const holdingForm = page.locator('#holding-form');
  await holdingForm.getByLabel('Name').fill('Transition Test Holding');
  await holdingForm.getByLabel('Symbol').fill('TTH');

  // Continue the add flow while a different asset class is visible.
  await page.getByLabel('Filter by asset class').selectOption('Cash');
  await expect(page.locator('#net-worth')).toHaveText('$8,500');

  await holdingForm.getByLabel('Asset class').selectOption('Equity');
  await holdingForm.getByLabel('Quantity').fill('2');
  await holdingForm.getByLabel('Unit price').fill('150');
  await holdingForm.getByLabel('Currency').selectOption('USD');
  await holdingForm.getByLabel('Data source').selectOption('MANUAL');
  await holdingForm.getByRole('button', { name: 'Save holding' }).click();

  await expect(page.getByRole('row', { name: /Transition Test Holding/ })).toHaveCount(0);
  await page.getByLabel('Filter by asset class').selectOption('all');

  // The change handler must publish the derived value synchronously, not an
  // intermediate animation frame from the previously filtered portfolio.
  expect(await page.locator('#net-worth').textContent()).toBe('$38,069');
  await expect(page.getByRole('row', { name: /Transition Test Holding/ })).toHaveCount(1);
  await expect(page.locator('#portfolio-meta')).toContainText('5 holdings visible');

  await page.reload();
  expect(await page.locator('#net-worth').textContent()).toBe('$38,069');
  await expect(page.getByRole('row', { name: /Transition Test Holding/ })).toHaveCount(1);
});

test('positions sharing a symbol use their own unit price when no BUY history exists', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const holdingForm = page.locator('#holding-form');
  await holdingForm.getByLabel('Name').fill('Reserve cash');
  await holdingForm.getByLabel('Symbol').fill('USD');
  await holdingForm.getByLabel('Asset class').selectOption('Cash');
  await holdingForm.getByLabel('Quantity').fill('2');
  await holdingForm.getByLabel('Unit price').fill('50');
  await holdingForm.getByLabel('Currency').selectOption('USD');
  await holdingForm.getByLabel('Data source').selectOption('MANUAL');
  await holdingForm.getByRole('button', { name: 'Save holding' }).click();

  await page.getByRole('row', { name: /Reserve cash/ }).click();
  const detail = page.getByRole('complementary', { name: 'Reserve cash' });
  await expect(detail).toContainText('Average unit cost$50');
  await expect(detail).toContainText('Cost basis$100');
  await expect(detail).toContainText('Unrealized gain+$0');
});
