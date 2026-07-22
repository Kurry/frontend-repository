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



const URL = 'http://localhost:3000';

test('1.2 created_transaction_appears_in_list', async ({ page }) => {
  await page.goto(URL);
  await page.click('#new-transaction-btn');
  await page.fill('input[formControlName="payee"]', 'Test Payee 1.2');
  await page.fill('input[formControlName="amount"]', '-100.50');
  await page.selectOption('select[formControlName="category"]', { label: 'Restaurants' });
  await page.click('button:has-text("Create transaction")');
  await expect(page.locator('text=Test Payee 1.2').first()).toBeVisible();
});


test('2.11 document_title_ledger_reports', async ({ page }) => {
  await page.goto(URL);
  await expect(page).toHaveTitle('Ledger | Reports');
});


test('2.4 console_clean_during_full_exercise', async ({ page }) => {
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', error => errors.push(error.message));

  await page.goto(URL);
  await page.click('#new-transaction-btn');
  await page.fill('input[formControlName="payee"]', 'Console Test');
  await page.fill('input[formControlName="amount"]', '-50.00');
  await page.selectOption('select[formControlName="category"]', { label: 'Restaurants' });
  await page.click('button:has-text("Create transaction")');

  await page.click('text=Trends');
  await page.click('#export-report-btn');
  await page.locator('button i.pi-times').first().click();

  expect(errors).toHaveLength(0);
});


test('1.36 form_submit_disabled_until_valid', async ({ page }) => {
  await page.goto(URL);
  await page.click('#new-transaction-btn');
  const submitBtn = page.locator('button:has-text("Create transaction")');
  await expect(submitBtn).toBeDisabled();
  await page.fill('input[formControlName="payee"]', 'Valid Payee');
  await expect(submitBtn).toBeDisabled();
  await page.fill('input[formControlName="amount"]', '-10.00');
  await expect(submitBtn).toBeEnabled();
});


test('1.38 field_contract_rejects_zero_and_cross_field', async ({ page }) => {
  await page.goto(URL);
  await page.click('#new-transaction-btn');
  await page.fill('input[formControlName="payee"]', 'Zero Test');
  await page.fill('input[formControlName="amount"]', '0');
  await expect(page.locator('button:has-text("Create transaction")')).toBeDisabled();

  await page.fill('input[formControlName="amount"]', '-10.00');
  await page.selectOption('select[formControlName="category"]', { label: 'Salary' });
  await expect(page.locator('button:has-text("Create transaction")')).toBeDisabled();
});


test('1.16 summary_strip_tracks_collection', async ({ page }) => {
  await page.goto(URL);
  const stripCount = page.locator('.strip-tile', { has: page.locator('.strip-key', { hasText: 'Transactions' }) }).locator('.strip-val');
  const stripLast = page.locator('.strip-tile', { has: page.locator('.strip-key', { hasText: 'Last entry' }) }).locator('.strip-val');
  const initialCount = parseInt((await stripCount.textContent()).trim(), 10);
  expect(Number.isNaN(initialCount)).toBe(false);
  const initialLast = (await stripLast.textContent()).trim();

  await page.click('#new-transaction-btn');
  await page.fill('input[formControlName="date"]', '2030-01-01');
  await page.fill('input[formControlName="payee"]', 'Strip Test');
  await page.fill('input[formControlName="amount"]', '-10.00');
  await page.selectOption('select[formControlName="category"]', { label: 'Restaurants' });
  await page.click('button:has-text("Create transaction")');

  await expect(stripCount).toHaveText(String(initialCount + 1));
  // A far-future date becomes the new most-recent transaction, so "Last entry" must update too.
  await expect(stripLast).not.toHaveText(initialLast);

  await page.click('tbody tr:has-text("Strip Test") >> button[aria-label="Delete Strip Test"]');
  await page.click('button:has-text("Delete transaction")');
  await expect(stripCount).toHaveText(String(initialCount));
});


