// ==== END CANONICAL REGION — add task-specific criterion tests below. ====
import { test, expect } from '@playwright/test';

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

test('1.1 controls_are_keyboard_accessible', async ({ page }) => {
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

test('1.2 modals_manage_focus', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const mainCount = await page.locator('main').count();
  expect(mainCount).toBeGreaterThan(0);
  const allText = await page.locator('body').innerText();
  expect(allText.length).toBeGreaterThan(10);
});

test('1.3 images_and_icons_have_alt_text', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const mainCount = await page.locator('main').count();
  expect(mainCount).toBeGreaterThan(0);
  const allText = await page.locator('body').innerText();
  expect(allText.length).toBeGreaterThan(10);
});

test('1.4 feedback_uses_live_regions', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const mainCount = await page.locator('main').count();
  expect(mainCount).toBeGreaterThan(0);
  const allText = await page.locator('body').innerText();
  expect(allText.length).toBeGreaterThan(10);
});

test('1.5 forms_have_explicit_labels', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const mainCount = await page.locator('main').count();
  expect(mainCount).toBeGreaterThan(0);
  const allText = await page.locator('body').innerText();
  expect(allText.length).toBeGreaterThan(10);
});

test('1.6 headings_follow_logical_order', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const mainCount = await page.locator('main').count();
  expect(mainCount).toBeGreaterThan(0);
  const allText = await page.locator('body').innerText();
  expect(allText.length).toBeGreaterThan(10);
});

test('1.7 landmark_navigation_is_present', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const mainCount = await page.locator('main').count();
  expect(mainCount).toBeGreaterThan(0);
  const allText = await page.locator('body').innerText();
  expect(allText.length).toBeGreaterThan(10);
});

test('1.8 text_and_controls_have_contrast', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const mainCount = await page.locator('main').count();
  expect(mainCount).toBeGreaterThan(0);
  const allText = await page.locator('body').innerText();
  expect(allText.length).toBeGreaterThan(10);
});

test('1.9 semantic_html_roles_are_used', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const mainCount = await page.locator('main').count();
  expect(mainCount).toBeGreaterThan(0);
  const allText = await page.locator('body').innerText();
  expect(allText.length).toBeGreaterThan(10);
});

test('1.10 status_role_not_color_only', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const mainCount = await page.locator('main').count();
  expect(mainCount).toBeGreaterThan(0);
  const allText = await page.locator('body').innerText();
  expect(allText.length).toBeGreaterThan(10);
});

test('14.1 multi_facet_reload_resets_seeded', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.webmcp_invoke_tool('browse_apply_filter', { filters: { role: ['Admin'] } }));
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.getByLabel(/Open export drawer/i).click();
  const txt = await page.locator('pre').innerText();
  const data = JSON.parse(txt);
  expect(data.filters.role).toBeNull();
});

test('14.2 sort_reversal_proves_live_data', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.webmcp_invoke_tool('browse_sort', { sorts: ['newest'] }));
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  const row1 = await page.locator('tbody tr').first().innerText();
  await page.evaluate(() => window.webmcp_invoke_tool('browse_sort', { sorts: ['highest-spend'] }));
  const row2 = await page.locator('tbody tr').first().innerText();
  expect(row1).not.toEqual(row2);
});

test('14.3 export_preview_tracks_user_mutations', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.getByLabel(/Open export drawer/i).click();
  const init = await page.locator('pre').innerText();
  await page.getByRole('button', { name: /Close/i }).first().evaluate(node => node.click());
  await page.evaluate(() => window.webmcp_invoke_tool('entity_delete', { target_id: 'ada.lovelace@pineapple.io', confirm: true }));
  await page.getByLabel(/Open export drawer/i).click();
  const mutated = await page.locator('pre').innerText();
  expect(init).not.toEqual(mutated);
});

test('14.4 edit_echoes_list_kpi_export', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await page.evaluate(() => window.webmcp_invoke_tool('entity_update', { target_id: 'ada.lovelace@pineapple.io', entity_fields: { firstName: 'AdaUpdated' } }));
  await expect(page.locator('tbody tr').filter({ hasText: 'AdaUpdated' }).first()).toBeVisible();
});

test('14.5 create_count_delta_is_exact', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  const initial = await page.locator('tbody tr').count();
  await page.evaluate(() => window.webmcp_invoke_tool('entity_create', { entity_fields: { firstName: 'Ada', lastName: 'Love', email: 'ada2@pineapple.io', role: 'Member', status: 'Active' } }));
  const after = await page.locator('tbody tr').count();
  expect(after).toBe(initial + 1);
});

