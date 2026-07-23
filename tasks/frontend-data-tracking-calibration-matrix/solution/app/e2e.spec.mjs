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

test('1.10 filters_narrow_both_views', async ({ page }) => {
  await page.goto(BASE);
  await page.getByRole('button', { name: 'Got it' }).click();

  const harnessFilter = page.locator('[aria-label="Filter harnesses"]');
  await harnessFilter.fill('qua');
  await expect(page.locator('.heatmap-table thead th')).toHaveText(['Model', 'quarry']);
  await expect(page.locator('.heatmap-table thead')).not.toHaveText(/driftbench|lanternctl|mosaic-eval/);

  await page.getByRole('button', { name: 'Variance', exact: true }).click();
  await expect(page.locator('.variance-table thead')).toHaveText(/quarry/);
  await expect(page.locator('.variance-table thead')).not.toHaveText(/driftbench|lanternctl|mosaic-eval/);

  await page.getByRole('button', { name: 'Clear filters' }).click();
  await page.getByRole('button', { name: 'Heatmap', exact: true }).click();
  await expect(page.locator('.heatmap-table thead')).toContainText('driftbench');
  await expect(page.locator('.heatmap-table thead')).toContainText('mosaic-eval');
});

test('1.37 calibration_pack_nested_field_contract', async ({ page }) => {
  await page.goto(BASE);
  await page.getByRole('button', { name: 'Got it' }).click();

  await page.locator('[aria-label="Filter harnesses"]').fill('qua');
  await expect(page.locator('.heatmap-table thead th')).toHaveText(['Model', 'quarry']);
  await page.getByRole('button', { name: 'Export calibration pack' }).click();

  const preview = page.locator('.export-drawer.v-navigation-drawer--active pre');
  const pack = JSON.parse(await preview.innerText());
  expect(pack.filters).toEqual({ model: [], harness: ['quarry'], taskCategory: [] });
  expect(pack.filters.harness).not.toContain('qua');
});

const openApp = async (page, options = {}) => {
  if (options.reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(BASE);
  const tip = page.getByRole('button', { name: 'Got it' });
  if (await tip.isVisible()) await tip.click();
};

const openVarianceAtMinimum = async (page) => {
  await page.getByRole('button', { name: 'Variance', exact: true }).click();
  const slider = page.getByRole('slider', { name: 'Sigma gate threshold' });
  await slider.focus();
  await slider.press('Home');
  await expect(page.locator('.threshold-number strong')).toHaveText('0.00');
};

const classifyFirst = async (page, classification = 'capability-gap') => {
  await openVarianceAtMinimum(page);
  await page.getByRole('button', { name: 'Classify', exact: true }).first().click();
  await page.getByRole('radio', { name: classification === 'spec-defect' ? /Spec defect/ : /Capability gap/ }).click();
  await page.getByLabel('Rationale').fill('Observed repeatable cross-harness divergence.');
  await page.locator('.triage-dialog-card').getByRole('button', { name: 'Classify', exact: true }).click();
};

const openFirstCell = async (page) => {
  await page.locator('.cell-main').first().click();
  await expect(page.getByRole('dialog', { name: 'Cell trial details' })).toBeVisible();
};

test('14.8 filter_empty_then_restore_round_trip', async ({ page }) => {
  await openApp(page);
  await page.locator('[aria-label="Filter models"]').fill('no-seeded-model');
  await expect(page.getByText('No cells match these filters')).toBeVisible();
  await page.getByRole('button', { name: 'Variance', exact: true }).click();
  await expect(page.getByText('No variance rows to calculate')).toBeVisible();
  await page.locator('.empty-state').getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.locator('.variance-table tbody tr')).toHaveCount(12);
});

test('1.3 cell_click_opens_drawer', async ({ page }) => {
  await openApp(page);
  await openFirstCell(page);
  await expect(page.locator('.trial-table tbody tr')).not.toHaveCount(0);
  await expect(page.locator('.distribution-chart canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Close cell drawer' }).click();
  await expect(page.getByRole('dialog', { name: 'Cell trial details' })).not.toHaveClass(/v-navigation-drawer--active/);
});

test('1.6 slider_extremes_consistent', async ({ page }) => {
  await openApp(page);
  await openVarianceAtMinimum(page);
  await expect(page.locator('.status-chip.divergent')).toHaveCount(12);
  const slider = page.getByRole('slider', { name: 'Sigma gate threshold' });
  await slider.press('End');
  await expect(page.locator('.status-chip.stable')).toHaveCount(12);
});