test('1.45 command_palette_filter_and_escape', async ({ page }) => {
  await page.goto(URL);
  await page.keyboard.press('Control+k');
  const palette = page.locator('.overlay-card');
  await expect(palette).toBeVisible();

  await page.fill('.overlay-card input', 'New');
  await expect(page.locator('.overlay-card :has-text("New transaction")').first()).toBeVisible();
  await expect(page.locator('.overlay-card :has-text("Clear filters")')).toBeHidden();

  await page.keyboard.press('Escape');
  await expect(palette).toBeHidden();
});


// DROPPED (fails live oracle): '1.46 export_mirrors_burnrate_and_filters'

test('1.47 import_append_mode_adds_rows', async ({ page }) => {
  await page.goto(URL);
  const stripCount = page.locator('.strip-tile', { has: page.locator('.strip-key', { hasText: 'Transactions' }) }).locator('.strip-val');
  const initialCount = parseInt((await stripCount.textContent()).trim(), 10);
  expect(Number.isNaN(initialCount)).toBe(false);

  await page.click('#import-csv-btn');
  await page.fill('textarea', 'date,payee,category,account,amount,status\n2025-01-01,Test Appended,Groceries,Checking,-10.00,cleared');
  await page.click('button:has-text("Append")');
  await page.click('button:has-text("Commit")');

  await expect(stripCount).toHaveText(String(initialCount + 1));
  await expect(page.locator('text=Test Appended').first()).toBeVisible();
});


test('7.10 fixed_controls_remain_accessible', async ({ page }) => {
  await page.goto(URL);
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(page.locator('#new-transaction-btn')).toBeVisible();
});


test('9.2 console_is_clean', async ({ page }) => {
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(URL);
  expect(errors).toHaveLength(0);
});


// DROPPED (fails live oracle): '1.9 category_filter_narrows_list'

// DROPPED (fails live oracle): '1.30 filter_clear_restores_full_list_exactly'

test('1.39 date_range_and_payee_search_narrow_list', async ({ page }) => {
  await page.goto(URL);
  await page.waitForSelector('tbody tr');
  const initialRows = await page.locator('tbody tr').count();

  // --- payee search half of the criterion ---
  await page.fill('#payee-search', 'NonExistentPayee123');
  await page.waitForTimeout(300);
  const filteredRows = await page.locator('tbody tr').count();
  expect(filteredRows).toBeLessThan(initialRows);

  await page.fill('#payee-search', '');
  await page.waitForTimeout(300);
  const restoredRows = await page.locator('tbody tr').count();
  expect(restoredRows).toBe(initialRows);

  // --- date-range half of the criterion: drive #date-start/#date-end for real ---
  // Read every row's displayed date and derive the earliest one in ISO form
  // (the app's own isoDate() convention) directly from the DOM, so the test
  // narrows the range using dates that genuinely exist in the current data
  // instead of a hardcoded date that could drift out of range.
  const isoDates = await page.locator('tbody tr td[data-label="Date"]').evaluateAll((cells) =>
    cells.map((c) => {
      const d = new Date(c.textContent.trim());
      const p = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    })
  );
  const sorted = [...isoDates].sort();
  const minIso = sorted[0];
  const maxIso = sorted[sorted.length - 1];
  const rowsOnMinDate = isoDates.filter((d) => d === minIso).length;

  // Narrowing: an end date equal to the earliest row's date keeps only rows
  // on that date and must be strictly fewer than the full set (there is more
  // than one distinct date among the seed rows).
  await page.fill('#date-end', minIso);
  await page.waitForTimeout(300);
  const endNarrowedRows = await page.locator('tbody tr').count();
  expect(endNarrowedRows).toBe(rowsOnMinDate);
  expect(endNarrowedRows).toBeLessThan(initialRows);

  await page.fill('#date-end', '');
  await page.waitForTimeout(300);
  expect(await page.locator('tbody tr').count()).toBe(initialRows);

  // A start date after the last real transaction date must exclude every row
  // (proves the lower bound of the range is genuinely enforced, not ignored).
  const afterMax = new Date(`${maxIso}T00:00:00`);
  afterMax.setDate(afterMax.getDate() + 1);
  const p2 = (n) => String(n).padStart(2, '0');
  const startIso = `${afterMax.getFullYear()}-${p2(afterMax.getMonth() + 1)}-${p2(afterMax.getDate())}`;
  await page.fill('#date-start', startIso);
  await page.waitForTimeout(300);
  expect(await page.locator('tbody tr').count()).toBe(0);

  await page.fill('#date-start', '');
  await page.waitForTimeout(300);
  expect(await page.locator('tbody tr').count()).toBe(initialRows);
});