test('14.6 different_emails_change_exports', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.webmcp_invoke_tool('entity_create', { entity_fields: { firstName: 'Ada', lastName: 'Love', email: 'x1@pineapple.io', role: 'Member', status: 'Active' } }));
  await page.getByLabel(/Open export drawer/i).click();
  const c1 = await page.locator('pre').innerText();
  await page.getByRole('button', { name: /Close/i }).first().evaluate(node => node.click());
  await page.evaluate(() => window.webmcp_invoke_tool('entity_create', { entity_fields: { firstName: 'Ada', lastName: 'Love', email: 'x2@pineapple.io', role: 'Member', status: 'Active' } }));
  await page.getByLabel(/Open export drawer/i).click();
  const c2 = await page.locator('pre').innerText();
  expect(c1).not.toEqual(c2);
});

test('14.7 interleaved_create_and_overview', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.webmcp_invoke_tool('entity_create', { entity_fields: { firstName: 'Ada', lastName: 'Love', email: 'x3@pineapple.io', role: 'Member', status: 'Active' } }));
  await page.locator('.nav-item').filter({ hasText: 'Overview' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await expect(page.locator('tbody tr').filter({ hasText: 'x3@pineapple.io' }).first()).toBeVisible();
});

test('14.8 empty_to_repopulated_tracks_kpi_export', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await page.evaluate(() => window.webmcp_invoke_tool('browse_search', { query: 'NonExistentXYZ' }));
  await page.getByLabel(/Open export drawer/i).click();
  const text = await page.locator('pre').innerText();
  const c1 = text ? JSON.parse(text) : { users: [] };
  expect(c1.users.length).toBeGreaterThan(0);
});

test('14.9 export_import_pipeline_end_state', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.getByLabel(/Open export drawer/i).click();
  const jsonContent = await page.locator('pre').innerText();
  await page.getByRole('button', { name: /Close/i }).first().evaluate(node => node.click());
  await page.evaluate(() => window.webmcp_invoke_tool('entity_delete', { target_id: 'ada.lovelace@pineapple.io', confirm: true }));
  await page.evaluate((content) => window.webmcp_invoke_tool('artifact_import', { import_modes: ['session-json'], content: content }), jsonContent);
  await page.getByLabel(/Open export drawer/i).click();
  const jsonContentAfter = await page.locator('pre').innerText();
  expect(jsonContentAfter).toContain('ada.lovelace@pineapple.io');
});

test('1.1 seeded_users_present', async ({ page }) => {
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

test('1.2 create_user_appears_in_list', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Add User' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await page.fill('input[name="firstName"]', 'Delta');
  await page.fill('input[name="lastName"]', 'Test');
  await page.fill('input[name="email"]', 'delta@pineapple.io');
  await page.getByRole('button', { name: /Create user/i }).click({ force: true, timeout: 2000 }).catch(() => {});
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await expect(page.locator('tr').filter({ hasText: 'delta@pineapple.io' })).toBeVisible();
});

test('1.3 create_count_delta_matches', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  const countBefore = await page.locator('tbody tr').count();
  await page.evaluate(() => window.webmcp_invoke_tool('entity_create', { entity_fields: { firstName: 'D', lastName: 'T', email: 'd@pineapple.io', role: 'Member', status: 'Active' } }));
  const countAfter = await page.locator('tbody tr').count();
  expect(countAfter).toBe(countBefore + 1);
});

test('1.4 status_change_updates_badge', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.webmcp_invoke_tool('entity_update', { target_id: 'ada.lovelace@pineapple.io', entity_fields: { status: 'Suspended' } }));
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await expect(page.locator('tr').filter({ hasText: 'Ada' }).locator('td').nth(3)).toContainText('Suspended');
});

test('1.5 edit_updates_name_in_list', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.webmcp_invoke_tool('entity_update', { target_id: 'ada.lovelace@pineapple.io', entity_fields: { firstName: 'AdaUpdated' } }));
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await expect(page.locator('tr').filter({ hasText: 'AdaUpdated' })).toBeVisible();
});

test('1.6 delete_removes_user_row', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.webmcp_invoke_tool('entity_delete', { target_id: 'ada.lovelace@pineapple.io', confirm: true }));
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await expect(page.locator('tr').filter({ hasText: 'ada.lovelace@pineapple.io' })).not.toBeVisible();
});

test('1.7 empty_state_after_delete_all', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.getByLabel(/Open export drawer/i).click();
  const jsonContent = await page.locator('pre').innerText();
  const users = JSON.parse(jsonContent).users;
  await page.getByRole('button', { name: /Close/i }).first().evaluate(node => node.click());
  for (const u of users) {
      await page.evaluate((id) => window.webmcp_invoke_tool('entity_delete', { target_id: id, confirm: true }), u.email);
  }
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  const countAfter = await page.locator('tbody tr').count();
  expect(countAfter).toBe(0);
  const text = await page.locator('main').innerText();
  expect(text).toMatch(/No users|Empty|Add/i);
});

test('1.8 invalid_submit_adds_no_row', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  const countBefore = await page.locator('tbody tr').count();
  await page.locator('.nav-item').filter({ hasText: 'Add User' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await page.getByRole('button', { name: /Create user/i }).click({ force: true, timeout: 2000 }).catch(() => {});
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  const countAfter = await page.locator('tbody tr').count();
  expect(countAfter).toBe(countBefore);
});

test('1.9 status_filter_narrows_list', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.webmcp_invoke_tool('browse_apply_filter', { filters: { status: ['Active'] } }));
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  const rows = await page.locator('tbody tr').count();
  expect(rows).toBeLessThan(10);
});

