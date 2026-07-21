import { expect, test, type Page } from '@playwright/test';

async function openApp(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Dismiss coachmarks' }).click();
}

test('export and import overlays close with Escape and restore focus', async ({ page }) => {
  await openApp(page);

  const exportButton = page.getByRole('button', { name: 'Export triage report' });
  await exportButton.click();
  await expect(page.getByRole('dialog', { name: 'Export triage report' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close export triage report' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Export triage report' })).toBeHidden();
  await expect(exportButton).toBeFocused();

  const importButton = page.getByRole('button', { name: 'Import triage report' });
  await importButton.click();
  await expect(page.getByRole('dialog', { name: 'Import triage report' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close import triage report' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Import triage report' })).toBeHidden();
  await expect(importButton).toBeFocused();
});

test('rerun validates runCount inline and an immediate stop preserves the matrix', async ({ page }) => {
  await openApp(page);

  const row = page.locator('.triage-table tbody tr').first();
  const matrixBefore = await row.locator('[aria-label^="Run "]').allTextContents();
  await row.getByRole('button', { name: /Open re-run form/ }).click();

  const rerunForm = page.getByRole('form', { name: /Re-run/ });
  await rerunForm.getByRole('button', { name: 'Start re-run' }).click();
  await expect(rerunForm.getByRole('alert')).toContainText('runCount');

  await rerunForm.getByLabel('Run count').selectOption('3');
  await rerunForm.getByRole('button', { name: 'Start re-run' }).click();
  await page.getByRole('button', { name: 'Stop run' }).click();
  await page.waitForTimeout(850);

  await expect(row.locator('[aria-label^="Run "]')).toHaveText(matrixBefore);
  await expect(page.locator('.run-status')).toContainText('Completed results are frozen');
});

test('filters expose a recoverable empty state and suite switching stays usable', async ({ page }) => {
  await openApp(page);

  const rows = page.locator('.triage-table tbody tr');
  const initialCount = await rows.count();
  expect(initialCount).toBeGreaterThanOrEqual(10);

  await page.getByLabel('Search test identifiers').fill('no-test-can-match-this-query');
  const emptyState = page.getByRole('status').filter({ hasText: 'No tests match these filters' });
  await expect(emptyState).toBeVisible();
  await emptyState.getByRole('button', { name: 'Clear filters' }).click();
  await expect(rows).toHaveCount(initialCount);

  await page.getByLabel('Filter by suite').selectOption({ index: 1 });
  await expect(rows).toHaveCount(initialCount);
  await expect(page.locator('#queue-title')).toBeVisible();
});

test('theme and mobile queue controls render inside the viewport', async ({ page }) => {
  await openApp(page);

  const lightBackground = await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor);
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  const darkBackground = await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(darkBackground).not.toBe(lightBackground);

  await page.setViewportSize({ width: 375, height: 900 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);

  const firstRow = page.locator('.triage-table tbody tr').first();
  for (const control of [firstRow.getByLabel(/Reason for/), firstRow.getByRole('button', { name: /Open re-run form/ })]) {
    const box = await control.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(375);
    expect(box!.height).toBeGreaterThanOrEqual(36);
  }
});

test('exported report can restore a changed reason through import', async ({ page }) => {
  await openApp(page);

  const firstReason = page.locator('.triage-table tbody tr').first().getByLabel(/Reason for/);
  const originalReason = await firstReason.inputValue();
  const exportedReason = originalReason === 'locale-dependent' ? 'timing-sensitive' : 'locale-dependent';
  await firstReason.selectOption(exportedReason);

  await page.getByRole('button', { name: 'Export triage report' }).click();
  await page.getByRole('tab', { name: 'Triage report JSON' }).click();
  const report = await page.locator('[data-export-preview="triage-report-json"]').textContent();
  expect(report).toBeTruthy();
  await page.keyboard.press('Escape');

  await firstReason.selectOption(originalReason);
  await page.getByRole('button', { name: 'Import triage report' }).click();
  await page.getByLabel('Triage report JSON').fill(report!);
  await page.getByRole('button', { name: 'Import and replace suite' }).click();

  await expect(page.getByRole('status').filter({ hasText: /Imported \d+ tests into/ })).toBeVisible();
  await expect(page.locator('.triage-table tbody tr').first().getByLabel(/Reason for/)).toHaveValue(exportedReason);
});
