// ============================================================================
// CANONICAL ORACLE E2E SUITE — workspace contract (do not edit this region).
// Owned by `corpuscheck propagate`; the canonical region ends at the marker
// below. ADD task-specific criterion tests AFTER the marker — one test per
// rubric criterion, named `test('<id> <criterion_name>', ...)`.
//
// Run: start the app first (`npm run start`, port 3000), then
//   npx playwright test -c e2e.playwright.config.mjs
// (the sibling canonical config pins discovery to this file, so it works even
// when the app has its own playwright.config for other suites).
// Requires devDependency: @playwright/test (^1.x) — use the app's EXISTING
// @playwright/test if present; never install a second copy (duplicate
// instances break test loading).
// ============================================================================
import { test as base, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

export const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`console.error: ${m.text()}`); });
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    await use(page);
    expect(errors, 'zero console/page errors required').toEqual([]);
  },
});
export { expect };

export const listTools = (page) => page.evaluate(async () => {
  const r = await window.webmcp_list_tools();
  return typeof r === 'string' ? JSON.parse(r) : r;
});
export const invokeTool = (page, name, args = {}) => page.evaluate(async ([n, a]) => {
  const r = await window.webmcp_invoke_tool(n, a);
  try { return typeof r === 'string' ? JSON.parse(r) : r; } catch { return r; }
}, [name, args]);

test.describe('workspace contract (canonical)', () => {
  test('serves non-empty app with zero console errors', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len, 'body renders visible content').toBeGreaterThan(0);
  });

  test('webmcp surface is registered and well-formed', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const kinds = await page.evaluate(() => ({
      session_info: typeof window.webmcp_session_info,
      list_tools: typeof window.webmcp_list_tools,
      invoke_tool: typeof window.webmcp_invoke_tool,
    }));
    expect(kinds).toEqual({ session_info: 'function', list_tools: 'function', invoke_tool: 'function' });
    const tools = await listTools(page);
    const arr = Array.isArray(tools) ? tools : tools?.tools ?? [];
    expect(arr.length, 'at least one webmcp tool registered').toBeGreaterThan(0);
    for (const t of arr) expect(typeof (t.name ?? t.id), 'every tool has a name').toBe('string');
  });

  test('reduced motion behaviorally suppresses animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // Install the collector before navigation so load/hydration animations are
    // observed too. Keep it running through network idle and a settled 1.5s
    // window so late-starting effects cannot escape the assertion.
    await page.addInitScript(() => {
      window.__reducedMotionOffenders = [];
      const seen = new Set();
      const sample = () => {
        for (const animation of document.getAnimations({ subtree: true })) {
          if (animation.playState !== 'running') continue;
          let timing = {};
          try { timing = animation.effect?.getComputedTiming?.() ?? {}; } catch { /* detached */ }
          const duration = typeof timing.duration === 'number' ? timing.duration : 0;
          if (duration <= 1) continue;
          const offender = {
            kind: animation.constructor?.name ?? 'Animation',
            name: animation.animationName ?? animation.transitionProperty ?? animation.id ?? '(anonymous)',
            duration,
            iterations: timing.iterations ?? 1,
          };
          const key = JSON.stringify(offender);
          if (!seen.has(key)) {
            seen.add(key);
            window.__reducedMotionOffenders.push(offender);
          }
        }
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Precondition sanity check: the emulation actually reaches the app.
    const reduced = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
    expect(reduced, 'precondition: app sees prefers-reduced-motion: reduce').toBe(true);
    // Observe every frame for another 1.5s after load settles and assert on
    // everything seen since the document started.
    // Finished, idle, or paused effects and durations <=1ms are allowed; any
    // meaningfully timed RUNNING effect at any sample is a reduced-motion
    // failure. Apps with zero animations pass vacuously (the render/console
    // test still gates them).
    await page.waitForTimeout(1500);
    const offenders = await page.evaluate(() => window.__reducedMotionOffenders ?? []);
    expect(offenders, 'no running animation/transition with meaningful duration under reduced motion').toEqual([]);
  });

  test('no horizontal overflow at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, 'no horizontal page scroll at 375px').toBeLessThanOrEqual(1);
  });
});

// ==== END CANONICAL REGION — add task-specific criterion tests below. ====

const COMPLETED_ID = 'exp-onboarding-tone';
const PENDING_ID = 'exp-launch-copy';
const VALID_EXPERIMENT = {
  name: 'Playwright conversion trial',
  hypothesis: 'Evidence-first prompting improves answer quality.',
  successMetric: 'factual-accuracy',
  minimumSampleSize: 3,
  variants: [
    { title: 'Control', promptId: 'prompt-concise-v3', model: 'Larkspur-2', temperature: 0.4, trafficAllocation: 50 },
    { title: 'Treatment', promptId: 'prompt-evidence-v2', model: 'Meridian-XL', temperature: 0.6, trafficAllocation: 50 },
  ],
};

async function openApp(page) {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
}

async function selectExperiment(page, experimentId = COMPLETED_ID) {
  const result = await invokeTool(page, 'entity_select', { experimentId });
  expect(result).toMatchObject({ ok: true });
  await expect(page.locator('.results-panel')).toBeVisible();
}

async function submitExperiment(page, values = VALID_EXPERIMENT) {
  return invokeTool(page, 'form_submit', { workflow: 'experiment-designer', values });
}

async function openReport(page, experimentId = COMPLETED_ID) {
  const result = await invokeTool(page, 'artifact_export', { experimentId, format: 'experiment-report' });
  expect(result).toMatchObject({ ok: true });
  const preview = page.getByLabel('Experiment Report JSON preview');
  await expect(preview).toBeVisible();
  return JSON.parse(await preview.textContent());
}

async function statSnapshot(page) {
  return page.locator('.summary-strip').evaluate((node) => node.innerText);
}

async function flagFirstResponse(page, experimentId = COMPLETED_ID) {
  await selectExperiment(page, experimentId);
  await page.getByRole('tab', { name: 'Inspector' }).click();
  const card = page.locator('.response-card').first();
  await card.scrollIntoViewIfNeeded();
  const responseId = await card.locator('.sample-id').textContent();
  await card.getByRole('button', { name: 'Flag outlier' }).click();
  await expect(card).toHaveClass(/flagged/);
  return responseId;
}