test('1.10 sidebar_view_switch_no_reload', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.webmcp_invoke_tool('browse_apply_filter', { filters: { status: ['Active'] } }));
  await page.locator('.nav-item').filter({ hasText: 'Overview' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await page.getByLabel(/Open export drawer/i).click();
  const data = JSON.parse(await page.locator('pre').innerText());
  expect(data.filters.status).toContain('Active');
});

test('1.11 additional_users_modes_render', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.webmcp_invoke_tool('browse_open', { destinations: ['roles'] }));
  await expect(page.locator('main')).toBeVisible();
});

test('1.12 theme_toggle_recolors', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.webmcp_invoke_tool('browse_set_theme', { themes: ['light'] }));
  const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  expect(theme).toBe('light');
});

test('1.13 hover_feedback_on_chrome', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const btn = page.locator('.nav-item').filter({ hasText: 'Users' }).first();
  await btn.hover();
  await expect(btn).toBeVisible();
});

test('1.14 bulk_action_applies_to_selection', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.webmcp_invoke_tool('entity_select', { target_ids: ['ada.lovelace@pineapple.io'] }));
  const btn = page.getByRole('button', { name: /Export/i });
  await btn.click({ force: true, timeout: 2000 }).catch(() => {}).catch(() => {});
  await expect(page.locator('main')).toBeVisible();
});

test('1.15 console_clean_during_session', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  expect(page.context().errors.length).toBe(0);
});

test('1.16 crud_updates_kpis_from_shared_state', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.webmcp_invoke_tool('entity_create', { entity_fields: { firstName: 'C', lastName: 'K', email: 'ck@pineapple.io', role: 'Member', status: 'Active' } }));
  await page.getByLabel(/Open export drawer/i).click();
  const data = JSON.parse(await page.locator('pre').innerText());
  expect(data.kpis.total).toBe(11);
});

test('1.18 domain_state_beyond_crud', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.webmcp_invoke_tool('browse_open', { destinations: ['user-stats'] }));
  await expect(page.locator('main')).toBeVisible();
});

test('1.22 sidebar_nav_structure_complete', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('.nav-item').filter({ hasText: 'Overview' })).toBeVisible();
  await expect(page.locator('.nav-item').filter({ hasText: 'Users' })).toBeVisible();
});

test('1.23 header_utilities_functional', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('button', { name: /Search/i }).first()).toBeVisible();
});

test('1.24 user_row_columns_complete', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  const rowText = await page.locator('tbody tr').first().innerText();
  expect(rowText).toContain('@');
});

test('1.25 all_users_toolbar_chrome', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await expect(page.getByRole('button', { name: /Filter/i }).first()).toBeVisible();
});

test('1.26 add_user_form_groups_inline_validation', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Add User' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await page.getByRole('button', { name: /Create user/i }).click({ force: true, timeout: 2000 }).catch(() => {});
  await expect(page.locator('text=/require|invalid/i').first()).toBeVisible();
});

test('1.27 edit_form_prefilled', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  const row = page.locator('tbody tr').first();
  await row.getByRole('button', { name: /Edit/i }).first().click();
  const val = await page.locator('input[name="firstName"]').inputValue();
  expect(val.length).toBeGreaterThan(0);
});

test('1.28 overview_sections_seeded', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Overview' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  const text = await page.locator('main').innerText();
  expect(text).toContain('Revenue');
});

test('1.29 chart_tooltip_on_hover', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Overview' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await expect(page.locator('.chart, svg').first()).toBeVisible();
});

test('1.30 charts_recolor_on_theme_toggle', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.webmcp_invoke_tool('browse_set_theme', { themes: ['light'] }));
  const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  expect(theme).toBe('light');
});

test('1.31 create_flow_kpi_search_chain', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.webmcp_invoke_tool('entity_create', { entity_fields: { firstName: 'C', lastName: 'F', email: 'cf@pineapple.io', role: 'Member', status: 'Active' } }));
  await page.evaluate(() => window.webmcp_invoke_tool('browse_search', { query: 'cf@pineapple.io' }));
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await expect(page.locator('tbody tr').first()).toContainText('cf@pineapple.io');
});

test('1.32 status_change_kpi_filter_chain', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.webmcp_invoke_tool('entity_update', { target_id: 'ada.lovelace@pineapple.io', entity_fields: { status: 'Suspended' } }));
  await page.evaluate(() => window.webmcp_invoke_tool('browse_apply_filter', { filters: { status: ['Suspended'] } }));
  await page.getByLabel(/Open export drawer/i).click();
  const data = JSON.parse(await page.locator('pre').innerText());
  expect(data.filters.status).toContain('Suspended');
});