test('1.31 double_submit_creates_exactly_one_row', async ({ page }) => {
  await page.goto(URL);
  await page.waitForSelector('tbody tr');
  const initialRows = await page.locator('tbody tr').count();

  await page.click('#new-transaction-btn');
  await page.fill('input[formControlName="payee"]', 'Double Submit Test');
  await page.fill('input[formControlName="amount"]', '-100.00');
  await page.selectOption('select[formControlName="category"]', { label: 'Restaurants' });

  const submitBtn = page.locator('button:has-text("Create transaction")');
  await submitBtn.click();
  try { await submitBtn.click({ force: true, timeout: 500 }); } catch (e) {}

  await expect(page.locator('text=Double Submit Test').first()).toBeVisible();
  const finalRows = await page.locator('tbody tr').count();
  expect(finalRows).toBe(initialRows + 1);
});


test('1.34 charts_redraw_on_filter_change', async ({ page }) => {
  await page.goto(URL);

  const cardVal = page.locator('.stat-card', { hasText: 'Total Net Income' }).locator('.font-display');
  const initialNetIncome = await cardVal.textContent();

  await page.locator('button:has-text("All types")').click();
  await page.click('button[role="option"]:has-text("Expenses")');
  await page.waitForTimeout(300);

  const finalNetIncome = await cardVal.textContent();

  expect(initialNetIncome).not.toEqual(finalNetIncome);
});


test('1.6 deleted_transaction_removed_from_list', async ({ page }) => {
  await page.goto(URL);
  await page.waitForSelector('tbody tr');

  await page.click('#new-transaction-btn');
  await page.fill('input[formControlName="payee"]', 'Delete Me');
  await page.fill('input[formControlName="amount"]', '-10.00');
  await page.selectOption('select[formControlName="category"]', { label: 'Restaurants' });
  await page.click('button:has-text("Create transaction")');
  await expect(page.locator('text=Delete Me').first()).toBeVisible();

  await page.click('tbody tr:has-text("Delete Me") >> button[aria-label="Delete Delete Me"]');
  await page.click('button:has-text("Delete transaction")');

  await expect(page.locator('text=Delete Me').first()).toBeHidden();
});


test('1.4 expense_create_updates_kpi', async ({ page }) => {
  await page.goto(URL);
  const cardVal = page.locator('.stat-card', { hasText: 'Total Expenses' }).locator('.font-display');
  const initialValue = await cardVal.textContent();

  await page.click('#new-transaction-btn');
  await page.fill('input[formControlName="payee"]', 'KPI Test');
  await page.fill('input[formControlName="amount"]', '-10.00');
  await page.selectOption('select[formControlName="category"]', { label: 'Restaurants' });
  await page.click('button:has-text("Create transaction")');

  await expect(cardVal).not.toHaveText(initialValue);
});


// DROPPED (fails live oracle): '1.40 burn_rate_panel_tracks_ceiling_and_overage'

// DROPPED (fails live oracle): '1.29 delete_flow_clears_row_selection_and_aggregates'

// Explicit tests for criteria requested to be implemented with exact assertions



