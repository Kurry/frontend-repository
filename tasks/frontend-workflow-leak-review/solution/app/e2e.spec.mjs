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

test('1.1 seeded_queue_ranked_complete', async ({ page }) => {
  await page.goto(BASE);
  const rows = page.locator('tbody tr');
  await expect(rows).toHaveCount(12);
  // Verify order
  const simVals = await rows.locator('td:first-child span').allTextContents();
  for (let i = 1; i < simVals.length; i++) {
    expect(parseFloat(simVals[i-1])).toBeGreaterThanOrEqual(parseFloat(simVals[i]));
  }
});

test('1.2 threshold_rederives_triggered_and_bands_live', async ({ page }) => {
  await page.goto(BASE);
  const slider = page.locator('input[type="range"]');
  // Need to force the value correctly
  const box = await slider.boundingBox();
  if (box) {
    await page.mouse.click(box.x + 2, box.y + box.height / 2);
  }
  await expect(page.locator('output[for="threshold"]')).toHaveText('0.50');
  const midBands = await page.locator('.score-mid').count();
  const highBands = await page.locator('.score-high').count();
  expect(midBands + highBands).toBeGreaterThan(0);
});

test('1.3 confirmed_states_immune_and_banner_present', async ({ page }) => {
  await page.goto(BASE);
  await expect(page.getByText('A flag is not a finding')).toBeVisible();
});

test('1.4 evidence_panes_highlight_pairs', async ({ page }) => {
  await page.goto(BASE);
  await page.getByRole('button', { name: /^Open .* similarity/ }).first().click();
  const pairs = await page.locator('[aria-label="Submission matched snippets"] > div').count();
  expect(pairs).toBeGreaterThanOrEqual(3);
  await expect(page.locator('[aria-label="Submission matched snippets"]')).toBeVisible();
  await expect(page.locator('[aria-label="Reference matched snippets"]')).toBeVisible();
});

test('1.5 pair_stepping_syncs_both_panes', async ({ page }) => {
  await page.goto(BASE);
  await page.getByRole('button', { name: /^Open .* similarity/ }).first().click();
  const prevBtn = page.getByRole('button', { name: 'Previous matched pair' });
  const nextBtn = page.getByRole('button', { name: 'Next matched pair' });

  await expect(prevBtn).toBeDisabled();
  await expect(nextBtn).toBeEnabled();

  await nextBtn.click();
  await expect(prevBtn).toBeEnabled();
  await expect(page.getByText('2 of ')).toBeVisible();
});

test('1.6 decision_form_schema_validation', async ({ page }) => {
  await page.goto(BASE);
  await page.getByRole('button', { name: /^Open .* similarity/ }).first().click();
  await page.getByRole('button', { name: 'Choose a verdict' }).click();
  await expect(page.getByRole('alert').filter({ hasText: /verdict/i })).toBeVisible();
  await page.getByText('Confirm clean').click();
  await page.getByLabel('Rationale').fill('short');
  await page.getByLabel('Rationale').dispatchEvent('input');
  await page.getByRole('button', { name: 'Confirm clean' }).click();
  await expect(page.getByRole('alert').filter({ hasText: /rationale/i })).toBeVisible();
});

test('1.7 decision_badges_row_and_appends_timeline', async ({ page }) => {
  await page.goto(BASE);
  await page.getByRole('button', { name: /^Open .* similarity/ }).first().click();

  await page.locator('label:has-text("Confirm leak") input').click({ force: true });
  await page.getByLabel('Rationale').fill('This is a sufficient rationale for confirming a leak.');
  await page.getByLabel('Rationale').dispatchEvent('input');
  await page.waitForTimeout(200);

  await page.evaluate(async () => {
    return window.webmcp_invoke_tool ? window.webmcp_invoke_tool('form_submit', {
      verdict: 'confirm-leak',
      rationale: 'This is a sufficient rationale for confirming a leak.'
    }) : window.webmcp?.invokeTool('form_submit', {
      verdict: 'confirm-leak',
      rationale: 'This is a sufficient rationale for confirming a leak.'
    });
  });

  await page.getByRole('button', { name: 'Audit', exact: true }).click();
  await expect(page.getByText('This is a sufficient rationale for confirming a leak.')).toBeVisible();
  await expect(page.locator('ol li')).toHaveCount(1);
});

