import { test, expect } from '@playwright/test';

// ==== START CANONICAL REGION — do not edit setup. ====
// Ensure deterministic checks use exactly the rendered state, no artificial timeouts/waitings beyond Playwright defaults.
// ==== END CANONICAL REGION — add task-specific criterion tests below. ====

test('AC-01 signature_mutation', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Find the first color item (which should be seeded)
  const colorItems = page.locator('.group').first();
  await expect(colorItems).toBeVisible();

  const initialTitle = await colorItems.locator('h3').textContent();

  // Click to branch
  await colorItems.click();

  // Check that the Scenario Weaver panel updates
  const scenarioPanel = page.locator('h2', { hasText: 'Weaving Scenario:' });
  await expect(scenarioPanel).toBeVisible();
  await expect(page.locator('h2', { hasText: initialTitle })).toBeVisible();

  // Modify the hex input
  const hexInput = page.locator('input#hex-input');
  await hexInput.fill('#ff0000');

  // Check linked view update immediately
  await expect(colorItems.locator('p').first()).toHaveText('#ff0000');

  // Resolve Scenario
  await page.getByRole('button', { name: 'Ready', exact: true }).nth(1).click();

  // Verify it resolved properly and scenario closed
  await expect(page.locator('h2', { hasText: 'Weaving Scenario:' })).not.toBeVisible();
  await expect(colorItems.locator('span', { hasText: 'ready' })).toBeVisible();
});

test('AC-04 schema_contract', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Invoke WebMCP tool to export and check shape
  const exportData = await page.evaluate(async () => {
    // @ts-ignore
    return await window.webmcp_invoke_tool('artifact-export', {});
  });

  expect(exportData.status).toBe('success');
  expect(exportData.data).toHaveProperty('schemaVersion', 'v1');
  expect(exportData.data).toHaveProperty('records');
  expect(exportData.data).toHaveProperty('derived');
  expect(exportData.data.records.length).toBeGreaterThan(0);
});

test('AC-05 complete_user_flow', async ({ page }) => {
  await page.goto('http://localhost:3000');

  const firstColor = page.locator('.group').first();
  await firstColor.click();
  await page.getByRole('button', { name: 'Changed', exact: true }).nth(1).click();

  await expect(firstColor.locator('span', { hasText: 'changed' })).toBeVisible();

  // Undo
  await page.keyboard.press('Meta+z');

  // Assuming it reverts back to the original status (from seeded value it would be 'ready' for the first item)
  await expect(firstColor.locator('span', { hasText: 'changed' })).not.toBeVisible();
});

test('AC-06 boundaries_recovery', async ({ page }) => {
  await page.goto('http://localhost:3000');

  const exportDataBefore = await page.evaluate(async () => {
    // @ts-ignore
    return (await window.webmcp_invoke_tool('artifact-export', {})).data;
  });

  // Import invalid data
  const result = await page.evaluate(async () => {
    // @ts-ignore
    return await window.webmcp_invoke_tool('artifact-import', { data: { foo: 'bar' } });
  });

  expect(result.status).toBe('error');

  const exportDataAfter = await page.evaluate(async () => {
    // @ts-ignore
    return (await window.webmcp_invoke_tool('artifact-export', {})).data;
  });

  expect(exportDataBefore.records.length).toBe(exportDataAfter.records.length);
});

test('AC-07 mobile_mode', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:3000');

  // Check horizontal scroll
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

  expect(scrollWidth).toBe(clientWidth);
});

test('AC-08 alternate_input', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Use keyboard to trigger first item
  // First tab goes into the collection header, second tab goes to the first filter, third/fourth/fifth etc goes to items. Let's just focus the first item and press enter
  const firstColor = page.locator('.group').first();
  await firstColor.focus();
  await page.keyboard.press('Enter');

  const scenarioPanel = page.locator('h2', { hasText: 'Weaving Scenario:' });
  await expect(scenarioPanel).toBeVisible();
});

test('AC-09 large_collection', async ({ page }) => {
  await page.goto('http://localhost:3000');

  const count = await page.locator('.group').count();
  expect(count).toBeGreaterThanOrEqual(100);
});

test('AC-11 linked_utility', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Mutate state and check summary
  const summaryPanel = page.locator('h2', { hasText: 'Derived Summary' }).locator('..');

  // Capture initial archived count
  const initialArchivedText = await summaryPanel.locator('div', { hasText: 'Archived', exact: true }).locator('..').locator('.text-xl').first().innerText();
  const initialArchived = parseInt(initialArchivedText);

  // Find a non-archived item, branch it, and archive it
  const firstColor = page.locator('.group').first();
  await firstColor.click();
  await page.getByRole('button', { name: 'Archive', exact: true }).click();

  const finalArchivedText = await summaryPanel.locator('div', { hasText: 'Archived', exact: true }).locator('..').locator('.text-xl').first().innerText();
  const finalArchived = parseInt(finalArchivedText);

  expect(finalArchived).toBe(initialArchived + 1);
});

test('AC-13 artifact_round_trip', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Export
  const exportData = await page.evaluate(async () => {
    // @ts-ignore
    return (await window.webmcp_invoke_tool('artifact-export', {})).data;
  });

  // Clear
  await page.getByRole('button', { name: 'Clear Workspace' }).click();

  // Check if cleared
  let count = await page.locator('.group').count();
  expect(count).toBe(0);

  // Import
  const importResult = await page.evaluate(async (data) => {
    // @ts-ignore
    return await window.webmcp_invoke_tool('artifact-import', { data });
  }, exportData);

  expect(importResult.status).toBe('success');

  // Check restored count
  count = await page.locator('.group').count();
  expect(count).toBe(exportData.records.length);
});

// NOT-AUTOMATABLE: AC-02 — visual_hierarchy is a subjective evaluation of design clarity.
// NOT-AUTOMATABLE: AC-03 — causal_motion is a visual/experiential check of animations and prefers-reduced-motion aesthetics.
// NOT-AUTOMATABLE: AC-10 — domain_copy is a subjective review of copy nuance and tone.
// NOT-AUTOMATABLE: AC-12 — source_fidelity is a subjective comparison of the visual aesthetic against the source inspiration.
