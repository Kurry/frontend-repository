import { test, expect } from '@playwright/test';

// ==== END CANONICAL REGION — add task-specific criterion tests below. ====

test.use({ baseURL: 'http://localhost:3000' });

test('AC-01 signature_interaction', async ({ page }) => {
  await page.goto('/');
  // Setup: Find the failed record in the recovery board
  const failedRecordBtn = page.getByRole('button', { name: /Dragon Lair/i });
  await expect(failedRecordBtn).toBeVisible();
  await failedRecordBtn.click();

  const applyBtn = page.getByRole('button', { name: 'Apply Recovery Path' });
  await expect(applyBtn).toBeVisible();
  await applyBtn.click();

  // Verify: It's removed from recovery board
  await expect(page.getByRole('button', { name: /Dragon Lair/i })).not.toBeVisible();

  // Verify: Linked view (mobile preview) updates correctly (title gets " (Recovered)")
  await expect(page.locator('.text-slate-100').getByText('Dragon Lair (Recovered)')).toBeVisible();

  // Verify status in mobile preview is now "recovered"
  const recoveredLabel = page.locator('span', { hasText: 'recovered' }).filter({ hasText: /^recovered$/i }).first();
  await expect(recoveredLabel).toBeVisible();
});

test('AC-04 schema_contract', async ({ page }) => {
  // Use WebMCP to export artifact and verify shape
  await page.goto('/');

  // We can also verify by actually exporting and reading the clipboard/download,
  // but we can query WebMCP to test the contract format.
  const result = await page.evaluate(async () => {
    return await window.webmcp_invoke_tool('artifact_export', { format: 'scenario-builder-v1-recovery-board.json' });
  });

  expect(result.success).toBe(true);
  const data = result.data;
  expect(data.schemaVersion).toBe('v1');
  expect(data.exportedAt).toBeDefined();
  expect(data.records.length).toBeGreaterThan(0);
  expect(data.records[0].id).toBeDefined();
  expect(data.records[0].title).toBeDefined();
  expect(data.records[0].status).toBeDefined();
  expect(data.records[0].recoveryBoardState).toBeDefined();
  expect(data.records[0].difficulty).toBeDefined();

  expect(data.derived).toBeDefined();
  expect(data.derived.summary).toBeDefined();
  expect(typeof data.derived.summary.total).toBe('number');
});

test('AC-05 complete_user_flow', async ({ page }) => {
  await page.goto('/');

  // Create
  await page.getByRole('button', { name: 'Create' }).click();
  await page.locator('input[name="title"]').fill('New Test Scenario');
  await page.locator('textarea[name="description"]').fill('Test Desc');
  await page.locator('select[name="status"]').selectOption('failed');
  await page.getByRole('button', { name: 'Save' }).click();

  // Mutate (Recover)
  await page.getByRole('button', { name: /New Test Scenario/i }).first().click();
  await page.getByRole('button', { name: 'Apply Recovery Path' }).click();

  // Wait for the mutation to finish before undoing
  await page.waitForTimeout(500);

  // Undo via keyboard shortcut to test parity!
  await page.keyboard.press('Control+Z');

  // Wait a moment for state change
  await page.waitForTimeout(500);

  // It should be back in the failed list
  await expect(page.getByRole('button', { name: /New Test Scenario/i }).first()).toBeVisible();
});

test('AC-06 boundaries_recovery', async ({ page }) => {
  await page.goto('/');

  // Invalid action gives field-level recovery
  await page.getByRole('button', { name: 'Create' }).click();

  // Leave required fields blank
  await page.locator('input[name="title"]').fill('');
  await page.locator('input[name="difficulty"]').fill('11'); // out of bounds
  await page.getByRole('button', { name: 'Save' }).click();

  // Verify errors
  await expect(page.getByText('Title is required')).toBeVisible();
  await expect(page.getByText('Number must be less than or equal to 10')).toBeVisible();

  // The prior state is preserved (still in the form)
  await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
});

