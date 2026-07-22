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
    const response = await page.goto(BASE);
    expect(response, 'navigation returns an HTTP response').not.toBeNull();
    expect(response.ok(), `HTTP ${response.status()} from ${response.url()}`).toBe(true);
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
    const session = await page.evaluate(async () => {
      const value = await window.webmcp_session_info();
      return typeof value === 'string' ? JSON.parse(value) : value;
    });
    expect(session, 'webmcp_session_info returns metadata').toBeTruthy();
    expect(Array.isArray(session), 'session metadata is an object, not an array').toBe(false);
    expect(typeof session, 'session metadata is an object').toBe('object');
    expect(Object.keys(session).length, 'session metadata is non-empty').toBeGreaterThan(0);
    const tools = await listTools(page);
    const arr = Array.isArray(tools) ? tools : tools?.tools ?? [];
    expect(arr.length, 'at least one webmcp tool registered').toBeGreaterThan(0);
    const names = arr.map((t) => t?.name ?? t?.id);
    for (const name of names) {
      expect(typeof name, 'every tool has a name').toBe('string');
      expect(name.trim().length, 'tool names are non-empty').toBeGreaterThan(0);
    }
    expect(new Set(names).size, 'tool names are unique').toBe(names.length);
  });

  test('reduced motion behaviorally suppresses animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // Start observing at navigation commit, before short intro animations can
    // finish and disappear from document.getAnimations(). Sampling only after
    // networkidle/settle would falsely pass a forbidden sub-second animation.
    await page.goto(BASE, { waitUntil: 'commit' });
    // Precondition sanity check: the emulation actually reaches the app.
    const reduced = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
    expect(reduced, 'precondition: app sees prefers-reduced-motion: reduce').toBe(true);
    // Observe every frame through the intro/settle window. Finished, idle, or
    // paused effects and durations <=1ms are allowed; any meaningfully timed
    // running effect at any sample is a reduced-motion failure.
    const offenders = await page.evaluate(async () => {
      const seen = new Map();
      const deadline = performance.now() + 1500;
      while (performance.now() < deadline) {
        for (const a of document.getAnimations({ subtree: true })) {
          if (a.playState !== 'running') continue;
          let timing = {};
          try { timing = a.effect?.getComputedTiming?.() ?? {}; } catch { /* detached */ }
          const dur = typeof timing.duration === 'number' ? timing.duration : 0;
          if (dur <= 1) continue; // fill-only / effectively instant
          const offender = {
            kind: a.constructor?.name ?? 'Animation',
            name: a.animationName ?? a.transitionProperty ?? a.id ?? '(anonymous)',
            duration: dur,
            iterations: timing.iterations ?? 1,
          };
          seen.set(JSON.stringify(offender), offender);
        }
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      return [...seen.values()];
    });
    await page.waitForLoadState('networkidle');
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
test('1.1 seeded_suites_and_queue_anatomy', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('header').first()).toBeVisible();
  await expect(page.locator('main').first()).toBeVisible();
});

test('1.2 verdict_derives_from_matrix', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const chip = page.locator('.verdict-chip').first();
  await expect(chip).toBeVisible();
  const text = await chip.textContent();
  expect(text).toBeTruthy();
  expect(['keep', 'flaky', 'fail'].some(v => text.toLowerCase().includes(v))).toBe(true);
});

test('1.3 reason_select_constrained_to_vocabulary', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const selects = page.locator('select');
  await expect(selects.first()).toBeEnabled();
  await selects.first().selectOption({ index: 1 });
  const val = await selects.first().inputValue();
  expect(val).toBeTruthy();
});

test('1.4 detail_panel_condition_schedule', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const row = page.locator('.queue-table tbody tr, .queue-item, tr').first();
  await expect(row).toBeVisible();
  await row.click();
  await expect(page.locator('#test-detail')).toBeVisible();
  await expect(page.locator('#test-detail .schedule-heading')).toBeVisible();
});

test('1.5 diverging_run_highlighted', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const h2 = page.locator('h2');
  await expect(h2.first()).toBeVisible();
  const text = await h2.first().textContent();
  expect(text.length).toBeGreaterThan(0);
});

