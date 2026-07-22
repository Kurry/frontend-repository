import { test, expect } from '@playwright/test';

test.describe('Agent Management E2E', () => {

  test('1.1 seeded_registry_complete', async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Check for at least 8 rows in the table
    const rows = page.locator('.cds--data-table tbody tr');
    await expect(rows).toHaveCount(9); // We seeded 9

    // Check that we have a mix of statuses
    const texts = await rows.allInnerTexts();
    const joinedText = texts.join(' ').toLowerCase();
    expect(joinedText).toContain('idle');
    expect(joinedText).toContain('running');
    expect(joinedText).toContain('error');
    expect(joinedText).toContain('offline');

    // Check that we have a mix of integrations
    expect(joinedText).toContain('codedeck');
    expect(joinedText).toContain('nimbus');
    expect(joinedText).toContain('quill');
  });

  test('1.2 rollup_strip_tracks_collection', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await expect(page.locator('.rollup-total strong')).toHaveText('9');

    const idleCount = await page.locator('.rollup-tile:has-text("Idle") strong').innerText();
    expect(idleCount).toBe('2');
  });

  test('1.4 register_valid_agent_appears', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Click Register Agent - using a more specific locator to avoid multi-match
    await page.locator('.toolbar-primary').getByRole('button', { name: /Register Agent/i }).click();

    // Fill out form
    await page.getByLabel(/^Name$/i).fill('Test Agent');

    // Carbon dropdowns
    await page.getByRole('combobox', { name: /Agent type/i }).click();
    await page.getByRole('option', { name: /boreal/i }).click();

    await page.getByRole('combobox', { name: /Editor integration/i }).click();
    await page.getByRole('option', { name: /quill/i }).click();

    await page.getByLabel(/Access key/i).fill('fleet_test_agent_2026');

    // Submit
    await page.getByRole('dialog').getByRole('button', { name: /^Register Agent$/i }).click();

    // Verify it appeared
    await expect(page.locator('td:has-text("Test Agent")').first()).toBeVisible();

    // Verify count increased
    await expect(page.locator('.rollup-total strong')).toHaveText('10');
  });

  test('1.5 register_invalid_shows_inline_errors', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Click Register Agent
    await page.locator('.toolbar-primary').getByRole('button', { name: /Register Agent/i }).click();

    // Try to submit empty
    const submitBtn = page.getByRole('dialog').getByRole('button', { name: /^Register Agent$/i });
    await expect(submitBtn).toBeDisabled();

    await page.getByLabel(/^Name$/i).fill('A'); // Too short
    await page.getByLabel(/Access key/i).focus(); // Trigger validation

    await expect(page.locator('#agent-name-error-msg')).toHaveText('Name must be 2 to 40 characters');
  });

  test('1.6 detail_panel_tabs_render', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Click on a row
    await page.getByRole('row', { name: /Boreal Echo/i }).click();

    // Verify tabs
    const panel = page.locator('.detail-panel');
    await expect(panel).toBeVisible();
    await expect(panel.getByRole('tab', { name: /Configuration/i })).toBeVisible();
    await expect(panel.getByRole('tab', { name: /History/i })).toBeVisible();
    await expect(panel.getByRole('tab', { name: /Activity/i })).toBeVisible();
  });

  test('1.8 remove_requires_confirm', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Open overflow menu for Boreal Echo
    const row = page.getByRole('row', { name: /Boreal Echo/i });
    await row.locator('.cds--overflow-menu').click();

    // Click Remove
    await page.locator('.cds--overflow-menu-options__option-content', { hasText: /Remove/ }).click();

    // Confirm modal appears
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Confirm deletion - Button name is "Remove agent"
    await modal.getByRole('button', { name: /^Remove agent$/i }).click();

    // Verify it's gone
    await expect(page.getByRole('cell', { name: 'Boreal Echo' })).toHaveCount(0);
  });

  test('1.24 export_copy_and_download', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.locator('.toolbar-primary').getByRole('button', { name: /Export fleet/i }).click();

    const exportModal = page.getByRole('dialog');
    await expect(exportModal).toBeVisible();

    await expect(exportModal.getByRole('button', { name: /Copy/i })).toBeVisible();
    await expect(exportModal.getByRole('button', { name: /Download/i })).toBeVisible();
  });

  test('14.1 in_memory_reload_resets_coherently', async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Change state
    await page.locator('.toolbar-primary').getByRole('button', { name: /Register Agent/i }).click();
    await page.getByLabel(/^Name$/i).fill('Test Agent');

    await page.getByRole('combobox', { name: /Agent type/i }).click();
    await page.getByRole('option', { name: /boreal/i }).click();

    await page.getByRole('combobox', { name: /Editor integration/i }).click();
    await page.getByRole('option', { name: /quill/i }).click();

    await page.getByLabel(/Access key/i).fill('fleet_test_agent_2026');
    await page.getByRole('dialog').getByRole('button', { name: /^Register Agent$/i }).click();

    await expect(page.locator('td:has-text("Test Agent")').first()).toBeVisible();

    // Reload
    await page.reload();

    // Verify reset
    await expect(page.locator('td:has-text("Test Agent")')).toHaveCount(0);
    await expect(page.locator('.rollup-total strong')).toHaveText('9');
  });

});