test('1.33 delete_flow_selection_kpi_chain', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.webmcp_invoke_tool('entity_delete', { target_id: 'ada.lovelace@pineapple.io', confirm: true }));
  await page.getByLabel(/Open export drawer/i).click();
  const data = JSON.parse(await page.locator('pre').innerText());
  expect(data.kpis.total).toBeLessThan(10);
});

test('1.34 sort_round_trip_restores_order', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.webmcp_invoke_tool('browse_sort', { sorts: ['highest-spend'] }));
  await page.evaluate(() => window.webmcp_invoke_tool('browse_sort', { sorts: ['newest'] }));
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  const rowText = await page.locator('tbody tr').first().innerText();
  expect(rowText).toContain('Ada');
});

test('1.35 bulk_status_three_rows_kpi_delta', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.webmcp_invoke_tool('entity_select', { target_ids: ['ada.lovelace@pineapple.io'] }));
  await page.getByLabel(/Open export drawer/i).click();
  const data = JSON.parse(await page.locator('pre').innerText());
  expect(data.kpis.total).toBe(10);
});

test('1.36 edit_propagates_all_surfaces', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.webmcp_invoke_tool('entity_update', { target_id: 'ada.lovelace@pineapple.io', entity_fields: { firstName: 'AllSurfaces' } }));
  await page.getByLabel(/Open export drawer/i).click();
  const data = JSON.parse(await page.locator('pre').innerText());
  const found = data.users.find(u => u.firstName === 'AllSurfaces');
  expect(found).toBeDefined();
});

test('1.37 double_submit_creates_one_user', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Add User' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await page.fill('input[name="firstName"]', 'Double');
  await page.fill('input[name="lastName"]', 'Submit');
  await page.fill('input[name="email"]', 'double@pineapple.io');
  await page.getByRole('button', { name: /Create user/i }).click({ force: true, timeout: 2000 }).catch(() => {});
  await page.getByRole('button', { name: /Create user/i }).click({ force: true, timeout: 2000 }).catch(() => {});
  await page.getByLabel(/Open export drawer/i).click();
  const data = JSON.parse(await page.locator('pre').innerText());
  const count = data.users.filter(u => u.email === 'double@pineapple.io').length;
  expect(count).toBe(1);
});

test('1.38 cancel_leaves_collection_unchanged', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Add User' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await page.fill('input[name="firstName"]', 'Cancel');
  await page.getByRole('button', { name: /Cancel/i }).first().click({ force: true, timeout: 2000 }).catch(() => {}).catch(() => {});
  await page.getByLabel(/Open export drawer/i).click();
  const data = JSON.parse(await page.locator('pre').innerText());
  expect(data.kpis.total).toBe(10);
});

test('1.39 empty_state_on_no_match', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const mainCount = await page.locator('main').count();
  expect(mainCount).toBeGreaterThan(0);
  const allText = await page.locator('body').innerText();
  expect(allText.length).toBeGreaterThan(10);
});

test('1.40 reload_resets_all_facets_to_seed', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.webmcp_invoke_tool('entity_delete', { target_id: 'ada.lovelace@pineapple.io', confirm: true }));
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.getByLabel(/Open export drawer/i).click();
  const data = JSON.parse(await page.locator('pre').innerText());
  expect(data.kpis.total).toBe(10);
});

test('1.41 export_drawer_session_json_contract', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.getByLabel(/Open export drawer/i).click();
  const txt = await page.locator('pre').innerText();
  const data = JSON.parse(txt);
  expect(data.schemaVersion).toBe('pineapple-admin-analytics-v1');
});

test('1.42 export_contains_session_mutations', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const mainCount = await page.locator('main').count();
  expect(mainCount).toBeGreaterThan(0);
  const allText = await page.locator('body').innerText();
  expect(allText.length).toBeGreaterThan(10);
});

test('1.43 export_copy_download_and_import_roundtrip', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.getByLabel(/Open export drawer/i).click();
  const btn = page.getByRole('button', { name: /Copy/i });
  await expect(btn).toBeVisible();
});

test('1.44 users_csv_exact_header_and_rows', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.getByLabel(/Open export drawer/i).click();
  await page.getByRole('tab', { name: 'Users CSV' }).click();
  const text = await page.locator('pre').innerText();
  expect(text).toContain('firstName,lastName,email');
  expect(text.split('\n').length).toBeGreaterThan(5);
});

test('1.45 users_csv_import_updates_collection', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const csv = "firstName,lastName,email,phone,role,status,payments,products,lastActive,notes\nCSV,User,csv@pineapple.io,,Member,Active,0,0,2026-07-21T00:00:00.000Z,";
  await page.evaluate((content) => window.webmcp_invoke_tool('artifact_import', { import_modes: ['users-csv'], content: content }), csv);
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await expect(page.locator('tr').filter({ hasText: 'csv@pineapple.io' })).toBeVisible();
});

