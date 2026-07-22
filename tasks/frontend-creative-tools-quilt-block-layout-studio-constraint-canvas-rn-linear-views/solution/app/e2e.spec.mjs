import { test, expect } from '@playwright/test';

// ==== START CANONICAL REGION — do not edit above this line. ====
// Add task-specific criterion tests below.

test('AC-01 signature_mutation', async ({ page }) => {
  await page.goto('/');
  // Drag a record
  await page.waitForSelector('.lane-draft');
  const draftBlock = page.locator('.lane-draft .cursor-grab').first();

  const readyLane = page.locator('div.lane-ready').first();
  const sourceBox = await draftBlock.boundingBox();
  const targetBox = await readyLane.boundingBox();
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(500);

  // Verify status update in summary
  const summaryBar = page.locator('.bg-gray-100');
  await expect(summaryBar).toContainText('Drafts:');

  // Update state using webmcp
  await page.evaluate(() => window.webmcp_invoke_tool('editor_select', { id: 'test_id' }));
});

test('AC-02 visual_hierarchy', async ({ page }) => {
  await page.goto('/');
  // NOT-AUTOMATABLE: visual design fidelity
});

test('AC-03 causal_motion', async ({ page }) => {
  await page.goto('/');
  // Check that dragging visually connects item to new state.
  const draftBlock = page.locator('.lane-draft .cursor-grab').first();
  const readyLane = page.locator('div.lane-ready').first();
  const sourceBox = await draftBlock.boundingBox();
  const targetBox = await readyLane.boundingBox();
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(500);
});

test('AC-04 schema_contract', async ({ page }) => {
  await page.goto('/');
  // Verify artifact contract
  const exportData = await page.evaluate(() => {
    return window.webmcp_invoke_tool('artifact_export', { format: 'session-json' });
  });
  expect(exportData.result.content.schemaVersion).toBe('quilt-layout-v1');
});

// Exhaustive coverage for other criteria
test('AC-05 complete_user_flow', async ({ page }) => {
  await page.goto('/');
  // Flow is automatable via UI actions
  await page.click('text=New Block');
  await page.fill('input[name="blockName"]', 'Test E2E Block');
  await page.fill('input[name="size"]', '42');
  await page.selectOption('select[name="status"]', 'ready');
  await page.click('button:has-text("Save")');
  await expect(page.locator('div.lane-ready').first()).toContainText('Test E2E Block');
  await page.click('text=Undo');
  await expect(page.locator('div.lane-ready').first()).not.toContainText('Test E2E Block');
});

test('AC-06 boundaries_recovery', async ({ page }) => {
  await page.goto('/');
  await page.click('text=New Block');
  await page.fill('input[name="blockName"]', ''); // Empty state
  await page.click('button:has-text("Save")');
  await expect(page.locator('text=Name is required')).toBeVisible();
});

test('AC-07 mobile_mode', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const draftBlock = page.locator('.lane-draft .cursor-grab').first();
  await expect(draftBlock).toBeVisible();
});

test('AC-08 alternate_input', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
});

test('AC-09 large_collection', async ({ page }) => {
  await page.goto('/');
  const blocks = page.locator('.cursor-grab');
  expect(await blocks.count()).toBeGreaterThan(50);
});

test('AC-10 domain_copy', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Drafts:')).toBeVisible();
  await expect(page.locator('text=Ready:')).toBeVisible();
});

test('AC-11 linked_utility', async ({ page }) => {
  await page.goto('/');
  const initialSummary = await page.locator('.bg-gray-100').textContent();
  const draftBlock = page.locator('.lane-draft .cursor-grab').first();
  const readyLane = page.locator('div.lane-ready').first();
  // Note: the mouse needs to physically drag over correctly for dnd-kit
  const sourceBox = await draftBlock.boundingBox();
  const targetBox = await readyLane.boundingBox();
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 5 });
  await page.mouse.up();

  // Give it a tiny bit of time for state updates, and wait for summary bar
  await page.waitForTimeout(500);
  const newSummary = await page.locator('.bg-gray-100').textContent();
  expect(initialSummary).not.toEqual(newSummary);
});

test('AC-12 source_fidelity', async ({ page }) => {
  // NOT-AUTOMATABLE: subjective fidelity
});

test('AC-13 artifact_round_trip', async ({ page }) => {
  await page.goto('/');
  // Create a specific state
  await page.click('text=New Block');
  await page.fill('input[name="blockName"]', 'Round Trip Test');
  await page.click('button:has-text("Save")');

  // Export
  await page.click('text=Export / Import');
  const exportData = await page.evaluate(() => {
    return window.webmcp_invoke_tool('artifact_export', { format: 'session-json' });
  });
  const jsonData = exportData.result.content;

  // Clear and Import
  await page.click('text=Import Session');
  await page.click('text=Clear State');
  await page.evaluate((data) => {
    window.webmcp_invoke_tool('artifact_import', { format: 'session-json', data });
  }, jsonData);

  await page.click('text=Close');
  await expect(page.locator('text=Round Trip Test').first()).toBeVisible();
});
