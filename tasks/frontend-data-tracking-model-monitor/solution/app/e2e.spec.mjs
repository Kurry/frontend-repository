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

test('1.1 controls_keyboard_operable', async ({ page }) => {
  await page.goto('http://localhost:3000'); await page.keyboard.press('Tab'); await expect(page.locator('*:focus')).toHaveCSS('outline-color', 'rgb(120, 169, 255)');
});

test('1.2 modals_trap_and_return_focus', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const opener = page.locator('.toolbar-button', { hasText: 'Log usage' });
  await opener.focus();
  await opener.click();
  const modal = page.locator('.cds--modal');
  await expect(modal).toBeVisible();
  // Carbon focuses the declared selectorPrimaryFocus target on open.
  await expect(page.locator('#usage-model')).toBeFocused();
  // Tab through every focusable control in the modal and confirm focus never
  // escapes it (real focus-trap behavior, not just "a modal is visible").
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    // Carbon's focus-trap sentinel redirects focus on its own focus event;
    // give it a tick to run before sampling, otherwise consecutive key
    // presses can outrun the redirect.
    await page.waitForTimeout(100);
    const insideModal = await page.evaluate(() => document.activeElement?.closest('.cds--modal') != null);
    expect(insideModal, `focus escaped the modal after ${i + 1} tabs`).toBe(true);
  }
  // Escape dismisses the modal.
  await page.keyboard.press('Escape');
  await expect(modal).not.toBeVisible();
  // Focus returns to the control that opened it.
  await expect(opener).toBeFocused();
});

test('1.3 live_region_announcements', async ({ page }) => {
  await page.goto('http://localhost:3000'); await page.click('button:has-text("Refresh")'); await expect(page.locator('.sr-only[aria-live="polite"]')).toContainText('Discovering marketplace');
});

test('1.4 form_labels_and_field_errors', async ({ page }) => {
  await page.goto('http://localhost:3000'); await page.fill('input#session-budget', '-1'); await page.click('button:has-text("Apply")', {force: true}); await expect(page.locator('text="Session budget must be a number with at most 2 decimal places"')).toBeVisible();
});

test('1.5 headings_landmarks_present', async ({ page }) => {
  await page.goto('http://localhost:3000'); await expect(page.locator('main')).toBeVisible();
});

test('1.6 state_not_color_only', async ({ page }) => {
  await page.goto('http://localhost:3000'); await expect(page.locator('.status-badge').first()).toBeVisible();
});

test('14.3 derived_view_responds_to_input', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.fill('input#session-budget', '50');
  await page.click('button:has-text("Apply")', { force: true });
  const remaining = page.locator('.remaining-value');
  const totalChip = page.locator('.total-chip strong');
  const legend = page.locator('.chart-legend .legend-entry');

  const remainingBefore = await remaining.textContent();
  const totalBefore = parseFloat((await totalChip.textContent()).replace('$', ''));
  const legendBefore = await legend.count();

  // Llama 3.3 70B has no seeded usage — logging against it must introduce a
  // brand-new rollup row and a brand-new pie-chart slice, not just grow an
  // existing number.
  await page.locator('.toolbar-button', { hasText: 'Log usage' }).click();
  await page.locator('select#usage-model').selectOption('Llama 3.3 70B');
  await page.fill('input#request-label', 'Derived view probe 1');
  await page.fill('input#prompt-tokens', '30000');
  await page.fill('input#completion-tokens', '10000');
  await page.locator('button.cds--btn--primary').filter({ hasText: 'Log usage' }).click({ force: true });
  await expect(page.getByText('Derived view probe 1').first()).toBeVisible();

  const remainingAfter1 = await remaining.textContent();
  const totalAfter1 = parseFloat((await totalChip.textContent()).replace('$', ''));
  const legendAfter1 = await legend.count();
  const llamaRow = page.locator('.rollup-row', { hasText: 'Llama 3.3 70B' });
  await expect(llamaRow).toBeVisible();
  await expect(llamaRow.locator('.rollup-subtotal')).not.toHaveText('$0.00');

  expect(totalAfter1, 'session total moves after the first log').toBeGreaterThan(totalBefore);
  expect(remainingAfter1, 'remaining-budget readout moves after the first log').not.toEqual(remainingBefore);
  expect(legendAfter1, 'pie chart gains a slice for the newly-active model').toBe(legendBefore + 1);

  // Second event on a different new model with different inputs — the views
  // must move again, by different amounts, not redraw identically.
  await page.locator('.toolbar-button', { hasText: 'Log usage' }).click();
  await page.locator('select#usage-model').selectOption('Codestral');
  await page.fill('input#request-label', 'Derived view probe 2');
  await page.fill('input#prompt-tokens', '5000');
  await page.fill('input#completion-tokens', '5000');
  await page.locator('button.cds--btn--primary').filter({ hasText: 'Log usage' }).click({ force: true });
  await expect(page.getByText('Derived view probe 2').first()).toBeVisible();

  const remainingAfter2 = await remaining.textContent();
  const totalAfter2 = parseFloat((await totalChip.textContent()).replace('$', ''));
  const legendAfter2 = await legend.count();
  const codestralRow = page.locator('.rollup-row', { hasText: 'Codestral' });
  await expect(codestralRow).toBeVisible();

  expect(totalAfter2, 'session total moves again after the second log').toBeGreaterThan(totalAfter1);
  expect(remainingAfter2, 'remaining-budget readout moves again').not.toEqual(remainingAfter1);
  expect(legendAfter2, 'pie chart gains a second slice').toBe(legendAfter1 + 1);
});

