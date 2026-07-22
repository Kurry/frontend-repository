import { test, expect } from './fixtures';
import { fillEvaluate, openApp, openResults, submitAndGetNewRun } from './helpers';

test.beforeEach(async ({ page }) => openApp(page));

test('2.1 shared_state_coherence', async ({ page }) => {
  const dialog = await fillEvaluate(page, 'Switchboard', 1); const run = await submitAndGetNewRun(page, dialog); const id = await run.locator('.run-id').textContent();
  await expect(page.getByTestId('active-jobs')).toHaveText('4');
  await run.getByRole('button', { name: /Open details/ }).click(); await expect(page.getByRole('dialog')).toContainText(id!);
  await page.getByRole('button', { name: 'Results', exact: true }).click(); await expect(page.getByRole('heading', { name: 'Results', exact: true })).toBeVisible();
});

test('2.2 no_storage_reload_seeded', async ({ page }) => {
  const dialog = await fillEvaluate(page); await submitAndGetNewRun(page, dialog);
  await page.getByRole('button', { name: 'Datasets', exact: true }).click(); await page.getByRole('button', { name: 'Filter runs by Helix-12K' }).click();
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
  await page.reload(); await expect(page.getByTestId('run-count')).toHaveText('7 runs'); await expect(page.locator('.active-filter')).toHaveCount(0);
});

test('2.5 console_clean_during_session', async ({ page }) => {
  await page.getByRole('button', { name: 'Datasets', exact: true }).click(); await page.getByRole('button', { name: 'Results', exact: true }).click(); await page.getByRole('button', { name: 'Pipeline board' }).click();
  await page.waitForTimeout(2_200);
  // The shared fixture fails this test after teardown on warning, error, or pageerror.
  await expect(page.getByText('advancing live')).toBeVisible();
});

test('2.6 load_and_rapid_input_performance', async ({ page }) => {
  const start = Date.now(); await page.reload(); await expect(page.getByRole('button', { name: 'Submit job' })).toBeEnabled(); expect(Date.now() - start).toBeLessThan(2_000);
  for (let i = 0; i < 4; i++) { await page.getByRole('button', { name: 'Datasets', exact: true }).click(); await page.getByRole('button', { name: 'Results', exact: true }).click(); await page.getByRole('button', { name: 'Pipeline board' }).click(); }
  await expect(page.getByText('advancing live')).toBeVisible();
});

test('2.7 keyboard_and_dialog_accessibility', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Submit job' }).first(); await trigger.focus(); await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog'); await expect(dialog).toBeVisible(); expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape'); await expect(trigger).toBeFocused();
  await trigger.click(); await expect(page.getByText('Dataset is missing. Select a dataset.')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Dataset' })).toHaveAttribute('aria-invalid', 'true');
});

test('2.8 live_region_announcements', async ({ page }) => {
  const dialog = await fillEvaluate(page); await submitAndGetNewRun(page, dialog);
  await expect(page.locator('.sr-only[aria-live="polite"]').filter({ hasText: /run-\d+ submitted/ })).toBeAttached();
});
