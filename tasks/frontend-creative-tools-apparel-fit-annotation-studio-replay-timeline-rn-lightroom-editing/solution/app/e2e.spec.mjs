import { test, expect } from '@playwright/test';

// WebMCP globals are injected by the harness. We define dummy ones for local typing if needed.
const listTools = async () => window.webmcp_list_tools?.() || [];
const invokeTool = async (name, args) => window.webmcp_invoke_tool?.(name, args);

// ==== END CANONICAL REGION — add task-specific criterion tests below. ====

test('AC-01 signature_mutation', async ({ page }) => {
  await page.goto('/');

  // Wait for seed data
  await expect(page.locator('text=Jacket Armhole').first()).toBeVisible();

  // Select a record
  await page.click('text=Jacket Armhole');

  // Edit the record
  await page.fill('input#title', 'Jacket Armhole Updated');
  await page.click('button:has-text("Save Changes")');

  // Verify it changed
  await expect(page.locator('h3', { hasText: 'Jacket Armhole Updated' })).toBeVisible();

  // Perform scrub in timeline (we assume the first node is the oldest)
  const timelineNodes = page.locator('div[class*="flex flex-col items-center group cursor-pointer"]');
  await timelineNodes.first().click({ force: true });

  // The scrub restores the preview state, so the list and editor should reflect the old name
  await expect(page.locator('h3', { hasText: 'Jacket Armhole' }).first()).toBeVisible();
  await expect(page.locator('text=Previewing past state')).toBeVisible();
});

test('AC-05 complete_user_flow', async ({ page }) => {
  await page.goto('/');

  // Create a record
  await page.click('button:has-text("Create")');

  // Wait for it to be created and selected (new items appear in list as 'New Annotation' and we click to edit)
  await page.click('text=New Annotation');

  await page.fill('input#title', 'Flow Test Annotation');
  await page.selectOption('select#status', 'changed');
  await page.fill('input#measurementOffset', '1.5');
  await page.click('button:has-text("Save Changes")');

  // Wait for list to update
  await expect(page.locator('h3', { hasText: 'Flow Test Annotation' })).toBeVisible();

  // Perform an undo
  await page.click('button:has-text("Undo")');

  // Flow Test Annotation should be reverted to New Annotation in the list
  await expect(page.locator('h3', { hasText: 'Flow Test Annotation' })).not.toBeVisible();
});

test('AC-04 schema_contract', async ({ page }) => {
  await page.goto('/');

  // Wait for initial load
  await expect(page.locator('text=Jacket Armhole').first()).toBeVisible();

  // Use WebMCP to export
  const result = await page.evaluate(async () => {
    return window.webmcp_invoke_tool('artifact_export', { format: 'fit-annotations-v1-replay-timeline-json' });
  });

  expect(result.success).toBe(true);
  expect(result.artifact.schemaVersion).toBe('fit-annotations-v1');
  expect(Array.isArray(result.artifact.records)).toBe(true);
  expect(result.artifact.records.length).toBeGreaterThan(0);
});

test('AC-13 artifact_round_trip', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Jacket Armhole').first()).toBeVisible();

  // Make a change
  await page.click('text=Jacket Armhole');
  await page.fill('input#title', 'Round Trip Title');
  await page.click('button:has-text("Save Changes")');

  await expect(page.locator('h3', { hasText: 'Round Trip Title' })).toBeVisible();

  // Export via WebMCP
  const exportResult = await page.evaluate(async () => {
    return window.webmcp_invoke_tool('artifact_export', { format: 'fit-annotations-v1-replay-timeline-json' });
  });

  // Modify it
  await page.fill('input#title', 'Title to Override');
  await page.click('button:has-text("Save Changes")');
  await expect(page.locator('h3', { hasText: 'Title to Override' })).toBeVisible();

  // Import the exported data back
  const importResult = await page.evaluate(async (jsonStr) => {
    return window.webmcp_invoke_tool('artifact_import', {
      format: 'fit-annotations-v1-replay-timeline-json',
      content: jsonStr
    });
  }, JSON.stringify(exportResult.artifact));

  expect(importResult.success).toBe(true);

  // Should see 'Round Trip Title' again
  await expect(page.locator('h3', { hasText: 'Round Trip Title' })).toBeVisible();
});

test('AC-06 boundaries_recovery', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Jacket Armhole').first()).toBeVisible();
  await page.click('text=Jacket Armhole');

  // Enter out of bounds value
  await page.fill('input#measurementOffset', '50');
  await page.click('button:has-text("Save Changes")');

  // Check for error text
  await expect(page.locator('text=Offset cannot be greater than 20')).toBeVisible();

  // Enter valid value
  await page.fill('input#measurementOffset', '15');
  await page.click('button:has-text("Save Changes")');

  // Ensure error text is gone and changes saved (we can test that error is gone)
  await expect(page.locator('text=Offset cannot be greater than 20')).not.toBeVisible();
});

test('AC-09 large_collection', async ({ page }) => {
  await page.goto('/');

  // Seed lots of records via WebMCP
  await page.evaluate(async () => {
    for (let i = 0; i < 110; i++) {
      window.webmcp_invoke_tool('entity_create', {
        entity: 'fit-annotation',
        fields: {
          title: `Bulk Record ${i}`,
          status: 'draft',
          notes: '',
          measurementOffset: 0
        }
      });
    }
  });

  // Verify list responds and has records
  await expect(page.locator('text=Bulk Record 0').first()).toBeVisible();
  await expect(page.locator('text=Bulk Record 100').first()).toBeVisible();

  // Interact
  await page.click('text=Bulk Record 50');
  await page.fill('input#title', 'Bulk Record 50 Updated');
  await page.click('button:has-text("Save Changes")');
  await expect(page.locator('h3', { hasText: 'Bulk Record 50 Updated' })).toBeVisible();
});

test('AC-10 domain_copy', async ({ page }) => {
  await page.goto('/');

  // Click a record to show the editor
  await page.click('text=Jacket Armhole');

  await expect(page.locator('text=Measurement Offset (inches)')).toBeVisible();
  await expect(page.locator('text=Draft').first()).toBeVisible();
});

test('AC-11 linked_utility', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Total').first()).toBeVisible();

  // Add a new 'changed' record
  await page.click('button:has-text("Create")');
  await page.click('text=New Annotation');

  await page.selectOption('select#status', 'changed');
  await page.fill('input#measurementOffset', '1');
  await page.click('button:has-text("Save Changes")');

  // Verify 'changed' count increases. The 'Summary' view is the linked utility.
  // We seeded one 'changed', creating another makes 2.
  await expect(page.locator('div:has-text("Changed")').filter({ hasText: "2" }).first()).toBeVisible();
});


// NOT-AUTOMATABLE: AC-02 - visual_hierarchy - Visual design and hierarchy is subjective
// NOT-AUTOMATABLE: AC-12 - source_fidelity - Visual and interaction thesis is subjective
// NOT-AUTOMATABLE: AC-03 - causal_motion - Complex animation and reduced motion verification is visual
// NOT-AUTOMATABLE: AC-07 - mobile_mode - Layout shifting to drawer/stepper is visual/subjective responsiveness
// NOT-AUTOMATABLE: AC-08 - alternate_input - Validating identical live feedback and visual focus state across touch/kb
// NOT-AUTOMATABLE: AC-04-duplicate - schema_contract_duplicate - Duplicate criteria, tested above.