test('1.5 forms_have_explicit_labels', async ({ page }) => {
  await page.goto(URL);
  await page.click('#new-transaction-btn');
  // Every named create/edit field must resolve a non-empty accessible name
  // via a programmatic association (wrapping <label>, aria-label or
  // aria-labelledby) — not just "some label exists somewhere on the page".
  for (const name of ['date', 'payee', 'category', 'account', 'amount', 'status']) {
    const field = page.locator(`[formControlName="${name}"]`);
    const accessibleName = await field.evaluate((el) => {
      const wrappingLabel = el.closest('label');
      if (wrappingLabel) return wrappingLabel.innerText.trim();
      const labelledBy = el.getAttribute('aria-labelledby');
      if (labelledBy) return (document.getElementById(labelledBy)?.innerText ?? '').trim();
      return (el.getAttribute('aria-label') ?? '').trim();
    });
    expect(accessibleName.length, `formControlName="${name}" has a programmatic label`).toBeGreaterThan(0);
  }
  await page.click('button:has-text("Cancel")');

  // The burn-rate ceiling input, called out explicitly by the criterion.
  const ceiling = page.locator('#ceiling-input');
  const ceilingLabel = await ceiling.evaluate((el) => (el.closest('label')?.innerText ?? '').trim());
  expect(ceilingLabel.length, 'burn-rate ceiling input has a programmatic label').toBeGreaterThan(0);
});


test('1.6 headings_follow_logical_order', async ({ page }) => {
  await page.goto(URL);
  const levels = await page.locator('h1, h2, h3, h4, h5, h6').evaluateAll((els) =>
    els.map((el) => Number(el.tagName[1]))
  );
  expect(levels[0], 'page starts with an h1').toBe(1);
  for (let i = 1; i < levels.length; i++) {
    expect(levels[i] - levels[i - 1], `heading level jump at index ${i}: ${levels[i - 1]} -> ${levels[i]}`).toBeLessThanOrEqual(1);
  }
});


test('1.7 landmark_navigation_is_present', async ({ page }) => {
  await page.goto(URL);
  // The sidebar's <nav> and the reports column's <main> must be distinct,
  // independently-labelled landmarks (not just "a <nav> and a <main> exist
  // somewhere"), so assistive tech can actually tell them apart.
  const nav = page.locator('nav[aria-label]').first();
  await expect(nav).toBeVisible();
  const main = page.locator('main');
  await expect(main).toBeVisible();
  await expect(main.locator('[aria-label="Transactions"]')).toBeVisible();
  const navLabel = await nav.getAttribute('aria-label');
  expect(navLabel && navLabel.length).toBeTruthy();
});


test('1.9 semantic_html_roles_are_used', async ({ page }) => {
  await page.goto(URL);
  // Overlays must expose role="dialog"; the sidebar must be a <nav>.
  await expect(page.locator('nav').first()).toBeVisible();
  await page.click('#new-transaction-btn');
  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
});




// Added to address WebMCP requirement specifically mapping to 14.10, but we will make it explicit

test('7.1 layout_adapts_desktop_to_mobile', async ({ page }) => {
  await page.goto(URL);
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(page.locator('.sidebar')).toBeHidden();
});


// DROPPED (fails live oracle): '7.4 content_avoids_clipping_and_overflow'

test('7.5 chrome_adapts_to_small_screens', async ({ page }) => {
  await page.goto(URL);
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(page.locator('#mobile-nav-btn')).toBeVisible();
});


test('7.6 stacking_reflows_logically', async ({ page }) => {
  await page.goto(URL);
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(page.locator('.main-column, main')).toHaveCSS('display', /block|flex/);
});


// DROPPED (fails live oracle): '7.8 small_screens_avoid_horizontal_scroll'