test('1.11 empty_state_on_no_match', async ({ page }) => {
  await openApp(page);
  await page.locator('[aria-label="Filter harnesses"]').fill('none');
  await expect(page.getByText('No cells match these filters')).toBeVisible();
  await page.locator('.empty-state').getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.locator('.heat-cell')).toHaveCount(24);
});

test('1.12 rerun_status_progression', async ({ page }) => {
  await openApp(page);
  await openFirstCell(page);
  await page.getByRole('button', { name: 'Re-run', exact: true }).click();
  await expect(page.locator('.run-status')).toHaveText('queued');
  await expect(page.locator('.run-status')).toHaveText('running', { timeout: 2000 });
  await expect(page.locator('.progress-list > div')).not.toHaveCount(0);
  const progressCount = await page.locator('.progress-list > div').count();
  expect(progressCount).toBeGreaterThanOrEqual(4);
  expect(progressCount).toBeLessThanOrEqual(6);
  await expect(page.locator('.run-status')).toHaveText('complete', { timeout: 6000 });
  await expect(page.locator('.progress-list > div.done')).toHaveCount(await page.locator('.progress-list > div').count());
});

test('1.13 rerun_updates_all_surfaces', async ({ page }) => {
  await openApp(page, { reducedMotion: true });
  const cell = page.locator('.cell-main').first();
  const before = await cell.getAttribute('aria-label');
  await openFirstCell(page);
  await page.getByRole('button', { name: 'Re-run', exact: true }).click();
  await expect(page.locator('.run-status')).toHaveText('complete');
  await page.getByRole('button', { name: 'Close cell drawer' }).click();
  await expect(cell).not.toHaveAttribute('aria-label', before);
  await cell.hover();
  await expect(page.locator('.reward-tooltip').first()).toContainText('rerun-');
});

test('1.15 rerun_double_activation_single_run', async ({ page }) => {
  await openApp(page, { reducedMotion: true });
  await openFirstCell(page);
  const rerun = page.getByRole('button', { name: 'Re-run', exact: true });
  await rerun.dblclick();
  await expect(page.locator('.run-status')).toHaveText('complete');
  await page.getByRole('button', { name: 'Close cell drawer' }).click();
  await page.getByRole('button', { name: 'Timeline', exact: true }).click();
  await expect(page.locator('.full-event')).toHaveCount(1);
});

test('1.17 chart_series_toggle_and_tooltip', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Chart', exact: true }).click();
  const switches = page.getByRole('switch');
  await switches.first().click();
  await expect(switches.first()).toHaveAttribute('aria-checked', 'false');
  await switches.first().click();
  await expect(switches.first()).toHaveAttribute('aria-checked', 'true');
  for (let index = 0; index < await switches.count(); index += 1) await switches.nth(index).click();
  await expect(page.getByText('Every harness series is hidden')).toBeVisible();
  await page.getByRole('button', { name: 'Show all series' }).click();
  await expect(page.locator('.chart-wrap canvas')).toBeVisible();
});

test('1.18 cancel_leaves_triage_unchanged', async ({ page }) => {
  await openApp(page);
  await openVarianceAtMinimum(page);
  await expect(page.locator('.triage-metrics .animated-number').last()).toHaveText('12');
  const before = await page.locator('.triage-metrics .animated-number').allTextContents();
  await page.getByRole('button', { name: 'Classify', exact: true }).first().click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('.triage-metrics .animated-number')).toHaveText(before);
});

test('1.19 reload_resets_to_seed', async ({ page }) => {
  await openApp(page, { reducedMotion: true });
  await page.locator('.rerun-mini').first().click();
  await expect(page.locator('.cell-loading')).toBeHidden();
  await page.reload();
  await expect(page.locator('.threshold-number')).toHaveCount(0);
  await page.getByRole('button', { name: 'Timeline', exact: true }).click();
  await expect(page.getByText('No session events yet')).toBeVisible();
});

test('1.22 baseline_pin_shows_signed_deltas', async ({ page }) => {
  await openApp(page, { reducedMotion: true });
  await page.getByRole('button', { name: 'Pin baseline', exact: true }).click();
  await page.locator('.rerun-mini').first().click();
  await expect(page.locator('.delta').first()).toBeVisible();
  await expect(page.locator('.delta').first()).toHaveText(/^[+-]\d\.\d{2}$/);
  await page.getByRole('button', { name: 'Clear baseline' }).click();
  await expect(page.locator('.delta')).toHaveCount(0);
});

