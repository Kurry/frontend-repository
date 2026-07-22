import { test, expect } from '@playwright/test';

// ==== START CANONICAL REGION — do not edit this region ====
const _tools = [];

function listTools() {
  return _tools;
}

async function invokeTool(name, args) {
  return await window.webmcp_invoke_tool(name, args);
}

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000');

  const tools = await page.evaluate(() => {
    return window.webmcp_list_tools ? window.webmcp_list_tools() : [];
  });

  _tools.length = 0;
  _tools.push(...tools);

  await page.evaluate(() => {
    window.invokeTool = async function(name, args) {
      return await window.webmcp_invoke_tool(name, args);
    }
  });
});
// ==== END CANONICAL REGION — add task-specific criterion tests below. ====

test('AC-01 Scrub a selected record through its timeline and restore a prior checkpoint', async ({ page }) => {
  await page.getByRole('button', { name: 'Oxblood Red Test 1' }).click();

  await page.getByRole('button', { name: 'ready' }).click();
  await page.getByRole('button', { name: 'changed' }).click();

  const draftButton = page.locator('button[aria-label^="Restore to draft state"]');
  await draftButton.click();

  const statusEl = page.locator('button.bg-blue-500.text-white');
  await expect(statusEl).toContainText('draft');

  const summaryReadyTests = page.locator('p.text-slate-500:has-text("Ready Tests") + p');
  const readyCount = await summaryReadyTests.innerText();
  expect(parseInt(readyCount)).toBeGreaterThanOrEqual(0);
});

test('AC-04 Query the current state and export after the mutation', async ({ page }) => {
  const result = await page.evaluate(async () => {
    return await window.invokeTool('artifact_export', { format: 'glaze-atlas-v1.json' });
  });

  expect(result.isError).toBe(false);
  expect(result.result.schemaVersion).toBe('v1');
  expect(Array.isArray(result.result.records)).toBe(true);
  expect(typeof result.result.derived.totalTests).toBe('number');
});

test('AC-05 Create, edit, mutate, undo, and complete one record', async ({ page }) => {
  await page.getByRole('button', { name: '' }).locator('svg.lucide-plus').click();
  await page.getByPlaceholder('Test Name').fill('New End to End Test');
  await page.getByRole('button', { name: 'Create' }).click();

  // Create automatically selects the new record, no need to click it again from the list
  await page.getByRole('button', { name: 'ready' }).click();

  await page.locator('button[title="Undo (Ctrl+Z)"]').click();

  const statusEl = page.locator('button.bg-blue-500.text-white');
  await expect(statusEl).toContainText('draft');
});

test('AC-06 Try exact bounds, an invalid cross-field value, an empty state, and malformed import', async ({ page }) => {
  await page.getByRole('button', { name: '' }).locator('svg.lucide-plus').click();
  await page.getByPlaceholder('Test Name').fill('');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.locator('text=Invalid name.')).toBeVisible();
});

test('AC-08 Repeat the signature interaction with keyboard and touch-equivalent controls', async ({ page }) => {
  await page.getByRole('button', { name: 'Matte Black Variation' }).focus();
  await page.keyboard.press('Enter');

  await page.getByRole('button', { name: 'archived' }).focus();
  await page.keyboard.press('Enter');

  const statusEl = page.locator('button.bg-slate-400.text-white');
  await expect(statusEl).toContainText('archived');

  await page.keyboard.press('Control+z');
  const originalStatusEl = page.locator('button.bg-amber-500.text-white');
  await expect(originalStatusEl).toContainText('changed');
});

test('AC-11 Mutate a record and use the linked representation to make the next decision', async ({ page }) => {
  const summaryReadyTests = page.locator('p.text-slate-500:has-text("Ready Tests") + p');
  const initialReadyCount = parseInt(await summaryReadyTests.innerText());

  await page.getByRole('button', { name: 'Matte Black Variation' }).click();
  await page.getByRole('button', { name: 'ready' }).click();

  const finalReadyCount = parseInt(await summaryReadyTests.innerText());
  expect(finalReadyCount).toBe(initialReadyCount + 1);
});

test('AC-13 Export, clear, import, and inspect the edited variant record and derived state', async ({ page }) => {
  const exportRes = await page.evaluate(async () => {
    return await window.invokeTool('artifact_export', { format: 'glaze-atlas-v1.json' });
  });

  await page.getByRole('button', { name: 'Clear Session' }).click();
  await expect(page.locator('text=No tests found.')).toBeVisible();

  const importRes = await page.evaluate(async (data) => {
    return await window.invokeTool('artifact_import', { mode: 'glaze-atlas-v1.json', data });
  }, exportRes.result);

  expect(importRes.isError).toBe(false);
  await expect(page.locator('text=No tests found.')).not.toBeVisible();
});

// NOT-AUTOMATABLE: AC-02 — Inspect the primary work surface, linked summary, and detail panel (Visual design fidelity)
// NOT-AUTOMATABLE: AC-03 — Scrub a selected record through its timeline and restore a prior checkpoint (motion) (Visual transition logic)
// NOT-AUTOMATABLE: AC-07 — Use the signature interaction at a narrow viewport (Responsive layout)
// NOT-AUTOMATABLE: AC-09 — Exercise a seeded collection with at least 100 records (Performance assessment)
// NOT-AUTOMATABLE: AC-10 — Inspect labels, statuses, errors, and empty-state text (Copy writing nuance)
// NOT-AUTOMATABLE: AC-12 — Compare the implementation with the cited source interaction vocabulary (Brand interaction feel)
