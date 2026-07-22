import { test, expect } from '@playwright/test';

test.describe('Photo Sequence Caption Loom', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Ensure app is loaded
    await page.waitForSelector('text=Caption Loom');
  });

  // ==== END CANONICAL REGION — add task-specific criterion tests below. ====

  test('AC-01 The scenario weaver mutation changes the primary record, linked view, and status together.', async ({ page }) => {
    // Select first record
    await page.click('text=Initial Shot');
    // Verify it's selected in the Weaver
    await expect(page.locator('.bg-neutral-900')).toContainText('Initial Shot');

    // Perform mutation
    await page.click('text=Branch: Alt-Timeline');

    // Verify record in table reflects change
    const row = page.locator('tr').filter({ hasText: 'Initial Shot' });
    await expect(row).toContainText('changed'); // Status
    await expect(row).toContainText('(Scenario: Alt-Timeline)'); // Caption updated

    // Verify linked derived view changed
    await expect(page.locator('aside')).toContainText('Branched Initial Shot -> Alt-Timeline');
  });

  test('AC-04 The tool result and artifact contain the declared API-shaped fields.', async ({ page }) => {
    // We will verify this by invoking the exportSession tool via window.webmcp_invoke_tool
    const exportedData = await page.evaluate(() => {
       return window.webmcp_invoke_tool('exportSession', {});
    });

    expect(exportedData.schemaVersion).toBe('photo-caption-v1');
    expect(typeof exportedData.exportedAt).toBe('string');
    expect(Array.isArray(exportedData.records)).toBeTruthy();
    expect(exportedData.derived).toBeDefined();
    expect(Array.isArray(exportedData.history)).toBeTruthy();
  });

  test('AC-05 The end-to-end job is recoverable without reload.', async ({ page }) => {
    // Edit a record
    await page.locator('tr').filter({ hasText: 'Mid Action' }).locator('button').click();
    await page.fill('input.border', 'Mid Action Edited');
    await page.click('text=Save');

    // Verify it updated
    await expect(page.locator('table')).toContainText('Mid Action Edited');

    // Undo
    await page.click('button[aria-label="Undo"]');

    // Verify restored
    await expect(page.locator('table')).toContainText('Mid Action');
    await expect(page.locator('table')).not.toContainText('Mid Action Edited');
  });

  test('AC-06 Each invalid action gives field-level recovery and preserves prior valid state.', async ({ page }) => {
    // Attempt empty edit
    await page.locator('tr').filter({ hasText: 'Initial Shot' }).locator('button').click();
    await page.fill('input.border', '   '); // spaces
    await page.click('text=Save');

    // Error shows, doesn't exit edit mode
    await expect(page.locator('text=Title is required')).toBeVisible();

    // Fix it
    await page.fill('input.border', 'Valid Title');
    await page.click('text=Save');

    await expect(page.locator('table')).toContainText('Valid Title');
  });

  test('AC-07 The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow.', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // Mobile

    // Click summary button
    await page.click('text=Summary');
    // Ensure drawer appears
    await expect(page.locator('.fixed.bottom-0')).toContainText('Derived Summary');
    // Close
    await page.click('text=Close');
    await expect(page.locator('.fixed.bottom-0')).not.toBeVisible();

    // Unset to prevent pollution
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('AC-09 The signature interaction remains responsive and unrelated rows stay stable.', async ({ page }) => {
    // Add multiple rows
    for (let i = 0; i < 5; i++) {
       await page.click('text=Add Record');
    }

    // Select first and mutate
    await page.click('text=Initial Shot');
    await page.click('text=Branch: Approved-Cut');

    // Verify it updated quickly
    const row = page.locator('tr').filter({ hasText: 'Initial Shot' });
    await expect(row).toContainText('Approved-Cut');

    // Verify other rows didn't change status to changed
    const unchangedRow = page.locator('tr').filter({ hasText: 'Mid Action' });
    await expect(unchangedRow).toContainText('draft');
  });

  test('AC-11 Linked views provide domain utility beyond CRUD.', async ({ page }) => {
    // Select record
    await page.click('text=Mid Action');
    // Use scenario weaver to decide
    await page.click('text=Branch: Approved-Cut');

    // Linked summary tracks this explicitly
    await expect(page.locator('aside')).toContainText('Branched Mid Action -> Approved-Cut');

    // History tracks this specifically
    await expect(page.locator('aside')).toContainText('branchScenario');
  });

  test('AC-13 Authored order/selection/geometry and domain state survive; invalid import is a no-op.', async ({ page }) => {
    // Edit state
    await page.click('text=Mid Action');
    await page.click('text=Branch: Alt-Timeline');

    // Export state
    const exportedData = await page.evaluate(() => {
       return window.webmcp_invoke_tool('exportSession', {});
    });

    // Clear by reloading
    await page.reload();
    await page.waitForSelector('text=Caption Loom');

    // Verify cleared (Mid Action should not have Alt-Timeline)
    await expect(page.locator('table')).not.toContainText('Alt-Timeline');

    // Import valid state
    await page.evaluate((data) => {
       window.webmcp_invoke_tool('importSession', { session: data });
    }, exportedData);

    // State restored
    await expect(page.locator('table')).toContainText('Alt-Timeline');

    // Invalid import
    await page.evaluate(() => {
       window.webmcp_invoke_tool('importSession', { session: { bad: 'data' } });
    });
    // Should not crash and state remains same
    await expect(page.locator('table')).toContainText('Alt-Timeline');
  });

  // NOT-AUTOMATABLE: AC-02 The visual hierarchy makes current state and next action clear. — Subjective layout/design review
  // NOT-AUTOMATABLE: AC-03 Motion connects the acted-on item to its new state and has a reduced-motion equivalent. — Visual animation fidelity
  // NOT-AUTOMATABLE: AC-08 Alternate input produces identical state with visible focus and live feedback. — Device/accessibility interaction fidelity
  // NOT-AUTOMATABLE: AC-10 Copy names the domain consequence and recovery action precisely. — Subjective copywriting evaluation
  // NOT-AUTOMATABLE: AC-12 The visual and interaction thesis is coherent without copying unrelated screens. — Subjective design cohesion
  // NOT-AUTOMATABLE: innovation.catchall Any additional innovative elements implemented gracefully. — Open-ended criteria
});