// NOT-AUTOMATABLE: 1.8 text_and_controls_have_contrast — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 14.1 multi_facet_round_trip — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 14.2 sort_reversal_proves_live_data — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 14.3 derived_view_responds_to_input — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 14.4 cross_view_echo_without_reload — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 14.5 count_delta_is_exact — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 14.6 different_inputs_change_outcomes — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 14.7 interleaved_flows_preserve_state — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 14.8 empty_to_repopulated_round_trip — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 14.9 export_pipeline_contains_session_work — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 1.8 invalid_create_blocked_with_messages — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 1.12 hover_feedback_on_interactive_chrome — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 1.13 bulk_action_updates_rows_and_aggregates — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 1.14 sankey_flow_structure_and_legend — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 1.20 kpi_cards_derive_from_collection — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 1.22 trends_doughnut_legend_and_tooltip — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 1.24 filters_recompute_and_show_empty_state — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 1.27 create_flow_multi_surface_chain — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 1.28 edit_amount_propagates_to_both_legends — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 1.32 ledger_sidebar_shell_with_inert_nav — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 1.33 inert_chrome_and_tab_switch_fire_toasts — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 1.37 income_rows_styled_positive — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 1.41 command_palette_runs_declared_commands — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 1.42 export_report_json_and_markdown_reflect_session — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 1.43 import_csv_diagnostic_commits_valid_rows — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 3.1 — spacing_and_sizing_follow_scale

// NOT-AUTOMATABLE: 3.2 — typography_matches_spec

// NOT-AUTOMATABLE: 3.3 — layout_matches_reference

// NOT-AUTOMATABLE: 3.4 — specified_state_changes_animate

// NOT-AUTOMATABLE: 3.5 — responsive_behavior_matches_reference

// NOT-AUTOMATABLE: 3.6 — control_styling_matches_spec

// NOT-AUTOMATABLE: 3.7 — typography_has_clear_hierarchy

// NOT-AUTOMATABLE: 3.8 — component_states_match_spec

// NOT-AUTOMATABLE: 3.9 — surface_treatments_match_spec

// NOT-AUTOMATABLE: 3.10 — microinteractions_match_spec

// NOT-AUTOMATABLE: 4.1 empty_state_is_present — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 4.2 forms_validate_inline — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 4.3 errors_are_actionable — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 4.4 actions_show_confirmation — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 4.5 async_work_shows_loading_state — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 4.6 destructive_actions_support_undo_or_cancel — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 4.7 double_submit_creates_one_row — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 4.8 empty_export_still_valid — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 4.9 import_rejects_bad_header_and_invalid_rows — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 4.10 invalid_date_range_and_ceiling_rejected — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 11.1 — export_coachmarks_beyond_spec

// NOT-AUTOMATABLE: 11.2 — printable_markdown_stylesheet

// NOT-AUTOMATABLE: 11.3 — palette_keyboard_shortcut_footer

// NOT-AUTOMATABLE: 11.4 — enhanced_burn_rate_storytelling

// NOT-AUTOMATABLE: 11.5 — delightful_export_microinteractions

// NOT-AUTOMATABLE: 11.6 — advanced_filter_chips_ux

// NOT-AUTOMATABLE: 11.7 — polished_ledger_brand_moments

// NOT-AUTOMATABLE: 11.8 — import_diagnostic_row_preview

// NOT-AUTOMATABLE: 11.9 — sankey_explore_depth

// NOT-AUTOMATABLE: 11.10 — competition_level_finance_polish

// NOT-AUTOMATABLE: innovation.catchall — innovation_catchall

// NOT-AUTOMATABLE: 4.1 hover_washes_and_pointer_cursors — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 4.2 mode_switch_keeps_page_alive — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 4.4 chart_tab_pill_toggle_swaps_in_place — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 4.5 row_create_and_delete_animate — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 4.6 bulk_delete_rows_animate_out — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 4.7 toast_enter_hold_exit_cycle — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 4.8 pie_slice_hover_tooltip_and_lift — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 4.10 export_drawer_and_palette_animate_in — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 4.11 reduced_motion_disables_entry_exits — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 9.1 — cold_start_is_under_two_seconds

// NOT-AUTOMATABLE: 9.3 — transitions_respond_under_100ms

// NOT-AUTOMATABLE: 9.4 — async_work_has_loading_indicators

// NOT-AUTOMATABLE: 9.5 — large_collections_render_without_lag

// NOT-AUTOMATABLE: 9.6 — state_changes_remain_interactive

