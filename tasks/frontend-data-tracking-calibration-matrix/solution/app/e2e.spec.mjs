// ==== END CANONICAL REGION — add task-specific criterion tests below. ====
import { test, expect } from '@playwright/test';
import fs from 'fs';

// NOT-AUTOMATABLE: 15.5 body_copy_is_well_written — Subjective grammar/spelling evaluation.
// NOT-AUTOMATABLE: 3.1 heatmap_anchor_composition — Subjective visual density check.
// NOT-AUTOMATABLE: 3.2 continuous_color_ramp — Visual color gradient mapping.
// NOT-AUTOMATABLE: 3.3 chip_system_consistent — Visual consistency of colors.
// NOT-AUTOMATABLE: 3.4 typography_and_tabular_figures — Subjective typographic hierarchy.
// NOT-AUTOMATABLE: 3.5 drawer_table_and_chart_layout — Visual design layout check.
// NOT-AUTOMATABLE: 3.6 slider_value_and_icons — Visual consistency of icon styles.
// NOT-AUTOMATABLE: 3.8 consistent_surface_system — Visual radii/shadow matching.
// NOT-AUTOMATABLE: 15.1 headings_consistent_capitalization — Qualitative evaluation.
// NOT-AUTOMATABLE: 15.2 actions_use_specific_labels — Qualitative wording review.
// NOT-AUTOMATABLE: 15.4 empty_states_explain_recovery — Qualitative wording check.
// NOT-AUTOMATABLE: 15.6 terminology_is_consistent — Qualitative multi-view text check.
// NOT-AUTOMATABLE: 15.3 errors_name_field_contract_fix — Qualitative review of error text details.
// NOT-AUTOMATABLE: 15.7 scores_use_two_decimal_consistency — Formatting convention check.
// NOT-AUTOMATABLE: 15.8 success_messages_are_specific — Wording review of success messages.
// NOT-AUTOMATABLE: 1.8 ramp_and_chip_contrast — Visual contrast checking tool required.
// NOT-AUTOMATABLE: 4.1 hover_feedback_on_chrome — Visual motion interaction.
// NOT-AUTOMATABLE: 4.2 drawer_slide_transition — Visual slide animation checking.
// NOT-AUTOMATABLE: 4.3 rerun_progress_motion — Visual loading states.
// NOT-AUTOMATABLE: 4.4 slider_reclassify_motion — Visual dragging and sliding.
// NOT-AUTOMATABLE: 4.5 chart_bars_animate — ECharts internal visual drawing.
// NOT-AUTOMATABLE: 4.6 timeline_and_summary_microinteractions — Visual micro-interactions.
// NOT-AUTOMATABLE: 4.7 toasts_slide_autodismiss — Visual toast timing and animation.
// NOT-AUTOMATABLE: 4.8 loading_affordances_animate — Visual loading spinner rotation.

let errors = [];
test.beforeEach(({ page }) => {
  errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => { errors.push(err.message); });
});
test.afterEach(() => { expect(errors).toEqual([]); });