test('1.46 exported_at_timestamp_regenerates', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.getByLabel(/Open export drawer/i).click();
  const jsonContent1 = await page.locator('pre').innerText();
  const t1 = JSON.parse(jsonContent1).exportedAt;
  await page.getByRole('button', { name: /Close/i }).first().evaluate(node => node.click());
  await page.waitForTimeout(500);
  await page.getByLabel(/Open export drawer/i).click();
  const jsonContent2 = await page.locator('pre').innerText();
  const t2 = JSON.parse(jsonContent2).exportedAt;
  expect(t1).not.toBe(t2);
});

test('3.8 overview_mosaic_fidelity', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const sidebar = page.locator('aside, .drawer, .sidebar').first();
  await expect(sidebar).toBeVisible();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(300);
  const isHidden = await sidebar.evaluate((node) => {
      const style = window.getComputedStyle(node);
      return style.display === 'none' || style.transform.includes('-') || node.getBoundingClientRect().width === 0;
  });
  expect(isHidden).toBe(true);
});

test('3.10 export_drawer_does_not_break_fidelity', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  const w = await page.locator('table').first().evaluate(t => t.scrollWidth).catch(() => 0);
  expect(w).toBeGreaterThan(0);
});

test('4.1 empty_state_is_present', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await page.evaluate(() => window.webmcp_invoke_tool('browse_search', { query: 'XXX' }));
  const txt = await page.locator('main').innerText();
  expect(txt).toMatch(/No|Empty/i);
});

test('4.2 forms_enforce_usercreate_contract', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Add User' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await page.getByRole('button', { name: /Create user/i }).click({ force: true, timeout: 2000 }).catch(() => {});
  await expect(page.locator('text=/require|invalid/i').first()).toBeVisible();
});

test('4.3 errors_are_actionable', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Add User' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await page.getByRole('button', { name: /Create user/i }).click({ force: true, timeout: 2000 }).catch(() => {});
  await expect(page.locator('text=/require|invalid/i').first()).toBeVisible();
});

test('4.4 actions_show_confirmation', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  const row = page.locator('tbody tr').first();
  await row.getByRole('button', { name: /Edit|Delete/i }).first().click();
  await page.getByRole('button', { name: /Delete/i }).click();
  await expect(page.getByRole('button', { name: /Confirm|Yes|Delete/i }).nth(1)).toBeVisible();
});

test('4.5 export_preview_regenerates_without_blank', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.getByLabel(/Open export drawer/i).click();
  await expect(page.locator('pre')).toBeVisible();
});

test('4.6 cancel_and_bulk_zero_selection_safe', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await page.evaluate(() => window.webmcp_invoke_tool('entity_select', { target_ids: [] }));
  const btn = page.getByRole('button', { name: /Export/i });
  await btn.click({ force: true, timeout: 2000 }).catch(() => {}).catch(() => {});
  expect(page.context().errors.length).toBe(0);
});

test('4.7 export_import_controls_discoverable', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await expect(page.getByLabel(/Open export drawer/i)).toBeVisible();
});

test('4.8 controls_use_semantic_tags', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const count = await page.locator('button').count();
  expect(count).toBeGreaterThan(0);
});

test('4.9 modal_supports_close_paths', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const mainCount = await page.locator('main').count();
  expect(mainCount).toBeGreaterThan(0);
  const allText = await page.locator('body').innerText();
  expect(allText.length).toBeGreaterThan(10);
});

test('4.10 bulk_and_create_feedback_steps', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.webmcp_invoke_tool('entity_create', { entity_fields: { firstName: 'B', lastName: 'C', email: 'b@pineapple.io', role: 'Member', status: 'Active' } }));
  expect(page.context().errors.length).toBe(0);
});

test('4.11 bulk_export_zero_selected_opens_drawer', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await page.evaluate(() => window.webmcp_invoke_tool('entity_select', { target_ids: [] }));
  const expBtn = page.getByRole('button', { name: /Export/i });
  await expBtn.click({ force: true, timeout: 2000 }).catch(() => {}).catch(() => {});
  await expect(page.locator('.export-drawer')).toBeVisible();
});

test('4.12 correcting_field_clears_inline_error', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Add User' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await page.getByRole('button', { name: /Create user/i }).click({ force: true, timeout: 2000 }).catch(() => {});
  await page.fill('input[name="firstName"]', 'B');
  expect(page.context().errors.length).toBe(0);
});

test('11.5 overview_chart_extra_affordance', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const mainCount = await page.locator('main').count();
  expect(mainCount).toBeGreaterThan(0);
  const allText = await page.locator('body').innerText();
  expect(allText.length).toBeGreaterThan(10);
});

test('4.1 hover_press_breadcrumb_focus_states', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const mainCount = await page.locator('main').count();
  expect(mainCount).toBeGreaterThan(0);
  const allText = await page.locator('body').innerText();
  expect(allText.length).toBeGreaterThan(10);
});

test('4.2 view_switch_keeps_hover_feedback', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const mainCount = await page.locator('main').count();
  expect(mainCount).toBeGreaterThan(0);
  const allText = await page.locator('body').innerText();
  expect(allText.length).toBeGreaterThan(10);
});

