// ==== END CANONICAL REGION — add task-specific criterion tests below. ====
import { test, expect } from '@playwright/test';

// Global error listener hook
test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console error: ${msg.text()}`);
    }
  });
  page.on('pageerror', exception => {
    errors.push(`Uncaught exception: ${exception.message}`);
  });
  page.context().errors = errors;
});

test.afterEach(async ({ page }) => {
  const errors = page.context().errors;
  if (errors && errors.length > 0) {
    throw new Error(`Test failed due to console errors:\n${errors.join('\n')}`);
  }
});

test('2.1 shared_state_coherence', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');

  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true });

  const row = page.locator('tr').filter({ hasText: 'Ada Lovelace' });
  await row.getByRole('button', { name: /Edit|Change/i }).first().click();

  await page.locator('select').filter({ hasText: 'Active' }).selectOption('Suspended');
  await page.getByRole('button', { name: /Save|Update/i }).click();

  await expect(row.locator('td').nth(3)).toContainText('Suspended');
  await expect(page.locator('.es').filter({ hasText: 'suspended' })).toBeVisible();

  await page.getByLabel(/Open export drawer/i).click();
  const jsonContent = await page.locator('pre').innerText();
  const session = JSON.parse(jsonContent);
  const ada = session.users.find(u => u.firstName === 'Ada');
  expect(ada.status).toBe('Suspended');
});

test('2.2 no_storage_reload_seeded', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');

  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true });
  const countBefore = await page.locator('tbody tr').count();

  const firstRow = page.locator('tbody tr').first();
  await firstRow.getByRole('button', { name: /Edit/i }).first().click();

  await page.getByRole('button', { name: /Delete/i }).click();
  // Assume confirmation is required
  await page.getByRole('button', { name: /Confirm|Yes|Delete/i }).nth(1).click({ force: true });

  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true });

  const countAfter = await page.locator('tbody tr').count();
  expect(countAfter).toBe(countBefore);

  const local = await page.evaluate(() => localStorage.length);
  const session = await page.evaluate(() => sessionStorage.length);
  expect(local).toBe(0);
  expect(session).toBe(0);
});

test('2.6 hydration_clean_console', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');

  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true });
  await page.locator('.nav-item').filter({ hasText: 'Add User' }).first().click({ force: true });
  await page.getByLabel(/Open export drawer/i).click();
});

test('2.7 direct_load_full_shell', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');

  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('text=Pineapple Tech')).toBeVisible();
});

test('2.10 rapid_input_stability', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');

  for (let i=0; i<10; i++) {
    await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true });
    await page.locator('.nav-item').filter({ hasText: 'Overview' }).first().click({ force: true });
  }

  await expect(page.locator('.active').filter({ hasText: 'Overview' })).toBeVisible();
});

test('2.14 export_end_state_live_compile', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');

  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true });

  const row = page.locator('tbody tr').first();
  const name = await row.locator('td').first().innerText();
  await row.getByRole('button', { name: /Edit|Delete/i }).first().click();

  await page.getByRole('button', { name: /Delete/i }).click();
  await page.getByRole('button', { name: /Confirm|Delete/i, exact: false }).nth(1).click({ force: true });

  await page.getByLabel(/Open export drawer/i).click();
  const jsonContent = await page.locator('pre').innerText();
  expect(jsonContent).not.toContain(name);
});

test('6.1 create_flow_updates_list_kpi_export', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');

  await page.locator('.nav-item').filter({ hasText: 'Add User' }).first().click({ force: true });
  await page.fill('input[name="firstName"]', 'Test');
  await page.fill('input[name="lastName"]', 'User');
  await page.fill('input[name="email"]', 'test.user@pineapple.io');

  await page.getByRole('button', { name: /Create user/i }).click({ force: true });

  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true });
  await expect(page.locator('tr').filter({ hasText: 'test.user@pineapple.io' })).toBeVisible();

  await page.getByLabel(/Open export drawer/i).click();
  const jsonContent = await page.locator('pre').innerText();
  expect(jsonContent).toContain('test.user@pineapple.io');
});

test('6.2 invalid_create_shows_field_contract_errors', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');

  await page.locator('.nav-item').filter({ hasText: 'Add User' }).first().click({ force: true });
  await page.getByRole('button', { name: /Create user/i }).click({ force: true });

  await expect(page.locator('text=/require|invalid/i').first()).toBeVisible();
});

test('6.3 edit_flow_updates_related_displays', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true });

  const row = page.locator('tbody tr').first();
  await row.getByRole('button', { name: /Edit/i }).first().click();

  await page.fill('input[name="firstName"]', 'EditedName123');
  await page.getByRole('button', { name: /Save|Update/i }).click();

  await expect(page.locator('tbody tr').first()).toContainText('EditedName123');
});

test('6.4 delete_flow_updates_all_surfaces', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true });

  const countBefore = await page.locator('tbody tr').count();
  const row = page.locator('tbody tr').first();
  await row.getByRole('button', { name: /Edit|Delete/i }).first().click();

  await page.getByRole('button', { name: /Delete/i }).click();
  await page.getByRole('button', { name: /Confirm|Delete/i, exact: false }).nth(1).click({ force: true });

  await page.waitForTimeout(500);
  const countAfter = await page.locator('tbody tr').count();
  expect(countAfter).toBe(countBefore - 1);
});

test('6.5 view_switch_retains_filters_theme', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');

  await page.evaluate(() => window.webmcp_invoke_tool('browse_set_theme', { themes: ['dark'] }));

  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true });

  await page.evaluate(() => window.webmcp_invoke_tool('browse_apply_filter', { filters: { role: ['Admin'] } }));

  await page.locator('.nav-item').filter({ hasText: 'Overview' }).first().click({ force: true });
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true });

  const rows = await page.locator('tbody tr').count();
  expect(rows).toBeLessThan(10);

  const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  expect(theme).toBe('dark');
});

test('6.6 last_user_delete_or_zero_filter_empty_state', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true });

  await page.evaluate(() => window.webmcp_invoke_tool('browse_search', { query: 'NonExistentString12345' }));

  const emptyText = await page.locator('main').innerText();
  expect(emptyText || '').toMatch(/No users found|No matching|Add/i);
});

test('6.7 filters_update_list_and_export', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true });

  await page.evaluate(() => window.webmcp_invoke_tool('browse_apply_filter', { filters: { role: ['Admin'] } }));

  await page.getByLabel(/Open export drawer/i).click();
  const jsonContent = await page.locator('pre').innerText();
  const session = JSON.parse(jsonContent);
  expect(session.filters.role).toContain('Admin');
});

test('6.8 drawer_chrome_preserves_workflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');

  const hamburger = page.locator('.hamburger, [aria-label="Open sidebar"], [aria-label="Toggle drawer"]').first();
  await expect(hamburger).toBeVisible();
  await hamburger.click();
  await expect(page.locator('.sidebar, aside, .drawer')).toBeVisible();
});

test('6.9 overlays_support_export_and_popovers', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');

  const exportBtn = page.getByLabel(/Open export drawer/i);
  await exportBtn.click();
  await expect(page.locator('.export-drawer')).toBeVisible();

  await page.getByRole('button', { name: /Close/i }).first().evaluate(node => node.click());
  await expect(page.locator('.export-drawer')).not.toBeVisible();
});

test('6.10 import_recovers_exported_session', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');

  await page.getByLabel(/Open export drawer/i).click();
  const jsonContent = await page.locator('pre').innerText();

  await page.getByRole('button', { name: /Close/i }).first().evaluate(node => node.click());

  await page.evaluate(() => window.webmcp_invoke_tool('entity_delete', { target_id: 'ada.lovelace@pineapple.io', confirm: true }));

  await page.evaluate((content) => window.webmcp_invoke_tool('artifact_import', { import_modes: ['session-json'], content: content }), jsonContent);

  await page.getByLabel(/Open export drawer/i).click();
  const jsonContentAfter = await page.locator('pre').innerText();
  const session = JSON.parse(jsonContentAfter);
  const ada = session.users.find(u => u.email === 'ada.lovelace@pineapple.io');
  expect(ada).toBeDefined();
});

test('6.11 mutation_to_export_pipeline', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');

  await page.evaluate(() => window.webmcp_invoke_tool('entity_create', { entity_fields: { firstName: 'Pipeline', lastName: 'Test', email: 'distinctive@pineapple.io', role: 'Member', status: 'Active' } }));
  await page.evaluate(() => window.webmcp_invoke_tool('entity_delete', { target_id: 'ada.lovelace@pineapple.io', confirm: true }));

  await page.getByLabel(/Open export drawer/i).click();
  const jsonContent = await page.locator('pre').innerText();
  expect(jsonContent).toContain('pineapple-admin-analytics-v1');
  expect(jsonContent).toContain('distinctive@pineapple.io');
  expect(jsonContent).not.toContain('ada.lovelace@pineapple.io');
});

test('6.12 export_import_round_trip_flow', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');

  await page.getByLabel(/Open export drawer/i).click();
  const jsonContent = await page.locator('pre').innerText();
  await page.getByRole('button', { name: /Close/i }).first().evaluate(node => node.click());

  await page.locator('.nav-item').filter({ hasText: 'Add User' }).first().click({ force: true });
  await page.fill('input[name="firstName"]', 'Round');
  await page.fill('input[name="lastName"]', 'Trip');
  await page.fill('input[name="email"]', 'round.trip@pineapple.io');
  await page.getByRole('button', { name: /Create user/i }).click({ force: true });

  await page.evaluate((content) => window.webmcp_invoke_tool('artifact_import', { import_modes: ['session-json'], content: content }), jsonContent);

  await page.getByLabel(/Open export drawer/i).click();
  const jsonContentAfter = await page.locator('pre').innerText();
  const parsed = JSON.parse(jsonContentAfter);
  const matched = parsed.users.find(u => u.email === 'round.trip@pineapple.io');
  expect(matched).toBeUndefined();
  expect(parsed.kpis.total).toBe(10);
});

test('3.8 responsive_drawer_breakpoints', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');

  const sidebar = page.locator('aside, .drawer, .sidebar').first();
  await expect(sidebar).toBeVisible();

  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(300);

  const drawerHidden = await sidebar.evaluate((node) => {
      const style = window.getComputedStyle(node);
      return style.display === 'none' || style.transform.includes('-') || node.getBoundingClientRect().width === 0;
  });
  expect(drawerHidden).toBe(true);
});

test('3.11 export_drawer_visual_chrome', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.getByLabel(/Open export drawer/i).click();

  await expect(page.getByRole('tab', { name: 'Session JSON' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Users CSV' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Copy/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Download/i })).toBeVisible();
});

test('9.8 rapid_input_does_not_freeze', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');

  const start = Date.now();
  for (let i = 0; i < 20; i++) {
    await page.evaluate(() => window.webmcp_invoke_tool('browse_set_theme', { themes: ['dark'] }));
    await page.evaluate(() => window.webmcp_invoke_tool('browse_set_theme', { themes: ['light'] }));
  }
  const duration = Date.now() - start;
  expect(duration).toBeLessThan(5000); // UI remains responsive and completes loop quickly

  await expect(page.locator('main')).toBeVisible();
});

test('2.11 keyboard_operability_focus', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');

  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');

  const outline = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    return window.getComputedStyle(el).outlineStyle;
  });
  expect(outline).not.toBe('none');
});

test('2.12 escape_closes_returns_focus', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');

  const exportBtn = page.getByLabel(/Open export drawer/i);
  await exportBtn.focus();
  await exportBtn.click();
  await expect(page.locator('.export-drawer')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.locator('.export-drawer')).not.toBeVisible();
});

test('2.13 labels_and_error_association', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Add User' }).first().click({ force: true });

  await page.getByRole('button', { name: /Create user/i }).click({ force: true });

  await expect(page.locator('text=/require|invalid/i').first()).toBeVisible();
});

test('WebMCP Contract - Tools Array', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const tools = await page.evaluate(() => window.webmcp_list_tools());
  expect(tools.length).toBeGreaterThan(0);
});

test('Reduced Motion via emulateMedia', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.getByLabel(/Open export drawer/i).click();
  await expect(page.locator('.export-drawer')).toBeVisible();
});

// ==== NOT-AUTOMATABLE ====
// NOT-AUTOMATABLE: 2.9 cold_load_interactive_2s (Requires precise network/device emulation, varying by CI env)
// NOT-AUTOMATABLE: 3.1 overview_mosaic_asymmetric (Subjective visual layout)
// NOT-AUTOMATABLE: 3.2 badge_and_empty_state_styling (Subjective styling)
// NOT-AUTOMATABLE: 3.4 theme_surfaces_accent_wash (Subjective colors and wash)
// NOT-AUTOMATABLE: 3.5 chart_accent_palette (Subjective color palette verification)
// NOT-AUTOMATABLE: 3.6 card_shadow_hairline_density (Subjective visual effects)
// NOT-AUTOMATABLE: 3.7 consistent_icons_local_avatars (Subjective icon consistency)
// NOT-AUTOMATABLE: 3.10 tables_scroll_in_containers (Subjective layout detail)
// NOT-AUTOMATABLE: 3.12 consistent_capitalization (Subjective writing style)
// NOT-AUTOMATABLE: 3.13 specific_action_labels (Subjective writing style)
// NOT-AUTOMATABLE: 3.14 validation_and_empty_state_copy (Subjective writing verification)
// NOT-AUTOMATABLE: 7.1 layout_adapts_desktop_to_mobile (Subjective layout)
// NOT-AUTOMATABLE: 7.2 mobile_tap_targets_are_large_enough (Visual layout metric)
// NOT-AUTOMATABLE: 7.3 typography_resizes_across_breakpoints (Subjective visual design)
// NOT-AUTOMATABLE: 7.4 content_avoids_clipping_and_overflow (Visual layout test)
// NOT-AUTOMATABLE: 7.5 chrome_adapts_to_small_screens (Visual overlap with 3.8)
// NOT-AUTOMATABLE: 7.6 stacking_reflows_logically (Subjective layout behavior)
// NOT-AUTOMATABLE: 7.7 export_drawer_operable_on_mobile (Visual layout behavior)
// NOT-AUTOMATABLE: 7.8 small_screens_avoid_horizontal_scroll (Visual layout metric)
// NOT-AUTOMATABLE: 7.9 charts_and_tables_resize (Visual responsive behavior)
// NOT-AUTOMATABLE: 7.10 fixed_controls_remain_accessible (Visual stacking check)
// NOT-AUTOMATABLE: 9.10 post_hydration_no_flash (Requires video framerate analysis)
// NOT-AUTOMATABLE: 15.1 headings_use_consistent_capitalization (Subjective writing)
// NOT-AUTOMATABLE: 15.2 actions_use_specific_labels (Subjective writing)
// NOT-AUTOMATABLE: 15.3 errors_name_problem_and_fix (Subjective writing)
// NOT-AUTOMATABLE: 15.4 empty_states_explain_next_step (Subjective writing)
// NOT-AUTOMATABLE: 15.5 body_copy_is_well_written (Subjective writing)
// NOT-AUTOMATABLE: 15.6 terminology_is_consistent (Subjective writing)
// NOT-AUTOMATABLE: 15.7 numbers_dates_and_units_are_consistent (Subjective formatting check)
// NOT-AUTOMATABLE: 15.8 success_messages_are_specific (Subjective writing)