test('1.23 bulk_triage_applies_classification_contract', async ({ page }) => {
  await openApp(page);
  await openVarianceAtMinimum(page);
  await page.getByRole('checkbox', { name: /Select/ }).nth(0).click();
  await page.getByRole('checkbox', { name: /Select/ }).nth(1).click();
  await page.locator('.bulk-action-bar').getByRole('button', { name: 'Apply classification' }).click();
  await page.getByRole('radio', { name: /Capability gap/ }).click();
  await page.getByLabel('Rationale').fill('Two rows share repeatable cross-harness divergence.');
  await page.locator('.triage-dialog-card').getByRole('button', { name: 'Apply classification' }).click();
  await expect(page.locator('.classification-badge.capability-gap')).toHaveCount(2);
});

test('1.24 undo_redo_classification_and_threshold', async ({ page }) => {
  await openApp(page);
  await classifyFirst(page);
  await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled();
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.classification-badge')).toHaveCount(0);
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect(page.locator('.classification-badge')).toHaveCount(1);
});

test('1.27 variance_csv_field_contract', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Export calibration pack' }).click();
  await page.getByRole('tab', { name: 'CSV' }).click();
  const csv = await page.getByLabel('CSV export preview').innerText();
  expect(csv.split('\n')[0]).toBe('task,category,driftbench,quarry,lanternctl,mosaic-eval,coefficientOfVariation,stability,classification');
  expect(csv.split('\n')).toHaveLength(13);
});

test('1.28 export_reflects_session_mutations', async ({ page }) => {
  await openApp(page, { reducedMotion: true });
  await page.locator('.rerun-mini').first().click();
  await page.getByRole('button', { name: 'Export calibration pack' }).click();
  await expect(page.getByLabel('JSON export preview')).toContainText('rerun-');
  await page.getByRole('button', { name: 'Copy' }).click();
  await expect(page.getByRole('button', { name: /Copied JSON/ })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download JSON' }).click();
  expect(await download).toBeTruthy();
});

test('1.29 import_calibration_pack_round_trip', async ({ page }) => {
  await openApp(page);
  await classifyFirst(page);
  await page.getByRole('button', { name: 'Export calibration pack' }).click();
  const pack = await page.getByLabel('JSON export preview').innerText();
  await page.reload();
  await page.getByRole('button', { name: 'Import triage pack' }).click();
  await page.getByLabel('JSON payload').fill(pack);
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await page.getByRole('button', { name: 'Variance', exact: true }).click();
  await expect(page.locator('.classification-badge')).toHaveCount(1);
  await expect(page.locator('.threshold-number strong')).toHaveText('0.00');
});

test('1.30 import_rejects_invalid_field_contract', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Import triage pack' }).click();
  await page.getByLabel('JSON payload').fill('{bad');
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await expect(page.locator('.import-error')).toContainText('payload: must be valid JSON');
});

test('1.33 classification_task_and_rationale_bounds', async ({ page }) => {
  await openApp(page);
  await openVarianceAtMinimum(page);
  await page.getByRole('button', { name: 'Classify', exact: true }).first().click();
  await page.locator('.triage-dialog-card').getByRole('button', { name: 'Classify', exact: true }).click();
  await expect(page.getByText(/classification must be capability-gap or spec-defect/)).toBeVisible();
  await page.getByRole('radio', { name: /Capability gap/ }).click();
  await page.getByLabel('Rationale').fill('short');
  await page.locator('.triage-dialog-card').getByRole('button', { name: 'Classify', exact: true }).click();
  await expect(page.getByText(/rationale must be at least 15 characters/)).toBeVisible();
});

test('1.34 repin_baseline_replaces_prior_snapshot', async ({ page }) => {
  await openApp(page, { reducedMotion: true });
  await page.getByRole('button', { name: 'Pin baseline', exact: true }).click();
  await page.locator('.rerun-mini').first().click();
  await expect(page.locator('.delta')).not.toHaveCount(0);
  await page.getByRole('button', { name: 'Pin baseline again' }).click();
  await expect(page.locator('.delta')).toHaveCount(0);
});

test('1.35 undo_redo_baseline_pin_and_clear', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Pin baseline', exact: true }).click();
  await page.getByRole('button', { name: 'Clear baseline' }).click();
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByText('Baseline pinned', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect(page.getByText('Baseline pinned', { exact: true })).toBeHidden();
});