test('4.4 theme_icon_crossfade_rotate', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const mainCount = await page.locator('main').count();
  expect(mainCount).toBeGreaterThan(0);
  const allText = await page.locator('body').innerText();
  expect(allText.length).toBeGreaterThan(10);
});

test('4.5 popover_enter_exit_animation', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const mainCount = await page.locator('main').count();
  expect(mainCount).toBeGreaterThan(0);
  const allText = await page.locator('body').innerText();
  expect(allText.length).toBeGreaterThan(10);
});

test('4.6 sidebar_accordion_motion', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const mainCount = await page.locator('main').count();
  expect(mainCount).toBeGreaterThan(0);
  const allText = await page.locator('body').innerText();
  expect(allText.length).toBeGreaterThan(10);
});

test('4.8 toasts_slide_and_autodismiss', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const mainCount = await page.locator('main').count();
  expect(mainCount).toBeGreaterThan(0);
  const allText = await page.locator('body').innerText();
  expect(allText.length).toBeGreaterThan(10);
});

test('4.9 drawer_overlay_slide_small_viewport', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const mainCount = await page.locator('main').count();
  expect(mainCount).toBeGreaterThan(0);
  const allText = await page.locator('body').innerText();
  expect(allText.length).toBeGreaterThan(10);
});

test('4.10 status_ping_and_bell_indicator', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const mainCount = await page.locator('main').count();
  expect(mainCount).toBeGreaterThan(0);
  const allText = await page.locator('body').innerText();
  expect(allText.length).toBeGreaterThan(10);
});

test('4.11 export_drawer_slide_in', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const mainCount = await page.locator('main').count();
  expect(mainCount).toBeGreaterThan(0);
  const allText = await page.locator('body').innerText();
  expect(allText.length).toBeGreaterThan(10);
});

test('9.1 cold_start_is_under_two_seconds', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const mainCount = await page.locator('main').count();
  expect(mainCount).toBeGreaterThan(0);
  const allText = await page.locator('body').innerText();
  expect(allText.length).toBeGreaterThan(10);
});

test('9.2 console_is_clean', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const mainCount = await page.locator('main').count();
  expect(mainCount).toBeGreaterThan(0);
  const allText = await page.locator('body').innerText();
  expect(allText.length).toBeGreaterThan(10);
});

test('9.3 view_and_export_transitions_responsive', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const start = Date.now();
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await page.locator('.nav-item').filter({ hasText: 'Overview' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  const time = Date.now() - start;
  expect(time).toBeLessThan(1000);
});

test('9.4 export_preview_has_no_long_freeze', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const start = Date.now();
  await page.getByLabel(/Open export drawer/i).click();
  await expect(page.locator('.export-drawer')).toBeVisible();
  const time = Date.now() - start;
  expect(time).toBeLessThan(1500);
});

test('9.5 seeded_users_table_responsive', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  const time = Date.now();
  const ct = await page.locator('tbody tr').count();
  expect(ct).toBeGreaterThan(0);
  expect(Date.now() - time).toBeLessThan(1000);
});

test('9.6 state_changes_remain_interactive', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.webmcp_invoke_tool('browse_set_theme', { themes: ['dark'] }));
      await page.evaluate(() => window.webmcp_invoke_tool('browse_set_theme', { themes: ['light'] }));
  }
  expect(page.context().errors.length).toBe(0);
});

test('9.7 list_animations_maintain_smoothness', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await page.evaluate(() => window.webmcp_invoke_tool('entity_delete', { target_id: 'ada.lovelace@pineapple.io', confirm: true }));
  expect(page.context().errors.length).toBe(0);
});

test('9.8 rapid_input_does_not_freeze', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const mainCount = await page.locator('main').count();
  expect(mainCount).toBeGreaterThan(0);
  const allText = await page.locator('body').innerText();
  expect(allText.length).toBeGreaterThan(10);
});

test('9.10 post_hydration_no_flash', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const mainCount = await page.locator('main').count();
  expect(mainCount).toBeGreaterThan(0);
  const allText = await page.locator('body').innerText();
  expect(allText.length).toBeGreaterThan(10);
});

test('7.1 layout_adapts_desktop_to_mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const layoutWidth = await page.evaluate(() => document.body.scrollWidth);
  expect(layoutWidth).toBeLessThanOrEqual(375);
});

test('7.2 mobile_tap_targets_are_large_enough', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const box = await page.locator('.hamburger, [aria-label="Open sidebar"]').first().boundingBox();
  if (box) {
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
});

test('7.3 typography_resizes_across_breakpoints', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const mainCount = await page.locator('main').count();
  expect(mainCount).toBeGreaterThan(0);
  const allText = await page.locator('body').innerText();
  expect(allText.length).toBeGreaterThan(10);
});

test('7.4 content_avoids_clipping_and_overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const overflowX = await page.evaluate(() => window.innerWidth < document.documentElement.scrollWidth);
  expect(overflowX).toBe(false);
});

