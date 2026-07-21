import { expect, test } from '@playwright/test';

test('a built-in color fork stays coherent across preview and artifact views', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/');
  await page.locator('[data-row="builtin-cupcake"] [data-select="builtin-cupcake"]').click();

  const primary = page.getByLabel('Primary color');
  await primary.focus();
  await primary.evaluate((input) => {
    input.value = '#123456';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  await expect(page.locator('#my-count')).toHaveText('1');
  await expect(page.locator('#theme-name')).toHaveValue('cupcake-edit');
  await expect(primary).toHaveValue('#123456');
  await expect(page.locator('[data-row^="custom-cupcake-edit"]')).toContainText('cupcake-edit');

  await page.getByRole('tab', { name: 'Component Variants' }).click();
  await expect(page.locator('[data-panel="variants"]')).toBeVisible();
  await expect(primary).toHaveValue('#123456');

  await page.locator('#theme-name').fill('evening-tide');
  await page.locator('#theme-name').press('Enter');
  await expect(page.locator('#my-themes')).toContainText('evening-tide');

  await page.getByRole('button', { name: /^CSS / }).click();
  await expect(page.getByRole('dialog', { name: 'Artifact Center' })).toBeVisible();
  await expect(page.locator('#artifact-code')).toContainText('[data-theme="evening-tide"]');
  await expect(page.locator('#artifact-code')).toContainText('--color-primary: #123456;');

  expect(pageErrors).toEqual([]);
});

test('declared-theme JSON preserves its generated timestamp through import', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^CSS / }).click();
  await page.getByRole('tab', { name: 'JSON' }).click();

  const exported = await page.locator('#artifact-code').textContent();
  const before = JSON.parse(exported);
  await page.locator('#import-src').fill(exported);
  await page.getByRole('button', { name: 'Import Theme' }).click();

  await expect(page.locator('#theme-name')).toHaveValue('light-2');
  await expect(page.locator('#my-count')).toHaveText('1');
  const imported = JSON.parse(await page.locator('#artifact-code').textContent());
  expect(imported.generatedAt).toBe(before.generatedAt);
});
