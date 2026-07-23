import { test, expect } from './fixtures';
import { activeJobs, downloadText, fillEvaluate, fillFineTune, openApp, openResults, openRun, openSubmit, submitAndGetNewRun } from './helpers';

test.beforeEach(async ({ page }) => openApp(page));

test('1.1 seeded_board_strips_with_statuses', async ({ page }) => {
  const strips = page.locator('.run-strip');
  await expect(strips).toHaveCount(7);
  for (let i = 0; i < await strips.count(); i++) {
    await expect(strips.nth(i).locator('.phase-card')).toHaveCount(3);
    await expect(strips.nth(i).locator('.connector')).toHaveCount(2);
    await expect(strips.nth(i).locator('.phase-card h3')).toHaveText(['Data generation', 'Fine-tuning', 'Evaluation']);
  }
  await expect(page.locator('.status-chip', { hasText: 'Running' }).first()).toBeVisible();
  await expect(page.locator('.status-chip', { hasText: 'Failed' })).toBeVisible();
  expect(await page.locator('.run-strip').evaluateAll((runs) => runs.filter((run) => [...run.querySelectorAll('.status-chip')].every((chip) => chip.textContent?.trim() === 'Complete')).length)).toBeGreaterThanOrEqual(2);
});

test('1.2 phase_card_config_summary', async ({ page }) => {
  const cards = page.locator('.phase-card');
  for (let i = 0; i < await cards.count(); i++) {
    await expect(cards.nth(i).locator('dt')).toHaveText(['Dataset', 'Model', /Epochs|Trials/, 'Cluster']);
    await expect(cards.nth(i).locator('dd')).toHaveCount(4);
  }
});

test('1.3 running_phase_progress_advances', async ({ page }) => {
  const data = page.locator('.run-strip', { hasText: 'Nova data forge' }).locator('.phase-card').first();
  const fine = page.locator('.run-strip', { hasText: 'Orbit reasoning tune' }).locator('.phase-card').nth(1);
  const evaluation = page.locator('.run-strip', { hasText: 'Prism benchmark pass' }).locator('.phase-card').nth(2);
  const beforeData = await data.getByText(/\d+ \/ 2,000/).textContent();
  const beforeEpoch = await fine.getByText(/epoch \d+ of 12/).textContent();
  const beforeTrial = await evaluation.getByText(/trial \d+ of 10/).textContent();
  const beforeMean = await evaluation.locator('.running-mean b').textContent();
  await expect.poll(() => data.getByText(/\d+ \/ 2,000/).textContent()).not.toBe(beforeData);
  await expect.poll(() => fine.getByText(/epoch \d+ of 12/).textContent()).not.toBe(beforeEpoch);
  await expect.poll(() => evaluation.getByText(/trial \d+ of 10/).textContent()).not.toBe(beforeTrial);
  await expect.poll(() => evaluation.locator('.running-mean b').textContent()).not.toBe(beforeMean);
  expect(await fine.locator('.recharts-area-curve').count()).toBeGreaterThan(0);
});