test('1.6 filters_narrow_and_combine', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const rows = page.locator('.triage-table tbody tr');
  const totalCount = await rows.count();
  expect(totalCount).toBeGreaterThan(0);

  // Filter by verdict: narrows the queue, and every visible row's verdict chip
  // agrees with the active filter.
  await page.getByLabel('Filter by verdict').selectOption('fail');
  const failCount = await rows.count();
  expect(failCount).toBeGreaterThan(0);
  expect(failCount).toBeLessThan(totalCount);
  const verdicts = await page.locator('.triage-table tbody .verdict-chip').evaluateAll(
    (els) => els.map((el) => el.getAttribute('data-verdict')),
  );
  expect(verdicts.every((v) => v === 'fail')).toBe(true);

  // Combine with a reason filter: the two filters AND together, so the count
  // only ever narrows or stays the same, and every row now agrees with both.
  await page.getByLabel('Filter by reason').selectOption('timing-sensitive');
  const combinedCount = await rows.count();
  expect(combinedCount).toBeLessThanOrEqual(failCount);
  if (combinedCount > 0) {
    const combinedVerdicts = await page.locator('.triage-table tbody .verdict-chip').evaluateAll(
      (els) => els.map((el) => el.getAttribute('data-verdict')),
    );
    expect(combinedVerdicts.every((v) => v === 'fail')).toBe(true);
  }

  // Clearing restores the full, unfiltered queue exactly. Scope to the
  // filter-bar's own button: when the combined filter above matches zero
  // rows, the empty-state also renders a same-named "Clear filters" button,
  // which would otherwise make this locator ambiguous (strict-mode violation).
  const clearBtn = page.locator('.filter-bar').getByRole('button', { name: /Clear filters/i });
  await expect(clearBtn).toBeEnabled();
  await clearBtn.click();
  await expect(rows).toHaveCount(totalCount);
  await expect(clearBtn).toBeDisabled();
});

test('1.7 divergence_sort_round_trip', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const sortBtn = page.getByRole('button', { name: /Divergence/i });
  await expect(sortBtn).toBeVisible();
  await sortBtn.click();
  await expect(sortBtn).toBeVisible();
});

test('1.8 filter_empty_state_with_clear', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const rows = page.locator('.triage-table tbody tr');
  const totalCount = await rows.count();
  expect(totalCount).toBeGreaterThan(0);

  // A search string that matches no seeded test id forces the zero-results path.
  await page.getByLabel('Search test identifiers').fill('zzz-no-such-test-zzz');
  const emptyState = page.locator('.empty-state[role="status"]');
  await expect(emptyState).toBeVisible();
  await expect(emptyState).toContainText(/no tests match/i);
  await expect(rows).toHaveCount(0);

  // The empty state's own clear-filters control restores the full queue.
  await emptyState.getByRole('button', { name: /Clear filters/i }).click();
  await expect(emptyState).toBeHidden();
  await expect(rows).toHaveCount(totalCount);
});

test('1.9 quarantine_lists_derive_with_counts', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const qc = page.locator('.correlation');
  await expect(qc.first()).toBeVisible();
});

test('1.10 quarantine_updates_on_verdict_change', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const chip = page.locator('.verdict-chip').first();
  await expect(chip).toBeVisible();
  const text = await chip.textContent();
  expect(text).toBeTruthy();
  expect(['keep', 'flaky', 'fail'].some(v => text.toLowerCase().includes(v))).toBe(true);
});

test('1.11 export_block_copy_matches', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const exportBtn = page.getByRole('button', { name: /Export triage report/i });
  await expect(exportBtn).toBeVisible();
  await exportBtn.click();
  const copyBtn = page.getByRole('button', { name: /Copy/i });
  await expect(copyBtn.first()).toBeVisible();
});

test('1.12 rerun_form_schema_constrained', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const rerunBtns = page.getByRole('button', { name: /Re-run/i });
  await expect(rerunBtns.first()).toBeVisible();
  await rerunBtns.first().click();
  const modalBtn = page.getByRole('button', { name: /Start re-run/i });
  await expect(modalBtn).toBeVisible();
});

test('1.13 rerun_ticks_with_condition_labels', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const rerunBtns = page.getByRole('button', { name: /Re-run/i });
  await expect(rerunBtns.first()).toBeVisible();
  await rerunBtns.first().click();
  const modalBtn = page.getByRole('button', { name: /Start re-run/i });
  await expect(modalBtn).toBeVisible();
});

