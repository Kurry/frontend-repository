import { test, expect } from '@playwright/test';

// ==== START CANONICAL REGION ====
// Globals provided by the test runner for E2E e2e tests
const listTools = async () => {
  return await page.evaluate(() => window.webmcp_list_tools());
};
const invokeTool = async (toolName, args) => {
  return await page.evaluate(({ name, args: _args }) => window.webmcp_invoke_tool(name, _args), { name: toolName, arguments: args });
};
// ==== END CANONICAL REGION — add task-specific criterion tests below. ====

test('AC-01 signature_mutation', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Protagonist');
  await expect(page.locator('.bg-slate-100.text-slate-700')).toHaveText('idle');

  await page.fill('input[placeholder="Reason for quarantine (e.g. Director requested color change)"]', 'Bad jacket color');
  await page.click('[data-testid="quarantine-btn"]');

  await expect(page.locator('.bg-red-100.text-red-700')).toHaveText('conflict');
  await expect(page.locator('.bg-red-50.text-red-800')).toContainText('Bad jacket color');
});

test('AC-04 schema_contract', async ({ page }) => {
  await page.goto('/');

  // Use WebMCP to query the state
  const tools = await page.evaluate(() => window.webmcp_list_tools());
  expect(tools.length).toBeGreaterThan(0);

  const artifact = await page.evaluate(() => window.webmcp_invoke_tool('export_artifact', {}));
  expect(artifact.schemaVersion).toBe('v1');
  expect(artifact.records).toBeDefined();
  expect(artifact.derived).toBeDefined();
});

test('AC-05 complete_user_flow', async ({ page }) => {
  await page.goto('/');
  // Create
  await page.click('[data-testid="add-record-btn"]');
  await expect(page.locator('text=New')).toBeVisible();

  // Edit (via Provenance Atlas)
  await page.click('text=New');
  await page.fill('textarea', 'Updated Description');

  // Mutate
  await page.fill('input[placeholder="Reason for quarantine (e.g. Director requested color change)"]', 'Flow test');
  await page.click('[data-testid="quarantine-btn"]');
  await expect(page.locator('text=Flow test')).toBeVisible();

  // Undo (using keyboard shortcut for undo)
  await page.keyboard.press('Control+z');
  await expect(page.locator('text=Flow test')).not.toBeVisible();
});

test('AC-06 boundaries_recovery', async ({ page }) => {
  await page.goto('/');

  // Invalid import
  const result = await page.evaluate(() => window.webmcp_invoke_tool('import_artifact', { data: { invalid: 'schema' } }));
  expect(result.success).toBe(false);

  // Verify state wasn't mutated
  const artifact = await page.evaluate(() => window.webmcp_invoke_tool('export_artifact', {}));
  expect(artifact.records.length).toBe(2);
});

test('AC-07 mobile_mode', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');

  // Derived summary should not be visible initially if it's hidden by mobile flow
  const summary = page.locator('[data-testid="derived-summary"]');
  await expect(summary).toBeVisible();

  // Select a record to enter canvas (mobile stack)
  await page.click('text=Protagonist');

  // Now summary should be hidden, and canvas visible
  await expect(summary).not.toBeVisible();
  await expect(page.locator('text=Provenance Atlas')).toBeVisible();
});

test('AC-08 alternate_input', async ({ page }) => {
  await page.goto('/');
  // Keyboard navigation and mutation
  await page.click('text=Protagonist');

  // Focus and type reason
  await page.focus('input[placeholder="Reason for quarantine (e.g. Director requested color change)"]');
  await page.keyboard.type('Keyboard input reason');

  // Press Enter (if it's a form) or tab to button and press space
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');

  await expect(page.locator('.bg-red-50.text-red-800')).toContainText('Keyboard input reason');
});

test('AC-09 large_collection', async ({ page }) => {
  await page.goto('/');

  // Inject 100 records
  await page.evaluate(() => {
    for (let i = 0; i < 100; i++) {
      window.webmcp_invoke_tool('import_artifact', {
        data: {
          schemaVersion: 'v1',
          records: Array.from({length: 105}).map((_, idx) => ({
             id: 'id-' + idx,
             character: 'Char ' + idx,
             scene: 'Scene ' + idx,
             description: 'Desc',
             status: 'draft',
             provenanceAtlasState: 'idle'
          })),
          derived: { summary: '', totalRecords: 0, statusCounts: {} },
          history: []
        }
      });
    }
  });

  const records = await page.evaluate(() => window.webmcp_invoke_tool('get_records', {}));
  expect(records.records.length).toBe(105);

  // Perform interaction and ensure UI still updates
  await page.click('text=Char 0');
  await page.fill('input[placeholder="Reason for quarantine (e.g. Director requested color change)"]', 'Scale test');
  await page.click('[data-testid="quarantine-btn"]');

  await expect(page.locator('.bg-red-100.text-red-700')).toHaveText('conflict');
});

test('AC-11 linked_utility', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-testid="derived-summary"]')).toContainText('2 total looks in session');

  // Create conflict
  await page.click('text=Protagonist');
  await page.fill('input[placeholder="Reason for quarantine (e.g. Director requested color change)"]', 'Color change');
  await page.click('[data-testid="quarantine-btn"]');

  // Linked derived view updates
  await expect(page.locator('[data-testid="derived-summary"]')).toContainText('1 active conflicts requiring review');
});

test('AC-13 artifact_round_trip', async ({ page }) => {
  await page.goto('/');

  // Mutate
  await page.click('text=Protagonist');
  await page.fill('input[placeholder="Reason for quarantine (e.g. Director requested color change)"]', 'Round trip test');
  await page.click('[data-testid="quarantine-btn"]');

  // Export
  const export1 = await page.evaluate(() => window.webmcp_invoke_tool('export_artifact', {}));

  // Clear
  await page.click('button[title="Clear Session"]');

  // Import
  await page.evaluate((data) => window.webmcp_invoke_tool('import_artifact', { data }), export1);

  // Export again
  const export2 = await page.evaluate(() => window.webmcp_invoke_tool('export_artifact', {}));

  // Should match except maybe exportedAt timestamp
  expect(export2.records).toEqual(export1.records);
  expect(export2.derived.summary).toEqual(export1.derived.summary);
});

// NOT-AUTOMATABLE: AC-02 visual_hierarchy - Visual design fidelity, relies on qualitative visual balance and hierarchy assessment.
// NOT-AUTOMATABLE: AC-03 causal_motion - Reduced motion and exact morphing validation requires qualitative animation inspection.
// NOT-AUTOMATABLE: AC-10 domain_copy - Copy exactness is somewhat tested in other tests, but full copy review is subjective.
// NOT-AUTOMATABLE: AC-12 source_fidelity - Relies on comparing the app with source application (Slack Canvas) which is a visual/experiential check.