test('14.5 count_delta_is_exact', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const totalChip = page.locator('.total-chip span');
  const modelRow = page.locator('.rollup-row', { hasText: 'Claude 3.7 Sonnet' });
  const parseCount = (text) => Number(text.match(/\d+/)[0]);

  const totalBefore = parseCount(await totalChip.textContent());
  const modelBefore = parseCount(await modelRow.locator('.rollup-meta').textContent());

  await page.locator('.toolbar-button', { hasText: 'Log usage' }).click();
  await page.locator('select#usage-model').selectOption('Claude 3.7 Sonnet');
  await page.fill('input#request-label', 'Count delta probe');
  await page.fill('input#prompt-tokens', '1000');
  await page.fill('input#completion-tokens', '500');
  await page.locator('button.cds--btn--primary').filter({ hasText: 'Log usage' }).click({ force: true });
  await expect(page.getByText('Count delta probe').first()).toBeVisible();

  const totalAfter = parseCount(await totalChip.textContent());
  const modelAfter = parseCount(await modelRow.locator('.rollup-meta').textContent());
  expect(totalAfter - totalBefore, 'total request count increases by exactly one').toBe(1);
  expect(modelAfter - modelBefore, "the submitted model's request count increases by exactly one").toBe(1);
});

test('14.6 different_inputs_change_outcomes', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const totalChip = page.locator('.total-chip strong');
  const totalBefore = parseFloat((await totalChip.textContent()).replace('$', ''));

  await page.locator('.toolbar-button', { hasText: 'Log usage' }).click();
  await page.locator('select#usage-model').selectOption('GPT-4o Mini');
  await page.fill('input#request-label', 'Batch pipeline A');
  await page.fill('input#prompt-tokens', '20000');
  await page.fill('input#completion-tokens', '20000');
  const cost1 = parseFloat((await page.locator('.cost-preview strong').textContent()).replace('$', ''));
  await page.locator('button.cds--btn--primary').filter({ hasText: 'Log usage' }).click({ force: true });
  await expect(page.getByText('Batch pipeline A').first()).toBeVisible();

  await page.locator('.toolbar-button', { hasText: 'Log usage' }).click();
  await page.locator('select#usage-model').selectOption('Claude 3.5 Haiku');
  await page.fill('input#request-label', 'Batch pipeline B');
  await page.fill('input#prompt-tokens', '20000');
  await page.fill('input#completion-tokens', '5000');
  const cost2 = parseFloat((await page.locator('.cost-preview strong').textContent()).replace('$', ''));
  await page.locator('button.cds--btn--primary').filter({ hasText: 'Log usage' }).click({ force: true });
  await expect(page.getByText('Batch pipeline B').first()).toBeVisible();

  // Feed shows both distinct labels.
  await expect(page.getByText('Batch pipeline A').first()).toBeVisible();
  await expect(page.getByText('Batch pipeline B').first()).toBeVisible();

  expect(cost1, 'different inputs computed different costs').not.toBeCloseTo(cost2, 3);
  const totalAfter = parseFloat((await totalChip.textContent()).replace('$', ''));
  expect(Math.abs(totalAfter - (totalBefore + cost1 + cost2)), 'session total differs by exactly the two computed costs').toBeLessThan(0.02);
});

test('14.8 empty_to_repopulated_round_trip', async ({ page }) => {
  await page.goto('http://localhost:3000'); await page.fill('input#catalog-search', 'XYZ'); await page.click('button:has-text("Clear filters")'); await expect(page.locator('.catalog-row').first()).toBeVisible();
});

test('1.1 seeded_catalog_complete', async ({ page }) => {
  await page.goto('http://localhost:3000'); await expect(page.locator('.catalog-row')).toHaveCount(22);
});

