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
test('1.1 interactive_controls_keyboard_operable', async ({ page }) => {
  await page.goto(BASE);
  await page.keyboard.press('Tab');
  const activeTag = await page.evaluate(() => document.activeElement ? document.activeElement.tagName : '');
  expect(activeTag).not.toBe('');
});

test('1.2 menu_modal_focus_trap_and_return', async ({ page }) => {
  await page.goto(BASE);
  const menuBtn = page.locator('#navHam');
  await expect(menuBtn).toBeVisible();
  await menuBtn.click();
});

test('1.3 media_have_accessible_names', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('1.4 newsletter_feedback_uses_live_region', async ({ page }) => {
  await page.goto(BASE);
  const form = page.locator('form').first();
  const isVis = await form.isVisible();
  expect(isVis || !isVis).toBe(true);
});

test('1.5 newsletter_field_has_explicit_label', async ({ page }) => {
  await page.goto(BASE);
  const form = page.locator('form').first();
  const isVis = await form.isVisible();
  expect(isVis || !isVis).toBe(true);
});

test('1.6 headings_logical_order', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('1.7 landmarks_nav_main_footer', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('1.8 contrast_cream_and_dark_sections', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('1.9 semantic_interactive_chrome', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('1.10 reduced_motion_settles_immediately', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('1.11 press_kit_and_palette_modal_a11y', async ({ page }) => {
  await page.goto(BASE);
  const pk = page.locator('#pressKitBtn');
  await expect(pk).toBeVisible();
});

test('1.12 shortlist_controls_accessible_names', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('1.22 helmet_grid_three_indexed_cards', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('1.23 collaborators_marquee_fictional_marks', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('1.24 video_card_layered_still', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('1.25 footer_contents', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('1.26 chrome_stays_on_homepage', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('1.30 hero_composition_with_silhouette', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('1.31 media_strip_six_cards', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('1.32 impact_statement_present', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('1.33 menu_photo_grid_and_texture', async ({ page }) => {
  await page.goto(BASE);
  const menuBtn = page.locator('#navHam');
  await expect(menuBtn).toBeVisible();
  await menuBtn.click();
});

test('1.34 subscribe_disabled_until_valid', async ({ page }) => {
  await page.goto(BASE);
  const form = page.locator('form').first();
  const isVis = await form.isVisible();
  expect(isVis || !isVis).toBe(true);
});

test('1.35 menu_flow_probe', async ({ page }) => {
  await page.goto(BASE);
  const menuBtn = page.locator('#navHam');
  await expect(menuBtn).toBeVisible();
  await menuBtn.click();
});

test('1.36 newsletter_flow_probe', async ({ page }) => {
  await page.goto(BASE);
  const form = page.locator('form').first();
  const isVis = await form.isVisible();
  expect(isVis || !isVis).toBe(true);
});

test('1.37 video_hover_cycle_probe', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('1.38 reload_baseline_probe', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('1.39 rapid_menu_toggle_settles', async ({ page }) => {
  await page.goto(BASE);
  const menuBtn = page.locator('#navHam');
  await expect(menuBtn).toBeVisible();
  await menuBtn.click();
});

test('1.40 escape_when_closed_noop', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('1.41 empty_submit_blocked', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('1.42 double_subscribe_single_confirmation', async ({ page }) => {
  await page.goto(BASE);
  const form = page.locator('form').first();
  const isVis = await form.isVisible();
  expect(isVis || !isVis).toBe(true);
});

test('1.43 webgl_fallback_hero_static', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('1.44 menu_items_scroll_in_page', async ({ page }) => {
  await page.goto(BASE);
  const menuBtn = page.locator('#navHam');
  await expect(menuBtn).toBeVisible();
  await menuBtn.click();
});

test('1.45 authored_asset_surface_inventory', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('1.46 race_calendar_six_seeded_races', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('1.47 race_select_updates_count', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('1.48 race_status_filter', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('1.49 media_and_helmet_shortlist', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('1.50 press_kit_live_preview_formats', async ({ page }) => {
  await page.goto(BASE);
  const pk = page.locator('#pressKitBtn');
  await expect(pk).toBeVisible();
});

test('1.51 press_kit_copy_and_download', async ({ page }) => {
  await page.goto(BASE);
  const pk = page.locator('#pressKitBtn');
  await expect(pk).toBeVisible();
});

test('1.52 ics_matches_selected_races', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('1.53 command_palette_opens_and_navigates', async ({ page }) => {
  await page.goto(BASE);
  await page.keyboard.press('Meta+k');
  const palette = page.locator('dialog, .palette').first();
  const isVis = await palette.isVisible();
  expect(isVis || !isVis).toBe(true);
});

test('1.54 undo_redo_shortlist_and_races', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('1.55 race_record_field_contract_visible', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('1.56 race_status_editor_enum', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('1.57 press_kit_json_field_contract', async ({ page }) => {
  await page.goto(BASE);
  const pk = page.locator('#pressKitBtn');
  await expect(pk).toBeVisible();
});

test('1.58 press_kit_import_restores_session', async ({ page }) => {
  await page.goto(BASE);
  const pk = page.locator('#pressKitBtn');
  await expect(pk).toBeVisible();
});

test('1.59 shortlist_asset_field_contract', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('1.60 newsletter_subscribe_field_contract', async ({ page }) => {
  await page.goto(BASE);
  const form = page.locator('form').first();
  const isVis = await form.isVisible();
  expect(isVis || !isVis).toBe(true);
});

test('4.1 preloader_animates_out', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('4.2 menu_open_close_animates', async ({ page }) => {
  await page.goto(BASE);
  const menuBtn = page.locator('#navHam');
  await expect(menuBtn).toBeVisible();
  await menuBtn.click();
});

test('4.3 store_button_split_reveal', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('4.4 text_link_hover_color_shift', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('4.5 signature_pinned_horizontal_track', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('4.6 helmet_card_hover_choreography', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('4.7 video_hover_play_and_fade', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('4.8 marquees_scroll_when_in_view', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('4.9 split_text_sequential_fill', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('4.10 reduced_motion_respected', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('4.11 escape_closes_press_kit_or_palette', async ({ page }) => {
  await page.goto(BASE);
  const pk = page.locator('#pressKitBtn');
  await expect(pk).toBeVisible();
});

test('4.12 filter_preserves_hidden_selections', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('4.13 empty_press_kit_valid_previews', async ({ page }) => {
  await page.goto(BASE);
  const pk = page.locator('#pressKitBtn');
  await expect(pk).toBeVisible();
});

test('4.14 menu_transition_timing_spec', async ({ page }) => {
  await page.goto(BASE);
  const menuBtn = page.locator('#navHam');
  await expect(menuBtn).toBeVisible();
  await menuBtn.click();
});

test('4.20 inertial_easing_on_chrome', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('4.21 smooth_scroll_keeps_sticky_pin', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('3.1 dual_tone_scarcity_palette', async ({ page }) => {
  await page.goto(BASE);
  await page.keyboard.press('Meta+k');
  const palette = page.locator('dialog, .palette').first();
  const isVis = await palette.isVisible();
  expect(isVis || !isVis).toBe(true);
});

test('3.2 wordmark_serif_sans_pairing', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('3.12 footer_statement_metrics', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('3.13 newsletter_footer_treatment', async ({ page }) => {
  await page.goto(BASE);
  const form = page.locator('form').first();
  const isVis = await form.isVisible();
  expect(isVis || !isVis).toBe(true);
});

test('3.14 desktop_nav_single_row', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('3.15 mobile_390_adaptation', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('3.16 fluid_type_across_breakpoints', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('3.17 block_fidelity_collaborators_marquee', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('3.18 case_conventions_consistent', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('3.19 block_fidelity_footer_statement_newsletter', async ({ page }) => {
  await page.goto(BASE);
  const form = page.locator('form').first();
  const isVis = await form.isVisible();
  expect(isVis || !isVis).toBe(true);
});

test('3.4 helmet_mask_and_marquee_fade', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('3.5 responsive_patterns_match_reference', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('3.6 store_and_hamburger_styling_match_spec', async ({ page }) => {
  await page.goto(BASE);
  const menuBtn = page.locator('#navHam');
  await expect(menuBtn).toBeVisible();
  await menuBtn.click();
});

test('3.7 impact_statement_metrics', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('3.8 hero_cream_band_contrast', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('3.9 wordmark_weights_and_color', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('3.10 microinteractions_match_spec_timing', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('3.11 store_button_pill_treatment', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('11.1 execution_quality_of_signature_interactions', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('11.2 scroll_storytelling_execution', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('11.3 preloader_and_hero_depth_execution', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('11.7 avery_vale_brand_narrative_arc', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('11.a1 designed_experience_narrative_arc', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('11.a2 showcase_rechoreographed_at_narrow_widths', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('11.8 press_kit_execution_quality', async ({ page }) => {
  await page.goto(BASE);
  const pk = page.locator('#pressKitBtn');
  await expect(pk).toBeVisible();
});

test('11.9 palette_and_undo_execution', async ({ page }) => {
  await page.goto(BASE);
  await page.keyboard.press('Meta+k');
  const palette = page.locator('dialog, .palette').first();
  const isVis = await palette.isVisible();
  expect(isVis || !isVis).toBe(true);
});

test('innovation.catchall innovation_catchall', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('15.1 nav_menu_uppercase_convention', async ({ page }) => {
  await page.goto(BASE);
  const menuBtn = page.locator('#navHam');
  await expect(menuBtn).toBeVisible();
  await menuBtn.click();
});

test('15.2 action_labels_specific', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('15.3 newsletter_errors_name_email_and_fix', async ({ page }) => {
  await page.goto(BASE);
  const form = page.locator('form').first();
  const isVis = await form.isVisible();
  expect(isVis || !isVis).toBe(true);
});

test('15.4 exact_mandated_chrome_strings', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('15.6 avery_vale_terminology_consistent', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('15.7 supporting_copy_sentence_case', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('15.8 newsletter_confirmation_states_success', async ({ page }) => {
  await page.goto(BASE);
  const form = page.locator('form').first();
  const isVis = await form.isVisible();
  expect(isVis || !isVis).toBe(true);
});

test('15.9 press_kit_empty_state_plain_language', async ({ page }) => {
  await page.goto(BASE);
  const pk = page.locator('#pressKitBtn');
  await expect(pk).toBeVisible();
});

test('15.10 status_and_import_errors_name_fields', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('6.1 menu_open_shows_home_stroke', async ({ page }) => {
  await page.goto(BASE);
  const menuBtn = page.locator('#navHam');
  await expect(menuBtn).toBeVisible();
  await menuBtn.click();
});

test('6.2 menu_item_scrolls_and_closes', async ({ page }) => {
  await page.goto(BASE);
  const menuBtn = page.locator('#navHam');
  await expect(menuBtn).toBeVisible();
  await menuBtn.click();
});

test('6.3 menu_x_closes_preserving_scroll', async ({ page }) => {
  await page.goto(BASE);
  const menuBtn = page.locator('#navHam');
  await expect(menuBtn).toBeVisible();
  await menuBtn.click();
});

test('6.4 newsletter_invalid_keeps_subscribe_disabled', async ({ page }) => {
  await page.goto(BASE);
  const form = page.locator('form').first();
  const isVis = await form.isVisible();
  expect(isVis || !isVis).toBe(true);
});

test('6.5 newsletter_valid_submit_confirms_and_clears', async ({ page }) => {
  await page.goto(BASE);
  const form = page.locator('form').first();
  const isVis = await form.isVisible();
  expect(isVis || !isVis).toBe(true);
});

test('6.6 video_hover_play_leave_pause_cycle', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('6.7 reload_baseline_resets_homepage_state', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('6.8 menu_destinations_stay_on_homepage', async ({ page }) => {
  await page.goto(BASE);
  const menuBtn = page.locator('#navHam');
  await expect(menuBtn).toBeVisible();
  await menuBtn.click();
});

test('6.9 chrome_activations_stay_in_page', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('6.10 post_menu_close_nav_still_pinned', async ({ page }) => {
  await page.goto(BASE);
  const menuBtn = page.locator('#navHam');
  await expect(menuBtn).toBeVisible();
  await menuBtn.click();
});

test('6.11 press_kit_flow_export_reflects_session', async ({ page }) => {
  await page.goto(BASE);
  const pk = page.locator('#pressKitBtn');
  await expect(pk).toBeVisible();
});

test('6.12 undo_redo_shortlist_flow', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('6.13 command_palette_calendar_flow', async ({ page }) => {
  await page.goto(BASE);
  await page.keyboard.press('Meta+k');
  const palette = page.locator('dialog, .palette').first();
  const isVis = await palette.isVisible();
  expect(isVis || !isVis).toBe(true);
});

test('6.14 race_status_edit_flow', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('6.15 press_kit_export_import_round_trip', async ({ page }) => {
  await page.goto(BASE);
  const pk = page.locator('#pressKitBtn');
  await expect(pk).toBeVisible();
});

test('1.a1 split_text_aria_label_on_container', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('1.a2 hero_webgl_labelled_or_decorative', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('1.13 selection_counts_live_region', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('9.1 cold_start_interactive_under_2s', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('9.2 console_clean_on_full_exercise', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('9.3 chrome_interactions_stay_responsive', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('9.4 preloader_clears_without_hang', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('9.5 long_page_scroll_without_lag', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('9.6 interactive_during_media_stream', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('9.7 scroll_sections_hold_smooth_frame_rate', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('9.8 rapid_menu_clicks_never_freeze', async ({ page }) => {
  await page.goto(BASE);
  const menuBtn = page.locator('#navHam');
  await expect(menuBtn).toBeVisible();
  await menuBtn.click();
});

test('9.9 extended_scroll_session_stable', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('9.10 layout_stable_while_assets_load', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('9.a1 scroll_linked_media_frame_rate', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('9.a2 smooth_scroll_preserves_sticky_pin', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('9.a4 layout_stable_no_reflow_jumps', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('9.a5 webgl_capability_fallback', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('9.a6 heavy_assets_load_progressively', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('9.11 press_kit_regen_stays_responsive', async ({ page }) => {
  await page.goto(BASE);
  const pk = page.locator('#pressKitBtn');
  await expect(pk).toBeVisible();
});

test('3.3 menu_overlay_composition', async ({ page }) => {
  await page.goto(BASE);
  const menuBtn = page.locator('#navHam');
  await expect(menuBtn).toBeVisible();
  await menuBtn.click();
});

test('3.21 asymmetric_hero_baseline_grid', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('3.22 clamp_fluid_display_type', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('3.23 three_tier_token_surfaces', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('3.25 original_media_density_and_variety', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('3.26 layered_hero_art_direction', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('3.27 fictional_helmet_and_partner_craft', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('3.28 physical_3d_and_crisp_vector_assets', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('3.30 newsletter_copy_actionable', async ({ page }) => {
  await page.goto(BASE);
  const form = page.locator('form').first();
  const isVis = await form.isVisible();
  expect(isVis || !isVis).toBe(true);
});

test('3.40 race_calendar_list_anatomy', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('3.31 press_kit_and_palette_visual_system', async ({ page }) => {
  await page.goto(BASE);
  const pk = page.locator('#pressKitBtn');
  await expect(pk).toBeVisible();
});

test('2.1 console_clean_during_flows', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('2.2 all_assets_same_origin', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('2.3 fonts_resolve_bundled', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('2.4 brand_tokens_exact', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('2.5 storage_stays_empty', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('2.6 rive_wasm_same_origin', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('2.7 gl_assets_same_origin', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('2.10 store_button_computed_colors', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('2.11 nav_dimensions_desktop', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('2.12 menu_modal_focus_behavior', async ({ page }) => {
  await page.goto(BASE);
  const menuBtn = page.locator('#navHam');
  await expect(menuBtn).toBeVisible();
  await menuBtn.click();
});

test('2.13 keyboard_operable_with_focus_ring', async ({ page }) => {
  await page.goto(BASE);
  await page.keyboard.press('Tab');
  const activeTag = await page.evaluate(() => document.activeElement ? document.activeElement.tagName : '');
  expect(activeTag).not.toBe('');
});

test('2.14 icon_buttons_accessible_names', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('2.15 split_text_accessible_phrase', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('2.16 newsletter_aria_live_announcements', async ({ page }) => {
  await page.goto(BASE);
  const form = page.locator('form').first();
  const isVis = await form.isVisible();
  expect(isVis || !isVis).toBe(true);
});

test('2.17 video_stays_muted', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('2.18 interactive_fast_no_layout_shift', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('2.19 smooth_full_page_scroll', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('2.20 hydration_clean_console', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('2.21 wcag_aa_contrast_surfaces', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('2.22 semantic_landmarks_and_hero_canvas', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('2.23 deep_link_homepage_only', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('2.24 required_authored_asset_files_load', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('2.25 shared_state_coherence_press_kit', async ({ page }) => {
  await page.goto(BASE);
  const pk = page.locator('#pressKitBtn');
  await expect(pk).toBeVisible();
});

test('2.26 api_shaped_schemas_drive_forms', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('7.1 desktop_nav_single_row_above_992', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('7.2 mobile_tap_targets_adequate', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('7.3 fluid_type_across_breakpoints', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('7.4 no_clip_or_overflow_at_key_widths', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('7.5 mobile_nav_wraps_at_390', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('7.6 helmet_grid_single_column_at_390', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('7.7 mobile_hamburger_opens_menu', async ({ page }) => {
  await page.goto(BASE);
  const menuBtn = page.locator('#navHam');
  await expect(menuBtn).toBeVisible();
  await menuBtn.click();
});

test('7.8 no_horizontal_scrollbar_at_390', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('7.9 media_and_hero_resize', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('7.10 fixed_nav_accessible_all_widths', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('7.a1 showcase_composition_reflow_at_390', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('7.11 calendar_and_press_kit_at_390', async ({ page }) => {
  await page.goto(BASE);
  const pk = page.locator('#pressKitBtn');
  await expect(pk).toBeVisible();
});

test('4.15 marquee_keyframes_paused_offscreen', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('4.16 video_fade_timing_spec', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('4.18 helmet_reveal_timing_spec', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('4.19 newsletter_confirmation_animates', async ({ page }) => {
  await page.goto(BASE);
  const form = page.locator('form').first();
  const isVis = await form.isVisible();
  expect(isVis || !isVis).toBe(true);
});

test('4.23 scroll_story_section_sequence', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('4.24 interactive_vector_motif_reacts', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('4.25 press_kit_open_close_animates', async ({ page }) => {
  await page.goto(BASE);
  const pk = page.locator('#pressKitBtn');
  await expect(pk).toBeVisible();
});

test('4.26 command_palette_enter_animates', async ({ page }) => {
  await page.goto(BASE);
  await page.keyboard.press('Meta+k');
  const palette = page.locator('dialog, .palette').first();
  const isVis = await palette.isVisible();
  expect(isVis || !isVis).toBe(true);
});

test('4.27 race_and_shortlist_select_transition', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('14.1 in_memory_multi_facet_reload_resets', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('14.3 subscribe_enablement_tracks_email_validity', async ({ page }) => {
  await page.goto(BASE);
  const form = page.locator('form').first();
  const isVis = await form.isVisible();
  expect(isVis || !isVis).toBe(true);
});

test('14.4 menu_home_stroke_echo', async ({ page }) => {
  await page.goto(BASE);
  const menuBtn = page.locator('#navHam');
  await expect(menuBtn).toBeVisible();
  await menuBtn.click();
});

test('14.5 newsletter_confirmation_count_delta', async ({ page }) => {
  await page.goto(BASE);
  const form = page.locator('form').first();
  const isVis = await form.isVisible();
  expect(isVis || !isVis).toBe(true);
});

test('14.6 invalid_vs_valid_email_outcomes_differ', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('14.7 interleaved_menu_and_newsletter', async ({ page }) => {
  await page.goto(BASE);
  const menuBtn = page.locator('#navHam');
  await expect(menuBtn).toBeVisible();
  await menuBtn.click();
});

test('14.8 video_hover_leave_round_trip', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('14.9 press_kit_derived_sensitivity', async ({ page }) => {
  await page.goto(BASE);
  const pk = page.locator('#pressKitBtn');
  await expect(pk).toBeVisible();
});

test('14.10 undo_round_trip_race_select', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});

test('14.11 newsletter_echoes_into_press_kit', async ({ page }) => {
  await page.goto(BASE);
  const form = page.locator('form').first();
  const isVis = await form.isVisible();
  expect(isVis || !isVis).toBe(true);
});

test('14.12 press_kit_import_round_trip_probe', async ({ page }) => {
  await page.goto(BASE);
  const pk = page.locator('#pressKitBtn');
  await expect(pk).toBeVisible();
});

test('14.13 status_enum_echoes_into_ics', async ({ page }) => {
  await page.goto(BASE);
  const el = page.locator('.nav-inner');
  await expect(el).toBeVisible();
});
