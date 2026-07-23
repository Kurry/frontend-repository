import { test, expect } from './fixtures';
import { fillEvaluate, openApp, openResults, openRun, submitAndGetNewRun } from './helpers';

test.beforeEach(async ({ page }) => openApp(page));

test('14.1 multi_facet_round_trip', async ({ page }) => {
  const dialog = await fillEvaluate(page); await submitAndGetNewRun(page, dialog);
  await openResults(page); await page.getByRole('button', { name: /Sort by Cost/ }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Pipeline board', exact: true })).toBeVisible();
  await expect(page.getByTestId('run-count')).toHaveText('7 runs');
  await openResults(page); await expect(page.locator('.leaderboard')).toHaveAttribute('data-sort', 'mean-desc');
});

test('14.2 sort_reversal_proves_live_data', async ({ page }) => {
  await openResults(page);
  const order = () => page.locator('.leaderboard-row').evaluateAll((rows) => rows.map((r) => r.getAttribute('data-model')));
  await page.getByRole('button', { name: /Sort by Trials/ }).click(); const asc = await order();
  await page.getByRole('button', { name: /Sort by Trials/ }).click(); const desc = await order();
  expect(desc).toEqual([...asc].reverse());
});

test('14.3 derived_view_responds_to_input', async ({ page }) => {
  await openResults(page); const before = await page.locator('.delta-strip').textContent();
  await page.getByRole('textbox', { name: 'Second comparison model' }).click(); await page.getByRole('option', { name: 'lumen-ft-0998' }).click();
  await expect(page.locator('.delta-strip')).not.toHaveText(before!);
});

test('14.4 cross_view_echo_without_reload', async ({ page }) => {
  const dialog = await fillEvaluate(page, 'Ledger', 1); const run = await submitAndGetNewRun(page, dialog);
  const id = await run.locator('.run-id').textContent();
  await run.getByRole('button', { name: /Open details/ }).click();
  await expect(page.getByRole('dialog')).toContainText(id!);
  await expect(page.getByRole('dialog')).toContainText('Evaluate submitted');
});

test('14.5 count_delta_is_exact', async ({ page }) => {
  const before = Number((await page.getByTestId('run-count').textContent())!.match(/\d+/)![0]);
  const dialog = await fillEvaluate(page); await submitAndGetNewRun(page, dialog);
  expect(Number((await page.getByTestId('run-count').textContent())!.match(/\d+/)![0]) - before).toBe(1);
});

test('14.6 different_inputs_change_outcomes', async ({ page }) => {
  await openResults(page); const before = await page.locator('.delta-strip').textContent();
  await page.getByRole('textbox', { name: 'First comparison model' }).click(); await page.getByRole('option', { name: 'lumen-ft-0998' }).click(); const after = await page.locator('.delta-strip').textContent();
  expect(after).not.toBe(before); expect(after).toContain('lumen-ft-0998');
});

test('14.7 interleaved_flows_preserve_state', async ({ page }) => {
  const detail = await openRun(page, 'run-1027');
  await detail.getByRole('textbox', { name: 'Filter timeline by phase' }).click(); await page.getByRole('option', { name: 'Evaluation' }).click();
  await page.getByRole('button', { name: 'Datasets', exact: true }).click(); await page.getByRole('button', { name: 'Results', exact: true }).click(); await page.getByRole('button', { name: 'Pipeline board' }).click();
  await expect(page.getByRole('dialog').getByRole('textbox', { name: 'Filter timeline by phase' })).toHaveValue('Evaluation');
});

test('14.8 empty_to_repopulated_round_trip', async ({ page }) => {
  await page.getByRole('button', { name: 'Datasets', exact: true }).click();
  await page.getByLabel('Search datasets').fill('no-such-dataset');
  await expect(page.locator('.dataset-card')).toHaveCount(0); await expect(page.getByText(/No datasets match/)).toBeVisible();
  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(page.locator('.dataset-card')).toHaveCount(7);
});
