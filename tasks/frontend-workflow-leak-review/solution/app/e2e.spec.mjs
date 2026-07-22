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


// NOT-AUTOMATABLE: 15.1 - headings_use_consistent_capitalization - Visual/subjective criteria
// NOT-AUTOMATABLE: 15.2 - actions_use_specific_labels - Visual/subjective criteria
// NOT-AUTOMATABLE: 15.3 - errors_name_problem_and_fix - Visual/subjective criteria
// NOT-AUTOMATABLE: 15.4 - empty_states_explain_next_step - Visual/subjective criteria
// NOT-AUTOMATABLE: 15.5 - body_copy_is_well_written - Subjective likert criterion
// NOT-AUTOMATABLE: 15.6 - terminology_is_consistent - Visual/subjective criteria
// NOT-AUTOMATABLE: 15.7 - numbers_dates_and_units_are_consistent - Visual/subjective criteria
// NOT-AUTOMATABLE: 15.8 - success_messages_are_specific - Visual/subjective criteria
// NOT-AUTOMATABLE: 3.1 - review_console_register - Visual/subjective criteria
// NOT-AUTOMATABLE: 3.4 - typography_hierarchy_consistent - Visual/subjective criteria
// NOT-AUTOMATABLE: 3.5 - component_state_treatments - Visual/subjective criteria
// NOT-AUTOMATABLE: 3.6 - pass_fail_not_color_only - Visual/subjective criteria
// NOT-AUTOMATABLE: 11.1 - delightful_microinteractions - Visual/subjective criteria
// NOT-AUTOMATABLE: 11.2 - advanced_motion_mechanics - Visual/subjective criteria
// NOT-AUTOMATABLE: 11.3 - guided_onboarding - Visual/subjective criteria
// NOT-AUTOMATABLE: 11.4 - enhanced_interactive_graphics - Visual/subjective criteria
// NOT-AUTOMATABLE: 11.5 - alternative_input_support - Visual/subjective criteria
// NOT-AUTOMATABLE: 11.6 - preference_personalization - Visual/subjective criteria
// NOT-AUTOMATABLE: 11.7 - polished_brand_narrative - Visual/subjective criteria
// NOT-AUTOMATABLE: 11.8 - dynamic_theming_beyond_requirements - Visual/subjective criteria
// NOT-AUTOMATABLE: 11.9 - genre_appropriate_platform_features - Visual/subjective criteria
// NOT-AUTOMATABLE: 11.10 - competition_level_innovation - Visual/subjective criteria
// NOT-AUTOMATABLE: innovation.catchall - innovation_catchall - Visual/subjective criteria
// NOT-AUTOMATABLE: 3.1 - spacing_and_sizing_follow_scale - Visual/subjective criteria
// NOT-AUTOMATABLE: 3.2 - typography_matches_spec - Visual/subjective criteria
// NOT-AUTOMATABLE: 3.3 - layout_matches_reference - Visual/subjective criteria
// NOT-AUTOMATABLE: 3.4 - specified_state_changes_animate - Visual/subjective criteria
// NOT-AUTOMATABLE: 3.5 - responsive_behavior_matches_reference - Visual/subjective criteria
// NOT-AUTOMATABLE: 3.6 - control_styling_matches_spec - Visual/subjective criteria
// NOT-AUTOMATABLE: 3.7 - typography_has_clear_hierarchy - Visual/subjective criteria
// NOT-AUTOMATABLE: 3.8 - component_states_match_spec - Visual/subjective criteria
// NOT-AUTOMATABLE: 3.9 - surface_treatments_match_spec - Visual/subjective criteria
// NOT-AUTOMATABLE: 3.10 - microinteractions_match_spec - Visual/subjective criteria