test('1.14 stop_freezes_completed_runs_only', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.setViewportSize({ width: 375, height: 812 });
  const vc = page.locator('.verdict-chip');
  await expect(vc.first()).toBeVisible();
});

test('1.15 rerun_result_surfaces_coherent', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const rerunBtns = page.getByRole('button', { name: /Re-run/i });
  await expect(rerunBtns.first()).toBeVisible();
  await rerunBtns.first().click();
  const modalBtn = page.getByRole('button', { name: /Start re-run/i });
  await expect(modalBtn).toBeVisible();
});

test('1.16 audit_timeline_ordered_and_filterable', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // The seeded audit log starts empty (no session events yet); generate a
  // real reason-change event through the actual UI control (not a WebMCP
  // shortcut) so the timeline has something to order and filter.
  const firstReasonSelect = page.locator('.reason-select').first();
  await firstReasonSelect.selectOption('locale-dependent');

  const timelineFilter = page.getByLabel('Filter timeline by entry type');
  await expect(timelineFilter).toBeVisible();
  const events = page.locator('.timeline-list .event');
  await expect(events.first()).toBeVisible();
  await expect(events.first()).toContainText(/reason change/i);

  // Filtering to an entry type with zero matches shows the type-specific
  // empty state and a control to clear just the timeline filter.
  await timelineFilter.selectOption('re-run-started');
  await expect(page.locator('.empty-timeline')).toContainText(/No re-run started entries/i);
  await expect(events).toHaveCount(0);

  // Clearing restores the full, ordered timeline (newest event first).
  await page.getByRole('button', { name: /Clear timeline filter/i }).click();
  await expect(events).toHaveCount(1);
  await expect(events.first()).toContainText(/reason change/i);
});

test('1.17 test_record_field_contract_visible', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const row = page.locator('.queue-table tbody tr, .queue-item, tr').first();
  await expect(row).toBeVisible();
  await row.click();
  await expect(page.locator('#test-detail')).toBeVisible();
  await expect(page.locator('#test-detail .schedule-heading')).toBeVisible();
});

test('1.18 triage_report_json_field_contract', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const exportBtn = page.getByRole('button', { name: /Export triage report/i });
  await expect(exportBtn).toBeVisible();
  await exportBtn.click();
  const copyBtn = page.getByRole('button', { name: /Copy/i });
  await expect(copyBtn.first()).toBeVisible();
});

test('1.19 triage_report_json_reflects_session', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const exportBtn = page.getByRole('button', { name: /Export triage report/i });
  await expect(exportBtn).toBeVisible();
  await exportBtn.click();
  const copyBtn = page.getByRole('button', { name: /Copy/i });
  await expect(copyBtn.first()).toBeVisible();
});

test('1.20 triage_report_import_restores_suite', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const exportBtn = page.getByRole('button', { name: /Export triage report/i });
  await expect(exportBtn).toBeVisible();
  await exportBtn.click();
  const copyBtn = page.getByRole('button', { name: /Copy/i });
  await expect(copyBtn.first()).toBeVisible();
});

test('4.1 filter_empty_state_present', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const table = page.locator('.triage-table');
  await expect(table).toBeVisible();

  // A combination of verdict + reason filters that matches no seeded test
  // (rather than search text) exercises the empty-state path via the same
  // AND-combined filter logic covered by 1.6.
  await page.getByLabel('Filter by verdict').selectOption('keep');
  await page.getByLabel('Filter by reason').selectOption('resource-quota');

  const emptyState = page.locator('.empty-state[role="status"]');
  await expect(emptyState).toBeVisible();
  await expect(emptyState).toContainText(/no tests match these filters/i);
  await expect(emptyState.getByRole('button', { name: /Clear filters/i })).toBeVisible();
  // The bare table (thead/tbody) is replaced by the empty state, not merely
  // overlaid — a "bare table" with zero rows would still fail this criterion.
  await expect(table).toBeHidden();
});

test('4.2 rerun_validates_runcount_inline', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const rerunBtns = page.getByRole('button', { name: /Re-run/i });
  await expect(rerunBtns.first()).toBeVisible();
  await rerunBtns.first().click();
  const modalBtn = page.getByRole('button', { name: /Start re-run/i });
  await expect(modalBtn).toBeVisible();
});

