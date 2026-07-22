import { test, expect } from '@playwright/test';

test.describe('Scenario Weaver E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Wait for the app to be mounted
    await expect(page.locator('h1').filter({ hasText: 'Scenario Weaver' })).toBeVisible();
  });

  // ==== BEGIN CANONICAL REGION ====

  test('AC-01 signature_mutation', async ({ page }) => {
    // Select the first scenario card
    await page.getByRole('heading', { name: 'Start of the Quest' }).click();

    // Expect the weaver to be populated
    await expect(page.locator('input[type="text"]')).toHaveValue('Start of the Quest');

    // Change title and apply
    await page.locator('input[type="text"]').fill('Start of the Adventure');
    await page.getByRole('button', { name: 'Apply Mutation' }).click();

    // Verify it updated in the linked view (the summary)
    await expect(page.getByText('Resolved: Start of the Adventure')).toBeVisible();

    // Verify it updated in the collection
    await expect(page.getByRole('heading', { name: 'Start of the Adventure' })).toBeVisible();
  });

  test('AC-03 causal_motion', async ({ page }) => {
    // NOT-AUTOMATABLE: causal_motion — Visual animation of the morphing state transitions is subjective and requires manual visual grading. We can only assert the structural update here.
    test.skip();
  });

  test('AC-04 schema_contract', async ({ page }) => {
    // Execute export tool
    const result = await page.evaluate(() => window.webmcp_invoke_tool('export_session'));
    expect(result.schemaVersion).toBe('scenario-builder-v1');
    expect(result.exportedAt).toBeDefined();
    expect(Array.isArray(result.records)).toBe(true);
    expect(result.records.length).toBeGreaterThan(0);
  });

  test('AC-05 complete_user_flow', async ({ page }) => {
    // Create new
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByText('New Scenario')).toBeVisible();

    // Mutate
    await page.getByRole('heading', { name: 'New Scenario' }).first().click();
    await page.locator('input[type="text"]').fill('Flow Test');
    await page.getByRole('button', { name: 'Apply Mutation' }).click();

    // Verify changes
    await expect(page.getByText('Resolved: Flow Test')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Flow Test' }).first()).toBeVisible();

    // Undo
    await page.getByLabel('Undo last mutation').click();

    // Validate undo applied in collection
    await expect(page.getByRole('heading', { name: 'New Scenario' }).first()).toBeVisible();
  });

  test('AC-06 boundaries_recovery', async ({ page }) => {
    await page.getByRole('heading', { name: 'Empty Room' }).click();

    // Clear title to trigger conflict
    await page.locator('input[type="text"]').fill('   ');
    await page.getByRole('button', { name: 'Apply Mutation' }).click();

    // Expect conflict error
    await expect(page.getByText('Conflict Detected')).toBeVisible();

    // Ensure the prior state is preserved in the card list (Title should still be Empty Room)
    await expect(page.getByRole('heading', { name: 'Empty Room' }).first()).toBeVisible();
  });

  test('AC-07 mobile_mode', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(page.locator('main')).toHaveClass(/flex-col/);
  });

  test('AC-08 alternate_input', async ({ page }) => {
    // the card itself is focusable via role=button
    await page.locator('div[role="button"]', { hasText: 'Goblin Ambush' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('input[type="text"]')).toHaveValue('Goblin Ambush');

    await page.locator('input[type="text"]').focus();
    await page.keyboard.type(' (Defeated)');

    await page.getByRole('button', { name: 'Apply Mutation' }).focus();
    await page.keyboard.press('Enter');

    await expect(page.getByText('Resolved: Goblin Ambush (Defeated)')).toBeVisible();
  });

  test('AC-09 large_collection', async ({ page }) => {
    // Generate lots of records
    for(let i=0; i<10; i++) {
        await page.getByRole('button', { name: 'Add' }).click();
    }
    await expect(page.getByRole('heading', { name: 'New Scenario' })).toHaveCount(10);
    // Perform signature interaction
    await page.getByRole('heading', { name: 'Start of the Quest' }).click();
    await page.locator('input[type="text"]').fill('Responsive Test');
    await page.getByRole('button', { name: 'Apply Mutation' }).click();
    await expect(page.getByText('Resolved: Responsive Test')).toBeVisible();
  });

  test('AC-11 linked_utility', async ({ page }) => {
    await page.getByRole('heading', { name: 'Start of the Quest' }).click();
    await expect(page.getByText('Selected: Start of the Quest')).toBeVisible();
    await page.locator('input[type="text"]').fill('Linked View Success');
    await page.getByRole('button', { name: 'Apply Mutation' }).click();
    await expect(page.getByText('Resolved: Linked View Success')).toBeVisible();
  });

  test('AC-13 artifact_round_trip', async ({ page }) => {
    // Mutate state
    await page.getByRole('heading', { name: 'Start of the Quest' }).click();
    await page.locator('input[type="text"]').fill('Modified Start');
    await page.getByRole('button', { name: 'Apply Mutation' }).click();

    // Export state
    const stateJson = await page.evaluate(() => window.webmcp_invoke_tool('export_session'));

    // Clear state
    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(page.getByText('Modified Start')).not.toBeVisible();

    // Import state
    await page.evaluate((json) => window.webmcp_invoke_tool('import_session', { sessionData: json }), stateJson);

    // Verify restoration
    await expect(page.getByRole('heading', { name: 'Modified Start' }).first()).toBeVisible();
  });

  // ==== END CANONICAL REGION ====

  // NOT-AUTOMATABLE: AC-02 — visual_hierarchy: Visual hierarchy, layout intentionality, and subjective density require human grading.
  // NOT-AUTOMATABLE: AC-10 — domain_copy: Subjective evaluation of copy writing quality and domain appropriateness.
  // NOT-AUTOMATABLE: AC-12 — source_fidelity: Visual evaluation of design fidelity compared to Spotify's interaction patterns.
  // NOT-AUTOMATABLE: AC-14 — innovation_catch_all: Evaluation of domain-specific enhancements beyond requested criteria.
});
