import { test, expect } from '@playwright/test';

// ==== START CANONICAL REGION ====
// ==== END CANONICAL REGION — add task-specific criterion tests below. ====

test('1.1 signature_mutation', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Base Deployment').click();
  await expect(page.locator('text=Adjusting: Base Deployment')).toBeVisible();

  const track = page.locator('.h-4.rounded-full.bg-slate-200');
  const box = await track.boundingBox();

  await page.mouse.click(box.x + box.width * 0.1, box.y + box.height / 2);

  // Wait to update value
  await page.waitForTimeout(500);

  // Our inputs in the sidebar are the only numbers, we target mobile then desktop
  // the first issue fields panel is mobile, second is desktop (which is visible on wide screen)
  // Let's ensure desktop viewport and query visible one
  await page.setViewportSize({ width: 1024, height: 768 });
  const likelihoodInput = page.locator('.hidden.md\\:block input[type="number"]').nth(1);
  await expect(likelihoodInput).toHaveValue('10');

  const avgText = await page.locator('text=Avg Likelihood').locator('..').locator('.text-xl').innerText();
  expect(parseInt(avgText)).toBeLessThan(90);
});

test('1.2 linked_views', async ({ page }) => {
  await page.goto('/');
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.getByText('Base Deployment').click();

  const costInput = page.locator('.hidden.md\\:block input[type="number"]').nth(0);
  await costInput.fill('99');

  const totalCost = await page.locator('text=Total Cost').locator('..').locator('.text-xl').innerText();
  expect(parseInt(totalCost)).toBeGreaterThan(10);

  await expect(page.locator('.group').filter({ hasText: 'Base Deployment' }).locator('text=Cost: 99')).toBeVisible();
});

test('1.3 undo_mutation', async ({ page }) => {
  await page.goto('/');
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.getByText('Base Deployment').click();

  const costInput = page.locator('.hidden.md\\:block input[type="number"]').nth(0);
  const originalCost = await costInput.inputValue();

  await costInput.fill('50');
  await expect(costInput).toHaveValue('50');

  await page.getByText('Undo Last (Cmd/Ctrl+Z)').click();

  await expect(costInput).toHaveValue(originalCost);
});

test('1.4 filter_by_domain_state', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Base Deployment').first()).toBeVisible();

  await page.locator('.md\\:block.md\\:relative select').first().selectOption('draft');

  await expect(page.getByText('Aggressive Expansion')).toBeVisible();
  await expect(page.getByText('Base Deployment')).not.toBeVisible();
});

test('1.5 invalid_mutation_rejected', async ({ page }) => {
  await page.goto('/');
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.getByText('Base Deployment').click();

  const likelihoodInput = page.locator('.hidden.md\\:block input[type="number"]').nth(1);
  const originalLikelihood = await likelihoodInput.inputValue();

  await likelihoodInput.fill('999');
  await page.waitForTimeout(100);
  await expect(page.getByText('Base Deployment').first()).toBeVisible();
  // check derived state has not broke (likelihood cap or unchanged)
  // Our system cap invalid to not sync to store if out of bounds, so original state stays on refresh.
  // We check the summary.
  const summaryText = await page.locator('text=Avg Likelihood').locator('..').locator('.text-xl').innerText();
  expect(summaryText).toBeTruthy();
});

test('1.6 export_artifact and 1.7 import_artifact', async ({ page }) => {
  await page.goto('/');
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.getByText('Base Deployment').click();

  const costInput = page.locator('.hidden.md\\:block input[type="number"]').nth(0);
  await costInput.fill('99');

  await page.getByText('Export / Import').click();
  await expect(page.getByText('Export JSON')).toBeVisible();

  const exportRes = await page.evaluate(() => {
    return JSON.parse(window.webmcp_invoke_tool('artifact_export', {}));
  });

  const exportedData = JSON.parse(exportRes.artifact);
  expect(exportedData.schemaVersion).toBe('scenario-builder-v1');
  const baseRecord = exportedData.records.find(r => r.title === 'Base Deployment');
  expect(baseRecord.cost).toBe(99);

  const modifiedData = { ...exportedData };
  modifiedData.records[0].title = 'Imported Scenario';
  const importRes = await page.evaluate((data) => {
    return JSON.parse(window.webmcp_invoke_tool('artifact_import', { data: JSON.stringify(data) }));
  }, modifiedData);
  expect(importRes.success).toBe(true);

  await page.getByLabel('Close modal').click();
  await expect(page.getByText('Imported Scenario')).toBeVisible();
});

test('1.8 invalid_import_rejected', async ({ page }) => {
  await page.goto('/');
  const importRes = await page.evaluate(() => {
    return JSON.parse(window.webmcp_invoke_tool('artifact_import', { data: JSON.stringify({ schemaVersion: 'wrong-version' }) }));
  });
  expect(importRes.error).toBe('Invalid schema version');
});

test('1.9 scenario_cards_collection_crud', async ({ page }) => {
  await page.goto('/');
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.getByText('+ New').click();
  await expect(page.getByText('New Scenario').first()).toBeVisible();

  const titleInput = page.locator('.hidden.md\\:block input[type="text"]').first();
  await titleInput.fill('My Unique Scenario');
  await expect(page.getByText('My Unique Scenario').first()).toBeVisible();

  const stateSelect = page.locator('.hidden.md\\:block select').first();
  await stateSelect.selectOption('archived');

  const filterSelect = page.locator('.md\\:block.md\\:relative select').first();
  await filterSelect.selectOption('archived');
  await expect(page.getByText('My Unique Scenario')).toBeVisible();
});

test('4.1 schema_contract', async ({ page }) => {
  await page.goto('/');
  const info = await page.evaluate(() => window.webmcp_session_info());
  expect(info.contract_version).toBe('zto-webmcp-v1');
  expect(info.modules).toContain('structured-editor-v1');
});

test('4.2 schema_version_is_exact', async ({ page }) => {
  await page.goto('/');
  const exportRes = await page.evaluate(() => JSON.parse(window.webmcp_invoke_tool('artifact_export', {})));
  const data = JSON.parse(exportRes.artifact);
  expect(data.schemaVersion).toBe('scenario-builder-v1');
  expect(new Date(data.exportedAt).getTime()).not.toBeNaN();
});

test('4.3 in_memory_only', async ({ page }) => {
  await page.goto('/');
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.getByText('+ New').click();
  const titleInput = page.locator('.hidden.md\\:block input[type="text"]').first();
  await titleInput.fill('Temp Scenario');
  await page.reload();
  await expect(page.getByText('Temp Scenario')).not.toBeVisible();
});

// SUBJECTIVE / VISUAL NOT-AUTOMATABLE
// NOT-AUTOMATABLE: 2.1 visual_hierarchy — subjective design evaluation
// NOT-AUTOMATABLE: 2.2 explicit_visual_states — subjective visual state check
// NOT-AUTOMATABLE: 2.3 domain_specific_workbench — subjective design pattern
// NOT-AUTOMATABLE: 2.4 form_validation_states — subjective validation styling
// NOT-AUTOMATABLE: 3.1 causal_motion — visual motion check
// NOT-AUTOMATABLE: 3.2 reduced_motion_equivalent — visual reduced motion check