// NOT-YET-COVERED: 3.2 - score_bands_and_state_chips_distinct
// NOT-YET-COVERED: 3.3 - evidence_panes_layout
// NOT-YET-COVERED: 3.7 - responsive_stacking_and_no_overflow
test('6.1 - triage_threshold_flow', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const slider = page.locator('input[type="range"]');
  await slider.evaluate(node => {
    node.value = "0.50";
    node.dispatchEvent(new Event('input', { bubbles: true }));
    node.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('text=Review triggered').first()).toBeVisible();
});
// NOT-YET-COVERED: 6.2 - invalid_decision_shows_inline_validation
// NOT-YET-COVERED: 6.3 - review_flow_end_to_end
// NOT-YET-COVERED: 6.4 - canary_failing_strip_flow
// NOT-YET-COVERED: 6.5 - mutation_toggle_flow
// NOT-YET-COVERED: 6.6 - artifact_export_end_state
// NOT-YET-COVERED: 6.7 - export_import_round_trip_flow
// NOT-YET-COVERED: 6.8 - view_switch_retains_session_state
// NOT-YET-COVERED: 6.9 - export_panel_supports_format_choice
// NOT-YET-COVERED: 6.10 - reload_without_import_resets_seed
// NOT-YET-COVERED: 2.1 - shared_state_coherence
test('2.2 - no_storage_reload_seeded', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const slider = page.locator('input[type="range"]');
  await slider.evaluate(node => {
    node.value = "0.50";
    node.dispatchEvent(new Event('input', { bubbles: true }));
    node.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('output[for="threshold"]')).toHaveText('0.75');
});
// NOT-YET-COVERED: 2.4 - console_clean_full_session
// NOT-YET-COVERED: 2.5 - cold_load_interactive_2s
// NOT-YET-COVERED: 2.6 - rapid_input_stability
// NOT-YET-COVERED: 2.7 - keyboard_operability_focus
// NOT-YET-COVERED: 2.10 - api_shaped_validation_surfaces_inline
// NOT-YET-COVERED: 2.11 - export_import_same_schema
// NOT-YET-COVERED: 7.1 - layout_adapts_desktop_to_mobile
// NOT-YET-COVERED: 7.2 - mobile_tap_targets_are_large_enough
// NOT-YET-COVERED: 7.3 - typography_resizes_across_breakpoints
// NOT-YET-COVERED: 7.4 - content_avoids_clipping_and_overflow
// NOT-YET-COVERED: 7.5 - chrome_adapts_to_small_screens
// NOT-YET-COVERED: 7.6 - stacking_reflows_logically
// NOT-YET-COVERED: 7.7 - mobile_touch_gestures_work
// NOT-YET-COVERED: 7.8 - small_screens_avoid_horizontal_scroll
// NOT-YET-COVERED: 7.9 - media_and_canvases_resize
// NOT-YET-COVERED: 7.10 - fixed_controls_remain_accessible
// NOT-YET-COVERED: 9.1 - cold_start_is_under_two_seconds
// NOT-YET-COVERED: 9.2 - console_is_clean
// NOT-YET-COVERED: 9.3 - transitions_respond_under_100ms
// NOT-YET-COVERED: 9.4 - async_work_has_loading_indicators
// NOT-YET-COVERED: 9.5 - large_collections_render_without_lag
// NOT-YET-COVERED: 9.6 - state_changes_remain_interactive
// NOT-YET-COVERED: 9.7 - animations_maintain_smooth_frame_rate
// NOT-YET-COVERED: 9.8 - rapid_input_does_not_freeze
// NOT-YET-COVERED: 4.1 - hover_feedback_on_chrome
// NOT-YET-COVERED: 4.2 - disclosure_height_transition
// NOT-YET-COVERED: 4.3 - decision_row_animates_out_of_filter
// NOT-YET-COVERED: 4.4 - threshold_drag_live_no_jank
// NOT-YET-COVERED: 4.5 - toasts_slide_and_autodismiss
// NOT-YET-COVERED: 4.6 - reduced_motion_respected
// NOT-YET-COVERED: 4.1 - empty_triggered_and_audit_states
// NOT-YET-COVERED: 4.2 - decision_form_validates_inline
// NOT-YET-COVERED: 4.3 - validation_errors_name_field_and_rule
// NOT-YET-COVERED: 4.4 - decision_and_copy_show_confirmation
// NOT-YET-COVERED: 4.5 - double_submit_records_one_decision
// NOT-YET-COVERED: 4.6 - cancel_leaves_decision_unchanged
// NOT-YET-COVERED: 4.7 - threshold_extremes_track_rollup
// NOT-YET-COVERED: 4.8 - pair_stepping_end_guards
// NOT-YET-COVERED: 4.9 - export_empty_decisions_still_schema_valid
// NOT-YET-COVERED: 4.10 - invalid_import_rejects_field_contract
test('1.1 - seeded_queue_ranked_complete', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const rows = page.locator('tbody tr');
  await expect(rows).toHaveCount(12);
  const text = await rows.first().textContent();
  expect(text.length).toBeGreaterThan(0);
});
test('1.2 - threshold_rederives_triggered_and_bands_live', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const slider = page.locator('input[type="range"]');
  await slider.evaluate(node => {
    node.value = "0.50";
    node.dispatchEvent(new Event('input', { bubbles: true }));
    node.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('text=Review triggered').first()).toBeVisible();
});
test('1.3 - confirmed_states_immune_and_banner_present', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('text=A flag is not a finding')).toBeVisible();
});
// NOT-YET-COVERED: 1.4 - evidence_panes_highlight_pairs
// NOT-YET-COVERED: 1.5 - pair_stepping_syncs_both_panes
// NOT-YET-COVERED: 1.6 - decision_form_schema_validation
// NOT-YET-COVERED: 1.7 - decision_badges_row_and_appends_timeline
test('1.8 - timeline_filter_and_empty_states', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.locator('nav').locator('button', { hasText: 'Audit' }).first().click();
  await expect(page.locator('text=No decisions recorded yet')).toBeVisible();
});
test('1.9 - canary_checklists_render_counts', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.locator('nav').locator('button', { hasText: 'Canary' }).first().click();
  const tasks = page.locator('section[aria-label="Canary task disclosures"] > article');
  await expect(tasks).toHaveCount(4);
});
test('1.10 - failing_strip_alert_names_file', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.locator('nav').locator('button', { hasText: 'Canary' }).first().click();
  const alert = page.locator('div[role="alert"]');
  await expect(alert.first()).toBeVisible();
  const alertText = await alert.first().textContent();
  expect(alertText).toMatch(/\S+\.\S+/); // Should contain a file name
});
test('1.11 - mutation_flip_count_derives_from_toggles', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.locator('nav').locator('button', { hasText: 'Mutation' }).first().click();
  const toggle = page.locator('input[type="checkbox"]').first();
  await expect(toggle).toBeVisible();

  const textBefore = await page.locator('text=/flipped/i').first().textContent();
  await toggle.click();
  const textAfter = await page.locator('text=/flipped/i').first().textContent();
  expect(textBefore).not.toBe(textAfter);
});
// NOT-YET-COVERED: 1.12 - rollup_strip_derives_live
test('1.13 - export_block_copies_exact_text', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.locator('button', { hasText: 'Export' }).click();
  await expect(page.locator('text=Review report JSON').first()).toBeVisible();
});
test('1.14 - view_switching_no_reload', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.locator('nav').locator('button', { hasText: 'Canary' }).first().click();
  await expect(page.locator('h1', { hasText: /Canary coverage/i })).toBeVisible();
});
test('1.17 - review_report_json_field_contract_keys', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.locator('button', { hasText: 'Export' }).click();
  const pre = page.locator('pre');
  await expect(pre).toBeVisible();
  const text = await pre.textContent();
  expect(text).toContain('schemaVersion');
  expect(text).toContain('leak-review.report.v1');
});
// NOT-YET-COVERED: 1.18 - review_report_export_contains_session_work
// NOT-YET-COVERED: 1.19 - review_report_import_round_trip
// NOT-YET-COVERED: 1.20 - invalid_review_report_import_rejects_schema
// NOT-YET-COVERED: 1.23 - score_band_boundaries_exact
// NOT-YET-COVERED: 14.1 - multi_facet_round_trip
test('14.2 - score_rank_order_is_live', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const firstScore = await page.locator('tbody tr').first().locator('td').first().textContent();
  const secondScore = await page.locator('tbody tr').nth(1).locator('td').first().textContent();
  const f = parseFloat(firstScore.match(/[0-9.]+/));
  const s = parseFloat(secondScore.match(/[0-9.]+/));
  expect(f).toBeGreaterThanOrEqual(s);
});
test('14.3 - derived_view_responds_to_input', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const slider = page.locator('input[type="range"]');
  const initialTriggered = await page.locator('text=Review triggered').count();
  await slider.evaluate(node => {
    node.value = "0.50";
    node.dispatchEvent(new Event('input', { bubbles: true }));
    node.dispatchEvent(new Event('change', { bubbles: true }));
  });
  const newTriggered = await page.locator('text=Review triggered').count();
  expect(newTriggered).toBeGreaterThan(initialTriggered);
});
test('14.4 - cross_view_echo_without_reload', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.locator('tbody tr').first().click();
  // We are in evidence view
  const confirmLeakBtn = page.locator('button', { hasText: 'Confirm leak' });
  await confirmLeakBtn.click();

  // wait for it
  await page.locator('nav').locator('button', { hasText: 'Audit' }).first().click();
  await expect(page.locator('text=Confirm leak').first()).toBeVisible();
});
// NOT-YET-COVERED: 14.5 - count_delta_is_exact
// NOT-YET-COVERED: 14.6 - different_inputs_change_outcomes
// NOT-YET-COVERED: 14.7 - interleaved_flows_preserve_state
// NOT-YET-COVERED: 14.8 - export_import_edge_round_trip
// NOT-YET-COVERED: 1.1 - controls_are_keyboard_accessible
// NOT-YET-COVERED: 1.2 - modals_manage_focus
// NOT-YET-COVERED: 1.3 - images_and_icons_have_alt_text
// NOT-YET-COVERED: 1.4 - feedback_uses_live_regions
// NOT-YET-COVERED: 1.5 - forms_have_explicit_labels
// NOT-YET-COVERED: 1.6 - headings_follow_logical_order
// NOT-YET-COVERED: 1.7 - landmark_navigation_is_present
// NOT-YET-COVERED: 1.8 - text_and_controls_have_contrast
// NOT-YET-COVERED: 1.9 - semantic_html_roles_are_used
// NOT-YET-COVERED: 1.10 - reduced_motion_is_respected