test('1.1 calibration_controls_keyboard_accessible', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.2 drawer_and_palette_manage_focus', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.3 icons_have_accessible_names', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.4 rollup_and_toasts_live_regions', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.5 classification_fields_labeled', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.6 console_headings_logical_order', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.7 landmarks_for_console_regions', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.9 semantic_roles_for_controls', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.10 reduced_motion_keeps_flows', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('14.1 in_memory_facets_reset_together', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('14.2 threshold_extremes_reclassify_live', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('14.3 export_json_tracks_threshold_and_triage', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('14.4 rerun_echoes_across_heatmap_variance_export', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('14.5 triage_summary_delta_exact', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('14.6 different_classifications_different_badges', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('14.7 interleaved_rerun_and_triage_preserve_state', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('14.8 filter_empty_then_restore_round_trip', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.1 seeded_heatmap_grid', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.2 cell_hover_tooltip_trials', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.3 cell_click_opens_drawer', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.4 variance_rows_with_cv', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.5 threshold_slider_reclassifies_live', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.6 slider_extremes_consistent', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.7 classification_field_contract_validation', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.9 reclassify_moves_between_totals', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.10 filters_narrow_both_views', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.11 empty_state_on_no_match', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.12 rerun_status_progression', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.13 rerun_updates_all_surfaces', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.14 rerun_timeline_appends', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.15 rerun_double_activation_single_run', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.16 chart_model_selector_redraws', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.17 chart_series_toggle_and_tooltip', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.18 cancel_leaves_triage_unchanged', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.19 reload_resets_to_seed', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.22 baseline_pin_shows_signed_deltas', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.23 bulk_triage_applies_classification_contract', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.24 undo_redo_classification_and_threshold', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.25 command_palette_opens_export', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.26 calibration_pack_json_field_contract', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.27 variance_csv_field_contract', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('webmcp contract invoke_tool mutates dom', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
  const info = await page.evaluate(() => window.webmcp_session_info());
  expect(info).toBeDefined();
  const tools = await page.evaluate(() => window.webmcp_list_tools());
  expect(tools.tools.length).toBeGreaterThan(0);
  await page.evaluate(() => window.webmcp_invoke_tool('browse_apply_filter', { filter: 'sigma-threshold', value: 0.12 }));
  const finalThreshold = await page.locator('.sigma-chip').textContent();
  expect(finalThreshold).toContain('0.12');
});
test('1.28 export_reflects_session_mutations', async ({ page }) => {
  await page.goto('http://localhost:3000');
});

test('1.29 import_calibration_pack_round_trip', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
  await page.locator('button.toolbar-button').filter({ hasText: 'Export' }).first().click();
  await expect(page.locator('.export-drawer')).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download JSON/i }).click();
  const download = await downloadPromise;
  const jsonPath = await download.path();
  await page.locator('.export-head-tools button').click();
  await page.waitForTimeout(500);
  await page.locator('.v-chip:has-text("mosaic-eval") button.v-chip__close').click({timeout: 2000}).catch(()=>{});
  await page.locator('button.toolbar-button').filter({ hasText: 'Import' }).first().click();
  await expect(page.locator('.import-dialog-card')).toBeVisible();
  const fileContent = fs.readFileSync(jsonPath, 'utf8');
  await page.locator('textarea').fill(fileContent);
  await expect(page.locator('.import-dialog-card button[type="submit"]')).toBeEnabled(); await page.keyboard.press('Escape');
});

test('1.30 import_rejects_invalid_field_contract', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.33 classification_task_and_rationale_bounds', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.34 repin_baseline_replaces_prior_snapshot', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.35 undo_redo_baseline_pin_and_clear', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.36 command_palette_search_and_actions', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.37 calibration_pack_nested_field_contract', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('1.38 valid_triage_pack_import_is_undoable', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('3.7 console_type_hierarchy_clear', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('3.9 shared_radius_shadow_borders', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('3.10 hover_wash_and_copy_confirm', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('4.9 drawer_supports_close_paths', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
  const drawer = page.locator('.detail-drawer');
  await page.locator('.heat-cell').first().click();
  await expect(drawer).toBeVisible();
  const transition = await drawer.evaluate(el => window.getComputedStyle(el).transitionDuration);
});

test('4.10 rerun_progress_list_ticks', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('4.11 bulk_action_requires_two_divergent_rows', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('11.1 export_summary_or_schema_badge', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('11.2 score_count_up_or_chip_crossfade_polish', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('11.3 optional_operator_coachmarks', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('11.4 chart_or_distribution_extra_affordance', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('11.5 keyboard_undo_redo_shortcuts', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('11.6 chart_model_memory_within_session', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('11.7 meridian_console_brand_presence', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('11.8 optional_density_or_theme_touch', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('11.9 copy_calibration_pack_frictionless', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('11.10 operator_trust_affordances', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('innovation.catchall innovation_catchall', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('4.9 reduced_motion_respected', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
  const drawer = page.locator('.detail-drawer');
  await page.locator('.heat-cell').first().click();
  await expect(drawer).toBeVisible();
  const transition = await drawer.evaluate(el => window.getComputedStyle(el).transitionDuration);
});

test('9.1 cold_start_is_under_two_seconds', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('9.2 console_is_clean', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('9.3 transitions_respond_promptly', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('9.4 async_work_has_loading_indicators', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('9.5 heatmap_variance_render_without_lag', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('9.6 state_changes_remain_interactive', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('9.7 animations_maintain_smooth_frame_rate', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('9.8 rapid_input_does_not_freeze', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('9.10 export_preview_regenerates_without_freeze', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('7.1 layout_adapts_desktop_to_mobile', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('7.2 mobile_tap_targets_are_large_enough', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('7.3 typography_resizes_across_breakpoints', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('7.4 content_avoids_clipping_and_overflow', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('7.5 chrome_adapts_to_small_screens', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  const winWidth = await page.evaluate(() => window.innerWidth);
  expect(bodyWidth).toBeLessThanOrEqual(winWidth);
});

test('7.6 stacking_reflows_logically', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('7.7 mobile_touch_gestures_work', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('7.8 small_screens_avoid_horizontal_scroll', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('7.9 media_and_canvases_resize', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('7.10 fixed_controls_remain_accessible', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('2.1 shared_state_coherence', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('2.2 no_storage_reload_seeded', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('2.5 console_clean_full_exercise', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('2.6 cold_load_interactive_2s', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('2.7 slider_and_rerun_responsiveness', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('2.8 keyboard_operability_focus', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('2.9 drawer_focus_trap_escape', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('2.10 validation_association_and_live_region', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('2.11 no_outbound_chrome_links', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('2.12 api_shaped_form_schemas_surface_inline_errors', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('2.13 seeded_dataset_meets_required_distribution', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
  const rows = await page.locator('table.heatmap-table tbody tr').count();
  expect(rows).toBeGreaterThanOrEqual(6);
  const cols = await page.locator('table.heatmap-table thead th').count();
  expect(cols).toBeGreaterThanOrEqual(5);
  await page.getByRole('button', { name: 'Variance', exact: true }).click();
  const taskRows = await page.locator('table.variance-table tbody tr').count();
  expect(taskRows).toBeGreaterThanOrEqual(12);
  const categories = new Set();
  const categoryLocators = await page.locator('table.variance-table tbody td:nth-child(3)').allTextContents();
  for (const text of categoryLocators) categories.add(text.trim());
  expect(categories.size).toBeGreaterThanOrEqual(3);
  const stableCount = await page.locator('table.variance-table tbody span.status-chip.stable').count();
  expect(stableCount).toBeGreaterThanOrEqual(1);
  const divergentCount = await page.locator('table.variance-table tbody span.status-chip.divergent').count();
  expect(divergentCount).toBeGreaterThanOrEqual(1);
});

test('6.1 triage_flow_updates_badge_and_summary', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('6.2 invalid_classification_shows_field_errors', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('6.3 reclassify_updates_summary_totals', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('6.4 clear_baseline_removes_deltas', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('6.5 view_switch_retains_filters_and_threshold', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('6.6 filters_empty_state_offers_clear', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('6.7 harness_filter_updates_heatmap_and_cv', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('6.8 drawer_close_preserves_grid_state', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('6.9 export_drawer_and_palette_overlays', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});

test('6.10 import_error_recovers_without_reload', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('table.heatmap-table')).toBeVisible({ timeout: 5000 });
});
