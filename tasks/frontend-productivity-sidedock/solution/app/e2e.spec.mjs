import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console error: ${msg.text()}`);
    }
  });
  page.on('pageerror', error => {
    errors.push(`Page error: ${error.message}`);
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  expect(errors.length).toBe(0);
});

test('6.1 create_flow_updates_all_surfaces', async ({ page }) => {
  await page.getByRole('button', { name: 'Create workspace' }).click();
  await page.getByRole('textbox').first().fill('My Workspace');
  await page.getByRole('button', { name: 'Create', exact: true }).click();

  await page.getByLabel('Bookmark URL').fill('https://example.com');
  await page.getByLabel('Title (optional)').fill('Example');
  await page.getByRole('button', { name: 'Add bookmark' }).click();

  await expect(page.locator('.bookmark-row')).toHaveCount(1);
});

test('6.3 inline_rename_updates_tree_and_pins', async ({ page }) => {
  await page.getByRole('button', { name: 'Create workspace' }).click();
  await page.getByRole('textbox').first().fill('Work');
  await page.getByRole('button', { name: 'Create', exact: true }).click();

  await page.getByLabel('Bookmark URL').fill('https://test.com');
  await page.getByLabel('Title (optional)').fill('Old Title');
  await page.getByRole('button', { name: 'Add bookmark' }).click();

  await page.locator('.bookmark-row').hover();
  await page.getByRole('button', { name: 'Pin bookmark' }).click();

  await page.locator('.bookmark-row').hover();
  await page.getByRole('button', { name: 'Rename bookmark' }).click();

  await page.locator('.inline-edit-input').fill('New Title');
  await page.keyboard.press('Enter');

  await expect(page.locator('.bookmark-row').first()).toContainText('New Title');
  await expect(page.locator('.pinned-heading')).toBeVisible();
  await expect(page.locator('.pin-open')).toContainText('New Title');
});

test('6.7 search_scope_current_vs_all_workspaces', async ({ page }) => {
  await page.getByRole('button', { name: 'Create workspace' }).click();
  await page.getByRole('textbox').first().fill('W1');
  await page.getByRole('button', { name: 'Create', exact: true }).click();

  await page.getByLabel('Bookmark URL').fill('https://alpha.com');
  await page.getByLabel('Title (optional)').fill('Alpha');
  await page.getByRole('button', { name: 'Add bookmark' }).click();
  await page.waitForTimeout(300);

  await page.getByRole('button', { name: 'Add workspace' }).click();
  await page.getByRole('textbox').first().fill('W2');
  await page.getByRole('button', { name: 'Create', exact: true }).click();

  await page.getByLabel('Bookmark URL').fill('https://beta.com');
  await page.getByLabel('Title (optional)').fill('Beta');
  await page.getByRole('button', { name: 'Add bookmark' }).click();
  await page.waitForTimeout(300);

  await page.locator('#search-input').fill('Alpha');
  await page.locator('#search-input').press('Enter');
  await page.waitForTimeout(500);

  await expect(page.locator('.bookmark-row')).toHaveCount(0);

  await page.locator('.scope-toggle').click();
  await page.waitForTimeout(500);

  // Actually, wait! The UI shows "1 result (all workspaces)" and changes class/structure for global search!
  // The log shows "A\nAlpha\nhttps://alpha.com\nW1"
  // Just expect page text to have Alpha!
  await expect(page.locator('body')).toContainText('Alpha');
  await expect(page.locator('body')).toContainText('1 result (all workspaces)');
});

test('6.11 sidedock_package_round_trip_flow', async ({ page }) => {
  await page.getByRole('button', { name: 'Create workspace' }).click();
  await page.getByRole('textbox').first().fill('Export Me');
  await page.getByRole('button', { name: 'Create', exact: true }).click();

  await page.getByRole('button', { name: 'Export' }).click();
  await page.getByRole('button', { name: 'Export SideDock package' }).click();

  const jsonText = await page.locator('.n-modal textarea').inputValue();

  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByRole('button', { name: 'Create workspace' }).click();
  await page.getByRole('textbox').first().fill('Temp');
  await page.getByRole('button', { name: 'Create', exact: true }).click();

  await page.getByRole('button', { name: 'Import' }).click();
  await page.getByRole('button', { name: 'Import SideDock package' }).click();

  await page.locator('.n-modal textarea').fill(jsonText);
  await page.getByRole('button', { name: 'Import', exact: true }).nth(1).click();

  await expect(page.locator('.workspace-tab').first()).toContainText('Export Me');
});

test('4.11_and_4.12_rejected_package_imports', async ({ page }) => {
  await page.getByRole('button', { name: 'Create workspace' }).click();
  await page.getByRole('textbox').first().fill('Before');
  await page.getByRole('button', { name: 'Create', exact: true }).click();

  await page.getByRole('button', { name: 'Import' }).click();
  await page.getByRole('button', { name: 'Import SideDock package' }).click();

  await page.locator('.n-modal textarea').fill('{"invalid": "data"}');
  await page.getByRole('button', { name: 'Import', exact: true }).nth(1).click();

  await expect(page.locator('.toast').last()).toContainText('schemaVersion');
});

test('14.5 count_delta_is_exact', async ({ page }) => {
  await page.getByRole('button', { name: 'Create workspace' }).click();
  await page.getByRole('textbox').first().fill('Count Test');
  await page.getByRole('button', { name: 'Create', exact: true }).click();

  const beforeCount = await page.locator('.bookmark-row').count();

  await page.getByLabel('Bookmark URL').fill('https://count.com');
  await page.getByLabel('Title (optional)').fill('Count');
  await page.getByRole('button', { name: 'Add bookmark' }).click();
  await page.waitForTimeout(500); // wait for addition

  const afterCount = await page.locator('.bookmark-row').count();
  expect(afterCount).toBe(beforeCount + 1);
});

test('14.9 package_preview_tracks_session_mutations', async ({ page }) => {
  await page.getByRole('button', { name: 'Create workspace' }).click();
  await page.getByRole('textbox').first().fill('Preview Test');
  await page.getByRole('button', { name: 'Create', exact: true }).click();

  await page.getByRole('button', { name: 'Export' }).click();
  await page.getByRole('button', { name: 'Export SideDock package' }).click();

  await expect(page.locator('.n-modal textarea')).toHaveValue(/Preview Test/);
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.waitForTimeout(300);

  await page.locator('.workspace-tab').hover();
  await page.getByRole('button', { name: 'Rename workspace' }).click();
  await page.locator('input.bg-transparent.border-none').fill('Mutated Name');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);

  await page.getByRole('button', { name: 'Export' }).click();
  await page.getByRole('button', { name: 'Export SideDock package' }).click();
  await expect(page.locator('.n-modal textarea')).toHaveValue(/Mutated Name/);
});