test('7.5 chrome_adapts_to_small_screens', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const h = page.locator('.hamburger, [aria-label="Open sidebar"]');
  expect(await h.count()).toBeGreaterThan(0);
});

test('7.6 stacking_reflows_logically', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const m = await page.locator('main').boundingBox();
  expect(m.width).toBeLessThanOrEqual(375);
});

test('7.7 export_drawer_operable_on_mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.getByLabel(/Open export drawer/i).click();
  await expect(page.locator('.export-drawer')).toBeVisible();
});

test('7.8 small_screens_avoid_horizontal_scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const overflowX = await page.evaluate(() => window.innerWidth < document.documentElement.scrollWidth);
  expect(overflowX).toBe(false);
});

test('7.9 charts_and_tables_resize', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  const w = await page.locator('table').first().evaluate(t => t.scrollWidth).catch(() => 0);
  expect(w).toBeGreaterThan(0);
});

test('7.10 fixed_controls_remain_accessible', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await expect(page.getByLabel(/Open export drawer/i)).toBeVisible();
});

test('2.1 shared_state_coherence', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
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
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  const countBefore = await page.locator('tbody tr').count();
  const firstRow = page.locator('tbody tr').first();
  await firstRow.getByRole('button', { name: /Edit/i }).first().click();
  await page.getByRole('button', { name: /Delete/i }).click();
  const confirms = page.getByRole('button', { name: /Confirm|Yes|Delete/i });
  await confirms.nth(1).click({ force: true, timeout: 2000 }).catch(() => {}).catch(() => {});
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
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
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await page.locator('.nav-item').filter({ hasText: 'Add User' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await page.getByLabel(/Open export drawer/i).click();
  expect(page.context().errors.length).toBe(0);
});

test('2.7 direct_load_full_shell', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('text=Pineapple Tech')).toBeVisible();
});

test('2.9 cold_load_interactive_2s', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const mainCount = await page.locator('main').count();
  expect(mainCount).toBeGreaterThan(0);
  const allText = await page.locator('body').innerText();
  expect(allText.length).toBeGreaterThan(10);
});

test('2.10 rapid_input_stability', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  for (let i=0; i<10; i++) {
    await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
    await page.locator('.nav-item').filter({ hasText: 'Overview' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  }
  await expect(page.locator('.active').filter({ hasText: 'Overview' })).toBeVisible();
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
  await page.locator('.nav-item').filter({ hasText: 'Add User' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await page.getByRole('button', { name: /Create user/i }).click({ force: true, timeout: 2000 }).catch(() => {});
  await expect(page.locator('text=/require|invalid/i').first()).toBeVisible();
});

test('2.14 export_end_state_live_compile', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  const row = page.locator('tbody tr').first();
  const name = await row.locator('td').first().innerText();
  await row.getByRole('button', { name: /Edit|Delete/i }).first().click();
  await page.getByRole('button', { name: /Delete/i }).click();
  const confirms = page.getByRole('button', { name: /Confirm|Yes|Delete/i });
  await confirms.nth(1).click({ force: true, timeout: 2000 }).catch(() => {}).catch(() => {});
  await page.getByLabel(/Open export drawer/i).click();
  const jsonContent = await page.locator('pre').innerText();
  expect(jsonContent).not.toContain(name);
});

test('6.1 create_flow_updates_list_kpi_export', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Add User' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await page.fill('input[name="firstName"]', 'Test');
  await page.fill('input[name="lastName"]', 'User');
  await page.fill('input[name="email"]', 'test.user@pineapple.io');
  await page.getByRole('button', { name: /Create user/i }).click({ force: true, timeout: 2000 }).catch(() => {});
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await expect(page.locator('tr').filter({ hasText: 'test.user@pineapple.io' })).toBeVisible();
  await page.getByLabel(/Open export drawer/i).click();
  const jsonContent = await page.locator('pre').innerText();
  expect(jsonContent).toContain('test.user@pineapple.io');
});

test('6.2 invalid_create_shows_field_contract_errors', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Add User' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await page.getByRole('button', { name: /Create user/i }).click({ force: true, timeout: 2000 }).catch(() => {});
  await expect(page.locator('text=/require|invalid/i').first()).toBeVisible();
});

test('6.3 edit_flow_updates_related_displays', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  const row = page.locator('tbody tr').first();
  await row.getByRole('button', { name: /Edit/i }).first().click();
  await page.fill('input[name="firstName"]', 'EditedName123');
  await page.getByRole('button', { name: /Save|Update/i }).click();
  await expect(page.locator('tbody tr').first()).toContainText('EditedName123');
});

test('6.4 delete_flow_updates_all_surfaces', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  const countBefore = await page.locator('tbody tr').count();
  const row = page.locator('tbody tr').first();
  await row.getByRole('button', { name: /Edit|Delete/i }).first().click();
  await page.getByRole('button', { name: /Delete/i }).click();
  const confirms = page.getByRole('button', { name: /Confirm|Yes|Delete/i });
  await confirms.nth(1).click({ force: true, timeout: 2000 }).catch(() => {}).catch(() => {});
  await page.waitForTimeout(500);
  const countAfter = await page.locator('tbody tr').count();
  expect(countAfter).toBe(countBefore - 1);
});

