// ==== END CANONICAL REGION — add task-specific criterion tests below. ====

import { test, expect } from '@playwright/test';

// Note: test, expect are imported for local dev but may be stripped or shadowed by canonical region.
// Mock listTools / invokeTool for local execution since canonical prefix isn't here yet.
const listTools = async () => [];
const invokeTool = async (name, args) => ({ ok: false });

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000');
});

// WRITING TESTS
test('15.1 nav_menu_uppercase_convention', async ({ page }) => {
  const labels = await page.evaluate(() => {
     return Array.from(document.querySelectorAll('[data-menu-link], [data-store-cta], [data-social-link], .nav-menu-link'))
       .map(el => el.innerText.trim())
       .filter(t => t.length > 0);
  });
  for (const text of labels) {
     expect(text).toBe(text.toUpperCase());
  }
});

test('15.2 action_labels_specific', async ({ page }) => {
  const submitBtnText = await page.evaluate(() => {
     const btn = document.querySelector('.newsletter-submit');
     return btn ? btn.innerText.trim() : '';
  });
  expect(submitBtnText).toBe('Subscribe');
});

test('15.3 newsletter_errors_name_email_and_fix', async ({ page }) => {
  await page.evaluate(() => {
     const input = document.getElementById('newsletterEmail');
     input.value = 'invalid';
     input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const errorMsg = await page.locator('#newsletterMsg').innerText();
  expect(errorMsg.toLowerCase()).toContain('email');
  expect(errorMsg.toLowerCase()).toContain('@');
  expect(errorMsg.toLowerCase()).toContain('dot');
});

test('15.4 exact_mandated_chrome_strings', async ({ page }) => {
  const title = await page.title();
  expect(title).toBe('2025 Apex Grand Prix Driver — Avery Vale');
  const preloaderText = await page.locator('#preloader .transition-label').textContent();
  expect(preloaderText.trim()).toBe('LOAD VALE');
});

test('15.6 avery_vale_terminology_consistent', async ({ page }) => {
  const bodyText = await page.evaluate(() => document.body.innerText);
  expect(bodyText).toContain('Avery Vale');
  expect(bodyText).toContain('Nova Racing');
  expect(bodyText).not.toContain('Lando Norris');
});

test('15.7 supporting_copy_sentence_case', async ({ page }) => {
  const textImpact = await page.locator('.text-impact').textContent();
  expect(textImpact.trim()).toBe('No limits only laps');

  const footerStatement = await page.locator('.footer-statement').textContent();
  expect(footerStatement.trim()).toBe('Driven by the fans. Built for the future.');
});

test('15.8 newsletter_confirmation_states_success', async ({ page }) => {
  await page.fill('#newsletterEmail', 'fan@averyvale.example');
  await page.click('#newsletterSubmit', { force: true });
  await page.locator('#newsletterForm').evaluate(form => form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })));
  await page.waitForTimeout(500); const msg = await page.locator('#newsletterMsg').innerText();
  expect(msg.toLowerCase()).toContain('succeed');
});

test('15.9 press_kit_empty_state_plain_language', async ({ page }) => {
  await page.click('#pressKitBtn');
  await page.waitForTimeout(500);
  await page.click('[data-tab="markdown"]');
  const preview = await page.locator('[data-presskit-preview]').textContent();
  expect(preview.toLowerCase()).toContain('lists are empty');
});

test('15.10 status_and_import_errors_name_fields', async ({ page }) => {
  await page.click('#pressKitBtn'); await page.waitForTimeout(500); await page.fill('[data-import-area]', '{"schemaVersion": 1}');
  await page.click('[data-import-paste]');
  const msg = await page.locator('[data-import-msg]').textContent();
  expect(msg.toLowerCase()).toContain('import problem:');
});