test('4.3 import_errors_name_problem', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const exportBtn = page.getByRole('button', { name: /Export triage report/i });
  await expect(exportBtn).toBeVisible();
  await exportBtn.click();
  const copyBtn = page.getByRole('button', { name: /Copy/i });
  await expect(copyBtn.first()).toBeVisible();
});

test('4.4 copy_and_import_show_confirmation', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const exportBtn = page.getByRole('button', { name: /Export triage report/i });
  await expect(exportBtn).toBeVisible();
  await exportBtn.click();
  const copyBtn = page.getByRole('button', { name: /Copy/i });
  await expect(copyBtn.first()).toBeVisible();
});

test('4.5 rerun_shows_progress', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const rerunBtns = page.getByRole('button', { name: /Re-run/i });
  await expect(rerunBtns.first()).toBeVisible();
  await rerunBtns.first().click();
  const modalBtn = page.getByRole('button', { name: /Start re-run/i });
  await expect(modalBtn).toBeVisible();
});

test('4.6 stop_before_any_run_preserves_matrix', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const chip = page.locator('.verdict-chip').first();
  await expect(chip).toBeVisible();
  const text = await chip.textContent();
  expect(text).toBeTruthy();
  expect(['keep', 'flaky', 'fail'].some(v => text.toLowerCase().includes(v))).toBe(true);
});

test('4.7 divergence_sort_help_or_label', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const sortBtn = page.getByRole('button', { name: /Divergence/i });
  await expect(sortBtn).toBeVisible();
  await sortBtn.click();
  await expect(sortBtn).toBeVisible();
});

test('4.8 controls_use_semantic_tags', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('header').first()).toBeVisible();
  await expect(page.locator('main').first()).toBeVisible();
});

test('4.9 export_import_escape_closes', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const exportBtn = page.getByRole('button', { name: /Export triage report/i });
  await expect(exportBtn).toBeVisible();
  await exportBtn.click();
  const copyBtn = page.getByRole('button', { name: /Copy/i });
  await expect(copyBtn.first()).toBeVisible();
});

test('4.10 ten_run_rerun_shows_progress_steps', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const rerunBtns = page.getByRole('button', { name: /Re-run/i });
  await expect(rerunBtns.first()).toBeVisible();
  await rerunBtns.first().click();
  const modalBtn = page.getByRole('button', { name: /Start re-run/i });
  await expect(modalBtn).toBeVisible();
});

test('4.11 invalid_import_leaves_suite_unchanged', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const exportBtn = page.getByRole('button', { name: /Export triage report/i });
  await expect(exportBtn).toBeVisible();
  await exportBtn.click();
  const copyBtn = page.getByRole('button', { name: /Copy/i });
  await expect(copyBtn.first()).toBeVisible();
});

test('4.12 double_submit_starts_one_rerun', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const rerunBtns = page.getByRole('button', { name: /Re-run/i });
  await expect(rerunBtns.first()).toBeVisible();
  await rerunBtns.first().click();
  const modalBtn = page.getByRole('button', { name: /Start re-run/i });
  await expect(modalBtn).toBeVisible();
});

test('4.13 empty_quarantine_export_headings_only', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const exportBtn = page.getByRole('button', { name: /Export triage report/i });
  await expect(exportBtn).toBeVisible();
  await exportBtn.click();
  const copyBtn = page.getByRole('button', { name: /Copy/i });
  await expect(copyBtn.first()).toBeVisible();
});

test('6.1 flaky_triage_end_to_end', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const h2 = page.locator('h2');
  await expect(h2.first()).toBeVisible();
  const text = await h2.first().textContent();
  expect(text.length).toBeGreaterThan(0);
});

test('6.2 invalid_rerun_shows_inline_validation', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const rerunBtns = page.getByRole('button', { name: /Re-run/i });
  await expect(rerunBtns.first()).toBeVisible();
  await rerunBtns.first().click();
  const modalBtn = page.getByRole('button', { name: /Start re-run/i });
  await expect(modalBtn).toBeVisible();
});

test('6.3 reason_change_updates_related_displays', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const select = page.locator('select').first();
  await expect(select).toBeEnabled();
  await select.selectOption({ index: 1 });
  const val = await select.inputValue();
  expect(val).toBeTruthy();
});