async function createViaUi(page, name = 'UI-created experiment') {
  await page.getByRole('button', { name: 'New Experiment' }).click();
  await page.getByLabel('Experiment name').fill(name);
  await page.getByLabel('Hypothesis').fill('A complete UI flow should create exactly one pending experiment.');
  await page.getByRole('button', { name: 'Create Experiment' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
}

const experimentButton = (page, name) => page.getByRole('button', { name, exact: true });

async function selectRow(row) {
  await row.locator('.cds--checkbox-label').click();
}

async function setAllocation(page, index, value) {
  const slider = page.getByRole('slider').nth(index);
  await slider.focus();
  const current = Number(await slider.getAttribute('aria-valuenow'));
  const direction = value >= current ? 1 : -1;
  const key = direction === 1 ? 'ArrowRight' : 'ArrowLeft';
  const presses = Math.abs(value - current);
  for (let offset = 1; offset <= presses; offset += 1) {
    const expected = current + direction * offset;
    await slider.press(key);
    await expect(slider).toHaveAttribute('aria-valuenow', String(expected));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  }
  await expect(slider).toHaveAttribute('aria-valuenow', String(value));
  return slider;
}

test.describe('deterministic rubric criteria', () => {
  test.beforeEach(async ({ page }) => openApp(page));

  test('1.1 seeded_library_table', async ({ page }) => {
    const table = page.locator('.experiment-table');
    await expect(table).toBeVisible();
    await expect(table.locator('thead')).toContainText('NameVariantsSample sizeStatusStartedActions');
    await expect(table.locator('tbody tr')).toHaveCount(5);
    await expect(table.locator('tbody')).toContainText('Completed');
    expect(await table.getByText('Completed', { exact: true }).count()).toBeGreaterThanOrEqual(3);
    expect(await table.getByText('Pending', { exact: true }).count()).toBeGreaterThanOrEqual(2);
  });

  test('1.2 status_filter_and_search', async ({ page }) => {
    await page.getByRole('button', { name: 'Pending', exact: true }).click();
    await expect(page.locator('.active-filter-row')).toContainText('2 experiments');
    await expect(page.locator('.experiment-table tbody')).not.toContainText('Completed');
    await page.getByLabel('Search experiments').fill('Safety');
    await expect(page.locator('.active-filter-row')).toContainText('1 experiment');
    await page.getByLabel('Search experiments').fill('');
    await expect(page.locator('.active-filter-row')).toContainText('2 experiments');
    await page.getByTitle('Remove Pending filter').click();
    await expect(page.locator('.active-filter-row')).toContainText('5 experiments');
  });

  test('1.3 bulk_archive_delete', async ({ page }) => {
    const rows = page.locator('.experiment-table tbody tr');
    await selectRow(rows.nth(3));
    await selectRow(rows.nth(4));
    await expect(page.locator('.bulk-bar')).toContainText('2 selected');
    await page.getByRole('button', { name: 'Delete selected' }).click();
    await expect(page.getByRole('alertdialog')).toContainText('Delete 2 selected experiments?');
    await page.getByRole('button', { name: 'Delete Experiments' }).click();
    await expect(page.locator('.experiment-table tbody tr')).toHaveCount(3);
  });

  test('1.4 archive_toggle_unarchive', async ({ page }) => {
    await invokeTool(page, 'entity_toggle', { experimentId: PENDING_ID, field: 'archived', value: true });
    await page.locator('label[for="archived-toggle"]').click();
    const archivedRow = page.locator('.experiment-table tbody tr').filter({ hasText: 'Launch copy brevity' }).filter({ hasText: 'Archived' });
    await expect(archivedRow).toHaveCount(1);
    await archivedRow.getByRole('button', { name: 'Unarchive' }).click();
    await expect(page.locator('.empty-state')).toContainText('No experiments match');
  });

  test('1.5 designer_experiment_upsert_modal', async ({ page }) => {
    await page.getByRole('button', { name: 'New Experiment' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('ExperimentUpsert');
    for (const label of ['Experiment name', 'Hypothesis', 'Success metric', 'Minimum sample size', 'Variant title', 'Prompt', 'Model', 'Temperature']) {
      expect(await dialog.getByLabel(label, { exact: true }).count(), label).toBeGreaterThan(0);
    }
    await expect(dialog.getByRole('slider')).toHaveCount(2);
  });

  test('1.6 variant_add_remove_bounds', async ({ page }) => {
    await page.getByRole('button', { name: 'New Experiment' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.locator('.variant-card')).toHaveCount(2);
    await dialog.getByRole('button', { name: 'Add variant' }).click();
    await dialog.getByRole('button', { name: 'Add variant' }).click();
    await expect(dialog.locator('.variant-card')).toHaveCount(4);
    await expect(dialog.getByRole('button', { name: 'Add variant' })).toBeDisabled();
    await dialog.getByRole('button', { name: 'Remove' }).last().click();
    await expect(dialog.locator('.variant-card')).toHaveCount(3);
  });

  test('1.7 allocation_sum_live_validation', async ({ page }) => {
    await page.getByRole('button', { name: 'New Experiment' }).click();
    const dialog = page.getByRole('dialog');
    await setAllocation(page, 0, 40);
    await expect(dialog.locator('.allocation-status')).toContainText('90%');
    await expect(dialog.locator('.allocation-status')).toContainText('must sum to exactly 100%');
    await expect(dialog.getByRole('button', { name: 'Create Experiment' })).toBeDisabled();
  });

  test('1.8 valid_submit_adds_pending', async ({ page }) => {
    const before = await page.locator('.experiment-table tbody tr').count();
    const result = await submitExperiment(page);
    expect(result).toMatchObject({ ok: true });
    await expect(page.getByText(VALID_EXPERIMENT.name, { exact: true })).toBeVisible();
    await expect(page.locator('.experiment-table tbody tr')).toHaveCount(before + 1);
    await expect(page.getByText(VALID_EXPERIMENT.name).locator('xpath=ancestor::tr')).toContainText('Pending');
  });

  test('1.9 invalid_submit_named_errors', async ({ page }) => {
    const before = await page.locator('.experiment-table tbody tr').count();
    const result = await submitExperiment(page, { ...VALID_EXPERIMENT, name: '', hypothesis: '' });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/name|Experiment name/i);
    await expect(page.locator('.experiment-table tbody tr')).toHaveCount(before);
  });

  test('1.10 edit_prefilled_updates_row', async ({ page }) => {
    const row = experimentButton(page, 'Launch copy brevity').locator('xpath=ancestor::tr');
    await row.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByLabel('Experiment name')).toHaveValue('Launch copy brevity');
    await page.getByLabel('Experiment name').fill('Launch copy precision');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText('Launch copy precision', { exact: true })).toBeVisible();
  });

  test('1.11 criteria_view_and_form', async ({ page }) => {
    await page.getByRole('button', { name: 'Criteria' }).click();
    await expect(page.locator('.criterion-card')).toHaveCount(4);
    await page.getByRole('button', { name: 'New Criterion' }).click();
    const criterionName = page.getByLabel('Criterion name');
    await criterionName.fill('temporary');
    await criterionName.fill('');
    await expect(page.getByText('Criterion name is required')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Criterion' })).toBeDisabled();
    await expect(page.locator('.criterion-card')).toHaveCount(4);
  });

  test('1.12 new_criterion_feeds_metric_select', async ({ page }) => {
    const result = await invokeTool(page, 'form_submit', { workflow: 'new-criterion-form', values: { name: 'groundedness', description: 'Claims cite supplied evidence.', passThreshold: 81 } });
    expect(result).toMatchObject({ ok: true });
    await page.getByRole('button', { name: 'Experiments' }).click();
    await page.getByRole('button', { name: 'New Experiment' }).click();
    await expect(page.getByLabel('Success metric').locator('option[value="groundedness"]')).toHaveCount(1);
  });

  test('1.13 preview_playground_columns', async ({ page }) => {
    await page.getByRole('button', { name: 'New Experiment' }).click();
    await page.getByRole('button', { name: 'Preview playground' }).click();
    await page.getByRole('button', { name: 'Run preview' }).click();
    const columns = page.locator('.preview-column');
    await expect(columns).toHaveCount(2);
    await expect(columns.nth(0)).toContainText('Larkspur-2');
    await expect(columns.nth(1)).toContainText('Meridian-XL');
    expect(await columns.nth(0).innerText()).not.toBe(await columns.nth(1).innerText());
  });

  test('1.14 preview_rerun_replaces_all', async ({ page }) => {
    await page.getByRole('button', { name: 'New Experiment' }).click();
    await page.getByRole('button', { name: 'Preview playground' }).click();
    await page.getByRole('button', { name: 'Run preview' }).click();
    const before = await page.locator('.preview-column p').allTextContents();
    await page.getByLabel('Shared test input').fill('A new synchronized prompt');
    await page.getByRole('button', { name: 'Run preview' }).click();
    const after = await page.locator('.preview-column p').allTextContents();
    expect(after).not.toEqual(before);
    expect(after.every(text => text.includes('A new synchronized prompt'))).toBe(true);
  });

  test('1.15 run_per_variant_progress', async ({ page }) => {
    await invokeTool(page, 'session_start', { experimentId: PENDING_ID });
    await expect(page.locator('.results-panel').getByText('Running', { exact: true })).toBeVisible();
    await expect(page.locator('.results-panel .progress-line')).toHaveCount(2);
    await expect(page.locator('.results-panel')).toContainText(/\d+ of 40/);
    await expect(page.locator('.experiment-table')).toContainText(/\d+ of 40/);
  });

  test('1.16 pause_resume_preserves_samples', async ({ page }) => {
    await invokeTool(page, 'session_start', { experimentId: PENDING_ID });
    await page.waitForTimeout(450);
    await invokeTool(page, 'session_pause', { experimentId: PENDING_ID });
    const paused = await page.locator('.progress-line strong').allTextContents();
    await page.waitForTimeout(450);
    expect(await page.locator('.progress-line strong').allTextContents()).toEqual(paused);
    await invokeTool(page, 'session_resume', { experimentId: PENDING_ID });
    await expect.poll(async () => page.locator('.progress-line strong').allTextContents()).not.toEqual(paused);
  });

  test('1.17 event_timeline_live_filterable', async ({ page }) => {
    await invokeTool(page, 'session_start', { experimentId: PENDING_ID });
    await page.waitForTimeout(450);
    await invokeTool(page, 'session_pause', { experimentId: PENDING_ID });
    await invokeTool(page, 'session_resume', { experimentId: PENDING_ID });
    await expect(page.locator('.timeline-list')).toContainText('Run started');
    await expect(page.locator('.timeline-list')).toContainText('Run paused');
    await expect(page.locator('.timeline-list')).toContainText('Run resumed');
    await page.locator('.timeline-region [role="combobox"]').click();
    await page.getByRole('option', { name: 'Paused' }).click();
    await expect(page.locator('.timeline-list li')).toHaveCount(1);
  });

  test('1.18 results_grouped_bar_chart', async ({ page }) => {
    await selectExperiment(page);
    await expect(page.getByRole('heading', { name: 'Criterion performance' })).toBeVisible();
    await expect(page.locator('.recharts-bar')).toHaveCount(2);
    await expect(page.locator('.recharts-legend-wrapper')).toContainText('Variant A');
    await expect(page.locator('.recharts-legend-wrapper')).toContainText('Variant B');
  });

  test('1.19 distributions_differ_by_config', async ({ page }) => {
    await selectExperiment(page);
    const distributions = page.locator('.distribution-row');
    await expect(distributions).toHaveCount(2);
    const means = await distributions.locator('strong').allTextContents();
    expect(means[0]).not.toBe(means[1]);
  });

  test('1.20 difference_chart_ci_band', async ({ page }) => {
    await selectExperiment(page);
    const card = page.getByRole('heading', { name: 'Difference and confidence' }).locator('xpath=ancestor::section');
    await expect(card.locator('.recharts-area-area')).toHaveCount(1);
    await expect(card.locator('.recharts-line-curve')).toHaveCount(1);
  });

  test('1.21 summary_strip_stats', async ({ page }) => {
    await selectExperiment(page);
    const strip = page.locator('.summary-strip');
    for (const label of ['Winner', 'Win rate', 'p-value', '95% confidence interval']) await expect(strip).toContainText(label);
    await expect(strip).toContainText(/\d+\.\d%/);
  });

  test('1.22 underpowered_gate_then_verdict', async ({ page }) => {
    await invokeTool(page, 'session_start', { experimentId: PENDING_ID });
    await expect(page.locator('.power-banner')).toContainText('Underpowered');
    await expect(page.locator('.power-banner')).toContainText(/sample.*remaining/);
    await expect.poll(async () => page.locator('.power-banner strong').textContent(), { timeout: 15_000 }).not.toBe('Underpowered');
    await expect(page.locator('.power-banner')).toContainText(/Significance reached|Not significant/);
  });

  test('1.23 sample_table_delta_sort', async ({ page }) => {
    await selectExperiment(page);
    const values = async () => page.locator('.sample-table tbody tr td:last-child').allTextContents();
    const asc = await values();
    await page.getByRole('button', { name: /Score delta/ }).click();
    const desc = await values();
    expect(desc).toEqual([...asc].reverse());
  });

  test('1.24 monitoring_convergence_chart', async ({ page }) => {
    await selectExperiment(page);
    await page.getByRole('tab', { name: 'Monitoring' }).click();
    await expect(page.getByRole('heading', { name: 'Sequential monitoring' })).toBeVisible();
    await expect(page.locator('.recharts-line')).toHaveCount(2);
    await expect(page.locator('.recharts-reference-line')).toHaveCount(1);
  });

  test('1.25 comparison_matrix_coherent', async ({ page }) => {
    await selectExperiment(page);
    await page.getByRole('tab', { name: 'Matrix' }).click();
    const matrix = page.locator('.matrix-table');
    await expect(matrix.locator('thead')).toContainText('Baseline');
    await expect(matrix.locator('thead')).toContainText('Warm evidence');
    for (const metric of ['Mean score', 'Mean latency', 'Mean tokens / sample', 'Token efficiency', 'Win rate']) await expect(matrix).toContainText(metric);
    await expect(matrix.locator('.best-cell')).toHaveCount(5);
  });

  test('1.26 radial_criterion_wheels', async ({ page }) => {
    await selectExperiment(page);
    await page.getByRole('tab', { name: 'Analytics' }).click();
    await expect(page.locator('.radial-card')).toHaveCount(4);
    const percentages = await page.locator('.radial-card .radial-chart strong').allTextContents();
    expect(percentages.every(value => /^\d+%$/.test(value))).toBe(true);
  });

  test('1.27 inspector_flag_recompute', async ({ page }) => {
    await selectExperiment(page);
    const before = await statSnapshot(page);
    await page.getByRole('tab', { name: 'Inspector' }).click();
    const card = page.locator('.response-card').first();
    await card.scrollIntoViewIfNeeded();
    await card.getByRole('button', { name: 'Flag outlier' }).click();
    const after = await statSnapshot(page);
    expect(after).not.toBe(before);
    await card.scrollIntoViewIfNeeded();
    await card.getByRole('button', { name: 'Unflag outlier' }).click();
    expect(await statSnapshot(page)).toBe(before);
  });

  test('1.28 decision_locks_experiment', async ({ page }) => {
    await selectExperiment(page);
    const decision = { choice: 'declare-winner', winnerVariant: 'B', rationale: 'Treatment is materially stronger.' };
    expect(await invokeTool(page, 'form_submit', { workflow: 'decision-dialog', experimentId: COMPLETED_ID, values: decision })).toMatchObject({ ok: true });
    await expect(page.locator('.decision-banner')).toContainText('Variant B declared winner');
    await expect(page.locator('.decision-banner')).toContainText(decision.rationale);
    await page.getByRole('tab', { name: 'Inspector' }).click();
    await expect(page.getByRole('button', { name: 'Flag outlier' }).first()).toBeDisabled();
  });

  test('1.29 promote_winner_head_version', async ({ page }) => {
    await invokeTool(page, 'form_submit', { workflow: 'decision-dialog', experimentId: COMPLETED_ID, values: { choice: 'declare-winner', winnerVariant: 'B', rationale: 'Promote the stronger variant.' } });
    await invokeTool(page, 'form_submit', { workflow: 'promote-winner-confirm', experimentId: COMPLETED_ID, values: {} });
    await page.getByRole('button', { name: 'Prompt library' }).click();
    await expect(page.locator('.prompt-list')).toContainText('promoted · B');
    await expect(page.locator('.toast-wrap')).toContainText('Variant B promoted');
  });

  test('1.30 undo_redo_state_edits', async ({ page }) => {
    const undo = page.getByRole('button', { name: 'Undo' });
    const redo = page.getByRole('button', { name: 'Redo' });
    await expect(undo).toBeDisabled();
    await submitExperiment(page);
    await expect(undo).toBeEnabled();
    await undo.click();
    await expect(page.getByText(VALID_EXPERIMENT.name, { exact: true })).toHaveCount(0);
    await expect(redo).toBeEnabled();
    await redo.click();
    await expect(page.getByText(VALID_EXPERIMENT.name, { exact: true })).toBeVisible();
  });

  test('1.31 export_report_api_shaped_live', async ({ page }) => {
    const responseId = await flagFirstResponse(page);
    const report = await openReport(page);
    expect(report).toMatchObject({ schemaVersion: 'ab-experiment-report-v1', experimentId: COMPLETED_ID, status: 'completed', decision: null });
    expect(report.flaggedResponseIds).toContain(responseId);
    expect(Object.keys(report).sort()).toEqual(['decision', 'design', 'experimentId', 'flaggedResponseIds', 'generatedAt', 'sampleCounts', 'schemaVersion', 'statistics', 'status']);
    expect(new Date(report.generatedAt).toISOString()).toBe(report.generatedAt);
  });

  test('1.32 double_activation_single_effect', async ({ page }) => {
    const before = await page.locator('.experiment-table tbody tr').count();
    await page.getByRole('button', { name: 'New Experiment' }).click();
    await page.getByLabel('Experiment name').fill('Double submit guard');
    await page.getByLabel('Hypothesis').fill('Only one request body is created.');
    const submit = page.getByRole('button', { name: 'Create Experiment' });
    await submit.dblclick();
    await expect(page.locator('.experiment-table tbody tr')).toHaveCount(before + 1);
    await expect(page.getByText('Double submit guard', { exact: true })).toHaveCount(1);
  });

  test('1.33 empty_and_edge_states', async ({ page }) => {
    await page.getByLabel('Search experiments').fill('does-not-exist');
    await expect(page.locator('.empty-state')).toContainText('No experiments match');
    await expect(page.locator('.empty-state')).toContainText('Adjust the status filters or search');
    await page.locator('.empty-state').getByRole('button', { name: 'Clear filters' }).click();
    await expect(page.locator('.experiment-table')).toBeVisible();
  });

  test('1.34 variant_removal_keeps_allocations', async ({ page }) => {
    await page.getByRole('button', { name: 'New Experiment' }).click();
    await page.getByRole('button', { name: 'Add variant' }).click();
    await setAllocation(page, 2, 20);
    const sliders = page.getByRole('slider');
    const firstTwo = await sliders.evaluateAll(nodes => nodes.slice(0, 2).map(node => node.getAttribute('aria-valuenow')));
    await page.getByRole('button', { name: 'Remove' }).click();
    expect(await sliders.evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-valuenow')))).toEqual(firstTwo);
    await expect(page.locator('.allocation-status')).toContainText('100%');
  });

  test('1.35 experiment_upsert_field_contract', async ({ page }) => {
    const cases = [
      [{ ...VALID_EXPERIMENT, minimumSampleSize: 0 }, /minimumSampleSize|Minimum sample size/],
      [{ ...VALID_EXPERIMENT, variants: VALID_EXPERIMENT.variants.map((v, i) => ({ ...v, model: i ? v.model : 'Not-a-model' })) }, /model/i],
      [{ ...VALID_EXPERIMENT, variants: VALID_EXPERIMENT.variants.map((v, i) => ({ ...v, temperature: i ? v.temperature : 2.1 })) }, /temperature/i],
      [{ ...VALID_EXPERIMENT, variants: VALID_EXPERIMENT.variants.map(v => ({ ...v, trafficAllocation: 40 })) }, /allocation/i],
    ];
    for (const [values, message] of cases) {
      const result = await submitExperiment(page, values);
      expect(result.ok).toBe(false);
      expect(result.error).toMatch(message);
    }
    await expect(page.locator('.experiment-table tbody tr')).toHaveCount(5);
  });

  test('1.36 criterion_and_decision_field_contracts', async ({ page }) => {
    const duplicate = await invokeTool(page, 'form_submit', { workflow: 'new-criterion-form', values: { name: 'TONE', description: 'Duplicate name', passThreshold: 80 } });
    expect(duplicate.ok).toBe(false);
    expect(duplicate.error).toMatch(/unique|exists/i);
    const decision = await invokeTool(page, 'form_submit', { workflow: 'decision-dialog', experimentId: COMPLETED_ID, values: { choice: 'declare-winner', winnerVariant: null, rationale: '' } });
    expect(decision.ok).toBe(false);
    expect(decision.error).toMatch(/winner|rationale/i);
  });

  test('4.1 empty_states_designed', async ({ page }) => {
    await selectExperiment(page);
    await page.locator('.timeline-region [role="combobox"]').click();
    await page.getByRole('option', { name: 'Paused' }).click();
    await expect(page.locator('.inline-empty')).toContainText('No paused events in this run yet');
  });

  test('4.2 field_contracts_validate_inline', async ({ page }) => {
    await page.getByRole('button', { name: 'New Experiment' }).click();
    await page.getByLabel('Experiment name').fill('temporary');
    await page.getByLabel('Experiment name').fill('');
    await page.getByLabel('Hypothesis').fill('temporary');
    await page.getByLabel('Hypothesis').fill('');
    await page.getByLabel('Minimum sample size').fill('0');
    await expect(page.getByText('Experiment name is required')).toBeVisible();
    await expect(page.getByText('Hypothesis is required')).toBeVisible();
    await expect(page.getByText('Minimum sample size must be at least 1')).toBeVisible();
  });

  test('4.4 actions_show_confirmation', async ({ page }) => {
    await selectRow(page.locator('.experiment-table tbody tr').first());
    await page.getByRole('button', { name: 'Archive selected' }).click();
    await expect(page.getByRole('alertdialog')).toContainText('Archive 1 selected experiment?');
    await expect(page.getByRole('button', { name: 'Archive Experiments' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('4.8 controls_use_semantic_tags', async ({ page }) => {
    expect(await page.locator('button').count()).toBeGreaterThan(10);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('table')).toHaveCount(1);
    await page.getByRole('button', { name: 'New Experiment' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(1);
  });

  test('4.9 modal_close_paths', async ({ page }) => {
    const launcher = page.getByRole('button', { name: 'New Experiment' });
    await launcher.click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(launcher).toBeFocused();
  });

  test('4.11 export_always_schema_valid', async ({ page }) => {
    const report = await openReport(page);
    expect(report.schemaVersion).toBe('ab-experiment-report-v1');
    expect(report.design.variants).toHaveLength(2);
    expect(report.design.variants.reduce((sum, variant) => sum + variant.trafficAllocation, 0)).toBe(100);
    expect(report.flaggedResponseIds).toEqual([]);
  });

  test('4.12 import_rejects_invalid_contract', async ({ page }) => {
    await openReport(page);
    const invalid = { ...(await openReport(page)), schemaVersion: 'wrong-version' };
    await page.getByLabel('Import Experiment Report JSON').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(invalid)) });
    await expect(page.locator('.import-error')).toContainText('schemaVersion must be ab-experiment-report-v1');
    const unchanged = JSON.parse(await page.getByLabel('Experiment Report JSON preview').textContent());
    expect(unchanged.status).toBe('completed');
  });

  test('14.1 multi_facet_reload_resets_seeded', async ({ page }) => {
    await page.getByRole('button', { name: 'Pending', exact: true }).click();
    await submitExperiment(page);
    await page.reload();
    await expect(page.locator('.active-filter-row')).toContainText('5 experiments');
    await expect(page.getByText(VALID_EXPERIMENT.name, { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Pending', exact: true })).toHaveAttribute('aria-pressed', 'false');
  });

  test('14.2 sample_table_sort_reversal', async ({ page }) => {
    await selectExperiment(page);
    const deltas = () => page.locator('.sample-table tbody td:last-child').allTextContents();
    const ascending = await deltas();
    await page.getByRole('button', { name: /Score delta/ }).click();
    expect(await deltas()).toEqual([...ascending].reverse());
  });

  test('14.3 flag_recomputes_derived_surfaces', async ({ page }) => {
    await selectExperiment(page);
    const summaryBefore = await statSnapshot(page);
    await page.getByRole('tab', { name: 'Matrix' }).click();
    const matrixBefore = await page.locator('.matrix-table').innerText();
    await page.getByRole('tab', { name: 'Analytics' }).click();
    const analyticsBefore = await page.locator('.radial-grid').innerText();
    await page.getByRole('tab', { name: 'Inspector' }).click();
    await page.getByRole('button', { name: 'Flag outlier' }).first().click();
    expect(await statSnapshot(page)).not.toBe(summaryBefore);
    await page.getByRole('tab', { name: 'Matrix' }).click();
    expect(await page.locator('.matrix-table').innerText()).not.toBe(matrixBefore);
    await page.getByRole('tab', { name: 'Analytics' }).click();
    expect(await page.locator('.radial-grid').innerText()).not.toBe(analyticsBefore);
  });

  test('14.4 decision_echoes_across_views', async ({ page }) => {
    await selectExperiment(page);
    await invokeTool(page, 'form_submit', { workflow: 'decision-dialog', experimentId: COMPLETED_ID, values: { choice: 'inconclusive', winnerVariant: null, rationale: 'No reliable lift.' } });
    await expect(page.locator('.results-panel')).toContainText('No reliable lift.');
    await expect(experimentButton(page, 'Onboarding assistant — confidence and warmth').locator('xpath=ancestor::tr')).toContainText('Decided');
  });

  test('14.5 experiment_count_delta_exact', async ({ page }) => {
    const rows = page.locator('.experiment-table tbody tr');
    const initial = await rows.count();
    expect(await submitExperiment(page)).toMatchObject({ ok: true });
    await expect(rows).toHaveCount(initial + 1);
    expect(await invokeTool(page, 'entity_delete', { experimentId: PENDING_ID, confirm: true })).toMatchObject({ ok: true });
    await expect(rows).toHaveCount(initial);
    expect(await invokeTool(page, 'entity_delete', { experimentId: 'exp-safety-format', confirm: true })).toMatchObject({ ok: true });
    await expect(rows).toHaveCount(initial - 1);
  });

  test('14.6 full_pipeline_to_export_json', async ({ page }) => {
    const responseId = await flagFirstResponse(page);
    const before = await statSnapshot(page);
    await invokeTool(page, 'form_submit', { workflow: 'decision-dialog', experimentId: COMPLETED_ID, values: { choice: 'declare-winner', winnerVariant: 'B', rationale: 'Pipeline rationale' } });
    const report = await openReport(page);
    expect(report.flaggedResponseIds).toContain(responseId);
    expect(report.decision).toMatchObject({ winnerVariant: 'B', rationale: 'Pipeline rationale' });
    expect(await statSnapshot(page)).toBe(before);
  });

  test('14.7 interleaved_designer_and_run', async ({ page }) => {
    await page.getByRole('button', { name: 'New Experiment' }).click();
    await page.getByLabel('Experiment name').fill('Interleaved draft');
    await page.getByLabel('Hypothesis').fill('The designer survives an independent run.');
    await invokeTool(page, 'session_start', { experimentId: PENDING_ID });
    await expect(page.getByLabel('Experiment name')).toHaveValue('Interleaved draft');
    await page.getByRole('button', { name: 'Create Experiment' }).click();
    await expect(page.getByText('Interleaved draft', { exact: true })).toBeVisible();
    await expect(experimentButton(page, 'Launch copy brevity').locator('xpath=ancestor::tr')).toContainText('Running');
  });

  test('14.8 flag_all_then_restore_round_trip', async ({ page }) => {
    await selectExperiment(page);
    await page.getByRole('tab', { name: 'Inspector' }).click();
    const ids = await page.locator('.response-card .sample-id').allTextContents();
    for (const responseId of ids) await invokeTool(page, 'entity_toggle', { experimentId: COMPLETED_ID, responseId, field: 'outlier-flag', value: true });
    await expect(page.locator('.power-banner')).toContainText('Insufficient data');
    for (const responseId of ids) await invokeTool(page, 'entity_toggle', { experimentId: COMPLETED_ID, responseId, field: 'outlier-flag', value: false });
    await expect(page.locator('.power-banner')).not.toContainText('Insufficient data');
  });

  test('1.1 controls_are_keyboard_accessible', async ({ page }) => {
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip-link')).toBeFocused();
    await page.keyboard.press('Tab');
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'INPUT', 'A']).toContain(focusedTag);
    await page.getByRole('button', { name: 'New Experiment' }).click();
    const slider = page.getByRole('slider').first();
    await slider.focus();
    const before = await slider.getAttribute('aria-valuenow');
    await page.keyboard.press('ArrowLeft');
    expect(await slider.getAttribute('aria-valuenow')).not.toBe(before);
  });

  test('1.2 modals_manage_focus', async ({ page }) => {
    const launcher = page.getByRole('button', { name: 'New Experiment' });
    await launcher.click();
    await expect(page.getByLabel('Experiment name')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(launcher).toBeFocused();
  });

  test('1.3 icons_have_accessible_names', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Redo' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Archive experiment' }).first()).toBeVisible();
    await selectExperiment(page);
    await expect(page.getByRole('tab', { name: 'Inspector' })).toBeVisible();
    await page.getByRole('tab', { name: 'Inspector' }).click();
    await expect(page.getByRole('button', { name: 'Flag outlier' }).first()).toBeVisible();
  });

  test('1.4 feedback_uses_live_regions', async ({ page }) => {
    await submitExperiment(page);
    const announcement = page.locator('.sr-only[aria-live]');
    await expect(announcement).toContainText('Experiment created');
  });

  test('1.5 forms_have_explicit_labels', async ({ page }) => {
    await page.getByRole('button', { name: 'New Experiment' }).click();
    for (const id of ['experiment-name', 'success-metric', 'hypothesis', 'minimum-sample-size', 'variant-title-0', 'variant-model-0']) {
      const control = page.locator(`#${id}`);
      await expect(control).toBeVisible();
      const labelled = await control.evaluate(node => Boolean(node.labels?.length || node.getAttribute('aria-label') || node.getAttribute('aria-labelledby')));
      expect(labelled, `${id} has an explicit accessible label`).toBe(true);
    }
    await expect(page.getByRole('slider').first()).toHaveAttribute('aria-valuenow');
  });

  test('1.6 headings_follow_logical_order', async ({ page }) => {
    await selectExperiment(page);
    const levels = await page.locator('h1,h2,h3,h4,h5,h6').evaluateAll(nodes => nodes.filter(node => node.offsetParent !== null).map(node => Number(node.tagName.slice(1))));
    for (let index = 1; index < levels.length; index += 1) expect(levels[index] - levels[index - 1]).toBeLessThanOrEqual(1);
  });

  test('1.7 landmark_navigation_is_present', async ({ page }) => {
    await expect(page.locator('main#main-content')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Studio views' })).toBeVisible();
    await selectExperiment(page);
    await expect(page.getByRole('complementary', { name: /Results for/ })).toBeVisible();
  });

  test('1.9 semantic_html_roles_are_used', async ({ page }) => {
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.getByRole('table')).toHaveCount(1);
    await selectExperiment(page);
    await expect(page.getByRole('tablist', { name: 'Result views' })).toBeVisible();
    await page.getByRole('button', { name: 'Export report' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('1.10 reduced_motion_is_respected', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await selectExperiment(page);
    const animations = await page.locator('.results-panel').evaluate(node => node.getAnimations().filter(animation => animation.playState === 'running').length);
    expect(animations).toBe(0);
  });

  test('2.2 no_storage_reload_seeded', async ({ page }) => {
    await submitExperiment(page);
    const storage = await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }));
    expect(storage).toEqual({ local: 0, session: 0 });
    await page.reload();
    await expect(page.getByText(VALID_EXPERIMENT.name, { exact: true })).toHaveCount(0);
    await expect(page.locator('.experiment-table tbody tr')).toHaveCount(5);
  });

  test('2.5 console_clean', async ({ page }) => {
    const warnings = [];
    page.on('console', message => { if (message.type() === 'warning') warnings.push(message.text()); });
    await page.reload();
    await selectExperiment(page);
    await page.getByRole('tab', { name: 'Inspector' }).click();
    await page.getByRole('tab', { name: 'Analytics' }).click();
    expect(warnings).toEqual([]);
  });

  test('2.6 cold_load_interactive_2s', async ({ page }) => {
    const started = Date.now();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'New Experiment' })).toBeEnabled({ timeout: 2000 });
    expect(Date.now() - started).toBeLessThan(2000);
  });

  test('2.8 statistics_react_to_data', async ({ page }) => {
    await selectExperiment(page);
    const before = await statSnapshot(page);
    await page.getByRole('tab', { name: 'Inspector' }).click();
    await page.getByRole('button', { name: 'Flag outlier' }).first().click();
    expect(await statSnapshot(page)).not.toBe(before);
  });

  test('2.13 fictional_model_names_only', async ({ page }) => {
    await page.getByRole('button', { name: 'New Experiment' }).click();
    const models = await page.getByLabel('Model', { exact: true }).first().locator('option').allTextContents();
    expect(models).toEqual(['Larkspur-2', 'Cobalt-Mini', 'Meridian-XL', 'Fernwave-1']);
    await page.getByRole('button', { name: 'Preview playground' }).click();
    const renderedModels = await page.locator('.preview-column header span, .preview-column > div > span').allTextContents();
    expect(renderedModels).toEqual(['Larkspur-2', 'Meridian-XL']);
  });

  test('2.14 export_import_end_state_contract', async ({ page }) => {
    const report = await openReport(page);
    expect(report.schemaVersion).toBe('ab-experiment-report-v1');
    expect(report.statistics.means).toBeTruthy();
    expect(report.sampleCounts).toEqual({ A: 32, B: 32 });
    expect(report.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
  });

  test('6.1 create_experiment_upsert_everywhere', async ({ page }) => {
    await createViaUi(page, 'Everywhere experiment');
    const row = page.getByText('Everywhere experiment').locator('xpath=ancestor::tr');
    await expect(row).toContainText('Pending');
    await row.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByLabel('Experiment name')).toHaveValue('Everywhere experiment');
  });

  test('6.2 invalid_upsert_inline_validation', async ({ page }) => {
    await page.getByRole('button', { name: 'New Experiment' }).click();
    await page.getByLabel('Experiment name').fill('temporary');
    await page.getByLabel('Experiment name').fill('');
    await page.getByLabel('Hypothesis').fill('temporary');
    await page.getByLabel('Hypothesis').fill('');
    await expect(page.getByText('Experiment name is required')).toBeVisible();
    await expect(page.getByText('Hypothesis is required')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Experiment' })).toBeDisabled();
  });

  test('6.3 edit_updates_row_and_panel', async ({ page }) => {
    const values = { ...VALID_EXPERIMENT, name: 'Renamed pending experiment' };
    expect(await invokeTool(page, 'form_submit', { workflow: 'experiment-designer', experimentId: PENDING_ID, values })).toMatchObject({ ok: true });
    await expect(page.getByText(values.name, { exact: true })).toBeVisible();
    await page.getByText(values.name, { exact: true }).locator('xpath=ancestor::tr').getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByLabel('Hypothesis')).toHaveValue(values.hypothesis);
  });

  test('6.4 delete_removes_from_all_surfaces', async ({ page }) => {
    await selectExperiment(page);
    await invokeTool(page, 'entity_delete', { experimentId: COMPLETED_ID, confirm: true });
    await expect(page.locator('.results-panel')).toHaveCount(0);
    await expect(page.getByText('Onboarding assistant — confidence and warmth')).toHaveCount(0);
  });

  test('6.5 tab_switch_retains_state', async ({ page }) => {
    await selectExperiment(page);
    await page.getByRole('tab', { name: 'Inspector' }).click();
    await page.getByRole('button', { name: 'Flag outlier' }).first().click();
    await page.getByRole('tab', { name: 'Results', exact: true }).click();
    await page.getByRole('tab', { name: 'Inspector' }).click();
    await expect(page.getByRole('button', { name: 'Unflag outlier' }).first()).toBeVisible();
  });

  test('6.6 empty_library_state_visible', async ({ page }) => {
    await page.getByLabel('Search experiments').fill('no matching experiment');
    await expect(page.getByRole('heading', { name: 'No experiments match' })).toBeVisible();
    await expect(page.locator('.empty-state').getByRole('button', { name: 'Clear filters' })).toBeVisible();
  });

  test('6.7 filters_and_search_consistent', async ({ page }) => {
    await page.getByRole('button', { name: 'Completed', exact: true }).click();
    await page.getByLabel('Search experiments').fill('Evidence');
    await expect(page.locator('.experiment-table tbody tr')).toHaveCount(1);
    await expect(page.locator('.experiment-table tbody')).toContainText('Completed');
    await page.getByLabel('Search experiments').fill('');
    await expect(page.locator('.experiment-table tbody tr')).toHaveCount(3);
  });

  test('6.8 panel_close_reopen_continuity', async ({ page }) => {
    await selectExperiment(page);
    await page.getByRole('tab', { name: 'Analytics' }).click();
    await page.getByRole('button', { name: 'Close results' }).click();
    await expect(page.locator('.results-panel')).toHaveCount(0);
    await experimentButton(page, 'Onboarding assistant — confidence and warmth').click();
    await expect(page.getByRole('tab', { name: 'Analytics' })).toHaveAttribute('aria-selected', 'true');
  });

  test('6.9 dialogs_and_export_import_flows', async ({ page }) => {
    await selectExperiment(page);
    await page.getByRole('button', { name: 'Decide', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText('DecisionUpsert');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Export report' }).click();
    await expect(page.getByRole('dialog')).toContainText('Import report');
  });

  test('6.10 recovery_without_reload', async ({ page }) => {
    await submitExperiment(page);
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(page.getByText(VALID_EXPERIMENT.name, { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Redo' }).click();
    await expect(page.getByText(VALID_EXPERIMENT.name, { exact: true })).toBeVisible();
  });

  test('6.11 export_after_mutations_flow', async ({ page }) => {
    const responseId = await flagFirstResponse(page);
    let report = await openReport(page);
    expect(report.flaggedResponseIds).toEqual([responseId]);
    await page.keyboard.press('Escape');
    await invokeTool(page, 'form_submit', { workflow: 'decision-dialog', experimentId: COMPLETED_ID, values: { choice: 'inconclusive', winnerVariant: null, rationale: 'Mutation export rationale' } });
    report = await openReport(page);
    expect(report.status).toBe('decided');
    expect(report.decision.rationale).toBe('Mutation export rationale');
  });

  test('7.1 layout_adapts_desktop_to_mobile', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await selectExperiment(page);
    const desktopWidth = (await page.locator('.results-panel').boundingBox()).width;
    await page.setViewportSize({ width: 375, height: 812 });
    const mobileWidth = (await page.locator('.results-panel').boundingBox()).width;
    expect(desktopWidth).toBeLessThan(1280);
    expect(mobileWidth).toBeGreaterThanOrEqual(374);
  });

  test('7.4 content_avoids_clipping_and_overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await expect(page.locator('.table-scroll')).toHaveCSS('overflow-x', 'auto');
  });

  test('7.5 panel_fullwidth_with_back', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 });
    await selectExperiment(page);
    const box = await page.locator('.results-panel').boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(767);
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible();
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.locator('.experiment-table')).toBeVisible();
  });

  test('7.8 small_screens_avoid_horizontal_scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await selectExperiment(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('7.9 charts_resize_responsively', async ({ page }) => {
    await selectExperiment(page);
    const chart = page.locator('.chart-frame').first();
    for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 900 }, { width: 375, height: 812 }]) {
      await page.setViewportSize(viewport);
      const chartBox = await chart.boundingBox();
      const panelBox = await page.locator('.results-panel').boundingBox();
      expect(chartBox.width).toBeLessThanOrEqual(panelBox.width);
      expect(chartBox.width).toBeGreaterThan(Math.min(250, viewport.width - 40));
      expect(await chart.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
    }
  });

  test('9.2 console_is_clean', async ({ page }) => {
    const warnings = [];
    page.on('console', message => { if (message.type() === 'warning') warnings.push(message.text()); });
    await page.reload();
    await submitExperiment(page);
    await selectExperiment(page);
    await openReport(page);
    expect(warnings).toEqual([]);
  });

  test('9.3 tab_and_filter_transitions_snappy', async ({ page }) => {
    await selectExperiment(page);
    const durations = [];
    for (const tab of ['Monitoring', 'Matrix', 'Analytics', 'Inspector', 'Results']) {
      const control = page.getByRole('tab', { name: tab, exact: true });
      await control.evaluate(node => {
        window.__tabResponse = new Promise(resolve => {
          let clickedAt;
          node.addEventListener('click', () => { clickedAt = performance.now(); }, { capture: true, once: true });
          const observer = new MutationObserver(() => {
            if (node.getAttribute('aria-selected') !== 'true' || clickedAt === undefined) return;
            observer.disconnect();
            resolve(performance.now() - clickedAt);
          });
          observer.observe(node, { attributes: true, attributeFilter: ['aria-selected'] });
        });
      });
      await control.click();
      durations.push(await page.evaluate(() => window.__tabResponse));
    }
    await expect(page.getByRole('tab', { name: 'Results', exact: true })).toHaveAttribute('aria-selected', 'true');
    expect(Math.max(...durations)).toBeLessThan(2000);
  });

  test('9.4 run_shows_loading_indicators', async ({ page }) => {
    await invokeTool(page, 'session_start', { experimentId: PENDING_ID });
    await expect(page.locator('.results-panel [role="progressbar"]')).toHaveCount(2);
    await expect(page.locator('.experiment-table .cds--inline-loading')).toBeVisible();
  });

  test('9.8 rapid_input_does_not_freeze', async ({ page }) => {
    const search = page.getByLabel('Search experiments');
    for (const value of ['e', 'ev', 'evi', '', 'safe', '']) await search.fill(value);
    for (const status of ['Pending', 'Completed', 'Pending', 'Completed']) await page.getByRole('button', { name: status, exact: true }).click();
    await expect(page.getByRole('button', { name: 'New Experiment' })).toBeEnabled();
  });

  test('11.5 keyboard_power_user_shortcuts', async ({ page }) => {
    await page.keyboard.press('Meta+K');
    await expect(page.getByLabel('Search experiments')).toBeFocused();
  });

  test('15.2 actions_use_specific_labels', async ({ page }) => {
    const labels = await page.locator('button').evaluateAll(nodes => nodes.map(node => (node.innerText || node.getAttribute('aria-label') || '').trim()).filter(Boolean));
    expect(labels).toContain('New Experiment');
    expect(labels).toContain('Run Experiment');
    expect(labels).not.toContain('Submit');
    expect(labels).not.toContain('Go');
  });

  test('15.3 errors_name_problem_and_fix', async ({ page }) => {
    await page.getByRole('button', { name: 'New Experiment' }).click();
    await page.getByLabel('Minimum sample size').fill('0');
    await expect(page.getByText('Minimum sample size must be at least 1')).toBeVisible();
    await setAllocation(page, 0, 40);
    await expect(page.locator('.allocation-status')).toContainText('values must sum to exactly 100%');
  });

  test('15.4 empty_states_explain_next_step', async ({ page }) => {
    await page.getByLabel('Search experiments').fill('nothing');
    const empty = page.locator('.empty-state');
    await expect(empty).toContainText('Adjust the status filters or search');
    await expect(empty.getByRole('button', { name: 'Clear filters' })).toBeVisible();
  });

  test('15.7 numbers_dates_and_units_are_consistent', async ({ page }) => {
    await selectExperiment(page);
    await expect(page.locator('.summary-strip')).toContainText(/\d+\.\d%/);
    await expect(page.locator('.summary-strip')).toContainText(/\d+\.\d{6}|\d\.\d{2}e-/);
    await page.getByRole('tab', { name: 'Inspector' }).click();
    await expect(page.locator('.response-card').first()).toContainText(/\d+ ms/);
    await expect(page.locator('.response-card').first()).toContainText(/Tokens \d+/);
  });

  test('1.37 import_report_round_trip', async ({ page }) => {
    const responseId = await flagFirstResponse(page);
    await invokeTool(page, 'form_submit', { workflow: 'decision-dialog', experimentId: COMPLETED_ID, values: { choice: 'declare-winner', winnerVariant: 'B', rationale: 'Round-trip decision' } });
    const exported = await openReport(page);
    await page.reload();
    await openReport(page);
    await page.getByLabel('Import Experiment Report JSON').setInputFiles({ name: 'experiment-report.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported)) });
    await expect(page.getByLabel('Experiment Report JSON preview')).toContainText('Round-trip decision');
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await selectExperiment(page);
    await expect(page.locator('.decision-banner')).toContainText('Round-trip decision');
    await page.getByRole('tab', { name: 'Inspector' }).click();
    await expect(page.getByText(responseId, { exact: true }).locator('xpath=ancestor::article')).toHaveClass(/flagged/);
    const fresh = await openReport(page);
    expect(fresh.flaggedResponseIds).toEqual(exported.flaggedResponseIds);
    expect(fresh.decision).toEqual(exported.decision);
  });

  test('14.9 import_export_round_trip_probe', async ({ page }) => {
    const responseId = await flagFirstResponse(page);
    await invokeTool(page, 'form_submit', { workflow: 'decision-dialog', experimentId: COMPLETED_ID, values: { choice: 'inconclusive', winnerVariant: null, rationale: 'Downloaded report rationale' } });
    await openReport(page);
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download JSON' }).click();
    const artifact = await download;
    expect(artifact.suggestedFilename()).toBe('experiment-report.json');
    const payload = JSON.parse(await page.getByLabel('Experiment Report JSON preview').textContent());
    expect(payload.flaggedResponseIds).toContain(responseId);
    await page.reload();
    await openReport(page);
    await page.getByLabel('Import Experiment Report JSON').setInputFiles({ name: artifact.suggestedFilename(), mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(payload)) });
    await expect(page.getByLabel('Experiment Report JSON preview')).toContainText('Downloaded report rationale');
    const invalid = { ...payload, schemaVersion: 'ab-experiment-report-v0' };
    await page.getByLabel('Import Experiment Report JSON').setInputFiles({ name: 'wrong-version.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(invalid)) });
    await expect(page.locator('.import-error')).toContainText('schemaVersion');
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await selectExperiment(page);
    await expect(page.locator('.decision-banner')).toContainText('Downloaded report rationale');
  });

  test('6.12 import_round_trip_flow', async ({ page }) => {
    const responseId = await flagFirstResponse(page);
    const report = await openReport(page);
    await page.reload();
    await openReport(page);
    await page.getByLabel('Import Experiment Report JSON').setInputFiles({ name: 'portable-report.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(report)) });
    const reconstructed = JSON.parse(await page.getByLabel('Experiment Report JSON preview').textContent());
    expect(reconstructed.flaggedResponseIds).toContain(responseId);
    expect(reconstructed.statistics).toEqual(report.statistics);
  });

  test('2.1 shared_state_coherence', async ({ page }) => {
    await selectExperiment(page);
    const before = await statSnapshot(page);
    await page.getByRole('tab', { name: 'Inspector' }).click();
    const responseId = await page.locator('.response-card .sample-id').first().textContent();
    await page.getByRole('button', { name: 'Flag outlier' }).first().click();
    expect(await statSnapshot(page)).not.toBe(before);
    const report = await openReport(page);
    expect(report.flaggedResponseIds).toContain(responseId);
  });

  test('2.7 responsive_during_run', async ({ page }) => {
    await invokeTool(page, 'session_start', { experimentId: PENDING_ID });
    const durations = [];
    for (const [name, selector] of [['Criteria', '.criteria-grid'], ['Experiments', '.experiment-table']]) {
      const control = page.getByRole('button', { name, exact: true });
      await control.evaluate((node, targetSelector) => {
        window.__viewResponse = new Promise(resolve => {
          let clickedAt;
          node.addEventListener('click', () => { clickedAt = performance.now(); }, { capture: true, once: true });
          const observer = new MutationObserver(() => {
            if (clickedAt === undefined || !document.querySelector(targetSelector)) return;
            observer.disconnect();
            resolve(performance.now() - clickedAt);
          });
          observer.observe(document.body, { childList: true, subtree: true });
        });
      }, selector);
      await control.click();
      durations.push(await page.evaluate(() => window.__viewResponse));
    }
    await page.getByLabel('Search experiments').fill('Launch');
    await expect(experimentButton(page, 'Launch copy brevity')).toBeVisible();
    expect(Math.max(...durations)).toBeLessThan(500);
  });

  test('2.9 keyboard_operability_focus', async ({ page }) => {
    const pending = page.getByRole('button', { name: 'Pending', exact: true });
    await pending.focus();
    await page.keyboard.press('Enter');
    await expect(pending).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Shift+Tab');
    expect(await page.evaluate(() => document.activeElement !== document.body)).toBe(true);
  });

  test('2.10 modal_focus_trap_escape', async ({ page }) => {
    await selectExperiment(page);
    const launcher = page.getByRole('button', { name: 'Decide', exact: true });
    await launcher.click();
    await expect(page.getByLabel('Decision choice')).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    expect(await page.getByRole('dialog').evaluate(node => node.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(launcher).toBeFocused();
  });

  test('2.11 aria_live_announcements', async ({ page }) => {
    await invokeTool(page, 'form_submit', { workflow: 'decision-dialog', experimentId: COMPLETED_ID, values: { choice: 'inconclusive', winnerVariant: null, rationale: 'Live-region decision' } });
    await expect(page.locator('.sr-only[aria-live]')).toContainText('Decision recorded');
  });

  test('2.12 labels_slider_values_errors', async ({ page }) => {
    await page.getByRole('button', { name: 'New Experiment' }).click();
    const slider = page.getByRole('slider').first();
    await expect(slider).toHaveAttribute('aria-valuenow', '50');
    await expect(slider).toHaveAccessibleName('Variant A traffic allocation');
    await setAllocation(page, 0, 30);
    await expect(page.locator('.allocation-status')).toContainText('must sum to exactly 100%');
  });

  test('4.3 errors_name_field_and_fix', async ({ page }) => {
    await openReport(page);
    const report = JSON.parse(await page.getByLabel('Experiment Report JSON preview').textContent());
    report.design.variants[0].model = 'invalid-model';
    await page.getByLabel('Import Experiment Report JSON').setInputFiles({ name: 'invalid-model.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(report)) });
    await expect(page.locator('.import-error')).toContainText('model');
    await expect(page.locator('.import-error')).toContainText('Larkspur-2');
  });

  test('4.5 run_shows_progress_affordances', async ({ page }) => {
    await invokeTool(page, 'session_start', { experimentId: PENDING_ID });
    await expect(page.locator('.results-panel')).toContainText('Evaluation in progress');
    await expect(page.locator('.progress-line [role="progressbar"]')).toHaveCount(2);
    await expect(page.getByRole('button', { name: 'Pause run' })).toBeEnabled();
  });

  test('4.6 destructive_actions_guarded', async ({ page }) => {
    const row = experimentButton(page, 'Launch copy brevity').locator('xpath=ancestor::tr');
    await selectRow(row);
    await page.getByRole('button', { name: 'Delete selected' }).click();
    await expect(experimentButton(page, 'Launch copy brevity')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(experimentButton(page, 'Launch copy brevity')).toBeVisible();
  });

  test('4.7 nonobvious_controls_have_help', async ({ page }) => {
    await selectExperiment(page);
    await page.getByRole('tab', { name: 'Inspector' }).click();
    await expect(page.locator('.control-help')).toContainText('excludes that response from the summary, charts, matrix, analytics, and exported report');
    await page.getByRole('tab', { name: 'Matrix' }).click();
    await expect(page.getByTitle('Mean score earned per 100 generated tokens')).toBeVisible();
  });

  test('4.10 long_run_shows_progress', async ({ page }) => {
    await invokeTool(page, 'session_start', { experimentId: PENDING_ID });
    const initial = await page.locator('.progress-line strong').allTextContents();
    await page.waitForTimeout(450);
    const advanced = await page.locator('.progress-line strong').allTextContents();
    expect(advanced).not.toEqual(initial);
    await expect(page.locator('.experiment-table')).toContainText('Running');
  });

  test('4.1 progress_fills_continuously', async ({ page }) => {
    const row = experimentButton(page, 'Launch copy brevity').locator('xpath=ancestor::tr');
    await row.getByRole('button', { name: 'Run Experiment' }).click();
    const bar = page.locator('.progress-line [role="progressbar"]').first();
    const first = Number(await bar.getAttribute('aria-valuenow'));
    await page.waitForTimeout(250);
    const second = Number(await bar.getAttribute('aria-valuenow'));
    expect(second).toBeGreaterThan(first);
  });

  test('4.2 results_panel_slide_250ms', async ({ page }) => {
    await page.evaluate(() => {
      window.__panelMotion = new Promise(resolve => {
        const observer = new MutationObserver(() => {
          const panel = document.querySelector('.results-panel');
          if (!panel) return;
          observer.disconnect();
          requestAnimationFrame(() => resolve(Math.max(0, ...panel.getAnimations().map(animation => Number(animation.effect.getComputedTiming().duration)))));
        });
        observer.observe(document.body, { childList: true, subtree: true });
      });
    });
    await experimentButton(page, 'Onboarding assistant — confidence and warmth').click();
    const panel = page.locator('.results-panel');
    const duration = await page.evaluate(() => window.__panelMotion);
    expect(duration).toBeGreaterThanOrEqual(200);
    expect(duration).toBeLessThanOrEqual(400);
    await page.getByRole('button', { name: 'Close results' }).click();
    await expect(panel).toHaveCount(0);
  });

  test('4.6 hover_animations_required', async ({ page }) => {
    const row = page.locator('.experiment-table tbody tr').first();
    const before = await row.evaluate(node => getComputedStyle(node).backgroundColor);
    await row.hover();
    await page.waitForTimeout(180);
    const after = await row.evaluate(node => getComputedStyle(node).backgroundColor);
    expect(after).not.toBe(before);
  });

  test('4.7 modal_scale_opacity_transition', async ({ page }) => {
    await page.evaluate(() => {
      window.__modalMotion = new Promise(resolve => {
        const observer = new MutationObserver(() => {
          const modal = document.querySelector('.cds--modal-container');
          if (!modal) return;
          observer.disconnect();
          requestAnimationFrame(() => {
            const animation = modal.getAnimations()[0];
            resolve(animation ? animation.effect.getComputedTiming().duration : 0);
          });
        });
        observer.observe(document.body, { childList: true, subtree: true });
      });
    });
    await page.getByRole('button', { name: 'New Experiment' }).click();
    const dialog = page.getByRole('dialog');
    expect(await page.evaluate(() => window.__modalMotion)).toBeGreaterThanOrEqual(200);
    await page.waitForTimeout(350);
    expect(await dialog.evaluate(node => node.getAnimations({ subtree: true }).some(animation => animation.playState === 'running'))).toBe(false);
  });

  test('4.8 toasts_slide_autodismiss', async ({ page }) => {
    await submitExperiment(page);
    const toast = page.locator('.toast-wrap');
    await expect(toast).toContainText('Experiment created');
    const animated = await toast.evaluate(node => node.getAnimations({ subtree: true }).length > 0);
    expect(animated).toBe(true);
    await expect(toast).toHaveCount(0, { timeout: 5000 });
  });

  test('4.9 reduced_motion_respected', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await experimentButton(page, 'Onboarding assistant — confidence and warmth').click();
    const durations = await page.locator('.results-panel').evaluate(node => node.getAnimations({ subtree: true }).map(animation => animation.effect.getComputedTiming().duration));
    expect(durations.every(duration => Number(duration) <= 1)).toBe(true);
  });

  test('7.2 mobile_tap_targets_are_large_enough', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const sizes = await page.locator('button:visible').evaluateAll(nodes => nodes.map(node => { const box = node.getBoundingClientRect(); return { width: box.width, height: box.height }; }));
    expect(sizes.every(size => size.width >= 32 && size.height >= 32)).toBe(true);
  });

  test('7.3 typography_resizes_across_breakpoints', async ({ page }) => {
    const heading = page.getByRole('heading', { name: 'Experiment Library' });
    const desktop = parseFloat(await heading.evaluate(node => getComputedStyle(node).fontSize));
    await page.setViewportSize({ width: 375, height: 812 });
    const mobile = parseFloat(await heading.evaluate(node => getComputedStyle(node).fontSize));
    expect(mobile).toBeLessThanOrEqual(desktop);
    expect(mobile).toBeGreaterThanOrEqual(24);
  });

  test('7.6 stacking_reflows_logically', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const toolbar = page.locator('.toolbar-row');
    const children = await toolbar.locator(':scope > *').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().top));
    expect(new Set(children).size).toBeGreaterThan(1);
  });

  test('7.7 mobile_touch_gestures_work', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByRole('button', { name: 'Pending', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Pending', exact: true })).toHaveAttribute('aria-pressed', 'true');
    const row = experimentButton(page, 'Launch copy brevity').locator('xpath=ancestor::tr');
    await row.getByRole('button', { name: 'Run Experiment' }).click();
    await expect(page.locator('.results-panel')).toBeVisible();
  });

  test('7.10 fixed_controls_remain_accessible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 500 });
    await selectExperiment(page);
    await page.locator('.results-panel').evaluate(node => { node.scrollTop = node.scrollHeight; });
    await expect(page.getByRole('button', { name: 'Back' })).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Close results' })).toBeInViewport();
  });

  test('9.1 cold_start_is_under_two_seconds', async ({ page }) => {
    const started = performance.now();
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'New Experiment' })).toBeVisible({ timeout: 2000 });
    expect(performance.now() - started).toBeLessThan(2000);
  });

  test('9.5 sample_and_inspector_lists_stay_fluid', async ({ page }) => {
    await selectExperiment(page);
    const inspector = page.getByRole('tab', { name: 'Inspector' });
    await inspector.evaluate(node => {
      window.__inspectorResponse = new Promise(resolve => {
        let clickedAt;
        node.addEventListener('click', () => { clickedAt = performance.now(); }, { capture: true, once: true });
        const observer = new MutationObserver(() => {
          if (clickedAt === undefined || document.querySelectorAll('.response-card').length !== 32) return;
          observer.disconnect();
          resolve(performance.now() - clickedAt);
        });
        observer.observe(document.body, { childList: true, subtree: true });
      });
    });
    await inspector.click();
    await expect(page.locator('.response-card')).toHaveCount(32);
    const renderDuration = await page.evaluate(() => window.__inspectorResponse);
    const flag = page.getByRole('button', { name: 'Flag outlier' }).first();
    await flag.evaluate(node => {
      window.__flagResponse = new Promise(resolve => {
        const card = node.closest('.response-card');
        let clickedAt;
        node.addEventListener('click', () => { clickedAt = performance.now(); }, { capture: true, once: true });
        const observer = new MutationObserver(() => {
          if (clickedAt === undefined || !card.classList.contains('flagged')) return;
          observer.disconnect();
          resolve(performance.now() - clickedAt);
        });
        observer.observe(card, { attributes: true, attributeFilter: ['class'] });
      });
    });
    await flag.scrollIntoViewIfNeeded();
    await flag.click();
    await expect(page.locator('.response-card.flagged')).toHaveCount(1);
    const flagDuration = await page.evaluate(() => window.__flagResponse);
    expect(Math.max(renderDuration, flagDuration)).toBeLessThan(2000);
  });

  test('9.6 state_changes_remain_interactive', async ({ page }) => {
    await invokeTool(page, 'session_start', { experimentId: PENDING_ID });
    await submitExperiment(page, { ...VALID_EXPERIMENT, name: 'Concurrent state change' });
    await expect(page.getByText('Concurrent state change', { exact: true })).toBeVisible();
    await expect(experimentButton(page, 'Launch copy brevity').locator('xpath=ancestor::tr')).toContainText('Running');
  });

  test('9.10 underpowered_and_import_errors_stay_responsive', async ({ page }) => {
    await invokeTool(page, 'session_start', { experimentId: PENDING_ID });
    await expect(page.locator('.power-banner')).toContainText('Underpowered');
    await page.getByRole('button', { name: 'Back' }).click();
    await openReport(page);
    await page.getByLabel('Import Experiment Report JSON').setInputFiles({ name: 'malformed.json', mimeType: 'application/json', buffer: Buffer.from('{not-json') });
    await expect(page.locator('.import-error')).toContainText('malformed');
    await expect(page.getByRole('button', { name: 'Regenerate' })).toBeEnabled();
  });

  test('3.3 layout_matches_library_and_panel_spec', async ({ page }) => {
    await selectExperiment(page);
    const main = await page.locator('main').boundingBox();
    const panel = await page.locator('.results-panel').boundingBox();
    expect(panel.x).toBeGreaterThan(main.x);
    await page.getByRole('button', { name: 'Decide', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('3.5 responsive_behavior_matches_spec', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 });
    await selectExperiment(page);
    expect((await page.locator('.results-panel').boundingBox()).width).toBeGreaterThanOrEqual(767);
    await page.setViewportSize({ width: 375, height: 812 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });

  test('3.8 component_states_match_spec', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled();
    await page.getByRole('button', { name: 'New Experiment' }).click();
    await setAllocation(page, 0, 30);
    await expect(page.getByRole('button', { name: 'Create Experiment' })).toBeDisabled();
  });

  test('4.3 chart_bars_grow_on_tab', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await selectExperiment(page);
    await page.getByRole('tab', { name: 'Analytics' }).click();
    await page.evaluate(() => {
      window.__barMotion = new Promise(resolve => {
        const observer = new MutationObserver(() => {
          const bar = document.querySelector('.chart-bars-animate .recharts-bar-rectangle path');
          if (!bar) return;
          observer.disconnect();
          requestAnimationFrame(() => {
            const style = getComputedStyle(bar);
            const duration = style.animationDuration.endsWith('ms')
              ? Number.parseFloat(style.animationDuration)
              : Number.parseFloat(style.animationDuration) * 1000;
            resolve({ name: style.animationName, duration });
          });
        });
        observer.observe(document.body, { childList: true, subtree: true });
      });
    });
    await page.getByRole('tab', { name: 'Results', exact: true }).click();
    const motion = await page.evaluate(() => window.__barMotion);
    expect(motion.name).toBe('barGrow');
    expect(motion.duration).toBeGreaterThanOrEqual(400);
    await expect.poll(() => page.locator('.recharts-bar-rectangle path').first().evaluate(node => Number(node.getAttribute('height')))).toBeGreaterThan(0);
  });

  test('4.4 row_enter_exit_animation', async ({ page }) => {
    await page.evaluate(() => {
      window.__rowMotion = new Promise(resolve => {
        const observer = new MutationObserver(() => {
          const row = document.querySelector('tr.new-row');
          if (!row) return;
          observer.disconnect();
          requestAnimationFrame(() => {
            const animation = row.getAnimations()[0];
            resolve(animation ? animation.effect.getComputedTiming().duration : 0);
          });
        });
        observer.observe(document.body, { childList: true, subtree: true });
      });
    });
    await createViaUi(page, 'Animated entry row');
    const row = page.getByText('Animated entry row').locator('xpath=ancestor::tr');
    expect(await page.evaluate(() => window.__rowMotion)).toBeGreaterThanOrEqual(350);
    await selectRow(row);
    await page.getByRole('button', { name: 'Archive selected' }).click();
    await page.getByRole('button', { name: 'Archive Experiments' }).click();
    await expect(row).toHaveCount(0);
  });

  test('4.5 flag_and_stat_transitions', async ({ page }) => {
    await selectExperiment(page);
    const before = await statSnapshot(page);
    await page.getByRole('tab', { name: 'Inspector' }).click();
    const card = page.locator('.response-card').first();
    await card.evaluate(node => {
      window.__flagMotion = new Promise(resolve => {
        const observer = new MutationObserver(() => {
          observer.disconnect();
          requestAnimationFrame(() => {
            resolve(Math.max(0, ...node.getAnimations().map(animation => Number(animation.effect.getComputedTiming().duration))));
          });
        });
        observer.observe(node, { attributes: true, attributeFilter: ['class'] });
      });
    });
    await card.getByRole('button', { name: 'Flag outlier' }).click();
    await expect(card).toHaveClass(/flagged/);
    expect(await statSnapshot(page)).not.toBe(before);
    expect(await page.evaluate(() => window.__flagMotion)).toBeGreaterThanOrEqual(350);
  });

  test('9.7 chart_animations_maintain_frame_rate', async ({ page }) => {
    await selectExperiment(page);
    await page.getByRole('tab', { name: 'Analytics' }).click();
    await page.evaluate(() => {
      window.__chartAnimation = new Promise(resolve => {
        const observer = new MutationObserver(() => {
          const bar = document.querySelector('.chart-bars-animate .recharts-bar-rectangle path');
          if (!bar) return;
          observer.disconnect();
          requestAnimationFrame(() => {
            const animations = bar.getAnimations();
            const animation = animations.find(item => Number(item.effect.getComputedTiming().duration) >= 400);
            resolve(animation ? {
              duration: Number(animation.effect.getComputedTiming().duration),
              keyframes: animation.effect.getKeyframes().map(frame => frame.transform)
            } : null);
          });
        });
        observer.observe(document.body, { childList: true, subtree: true });
      });
    });
    await page.getByRole('tab', { name: 'Results', exact: true }).click();
    const animation = await page.evaluate(() => window.__chartAnimation);
    expect(animation.duration).toBeGreaterThanOrEqual(400);
    expect(animation.duration).toBeLessThanOrEqual(500);
    expect(animation.keyframes.join(' ')).toMatch(/scaleY|matrix/);
  });
});