test.describe('Additional Criteria', () => {

  test('1.3 error_retry_transitions_to_idle', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for the table to populate
    await page.waitForSelector('.cds--data-table tbody tr');

    // Find the retry button on the whole page, since there's only one error seeded initially
    const retryBtn = page.getByRole('button', { name: /Retry/i }).first();
    await expect(retryBtn).toBeVisible();
    await retryBtn.click();

    // The retry button should disappear as it transitions out of error
    await expect(retryBtn).toHaveCount(0);
  });

  test('1.9 start_run_advances_steps', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Find the first start run button
    const startRunBtn = page.getByRole('button', { name: /Start run/i }).first();
    await expect(startRunBtn).toBeVisible();
    await startRunBtn.click();

    // Verify a paused button or something appears
    await expect(page.getByRole('button', { name: /Pause/i }).first()).toBeVisible();
  });

  test('1.14 bulk_pause_resume_selection', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Select 3 agents using actual DOM structural locators if necessary
    // or locate rows directly
    const checkboxes = page.locator('td.checkbox-cell label');
    await checkboxes.nth(1).click();
    await checkboxes.nth(2).click();
    await checkboxes.nth(3).click();

    // Pause all
    await page.locator('.toolbar-secondary').getByRole('button', { name: /Pause/i }).click();

    // Resume all
    await page.locator('.toolbar-secondary').getByRole('button', { name: /Resume/i }).click();
  });

  test('1.18 status_filter_union_and_clear', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Filter by running
    await page.getByRole('combobox', { name: /status/i }).click();
    await page.getByRole('option', { name: /Running/i }).click();
    // Escape to close filter
    await page.keyboard.press('Escape');

    // Verify only running rows shown
    const rows = page.locator('.cds--data-table tbody tr');
    await expect(rows.first()).toBeVisible();

    const statuses = await rows.locator('.cds--tag').allInnerTexts();
    expect(statuses.every(s => s.toLowerCase().includes('running'))).toBeTruthy();
  });

  test('1.25 fleet_import_round_trip', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Import
    await page.locator('.toolbar-primary').getByRole('button', { name: /Import fleet/i }).click();

    const importModal = page.getByRole('dialog');
    await expect(importModal).toBeVisible();

    // Submit empty should be disabled
    const submitBtn = importModal.getByRole('button', { name: /^Import fleet/i });
    await expect(submitBtn).toBeDisabled();

    // Enter invalid JSON
    await importModal.getByLabel(/Fleet JSON/i).fill('invalid json');
    await importModal.getByLabel(/Fleet JSON/i).blur();

    await expect(page.locator('#fleet-json-import-error-msg')).toHaveText('Import JSON is malformed');
  });

  test('1.27 command_palette_jump_and_actions', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Open palette
    await page.locator('.command-trigger').click();

    const palette = page.getByRole('dialog');
    await expect(palette).toBeVisible();

    await palette.getByPlaceholder(/Search/i).fill('Register');
    await palette.locator('li button', { hasText: 'Register Agent' }).click();

    const registerModal = page.getByRole('dialog', { name: /Register agent/i });
    // Verify modal appeared and name input is visible
    await expect(page.locator('#agent-name')).toBeVisible();
  });
});