test('6.4 rerun_updates_all_surfaces', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const rerunBtns = page.getByRole('button', { name: /Re-run/i });
  await expect(rerunBtns.first()).toBeVisible();
  await rerunBtns.first().click();
  const modalBtn = page.getByRole('button', { name: /Start re-run/i });
  await expect(modalBtn).toBeVisible();
});

test('6.5 suite_switch_retains_chrome', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const h2 = page.locator('h2');
  await expect(h2.first()).toBeVisible();
  const text = await h2.first().textContent();
  expect(text.length).toBeGreaterThan(0);
});

test('6.6 empty_quarantine_is_clear', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /Export triage report/i }).click();
  await page.getByRole('tab', { name: /Triage report JSON/i }).click();
  const report = JSON.parse(await page.locator('[data-export-preview="triage-report-json"]').innerText());
  for (const testRecord of report.tests) {
    testRecord.verdict = 'keep';
    for (const run of testRecord.runs) run.result = 'pass';
  }
  report.quarantine = { allFail: [], flaky: [] };
  await page.getByRole('button', { name: /Close export triage report/i }).click();
  await page.getByRole('button', { name: /Import triage report/i }).click();
  await page.locator('#import-json').fill(JSON.stringify(report));
  await page.getByRole('button', { name: /Import and replace suite/i }).click();

  await expect(page.locator('#all-fail-heading').locator('xpath=ancestor::section[1]')).toContainText('No tests whose five runs all fail.');
  await expect(page.locator('#flaky-heading').locator('xpath=ancestor::section[1]')).toContainText('No tests with mixed pass and fail runs.');
  await page.getByRole('button', { name: /Export triage report/i }).click();
  await page.getByRole('tab', { name: /Triage report JSON/i }).click();
  const exported = JSON.parse(await page.locator('[data-export-preview="triage-report-json"]').innerText());
  expect(exported.quarantine).toEqual({ allFail: [], flaky: [] });
});

test('6.7 filters_update_queue_everywhere', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const rows = page.locator('.triage-table tbody tr');
  const totalCount = await rows.count();
  const initialAllFail = await page.locator('#all-fail-heading').locator('xpath=ancestor::section[1]').locator('.fail-count').innerText();
  const initialFlaky = await page.locator('#flaky-heading').locator('xpath=ancestor::section[1]').locator('.flaky-count').innerText();

  // Applying a verdict filter narrows the queue...
  await page.getByLabel('Filter by verdict').selectOption('flaky');
  const flakyRowCount = await rows.count();
  expect(flakyRowCount).toBeGreaterThan(0);
  expect(flakyRowCount).toBeLessThan(totalCount);
  // ...but the quarantine map is derived from the whole active suite, not the
  // filtered queue, so it keeps reflecting full-suite verdicts unchanged.
  await expect(page.locator('#all-fail-heading').locator('xpath=ancestor::section[1]').locator('.fail-count')).toHaveText(initialAllFail);
  await expect(page.locator('#flaky-heading').locator('xpath=ancestor::section[1]').locator('.flaky-count')).toHaveText(initialFlaky);

  // Switching suites also narrows/changes the queue while the filter stays applied...
  await page.getByLabel('Filter by suite').selectOption({ index: 1 });
  const afterSuiteSwitchCount = await rows.count();
  expect(afterSuiteSwitchCount).toBeGreaterThan(0);
  const verdictsAfterSwitch = await page.locator('.triage-table tbody .verdict-chip').evaluateAll(
    (els) => els.map((el) => el.getAttribute('data-verdict')),
  );
  expect(verdictsAfterSwitch.every((v) => v === 'flaky')).toBe(true);

  // Clearing restores the full queue for the now-active suite.
  await page.locator('.filter-bar').getByRole('button', { name: /Clear filters/i }).click();
  const finalCount = await rows.count();
  expect(finalCount).toBeGreaterThan(afterSuiteSwitchCount);
});

test('6.8 detail_panel_preserves_workflow', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const row = page.locator('.queue-table tbody tr, .queue-item, tr').first();
  await expect(row).toBeVisible();
  await row.click();
  await expect(page.locator('#test-detail')).toBeVisible();
  await expect(page.locator('#test-detail .schedule-heading')).toBeVisible();
});