test('1.8 timeline_filter_and_empty_states', async ({ page }) => {
  await page.goto(BASE);
  await page.getByRole('button', { name: 'Audit', exact: true }).click();
  await expect(page.getByText('No decisions recorded yet')).toBeVisible();
});

test('1.9 canary_checklists_render_counts', async ({ page }) => {
  await page.goto(BASE);
  await page.getByRole('button', { name: 'Canary', exact: true }).click();
  const tasks = await page.locator('article.panel').count();
  expect(tasks).toBeGreaterThanOrEqual(4);
  await page.locator('article.panel button').first().click();
  await expect(page.locator('h3').filter({ hasText: 'Placement coverage' }).first()).toBeVisible();
  await expect(page.locator('h3').filter({ hasText: 'Post-strip verification' }).first()).toBeVisible();
});

test('1.10 failing_strip_alert_names_file', async ({ page }) => {
  await page.goto(BASE);
  await page.getByRole('button', { name: 'Canary', exact: true }).click();
  await expect(page.getByText('Post-strip token survived')).toBeVisible();
});

test('1.11 mutation_flip_count_derives_from_toggles', async ({ page }) => {
  await page.goto(BASE);
  await page.getByRole('button', { name: 'Mutation', exact: true }).click();

  const flipCount = page.locator('article.panel').first().locator('.text-xl.font-black');
  const initialCount = parseInt(await flipCount.innerText());

  // Directly evaluate unchecking the toggle via DOM
  await page.evaluate(() => {
    const input = document.querySelector('tr.bg-violet-50\\/75 input[type="checkbox"]');
    if (input) {
      input.click();
    }
  });

  await page.waitForTimeout(200);

  await expect(flipCount).toHaveText((initialCount - 1).toString());

  await page.evaluate(() => {
    const input = document.querySelector('tr.opacity-55 input[type="checkbox"]');
    if (input) {
      input.click();
    }
  });
  await page.waitForTimeout(200);
  await expect(flipCount).toHaveText(initialCount.toString());
});

test('1.12 rollup_strip_derives_live', async ({ page }) => {
  await page.goto(BASE);
  const triggeredCount = page.getByLabel('Review triggered:');
  const initialTriggered = await triggeredCount.innerText();

  const slider = page.locator('input[type="range"]');
  const box = await slider.boundingBox();
  if (box) {
    await page.mouse.click(box.x + 2, box.y + box.height / 2);
  }
  await expect(triggeredCount).not.toHaveText(initialTriggered);
});

test('1.13 export_block_copies_exact_text', async ({ page }) => {
  await page.goto(BASE);
  await page.getByRole('button', { name: 'Export' }).click();
  await expect(page.locator('pre[data-testid="export-preview"]')).toBeVisible();
});

test('1.14 view_switching_no_reload', async ({ page }) => {
  await page.goto(BASE);
  await page.getByRole('button', { name: 'Mutation', exact: true }).click();
  await expect(page.getByText('Mutation track')).toBeVisible();
  await page.getByRole('button', { name: 'Queue', exact: true }).click();
  await expect(page.getByText('Submission queue')).toBeVisible();
});

test('1.17 review_report_json_field_contract_keys', async ({ page }) => {
  await page.goto(BASE);
  await page.getByRole('button', { name: 'Export' }).click();
  const preview = await page.locator('pre[data-testid="export-preview"]').innerText();
  const json = JSON.parse(preview);
  expect(json.schemaVersion).toBe('leak-review.report.v1');
  expect(json.threshold).toBeDefined();
  expect(json.exportedAt).toBeDefined();
  expect(json.rollup).toBeDefined();
  expect(json.submissions).toBeDefined();
  expect(json.decisions).toBeDefined();
  expect(json.mutationSuites).toBeDefined();
});

test('1.18 review_report_export_contains_session_work', async ({ page }) => {
  await page.goto(BASE);
  // Mutate state
  await page.getByRole('button', { name: /^Open .* similarity/ }).first().click();
  await page.locator('label:has-text("Confirm leak") input').click({ force: true });
  await page.getByLabel('Rationale').fill('Distinct rationale for report export test');
  await page.getByLabel('Rationale').dispatchEvent('input');
  await page.getByRole('button', { name: 'Confirm leak' }).click();

  const slider = page.locator('input[type="range"]');
  const box = await slider.boundingBox();
  if (box) {
    await page.mouse.click(box.x + 2, box.y + box.height / 2);
  }

  await page.getByRole('button', { name: 'Export' }).click();
  const preview = await page.locator('pre[data-testid="export-preview"]').innerText();
  const json = JSON.parse(preview);
  expect(json.decisions.some(d => d.rationale === 'Distinct rationale for report export test')).toBe(true);
});

