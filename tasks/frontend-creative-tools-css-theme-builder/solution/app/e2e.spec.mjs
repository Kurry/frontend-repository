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

test('1.1 initial_theme_workspace', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.1');
});

test('1.10 theme_selection_cross_panel_sync', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.10');
});

test('1.11 random_changes_live_theme', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.11');
});

test('1.12 complete_editor_controls', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.12');
});

test('1.14 export_formats_copy_download_dismiss', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.14');
});

test('1.15 builtin_edit_forks_copy', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.15');
});

test('1.16 share_hash_updates_and_loads', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.16');
});

test('1.19 chrome_dropdowns_stay_in_place', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.19');
});

test('1.2 create_custom_theme', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.2');
});

test('1.20 hold_to_add_success_and_cancel', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.20');
});

test('1.21 builtin_removal_protection', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.21');
});

test('1.22 reset_restores_selected_theme', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.22');
});

test('1.23 content_color_picker_updates_preview', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.23');
});

test('1.24 create_edit_preview_export_flow', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.24');
});

test('1.26 remove_all_then_repopulate_flow', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.26');
});

test('1.27 plain_reload_restores_seed', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.27');
});

test('1.28 malformed_hash_payload_fallback', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.28');
});

test('1.29 long_theme_name_truncation', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.29');
});

test('1.3 create_count_delta', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.3');
});

test('1.30 rapid_random_stays_coherent', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.30');
});

test('1.31 undo_redo_token_and_duplicate', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.31');
});

test('1.32 contrast_matrix_live_aa_aaa', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.32');
});

test('1.33 snapshots_and_before_after', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.33');
});

test('1.34 vision_mode_filters_preview_only', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.34');
});

test('1.35 import_theme_json_round_trip', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.35');
});

test('1.36 duplicate_custom_theme', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.36');
});

test('1.37 theme_json_api_shaped_field_contract', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.37');
});

test('1.38 created_theme_record_matches_theme_json', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.38');
});

test('1.39 snapshot_field_contract_name_and_theme', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.39');
});

test('1.4 token_edits_retheme_preview', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.4');
});

test('1.40 color_scheme_cross_field_with_dark_option', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.40');
});

test('1.41 base_rows_share_single_base_content', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.41');
});

test('1.5 rename_updates_all_surfaces', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.5');
});

test('1.6 remove_custom_theme', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.6');
});

test('1.7 empty_custom_theme_state', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.7');
});

test('1.8 invalid_theme_name_validation', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.8');
});

test('1.9 preview_tabs_swap_content', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '1.9');
});

test('2.12 keyboard_only_operation', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '2.12');
});

test('2.13 export_dialog_focus_management', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '2.13');
});

test('2.14 validation_message_a11y_association', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '2.14');
});

test('2.15 token_picker_accessible_names', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '2.15');
});

test('2.16 interactive_within_two_seconds', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '2.16');
});

test('2.17 lag_free_token_editing', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '2.17');
});

test('2.19 export_texts_derived_from_shared_state', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '2.19');
});

test('2.2 coherent_shared_theme_state', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '2.2');
});

test('2.20 theme_form_validation_matches_field_contract', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '2.20');
});

test('2.21 color_scheme_cross_field_matches_export', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '2.21');
});

test('2.22 document_title_reflects_theme_builder', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '2.22');
});

test('2.5 local_asset_network_hygiene', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '2.5');
});

test('2.6 console_clean_full_flow', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '2.6');
});

test('2.7 inline_form_validation_runtime', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '2.7');
});

test('2.8 accessible_interactive_primitives', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '2.8');
});

test('2.9 hash_round_trip_coherence', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '2.9');
});

test('3.1 spacing_matches_three_panel_scale', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '3.1');
});

test('3.10 microinteraction_timing_matches_spec', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '3.10');
});

test('3.11 contrast_export_snapshot_surfaces_present', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '3.11');
});

test('3.12 consistent_specific_labels', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '3.12');
});

test('3.13 empty_state_and_validation_copy', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '3.13');
});

test('3.15 contrast_matrix_visual_anatomy', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '3.15');
});

test('3.16 snapshots_and_vision_controls_placed', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '3.16');
});

test('3.2 typography_matches_outfit_chrome_spec', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '3.2');
});

test('3.3 desktop_composition_matches_reference', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '3.3');
});

test('3.4 specified_state_changes_have_motion', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '3.4');
});

test('3.5 responsive_behavior_matches_reference_patterns', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '3.5');
});

test('3.6 editor_controls_styled_not_browser_default', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '3.6');
});

test('3.7 clear_hierarchy_chrome_vs_editor_vs_preview', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '3.7');
});

test('3.8 component_states_match_spec', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '3.8');
});

test('3.9 surfaces_driven_by_active_theme_tokens', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '3.9');
});

test('4.1 empty_my_themes_hint_after_remove_all', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '4.1');
});

test('4.10 rapid_random_leaves_one_coherent_set', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '4.10');
});

test('4.11 undo_redo_disabled_at_empty_boundary', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '4.11');
});

test('4.12 empty_snapshot_name_rejected', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '4.12');
});

test('4.13 malformed_theme_json_import_rejected', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '4.13');
});

test('4.14 new_edit_after_undo_clears_redo', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '4.14');
});

test('4.15 schema_invalid_theme_json_import_rejected', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '4.15');
});

test('4.16 illegal_or_overlong_theme_name_rejected', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '4.16');
});

test('4.17 invalid_color_format_import_rejected', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '4.17');
});

test('4.2 theme_name_inline_validation_before_apply', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '4.2');
});

test('4.3 validation_names_field_and_fix', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '4.3');
});

test('4.4 random_shows_confirmation_toast', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '4.4');
});

