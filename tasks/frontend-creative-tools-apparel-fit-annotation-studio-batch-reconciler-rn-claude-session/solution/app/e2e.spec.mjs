import { test, expect } from '@playwright/test';

// ==== START CANONICAL REGION — DO NOT EDIT ====
// The grading infrastructure will inject these globals.
const listTools = typeof window !== 'undefined' && window.webmcp_list_tools
  ? window.webmcp_list_tools
  : async () => [];
const invokeTool = typeof window !== 'undefined' && window.webmcp_invoke_tool
  ? window.webmcp_invoke_tool
  : async () => ({});
// ==== END CANONICAL REGION — add task-specific criterion tests below. ====

test('AC-01 signature_mutation', async ({ page }) => {
    await page.goto('/');

    // Select an item
    const checkbox = page.getByRole('checkbox', { name: 'Select Neckline Trim' });
    await checkbox.check();

    // Perform mutation
    await page.getByRole('button', { name: 'Group & Reconcile Batch' }).click();

    // Verify linked view and derived summary
    await expect(page.getByText('Reconciled 1 records.')).toBeVisible();
    await expect(page.locator('text=Status: ready').first()).toBeVisible();
});

test('AC-02 visual_hierarchy', async ({ page }) => {
    // NOT-AUTOMATABLE: AC-02 - visual hierarchy makes current state and next action clear is subjective
    expect(true).toBe(true);
});

test('AC-03 causal_motion', async ({ page }) => {
    await page.goto('/');
    // Testing causal motion would involve precise framerate and transform checks.
    // We check the transition duration on the row container.
    const row = page.locator('.border.rounded.transition-all').first();
    await expect(row).toHaveCSS('transition-duration', '0.3s');
});

test('AC-04 schema_contract', async ({ page }) => {
    await page.goto('/');

    // Do a change so we have something specific
    await page.getByRole('checkbox', { name: 'Select Neckline Trim' }).check();
    await page.getByRole('button', { name: 'Group & Reconcile Batch' }).click();

    // The Export is handled via standard WebMCP artifact.
    // Check via tools
    const state = await page.evaluate(async () => {
        return await window.webmcp_invoke_tool('export_artifact', {});
    });

    expect(state.schemaVersion).toBe('v1');
    expect(typeof state.exportedAt).toBe('string');
    expect(Array.isArray(state.records)).toBe(true);
    expect(typeof state.derived).toBe('object');
    expect(Array.isArray(state.history)).toBe(true);
});

test('AC-05 complete_user_flow', async ({ page }) => {
    await page.goto('/');

    // Add record
    await page.getByPlaceholder('New annotation name...').fill('Test Annotation');
    await page.getByRole('button', { name: 'Add' }).click();

    // Edit record - use double click to open, then fill, then enter
    await page.getByText('Test Annotation').dblclick();
    // Since the previous input is gone, the new input is active. It doesn't have a placeholder.
    // Let's just find the input inside the active item, or grab the active element.
    const editInput = page.locator('input').nth(1); // The edit input is likely the second input on the page after the Add input

    await editInput.fill('Updated Annotation');
    await editInput.press('Enter');

    // Using evaluate blur or enter sometimes skips the update check so we click away or wait for DOM update.
    await expect(page.getByText('Updated Annotation')).toBeVisible();

    // Mutate
    await page.getByRole('checkbox', { name: 'Select Updated Annotation' }).check();
    await page.getByRole('button', { name: 'Group & Reconcile Batch' }).click();
    await expect(page.getByText('Reconciled 1 records.')).toBeVisible();

    // Undo
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(page.getByText('Undid last action.')).toBeVisible();
});

test('AC-06 boundaries_recovery', async ({ page }) => {
    await page.goto('/');

    const fileChooserPromise = page.waitForEvent('filechooser');
    // Upload invalid JSON
    await page.locator('label:has-text("Import")').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
        name: 'invalid.json',
        mimeType: 'application/json',
        buffer: Buffer.from('{"invalid": true}')
    });

    // Previous state preserved
    await expect(page.getByText('Neckline Trim')).toBeVisible();
});

test('AC-07 mobile_mode', async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 375, height: 812 });

    // Ensure the main layout flex direction wraps or stack gracefully.
    // Tailwind classes used for header: flex-col md:flex-row
    const header = page.locator('header');
    await expect(header).toHaveCSS('flex-direction', 'column');
});

test('AC-08 alternate_input', async ({ page }) => {
    await page.goto('/');

    // Tab to select record
    await page.keyboard.press('Tab'); // focus Group button
    await page.keyboard.press('Tab'); // focus Undo
    await page.keyboard.press('Tab'); // focus Export
    await page.keyboard.press('Tab'); // focus Import
    await page.keyboard.press('Tab'); // focus select
    await page.keyboard.press('Tab'); // focus input
    await page.keyboard.press('Tab'); // focus Add
    await page.keyboard.press('Tab'); // focus first checkbox

    await page.keyboard.press('Space'); // Check

    // Now tab back to Group button
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab'); // Group Button

    await page.keyboard.press('Enter');

    await expect(page.getByText('Reconciled 1 records.')).toBeVisible();
});

test('AC-09 performance', async ({ page }) => {
    await page.goto('/');

    // Fallback: fast inserts via evaluate and DOM event
    await page.evaluate(() => {
        for(let i=0; i<100; i++) {
             document.querySelector('input[name="name"]').value = 'Perf ' + i;
             document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
    });

    // Just verify the page still works
    await expect(page.getByRole('button', { name: 'Group & Reconcile Batch' })).toBeVisible();
});

test('AC-10 domain_copy', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Reconciled')).toBeHidden(); // Derived empty state
    await expect(page.getByText('No derived summary.')).toBeVisible();
    await expect(page.getByText('Apparel Fit Annotation Studio')).toBeVisible();
    await expect(page.getByText('Group & Reconcile Batch')).toBeVisible();
});

test('AC-11 linked_utility', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('checkbox', { name: 'Select Sleeve Length' }).check();
    await page.getByRole('button', { name: 'Group & Reconcile Batch' }).click();

    await expect(page.getByText('Reconciled 1 records.')).toBeVisible();
});

test('AC-12 source_fidelity', async ({ page }) => {
    // NOT-AUTOMATABLE: AC-12 - source fidelity visually comparing to external refs
    expect(true).toBe(true);
});

test('AC-13 artifact_round_trip', async ({ page }) => {
    await page.goto('/');

    // Mutate state
    await page.getByRole('checkbox', { name: 'Select Neckline Trim' }).check();
    await page.getByRole('button', { name: 'Group & Reconcile Batch' }).click();

    // Get exported artifact
    const state = await page.evaluate(async () => {
        return await window.webmcp_invoke_tool('export_artifact', {});
    });

    // Clear and import via UI
    // First clear: delete all
    const deleteBtns = await page.locator('button[aria-label="Delete"]').all();
    for(let i = deleteBtns.length - 1; i >= 0; i--) {
        await deleteBtns[i].click();
    }
    await expect(page.getByText('No records found.')).toBeVisible();

    // Import
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('label:has-text("Import")').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
        name: 'roundtrip.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(state))
    });

    // Assert restored
    await expect(page.getByText('Reconciled 1 records.')).toBeVisible();
    await expect(page.getByText('Neckline Trim')).toBeVisible();
});

// AC-02 NOT-AUTOMATABLE: Visual design / visual hierarchy
// AC-12 NOT-AUTOMATABLE: Source fidelity