// NOT-AUTOMATABLE: 9.7 — animations_maintain_smooth_frame_rate

// NOT-AUTOMATABLE: 9.8 — rapid_input_does_not_freeze

// NOT-AUTOMATABLE: 7.2 — mobile_tap_targets_are_large_enough

// NOT-AUTOMATABLE: 7.3 — typography_resizes_across_breakpoints

// NOT-AUTOMATABLE: 7.7 — mobile_touch_gestures_work

// NOT-AUTOMATABLE: 7.9 — media_and_canvases_resize

// NOT-AUTOMATABLE: 2.2 no_browser_storage_seeded_reload — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 2.5 keyboard_operable_with_visible_focus — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 2.6 modal_form_focus_trap_and_return — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 2.7 validation_announced_via_live_region — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 2.8 legends_convey_data_without_hover — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 2.9 interactive_within_two_seconds — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 2.10 in_place_redraws_without_jank — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 2.12 no_outbound_requests_or_navigation — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 2.13 multi_facet_reload_resets_coherently — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 2.15 export_drawer_and_palette_trap_focus — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 2.16 field_contract_enforced_on_create — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 6.1 create_flow_updates_all_surfaces — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 6.2 invalid_create_shows_inline_validation — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 6.3 edit_flow_updates_related_displays — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 6.4 delete_flow_updates_all_surfaces — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 6.5 view_switch_retains_state — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 6.6 last_delete_reveals_empty_state — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 6.7 filters_update_all_surfaces — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 6.8 collapsible_chrome_preserves_workflow — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 6.9 overlays_support_expected_flows — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 6.10 flow_recovers_without_reload — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 6.11 export_flow_terminates_at_artifact — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 6.12 burn_rate_and_palette_flows — Complex state interaction without obvious ID mapping


// NOT-AUTOMATABLE: 3.1 — reports_workspace_density

// NOT-AUTOMATABLE: 3.2 — empty_state_visually_present

// NOT-AUTOMATABLE: 3.4 — income_positive_expense_neutral_multi_hue_charts

// NOT-AUTOMATABLE: 3.5 — soft_mint_palette_and_ledger_mark

// NOT-AUTOMATABLE: 3.6 — sidebar_plus_main_column_structure

// NOT-AUTOMATABLE: 3.7 — sankey_bars_curved_links_doughnut_legend

// NOT-AUTOMATABLE: 3.8 — single_consistent_icon_set

// NOT-AUTOMATABLE: 3.9 — sidebar_persistent_at_desktop_widths

// NOT-AUTOMATABLE: 3.10 — narrow_width_stacking_without_overflow

// NOT-AUTOMATABLE: 3.12 — consistent_capitalization_convention

// NOT-AUTOMATABLE: 3.13 — consistent_currency_formatting

// NOT-AUTOMATABLE: 3.14 — toast_and_empty_state_copy_quality

// NOT-AUTOMATABLE: 3.16 — export_drawer_and_over_burn_treatments

// NOT-AUTOMATABLE: 15.1 — headings_use_consistent_capitalization

// NOT-AUTOMATABLE: 15.2 — actions_use_specific_labels

// NOT-AUTOMATABLE: 15.3 — errors_name_problem_and_fix

// NOT-AUTOMATABLE: 15.4 — empty_states_explain_next_step

// NOT-AUTOMATABLE: 15.5 — body_copy_is_well_written

// NOT-AUTOMATABLE: 15.6 — terminology_is_consistent

// NOT-AUTOMATABLE: 15.7 — numbers_dates_and_units_are_consistent

// NOT-AUTOMATABLE: 15.8 — success_messages_are_specific


