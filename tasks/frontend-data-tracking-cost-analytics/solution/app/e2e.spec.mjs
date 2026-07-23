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
import fs from 'node:fs';

const kpiValue = (page, index) => page.locator('.kpi-grid .kpi').nth(index).locator('.kpi-value').innerText();
const stableKpiValue = async (page, index) => {
  let previous;
  let stableSamples = 0;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const current = await kpiValue(page, index);
    stableSamples = current === previous ? stableSamples + 1 : 0;
    if (stableSamples >= 2) return current;
    previous = current;
    await page.waitForTimeout(100);
  }
  throw new Error(`KPI ${index} did not settle`);
};
const parseMoney = (text) => Number(text.replace(/[^0-9.-]/g, ''));

test.describe('frontend-data-tracking-cost-analytics criteria', () => {
  test('1.2 budget_cap_over_state', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const remainingTile = page.locator('.kpi-grid .kpi').nth(3);
    await expect(remainingTile, 'starts in normal (non-error) treatment at the default $100 cap').not.toHaveClass(/error/);

    const capInput = page.locator('#budget-cap');
    const capSave = page.locator('form.budget-cap').getByRole('button', { name: 'Save' });
    await capInput.fill('0.01');
    await capSave.click();
    await expect(remainingTile, 'remaining tile switches to error treatment once cap is below the projection').toHaveClass(/error/);
    await expect(remainingTile, '2px error-colored border').toHaveCSS('border-width', '2px');
    await expect(remainingTile.locator('.over-label'), 'over-budget label shown').toContainText('Over budget');

    await capInput.fill('999999');
    await capSave.click();
    await expect(remainingTile, 'raising the cap above the projection returns it to normal').not.toHaveClass(/error/);
  });

  test('1.3 spend_chart_tooltip', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const chart = page.locator('#spend-over-time svg.recharts-surface').first();
    await expect(chart, 'the cumulative daily spend line chart renders').toBeVisible();
    const box = await chart.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 });
    const tooltip = page.locator('#spend-over-time .chart-tooltip');
    await expect(tooltip, 'hovering a point shows a tooltip').toBeVisible();
    await expect(tooltip.locator('.chart-tooltip-date')).not.toHaveText('');
    await expect(tooltip, 'tooltip shows an exact dollar amount').toContainText('$');
  });

  test('1.4 date_range_filtering', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const before = await page.locator('#event-table .panel-subtitle').first().innerText();

    await page.locator('#date-from').fill('2026-06-10');
    await page.locator('#date-to').fill('2026-06-01');
    await expect(page.locator('#date-range-error'), 'invalid range (end before start) shows an inline validation message').toBeVisible();
    await expect(page.getByRole('button', { name: 'Apply' }), 'Apply stays disabled for an invalid range').toBeDisabled();
    const stillBefore = await page.locator('#event-table .panel-subtitle').first().innerText();
    expect(stillBefore, 'invalid range does not apply').toBe(before);

    await page.locator('#date-from').fill('2026-06-01');
    await page.locator('#date-to').fill('2026-06-05');
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.locator('#date-range-error')).toHaveCount(0);
    const after = await page.locator('#event-table .panel-subtitle').first().innerText();
    expect(after, 're-renders the table/chart to the narrower selected range').not.toBe(before);
    await expect(page.locator('.chips')).toContainText('Range 2026-06-01 to 2026-06-05');
  });

  test('1.6 breakdown_dimension_switching', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const dimensionGroup = page.getByRole('group', { name: 'Breakdown dimension' });
    await expect(dimensionGroup.getByRole('button', { name: 'Model' })).toHaveAttribute('aria-pressed', 'true');
    const legend = page.locator('#dimension-breakdown .legend');
    await expect(legend).toContainText('aurora-70b');

    await dimensionGroup.getByRole('button', { name: 'Team' }).click();
    await expect(dimensionGroup.getByRole('button', { name: 'Team' })).toHaveAttribute('aria-pressed', 'true');
    await expect(dimensionGroup.getByRole('button', { name: 'Model' })).toHaveAttribute('aria-pressed', 'false');
    await expect(legend, 'switching dimensions redraws the legend/series to team members').toContainText('Research');
    await expect(legend).not.toContainText('aurora-70b');

    await dimensionGroup.getByRole('button', { name: 'Feature' }).click();
    await expect(legend).toContainText('Chat assist');
  });

  test('1.7 stacked_grouped_toggle', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.locator('#formula').fill('=SUM(cost)');
    const totalBefore = await page.locator('.formula-result strong').innerText();

    const layoutGroup = page.getByRole('group', { name: 'Bar layout' });
    await expect(layoutGroup.getByRole('button', { name: 'Stacked' })).toHaveAttribute('aria-pressed', 'true');
    await layoutGroup.getByRole('button', { name: 'Grouped' }).click();
    await expect(layoutGroup.getByRole('button', { name: 'Grouped' })).toHaveAttribute('aria-pressed', 'true');
    await expect(layoutGroup.getByRole('button', { name: 'Stacked' })).toHaveAttribute('aria-pressed', 'false');

    const totalAfter = await page.locator('.formula-result strong').innerText();
    expect(totalAfter, 'switching stacked/grouped layout does not change the plotted totals').toBe(totalBefore);
    await expect(page.locator('#dimension-breakdown .recharts-bar')).not.toHaveCount(0);
  });

  test('1.8 legend_series_toggling', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const firstEntry = page.locator('#dimension-breakdown .legend-button').first();
    await expect(firstEntry).toHaveAttribute('aria-pressed', 'true');
    await expect(firstEntry).not.toHaveClass(/muted/);

    await firstEntry.click();
    await expect(firstEntry, 'clicking a legend entry removes the series and mutes the entry').toHaveAttribute('aria-pressed', 'false');
    await expect(firstEntry).toHaveClass(/muted/);

    await firstEntry.click();
    await expect(firstEntry, 'clicking again restores the series').toHaveAttribute('aria-pressed', 'true');
    await expect(firstEntry).not.toHaveClass(/muted/);
  });

  test('1.13 anomaly_detection_markers', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const anomalyItems = page.locator('#anomaly-list .anomaly-item');
    await expect(anomalyItems, 'at least the 2 seeded anomaly days appear').toHaveCount(2);
    await expect(page.locator('#anomaly-list .cds--tag')).toContainText('2 flagged');
    for (const item of await anomalyItems.all()) {
      await expect(item.locator('.anomaly-meta')).toContainText('% above trend');
      await expect(item.locator('.anomaly-meta')).toContainText('$');
    }
    await expect(page.locator('#spend-over-time svg path[aria-label^="Anomaly on"]'), 'anomaly days carry a distinct marker on the spend chart').not.toHaveCount(0);
  });

  test('1.16 column_sort_round_trip', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const costHeader = page.getByRole('columnheader', { name: 'Cost' });
    const costCells = () => page.locator('.event-row .event-cell').nth(6);
    const readTopCosts = async () => {
      const values = [];
      const rows = await page.locator('.event-row').all();
      for (const row of rows.slice(0, 5)) values.push(parseMoney(await row.locator('.event-cell').nth(6).innerText()));
      return values;
    };

    await costHeader.click();
    await expect(costHeader).toHaveAttribute('aria-sort', 'ascending');
    const ascending = await readTopCosts();
    for (let i = 1; i < ascending.length; i += 1) expect(ascending[i], 'ascending sort orders costs non-decreasing').toBeGreaterThanOrEqual(ascending[i - 1]);

    await costHeader.click();
    await expect(costHeader).toHaveAttribute('aria-sort', 'descending');
    const descending = await readTopCosts();
    for (let i = 1; i < descending.length; i += 1) expect(descending[i], 'descending sort orders costs non-increasing').toBeLessThanOrEqual(descending[i - 1]);
    expect(descending[0], 'descending top row differs from ascending top row').not.toBe(ascending[0]);
    void costCells;
  });

  test('1.17 bulk_selection_bar', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.bulk-bar')).toHaveCount(0);

    const checkboxes = page.locator('.event-row .event-check input[type="checkbox"]');
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();
    const bulkBar = page.locator('.bulk-bar');
    await expect(bulkBar, 'bulk action bar appears with the live selection count').toBeVisible();
    await expect(bulkBar.locator('.bulk-count')).toHaveText('2 selected');
    await expect(page.locator('#bulk-team'), 'team Recategorize control present').toBeVisible();
    await expect(page.locator('#bulk-feature'), 'feature Recategorize control present').toBeVisible();

    await checkboxes.nth(2).check();
    await expect(bulkBar.locator('.bulk-count')).toHaveText('3 selected');

    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(bulkBar, 'the bar disappears when the selection empties').toHaveCount(0);
  });

  test('1.20 undo_redo_scope', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const undoBtn = page.getByRole('button', { name: 'Undo last change' });
    const redoBtn = page.getByRole('button', { name: 'Redo last change' });
    await expect(undoBtn, 'Undo is disabled when there is nothing to undo').toBeDisabled();
    await expect(redoBtn, 'Redo is disabled when there is nothing to redo').toBeDisabled();

    // Applying a bulk recategorization scrolls the virtualized table, so track
    // the tracked event by its stable id (not table position) and reset scroll
    // to the top before every read.
    const scrollTop = () => page.locator('.table-scroll').evaluate((el) => { el.scrollTop = 0; });
    await scrollTop();
    const firstCheckLabel = page.locator('.event-row .event-check').first();
    const trackedId = (await firstCheckLabel.getAttribute('aria-label')).replace('Select ', '');
    const trackedRow = page.locator('.event-row', { has: page.locator(`.event-check[aria-label="Select ${trackedId}"]`) });
    const teamCell = trackedRow.locator('.event-cell').nth(3);
    const costCell = trackedRow.locator('.event-cell').nth(6);
    const originalTeam = await teamCell.innerText();
    const originalCost = await costCell.innerText();
    const originalKpi = await stableKpiValue(page, 0);
    const nextTeam = ['Research', 'Product', 'Support', 'Platform'].find((t) => t !== originalTeam);

    // Recategorize a batch (not just one row, which includes the tracked
    // event) so the shift is large enough to move the 2-decimal KPI display —
    // a single event's cost delta can round away at that precision even
    // though the underlying total truly changed.
    const checkboxes = page.locator('.event-row .event-check input[type="checkbox"]');
    for (let i = 0; i < 20; i += 1) await checkboxes.nth(i).check();
    await page.locator('#bulk-team').selectOption(nextTeam);
    await page.locator('.bulk-bar').getByRole('button', { name: 'Apply' }).click();
    await scrollTop();
    await page.waitForTimeout(700); // let the animated KPI number settle before reading it

    await expect(teamCell, 'recategorization updates the selected event').toHaveText(nextTeam);
    await expect(costCell, 'cost recomputes with the new team workload factor').not.toHaveText(originalCost);
    const changedKpi = await kpiValue(page, 0);
    expect(changedKpi, 'KPI tiles re-aggregate after recategorization').not.toBe(originalKpi);

    await expect(undoBtn, 'Undo becomes enabled after a bulk recategorization').toBeEnabled();
    await undoBtn.click();
    await scrollTop();
    await page.waitForTimeout(700);
    await expect(teamCell, 'undo returns the event to its exact prior team').toHaveText(originalTeam);
    await expect(costCell, 'undo returns the cost to its exact prior value').toHaveText(originalCost);
    expect(await kpiValue(page, 0), 'undo returns the KPI to its exact prior value').toBe(originalKpi);
    await expect(undoBtn, 'Undo disables again once history is exhausted').toBeDisabled();
    await expect(redoBtn, 'Redo enables once something has been undone').toBeEnabled();

    await redoBtn.click();
    await scrollTop();
    await page.waitForTimeout(700);
    await expect(teamCell, 'redo reapplies the recategorization').toHaveText(nextTeam);
    expect(await kpiValue(page, 0)).toBe(changedKpi);
  });

  test('1.21 saved_views_round_trip', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.getByRole('group', { name: 'Breakdown dimension' }).getByRole('button', { name: 'Team' }).click();
    await page.locator('#date-from').fill('2026-06-01');
    await page.locator('#date-to').fill('2026-06-10');
    await page.getByRole('button', { name: 'Apply' }).click();

    await page.locator('#save-view-trigger').click();
    const saveModal = page.locator('.cds--modal.is-visible');
    await saveModal.locator('#view-name').fill('Team burn window');
    await saveModal.getByRole('button', { name: 'Save view' }).click();
    await expect(page.locator('#saved-views')).toContainText('Team burn window');
    await expect(page.locator('#saved-views')).toContainText('team · 2026-06-01 to 2026-06-10');

    await page.getByRole('group', { name: 'Breakdown dimension' }).getByRole('button', { name: 'Model' }).click();
    await page.locator('#date-from').fill('2026-05-01');
    await page.locator('#date-to').fill('2026-05-05');
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByRole('group', { name: 'Breakdown dimension' }).getByRole('button', { name: 'Model' })).toHaveAttribute('aria-pressed', 'true');

    await page.locator('.saved-item', { hasText: 'Team burn window' }).locator('button:not(.saved-delete)').click();
    await expect(page.getByRole('group', { name: 'Breakdown dimension' }).getByRole('button', { name: 'Team' }), 'applying a saved view restores exactly that dimension').toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#date-from'), 'applying a saved view restores exactly that range').toHaveValue('2026-06-01');
    await expect(page.locator('#date-to')).toHaveValue('2026-06-10');

    await page.locator('.saved-delete').click();
    const confirmModal = page.getByRole('heading', { name: 'Delete saved view?' });
    await expect(confirmModal, 'deleting requires confirmation').toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.locator('#saved-views')).toContainText('Team burn window');

    await page.locator('.saved-delete').click();
    await page.getByRole('button', { name: 'Delete view' }).click();
    await expect(page.locator('#saved-views'), 'confirmed delete removes the view').not.toContainText('Team burn window');
  });

  test('1.23 what_if_repricing_live', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#unit-cost-explorer .active-indicator')).toHaveCount(0);
    const originalKpi = await kpiValue(page, 0);
    const originalRateText = await page.locator('.rate-row', { hasText: 'aurora-70b' }).locator('.rate-value').innerText();

    const slider = page.locator('#rate-aurora-70b');
    await slider.focus();
    for (let i = 0; i < 10; i += 1) await slider.press('Shift+ArrowRight');

    await expect(page.locator('#unit-cost-explorer .active-indicator'), 'a what-if active indicator appears').toBeVisible();
    const newRateText = await page.locator('.rate-row', { hasText: 'aurora-70b' }).locator('.rate-value').innerText();
    expect(newRateText, 'dragging the rate slider changes the displayed rate').not.toBe(originalRateText);
    const newKpi = await kpiValue(page, 0);
    expect(newKpi, 'the KPI tiles reprice live as the slider moves').not.toBe(originalKpi);
    const formulaResult = await page.locator('.formula-result strong').innerText();
    expect(formulaResult, 'the formula/table recomputes with the what-if rate').toBeTruthy();
  });

  test('1.24 what_if_revert_exact', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const originalKpi = await stableKpiValue(page, 0);

    const slider = page.locator('#rate-quasar-mini');
    await slider.focus();
    for (let i = 0; i < 10; i += 1) await slider.press('Shift+ArrowRight');
    expect(await kpiValue(page, 0), 'precondition: the what-if rate actually changed the KPI').not.toBe(originalKpi);

    await page.getByRole('button', { name: 'Revert' }).click();
    await expect(page.locator('#unit-cost-explorer .active-indicator'), 'Revert clears the what-if active indicator').toHaveCount(0);
    expect(await stableKpiValue(page, 0), 'every derived number returns exactly to its pre-what-if value').toBe(originalKpi);
    await expect(page.locator('.rate-model', { hasText: 'quasar-mini' }).locator('.rate-changed'), 'the changed-rate marker clears').toHaveCount(0);
  });

  test('1.26 formula_box_evaluates', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const subtitle = await page.locator('#event-table .panel-subtitle').first().innerText();
    const expectedCount = Number(subtitle.match(/^([\d,]+)/)[1].replace(/,/g, ''));

    await page.locator('#formula').fill('=COUNT()');
    await expect(page.locator('.formula-result strong'), '=COUNT() evaluates over the currently filtered events').toHaveText(expectedCount.toLocaleString());

    await page.locator('#formula').fill('=SUM(prompt_tokens)');
    const promptSumText = await page.locator('.formula-result strong').innerText();
    expect(Number(promptSumText.replace(/,/g, '')), '=SUM(prompt_tokens) renders a positive labeled result').toBeGreaterThan(0);

    await page.locator('#date-from').fill('2026-06-01');
    await page.locator('#date-to').fill('2026-06-05');
    await page.getByRole('button', { name: 'Apply' }).click();
    await page.locator('#formula').fill('=COUNT()');
    const narrowedCountText = await page.locator('.formula-result strong').innerText();
    expect(Number(narrowedCountText.replace(/,/g, '')), 're-evaluates when the active filters change').toBeLessThan(expectedCount);
  });

  test('1.27 formula_error_handling', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.formula-result')).toBeVisible();

    await page.locator('#formula').fill('=BOGUS(cost)');
    await expect(page.locator('#formula')).toHaveAttribute('data-invalid', 'true');
    await expect(page.locator('.formula-wrap'), 'inline error names the accepted forms').toContainText('Accepted forms:');
    await expect(page.locator('.formula-wrap')).toContainText('=SUM(cost)');
    await expect(page.locator('.formula-result'), 'renders no result for an unrecognized formula').toHaveCount(0);
  });

  test('1.28 capacity_gauge_moves', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const capacityCopy = () => page.locator('.capacity-copy span').first().innerText();
    const capacityWidth = async () => {
      const style = await page.locator('.capacity-fill').getAttribute('style');
      return Number(style.match(/width:\s*([\d.]+)%/)[1]);
    };
    const storedBefore = Number((await capacityCopy()).match(/[\d,]+/)[0].replace(/,/g, ''));
    const widthBefore = await capacityWidth();

    const result = await invokeTool(page, 'entity_update', { field: 'report-sections', value: ['totals'] });
    expect(result.ok, 'seed a schedule so a snapshot can be generated').toBe(true);
    const ran = await invokeTool(page, 'session_trigger_demo', { demo: 'run-schedule-now' });
    expect(ran.ok, 'running the schedule now generates a report snapshot').toBe(true);

    const storedAfter = Number((await capacityCopy()).match(/[\d,]+/)[0].replace(/,/g, ''));
    expect(storedAfter, 'generating a report visibly moves the stored-records count').toBe(storedBefore + 1);
    const widthAfter = await capacityWidth();
    expect(widthAfter, 'the proportional fill increases').toBeGreaterThan(widthBefore);
  });

  test('1.30 export_report_complete', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const [jsonDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download JSON' }).click(),
    ]);
    expect(jsonDownload.suggestedFilename()).toBe('cost-analytics-report.json');
    const jsonPath = await jsonDownload.path();
    const report = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    expect(report.totals, 'overall totals present').toBeTruthy();
    expect(report.byModel?.length, 'per-model table present').toBeGreaterThan(0);
    expect(report.byTeam?.length, 'per-team table present').toBeGreaterThan(0);
    expect(report.byFeature?.length, 'per-feature table present').toBeGreaterThan(0);
    expect(Array.isArray(report.anomalies), 'flagged anomalies present').toBe(true);
    expect(report.filters, 'a description of the applied filters is present').toBeTruthy();

    const [csvDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download CSV' }).click(),
    ]);
    expect(csvDownload.suggestedFilename()).toBe('cost-analytics-report.csv');
    const csvPath = await csvDownload.path();
    const csvText = fs.readFileSync(csvPath, 'utf8');
    expect(csvText.split('\n')[0]).toBe('timestamp,model,feature,team,promptTokens,completionTokens,cost,tag');
  });

  test('1.32 cap_field_validation', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const projectedCaption = page.locator('.kpi-grid .kpi').nth(2).locator('.trend');
    const captionBefore = await projectedCaption.innerText();
    expect(captionBefore, 'precondition: the caption names the current $100.00 cap').toContain('$100.00 cap');

    const capSaveBtn = page.locator('form.budget-cap').getByRole('button', { name: 'Save' });
    await page.locator('#budget-cap').fill('0');
    await expect(page.locator('.header-error'), 'a zero capUsd is rejected with an inline message naming capUsd').toContainText('capUsd');
    await expect(capSaveBtn, 'Save stays disabled').toBeDisabled();

    await page.locator('#budget-cap').fill('-5');
    await expect(page.locator('.header-error')).toContainText('capUsd');
    await expect(capSaveBtn).toBeDisabled();

    expect(await projectedCaption.innerText(), 'the previous cap remains in effect').toBe(captionBefore);
  });

  test('1.33 ceiling_allocation_cross_field', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const researchRow = page.locator('.team-row', { hasText: 'Research' });
    const ceilingInput = researchRow.locator('#ceiling-Research');
    const saveButton = researchRow.getByRole('button', { name: 'Save Research ceiling' });

    await ceilingInput.fill('90');
    await expect(researchRow.locator('.inline-error'), 'a ceiling sum exceeding capUsd shows an inline message naming the excess').toContainText('would exceed capUsd by');
    await expect(saveButton, 'the over-cap edit is not saved').toBeDisabled();

    await ceilingInput.fill('0');
    await expect(researchRow.locator('.inline-error'), 'ceilingUsd <= 0 is rejected with a named field error').toContainText('ceilingUsd');
    await expect(saveButton).toBeDisabled();

    await ceilingInput.fill('12.50');
    await expect(researchRow.locator('.inline-error')).toHaveCount(0);
    await expect(saveButton, 'an edit within the cap is savable').toBeEnabled();
    await saveButton.click();
    await expect(researchRow.locator('.team-numbers'), 'the saved ceiling is reflected immediately').toContainText('$12.50');
  });
});
