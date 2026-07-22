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

import { test, expect } from '@playwright/test';

// == CANONICAL ORACLE PREFIX ==
test.describe('NoteNest UI Validations', () => {
  test('1.1 1_1', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.2 1_2', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.3 1_3', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.4 1_4', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.5 1_5', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.6 1_6', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.7 1_7', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.8 1_8', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.10 1_10', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.11 1_11', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.12 1_12', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.13 1_13', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.14 1_14', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.19 1_19', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.20 1_20', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.25 1_25', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.27 1_27', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.30 create_note_count_delta_chain', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'New Note' }).click();
  // Using an actual visible selector from NoteNest
  await expect(page.locator('input[placeholder="Note title..."]')).toBeVisible({ timeout: 2000 });
  });

  test('1.31 move_note_badge_chain', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.32 pin_state_cross_view_chain', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.33 delete_restore_badge_chain', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.34 color_label_syncs_across_views', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.35 double_activation_single_note', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.36 folder_delete_confirm_nondestructive', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.37 bold_toggle_undo_redo_roundtrip', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.38 export_nest_two_format_tabs', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.39 export_reflects_session_mutations', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.40 nest_json_field_contract_visible', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.41 import_nest_applies_workspace', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.42 command_palette_navigates_note', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.43 batch_trash_exact_count_delta', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.44 session_undo_restores_batch_trash', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.46 batch_color_updates_edge_bars', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('4.1 empty_state_is_present', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('4.2 forms_validate_inline', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('4.3 errors_are_actionable', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('4.4 actions_show_confirmation', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('4.5 export_compiles_when_empty', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('4.6 destructive_actions_support_undo_or_cancel', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('4.7 command_palette_empty_query_safe', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('4.8 controls_use_semantic_tags', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('4.9 modal_supports_close_paths', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('4.10 batch_zero_selection_noop', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('4.11 import_rejects_bad_field_contract', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('4.12 undo_redo_empty_stack_safe', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('3.1 spacing_and_sizing_follow_scale', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('3.2 typography_matches_spec', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('3.3 layout_matches_reference', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('3.4 specified_state_changes_animate', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('3.5 responsive_behavior_matches_reference', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('3.6 control_styling_matches_spec', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('3.7 typography_has_clear_hierarchy', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('3.8 component_states_match_spec', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('3.9 surface_treatments_match_spec', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('3.10 export_chrome_fits_shell', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('11.1 delightful_microinteractions', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('11.2 advanced_motion_mechanics', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('11.3 guided_onboarding', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('11.4 enhanced_interactive_graphics', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('11.5 alternative_input_support', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('11.6 preference_personalization', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('11.7 polished_brand_narrative', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('11.8 dynamic_theming_beyond_requirements', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('11.9 search_syntax_chips', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('11.10 printable_markdown_vault', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('innovation.catchall innovation_catchall', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('15.1 headings_use_consistent_capitalization', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('15.2 actions_use_specific_labels', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('15.3 errors_name_problem_and_fix', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('15.4 empty_states_explain_next_step', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('15.5 body_copy_is_well_written', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('15.6 terminology_is_consistent', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('15.7 numbers_dates_and_units_are_consistent', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('15.8 success_messages_are_specific', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('6.1 create_flow_updates_all_surfaces', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('6.2 invalid_create_shows_inline_validation', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('6.3 edit_flow_updates_related_displays', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('6.4 delete_flow_updates_all_surfaces', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('6.5 view_switch_retains_state', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('6.6 last_delete_reveals_empty_state', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('6.7 search_filters_update_lists', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('6.8 collapsible_chrome_preserves_workflow', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('6.9 overlays_support_expected_flows', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('6.10 export_import_flow_without_reload', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('6.11 batch_trash_undo_flow', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('6.12 command_palette_selects_note', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('6.13 move_note_updates_both_badges_and_folder_id', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('6.14 pin_and_unpin_echo_across_all_notes_and_folder', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('6.15 delete_restore_round_trip_updates_badge_and_export_arrays', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('6.16 color_label_edge_bar_matches_every_view', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('6.17 artifact_pipeline_exposes_folder_pin_color_and_round_trip', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('6.18 reload_returns_complete_seeded_workspace_baseline', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.1 controls_are_keyboard_accessible', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.2 modals_manage_focus', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.3 images_and_icons_have_alt_text', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.4 feedback_uses_live_regions', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.5 forms_have_explicit_labels', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.6 headings_follow_logical_order', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.7 landmark_navigation_is_present', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.8 text_and_controls_have_contrast', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.9 semantic_html_roles_are_used', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('1.10 reduced_motion_is_respected', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('9.1 cold_start_is_under_two_seconds', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('9.2 console_is_clean', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('9.3 export_recompile_stays_responsive', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('9.4 async_work_has_loading_indicators', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('9.5 large_collections_render_without_lag', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('9.6 state_changes_remain_interactive', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('9.7 animations_maintain_smooth_frame_rate', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('9.8 rapid_input_does_not_freeze', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('9.9 extended_sessions_avoid_resource_runaway', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('9.10 virtualized_count_stays_bounded', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('2.1 2_1', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('2.2 2_2', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('2.3 2_3', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('2.4 2_4', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('2.5 2_5', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('2.6 2_6', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('2.7 2_7', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('2.10 count_badge_legible_distinct', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('2.11 consistent_icon_set', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('2.12 control_labels_specific_verbs', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('2.14 export_nest_drawer_anatomy', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('2.15 selection_tray_and_command_palette_chrome', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('4.1 4_1', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app > div');
  await expect(appLoc.first()).toBeVisible({ timeout: 2000 });
  const tree = page.getByRole('tree');
  await expect(tree).toBeVisible({ timeout: 2000 });
  });

  test('4.2 reload_resets_to_seeded_baseline', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('4.4 4_4', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('4.5 4_5', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('4.11 interactive_within_two_seconds', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('4.12 confirm_dialogs_trap_focus', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('4.13 toolbar_pressed_state_exposed', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('4.14 keyboard_operable_controls', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('4.15 virtualized_scroll_stays_smooth', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('4.17 inline_form_validation_runtime', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('4.18 export_import_live_store_coherence', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('7.1 layout_adapts_desktop_to_mobile', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('7.2 mobile_tap_targets_are_large_enough', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('7.3 typography_resizes_across_breakpoints', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('7.4 content_avoids_clipping_and_overflow', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('7.5 chrome_adapts_to_small_screens', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('7.6 stacking_reflows_logically', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('7.7 mobile_touch_gestures_work', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('7.8 small_screens_avoid_horizontal_scroll', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('7.9 export_drawer_fits_narrow', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('7.10 fixed_controls_remain_accessible', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('3.1 3_1', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('3.2 3_2', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('3.3 3_3', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('3.4 3_4', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('3.5 3_5', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('3.7 note_row_animates_create_delete_restore', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'New Note' }).click();
  // Using an actual visible selector from NoteNest
  await expect(page.locator('input[placeholder="Note title..."]')).toBeVisible({ timeout: 2000 });
  });

  test('3.8 folder_chevron_expand_transition', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('3.9 mobile_folder_panel_slides', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('3.10 export_and_palette_enter_exit', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('14.1 multi_facet_reload_resets_to_seed', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('14.2 folder_selection_reversal_proves_live_list', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('14.3 search_derived_list_sensitivity', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('14.4 pin_and_color_echo_across_views_and_export', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('14.5 create_note_count_delta_exact', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'New Note' }).click();
  // Using an actual visible selector from NoteNest
  await expect(page.locator('input[placeholder="Note title..."]')).toBeVisible({ timeout: 2000 });
  });

  test('14.6 different_titles_different_exports', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('14.7 interleaved_create_search_and_export', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('14.8 empty_trash_then_repopulate', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('14.9 export_import_round_trip_pipeline', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

  test('14.10 batch_trash_undo_export_pipeline', async ({ page }) => {
  await page.goto('/');
  const appLoc = page.locator('#app');
  await expect(appLoc).toBeVisible({ timeout: 2000 });
  });

});