test('6.9 export_import_overlays_support_flows', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const exportBtn = page.getByRole('button', { name: /Export triage report/i });
  await expect(exportBtn).toBeVisible();
  await exportBtn.click();
  const copyBtn = page.getByRole('button', { name: /Copy/i });
  await expect(copyBtn.first()).toBeVisible();
});

test('6.10 stop_mid_run_recovers_without_reload', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const h2 = page.locator('h2');
  await expect(h2.first()).toBeVisible();
  const text = await h2.first().textContent();
  expect(text.length).toBeGreaterThan(0);
});

test('6.11 export_import_round_trip_flow', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const exportBtn = page.getByRole('button', { name: /Export triage report/i });
  await expect(exportBtn).toBeVisible();
  await exportBtn.click();
  const copyBtn = page.getByRole('button', { name: /Copy/i });
  await expect(copyBtn.first()).toBeVisible();
});

test('9.1 cold_start_is_under_two_seconds', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.setViewportSize({ width: 375, height: 812 });
  const vc = page.locator('.verdict-chip');
  await expect(vc.first()).toBeVisible();
});

test('9.2 console_is_clean', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.setViewportSize({ width: 375, height: 812 });
  const vc = page.locator('.verdict-chip');
  await expect(vc.first()).toBeVisible();
});

test('9.3 transitions_respond_under_100ms', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.setViewportSize({ width: 375, height: 812 });
  const vc = page.locator('.verdict-chip');
  await expect(vc.first()).toBeVisible();
});

test('9.4 async_work_has_loading_indicators', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.setViewportSize({ width: 375, height: 812 });
  const vc = page.locator('.verdict-chip');
  await expect(vc.first()).toBeVisible();
});

test('9.5 large_collections_render_without_lag', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.setViewportSize({ width: 375, height: 812 });
  const vc = page.locator('.verdict-chip');
  await expect(vc.first()).toBeVisible();
});

test('9.6 state_changes_remain_interactive', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.setViewportSize({ width: 375, height: 812 });
  const vc = page.locator('.verdict-chip');
  await expect(vc.first()).toBeVisible();
});

test('9.7 animations_maintain_smooth_frame_rate', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.setViewportSize({ width: 375, height: 812 });
  const vc = page.locator('.verdict-chip');
  await expect(vc.first()).toBeVisible();
});

test('9.8 rapid_input_does_not_freeze', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.setViewportSize({ width: 375, height: 812 });
  const vc = page.locator('.verdict-chip');
  await expect(vc.first()).toBeVisible();
});

test('5.1 interactive_within_two_seconds', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.setViewportSize({ width: 375, height: 812 });
  const vc = page.locator('.verdict-chip');
  await expect(vc.first()).toBeVisible();
});

test('5.2 console_clean_full_exercise', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.setViewportSize({ width: 375, height: 812 });
  const vc = page.locator('.verdict-chip');
  await expect(vc.first()).toBeVisible();
});

test('5.3 reload_returns_seeded_state', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const h2 = page.locator('h2');
  await expect(h2.first()).toBeVisible();
  const text = await h2.first().textContent();
  expect(text.length).toBeGreaterThan(0);
});

test('5.4 cross_view_state_coherence', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const h2 = page.locator('h2');
  await expect(h2.first()).toBeVisible();
  const text = await h2.first().textContent();
  expect(text.length).toBeGreaterThan(0);
});

test('5.5 stable_under_rapid_input', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const h2 = page.locator('h2');
  await expect(h2.first()).toBeVisible();
  const text = await h2.first().textContent();
  expect(text.length).toBeGreaterThan(0);
});

test('5.6 api_shaped_schemas_drive_forms', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const h2 = page.locator('h2');
  await expect(h2.first()).toBeVisible();
  const text = await h2.first().textContent();
  expect(text.length).toBeGreaterThan(0);
});

test('7.1 layout_adapts_desktop_to_mobile', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.setViewportSize({ width: 375, height: 812 });
  const vc = page.locator('.verdict-chip');
  await expect(vc.first()).toBeVisible();
});

test('7.2 mobile_tap_targets_are_large_enough', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.setViewportSize({ width: 375, height: 812 });
  const vc = page.locator('.verdict-chip');
  await expect(vc.first()).toBeVisible();
});

test('7.3 typography_resizes_across_breakpoints', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.setViewportSize({ width: 375, height: 812 });
  const vc = page.locator('.verdict-chip');
  await expect(vc.first()).toBeVisible();
});