test('AC-07 mobile_mode', async ({ page }) => {
  await page.goto('/');
  // set to narrow viewport
  await page.setViewportSize({ width: 375, height: 812 });

  // Verify layout doesn't horizontally scroll (e.g. body scrollWidth <= 375)
  const isScrollable = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  expect(isScrollable).toBe(false);

  // Wait a moment for layout to adjust
  await page.waitForTimeout(500);

  // And the main elements stack
  const mainRect = await page.evaluate(() => {
    const main = document.querySelector('main');
    return main.getBoundingClientRect();
  });

  const asideRect = await page.evaluate(() => {
    const aside = document.querySelector('aside');
    return aside.getBoundingClientRect();
  });

  // In mobile view (stacking), the aside (mobile preview) should be below the primary surface
  // meaning aside's top should be greater than main's top
  expect(asideRect.top).toBeGreaterThan(mainRect.top);
});

test('AC-08 alternate_input', async ({ page }) => {
  await page.goto('/');

  // We'll just force focus to test keyboard path
  await page.getByRole('button', { name: /Dragon Lair/i }).focus();
  await page.keyboard.press('Enter');

  const applyBtn = page.getByRole('button', { name: 'Apply Recovery Path' });
  await expect(applyBtn).toBeVisible();
  await applyBtn.focus();
  await page.keyboard.press('Enter');

  // Verify mutation
  await expect(page.getByRole('button', { name: /Dragon Lair/i })).not.toBeVisible();

  // Undo using hotkey for alternate input parity
  await page.keyboard.press('Control+Z');
  await page.waitForTimeout(100);
  await expect(page.getByRole('button', { name: /Dragon Lair/i })).toBeVisible();
});

test('AC-09 large_collection', async ({ page }) => {
  await page.goto('/');

  // Seed large collection via WebMCP
  await page.evaluate(async () => {
    for (let i = 0; i < 100; i++) {
      window.webmcp_invoke_tool('entity_create', {
        id: `bulk-${i}`,
        title: `Bulk ${i}`,
        description: 'Bulk desc',
        status: 'draft',
        recoveryBoardState: 'idle',
        difficulty: 1,
        linkedScenarioId: null
      });
    }
  });

  // Should still be responsive
  await page.getByRole('button', { name: /Dragon Lair/i }).click();
  await page.getByRole('button', { name: 'Apply Recovery Path' }).click();
  await expect(page.getByRole('button', { name: /Dragon Lair/i })).not.toBeVisible();
});

test('AC-11 linked_utility', async ({ page }) => {
  await page.goto('/');

  // Record failed count in summary
  const initialFailedCount = await page.locator('.bg-red-900\\/50 .text-red-400').textContent();

  // Mutate
  await page.getByRole('button', { name: /Dragon Lair/i }).click();
  await page.getByRole('button', { name: 'Apply Recovery Path' }).click();

  // Verify derived view automatically updates
  const newFailedCount = await page.locator('.bg-red-900\\/50 .text-red-400').textContent();
  expect(Number(newFailedCount)).toBe(Number(initialFailedCount) - 1);
});

test('AC-13 artifact_round_trip', async ({ page }) => {
  await page.goto('/');

  // 1. Mutate
  await page.getByRole('button', { name: /Dragon Lair/i }).click();
  await page.getByRole('button', { name: 'Apply Recovery Path' }).click();

  // 2. Export via WebMCP
  const result = await page.evaluate(async () => {
    return await window.webmcp_invoke_tool('artifact_export', { format: 'scenario-builder-v1-recovery-board.json' });
  });
  const artifactStr = JSON.stringify(result.data);

  // 3. Clear state
  await page.getByRole('button', { name: 'Clear Data' }).click();
  page.on('dialog', dialog => dialog.accept());

  // Wait a tick
  await page.waitForTimeout(100);

  // 4. Import via WebMCP
  const importResult = await page.evaluate(async (jsonStr) => {
    return await window.webmcp_invoke_tool('artifact_import', { mode: 'scenario-builder-v1-recovery-board.json', content: jsonStr });
  }, artifactStr);

  expect(importResult.success).toBe(true);

  // Verify state is restored (Dragon lair is recovered)
  await expect(page.locator('.text-slate-100').getByText('Dragon Lair (Recovered)')).toBeVisible();
});

// NOT-AUTOMATABLE: AC-02 — visual hierarchy is subjective
// NOT-AUTOMATABLE: AC-03 — causal motion is subjective
// NOT-AUTOMATABLE: AC-10 — domain copy is subjective
// NOT-AUTOMATABLE: AC-12 — design fidelity is subjective
// NOT-AUTOMATABLE: AC-14 — optional enhancement is subjective