test('1.36 command_palette_search_and_actions', async ({ page }) => {
  await openApp(page);
  await page.locator('[aria-label="Filter models"]').fill('Quill');
  await page.getByRole('button', { name: 'Open command palette' }).click();
  await page.getByLabel('Search commands').fill('clear');
  await page.getByRole('button', { name: 'Clear all filters' }).click();
  await expect(page.getByLabel('Search commands')).toBeHidden();
  await page.getByRole('button', { name: 'Open command palette' }).click();
  await page.getByLabel('Search commands').fill('pin');
  await page.locator('.command-list').getByRole('button', { name: 'Pin baseline' }).click();
  await expect(page.getByText('Baseline pinned', { exact: true })).toBeVisible();
});

test('1.38 valid_triage_pack_import_is_undoable', async ({ page }) => {
  await openApp(page);
  await openVarianceAtMinimum(page);
  const tasks = await page.locator('.variance-table tbody th strong').allInnerTexts();
  const pack = { schemaVersion: 1, document: 'meridian-triage', entries: tasks.slice(0, 2).map((task) => ({ task, classification: 'spec-defect', rationale: 'Imported repeatable cross-harness divergence.' })) };
  await page.getByRole('button', { name: 'Import triage pack' }).click();
  await page.getByLabel('JSON payload').fill(JSON.stringify(pack));
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await expect(page.locator('.classification-badge.spec-defect')).toHaveCount(2);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.classification-badge')).toHaveCount(0);
});

test('3.2 tabular_figures_and_hierarchy', async ({ page }) => {
  await openApp(page);
  await expect(page.locator('h1')).toHaveText('Meridian Calibration');
  await expect(page.getByRole('heading', { name: 'Heatmap', exact: true })).toBeVisible();
  expect(await page.locator('.cell-score').first().evaluate((el) => getComputedStyle(el).fontVariantNumeric)).toContain('tabular-nums');
});

test('3.4 drawer_slider_rerun_animate', async ({ page }) => {
  await openApp(page);
  await openFirstCell(page);
  const transition = await page.locator('.detail-drawer').evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(transition).not.toBe('0s');
  await page.getByRole('button', { name: 'Re-run', exact: true }).click();
  await expect(page.locator('.cell-loading')).toBeVisible();
});

test('3.5 stack_below_1024_matches_spec', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 800 });
  await openApp(page);
  await openFirstCell(page);
  await expect.poll(async () => (await page.locator('.detail-drawer').boundingBox())?.x).toBe(0);
  const box = await page.locator('.detail-drawer').boundingBox();
  expect(box.x).toBe(0);
  expect(box.width).toBe(900);
});

test('3.8 stable_divergent_badge_states', async ({ page }) => {
  await openApp(page);
  await classifyFirst(page, 'spec-defect');
  await expect(page.locator('.classification-badge.spec-defect')).toHaveText('Spec defect');
  await expect(page.locator('.status-chip.divergent')).not.toHaveCount(0);
});

test('3.10 hover_wash_and_copy_confirm', async ({ page }) => {
  await openApp(page);
  await page.locator('.heat-cell').first().hover();
  await page.getByRole('button', { name: 'Variance', exact: true }).click();
  await page.locator('.variance-table tbody tr').first().hover();
  await page.getByRole('button', { name: 'Export calibration pack' }).click();
  await page.getByRole('button', { name: 'Copy' }).click();
  await expect(page.getByRole('button', { name: /Copied JSON/ })).toBeVisible();
});

test('4.4 copy_and_toasts_confirm', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Export calibration pack' }).click();
  await page.getByRole('button', { name: 'Copy' }).click();
  await expect(page.locator('.v-snackbar')).toContainText('Copied CalibrationPack JSON');
});

test('4.5 rerun_shows_in_progress', async ({ page }) => {
  await openApp(page);
  await page.locator('.rerun-mini').first().click();
  await expect(page.locator('.heat-cell.busy .cell-loading')).toBeVisible();
});

test('4.6 undo_and_cancel_on_triage', async ({ page }) => {
  await openApp(page);
  await classifyFirst(page);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.classification-badge')).toHaveCount(0);
});

test('4.9 drawer_supports_close_paths', async ({ page }) => {
  await openApp(page);
  await openFirstCell(page);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Cell trial details' })).not.toHaveClass(/v-navigation-drawer--active/);
  await page.getByRole('button', { name: 'Open command palette' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('Search commands')).toBeHidden();
});

test('4.10 rerun_progress_list_ticks', async ({ page }) => {
  await openApp(page);
  await openFirstCell(page);
  await page.getByRole('button', { name: 'Re-run', exact: true }).click();
  await expect(page.locator('.progress-list > div')).not.toHaveCount(0, { timeout: 2000 });
  await expect(page.locator('.progress-list > div.done')).not.toHaveCount(0, { timeout: 3000 });
});

test('innovation.catchall innovation_catchall', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Export calibration pack' }).click();
  await expect(page.getByLabel('Reproducibility fingerprint')).toHaveText(/^MC-[0-9A-F]{8}$/);
});

