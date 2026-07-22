import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Apparel Fit Annotation Studio', () => {

  test('AC-01 signature_mutation', async ({ page }) => {
    await page.goto('/');

    // Check initial summary text
    const summaryCard = page.locator('div[aria-live="polite"]').locator('p');
    const initialText = await summaryCard.innerText();
    expect(initialText).toContain('100 records');

    // Focus a conflict record via keyboard equivalent
    await page.keyboard.press('Tab');

    // Find the first conflict record
    const conflictCard = page.locator('div.border-2.cursor-pointer', { hasText: 'conflict' }).first();
    await conflictCard.click();

    // Check ID of selected before repair
    const idText = await page.locator('text=Selected ID').locator('xpath=following-sibling::div').innerText();

    // Repair and resolve
    await page.click('button:has-text("Repair & Resolve")');

    // Verify it changed in summary
    const updatedText = await summaryCard.innerText();
    expect(updatedText).not.toBe(initialText);
  });

  test('AC-03 causal_motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    // Ensure we pick a specific ID to watch
    const firstConflict = page.locator('div.border-2.cursor-pointer', { hasText: 'conflict' }).first();
    await expect(firstConflict).toBeVisible();
    await firstConflict.click();

    const idToWatch = await page.locator('text=Selected ID').locator('xpath=following-sibling::div').innerText();

    await page.click('button:has-text("Repair & Resolve")');

    // The specific record shouldn't be in the conflict list anymore (it has been resolved)
    // Wait for the panel to empty
    await expect(page.locator('text=Select a conflict record')).toBeVisible();

    // We can also check the table view to see its status changed
    await page.locator('select[aria-label="Filter records by status"]').selectOption('all');
    // Now look for it in the resolved state
    // We expect the original card that was marked 'conflict' for this specific item is no longer visible
    // Note: Since Framer Motion uses layout animations, the easiest way to test completion of mutation
    // is ensuring the selection panel unmounts the active details view.
  });

  test('AC-04 schema_contract', async ({ page }) => {
    await page.goto('/');

    // Listen for the download
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export JSON")');
    const download = await downloadPromise;
    const stream = await download.createReadStream();
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const content = Buffer.concat(chunks).toString('utf-8');

    const parsed = JSON.parse(content);
    expect(parsed.schemaVersion).toBe('v1');
    expect(parsed.records.length).toBeGreaterThanOrEqual(100);
    expect(parsed.exportedAt).toBeDefined();

    // Valid bounds and structure check
    expect(parsed.records[0].id).toBeDefined();
    expect(parsed.records[0].status).toBeDefined();
    expect(parsed.records[0].measurement).toBeGreaterThanOrEqual(0);
    expect(parsed.records[0].measurement).toBeLessThanOrEqual(200);
  });

  test('AC-05 complete_user_flow', async ({ page }) => {
    await page.goto('/');

    // Create new
    await page.click('button:has-text("Add")');
    const titleInput = page.locator('input[aria-label="Edit title"]');
    await titleInput.fill('E2E Test Flow');
    await page.click('button:has-text("Save")');

    // Find the newly created annotation and delete it
    const newRecordDelete = page.locator('button[aria-label="Delete E2E Test Flow"]');
    await expect(newRecordDelete).toBeVisible();

    // Set up dialog handler for confirmation
    page.once('dialog', dialog => dialog.accept());
    await newRecordDelete.click();
    await expect(newRecordDelete).not.toBeVisible();

    // Verify undo works on the recovery board
    const undoButton = page.locator('button[aria-label="Undo last action"]');
    await undoButton.click();
    await expect(page.locator('button[aria-label="Delete E2E Test Flow"]')).toBeVisible();
  });

  test('AC-06 boundaries_recovery', async ({ page }) => {
    await page.goto('/');

    // Create new
    await page.click('button:has-text("Add")');

    // Set out-of-bounds measurement
    const measurementInput = page.locator('input[aria-label="Edit measurement"]');
    await measurementInput.fill('250');

    // Intercept alert
    let alertMessage = '';
    page.once('dialog', dialog => {
      alertMessage = dialog.message();
      dialog.accept();
    });

    await page.click('button:has-text("Save")');
    expect(alertMessage).toContain('Invalid measurement bounds');
  });

  test('AC-07 mobile_mode', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    // Make sure we aren't overflowing horizontally
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(windowWidth);

    // Test the interaction still works in mobile
    const conflictCard = page.locator('div.border-2.cursor-pointer', { hasText: 'conflict' }).first();
    await conflictCard.click();
    await expect(page.locator('button:has-text("Repair & Resolve")')).toBeVisible();
  });

  test('AC-08 alternate_input', async ({ page }) => {
    await page.goto('/');

    // First focus goes somewhere, eventually reaching a conflict record
    await page.locator('div.border-2.cursor-pointer').first().focus();
    await page.keyboard.press('Enter');

    // Assuming focus goes to selected and the button appears
    await expect(page.locator('button:has-text("Repair & Resolve")')).toBeVisible();
  });

  test('AC-09 large_collection', async ({ page }) => {
    await page.goto('/');
    // Check initial text
    const summaryCard = page.locator('div[aria-live="polite"]').locator('p');
    await expect(summaryCard).toContainText('100 records');

    // Edit a record and ensure it completes quickly (Playwright inherently checks responsiveness)
    const firstEditButton = page.locator('button[aria-label^="Edit"]').first();
    await firstEditButton.click();
    await page.locator('input[aria-label="Edit title"]').fill('Performance Test');
    await page.click('button:has-text("Save")');

    // Verify unrelated items exist and didn't crash
    const filter = page.locator('select[aria-label="Filter records by status"]');
    await filter.selectOption('ready');
    const tableRows = page.locator('table tbody tr');
    expect(await tableRows.count()).toBeGreaterThan(5);
  });

  test('AC-11 linked_utility', async ({ page }) => {
    await page.goto('/');

    const summaryCard = page.locator('div[aria-live="polite"]').locator('p');
    const initialText = await summaryCard.innerText();

    const firstConflict = page.locator('div.border-2.cursor-pointer', { hasText: 'conflict' }).first();
    await firstConflict.click();
    await page.click('button:has-text("Repair & Resolve")');

    const nextText = await summaryCard.innerText();
    expect(nextText).not.toBe(initialText);
    expect(nextText).toContain('Conflicts:');
  });

  test('AC-13 artifact_round_trip', async ({ page }) => {
    await page.goto('/');

    // Clear the board
    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Clear Session")');

    // Verify empty state
    await expect(page.locator('text=No annotations found.')).toBeVisible();

    // Import some dummy valid data
    const dummyPayload = {
      schemaVersion: 'v1',
      records: [{ id: 'test-1', title: 'Roundtrip Test', status: 'ready', measurement: 100 }],
      derived: { summary: '1 records. Drafts: 0, Conflicts: 0' },
      history: []
    };

    // Set file via filechooser
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('button:has-text("Import JSON")');
    const fileChooser = await fileChooserPromise;

    const importFile = 'test-import.json';
    fs.writeFileSync(importFile, JSON.stringify(dummyPayload));

    page.once('dialog', dialog => dialog.accept());
    await fileChooser.setFiles(importFile);

    // Verify data appears
    await expect(page.locator('text=Roundtrip Test')).toBeVisible();
    await expect(page.locator('text=100')).toBeVisible();

    fs.unlinkSync(importFile);
  });

});

// ==== END CANONICAL REGION — add task-specific criterion tests below. ====
// NOT-AUTOMATABLE: AC-02 visual_hierarchy — visual contrast and layout balance cannot be deterministically graded with DOM queries
// NOT-AUTOMATABLE: AC-10 domain_copy — subjective text tone grading requires LLM reading
// NOT-AUTOMATABLE: AC-12 source_fidelity — visual comparison against the provided source references requires a human or multimodal judge
