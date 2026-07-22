import { test, expect } from './fixtures';
import { fillEvaluate, openApp, openSubmit, submitAndGetNewRun } from './helpers';

test.beforeEach(async ({ page }) => openApp(page));

test('4.1 empty_state_is_present', async ({ page }) => {
  await page.getByRole('button', { name: 'Datasets', exact: true }).click(); await page.getByLabel('Search datasets').fill('absent');
  await expect(page.getByRole('status')).toContainText('No datasets match'); await expect(page.getByRole('button', { name: 'Clear search' })).toBeVisible();
});

test('4.2 forms_validate_inline', async ({ page }) => {
  const dialog = await openSubmit(page); await expect(dialog.getByText('Dataset is missing. Select a dataset.')).toBeVisible(); await expect(dialog.getByText('Model is missing. Select a model.')).toBeVisible();
});

test('4.3 errors_are_actionable', async ({ page }) => {
  const dialog = await openSubmit(page); await page.getByLabel('Epoch count').fill('-1');
  await expect(dialog.getByText('Count is invalid. Enter a whole number between 1 and 50.')).toBeVisible();
});

test('4.4 actions_show_confirmation', async ({ page }) => {
  const dialog = await fillEvaluate(page); await submitAndGetNewRun(page, dialog); await expect(page.getByText(/run-\d+ submitted to aurora/).first()).toBeVisible();
});

test('4.5 async_work_shows_loading_state', async ({ page }) => {
  const running = page.locator('.run-strip', { hasText: 'Nova data forge' }).locator('.phase-card').first(); await expect(running.getByRole('progressbar')).toBeVisible();
  await expect(page.locator('.status-running.is-live').first()).toBeVisible();
});

test('4.6 destructive_actions_support_undo_or_cancel', async ({ page }) => {
  const dialog = await openSubmit(page); await expect(dialog.getByRole('button', { name: 'Cancel submission' })).toBeVisible(); await dialog.getByRole('button', { name: 'Cancel submission' }).click(); await expect(dialog).toHaveCount(0);
});

test('4.7 non_obvious_controls_have_help', async ({ page }) => {
  await page.locator('.active-filter').count();
  await page.getByLabel('Board density preference').hover(); await expect(page.getByRole('tooltip', { name: 'Change board density' })).toBeVisible();
});

test('4.8 controls_use_semantic_tags', async ({ page }) => {
  await openSubmit(page); expect(await page.getByRole('button').count()).toBeGreaterThan(10); await expect(page.getByLabel('Epoch count')).toHaveJSProperty('tagName', 'INPUT'); await expect(page.locator('label').first()).toBeVisible();
});

test('4.9 modal_supports_close_paths', async ({ page }) => {
  let dialog = await openSubmit(page); await page.getByRole('button', { name: 'Close submission panel' }).click(); await expect(dialog).toHaveCount(0);
  dialog = await openSubmit(page); await page.mouse.click(5, 5); await expect(dialog).toHaveCount(0);
});

test('4.10 long_flows_show_progress', async ({ page }) => {
  const dialog = await fillEvaluate(page, 'Switchboard', 3); const run = await submitAndGetNewRun(page, dialog);
  await expect(run.getByText(/trial \d+ of 3/)).toBeVisible(); await expect(run.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '3');
});
