import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Eval Studio' })).toBeVisible();
});

test('export traps focus, restores its launcher, and confirms copy', async ({ context, page }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const launcher = page.getByRole('button', { name: 'Export results', exact: true });
  await launcher.click();

  const dialog = page.getByRole('dialog', { name: 'Export results' });
  await expect(dialog).toBeVisible();
  await dialog.focus();
  for (let index = 0; index < 12; index += 1) {
    await page.keyboard.press('Tab');
    await expect.poll(() => dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }

  await page.getByRole('button', { name: 'Copy', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Copied' })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(launcher).toBeFocused();
});

test('result scoring breakdown starts collapsed and expands on activation', async ({ page }) => {
  await page.getByRole('table', { name: 'Evaluation results' }).locator('tbody tr').first().click();

  const disclosure = page.getByRole('button', { name: /Scoring breakdown/ });
  await expect(disclosure).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.detail-panel .rubric-row')).toHaveCount(0);

  await disclosure.click();
  await expect(disclosure).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.detail-panel .rubric-row')).toHaveCount(3);
});

test('consecutive runs produce different results and append a trend point', async ({ page }) => {
  await page.evaluate(async () => {
    await window.webmcp_invoke_tool('entity.create', { name: 'Playwright variance suite', promptIds: ['p-summary'] });
  });
  await expect(page.getByRole('heading', { name: 'Playwright variance suite' })).toBeVisible();

  await page.getByRole('button', { name: 'Run Suite', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Run complete' })).toBeVisible({ timeout: 15_000 });
  const resultsTable = page.getByRole('table', { name: 'Evaluation results' });
  const firstResults = await resultsTable.locator('tbody tr').allInnerTexts();
  await expect(page.locator('.trend-panel .trend-caption')).toHaveText('Last 1 runs');

  await page.getByRole('button', { name: 'Run again' }).click();
  await expect(page.getByRole('heading', { name: 'Evaluating prompts' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Run complete' })).toBeVisible({ timeout: 15_000 });
  const secondResults = await resultsTable.locator('tbody tr').allInnerTexts();

  expect(secondResults).not.toEqual(firstResults);
  await expect(page.locator('.trend-panel .trend-caption')).toHaveText('Last 2 runs');
  await expect(page.locator('.status-pill svg[aria-label="complete status"]')).not.toHaveCount(0);
});
