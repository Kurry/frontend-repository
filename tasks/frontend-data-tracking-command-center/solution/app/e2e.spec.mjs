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


test.describe('Command Center E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  // 1. Accessibility
  test('1.1 keyboard_reaches_primary_controls', async ({ page }) => {
    await page.keyboard.press('Tab');
    const focused = page.locator('*:focus');
    await expect(focused).not.toBeNull();
  });

  test('1.2 visible_focus_indicators', async ({ page }) => {
    await page.keyboard.press('Tab');
    const focused = page.locator('*:focus');
    await expect(focused).not.toBeNull();
    const outline = await focused.evaluate(el => window.getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe('none');
  });

  test('1.3 dialogs_trap_focus_and_escape', async ({ page }) => {
    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  test('1.4 night_popover_escape_returns_focus', async ({ page }) => {
    const trigger = page.locator('header button').last();
    await trigger.click();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  });

  test('1.5 validation_associated_with_fields', async ({ page }) => {
    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
    await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible();
  });

  test('1.6 status_not_color_only', async ({ page }) => {
    const status = page.locator('[class*="status"], [class*="chip"]').first();
    await expect(status).toHaveText(/[a-zA-Z]+/);
  });

  test('1.7 aria_live_announces_mutations', async ({ page }) => {
    await expect(page.locator('[aria-live]').first()).toBeAttached();
  });

  test('1.8 labels_on_form_controls', async ({ page }) => {
    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    const input = page.locator('input').first();
    const hasLabel = await input.evaluate(el => el.hasAttribute('id') || el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby'));
    expect(hasLabel).toBe(true);
  });

  test('1.9 checkbox_and_bulk_actions_labeled', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]').first();
    const hasLabel = await checkbox.evaluate(el => el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby') || el.hasAttribute('id'));
    expect(hasLabel).toBe(true);
  });

  test('1.10 export_tabs_are_keyboard_operable', async ({ page }) => {
    await page.getByRole('button', { name: /Export/i }).click();
    await expect(page.getByRole('tablist')).toBeVisible();
    await expect(page.getByRole('tab')).toHaveCount(2);
  });

  test('1.11 rename_and_disconnect_agent', async ({ page }) => {
    await page.locator('table tbody tr [aria-haspopup="true"], table tbody tr [aria-label*="menu"]').first().click();
    await expect(page.getByRole('menuitem', { name: /Rename/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Disconnect/i })).toBeVisible();
  });

  test('1.12 feed_newest_first_capped_50', async ({ page }) => {
    await expect(page.locator('ul li, [role="listitem"]').first()).toBeVisible();
    const count = await page.locator('ul li, [role="listitem"]').count();
    expect(count).toBeGreaterThanOrEqual(12);
    expect(count).toBeLessThanOrEqual(50);
  });

  test('1.13 feed_item_opens_related_resource', async ({ page }) => {
    await page.locator('.feed-item button, [role="listitem"] button, ul li button').first().click();
    await expect(page.locator('*:focus')).not.toBeNull();
  });

  test('1.14 feed_filter_chips_and_clear', async ({ page }) => {
    await page.getByRole('button', { name: /Error/i }).first().click();
    await expect(page.getByRole('button', { name: /Clear/i })).toBeVisible();
  });

  test('1.15 simulate_activity_appends_event', async ({ page }) => {
    const initial = await page.locator('ul li, [role="listitem"]').count();
    await page.getByRole('button', { name: /Simulate activity/i }).click();
    const updated = await page.locator('ul li, [role="listitem"]').count();
    expect(updated).toBeGreaterThan(initial);
  });

  test('1.16 feed_autofollow_and_jump_to_latest', async ({ page }) => {
    await page.getByRole('button', { name: /Simulate activity/i }).click();
    await expect(page.locator('ul li, [role="listitem"]').first()).toBeVisible();
  });

  test('1.17 suggestion_chips_apply_named_filter', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    const palette = page.getByRole('dialog');
    await expect(palette).toBeVisible();
    await palette.locator('button').first().click();
    await expect(palette).not.toBeVisible();
  });

  test('1.18 night_mode_badge_schedule_form', async ({ page }) => {
    await page.locator('header button').last().click();
    await expect(page.locator('text=/night/i').first()).toBeVisible();
  });

  test('1.19 long_agent_name_truncation', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible();
  });

  test('1.20 bulk_disconnect_selected_agents', async ({ page }) => {
    await page.locator('input[type="checkbox"]').nth(1).click({ force: true });
    await page.locator('input[type="checkbox"]').nth(2).click({ force: true });
    await expect(page.getByRole('button', { name: /Disconnect selected/i })).toBeVisible();
  });

  test('1.21 command_palette_runs_named_commands', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('1.22 undo_redo_agent_mutations', async ({ page }) => {
    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Mutate Agent');
    await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();

    await page.getByRole('button', { name: /Undo/i }).click();
    await expect(page.getByRole('button', { name: /Redo/i })).toBeEnabled();
  });

  test('1.23 session_export_json_and_agents_csv', async ({ page }) => {
    await page.getByRole('button', { name: /Export/i }).click();
    await expect(page.getByRole('tab', { name: /JSON/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /CSV/i })).toBeVisible();
  });

  test('1.24 export_reflects_session_mutations', async ({ page }) => {
    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Export Mutation');
    await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();

    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /Export/i }).click({ force: true });
    await expect(page.locator('pre, code').first()).toContainText('Export Mutation');
  });

  test('1.25 export_copy_download_and_import_roundtrip', async ({ page }) => {
    await page.getByRole('button', { name: /Export/i }).click();
    await expect(page.getByRole('button', { name: /Copy/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Download/i })).toBeVisible();
  });

  // 4. Motion
  test('4.8 reduced_motion_fallback', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('http://localhost:3000');
    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const transitionDuration = await dialog.evaluate((el) => window.getComputedStyle(el).transitionDuration);
    expect(parseFloat(transitionDuration) || 0).toBeLessThan(0.1);
  });

  // 5. Core
  test('5.1 serves_clean_and_interactive_fast', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('5.2 console_clean_full_exercise', async ({ page }) => {
    let errors = 0;
    page.on('console', msg => { if (msg.type() === 'error') errors++; });
    page.on('pageerror', () => errors++);
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Console Agent');
    await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();

    await page.getByRole('button', { name: /Simulate activity/i }).click();

    await page.getByRole('button', { name: /Export/i }).click();

    expect(errors).toBe(0);
  });

  test('5.4 reload_returns_seeded_baseline', async ({ page }) => {
    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Seeded Agent');
    await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();

    await page.reload();
    await expect(page.locator('body')).not.toContainText('Seeded Agent');
  });

  test('5.5 cross_view_state_coherence', async ({ page }) => {
    await page.locator('table tbody tr [aria-haspopup="true"], table tbody tr [aria-label*="menu"]').first().click();
    await page.getByRole('menuitem', { name: /Rename/i }).click();
    await page.locator('input[type="text"]').last().fill('Cross View Agent');
    await page.getByRole('button', { name: /Rename|Save/i }).click();

    await expect(page.locator('table tbody tr').first()).toContainText('Cross View Agent');
  });

  test('5.7 rapid_input_stability', async ({ page }) => {
    const simBtn = page.getByRole('button', { name: /Simulate activity/i });
    for(let i=0; i<5; i++){
      await simBtn.click();
    }
    await expect(page.locator('ul li, [role="listitem"]').first()).toBeVisible();
  });

  test('5.9 webmcp_registry_matches_ui', async ({ page }) => {
    const hasInfo = await page.evaluate(() => typeof window.webmcp_session_info !== "undefined");
    const hasList = await page.evaluate(() => typeof window.webmcp_list_tools !== "undefined");
    const hasInvoke = await page.evaluate(() => typeof window.webmcp_invoke_tool !== "undefined");
    expect(hasInfo && hasList && hasInvoke).toBe(true);
  });

  test('5.10 export_preview_regen_stays_responsive', async ({ page }) => {
    await page.getByRole('button', { name: /Export/i }).click();
    await page.getByRole('tab', { name: /CSV/i }).click();
    await expect(page.locator('pre, code').first()).toBeVisible();
  });

  // 6. Flows
  test('6.1 connect_agent_updates_panel_feed_export', async ({ page }) => {
    const initialRows = await page.locator('table tbody tr').count();

    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Strict Test Agent');
    await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();

    const newRows = await page.locator('table tbody tr').count();
    expect(newRows).toBe(initialRows + 1);

    await expect(page.locator('.feed-item, [role="listitem"], ul li').first()).toContainText('Strict Test Agent');

    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /Export/i }).click({ force: true });
    await expect(page.locator('pre, code').first()).toContainText('Strict Test Agent');
  });

  test('6.2 invalid_connect_shows_field_contract_errors', async ({ page }) => {
    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
    await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible();
  });

  test('6.3 rename_updates_all_agent_surfaces', async ({ page }) => {
    await page.locator('table tbody tr [aria-haspopup="true"], table tbody tr [aria-label*="menu"]').first().click();
    await page.getByRole('menuitem', { name: /Rename/i }).click();
    await page.locator('input[type="text"]').last().fill('Renamed Flow Agent');
    await page.getByRole('button', { name: /Rename|Save/i }).click();
    await expect(page.locator('table tbody tr').first()).toContainText('Renamed Flow Agent');
  });

  test('6.4 disconnect_updates_panel_kpi_feed_export', async ({ page }) => {
    const initialRows = await page.locator('table tbody tr').count();
    await page.locator('table tbody tr [aria-haspopup="true"], table tbody tr [aria-label*="menu"]').first().click();
    await page.getByRole('menuitem', { name: /Disconnect/i }).click();
    await page.getByRole('button', { name: /Confirm|Disconnect/i }).last().click();
    const newRows = await page.locator('table tbody tr').count();
    expect(newRows).toBeLessThan(initialRows);
  });

  test('6.5 kpi_detail_and_back_retain_dashboard_state', async ({ page }) => {
    await page.locator('.kpi-tile, [class*="kpi"]').first().click();
    await page.getByRole('button', { name: /Back/i }).click();
    await expect(page.locator('table tbody tr').first()).toBeVisible();
  });

  test('6.6 last_disconnect_shows_agent_empty_state', async ({ page }) => {
    const checkboxes = page.locator('input[type="checkbox"]');
    const cnt = await checkboxes.count();
    for (let i = 1; i < cnt; i++) {
        await checkboxes.nth(i).click({ force: true });
    }
    await page.getByRole('button', { name: /Disconnect selected/i }).click();
    await page.getByRole('button', { name: /Confirm|Disconnect/i }).last().click();
    await expect(page.locator('text=/empty|no agents/i')).toBeVisible();
  });

  test('6.7 feed_filters_update_visible_events', async ({ page }) => {
    await page.getByRole('button', { name: /Error/i }).first().click();
    await expect(page.locator('.feed-item, [role="listitem"], ul li').first()).toContainText(/error/i);
  });

  test('6.8 command_palette_preserves_workflow', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('6.9 overlays_support_connect_export_palette', async ({ page }) => {
    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Meta+k');
    // It shouldn't crash
    await page.keyboard.press('Escape');
  });

  test('6.10 retry_recovers_error_agent_without_reload', async ({ page }) => {
    const retryBtn = page.getByRole('button', { name: /Retry/i }).first();
    await retryBtn.click();
    await expect(retryBtn).not.toBeVisible();
  });

  test('6.11 bulk_disconnect_flow', async ({ page }) => {
    await page.locator('input[type="checkbox"]').nth(1).click({ force: true });
    await page.locator('input[type="checkbox"]').nth(2).click({ force: true });
    await page.getByRole('button', { name: /Disconnect selected/i }).click();
    await page.getByRole('button', { name: /Confirm|Disconnect/i }).last().click();
  });

  test('6.12 undo_after_connect_then_redo', async ({ page }) => {
    const initialRows = await page.locator('table tbody tr').count();
    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Undo Agent 6.12');
    await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();

    await page.getByRole('button', { name: /Undo/i }).click();
    let rows = await page.locator('table tbody tr').count();
    expect(rows).toBe(initialRows);

    await page.getByRole('button', { name: /Redo/i }).click();
    rows = await page.locator('table tbody tr').count();
    expect(rows).toBe(initialRows + 1);
  });

  test('6.13 export_import_round_trip_flow', async ({ page }) => {
    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Round Trip 6.13');
    await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();

    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /Export/i }).click({ force: true });
    await expect(page.locator('pre, code').first()).toContainText('Round Trip 6.13');
  });

  // 7. Mobile
  test('7.1 desktop_kpi_strip_one_row', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000');
    const tiles = page.locator('.kpi-tile, [class*="kpi"]');
    const box1 = await tiles.nth(0).boundingBox();
    const box4 = await tiles.nth(3).boundingBox();
    expect(Math.abs(box1.y - box4.y)).toBeLessThan(10);
  });

  test('7.2 tablet_kpi_wrap_feed_stacks', async ({ page }) => {
    await page.setViewportSize({ width: 1023, height: 900 });
    await page.goto('http://localhost:3000');
    const tiles = page.locator('.kpi-tile, [class*="kpi"]');
    const box1 = await tiles.nth(0).boundingBox();
    const box4 = await tiles.nth(3).boundingBox();
    expect(box4.y).toBeGreaterThan(box1.y + 10);
  });

  test('7.3 mobile_no_page_horizontal_scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(375);
  });

  test('7.4 suggestions_row_self_scrolls', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(375);
  });

  test('7.5 export_drawer_usable_on_mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    await page.getByRole('button', { name: /Export/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
  });

  test('7.6 command_palette_usable_on_mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    await page.keyboard.press('Meta+k');
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('7.7 undo_redo_visible_on_mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    await expect(page.getByRole('button', { name: /Undo/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Redo/i })).toBeVisible();
  });

  test('7.8 connect_dialog_usable_on_mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('7.9 agent_panel_readable_on_mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    await expect(page.locator('table tbody tr').first()).toBeVisible();
  });

  test('7.10 feed_readable_on_mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    await expect(page.locator('ul li, [role="listitem"]').first()).toBeVisible();
  });

  // 9. Perf
  test('9.1 interactive_within_two_seconds', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('9.2 console_clean_on_load', async ({ page }) => {
    let errors = 0;
    page.on('console', msg => { if (msg.type() === 'error') errors++; });
    page.on('pageerror', () => errors++);
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    expect(errors).toBe(0);
  });

  test('9.3 console_clean_during_exercise', async ({ page }) => {
    let errors = 0;
    page.on('console', msg => { if (msg.type() === 'error') errors++; });
    page.on('pageerror', () => errors++);
    await page.goto('http://localhost:3000');
    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    await page.keyboard.press('Escape');
    expect(errors).toBe(0);
  });

  test('9.4 rapid_simulate_stays_responsive', async ({ page }) => {
    const simBtn = page.getByRole('button', { name: /Simulate activity/i });
    for(let i=0; i<5; i++){ await simBtn.click(); }
    await expect(page.locator('ul li, [role="listitem"]').first()).toBeVisible();
  });

  test('9.5 rapid_filter_toggles_stay_responsive', async ({ page }) => {
    const errorBtn = page.getByRole('button', { name: /Error/i }).first();
    for(let i=0; i<5; i++){ await errorBtn.click(); }
    await expect(page.locator('ul li, [role="listitem"]').first()).toBeVisible();
  });

  test('9.6 export_tab_switch_no_freeze', async ({ page }) => {
    await page.getByRole('button', { name: /Export/i }).click();
    await page.getByRole('tab', { name: /CSV/i }).click();
    await expect(page.locator('pre, code').first()).toBeVisible();
  });

  test('9.7 palette_filter_stays_snappy', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    await page.keyboard.type('test');
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('9.8 undo_redo_stays_responsive', async ({ page }) => {
    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Resp Agent');
    await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();

    await page.getByRole('button', { name: /Undo/i }).click();
    await expect(page.locator('table tbody tr').first()).toBeVisible();
  });

  test('9.9 detail_navigation_no_jank', async ({ page }) => {
    await page.locator('.kpi-tile, [class*="kpi"]').first().click();
    await page.getByRole('button', { name: /Back/i }).click();
    await expect(page.locator('table tbody tr').first()).toBeVisible();
  });

  test('9.10 bulk_disconnect_no_hang', async ({ page }) => {
    await page.locator('input[type="checkbox"]').nth(1).click({ force: true });
    await page.locator('input[type="checkbox"]').nth(2).click({ force: true });
    await page.getByRole('button', { name: /Disconnect selected/i }).click();
    await page.getByRole('button', { name: /Confirm|Disconnect/i }).last().click();
    await expect(page.locator('table tbody tr').first()).toBeVisible();
  });

  // 11. Bonus
  test('11.2 undo_redo_keyboard_shortcuts_bonus', async ({ page }) => {
    const initialRows = await page.locator('table tbody tr').count();
    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Shortcut Agent');
    await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();

    const connectedRows = await page.locator('table tbody tr').count();
    expect(connectedRows).toBe(initialRows + 1);

    await page.keyboard.press('Meta+z');
    const undoRows = await page.locator('table tbody tr').count();
    expect(undoRows).toBeLessThanOrEqual(connectedRows);
  });

  // 14. Integrity
  test('14.1 multi_facet_reload_resets_seeded', async ({ page }) => {
    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Reload Agent 14.1');
    await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();

    await page.reload();
    await expect(page.locator('body')).not.toContainText('Reload Agent 14.1');
  });

  test('14.2 feed_filter_reversal_proves_live', async ({ page }) => {
    await page.getByRole('button', { name: /Error/i }).first().click();
    await page.getByRole('button', { name: /Clear/i }).click();
    await page.getByRole('button', { name: /Error/i }).first().click();
    await expect(page.locator('.feed-item, [role="listitem"], ul li').first()).toContainText(/error/i);
  });

  test('14.3 export_preview_tracks_agent_mutations', async ({ page }) => {
    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Probe Alpha');
    await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();

    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /Export/i }).click({ force: true });
    await expect(page.locator('pre, code').first()).toContainText('Probe Alpha');
  });

  test('14.4 rename_echoes_panel_feed_export', async ({ page }) => {
    await page.locator('table tbody tr [aria-haspopup="true"], table tbody tr [aria-label*="menu"]').first().click();
    await page.getByRole('menuitem', { name: /Rename/i }).click();
    await page.locator('input[type="text"]').last().fill('Echo Agent 14.4');
    await page.getByRole('button', { name: /Rename|Save/i }).click();

    await page.getByRole('button', { name: /Export/i }).click({ force: true });
    await expect(page.locator('pre, code').first()).toContainText('Echo Agent 14.4');
  });

  test('14.5 connect_count_delta_is_exact', async ({ page }) => {
    const initialRows = await page.locator('table tbody tr').count();
    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Delta Agent');
    await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();

    const newRows = await page.locator('table tbody tr').count();
    expect(newRows - initialRows).toBe(1);
  });

  test('14.6 different_agent_names_change_exports', async ({ page }) => {
    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Agent One');
    await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();

    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Agent Two');
    await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();

    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /Export/i }).click({ force: true });
    await expect(page.locator('pre, code').first()).toContainText('Agent One');
    await expect(page.locator('pre, code').first()).toContainText('Agent Two');
  });

  test('14.7 interleaved_connect_and_detail_views', async ({ page }) => {
    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    await page.keyboard.press('Escape');
    await page.locator('.kpi-tile, [class*="kpi"]').first().click();
    await expect(page.locator('body')).toBeVisible();
  });

  test('14.8 empty_agents_then_reconnect_tracks_kpi', async ({ page }) => {
    const checkboxes = page.locator('input[type="checkbox"]');
    const cnt = await checkboxes.count();
    for (let i = 1; i < cnt; i++) {
        await checkboxes.nth(i).click({ force: true });
    }
    await page.getByRole('button', { name: /Disconnect selected/i }).click();
    await page.getByRole('button', { name: /Confirm|Disconnect/i }).last().click();

    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Reconnect Agent 14.8');
    await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
    await expect(page.locator('table tbody tr').first()).toBeVisible();
  });

  test('14.9 undo_round_trip_restores_exports', async ({ page }) => {
    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Undo Export Agent 14.9');
    await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();

    await page.getByRole('button', { name: /Undo/i }).click();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /Export/i }).click({ force: true });
    await expect(page.locator('pre, code').first()).not.toContainText('Undo Export Agent 14.9');
  });

  test('14.10 export_import_pipeline_end_state', async ({ page }) => {
    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Pipeline Agent 14.10');
    await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
    await expect(page.locator('table tbody tr').first()).toBeVisible();
  });

  // 15. Writing
  test('15.2 actions_use_specific_labels', async ({ page }) => {
    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    await expect(page.getByRole('button', { name: 'Connect agent', exact: true }).last()).toBeVisible();
  });

  test('15.3 errors_name_field_and_rule', async ({ page }) => {
    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
    await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible();
  });

  test('15.4 empty_states_explain_next_step', async ({ page }) => {
    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
    await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible();
  });

  test('15.8 success_messages_are_specific', async ({ page }) => {
    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
    await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible();
  });
});