test('1.4 submit_valid_job_adds_run', async ({ page }) => {
  const dialog = await fillEvaluate(page);
  // Snapshot right before submitting, not before the multi-step dialog fill:
  // the board's background simulation ticks in real time, so capturing
  // "before" any earlier than necessary widens the window in which an
  // unrelated seeded run can legitimately finish and shift this count.
  const beforeActive = await activeJobs(page);
  await submitAndGetNewRun(page, dialog);
  expect(await activeJobs(page)).toBe(beforeActive + 1);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('1.5 evaluate_reveals_conditional_fields', async ({ page }) => {
  await openSubmit(page);
  await page.getByRole('textbox', { name: 'Job type' }).click();
  await expect(page.getByRole('option')).toHaveText(['Data generation', 'Fine-tune', 'Evaluate']);
  await page.getByRole('option', { name: 'Evaluate' }).click();
  await expect(page.getByRole('textbox', { name: 'Benchmark' })).toBeVisible();
  await expect(page.getByLabel('Repetition count')).toHaveValue('3');
  await page.getByRole('textbox', { name: 'Job type' }).click(); await page.getByRole('option', { name: 'Data generation' }).click();
  await expect(page.getByRole('textbox', { name: 'Benchmark' })).toHaveCount(0);
});

test('1.6 invalid_submit_blocked_with_messages', async ({ page }) => {
  const before = await page.getByTestId('run-count').textContent();
  const dialog = await openSubmit(page);
  await expect(dialog.getByText('Dataset is missing. Select a dataset.')).toBeVisible();
  await page.getByLabel('Epoch count').fill('0');
  await expect(dialog.getByText('Count is invalid. Enter a whole number between 1 and 50.')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Submit job' })).toBeDisabled();
  await expect(page.getByTestId('run-count')).toHaveText(before!);
});

test('1.7 config_preview_and_suggestion_chips', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const dialog = await openSubmit(page);
  await expect(dialog.locator('.suggestions button')).toHaveCount(3);
  await dialog.getByRole('button', { name: 'Switchboard eval' }).click();
  const preview = await dialog.getByLabel('Live job configuration preview').textContent();
  expect(preview).toContain('"benchmark": "Switchboard"');
  expect(await dialog.getByLabel('Live job configuration preview').evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(/mono/i);
  await dialog.getByRole('button', { name: 'Copy' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(preview);
  await expect(page.getByText('Exact job config copied to clipboard').first()).toBeVisible();
});

test('1.8 chained_selects_gated_by_completion', async ({ page }) => {
  await openSubmit(page);
  await expect(page.getByText('Only datasets from completed generation runs can be selected.')).toBeVisible();
  await page.getByRole('textbox', { name: 'Dataset' }).click();
  await expect(page.getByRole('option', { name: 'Helix-12K' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Echo-3K' })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.getByRole('textbox', { name: 'Job type' }).click(); await page.getByRole('option', { name: 'Evaluate' }).click();
  await expect(page.getByText('Only checkpoints produced by a completed fine-tune can be selected.')).toBeVisible();
  await page.getByRole('textbox', { name: 'Model' }).click();
  await expect(page.getByRole('option', { name: 'quill-2b-ft-1027' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'atlas-mini' })).toHaveCount(0);
});

test('1.9 auto_trigger_starts_evaluation', async ({ page }) => {
  const dialog = await fillFineTune(page, 1, true);
  const run = await submitAndGetNewRun(page, dialog);
  await expect(run.locator('.phase-card').nth(1).locator('.status-chip')).toHaveText('Complete', { timeout: 6_000 });
  await expect(run.locator('.phase-card').nth(2).locator('.status-chip')).toHaveText('Running');
  await run.getByRole('button', { name: /Open details/ }).click();
  await expect(page.getByText('Automatic evaluation triggered after training completion')).toBeVisible();
});

test('1.10 failed_phase_retry_metadata', async ({ page }) => {
  const failed = page.locator('.run-strip', { hasText: 'Mosaic recovery test' }).locator('.phase-card').nth(1);
  await expect(failed).toContainText('Worker preemption');
  await expect(failed).toContainText('attempt 2 of 3');
  const before = await failed.locator('[data-backoff]').getAttribute('data-backoff');
  await expect.poll(() => failed.locator('[data-backoff]').getAttribute('data-backoff')).not.toBe(before);
  await expect(failed).toContainText('checkpoint retained');
  await expect(failed.getByRole('button', { name: 'Retry from checkpoint' })).toBeVisible();
});

test('1.11 resume_from_checkpoint_frozen_history', async ({ page }) => {
  const running = page.locator('.run-strip', { hasText: 'Nova data forge' }).locator('.phase-card').first();
  await running.getByRole('button', { name: 'Pause' }).click();
  const checkpoint = await running.getByText(/\d+ \/ 2,000/).textContent();
  await page.waitForTimeout(1_300);
  await expect(running.getByText(/\d+ \/ 2,000/)).toHaveText(checkpoint!);
  await running.getByRole('button', { name: 'Resume' }).click();
  await expect.poll(() => running.getByText(/\d+ \/ 2,000/).textContent()).not.toBe(checkpoint);
  const failedRun = page.locator('.run-strip', { hasText: 'Mosaic recovery test' });
  const completeText = await failedRun.locator('.phase-card').first().textContent();
  await failedRun.getByRole('button', { name: 'Retry from checkpoint' }).click();
  await expect(failedRun.locator('.phase-card').nth(1).locator('.status-chip')).toHaveText('Running');
  await expect(failedRun.locator('.phase-card').first()).toHaveText(completeText!);
});

test('1.12 datasets_catalog_and_run_filter', async ({ page }) => {
  await page.getByRole('button', { name: 'Datasets', exact: true }).click();
  await expect(page.locator('.dataset-card')).toHaveCount(7);
  await expect(page.locator('.dataset-card').first()).toContainText('Generation provenance');
  await expect(page.locator('.dataset-card').first().locator('.recharts-wrapper')).toBeVisible();
  await page.getByRole('button', { name: 'Filter runs by Helix-12K' }).click();
  await expect(page.locator('.active-filter')).toContainText('Helix-12K');
  await page.locator('.active-filter').click();
  await expect(page.getByTestId('run-count')).toHaveText('7 runs');
  await page.getByRole('button', { name: 'Datasets', exact: true }).click();
  await page.getByRole('button', { name: 'Filter runs by Echo-3K' }).click();
  await expect(page.getByText('No runs use Echo-3K')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Clear dataset filter', exact: true })).toBeVisible();
});

test('1.13 leaderboard_cells_and_sort_roundtrip', async ({ page }) => {
  await openResults(page);
  const cell = page.locator('.result-cell').first();
  await expect(cell).toContainText(/\d\.\d{3}/); await expect(cell).toContainText('±'); await expect(cell).toContainText('$'); await expect(cell).toContainText('trials');
  const models = () => page.locator('.leaderboard-row').evaluateAll((rows) => rows.map((row) => row.getAttribute('data-model')));
  await page.getByRole('button', { name: /Sort by Mean/ }).click(); const asc = await models();
  await page.getByRole('button', { name: /Sort by Mean/ }).click(); const desc = await models();
  expect(desc).toEqual([...asc].reverse());
});

test('1.14 comparison_delta_derives_live', async ({ page }) => {
  await openResults(page);
  const before = await page.locator('.delta-strip').textContent();
  await page.getByRole('textbox', { name: 'First comparison model' }).click();
  await page.getByRole('option', { name: 'lumen-ft-0998' }).click();
  await expect(page.locator('.delta-strip')).not.toHaveText(before!);
  await expect(page.locator('.comparison-chart .recharts-bar')).toHaveCount(2);
  await expect(page.locator('.delta-strip > div')).toHaveCount(3);
});

test('1.15 trial_drilldown_trace_streams', async ({ page }) => {
  await openResults(page); await page.locator('.result-cell').first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('.trial-row').first()).toContainText(/score/);
  await expect(dialog.locator('.trial-row').first()).toContainText(/\d+s/);
  await dialog.locator('.mantine-Accordion-control').first().click();
  await expect(dialog.getByText('streaming trace…')).toBeVisible();
  const early = await dialog.locator('.trace-box p').textContent();
  await expect(dialog.getByText('streaming trace…')).toHaveCount(0, { timeout: 5_000 });
  expect((await dialog.locator('.trace-box p').textContent())!.length).toBeGreaterThan(early!.length);
});

test('1.16 timeline_filter_and_highlight', async ({ page }) => {
  const dialog = await openRun(page, 'run-1027');
  await expect(dialog.locator('.timeline-entry')).toHaveCount(6);
  await dialog.getByRole('textbox', { name: 'Filter timeline by phase' }).click(); await page.getByRole('option', { name: 'Evaluation' }).click();
  await expect(dialog.locator('.timeline-entry')).toHaveCount(2);
  await dialog.locator('.timeline-entry').first().click();
  await expect(dialog.locator('.phase-card.highlighted')).toHaveAttribute('data-phase', 'evaluation');
});

test('1.17 rollups_track_shared_state', async ({ page }) => {
  const dialog = await fillEvaluate(page);
  const cost = await page.locator('.rollup', { hasText: 'Simulated cost' }).locator('strong').textContent();
  await submitAndGetNewRun(page, dialog);
  const liveActive = await page.locator('.run-strip:has(.status-running)').count();
  expect(await activeJobs(page)).toBe(liveActive);
  await expect.poll(() => page.locator('.rollup', { hasText: 'Simulated cost' }).locator('strong').textContent()).not.toBe(cost);
  await page.getByRole('button', { name: 'Datasets', exact: true }).click(); await expect(page.locator('.rollup-strip')).toBeVisible();
});

test('1.18 double_submit_creates_one_run', async ({ page }) => {
  const dialog = await fillEvaluate(page);
  // Snapshot right before submitting; see 1.4 submit_valid_job_adds_run.
  const beforeRuns = Number((await page.getByTestId('run-count').textContent())!.match(/\d+/)![0]);
  const beforeActive = await activeJobs(page);
  await dialog.getByRole('button', { name: 'Submit job' }).dblclick();
  await expect(page.getByTestId('run-count')).toHaveText(`${beforeRuns + 1} runs`);
  expect(await activeJobs(page)).toBe(beforeActive + 1);
});

test('1.19 eval_completion_updates_leaderboard', async ({ page }) => {
  await openResults(page);
  const target = page.locator('tr[data-model="quill-2b-ft-1027"] .result-cell').first();
  const before = await target.textContent();
  await page.getByRole('button', { name: 'Pipeline board' }).click();
  const dialog = await fillEvaluate(page, 'Switchboard', 1); await submitAndGetNewRun(page, dialog);
  await expect(page.locator('.run-strip').first().locator('.phase-card').nth(2).locator('.status-chip')).toHaveText('Complete', { timeout: 6_000 });
  await openResults(page);
  await expect(page.locator('tr[data-model="quill-2b-ft-1027"] .result-cell').first()).not.toHaveText(before!);
});

test('1.22 job_config_request_body_field_contract', async ({ page }) => {
  const dialog = await fillEvaluate(page, 'Ledger', 10);
  const preview = JSON.parse((await dialog.getByLabel('Live job configuration preview').textContent())!);
  expect(preview).toEqual({ jobType: 'Evaluate', dataset: 'Helix-12K', model: 'quill-2b-ft-1027', count: 5, cluster: 'aurora', benchmark: 'Ledger', repetitions: 10 });
  await page.getByLabel('Repetition count').fill('11');
  await expect(dialog.getByText('Repetitions is invalid. Enter a whole number between 1 and 10.')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Submit job' })).toBeDisabled();
});

test('1.23 download_job_config_and_export_runs', async ({ page }) => {
  const dialog = await fillEvaluate(page, 'Ledger', 3);
  const preview = await dialog.getByLabel('Live job configuration preview').textContent();
  const configEvent = page.waitForEvent('download'); await dialog.getByRole('button', { name: 'Download job-config.json' }).click();
  const configDownload = await configEvent; expect(configDownload.suggestedFilename()).toBe('job-config.json'); expect(await downloadText(configDownload)).toBe(preview);
  await submitAndGetNewRun(page, dialog);
  const exportEvent = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export runs' }).click();
  const exported = JSON.parse(await downloadText(await exportEvent));
  expect(exported.schemaVersion).toBe(1); expect(exported.generatedAt).toMatch(/Z$/);
  expect(exported.runs[0]).toMatchObject({ runId: expect.stringMatching(/^run-/), benchmark: 'Ledger', repetitions: 3 });
});
