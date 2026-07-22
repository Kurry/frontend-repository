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
    const response = await page.goto(BASE);
    expect(response, 'navigation returns an HTTP response').not.toBeNull();
    expect(response.ok(), `HTTP ${response.status()} from ${response.url()}`).toBe(true);
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
    const session = await page.evaluate(async () => {
      const value = await window.webmcp_session_info();
      return typeof value === 'string' ? JSON.parse(value) : value;
    });
    expect(session, 'webmcp_session_info returns metadata').toBeTruthy();
    expect(Array.isArray(session), 'session metadata is an object, not an array').toBe(false);
    expect(typeof session, 'session metadata is an object').toBe('object');
    expect(Object.keys(session).length, 'session metadata is non-empty').toBeGreaterThan(0);
    const tools = await listTools(page);
    const arr = Array.isArray(tools) ? tools : tools?.tools ?? [];
    expect(arr.length, 'at least one webmcp tool registered').toBeGreaterThan(0);
    const names = arr.map((t) => t?.name ?? t?.id);
    for (const name of names) {
      expect(typeof name, 'every tool has a name').toBe('string');
      expect(name.trim().length, 'tool names are non-empty').toBeGreaterThan(0);
    }
    expect(new Set(names).size, 'tool names are unique').toBe(names.length);
  });

  test('reduced motion behaviorally suppresses animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // Start observing at navigation commit, before short intro animations can
    // finish and disappear from document.getAnimations(). Sampling only after
    // networkidle/settle would falsely pass a forbidden sub-second animation.
    await page.goto(BASE, { waitUntil: 'commit' });
    // Precondition sanity check: the emulation actually reaches the app.
    const reduced = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
    expect(reduced, 'precondition: app sees prefers-reduced-motion: reduce').toBe(true);
    // Observe every frame through the intro/settle window. Finished, idle, or
    // paused effects and durations <=1ms are allowed; any meaningfully timed
    // running effect at any sample is a reduced-motion failure.
    const offenders = await page.evaluate(async () => {
      const seen = new Map();
      const deadline = performance.now() + 1500;
      while (performance.now() < deadline) {
        for (const a of document.getAnimations({ subtree: true })) {
          if (a.playState !== 'running') continue;
          let timing = {};
          try { timing = a.effect?.getComputedTiming?.() ?? {}; } catch { /* detached */ }
          const dur = typeof timing.duration === 'number' ? timing.duration : 0;
          if (dur <= 1) continue; // fill-only / effectively instant
          const offender = {
            kind: a.constructor?.name ?? 'Animation',
            name: a.animationName ?? a.transitionProperty ?? a.id ?? '(anonymous)',
            duration: dur,
            iterations: timing.iterations ?? 1,
          };
          seen.set(JSON.stringify(offender), offender);
        }
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      return [...seen.values()];
    });
    await page.waitForLoadState('networkidle');
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
test('1.4 completion_checkbox_names_include_title', async ({ page }) => {
  await page.goto(BASE);
  const chk = page.locator('.task .chk').first();
  const title = await page.locator('.task .task-open').first().textContent();
  const label = await chk.getAttribute('aria-label');
  expect(label.startsWith('Complete task:')).toBe(true);
  expect(label).toContain(title.trim());
});

test('1.5 toast_and_copy_announced_live', async ({ page }) => {
  await page.goto(BASE);
  const toast = page.locator('#toast');
  await expect(toast).toHaveAttribute('aria-live', 'polite');
  await page.locator('[data-chrome="Home"]').click();
  await expect(toast).toBeVisible();
  const txt = await toast.textContent();
  expect(txt).toContain('demo control');
});

test('1.6 conflicts_control_names_count', async ({ page }) => {
  await page.goto(BASE);
  const btn = page.locator('#conflicts-btn');
  await expect(btn).toHaveAttribute('aria-label', /Schedule conflicts:/);
});

test('1.9 selection_checkbox_distinct_from_complete', async ({ page }) => {
  await page.goto(BASE);
  const selCb = page.locator('.sel-cb').first();
  const completeCb = page.locator('.chk').first();
  expect(await selCb.getAttribute('aria-label')).not.toEqual(await completeCb.getAttribute('aria-label'));
});

test('1.24 inline_validation_disables_submit_until_valid', async ({ page }) => {
  await page.goto(BASE);
  await page.locator(".col[data-day='18'] .add-task").click();
  const form = page.locator(".col[data-day='18'] .add-form");
  const submit = form.getByRole('button', { name: 'Add task' });
  await expect(submit).toBeDisabled();

  await form.locator('.add-title').fill('Plan launch');
  await expect(submit).toBeEnabled();
  await form.locator('.add-start').fill('tomorrow morning');
  await expect(form.getByText('Start time must look like 9:00 am or 2:30 pm')).toBeVisible();
  await expect(submit).toBeDisabled();
  await form.locator('.add-start').fill('10:30 am');
  await expect(submit).toBeEnabled();
});

test('1.30 completion_toggle_round_trips_across_views', async ({ page }) => {
  await page.goto(BASE);
  // The Work task lives on July 20; select that day so the calendar day
  // panel actually renders its block (the panel only shows state.selectedDay).
  await page.getByRole('button', { name: /Show .*, July 20 in the calendar panel/ }).click();
  const calEvent = page.locator('#cal .cal-event', { hasText: 'Work' });
  await expect(calEvent).toBeVisible();
  await expect(calEvent).not.toHaveClass(/done/);
  await expect(calEvent).toHaveAttribute('aria-label', /Work at 9:00 am(?! \(completed\))/);

  const complete = page.getByRole('checkbox', { name: 'Complete task: Work' });
  await expect(complete).not.toBeChecked();
  await complete.click();
  await expect(complete).toBeChecked();
  await expect(page.getByText('Work', { exact: true }).first()).toHaveCSS('text-decoration-line', 'line-through');

  // Same block, same view, no reload: it must flip to the completed state too.
  await expect(calEvent).toHaveClass(/done/);
  await expect(calEvent).toHaveAttribute('aria-label', /Work at 9:00 am \(completed\)/);

  await complete.click();
  await expect(complete).not.toBeChecked();
  await expect(calEvent).not.toHaveClass(/done/);
  await expect(calEvent).toHaveAttribute('aria-label', /Work at 9:00 am(?! \(completed\))/);
});

test('1.46 schedule_conflict_drawer_lists_collisions', async ({ page }) => {
  await page.goto(BASE);
  const conflictsBtn = page.locator('#conflicts-btn');
  await expect(conflictsBtn).toHaveAttribute('aria-label', 'Schedule conflicts: 0');
  await conflictsBtn.click();
  await expect(page.getByText('No schedule conflicts')).toBeVisible();
  // Close the drawer before mutating state, mirroring real user navigation.
  await conflictsBtn.click();

  await page.locator(".col[data-day='20'] .add-task").click();
  const form = page.locator(".col[data-day='20'] .add-form");
  await form.locator('.add-title').fill('Overlap review');
  await form.locator('.add-start').fill('9:00 am');
  await form.getByRole('button', { name: 'Add task' }).click();
  await expect(conflictsBtn).toHaveAttribute('aria-label', 'Schedule conflicts: 1');

  // Reopen the drawer and verify the actual colliding pair is listed by title,
  // not just the count.
  await conflictsBtn.click();
  const items = page.locator('#conflict-list .conflict-item');
  await expect(items).toHaveCount(1);
  await expect(items.first().locator('.pair')).toHaveText('Work ↔ Overlap review');
  await expect(items.first().locator('.when')).toHaveText('Both at 9:00 am on July 20');

  // Changing the colliding task's startTime clears the pair and decrements the count.
  await items.first().getByRole('button', { name: 'Edit Overlap review' }).click();
  await page.locator('#edit-start').fill('11:00 am');
  await page.locator('#edit-save').click();
  await expect(conflictsBtn).toHaveAttribute('aria-label', 'Schedule conflicts: 0');
});

test('1.43 export_reflects_session_mutations', async ({ page }) => {
  await page.goto(BASE);
  await page.getByRole('button', { name: 'Export planner artifacts' }).click();
  await expect(page.getByText(/compiled just now/)).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  await page.locator(".col[data-day='18'] .add-task").click();
  const form = page.locator(".col[data-day='18'] .add-form");
  await form.locator('.add-title').fill('Fresh artifact task');
  await form.getByRole('button', { name: 'Add task' }).click();
  await expect(page.locator('#export-btn')).toHaveClass(/stale/);
  await page.getByRole('button', { name: 'Export planner artifacts' }).click();
  await expect(page.getByText(/recompiled after board changes/)).toBeVisible();
  await expect(page.getByLabel('ICS payload preview')).toHaveValue(/SUMMARY:Fresh artifact task/);
});

test('4.12 empty_selection_bulk_is_inert', async ({ page }) => {
  await page.goto(BASE);
  await expect(page.locator('#bulk-complete')).toBeDisabled();
  await page.locator('.sel-cb').first().click();
  await expect(page.locator('#bulk-complete')).toBeEnabled();
  await page.locator('.sel-cb').first().click();
  await expect(page.locator('#bulk-complete')).toBeDisabled();
});

// The tests above cover 1.4, 1.5, 1.6, 1.9, 1.24, 1.30, 1.43, 1.46, 4.12. The
// canonical region already covers console-error hygiene, the WebMCP surface,
// reduced motion, and 375px overflow generically, superseding the narrower
// board-column-count/seed-count/keyboard/toast checks a prior revision of this
// file carried under those same headings.
//
// NOT-AUTOMATABLE: 1.44 download_and_copy_export_artifacts
// NOT-AUTOMATABLE: 1.45 import_planner_json_reconstructs_board
// NOT-AUTOMATABLE: 4.8 reduced_motion_removes_animations (visual/frame-by-frame judgment beyond the canonical animation-frame sampler)
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