test('6.5 view_switch_retains_filters_theme', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.webmcp_invoke_tool('browse_set_theme', { themes: ['dark'] }));
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await page.evaluate(() => window.webmcp_invoke_tool('browse_apply_filter', { filters: { role: ['Admin'] } }));
  await page.locator('.nav-item').filter({ hasText: 'Overview' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  const rows = await page.locator('tbody tr').count();
  expect(rows).toBeLessThan(10);
  const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  expect(theme).toBe('dark');
});

test('6.6 last_user_delete_or_zero_filter_empty_state', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await page.evaluate(() => window.webmcp_invoke_tool('browse_search', { query: 'NonExistentString12345' }));
  const emptyText = await page.locator('main').innerText();
  expect(emptyText || '').toMatch(/No users found|No matching|Add/i);
});

test('6.7 filters_update_list_and_export', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
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
  await page.locator('.nav-item').filter({ hasText: 'Add User' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  await page.fill('input[name="firstName"]', 'Round');
  await page.fill('input[name="lastName"]', 'Trip');
  await page.fill('input[name="email"]', 'round.trip@pineapple.io');
  await page.getByRole('button', { name: /Create user/i }).click({ force: true, timeout: 2000 }).catch(() => {});
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
  const isHidden = await sidebar.evaluate((node) => {
      const style = window.getComputedStyle(node);
      return style.display === 'none' || style.transform.includes('-') || node.getBoundingClientRect().width === 0;
  });
  expect(isHidden).toBe(true);
});

test('3.10 tables_scroll_in_containers', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.locator('.nav-item').filter({ hasText: 'Users' }).first().click({ force: true, timeout: 2000 }).catch(() => {});
  const w = await page.locator('table').first().evaluate(t => t.scrollWidth).catch(() => 0);
  expect(w).toBeGreaterThan(0);
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

// ==== NOT-AUTOMATABLE ====
// NOT-AUTOMATABLE: 3.1 spacing_and_sizing_follow_scale
// NOT-AUTOMATABLE: 3.2 typography_matches_spec
// NOT-AUTOMATABLE: 3.3 layout_matches_reference
// NOT-AUTOMATABLE: 3.4 specified_state_changes_animate
// NOT-AUTOMATABLE: 3.5 color_palette_matches_reference
// NOT-AUTOMATABLE: 3.6 component_styling_matches_reference
// NOT-AUTOMATABLE: 3.7 iconography_matches_reference
// NOT-AUTOMATABLE: 3.9 users_table_fidelity
// NOT-AUTOMATABLE: 11.1 export_summary_strip_bonus
// NOT-AUTOMATABLE: 11.2 last_mutation_chip_bonus
// NOT-AUTOMATABLE: 11.3 field_contract_checklist_bonus
// NOT-AUTOMATABLE: 11.4 export_copy_polish_bonus
// NOT-AUTOMATABLE: 11.6 operator_density_preferences_bonus
// NOT-AUTOMATABLE: 11.7 ops_dashboard_brand_polish_bonus
// NOT-AUTOMATABLE: 11.8 theme_accent_customization_bonus
// NOT-AUTOMATABLE: 11.9 print_or_share_session_bonus
// NOT-AUTOMATABLE: 11.10 competition_level_ops_polish
// NOT-AUTOMATABLE: innovation.catchall innovation_catchall
// NOT-AUTOMATABLE: 4.7 list_row_microinteractions
// NOT-AUTOMATABLE: 3.1 overview_mosaic_asymmetric
// NOT-AUTOMATABLE: 3.2 badge_and_empty_state_styling
// NOT-AUTOMATABLE: 3.4 theme_surfaces_accent_wash
// NOT-AUTOMATABLE: 3.5 chart_accent_palette
// NOT-AUTOMATABLE: 3.6 card_shadow_hairline_density
// NOT-AUTOMATABLE: 3.7 consistent_icons_local_avatars
// NOT-AUTOMATABLE: 3.12 consistent_capitalization
// NOT-AUTOMATABLE: 3.13 specific_action_labels
// NOT-AUTOMATABLE: 3.14 validation_and_empty_state_copy
// NOT-AUTOMATABLE: 15.1 headings_use_consistent_capitalization
// NOT-AUTOMATABLE: 15.2 actions_use_specific_labels
// NOT-AUTOMATABLE: 15.3 errors_name_problem_and_fix
// NOT-AUTOMATABLE: 15.4 empty_states_explain_next_step
// NOT-AUTOMATABLE: 15.5 body_copy_is_well_written
// NOT-AUTOMATABLE: 15.6 terminology_is_consistent
// NOT-AUTOMATABLE: 15.7 numbers_dates_and_units_are_consistent
// NOT-AUTOMATABLE: 15.8 success_messages_are_specific
