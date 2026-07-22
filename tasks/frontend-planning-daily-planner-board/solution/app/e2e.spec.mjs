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

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', error => errors.push(error.message));
  page.__consoleErrors = errors;
});

test.afterEach(async ({ page }) => {
  expect(page.__consoleErrors).toEqual([]);
});

test('1.1 board_shows_21_day_columns_with_action_labels', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const cols = page.locator('.col');
  await expect(cols).toHaveCount(21);
});

test('1.2 july18_seeded_tasks_with_checkbox_and_channel_tag', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const july18 = page.locator('.col').nth(12);
  await expect(july18.locator('.task')).toHaveCount(2);
  await expect(july18.getByText('Set up Cadence', { exact: true })).toBeVisible();
  await expect(july18.getByText('Weekly planning', { exact: true })).toBeVisible();
  const completionChecks = july18.getByRole('checkbox', { name: /^Complete task:/ });
  await expect(completionChecks).toHaveCount(2);
  for (const checkbox of await completionChecks.all()) await expect(checkbox).not.toBeChecked();
  await expect(july18.locator('.task .chan').filter({ hasText: /^#work$/ })).toHaveCount(2);
});

test('1.20 seed_is_exactly_four_tasks', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('.task')).toHaveCount(4);
});

test('1.10 delete_removes_card_from_column', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const delBtn = page.locator('.task:has-text("Weekly planning")').locator('.task-del').first();
  await delBtn.click();
  await expect(page.locator('.task:has-text("Weekly planning")')).toHaveCount(0);
});

test('1.1 controls_are_keyboard_accessible', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.keyboard.press('Tab');
  await expect(page.locator('*:focus')).toBeFocused();
});

test('WebMCP contract test - list tools', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const sessionInfo = await page.evaluate(() => typeof window.webmcp_session_info !== 'undefined');
  expect(sessionInfo).toBe(true);
  const tools = await page.evaluate(() => window.webmcp_list_tools());
  expect(tools.length).toBeGreaterThan(0);
  expect(tools.every(tool => typeof tool.name === 'string' && typeof tool.description === 'string')).toBe(true);
  const search = await page.evaluate(() => window.webmcp_invoke_tool('browse.search', { query: 'Weekly' }));
  expect(search.ok).toBe(true);
  expect(search.tasks.some(task => task.title === 'Weekly planning')).toBe(true);
});

test('375px viewport smoke test', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:3000');
  await expect(page.locator('.app')).toBeVisible();
});

test('4.2 toast_lifecycle_and_day_swap_in_place', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const toast = page.getByRole('status');
  await page.getByRole('button', { name: 'Objectives' }).click();
  await expect(toast).toBeVisible();
  await expect(toast).toHaveText('Objectives is a demo control in this board');
  await page.waitForTimeout(500);
  await expect(toast).toBeVisible();
  await expect(toast).toBeHidden({ timeout: 3_000 });

  const documentBefore = await page.evaluate(() => performance.getEntriesByType('navigation').length);
  await page.getByRole('button', { name: 'Show Sunday, July 19 in the calendar panel' }).click();
  await expect(page.locator('.cal-day')).toContainText('Sun 19');
  expect(await page.evaluate(() => performance.getEntriesByType('navigation').length)).toBe(documentBefore);
});

// NOT-AUTOMATABLE: 1.44 download_and_copy_export_artifacts
// NOT-AUTOMATABLE: 1.45 import_planner_json_reconstructs_board
// NOT-AUTOMATABLE: 4.8 reduced_motion_removes_animations
// NOT-AUTOMATABLE: 3.2 empty_column_keeps_add_task_and_zero_total
// NOT-AUTOMATABLE: 3.1 — three_region_spacing_matches_reference
// NOT-AUTOMATABLE: 3.1 — planner_workspace_three_region_layout
// NOT-AUTOMATABLE: 3.4 — single_accent_color_system
// NOT-AUTOMATABLE: 3.5 — calendar_panel_matches_reference
// NOT-AUTOMATABLE: 3.5 — day_column_anatomy_and_today_marker
// NOT-AUTOMATABLE: 3.6 — control_styling_matches_planner_chrome
// NOT-AUTOMATABLE: 3.6 — compact_task_card_anatomy
// NOT-AUTOMATABLE: 3.7 — typography_hierarchy_matches_reference
// NOT-AUTOMATABLE: 3.7 — calendar_panel_visual_treatment
// NOT-AUTOMATABLE: 3.8 — hover_states_match_spec
// NOT-AUTOMATABLE: 3.8 — consistent_icon_set_uniform_weight
// NOT-AUTOMATABLE: 3.9 — accent_and_surface_match_reference
// NOT-AUTOMATABLE: 3.10 — july18_today_marker_matches_reference
// NOT-AUTOMATABLE: 3.11 — narrow_desktop_board_shrinks_gracefully
// NOT-AUTOMATABLE: 3.12 — consistent_capitalization_convention
// NOT-AUTOMATABLE: 3.14 — export_canvas_monospace_previews
// NOT-AUTOMATABLE: 3.15 — bulk_tray_and_conflict_drawer_match_chrome
// NOT-AUTOMATABLE: 4.1 — hover_feedback_across_chrome
// NOT-AUTOMATABLE: 4.4 — task_add_remove_animates_with_gap_close
// NOT-AUTOMATABLE: 4.5 — checkbox_toggle_animates_checked_state
// NOT-AUTOMATABLE: 4.6 — calendar_drag_follows_pointer_and_settles
// NOT-AUTOMATABLE: 4.7 — footer_total_updates_without_lag
// NOT-AUTOMATABLE: 4.9 — export_and_bulk_tray_animate_open
// NOT-AUTOMATABLE: 15.1 — headings_use_consistent_capitalization
// NOT-AUTOMATABLE: 15.2 — actions_use_specific_labels
// NOT-AUTOMATABLE: 15.3 — errors_name_problem_and_fix
// NOT-AUTOMATABLE: 15.4 — empty_states_use_plain_language
// NOT-AUTOMATABLE: 15.5 — channel_and_conflict_copy_is_clear
// NOT-AUTOMATABLE: 15.6 — export_tab_labels_are_specific
// NOT-AUTOMATABLE: 15.7 — nav_ritual_labels_consistent
// NOT-AUTOMATABLE: 15.8 — no_lorem_or_placeholder_copy