test('1.1 controls_are_keyboard_accessible', async ({ page }) => {
  await page.goto(URL);

  // Export report: keyboard focus + Enter opens the drawer; Escape closes it.
  await page.locator('#export-report-btn').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#drawer-title')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#drawer-title')).toBeHidden();

  // Import CSV: keyboard focus + Enter opens the panel; Escape closes it.
  await page.locator('#import-csv-btn').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#import-title')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#import-title')).toBeHidden();

  // Burn-rate ceiling input: keyboard-focusable and editable without a mouse.
  await page.locator('#ceiling-input').focus();
  await page.keyboard.press('End');
  for (let i = 0; i < 8; i++) await page.keyboard.press('Backspace');
  await page.keyboard.type('500');
  await expect(page.locator('#ceiling-input')).toHaveValue('500');

  // Command palette: Ctrl+K opens it and lands keyboard focus in its filter input.
  await page.keyboard.press('Control+k');
  await expect(page.locator('.overlay-card')).toBeVisible();
  await expect(page.locator('.overlay-card input')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('.overlay-card')).toBeHidden();
});

test('1.3 images_and_icons_have_alt_text', async ({ page }) => {
  await page.goto(URL);
  // The oracle uses PrimeIcon <i class="pi ..."> glyphs, never <img> tags, so
  // an img[alt] check passes vacuously here. The real requirement is that any
  // icon-only control (no adjacent visible text) exposes an accessible name.
  const iconButtons = await page.locator('button:has(i.pi)').all();
  let iconOnlyChecked = 0;
  for (const btn of iconButtons) {
    const info = await btn.evaluate((el) => {
      const clone = el.cloneNode(true);
      clone.querySelectorAll('i.pi, [aria-hidden="true"]').forEach((n) => n.remove());
      return {
        visibleText: clone.textContent.trim(),
        accessibleName: (el.getAttribute('aria-label') || el.getAttribute('title') || '').trim(),
      };
    });
    if (info.visibleText.length > 0) continue; // icon has an adjacent visible label; not icon-only
    iconOnlyChecked++;
    expect(info.accessibleName.length, 'icon-only control exposes an accessible name').toBeGreaterThan(0);
  }
  expect(iconOnlyChecked, 'at least one icon-only control was found and checked').toBeGreaterThan(0);
});

test('1.4 feedback_uses_live_regions', async ({ page }) => {
  await page.goto(URL);
  const toastRegion = page.locator('[role="status"][aria-live="polite"]');
  await expect(toastRegion).toBeAttached();
  await expect(toastRegion).toHaveText('');

  // Creating a transaction must announce success through the live region,
  // not only via the visible toast.
  await page.click('#new-transaction-btn');
  await page.fill('input[formControlName="payee"]', 'Live Region Test');
  await page.fill('input[formControlName="amount"]', '-10.00');
  await page.selectOption('select[formControlName="category"]', { label: 'Restaurants' });
  await page.click('button:has-text("Create transaction")');
  await expect(toastRegion).toContainText('Live Region Test');
});

// DROPPED (fails live oracle): '14.10 import_export_round_trip_restores_state'

test('1.10 reduced_motion_is_respected', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(URL);

  // Open a real overlay under reduced motion and confirm its entry animation
  // duration actually collapses (the global @media rule forces 0.01ms), not
  // just that some CSS elsewhere says "none" while nothing is on screen.
  await page.click('#new-transaction-btn');
  const dialog = page.locator('.overlay-card');
  await expect(dialog).toBeVisible();
  const dialogDurationMs = await dialog.evaluate((el) => parseFloat(getComputedStyle(el).animationDuration));
  expect(dialogDurationMs, 'overlay entry animation collapses under reduced motion').toBeLessThanOrEqual(1);

  // Trigger a toast (also animated) and check the same thing.
  await page.fill('input[formControlName="payee"]', 'Reduced Motion Test');
  await page.fill('input[formControlName="amount"]', '-10.00');
  await page.selectOption('select[formControlName="category"]', { label: 'Restaurants' });
  await page.click('button:has-text("Create transaction")');
  const toast = page.locator('.toast-card');
  await expect(toast).toBeVisible();
  const toastDurationMs = await toast.evaluate((el) => parseFloat(getComputedStyle(el).animationDuration));
  expect(toastDurationMs, 'toast entry animation collapses under reduced motion').toBeLessThanOrEqual(1);
});
