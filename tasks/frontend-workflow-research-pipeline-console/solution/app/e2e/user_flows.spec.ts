import { test, expect } from './fixtures';
import { downloadText, fillEvaluate, fillFineTune, openApp, openResults, openRun, openSubmit, submitAndGetNewRun } from './helpers';

test.beforeEach(async ({ page }) => openApp(page));

test('6.1 submit_evaluate_updates_board_and_leaderboard', async ({ page }) => {
  await openResults(page); const before = await page.locator('tr[data-model="quill-2b-ft-1027"] .result-cell').first().textContent(); await page.getByRole('button', { name: 'Pipeline board' }).click();
  const active = Number(await page.getByTestId('active-jobs').textContent()); const dialog = await fillEvaluate(page, 'Switchboard', 3); const run = await submitAndGetNewRun(page, dialog); await expect(page.getByTestId('active-jobs')).toHaveText(String(active + 1));
  await expect(run.getByText(/trial [1-3] of 3/)).toBeVisible({ timeout: 4_000 }); await expect(run.locator('.phase-card').nth(2).locator('.status-chip')).toHaveText('Complete', { timeout: 9_000 });
  await openResults(page); await expect(page.locator('tr[data-model="quill-2b-ft-1027"] .result-cell').first()).not.toHaveText(before!);
});

test('6.2 invalid_job_submit_inline_validation', async ({ page }) => {
  const before = await page.getByTestId('run-count').textContent(); const dialog = await openSubmit(page); await page.getByLabel('Epoch count').fill('-2');
  await expect(dialog.getByText('Dataset is missing. Select a dataset.')).toBeVisible(); await expect(dialog.getByText('Count is invalid. Enter a whole number between 1 and 50.')).toBeVisible(); await expect(dialog.getByRole('button', { name: 'Submit job' })).toBeDisabled(); await expect(page.getByTestId('run-count')).toHaveText(before!);
});

test('6.3 auto_chain_finetune_to_evaluate', async ({ page }) => {
  const dialog = await fillFineTune(page, 1, true); const run = await submitAndGetNewRun(page, dialog); await expect(run.locator('.phase-card').nth(2).locator('.status-chip')).toHaveText('Running', { timeout: 6_000 });
  await run.getByRole('button', { name: /Open details/ }).click(); const entries = page.locator('.timeline-entry strong'); await expect(entries).toContainText(['Fine-tune submitted to aurora', 'Checkpoint atlas-mini-ft-1050 saved', 'Automatic evaluation triggered after training completion']);
});

test('6.4 failure_retry_preserves_completed_phases', async ({ page }) => {
  const run = page.locator('.run-strip', { hasText: 'Mosaic recovery test' }); const completed = await run.locator('.phase-card').first().textContent(); await run.getByRole('button', { name: 'Retry from checkpoint' }).click(); await expect(run.locator('.phase-card').nth(1).locator('.status-chip')).toHaveText('Running'); await expect(run.locator('.phase-card').first()).toHaveText(completed!);
  await run.getByRole('button', { name: /Open details/ }).click(); await expect(page.getByText('Manual retry resumed from checkpoint')).toBeVisible();
});

test('6.5 board_datasets_results_navigation', async ({ page }) => {
  const dialog = await openRun(page, 'run-1027'); await dialog.getByRole('textbox', { name: 'Filter timeline by status' }).click(); await page.getByRole('option', { name: 'Complete' }).click(); await page.getByRole('button', { name: 'Datasets', exact: true }).click(); await page.getByRole('button', { name: 'Results', exact: true }).click(); await page.getByRole('button', { name: 'Pipeline board' }).click(); await expect(page.getByRole('dialog').getByRole('textbox', { name: 'Filter timeline by status' })).toHaveValue('Complete');
  await page.locator('.run-drawer-overlay').click({ position: { x: 10, y: 10 } }); await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('6.6 dataset_filter_empty_state', async ({ page }) => {
  await page.getByRole('button', { name: 'Datasets', exact: true }).click(); await page.getByRole('button', { name: 'Filter runs by Echo-3K' }).click(); await expect(page.getByText('No runs use Echo-3K')).toBeVisible(); await expect(page.getByRole('button', { name: 'Clear dataset filter', exact: true })).toBeVisible();
});

test('6.7 dataset_filter_and_timeline_filters', async ({ page }) => {
  await page.getByRole('button', { name: 'Datasets', exact: true }).click(); await page.getByRole('button', { name: 'Filter runs by Helix-12K' }).click(); await expect(page.locator('.active-filter')).toBeVisible(); await page.locator('.active-filter').click(); await expect(page.getByTestId('run-count')).toHaveText('7 runs');
  const dialog = await openRun(page, 'run-1027'); await dialog.getByRole('textbox', { name: 'Filter timeline by status' }).click(); await page.getByRole('option', { name: 'Complete' }).click(); await expect(dialog.locator('.timeline-entry')).toHaveCount(3); await dialog.getByRole('button', { name: 'Clear timeline filters' }).click(); await expect(dialog.locator('.timeline-entry')).toHaveCount(6);
});

test('6.8 submit_panel_and_rollup_chrome', async ({ page }) => {
  for (const view of ['Datasets', 'Results', 'Pipeline board']) { await page.getByRole('button', { name: view, exact: true }).click(); await expect(page.locator('.rollup-strip')).toBeVisible(); }
  const active = Number(await page.getByTestId('active-jobs').textContent()); const dialog = await fillEvaluate(page); await submitAndGetNewRun(page, dialog); await expect(page.getByTestId('active-jobs')).toHaveText(String(active + 1));
});

test('6.9 submit_pause_retry_overlays', async ({ page }) => {
  let dialog = await openSubmit(page); await dialog.getByRole('button', { name: 'Cancel submission' }).click(); await expect(dialog).toHaveCount(0);
  const running = page.locator('.run-strip', { hasText: 'Nova data forge' }).locator('.phase-card').first(); await running.getByRole('button', { name: 'Pause' }).click(); await expect(running.getByRole('button', { name: 'Resume' })).toBeVisible(); await running.getByRole('button', { name: 'Resume' }).click();
  const failed = page.locator('.run-strip', { hasText: 'Mosaic recovery test' }); await failed.getByRole('button', { name: 'Retry from checkpoint' }).click(); await expect(failed.locator('.status-running')).toBeVisible();
});

test('6.10 job_config_export_and_reject_recover', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']); const before = await page.getByTestId('run-count').textContent(); let dialog = await fillEvaluate(page, 'Ledger', 3); const preview = await dialog.getByLabel('Live job configuration preview').textContent();
  await dialog.getByRole('button', { name: 'Copy' }).click(); expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(preview); const downloadEvent = page.waitForEvent('download'); await dialog.getByRole('button', { name: 'Download job-config.json' }).click(); expect(await downloadText(await downloadEvent)).toBe(preview);
  await page.setInputFiles('#job-config-file', { name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"jobType":"Evaluate"}') }); await expect(dialog.getByRole('alert')).toContainText('Import rejected'); await expect(page.getByTestId('run-count')).toHaveText(before!);
});

test('6.11 job_config_and_export_runs_flow', async ({ page }) => {
  const dialog = await fillEvaluate(page, 'Cartographer', 3); const preview = JSON.parse((await dialog.getByLabel('Live job configuration preview').textContent())!); const run = await submitAndGetNewRun(page, dialog); const runId = await run.locator('.run-id').textContent();
  const exportEvent = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export runs' }).click(); const payload = JSON.parse(await downloadText(await exportEvent)); expect(payload.runs.find((item: { runId: string }) => item.runId === runId)).toMatchObject({ ...preview, runId });
});