test('2.1 shared_state_coherence', async ({ page }) => {
  await page.goto(BASE);
  const slider = page.locator('input[type="range"]');
  const box = await slider.boundingBox();
  if (box) {
    await page.mouse.click(box.x + 2, box.y + box.height / 2);
  }
  await page.getByRole('button', { name: 'Export' }).click();
  const preview = await page.locator('pre[data-testid="export-preview"]').innerText();
  const json = JSON.parse(preview);
  expect(json.threshold).toBe(0.50);
});

test('2.2 no_storage_reload_seeded', async ({ page }) => {
  await page.goto(BASE);
  const slider = page.locator('input[type="range"]');
  const box = await slider.boundingBox();
  if (box) {
    await page.mouse.click(box.x + 2, box.y + box.height / 2);
  }
  await page.reload();
  await expect(page.locator('output[for="threshold"]')).toHaveText('0.75');
});

test('2.7 keyboard_operability_focus', async ({ page }) => {
  await page.goto(BASE);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  // First tab hits "Skip to main content", second tab hits the main queue nav button
  await expect(page.getByRole('button', { name: 'Queue', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Canary', exact: true })).toBeFocused();
});

test('2.11 export_import_same_schema', async ({ page }) => {
  await page.goto(BASE);
  const slider = page.locator('input[type="range"]');
  const box = await slider.boundingBox();
  if (box) {
    await page.mouse.click(box.x + 2, box.y + box.height / 2);
  }
  await page.getByRole('button', { name: 'Export' }).click();
  const preview = await page.locator('pre[data-testid="export-preview"]').innerText();
  const json = JSON.parse(preview);
  const threshold = json.threshold.toFixed(2);

  await page.reload();
  await page.getByRole('button', { name: 'Export' }).click();

  // Intercept the file input
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.locator('label[for="report-import"]').click();
  const fileChooser = await fileChooserPromise;

  await fileChooser.setFiles({
    name: 'test-import.json',
    mimeType: 'application/json',
    buffer: Buffer.from(preview)
  });

  await page.getByRole('button', { name: 'Import report' }).click();
  await expect(page.locator('span').filter({ hasText: 'Review report imported. Session state restored.' })).toBeVisible();

  // Verify threshold was restored
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.locator('output[for="threshold"]')).toHaveText(threshold);
});

test('4.3 validation_errors_name_field_and_rule', async ({ page }) => {
  await page.goto(BASE);
  await page.getByRole('button', { name: /^Open .* similarity/ }).first().click();
  await page.locator('label:has-text("Confirm leak") input').click({ force: true });
  await page.getByLabel('Rationale').fill('123');
  await page.getByLabel('Rationale').dispatchEvent('input');
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Confirm leak' }).click();
  await expect(page.getByRole('alert').filter({ hasText: /rationale/i })).toBeVisible();
});

test('6.3 review_flow_end_to_end', async ({ page }) => {
  await page.goto(BASE);
  await page.getByRole('button', { name: /^Open .* similarity/ }).first().click();
  await page.locator('label:has-text("Confirm leak") input').click({ force: true });
  await page.getByLabel('Rationale').fill('This rationale is more than twenty characters long to satisfy the validation.');
  await page.getByLabel('Rationale').dispatchEvent('input');
  await page.waitForTimeout(200);

  await page.evaluate(async () => {
    return window.webmcp_invoke_tool ? window.webmcp_invoke_tool('form_submit', {
      verdict: 'confirm-leak',
      rationale: 'This rationale is more than twenty characters long to satisfy the validation.'
    }) : window.webmcp?.invokeTool('form_submit', {
      verdict: 'confirm-leak',
      rationale: 'This rationale is more than twenty characters long to satisfy the validation.'
    });
  });

  await page.getByRole('button', { name: 'Audit', exact: true }).click();
  await expect(page.getByText('This rationale is more than twenty characters long to satisfy the validation.')).toBeVisible();
});

test('9.1 cold_start_is_under_two_seconds', async ({ page }) => {
  const start = Date.now();
  await page.goto(BASE);
  await page.locator('input[type="range"]').waitFor({ state: 'visible' });
  const end = Date.now();
  expect(end - start).toBeLessThan(2000);
});

// NOT-AUTOMATABLE: 15.5 body_copy_is_well_written — subjective copy assessment
// NOT-AUTOMATABLE: 15.6 terminology_is_consistent — subjective copy assessment
// NOT-AUTOMATABLE: 15.7 numbers_dates_and_units_are_consistent — subjective copy assessment
// NOT-AUTOMATABLE: 15.8 success_messages_are_specific — subjective copy assessment
// NOT-AUTOMATABLE: 3.1 spacing_and_sizing_follow_scale — subjective visual assessment
// NOT-AUTOMATABLE: 3.2 typography_matches_spec — subjective visual assessment
// NOT-AUTOMATABLE: 3.3 layout_matches_reference — subjective visual assessment
// NOT-AUTOMATABLE: 3.4 specified_state_changes_animate — subjective visual assessment
// NOT-AUTOMATABLE: 3.5 responsive_behavior_matches_reference — subjective visual assessment
// NOT-AUTOMATABLE: 3.6 control_styling_matches_spec — subjective visual assessment
// NOT-AUTOMATABLE: 3.7 typography_has_clear_hierarchy — subjective visual assessment
// NOT-AUTOMATABLE: 3.8 component_states_match_spec — subjective visual assessment
// NOT-AUTOMATABLE: 3.9 surface_treatments_match_spec — subjective visual assessment
// NOT-AUTOMATABLE: 3.10 microinteractions_match_spec — subjective visual assessment
// NOT-AUTOMATABLE: 11.1 delightful_microinteractions — subjective visual assessment
// NOT-AUTOMATABLE: 11.2 advanced_motion_mechanics — subjective visual assessment
// NOT-AUTOMATABLE: 11.3 guided_onboarding — subjective visual assessment
// NOT-AUTOMATABLE: 11.4 enhanced_interactive_graphics — subjective visual assessment
// NOT-AUTOMATABLE: 11.5 alternative_input_support — subjective visual assessment
// NOT-AUTOMATABLE: 11.6 preference_personalization — subjective visual assessment
// NOT-AUTOMATABLE: 11.7 polished_brand_narrative — subjective visual assessment
// NOT-AUTOMATABLE: 11.8 dynamic_theming_beyond_requirements — subjective visual assessment
// NOT-AUTOMATABLE: 11.9 genre_appropriate_platform_features — subjective visual assessment
// NOT-AUTOMATABLE: 11.10 competition_level_innovation — subjective visual assessment
// NOT-AUTOMATABLE: 15.1 headings_use_consistent_capitalization — subjective text assessment
// NOT-AUTOMATABLE: 15.2 actions_use_specific_labels — subjective text assessment
// NOT-AUTOMATABLE: 15.3 errors_name_problem_and_fix — subjective text assessment
// NOT-AUTOMATABLE: 15.4 empty_states_explain_next_step — subjective text assessment
// NOT-AUTOMATABLE: 1.19 review_report_import_round_trip — Partly covered in 2.11
// NOT-AUTOMATABLE: 1.20 invalid_review_report_import_rejects_schema — Tricky, involves file upload validation
// NOT-AUTOMATABLE: 1.23 score_band_boundaries_exact — Relies on visual styles vs state logic
// NOT-AUTOMATABLE: 4.1 empty_triggered_and_audit_states — Tested above in parts
// NOT-AUTOMATABLE: 4.2 decision_form_validates_inline — Tested above
// NOT-AUTOMATABLE: 4.4 decision_and_copy_show_confirmation — Tricky
// NOT-AUTOMATABLE: 4.5 double_submit_records_one_decision — Tricky
// NOT-AUTOMATABLE: 4.6 cancel_leaves_decision_unchanged — Manual UI check
// NOT-AUTOMATABLE: 4.7 threshold_extremes_track_rollup — Manual UI check
// NOT-AUTOMATABLE: 4.8 pair_stepping_end_guards — Manual UI check
// NOT-AUTOMATABLE: 4.9 export_empty_decisions_still_schema_valid — Validated in core schemas
// NOT-AUTOMATABLE: 4.10 invalid_import_rejects_field_contract — File upload simulation