test('4.5 early_hold_release_cancels_add', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '4.5');
});

test('4.6 builtin_remove_blocked_with_notice', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '4.6');
});

test('4.7 hold_progress_guides_nonobvious_control', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '4.7');
});

test('4.8 theme_controls_use_semantic_tags', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '4.8');
});

test('4.9 export_modal_close_paths', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '4.9');
});

test('6.1 hold_to_add_creates_custom_theme', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '6.1');
});

test('6.10 share_hash_round_trip_without_dead_end', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '6.10');
});

test('6.11 duplicate_then_undo_redo_flow', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '6.11');
});

test('6.12 export_import_theme_json_round_trip_flow', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '6.12');
});

test('6.13 snapshot_before_after_flow', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '6.13');
});

test('6.14 vision_mode_deuteranopia_flow', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '6.14');
});

test('6.15 create_record_appears_in_theme_json_export', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '6.15');
});

test('6.16 schema_validation_create_and_import_flow', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '6.16');
});

test('6.2 invalid_theme_name_inline_validation', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '6.2');
});

test('6.3 rename_and_token_edit_update_all_surfaces', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '6.3');
});

test('6.4 remove_custom_theme_updates_all_surfaces', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '6.4');
});

test('6.5 preview_tab_switch_retains_theme', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '6.5');
});

test('6.6 last_custom_remove_shows_empty_state', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '6.6');
});

test('6.7 fork_builtin_adds_exactly_one_custom', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '6.7');
});

test('6.8 chrome_dropdowns_preserve_workflow', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '6.8');
});

test('6.9 export_artifact_formats_copy_and_dismiss', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '6.9');
});

test('7.1 layout_adapts_1440_to_375', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '7.1');
});

test('7.10 overlays_remain_operable_at_small_widths', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '7.10');
});

test('7.2 mobile_tap_targets_adequate', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '7.2');
});

test('7.3 typography_readable_both_widths', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '7.3');
});

test('7.4 no_clip_or_overflow_at_375', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '7.4');
});

test('7.5 panels_stack_below_768', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '7.5');
});

test('7.6 narrow_stack_order_stays_usable', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '7.6');
});

test('7.7 mobile_controls_tappable', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '7.7');
});

test('7.8 no_horizontal_scroll_at_375', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '7.8');
});

test('7.9 preview_grid_and_palette_scale', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '7.9');
});

test('9.1 cold_start_under_two_seconds', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '9.1');
});

test('9.10 no_layout_jumps_after_first_paint', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '9.10');
});

test('9.2 console_clean_during_full_exercise', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '9.2');
});

test('9.3 token_edit_rethemes_under_100ms', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '9.3');
});

test('9.4 shell_visible_while_settling', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '9.4');
});

test('9.5 builtin_catalog_scrolls_without_lag', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '9.5');
});

test('9.6 ui_interactive_during_retheme', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '9.6');
});

test('9.7 preview_retheme_holds_stable_frame_rate', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '9.7');
});

test('9.8 rapid_token_edits_never_hang', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '9.8');
});

test('9.9 extended_theme_session_stable', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '9.9');
});

test('11.1 hold_to_add_delight_beyond_minimum', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '11.1');
});

test('11.10 competition_level_theme_studio_feel', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '11.10');
});

test('11.2 preview_storytelling_beyond_tabs', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '11.2');
});

test('11.3 guided_first_run_for_theme_studio', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '11.3');
});

test('11.4 oklch_or_harmony_aid_beyond_spec', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '11.4');
});

test('11.5 alternate_token_input_beyond_pickers', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '11.5');
});

test('11.6 session_personalization_beyond_requirements', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '11.6');
});

test('11.7 branded_studio_narrative_polish', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '11.7');
});

test('11.8 chrome_theme_craft_beyond_four_options', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '11.8');
});

test('11.9 local_platform_enhancement', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '11.9');
});

test('14.1 multi_facet_reload_resets_to_seed', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '14.1');
});

test('14.10 undo_round_trip_restores_all_surfaces', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '14.10');
});

test('14.11 theme_json_contract_round_trip_probe', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '14.11');
});

test('14.12 schema_invalid_import_leaves_state', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '14.12');
});

test('14.13 form_created_record_is_request_body', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '14.13');
});

test('14.2 tab_and_selection_reversal_proves_live_state', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '14.2');
});

test('14.3 token_edit_derived_preview_sensitivity', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '14.3');
});

test('14.4 editor_edit_echoes_in_list_and_palette', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '14.4');
});

test('14.5 hold_to_add_count_delta_exact', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '14.5');
});

test('14.6 different_token_edits_different_outcomes', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '14.6');
});

test('14.7 interleaved_create_and_tab_flows', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '14.7');
});

test('14.8 empty_then_repopulate_my_themes', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '14.8');
});

test('14.9 export_import_round_trip_preserves_tokens', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '14.9');
});

test('15.1 consistent_capitalization_chrome_and_editor', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '15.1');
});

test('15.2 specific_verbs_on_actions', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '15.2');
});

test('15.3 validation_names_problem_and_fix', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '15.3');
});

test('15.4 empty_my_themes_explains_next_step', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '15.4');
});
// NOT-AUTOMATABLE: 15.5 — preview_and_chrome_copy_polished

test('15.6 terminology_consistent_across_surfaces', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '15.6');
});

test('15.7 token_value_formatting_consistent', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '15.7');
});

test('15.8 success_messages_are_specific', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '15.8');
});

test('15.9 contrast_pass_fail_copy_clear', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', '15.9');
});

test('innovation.catchall innovation_catchall', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Unconditional assertion to cause an honest failure
  await expect(page.locator('body')).toHaveAttribute('data-test-id-not-found', 'innovation.catchall');
});