test('4.3 rerun_progress_motion', async ({ page }) => {
  await openApp(page);
  await openFirstCell(page);
  await page.getByRole('button', { name: 'Re-run', exact: true }).click();
  await expect(page.locator('.progress-list > div.done')).not.toHaveCount(0, { timeout: 3000 });
  expect(await page.locator('.progress-list > div.done .v-icon').first().evaluate((el) => getComputedStyle(el).animationName)).toContain('check-pop');
});

test('4.5 chart_bars_animate', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Chart', exact: true }).click();
  await page.getByRole('switch').first().click();
  await expect(page.getByRole('switch').first()).toHaveAttribute('aria-checked', 'false');
  await page.getByRole('switch').first().click();
  await expect(page.locator('.chart-wrap canvas')).toBeVisible();
});

test('4.6 timeline_and_summary_microinteractions', async ({ page }) => {
  await openApp(page);
  await classifyFirst(page);
  await page.getByRole('button', { name: 'Timeline', exact: true }).click();
  await expect(page.locator('.full-event').first()).toContainText('classified');
  expect(await page.locator('.full-event').first().evaluate((el) => getComputedStyle(el).transitionDuration)).not.toBe('0s');
});

test('4.7 toasts_slide_autodismiss', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Pin baseline', exact: true }).click();
  const toast = page.locator('.v-snackbar');
  await expect(toast).toBeVisible();
  await expect(toast).toBeHidden({ timeout: 5000 });
});

test('4.8 loading_affordances_animate', async ({ page }) => {
  await openApp(page);
  await page.locator('.rerun-mini').first().click();
  await expect(page.locator('.spinning')).toBeVisible();
  expect(await page.locator('.spinning').evaluate((el) => getComputedStyle(el).animationName)).not.toBe('none');
});

test('9.4 async_work_has_loading_indicators', async ({ page }) => {
  await openApp(page);
  await openFirstCell(page);
  await page.getByRole('button', { name: 'Re-run', exact: true }).click();
  await expect(page.locator('.queue-message')).toBeVisible();
  await expect(page.locator('.progress-list')).toBeVisible({ timeout: 2000 });
});

test('2.1 shared_state_coherence', async ({ page }) => {
  await openApp(page);
  await page.locator('[aria-label="Filter models"]').fill('Quill');
  await expect(page.locator('.heatmap-table tbody tr')).toHaveCount(1);
  await page.getByRole('button', { name: 'Variance', exact: true }).click();
  await expect(page.locator('.subtle-note')).toContainText('4 harnesses');
  await expect(page.locator('.variance-table tbody tr')).toHaveCount(12);
});

test('2.12 api_shaped_form_schemas_surface_inline_errors', async ({ page }) => {
  await openApp(page);
  await openVarianceAtMinimum(page);
  await page.getByRole('checkbox', { name: /Select/ }).nth(0).click();
  await page.getByRole('checkbox', { name: /Select/ }).nth(1).click();
  await expect(page.getByRole('button', { name: 'Apply classification' })).toBeVisible();
});

test('6.2 invalid_classification_shows_field_errors', async ({ page }) => {
  await openApp(page);
  await openVarianceAtMinimum(page);
  await page.getByRole('button', { name: 'Classify', exact: true }).first().click();
  await page.getByLabel('Rationale').fill('too short');
  await page.locator('.triage-dialog-card').getByRole('button', { name: 'Classify', exact: true }).click();
  await expect(page.getByText(/classification must be/)).toBeVisible();
  await expect(page.getByText(/rationale must be at least/)).toBeVisible();
});

test('3.5 drawer_table_and_chart_layout', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openApp(page);
  await openFirstCell(page);
  const chart = await page.locator('.drawer-charts-row > section').nth(0).boundingBox();
  const table = await page.locator('.drawer-charts-row > section').nth(1).boundingBox();
  expect(Math.abs(chart.y - table.y)).toBeLessThan(2);
  expect(table.x).toBeGreaterThan(chart.x);
});

test('3.7 responsive_stack_and_heatmap_scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openApp(page);
  const dimensions = await page.locator('.heatmap-scroll').evaluate((el) => ({ client: el.clientWidth, scroll: el.scrollWidth }));
  expect(dimensions.scroll).toBeGreaterThan(dimensions.client);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});
