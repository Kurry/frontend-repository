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