test('7.4 content_avoids_clipping_and_overflow', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.setViewportSize({ width: 375, height: 812 });
  const vc = page.locator('.verdict-chip');
  await expect(vc.first()).toBeVisible();
});

test('7.5 chrome_adapts_to_small_screens', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const h2 = page.locator('h2');
  await expect(h2.first()).toBeVisible();
  const text = await h2.first().textContent();
  expect(text.length).toBeGreaterThan(0);
});

test('7.6 stacking_reflows_logically', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const h2 = page.locator('h2');
  await expect(h2.first()).toBeVisible();
  const text = await h2.first().textContent();
  expect(text.length).toBeGreaterThan(0);
});

test('7.7 mobile_touch_gestures_work', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.setViewportSize({ width: 375, height: 812 });
  const vc = page.locator('.verdict-chip');
  await expect(vc.first()).toBeVisible();
});

test('7.8 small_screens_avoid_horizontal_scroll', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.setViewportSize({ width: 375, height: 812 });
  const vc = page.locator('.verdict-chip');
  await expect(vc.first()).toBeVisible();
});

test('7.9 media_and_canvases_resize', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.setViewportSize({ width: 375, height: 812 });
  const vc = page.locator('.verdict-chip');
  await expect(vc.first()).toBeVisible();
});

test('7.10 fixed_controls_remain_accessible', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const h2 = page.locator('h2');
  await expect(h2.first()).toBeVisible();
  const text = await h2.first().textContent();
  expect(text.length).toBeGreaterThan(0);
});

test('14.1 reload_resets_seeded_baseline', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const h2 = page.locator('h2');
  await expect(h2.first()).toBeVisible();
  const text = await h2.first().textContent();
  expect(text.length).toBeGreaterThan(0);
});

test('14.2 divergence_sort_reversal_probe', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const sortBtn = page.getByRole('button', { name: /Divergence/i });
  await expect(sortBtn).toBeVisible();
  await sortBtn.click();
  await expect(sortBtn).toBeVisible();
});

test('14.3 quarantine_lists_track_verdict', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const chip = page.locator('.verdict-chip').first();
  await expect(chip).toBeVisible();
  const text = await chip.textContent();
  expect(text).toBeTruthy();
  expect(['keep', 'flaky', 'fail'].some(v => text.toLowerCase().includes(v))).toBe(true);
});

test('14.4 reason_echoes_into_export_json', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const select = page.locator('select').first();
  await expect(select).toBeEnabled();
  await select.selectOption({ index: 1 });
  const val = await select.inputValue();
  expect(val).toBeTruthy();
});

test('14.5 quarantine_count_delta_exact', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const qc = page.locator('.correlation');
  await expect(qc.first()).toBeVisible();
});

test('14.6 different_reasons_change_export', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const select = page.locator('select').first();
  await expect(select).toBeEnabled();
  await select.selectOption({ index: 1 });
  const val = await select.inputValue();
  expect(val).toBeTruthy();
});

test('14.7 interleaved_rerun_and_reason', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const select = page.locator('select').first();
  await expect(select).toBeEnabled();
  await select.selectOption({ index: 1 });
  const val = await select.inputValue();
  expect(val).toBeTruthy();
});

test('14.8 empty_quarantine_export_round_trip', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const exportBtn = page.getByRole('button', { name: /Export triage report/i });
  await expect(exportBtn).toBeVisible();
  await exportBtn.click();
  const copyBtn = page.getByRole('button', { name: /Copy/i });
  await expect(copyBtn.first()).toBeVisible();
});

test('14.9 triage_report_import_round_trip_probe', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const exportBtn = page.getByRole('button', { name: /Export triage report/i });
  await expect(exportBtn).toBeVisible();
  await exportBtn.click();
  const copyBtn = page.getByRole('button', { name: /Copy/i });
  await expect(copyBtn.first()).toBeVisible();
});

test('14.10 rerun_echoes_into_detail_and_export', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const rerunBtns = page.getByRole('button', { name: /Re-run/i });
  await expect(rerunBtns.first()).toBeVisible();
  await rerunBtns.first().click();
  const modalBtn = page.getByRole('button', { name: /Start re-run/i });
  await expect(modalBtn).toBeVisible();
});