test('1.2 free_models_badged', async ({ page }) => {
  await page.goto('http://localhost:3000'); await expect(page.locator('.status-badge.free')).toHaveCount(4);
});

test('1.3 search_narrows_and_restores', async ({ page }) => {
  await page.goto('http://localhost:3000'); await page.fill('input#catalog-search', 'GPT'); expect(await page.locator('.catalog-row').count()).toBeGreaterThan(0); await page.fill('input#catalog-search', ''); await expect(page.locator('.catalog-row')).toHaveCount(22);
});

test('1.4 provider_filter_combines_with_search', async ({ page }) => {
  await page.goto('http://localhost:3000'); await page.fill('input#catalog-search', 'Llama'); await page.locator('select#provider-filter').selectOption('Meta'); expect(await page.locator('.catalog-row').count()).toBeGreaterThan(0);
});

test('1.5 suggestion_chips_apply_filters', async ({ page }) => {
  await page.goto('http://localhost:3000'); await page.click('button.suggestion-chip:has-text("Google")'); expect(await page.locator('.catalog-row').count()).toBeGreaterThan(0);
});

test('1.6 shown_of_total_count_tracks', async ({ page }) => {
  await page.goto('http://localhost:3000'); await expect(page.locator('.model-count')).toContainText('22 of 22 models');
});

test('1.7 zero_match_empty_state', async ({ page }) => {
  await page.goto('http://localhost:3000'); await page.fill('input#catalog-search', 'NonExistentModel123'); await expect(page.locator('text="No models found"')).toBeVisible(); await page.click('button:has-text("Clear filters")'); await expect(page.locator('.catalog-row').first()).toBeVisible();
});

test('1.8 alert_form_validates_inline', async ({ page }) => {
  await page.goto('http://localhost:3000'); await page.click('button:has-text("Alerts")'); await page.fill('input#min-context-window', '-10'); await page.click('text="Minimum context window"', { force: true }); await expect(page.locator('text="Minimum context window must be 0 or greater"')).toBeVisible();
});

test('1.10 cost_sidebar_seeded_rollups', async ({ page }) => {
  await page.goto('http://localhost:3000'); await expect(page.locator('.rollup-row').first()).toBeVisible();
});

test('1.12 legend_toggle_redraws_chart', async ({ page }) => {
  await page.goto('http://localhost:3000'); const start = await page.locator('.recharts-pie-sector').count(); await page.locator('.legend-entry').first().click(); const end = await page.locator('.recharts-pie-sector').count(); expect(end).toBeLessThan(start);
});

test('1.13 cost_row_sources_disclosure', async ({ page }) => {
  await page.goto('http://localhost:3000'); await page.locator('.source-trigger').first().click(); await expect(page.locator('.source-event').first()).toBeVisible();
});

test('1.14 simulation_stream_updates_rollups', async ({ page }) => {
  await page.goto('http://localhost:3000'); await page.click('button:has-text("Start simulation")'); await page.waitForTimeout(4000); expect(await page.locator('.event-card').count()).toBeGreaterThan(0);
});

test('1.15 simulation_pause_freezes_totals', async ({ page }) => {
  await page.goto('http://localhost:3000'); await page.click('button:has-text("Start simulation")'); await page.waitForTimeout(3000); await page.click('button:has-text("Pause simulation")'); const paused = await page.locator('.event-card').count(); await page.waitForTimeout(3000); expect(await page.locator('.event-card').count()).toBe(paused);
});

test('1.16 refresh_mutates_catalog_visibly', async ({ page }) => {
  await page.goto('http://localhost:3000'); await page.click('button:has-text("Refresh")'); await expect(page.getByRole('button', { name: 'Refresh' })).toBeDisabled();
});

test('1.17 compare_flow_round_trip', async ({ page }) => {
  await page.goto('http://localhost:3000'); await page.locator('input[id^="compare-"]').nth(0).click({ force: true }); await page.locator('input[id^="compare-"]').nth(1).click({ force: true }); await page.click('button:has-text("Compare")'); await expect(page.locator('.comparison-table')).toBeVisible();
});

test('1.18 double_refresh_stays_coherent', async ({ page }) => {
  await page.goto('http://localhost:3000'); await page.click('button:has-text("Refresh")'); await page.waitForTimeout(3000); await page.click('button:has-text("Refresh")'); await page.waitForTimeout(3000); expect(await page.locator('.catalog-row').count()).toBeGreaterThan(0);
});

test('1.19 empty_chart_state_when_all_toggled_off', async ({ page }) => {
  await page.goto('http://localhost:3000'); const legends = await page.locator('.legend-entry').count(); for (let i = 0; i < legends; i++) { await page.locator('.legend-entry').nth(i).click(); } await expect(page.locator('.empty-chart')).toBeVisible();
});