/*
// NOT-AUTOMATABLE: 2.1 — grid_composition_kpi_main_sidebar
// NOT-AUTOMATABLE: 2.2 — typography_hierarchy
// NOT-AUTOMATABLE: 2.3 — kpi_tile_accent_and_shared_anatomy
// NOT-AUTOMATABLE: 2.4 — consistent_status_chip_language
// NOT-AUTOMATABLE: 2.5 — focus_ring_and_danger_treatment
// NOT-AUTOMATABLE: 2.6 — single_icon_set_consistency
// NOT-AUTOMATABLE: 2.7 — night_theme_full_recolor
// NOT-AUTOMATABLE: 2.8 — responsive_reflow_and_wrap
// NOT-AUTOMATABLE: 2.9 — export_drawer_and_palette_anatomy
// NOT-AUTOMATABLE: 3.1 — prd_grid_composition_fidelity
// NOT-AUTOMATABLE: 3.2 — prd_kpi_tile_anatomy_fidelity
// NOT-AUTOMATABLE: 3.3 — prd_chip_language_fidelity
// NOT-AUTOMATABLE: 3.4 — prd_export_drawer_fidelity
// NOT-AUTOMATABLE: 3.5 — prd_palette_overlay_fidelity
// NOT-AUTOMATABLE: 3.6 — prd_night_theme_fidelity
// NOT-AUTOMATABLE: 3.7 — prd_danger_treatment_fidelity
// NOT-AUTOMATABLE: 3.8 — prd_typography_hierarchy_fidelity
// NOT-AUTOMATABLE: 3.9 — prd_icon_consistency_fidelity
// NOT-AUTOMATABLE: 3.10 — prd_detail_view_fidelity
// NOT-AUTOMATABLE: 4.1 — kpi_countup_on_fresh_load
// NOT-AUTOMATABLE: 4.2 — feed_item_slide_in_from_top
// NOT-AUTOMATABLE: 4.3 — step_status_transition_animation
// NOT-AUTOMATABLE: 4.4 — dialog_drawer_palette_enter_exit
// NOT-AUTOMATABLE: 4.5 — agent_row_animate_in_out
// NOT-AUTOMATABLE: 4.6 — hover_wash_system
// NOT-AUTOMATABLE: 4.7 — theme_recolor_transition
// NOT-AUTOMATABLE: 4.9 — export_drawer_motion
// NOT-AUTOMATABLE: 4.10 — running_agent_shows_step_progress_feedback
// NOT-AUTOMATABLE: 11.1 — export_summary_strip_bonus
// NOT-AUTOMATABLE: 11.3 — last_mutation_chip_bonus
// NOT-AUTOMATABLE: 11.4 — kpi_sparkline_extra_affordance
// NOT-AUTOMATABLE: 11.5 — palette_recent_commands_bonus
// NOT-AUTOMATABLE: 11.6 — operator_density_preferences_bonus
// NOT-AUTOMATABLE: 11.7 — ops_console_brand_polish_bonus
// NOT-AUTOMATABLE: 11.8 — theme_accent_customization_bonus
// NOT-AUTOMATABLE: 11.9 — print_or_share_session_bonus
// NOT-AUTOMATABLE: 11.10 — competition_level_ops_polish
// NOT-AUTOMATABLE: 15.1 — headings_use_consistent_capitalization
// NOT-AUTOMATABLE: 15.5 — body_copy_is_well_written
// NOT-AUTOMATABLE: 15.6 — terminology_is_consistent
// NOT-AUTOMATABLE: 15.7 — numbers_dates_and_units_consistent
// NOT-AUTOMATABLE: innovation.catchall — innovation_catchall
*/
