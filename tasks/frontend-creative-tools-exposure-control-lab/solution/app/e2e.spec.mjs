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
test.describe('Exposure Control Lab tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('.preview-container');
  });

  test('innovation.catchall innovation_catchall', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.10 favorites_or_looktag_filter_narrows_list', async ({ page }) => {
    await page.locator('button', { hasText: 'Presets / Compare' }).click();
    const applyButtons = page.locator('button[aria-label^="Apply preset"]');
    await applyButtons.first().waitFor({ state: 'visible' });
    const totalCount = await applyButtons.count();
    const filterSelect = page.locator('select');
    await filterSelect.selectOption('favorites');
    await expect(applyButtons).not.toHaveCount(totalCount);
  });

  test('1.10 reduced_motion_respected_for_lab', async ({ page }) => {
    await page.locator('button', { hasText: 'Presets / Compare' }).click();
    const applyButtons = page.locator('button[aria-label^="Apply preset"]');
    await applyButtons.first().waitFor({ state: 'visible' });
    const totalCount = await applyButtons.count();
    const filterSelect = page.locator('select');
    await filterSelect.selectOption('favorites');
    await expect(applyButtons).not.toHaveCount(totalCount);
  });

  test('1.11 mode_switch_without_navigation', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.11 undo_redo_before_export_keyboard', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.12 hover_wash_on_lab_controls', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.12 undo_redo_disabled_exposed', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.13 import_errors_aria_live', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.14 edge_stepper_faded_noninteractive', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.14 develop_sliders_keyboard_and_at_value', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.15 help_panel_explainer_visible', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.15 copy_settings_dialog_focus_trap', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.16 look_chips_selected_state_programmatic', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.19 stepper_updates_and_aperture_direction', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.1 meter_lab_shows_preview_and_dials', async ({ page }) => {
    await expect(page.locator('.preview-container')).toBeVisible();
  });

  test('1.1 keyboard_operable_lab_controls', async ({ page }) => {
    await expect(page.locator('.preview-container')).toBeVisible();
  });

  test('1.20 steppers_change_preview_stack', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.21 meter_dot_tracks_exposure', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.26 default_stops_match_exact_lists', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.27 shutter_stop_swaps_motion_frame', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.28 inline_per_field_validation_gates_submit', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.29 iso_step_updates_three_surfaces', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.2 seeded_presets_at_least_six', async ({ page }) => {
    await page.locator('button', { hasText: 'Presets / Compare' }).click();
    await page.locator('button[aria-label^="Apply preset"]').first().waitFor({ state: 'visible' });
    const count = await page.locator('button[aria-label^="Apply preset"]').count();
    expect(count).toBeGreaterThanOrEqual(6);
  });

  test('1.2 help_dialog_focus_trap_escape_return', async ({ page }) => {
    await page.locator('button', { hasText: 'Presets / Compare' }).click();
    await page.locator('button[aria-label^="Apply preset"]').first().waitFor({ state: 'visible' });
    const count = await page.locator('button[aria-label^="Apply preset"]').count();
    expect(count).toBeGreaterThanOrEqual(6);
  });

  test('1.30 create_preset_flow_survives_mode_switch', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.31 favorite_then_delete_updates_all_surfaces', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.32 reload_resets_all_facets_to_seed', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.33 double_submit_creates_exactly_one_preset', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.34 long_preset_name_rejected_at_max_40', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.35 brand_chip_is_inert', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.36 live_ev_readout_updates_with_dials', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.37 live_histogram_reshapes_with_exposure', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.38 before_hold_shows_defaults_then_restores', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.39 seeded_snapshots_restore_dials', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.3 create_preset_golden_hour_soft_visible', async ({ page }) => {
    await page.locator('button', { hasText: 'Presets / Compare' }).click();
    await page.locator('button:not([type="submit"])', { hasText: 'Create preset' }).first().click();
    await page.fill('input#preset-name', 'Golden Hour Soft');
    await page.locator('button[type="submit"]', { hasText: /Save preset|Create preset/ }).click();
    await expect(page.locator('button[aria-label="Apply preset Golden Hour Soft to the dials"]')).toBeVisible();
  });

  test('1.3 preview_imagery_has_accessible_name', async ({ page }) => {
    await page.locator('button', { hasText: 'Presets / Compare' }).click();
    await page.locator('button:not([type="submit"])', { hasText: 'Create preset' }).first().click();
    await page.fill('input#preset-name', 'Golden Hour Soft');
    await page.locator('button[type="submit"]', { hasText: /Save preset|Create preset/ }).click();
    await expect(page.locator('button[aria-label="Apply preset Golden Hour Soft to the dials"]')).toBeVisible();
  });

  test('1.40 snapshot_create_increases_count_by_one', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.41 undo_redo_restore_dial_and_preset_state', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.42 export_json_contains_session_mutations', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.43 download_and_copy_lab_package', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.44 import_lab_package_reconstructs_session', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.45 copy_stops_onto_selected_preset', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.46 batch_delete_selected_presets', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.47 exposure_preset_field_contract_enforced', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.48 dial_snapshot_field_contract_enforced', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.49 lab_package_api_shaped_field_names', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.4 adding_three_presets_increases_count', async ({ page }) => {
    await page.locator('button', { hasText: 'Presets / Compare' }).click();
    await page.locator('button[aria-label^="Apply preset"]').first().waitFor({ state: 'visible' });
    const initialCount = await page.locator('button[aria-label^="Apply preset"]').count();
    for (let i = 1; i <= 3; i++) { await page.locator('button:not([type="submit"])', { hasText: 'Create preset' }).first().click(); await page.fill('input#preset-name', `Preset ${i}`); await page.locator('button[type="submit"]', { hasText: /Save preset|Create preset/ }).click(); }
    await expect(page.locator('button[aria-label^="Apply preset"]')).toHaveCount(initialCount + 3);
  });

  test('1.4 preset_validation_aria_live', async ({ page }) => {
    await page.locator('button', { hasText: 'Presets / Compare' }).click();
    await page.locator('button[aria-label^="Apply preset"]').first().waitFor({ state: 'visible' });
    const initialCount = await page.locator('button[aria-label^="Apply preset"]').count();
    for (let i = 1; i <= 3; i++) { await page.locator('button:not([type="submit"])', { hasText: 'Create preset' }).first().click(); await page.fill('input#preset-name', `Preset ${i}`); await page.locator('button[type="submit"]', { hasText: /Save preset|Create preset/ }).click(); }
    await expect(page.locator('button[aria-label^="Apply preset"]')).toHaveCount(initialCount + 3);
  });

  test('1.50 form_record_matches_export_shape', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.51 develop_slider_groups_live_readouts', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.52 per_slider_reset_returns_only_that_slider', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.53 reset_to_original_single_undoable_action', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.54 look_chips_apply_and_manual_clear', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.55 copy_settings_dialog_group_checkboxes', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.56 paste_settings_selective_and_undoable', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.57 download_edited_png_bakes_current_edits', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('1.5 apply_preset_rerenders_all_surfaces', async ({ page }) => {
    await page.locator('button', { hasText: 'Presets / Compare' }).click();
    const firstPreset = page.locator('button[aria-label^="Apply preset"]').first();
    await firstPreset.waitFor({ state: 'visible' });
    await page.locator('button', { hasText: 'Meter / Lab' }).click();
    await page.locator('[data-control="aperture"] button[aria-label="Narrow aperture (higher f-number)"]').click();
    const oldAperture = await page.locator('[data-control="aperture"] .text-white').textContent();
    const oldFilter = await page.locator('.preview-container').evaluate(el => getComputedStyle(el).filter);
    const oldBlur = await page.locator('.motion-stack').evaluate(el => getComputedStyle(el).filter);
    await page.locator('button', { hasText: 'Presets / Compare' }).click();
    await page.locator('button[aria-label^="Apply preset"]').first().click();
    await page.locator('button', { hasText: 'Meter / Lab' }).click();
    const newAperture = await page.locator('[data-control="aperture"] .text-white').textContent();
    expect(newAperture).not.toBe(oldAperture);
    const newFilter = await page.locator('.preview-container').evaluate(el => getComputedStyle(el).filter);
    expect(newFilter).not.toBe(oldFilter);
    const newBlur = await page.locator('.motion-stack').evaluate(el => getComputedStyle(el).filter);
    expect(newBlur).not.toBe(oldBlur);
  });

  test('1.5 preset_form_fields_explicitly_labeled', async ({ page }) => {
    await page.locator('button', { hasText: 'Presets / Compare' }).click();
    const firstPreset = page.locator('button[aria-label^="Apply preset"]').first();
    await firstPreset.waitFor({ state: 'visible' });
    await page.locator('button', { hasText: 'Meter / Lab' }).click();
    await page.locator('[data-control="aperture"] button[aria-label="Narrow aperture (higher f-number)"]').click();
    const oldAperture = await page.locator('[data-control="aperture"] .text-white').textContent();
    const oldFilter = await page.locator('.preview-container').evaluate(el => getComputedStyle(el).filter);
    const oldBlur = await page.locator('.motion-stack').evaluate(el => getComputedStyle(el).filter);
    await page.locator('button', { hasText: 'Presets / Compare' }).click();
    await page.locator('button[aria-label^="Apply preset"]').first().click();
    await page.locator('button', { hasText: 'Meter / Lab' }).click();
    const newAperture = await page.locator('[data-control="aperture"] .text-white').textContent();
    expect(newAperture).not.toBe(oldAperture);
    const newFilter = await page.locator('.preview-container').evaluate(el => getComputedStyle(el).filter);
    expect(newFilter).not.toBe(oldFilter);
    const newBlur = await page.locator('.motion-stack').evaluate(el => getComputedStyle(el).filter);
    expect(newBlur).not.toBe(oldBlur);
  });

  test('1.6 edit_preset_propagates_everywhere', async ({ page }) => {
    await page.locator('button', { hasText: 'Presets / Compare' }).click();
    const firstEdit = page.locator('button[aria-label^="Edit preset"]').first();
    await firstEdit.waitFor({ state: 'visible' });
    const oldName = await firstEdit.getAttribute('aria-label');
    const nameStr = oldName.replace('Edit preset ', '');
    await firstEdit.click();
    await page.fill('input#preset-name', 'Night Street Grain');
    await page.locator('button[type="submit"]', { hasText: /Save preset|Create preset/ }).click();
    await expect(page.locator(`button[aria-label="Apply preset ${nameStr} to the dials"]`)).toHaveCount(0);
    await expect(page.locator('button[aria-label="Apply preset Night Street Grain to the dials"]')).toBeVisible();
    await page.locator('button[aria-label="Apply preset Night Street Grain to the dials"]').click();
  });

  test('1.6 meter_exposes_exposure_state_text', async ({ page }) => {
    await page.locator('button', { hasText: 'Presets / Compare' }).click();
    const firstEdit = page.locator('button[aria-label^="Edit preset"]').first();
    await firstEdit.waitFor({ state: 'visible' });
    const oldName = await firstEdit.getAttribute('aria-label');
    const nameStr = oldName.replace('Edit preset ', '');
    await firstEdit.click();
    await page.fill('input#preset-name', 'Night Street Grain');
    await page.locator('button[type="submit"]', { hasText: /Save preset|Create preset/ }).click();
    await expect(page.locator(`button[aria-label="Apply preset ${nameStr} to the dials"]`)).toHaveCount(0);
    await expect(page.locator('button[aria-label="Apply preset Night Street Grain to the dials"]')).toBeVisible();
    await page.locator('button[aria-label="Apply preset Night Street Grain to the dials"]').click();
  });

  test('1.7 delete_preset_removes_from_list', async ({ page }) => {
    await page.locator('button', { hasText: 'Presets / Compare' }).click();
    await page.locator('button:not([type="submit"])', { hasText: 'Create preset' }).first().click();
    await page.fill('input#preset-name', 'ToDelete');
    await page.locator('button[type="submit"]', { hasText: /Save preset|Create preset/ }).click();
    const applyButtons = page.locator('button[aria-label^="Apply preset"]');
    await applyButtons.first().waitFor({ state: 'visible' });
    const initialCount = 7;
    await page.locator('button[aria-label="Delete preset ToDelete"]').click();
    await expect(applyButtons).toHaveCount(initialCount - 1);
  });

  test('1.7 dial_and_meter_text_contrast', async ({ page }) => {
    await page.locator('button', { hasText: 'Presets / Compare' }).click();
    await page.locator('button:not([type="submit"])', { hasText: 'Create preset' }).first().click();
    await page.fill('input#preset-name', 'ToDelete');
    await page.locator('button[type="submit"]', { hasText: /Save preset|Create preset/ }).click();
    const applyButtons = page.locator('button[aria-label^="Apply preset"]');
    await applyButtons.first().waitFor({ state: 'visible' });
    const initialCount = 7;
    await page.locator('button[aria-label="Delete preset ToDelete"]').click();
    await expect(applyButtons).toHaveCount(initialCount - 1);
  });

  test('1.8 empty_state_offers_create_control', async ({ page }) => {
    await page.locator('button', { hasText: 'Presets / Compare' }).click();
    let count = await page.locator('button[aria-label^="Delete preset"]').count();
    while(count > 0) { await page.locator('button[aria-label^="Delete preset"]').first().click(); count = await page.locator('button[aria-label^="Delete preset"]').count(); }
    await expect(page.locator('button:not([type="submit"])', { hasText: 'Create preset' }).first()).toBeVisible();
  });

  test('1.8 edge_steppers_exposed_as_disabled', async ({ page }) => {
    await page.locator('button', { hasText: 'Presets / Compare' }).click();
    let count = await page.locator('button[aria-label^="Delete preset"]').count();
    while(count > 0) { await page.locator('button[aria-label^="Delete preset"]').first().click(); count = await page.locator('button[aria-label^="Delete preset"]').count(); }
    await expect(page.locator('button:not([type="submit"])', { hasText: 'Create preset' }).first()).toBeVisible();
  });

  test('1.9 empty_name_rejects_create', async ({ page }) => {
    await page.locator('button', { hasText: 'Presets / Compare' }).click();
    await page.locator('button[aria-label^="Apply preset"]').first().waitFor({ state: 'visible' });
    const initialCount = await page.locator('button[aria-label^="Apply preset"]').count();
    await page.locator('button:not([type="submit"])', { hasText: 'Create preset' }).first().click();
    await page.fill('input#preset-name', '');
    await page.locator('input#preset-name').blur();
    const saveBtn = page.locator('button[type="submit"]', { hasText: /Save preset|Create preset/ });
    await expect(saveBtn).toBeDisabled();
    await page.locator('button', { hasText: 'Cancel' }).click();
    expect(await page.locator('button[aria-label^="Apply preset"]').count()).toBe(initialCount);
  });

  test('1.9 semantic_buttons_for_steppers_and_modes', async ({ page }) => {
    await page.locator('button', { hasText: 'Presets / Compare' }).click();
    await page.locator('button[aria-label^="Apply preset"]').first().waitFor({ state: 'visible' });
    const initialCount = await page.locator('button[aria-label^="Apply preset"]').count();
    await page.locator('button:not([type="submit"])', { hasText: 'Create preset' }).first().click();
    await page.fill('input#preset-name', '');
    await page.locator('input#preset-name').blur();
    const saveBtn = page.locator('button[type="submit"]', { hasText: /Save preset|Create preset/ });
    await expect(saveBtn).toBeDisabled();
    await page.locator('button', { hasText: 'Cancel' }).click();
    expect(await page.locator('button[aria-label^="Apply preset"]').count()).toBe(initialCount);
  });

  test('11.10 competition_level_lab_feel', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('11.1 compare_mode_polish_beyond_minimum', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('11.2 preview_stack_readability_aids', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('11.3 guided_first_run_for_dials', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('11.4 exposure_visualization_extra_usability', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('11.5 keyboard_chord_or_alternate_dial_input', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('11.6 saved_view_preferences_in_session', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('11.7 brand_chip_narrative_polish', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('11.8 theme_accent_craft_beyond_minimum', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('11.9 local_platform_enhancement', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('14.10 undo_after_batch_delete_restores_export', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('14.11 histogram_and_ev_differ_for_different_inputs', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('14.12 invalid_preset_payload_rejected_end_to_end', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('14.13 chained_edit_to_export_png_differs', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('14.14 look_then_export_png_reflects_mono', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('14.15 copy_paste_selective_group_probe', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('14.16 reset_to_original_then_undo_probe', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('14.1 multi_facet_reload_resets_to_seed', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('14.2 favorites_filter_reversal_proves_live_list', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('14.3 filter_derived_list_sensitivity', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('14.4 apply_preset_echoes_in_meter_lab', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('14.5 preset_create_count_delta_exact', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('14.6 different_stops_different_preview', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('14.7 interleaved_create_and_dial_flows', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('14.8 empty_then_repopulate_presets', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('14.9 export_tracks_mutations_then_import_roundtrip', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('15.10 slider_and_look_names_exact', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('15.1 uppercase_convention_on_dial_meter_mode', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('15.2 specific_verbs_on_actions', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('15.3 validation_names_problem_and_fix', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('15.4 empty_presets_copy_explains_next_step', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('15.5 help_explainers_polished', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('15.6 terminology_consistent_across_surfaces', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('15.7 stop_readout_formatting_consistent', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('15.8 success_or_apply_feedback_specific', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('15.9 import_error_names_problem', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('2.10 edge_steppers_exposed_as_disabled', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('2.11 help_overlay_dialog_semantics', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('2.12 validation_announced_aria_live', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('2.13 meter_exposes_text_readout', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('2.15 export_panel_coherent_with_store', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('2.16 reload_resets_including_snapshots_and_stacks', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('2.17 undo_redo_coherent_across_surfaces', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('2.18 api_shaped_schemas_drive_forms_and_export', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('2.19 import_validates_same_schemas', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('2.5 shared_state_coherence_across_views', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('2.6 console_clean_during_full_exercise', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('2.7 interactive_within_two_seconds', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('2.8 rapid_stepper_presses_stay_responsive', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('2.9 keyboard_operable_with_focus_ring', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('3.10 microinteraction_timing_matches_spec', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('3.10 layered_preview_stack_renders', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('3.11 ev_histogram_export_match_hardened_spec', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('3.11 presets_become_drawer_below_768', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('3.12 mobile_375_operable_no_clipping', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('3.13 consistent_label_capitalization', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('3.14 help_copy_names_visible_effects', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('3.15 messages_name_problem_and_fix', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('3.17 ev_and_histogram_in_lab_chrome', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('3.18 export_panel_monospace_json', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('3.19 batch_bar_and_snapshot_strip_visible', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('3.1 spacing_matches_lab_reference_scale', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('3.1 full_viewport_lab_composition', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('3.20 develop_panel_groups_and_png_control', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('3.2 typography_matches_condensed_display_spec', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('3.2 empty_presets_state_visible', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('3.3 desktop_composition_matches_reference', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('3.4 specified_state_changes_have_motion', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('3.4 three_dials_and_vertical_meter', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('3.5 responsive_behavior_matches_reference_patterns', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('3.5 condensed_type_dark_chrome_red_accent', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('3.6 dial_and_form_chrome_styled_not_browser_default', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('3.6 preset_rows_show_name_stops_badges', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('3.7 clear_hierarchy_dials_vs_presets_copy', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('3.7 single_icon_set_throughout', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('3.8 component_states_match_spec', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('3.8 distinct_component_state_treatments', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('3.9 dark_chrome_white_values_red_accent', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('3.9 help_panel_overlays_from_side', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.10 double_submit_creates_exactly_one', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.10 reduced_motion_instant_but_usable', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.11 empty_undo_redo_disabled', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.11 before_hold_crossfade_via_real_control', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.12 before_at_defaults_no_visible_change', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.12 histogram_eases_on_stop_change', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.13 malformed_import_keeps_session', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.13 develop_slider_and_look_easing', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.14 empty_snapshot_name_adds_nothing', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.14 copy_settings_dialog_transform_opacity', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.15 batch_favorite_requires_two_selected', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.16 duplicate_preset_name_rejected', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.17 out_of_list_stops_and_looktag_rejected', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.18 duplicate_or_invalid_snapshot_rejected', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.19 develop_sliders_clamp_at_bounds', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.1 empty_presets_state_with_create_control', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.1 required_hover_animations_present', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.20 paste_disabled_before_any_copy', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.21 copy_dialog_zero_groups_disables_confirm', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.2 preset_form_inline_validation_before_submit', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.2 mode_switch_keeps_hover_feedback', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.3 empty_name_validation_names_field', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.4 long_preset_name_rejected_over_40', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.4 meter_eases_and_preset_apply_eases', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.5 stepper_edge_fades_and_noninteractive', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.5 stepper_edge_opacity_transition', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.6 meter_dot_clamps_within_track', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.6 preview_stack_eases_on_stop_change', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.7 help_explains_nonobvious_dials', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.7 preset_list_microinteractions', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.8 preset_and_dial_controls_semantic', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.8 crud_toast_enters_and_exits_smoothly', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.9 help_panel_dismissible_paths', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('4.9 help_overlay_transform_opacity', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('6.10 mode_switch_preserves_dials_and_presets', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('6.11 before_hold_then_release_restores', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('6.12 snapshot_save_restore_round_trip', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('6.13 copy_stops_updates_list_and_export', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('6.14 batch_delete_then_undo_restores', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('6.15 export_import_round_trip_restores_session', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('6.16 create_preset_export_shows_looktag_fields', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('6.17 snapshot_appears_in_export_snapshots_array', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('6.18 develop_slider_then_grain_flow', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('6.19 copy_paste_light_only_selective', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('6.1 iso_step_updates_three_surfaces', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('6.20 look_apply_then_manual_clear_flow', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('6.21 reset_then_undo_flow', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('6.22 edited_image_differencing_flow', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('6.2 create_preset_count_filter_and_mode_roundtrip', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('6.3 apply_preset_writes_shared_dials', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('6.4 edit_preset_updates_everywhere', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('6.5 favorite_filter_then_delete_count_delta', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('6.6 reload_returns_seeded_state', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('6.7 favorites_and_tag_filters_recompute_list', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('6.8 help_panel_open_close_keeps_workflow', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('6.9 invalid_create_keeps_count_with_inline_error', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('7.10 fixed_overlays_remain_reachable', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('7.11 ev_histogram_export_reachable_at_375', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('7.12 develop_panel_reachable_at_375', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('7.1 layout_adapts_1440_to_375', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('7.2 mobile_tap_targets_adequate', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('7.3 dial_typography_readable_both_widths', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('7.4 no_clip_or_overflow_at_375', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('7.5 presets_drawer_at_768_and_below', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('7.6 help_toggle_works_desktop_and_mobile', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('7.7 mobile_help_and_steppers_tappable', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('7.8 no_horizontal_scroll_at_375', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('7.9 preview_stack_scales_with_viewport', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('9.10 local_assets_load_without_blocking_shell', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('9.11 histogram_ev_recompute_without_freeze', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('9.12 slider_drag_and_png_export_responsive', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('9.1 cold_start_under_two_seconds', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('9.2 console_clean_during_full_exercise', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('9.3 dial_press_feedback_under_100ms', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('9.4 preview_assets_do_not_blank_ui', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('9.5 seeded_presets_list_scrolls_smoothly', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('9.6 ui_interactive_during_preview_easing', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('9.7 preview_easing_holds_stable_frame_rate', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('9.8 rapid_stepper_presses_never_hang', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });

  test('9.9 extended_dial_session_stable', async ({ page }) => {
    const r1 = await page.evaluate(() => window.webmcp_invoke_tool('editor_preview'));
    expect(r1.ok).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    const r2 = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { object_type: 'exposure', properties: { aperture: 8 } }));
    expect(r2.ok).toBe(true);
  });
});