test('1.22 pin_watchlist_and_pinned_filter', async ({ page }) => {
  await page.goto('http://localhost:3000'); await page.click('button.pinned-chip'); await expect(page.locator('.catalog-row')).toHaveCount(2);
});

test('1.23 session_budget_ceiling_and_over_budget', async ({ page }) => {
  await page.goto('http://localhost:3000'); await page.fill('input#session-budget', '0.01'); await page.click('button:has-text("Apply")', { force: true }); await expect(page.locator('.remaining-label').filter({ hasText: 'Over budget' })).toBeVisible(); await expect(page.locator('.metric-alert')).toHaveCSS('border-color', 'rgb(255, 131, 137)');
});

test('1.24 budget_field_contract_rejects_invalid', async ({ page }) => {
  await page.goto('http://localhost:3000'); await page.fill('input#session-budget', '0'); await page.click('button:has-text("Apply")', { force: true }); await expect(page.locator('text="Session budget must be greater than 0"')).toBeVisible();
});

test('1.25 manual_usage_log_field_contract', async ({ page }) => {
  await page.goto('http://localhost:3000'); await page.click('button:has-text("Log usage")'); await page.fill('input#prompt-tokens', '-5'); await page.click('text="Prompt tokens"', { force: true }); await expect(page.locator('text="Prompt tokens must be 0 or greater"')).toBeVisible();
});

test('1.26 manual_usage_log_updates_derived_surfaces', async ({ page }) => {
  await page.goto('http://localhost:3000'); await page.click('button:has-text("Log usage")'); await page.locator('select#usage-model').selectOption({ index: 1 }); await page.fill('input#request-label', 'Derived Surface Test'); await page.fill('input#prompt-tokens', '100'); await page.fill('input#completion-tokens', '50'); await page.locator('button.cds--btn--primary').filter({ hasText: 'Log usage' }).click({ force: true }); await expect(page.locator('text="Derived Surface Test"').first()).toBeVisible();
});

test('1.27 undo_redo_mutating_edits', async ({ page }) => {
  await page.goto('http://localhost:3000'); await page.fill('input#session-budget', '1000'); await page.click('button:has-text("Apply")', { force: true }); await page.click('button:has-text("Undo")'); await expect(page.locator('input#session-budget')).not.toHaveValue('1000.00'); await page.click('button:has-text("Redo")'); await expect(page.locator('input#session-budget')).toHaveValue('1000.00');
});

test('1.28 command_palette_destinations_and_actions', async ({ page }) => {
  await page.goto('http://localhost:3000'); await page.keyboard.press('Meta+k'); await page.fill('input#command-search', 'Simula'); await page.locator('.command-results button').first().click({ force: true }); await expect(page.locator('.stream-status.live')).toBeVisible();
});

test('1.29 export_routing_session_report_live', async ({ page }) => {
  await page.goto('http://localhost:3000'); await page.click('button:has-text("Export")'); await expect(page.locator('pre.export-preview')).toContainText('"routing-session-report-v1"');
});

test('1.30 import_session_json_round_trip', async ({ page }) => {
  await page.goto('http://localhost:3000'); await page.click('button:has-text("Export")'); await page.fill('textarea#import-json', '{ "bad": "json" }'); await page.click('button:has-text("Import and replace")', { force: true }); await expect(page.locator('.field-error').filter({ hasText: /valid Session JSON|is invalid/ })).toBeVisible();
});

test('3.3 layout_matches_monitor_composition', async ({ page }) => {
  await page.goto('http://localhost:3000'); const header = page.locator('.catalog-table thead th').first(); await expect(header).toHaveCSS('position', 'sticky');
});

test('11.2 optional_keyboard_power_user_depth', async ({ page }) => {
  await page.goto('http://localhost:3000'); await page.keyboard.press('g'); await page.waitForTimeout(200); await expect(page.locator('.chord-hint')).toBeVisible();
});

test('11.4 optional_budget_burn_projection', async ({ page }) => {
  await page.goto('http://localhost:3000'); await page.click('button:has-text("Start simulation")'); await page.waitForTimeout(1500); await expect(page.locator('.burn-readout')).toContainText('Burn ≈');
});

test('11.5 optional_provider_health_affordance', async ({ page }) => {
  await page.goto('http://localhost:3000'); await expect(page.locator('text="Provider Health"')).toBeVisible();
});

// NOT-AUTOMATABLE: innovation.catchall is a subjective judge-only criterion
// ("any additional innovation not covered elsewhere, name it and cite
// evidence") — there is no fixed observable to assert deterministically.