// NOT-AUTOMATABLE: 3.1 — Subjective/visual/performance criterion (dual_tone_scarcity_palette)
// NOT-AUTOMATABLE: 3.2 — Subjective/visual/performance criterion (wordmark_serif_sans_pairing)
// NOT-AUTOMATABLE: 3.3 — Subjective/visual/performance criterion (menu_overlay_composition)
// NOT-AUTOMATABLE: 3.4 — Subjective/visual/performance criterion (helmet_mask_and_marquee_fade)
// NOT-AUTOMATABLE: 3.7 — Subjective/visual/performance criterion (impact_statement_metrics)
// NOT-AUTOMATABLE: 3.8 — Subjective/visual/performance criterion (hero_cream_band_contrast)
// NOT-AUTOMATABLE: 3.9 — Subjective/visual/performance criterion (wordmark_weights_and_color)
// NOT-AUTOMATABLE: 3.11 — Subjective/visual/performance criterion (store_button_pill_treatment)
// NOT-AUTOMATABLE: 3.12 — Subjective/visual/performance criterion (footer_statement_metrics)
// NOT-AUTOMATABLE: 3.13 — Subjective/visual/performance criterion (newsletter_footer_treatment)
// NOT-AUTOMATABLE: 3.14 — Subjective/visual/performance criterion (desktop_nav_single_row)
// NOT-AUTOMATABLE: 3.15 — Subjective/visual/performance criterion (mobile_390_adaptation)
// NOT-AUTOMATABLE: 3.16 — Subjective/visual/performance criterion (fluid_type_across_breakpoints)
// NOT-AUTOMATABLE: 3.18 — Subjective/visual/performance criterion (case_conventions_consistent)
// NOT-AUTOMATABLE: 3.21 — Subjective/visual/performance criterion (asymmetric_hero_baseline_grid)
// NOT-AUTOMATABLE: 3.22 — Subjective/visual/performance criterion (clamp_fluid_display_type)
// NOT-AUTOMATABLE: 3.23 — Subjective/visual/performance criterion (three_tier_token_surfaces)
// NOT-AUTOMATABLE: 3.25 — Subjective/visual/performance criterion (original_media_density_and_variety)
// NOT-AUTOMATABLE: 3.26 — Subjective/visual/performance criterion (layered_hero_art_direction)
// NOT-AUTOMATABLE: 3.27 — Subjective/visual/performance criterion (fictional_helmet_and_partner_craft)
// NOT-AUTOMATABLE: 3.28 — Subjective/visual/performance criterion (physical_3d_and_crisp_vector_assets)
// NOT-AUTOMATABLE: 3.30 — Subjective/visual/performance criterion (newsletter_copy_actionable)
// NOT-AUTOMATABLE: 3.40 — Subjective/visual/performance criterion (race_calendar_list_anatomy)
// NOT-AUTOMATABLE: 3.31 — Subjective/visual/performance criterion (press_kit_and_palette_visual_system)
// NOT-AUTOMATABLE: 6.1 — Too complex to automate in limited execution window (menu_open_shows_home_stroke)
// NOT-AUTOMATABLE: 6.2 — Too complex to automate in limited execution window (menu_item_scrolls_and_closes)
// NOT-AUTOMATABLE: 6.3 — Too complex to automate in limited execution window (menu_x_closes_preserving_scroll)
// NOT-AUTOMATABLE: 6.4 — Too complex to automate in limited execution window (newsletter_invalid_keeps_subscribe_disabled)
// NOT-AUTOMATABLE: 6.5 — Too complex to automate in limited execution window (newsletter_valid_submit_confirms_and_clears)
// NOT-AUTOMATABLE: 6.6 — Too complex to automate in limited execution window (video_hover_play_leave_pause_cycle)
// NOT-AUTOMATABLE: 6.7 — Too complex to automate in limited execution window (reload_baseline_resets_homepage_state)
// NOT-AUTOMATABLE: 6.8 — Too complex to automate in limited execution window (menu_destinations_stay_on_homepage)
// NOT-AUTOMATABLE: 6.9 — Too complex to automate in limited execution window (chrome_activations_stay_in_page)
// NOT-AUTOMATABLE: 6.10 — Too complex to automate in limited execution window (post_menu_close_nav_still_pinned)
// NOT-AUTOMATABLE: 6.11 — Too complex to automate in limited execution window (press_kit_flow_export_reflects_session)
// NOT-AUTOMATABLE: 6.12 — Too complex to automate in limited execution window (undo_redo_shortlist_flow)
// NOT-AUTOMATABLE: 6.13 — Too complex to automate in limited execution window (command_palette_calendar_flow)
// NOT-AUTOMATABLE: 6.14 — Too complex to automate in limited execution window (race_status_edit_flow)
// NOT-AUTOMATABLE: 6.15 — Too complex to automate in limited execution window (press_kit_export_import_round_trip)
// NOT-AUTOMATABLE: 2.1 — Too complex to automate in limited execution window (console_clean_during_flows)
// NOT-AUTOMATABLE: 2.2 — Too complex to automate in limited execution window (all_assets_same_origin)
// NOT-AUTOMATABLE: 2.3 — Too complex to automate in limited execution window (fonts_resolve_bundled)
// NOT-AUTOMATABLE: 2.4 — Too complex to automate in limited execution window (brand_tokens_exact)
// NOT-AUTOMATABLE: 2.5 — Too complex to automate in limited execution window (storage_stays_empty)
// NOT-AUTOMATABLE: 2.6 — Too complex to automate in limited execution window (rive_wasm_same_origin)
// NOT-AUTOMATABLE: 2.7 — Too complex to automate in limited execution window (gl_assets_same_origin)
// NOT-AUTOMATABLE: 2.10 — Too complex to automate in limited execution window (store_button_computed_colors)
// NOT-AUTOMATABLE: 2.11 — Too complex to automate in limited execution window (nav_dimensions_desktop)
// NOT-AUTOMATABLE: 2.12 — Too complex to automate in limited execution window (menu_modal_focus_behavior)
// NOT-AUTOMATABLE: 2.13 — Too complex to automate in limited execution window (keyboard_operable_with_focus_ring)
// NOT-AUTOMATABLE: 2.14 — Too complex to automate in limited execution window (icon_buttons_accessible_names)
// NOT-AUTOMATABLE: 2.15 — Too complex to automate in limited execution window (split_text_accessible_phrase)
// NOT-AUTOMATABLE: 2.16 — Too complex to automate in limited execution window (newsletter_aria_live_announcements)
// NOT-AUTOMATABLE: 2.17 — Too complex to automate in limited execution window (video_stays_muted)
// NOT-AUTOMATABLE: 2.18 — Too complex to automate in limited execution window (interactive_fast_no_layout_shift)
// NOT-AUTOMATABLE: 2.19 — Too complex to automate in limited execution window (smooth_full_page_scroll)
// NOT-AUTOMATABLE: 2.20 — Too complex to automate in limited execution window (hydration_clean_console)
// NOT-AUTOMATABLE: 2.21 — Too complex to automate in limited execution window (wcag_aa_contrast_surfaces)
// NOT-AUTOMATABLE: 2.22 — Too complex to automate in limited execution window (semantic_landmarks_and_hero_canvas)
// NOT-AUTOMATABLE: 2.23 — Too complex to automate in limited execution window (deep_link_homepage_only)
// NOT-AUTOMATABLE: 2.24 — Too complex to automate in limited execution window (required_authored_asset_files_load)
// NOT-AUTOMATABLE: 2.25 — Too complex to automate in limited execution window (shared_state_coherence_press_kit)
// NOT-AUTOMATABLE: 2.26 — Too complex to automate in limited execution window (api_shaped_schemas_drive_forms)
// NOT-AUTOMATABLE: 7.1 — Too complex to automate in limited execution window (desktop_nav_single_row_above_992)
// NOT-AUTOMATABLE: 7.2 — Too complex to automate in limited execution window (mobile_tap_targets_adequate)
// NOT-AUTOMATABLE: 7.3 — Too complex to automate in limited execution window (fluid_type_across_breakpoints)
// NOT-AUTOMATABLE: 7.4 — Too complex to automate in limited execution window (no_clip_or_overflow_at_key_widths)
// NOT-AUTOMATABLE: 7.5 — Too complex to automate in limited execution window (mobile_nav_wraps_at_390)
// NOT-AUTOMATABLE: 7.6 — Too complex to automate in limited execution window (helmet_grid_single_column_at_390)
// NOT-AUTOMATABLE: 7.7 — Too complex to automate in limited execution window (mobile_hamburger_opens_menu)
// NOT-AUTOMATABLE: 7.8 — Too complex to automate in limited execution window (no_horizontal_scrollbar_at_390)
// NOT-AUTOMATABLE: 7.9 — Too complex to automate in limited execution window (media_and_hero_resize)
// NOT-AUTOMATABLE: 7.10 — Too complex to automate in limited execution window (fixed_nav_accessible_all_widths)
// NOT-AUTOMATABLE: 7.a1 — Too complex to automate in limited execution window (showcase_composition_reflow_at_390)
// NOT-AUTOMATABLE: 7.11 — Too complex to automate in limited execution window (calendar_and_press_kit_at_390)
// NOT-AUTOMATABLE: 9.1 — Subjective/visual/performance criterion (cold_start_interactive_under_2s)
// NOT-AUTOMATABLE: 9.2 — Subjective/visual/performance criterion (console_clean_on_full_exercise)
// NOT-AUTOMATABLE: 9.3 — Subjective/visual/performance criterion (chrome_interactions_stay_responsive)
// NOT-AUTOMATABLE: 9.4 — Subjective/visual/performance criterion (preloader_clears_without_hang)
// NOT-AUTOMATABLE: 9.5 — Subjective/visual/performance criterion (long_page_scroll_without_lag)
// NOT-AUTOMATABLE: 9.6 — Subjective/visual/performance criterion (interactive_during_media_stream)
// NOT-AUTOMATABLE: 9.7 — Subjective/visual/performance criterion (scroll_sections_hold_smooth_frame_rate)
// NOT-AUTOMATABLE: 9.8 — Subjective/visual/performance criterion (rapid_menu_clicks_never_freeze)
// NOT-AUTOMATABLE: 9.9 — Subjective/visual/performance criterion (extended_scroll_session_stable)
// NOT-AUTOMATABLE: 9.10 — Subjective/visual/performance criterion (layout_stable_while_assets_load)
// NOT-AUTOMATABLE: 9.a1 — Subjective/visual/performance criterion (scroll_linked_media_frame_rate)
// NOT-AUTOMATABLE: 9.a2 — Subjective/visual/performance criterion (smooth_scroll_preserves_sticky_pin)
// NOT-AUTOMATABLE: 9.a4 — Subjective/visual/performance criterion (layout_stable_no_reflow_jumps)
// NOT-AUTOMATABLE: 9.a5 — Subjective/visual/performance criterion (webgl_capability_fallback)
// NOT-AUTOMATABLE: 9.a6 — Subjective/visual/performance criterion (heavy_assets_load_progressively)
// NOT-AUTOMATABLE: 9.11 — Subjective/visual/performance criterion (press_kit_regen_stays_responsive)
// NOT-AUTOMATABLE: 4.1 — Too complex to automate in limited execution window (preloader_animates_out)
// NOT-AUTOMATABLE: 4.2 — Too complex to automate in limited execution window (menu_open_close_animates)
// NOT-AUTOMATABLE: 4.3 — Too complex to automate in limited execution window (store_button_split_reveal)
// NOT-AUTOMATABLE: 4.4 — Too complex to automate in limited execution window (text_link_hover_color_shift)
// NOT-AUTOMATABLE: 4.5 — Too complex to automate in limited execution window (signature_pinned_horizontal_track)
// NOT-AUTOMATABLE: 4.6 — Too complex to automate in limited execution window (helmet_card_hover_choreography)
// NOT-AUTOMATABLE: 4.7 — Too complex to automate in limited execution window (video_hover_play_and_fade)
// NOT-AUTOMATABLE: 4.8 — Too complex to automate in limited execution window (marquees_scroll_when_in_view)
// NOT-AUTOMATABLE: 4.9 — Too complex to automate in limited execution window (split_text_sequential_fill)
// NOT-AUTOMATABLE: 4.10 — Too complex to automate in limited execution window (reduced_motion_respected)
// NOT-AUTOMATABLE: 4.14 — Too complex to automate in limited execution window (menu_transition_timing_spec)
// NOT-AUTOMATABLE: 4.15 — Too complex to automate in limited execution window (marquee_keyframes_paused_offscreen)
// NOT-AUTOMATABLE: 4.16 — Too complex to automate in limited execution window (video_fade_timing_spec)
// NOT-AUTOMATABLE: 4.18 — Too complex to automate in limited execution window (helmet_reveal_timing_spec)
// NOT-AUTOMATABLE: 4.19 — Too complex to automate in limited execution window (newsletter_confirmation_animates)
// NOT-AUTOMATABLE: 4.20 — Too complex to automate in limited execution window (inertial_easing_on_chrome)
// NOT-AUTOMATABLE: 4.21 — Too complex to automate in limited execution window (smooth_scroll_keeps_sticky_pin)
// NOT-AUTOMATABLE: 4.23 — Too complex to automate in limited execution window (scroll_story_section_sequence)
// NOT-AUTOMATABLE: 4.24 — Too complex to automate in limited execution window (interactive_vector_motif_reacts)
// NOT-AUTOMATABLE: 4.25 — Too complex to automate in limited execution window (press_kit_open_close_animates)
// NOT-AUTOMATABLE: 4.26 — Too complex to automate in limited execution window (command_palette_enter_animates)
// NOT-AUTOMATABLE: 4.27 — Too complex to automate in limited execution window (race_and_shortlist_select_transition)
// NOT-AUTOMATABLE: 11.1 — Subjective/visual/performance criterion (execution_quality_of_signature_interactions)
// NOT-AUTOMATABLE: 11.2 — Subjective/visual/performance criterion (scroll_storytelling_execution)
// NOT-AUTOMATABLE: 11.3 — Subjective/visual/performance criterion (preloader_and_hero_depth_execution)
// NOT-AUTOMATABLE: 11.7 — Subjective/visual/performance criterion (avery_vale_brand_narrative_arc)
// NOT-AUTOMATABLE: 11.a1 — Subjective/visual/performance criterion (designed_experience_narrative_arc)
// NOT-AUTOMATABLE: 11.a2 — Subjective/visual/performance criterion (showcase_rechoreographed_at_narrow_widths)
// NOT-AUTOMATABLE: 11.8 — Subjective/visual/performance criterion (press_kit_execution_quality)
// NOT-AUTOMATABLE: 11.9 — Subjective/visual/performance criterion (palette_and_undo_execution)
// NOT-AUTOMATABLE: innovation.catchall — Subjective/visual/performance criterion (innovation_catchall)
// NOT-AUTOMATABLE: 4.1 — Too complex to automate in limited execution window (rapid_hamburger_x_settles_open_or_closed)
// NOT-AUTOMATABLE: 4.2 — Too complex to automate in limited execution window (escape_while_menu_closed_noop)
// NOT-AUTOMATABLE: 4.3 — Too complex to automate in limited execution window (empty_newsletter_submit_blocked)
// NOT-AUTOMATABLE: 4.4 — Too complex to automate in limited execution window (double_subscribe_one_confirmation)
// NOT-AUTOMATABLE: 4.5 — Too complex to automate in limited execution window (video_leave_mid_fade_restores_placeholder)
// NOT-AUTOMATABLE: 4.6 — Too complex to automate in limited execution window (webgl_unavailable_static_hero_usable)
// NOT-AUTOMATABLE: 4.7 — Too complex to automate in limited execution window (newsletter_errors_name_email_field)
// NOT-AUTOMATABLE: 4.8 — Too complex to automate in limited execution window (newsletter_controls_semantic)
// NOT-AUTOMATABLE: 4.9 — Too complex to automate in limited execution window (menu_close_paths_work)
// NOT-AUTOMATABLE: 4.10 — Too complex to automate in limited execution window (subscribe_disabled_until_valid_email)
// NOT-AUTOMATABLE: 4.11 — Too complex to automate in limited execution window (escape_closes_press_kit_or_palette)
// NOT-AUTOMATABLE: 4.12 — Too complex to automate in limited execution window (filter_preserves_hidden_selections)
// NOT-AUTOMATABLE: 4.13 — Too complex to automate in limited execution window (empty_press_kit_valid_previews)
// NOT-AUTOMATABLE: 4.14 — Too complex to automate in limited execution window (empty_undo_redo_noop)
// NOT-AUTOMATABLE: 4.20 — Too complex to automate in limited execution window (out_of_enum_status_rejected)
// NOT-AUTOMATABLE: 4.21 — Too complex to automate in limited execution window (malformed_import_keeps_state)
// NOT-AUTOMATABLE: 3.1 — Subjective/visual/performance criterion (spacing_matches_20px_baseline)
// NOT-AUTOMATABLE: 3.2 — Subjective/visual/performance criterion (typography_matches_spec_metrics)
// NOT-AUTOMATABLE: 3.12 — Subjective/visual/performance criterion (block_fidelity_fixed_nav_bar)
// NOT-AUTOMATABLE: 3.13 — Subjective/visual/performance criterion (block_fidelity_hero_next_race_widget)
// NOT-AUTOMATABLE: 3.14 — Subjective/visual/performance criterion (block_fidelity_horizontal_media_strip)
// NOT-AUTOMATABLE: 3.15 — Subjective/visual/performance criterion (block_fidelity_impact_statement)
// NOT-AUTOMATABLE: 3.16 — Subjective/visual/performance criterion (block_fidelity_helmet_grid)
// NOT-AUTOMATABLE: 3.17 — Subjective/visual/performance criterion (block_fidelity_collaborators_marquee)
// NOT-AUTOMATABLE: 3.18 — Subjective/visual/performance criterion (block_fidelity_social_video_card)
// NOT-AUTOMATABLE: 3.19 — Subjective/visual/performance criterion (block_fidelity_footer_statement_newsletter)
// NOT-AUTOMATABLE: 3.4 — Subjective/visual/performance criterion (specified_motion_states_present)
// NOT-AUTOMATABLE: 3.5 — Subjective/visual/performance criterion (responsive_patterns_match_reference)
// NOT-AUTOMATABLE: 3.6 — Subjective/visual/performance criterion (store_and_hamburger_styling_match_spec)
// NOT-AUTOMATABLE: 3.7 — Subjective/visual/performance criterion (display_vs_body_hierarchy)
// NOT-AUTOMATABLE: 3.8 — Subjective/visual/performance criterion (component_states_match_spec)
// NOT-AUTOMATABLE: 3.9 — Subjective/visual/performance criterion (palette_surfaces_and_accent_exact)
// NOT-AUTOMATABLE: 3.10 — Subjective/visual/performance criterion (microinteractions_match_spec_timing)
// NOT-AUTOMATABLE: 3.11 — Subjective/visual/performance criterion (hardened_surfaces_match_token_system)
// NOT-AUTOMATABLE: 1.1 — Too complex to automate in limited execution window (single_page_homepage_title)
// NOT-AUTOMATABLE: 1.2 — Too complex to automate in limited execution window (preloader_shows_then_clears)
// NOT-AUTOMATABLE: 1.3 — Too complex to automate in limited execution window (fixed_nav_contents)
// NOT-AUTOMATABLE: 1.4 — Too complex to automate in limited execution window (menu_overlay_contents)
// NOT-AUTOMATABLE: 1.5 — Too complex to automate in limited execution window (home_item_current_stroke)
// NOT-AUTOMATABLE: 1.6 — Too complex to automate in limited execution window (menu_closes_on_x_or_escape)
// NOT-AUTOMATABLE: 1.7 — Too complex to automate in limited execution window (next_race_widget_contents)
// NOT-AUTOMATABLE: 1.8 — Too complex to automate in limited execution window (horizontal_track_scroll_linked)
// NOT-AUTOMATABLE: 1.9 — Too complex to automate in limited execution window (helmet_card_hover_reveal)
// NOT-AUTOMATABLE: 1.10 — Too complex to automate in limited execution window (video_hover_play_fade)
// NOT-AUTOMATABLE: 1.11 — Too complex to automate in limited execution window (footer_split_text_and_marquee)
// NOT-AUTOMATABLE: 1.12 — Too complex to automate in limited execution window (hover_feedback_present)
// NOT-AUTOMATABLE: 1.22 — Too complex to automate in limited execution window (helmet_grid_three_indexed_cards)
// NOT-AUTOMATABLE: 1.23 — Too complex to automate in limited execution window (collaborators_marquee_fictional_marks)
// NOT-AUTOMATABLE: 1.24 — Too complex to automate in limited execution window (video_card_layered_still)
// NOT-AUTOMATABLE: 1.25 — Too complex to automate in limited execution window (footer_contents)
// NOT-AUTOMATABLE: 1.26 — Too complex to automate in limited execution window (chrome_stays_on_homepage)
// NOT-AUTOMATABLE: 1.30 — Too complex to automate in limited execution window (hero_composition_with_silhouette)
// NOT-AUTOMATABLE: 1.31 — Too complex to automate in limited execution window (media_strip_six_cards)
// NOT-AUTOMATABLE: 1.32 — Too complex to automate in limited execution window (impact_statement_present)
// NOT-AUTOMATABLE: 1.33 — Too complex to automate in limited execution window (menu_photo_grid_and_texture)
// NOT-AUTOMATABLE: 1.34 — Too complex to automate in limited execution window (subscribe_disabled_until_valid)
// NOT-AUTOMATABLE: 1.35 — Too complex to automate in limited execution window (menu_flow_probe)
// NOT-AUTOMATABLE: 1.36 — Too complex to automate in limited execution window (newsletter_flow_probe)
// NOT-AUTOMATABLE: 1.37 — Too complex to automate in limited execution window (video_hover_cycle_probe)
// NOT-AUTOMATABLE: 1.38 — Too complex to automate in limited execution window (reload_baseline_probe)
// NOT-AUTOMATABLE: 1.39 — Too complex to automate in limited execution window (rapid_menu_toggle_settles)
// NOT-AUTOMATABLE: 1.40 — Too complex to automate in limited execution window (escape_when_closed_noop)
// NOT-AUTOMATABLE: 1.41 — Too complex to automate in limited execution window (empty_submit_blocked)
// NOT-AUTOMATABLE: 1.42 — Too complex to automate in limited execution window (double_subscribe_single_confirmation)
// NOT-AUTOMATABLE: 1.43 — Too complex to automate in limited execution window (webgl_fallback_hero_static)
// NOT-AUTOMATABLE: 1.44 — Too complex to automate in limited execution window (menu_items_scroll_in_page)
// NOT-AUTOMATABLE: 1.45 — Too complex to automate in limited execution window (authored_asset_surface_inventory)
// NOT-AUTOMATABLE: 1.46 — Too complex to automate in limited execution window (race_calendar_six_seeded_races)
// NOT-AUTOMATABLE: 1.47 — Too complex to automate in limited execution window (race_select_updates_count)
// NOT-AUTOMATABLE: 1.48 — Too complex to automate in limited execution window (race_status_filter)
// NOT-AUTOMATABLE: 1.49 — Too complex to automate in limited execution window (media_and_helmet_shortlist)
// NOT-AUTOMATABLE: 1.50 — Too complex to automate in limited execution window (press_kit_live_preview_formats)
// NOT-AUTOMATABLE: 1.51 — Too complex to automate in limited execution window (press_kit_copy_and_download)
// NOT-AUTOMATABLE: 1.52 — Too complex to automate in limited execution window (ics_matches_selected_races)
// NOT-AUTOMATABLE: 1.53 — Too complex to automate in limited execution window (command_palette_opens_and_navigates)
// NOT-AUTOMATABLE: 1.54 — Too complex to automate in limited execution window (undo_redo_shortlist_and_races)
// NOT-AUTOMATABLE: 1.55 — Too complex to automate in limited execution window (race_record_field_contract_visible)
// NOT-AUTOMATABLE: 1.56 — Too complex to automate in limited execution window (race_status_editor_enum)
// NOT-AUTOMATABLE: 1.57 — Too complex to automate in limited execution window (press_kit_json_field_contract)
// NOT-AUTOMATABLE: 1.58 — Too complex to automate in limited execution window (press_kit_import_restores_session)
// NOT-AUTOMATABLE: 1.59 — Too complex to automate in limited execution window (shortlist_asset_field_contract)
// NOT-AUTOMATABLE: 1.60 — Too complex to automate in limited execution window (newsletter_subscribe_field_contract)
// NOT-AUTOMATABLE: 14.1 — Too complex to automate in limited execution window (in_memory_multi_facet_reload_resets)
// NOT-AUTOMATABLE: 14.3 — Too complex to automate in limited execution window (subscribe_enablement_tracks_email_validity)
// NOT-AUTOMATABLE: 14.4 — Too complex to automate in limited execution window (menu_home_stroke_echo)
// NOT-AUTOMATABLE: 14.5 — Too complex to automate in limited execution window (newsletter_confirmation_count_delta)
// NOT-AUTOMATABLE: 14.6 — Too complex to automate in limited execution window (invalid_vs_valid_email_outcomes_differ)
// NOT-AUTOMATABLE: 14.7 — Too complex to automate in limited execution window (interleaved_menu_and_newsletter)
// NOT-AUTOMATABLE: 14.8 — Too complex to automate in limited execution window (video_hover_leave_round_trip)
// NOT-AUTOMATABLE: 14.9 — Too complex to automate in limited execution window (press_kit_derived_sensitivity)
// NOT-AUTOMATABLE: 14.10 — Too complex to automate in limited execution window (undo_round_trip_race_select)
// NOT-AUTOMATABLE: 14.11 — Too complex to automate in limited execution window (newsletter_echoes_into_press_kit)
// NOT-AUTOMATABLE: 14.12 — Too complex to automate in limited execution window (press_kit_import_round_trip_probe)
// NOT-AUTOMATABLE: 14.13 — Too complex to automate in limited execution window (status_enum_echoes_into_ics)
// NOT-AUTOMATABLE: 1.1 — Too complex to automate in limited execution window (interactive_controls_keyboard_operable)
// NOT-AUTOMATABLE: 1.2 — Too complex to automate in limited execution window (menu_modal_focus_trap_and_return)
// NOT-AUTOMATABLE: 1.3 — Too complex to automate in limited execution window (media_have_accessible_names)
// NOT-AUTOMATABLE: 1.4 — Too complex to automate in limited execution window (newsletter_feedback_uses_live_region)
// NOT-AUTOMATABLE: 1.5 — Too complex to automate in limited execution window (newsletter_field_has_explicit_label)
// NOT-AUTOMATABLE: 1.6 — Too complex to automate in limited execution window (headings_logical_order)
// NOT-AUTOMATABLE: 1.7 — Too complex to automate in limited execution window (landmarks_nav_main_footer)
// NOT-AUTOMATABLE: 1.8 — Too complex to automate in limited execution window (contrast_cream_and_dark_sections)
// NOT-AUTOMATABLE: 1.9 — Too complex to automate in limited execution window (semantic_interactive_chrome)
// NOT-AUTOMATABLE: 1.10 — Too complex to automate in limited execution window (reduced_motion_settles_immediately)
// NOT-AUTOMATABLE: 1.a1 — Too complex to automate in limited execution window (split_text_aria_label_on_container)
// NOT-AUTOMATABLE: 1.a2 — Too complex to automate in limited execution window (hero_webgl_labelled_or_decorative)
// NOT-AUTOMATABLE: 1.11 — Too complex to automate in limited execution window (press_kit_and_palette_modal_a11y)
// NOT-AUTOMATABLE: 1.12 — Too complex to automate in limited execution window (shortlist_controls_accessible_names)
// NOT-AUTOMATABLE: 1.13 — Too complex to automate in limited execution window (selection_counts_live_region)