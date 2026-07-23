import { test, expect } from './fixtures';
import { fillEvaluate, liveRegionLog, openApp, openResults, submitAndGetNewRun, watchLiveRegions } from './helpers';

test.beforeEach(async ({ page }) => openApp(page));

test('2.1 shared_state_coherence', async ({ page }) => {
  const dialog = await fillEvaluate(page, 'Switchboard', 1);
  // Snapshot right before submitting; see 1.4 submit_valid_job_adds_run in
  // core_features.spec.ts for why (background simulation ticks in real
  // time, so an earlier snapshot widens the window for unrelated drift).
  const run = await submitAndGetNewRun(page, dialog); const id = await run.locator('.run-id').textContent();
  await expect(run).toBeVisible();
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
  // Record the live region's full history rather than a point-in-time
  // snapshot; see 1.4 feedback_uses_live_regions in accessibility.spec.ts.
  await watchLiveRegions(page);
  const dialog = await fillEvaluate(page); await submitAndGetNewRun(page, dialog);
  expect((await liveRegionLog(page)).some((text) => /run-\d+ submitted/.test(text))).toBe(true);
});
