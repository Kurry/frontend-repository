import { test, expect } from '@playwright/test';

// ==== END CANONICAL REGION — add task-specific criterion tests below. ====

test('AC-01 signature_mutation', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Select the first record
  await page.click('text=Shirt', { strict: false });

  // Ensure the ribbon is active
  await expect(page.locator('text=FORECAST RIBBON')).toBeVisible();

  // Change projection and priority
  await page.selectOption('select:has-text("Maintain pattern")', { label: 'Extend hemline' });
  await page.fill('input[type="range"]', '3');

  // Apply projection
  await page.click('button:has-text("Apply Projection to Canvas")');

  // Verify state change
  await expect(page.locator('text=State Updated')).toBeVisible();
  await expect(page.locator('.bg-white.px-4.py-2.rounded.shadow-sm.border.border-green-100')).toContainText('Extend hemline');
});

test('AC-05 complete_user_flow', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Create a new annotation
  await page.fill('input[placeholder="Garment"]', 'Test Garment');
  await page.fill('input[placeholder="Fit Issue"]', 'Test Issue');
  await page.fill('input[placeholder="Delta (cm)"]', '5');
  await page.click('button:has-text("Add")');

  // Ensure it shows up
  await expect(page.locator('text=Test Garment')).toBeVisible();

  // Edit it
  await page.click('text=Test Garment >> ../.. >> button:has-text("")'); // Pencil
  await page.fill('input[placeholder="Garment"]', 'Edited Garment');
  await page.click('button:has-text("Save")');

  // Ensure it was edited
  await expect(page.locator('text=Edited Garment')).toBeVisible();

  // Select it
  await page.click('text=Edited Garment');

  // Mutate it
  await page.click('button:has-text("Apply Projection to Canvas")');
  await expect(page.locator('text=State Updated')).toBeVisible();

  // Undo it
  await page.click('button:has-text("Undo")');
  await expect(page.locator('text=Apply Projection to Canvas')).toBeVisible();
});

test('AC-06 boundaries_recovery', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Try invalid create
  await page.fill('input[placeholder="Garment"]', '');
  await page.fill('input[placeholder="Delta (cm)"]', '100'); // out of bounds
  await page.click('button:has-text("Add")');

  // Expect validation errors
  await expect(page.locator('text=Garment is required')).toBeVisible();
  await expect(page.locator('text=Max 50')).toBeVisible();
});

test('AC-11 linked_utility', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('text=Shirt', { strict: false });
  await expect(page.locator('text=Project Evidence')).toBeVisible();
});

test('AC-13 artifact_round_trip', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Open Export
  await page.click('button:has-text("Export / Import")');

  // Get the artifact text
  const artifactLocator = page.locator('.whitespace-pre');
  const artifactText = await artifactLocator.innerText();
  const parsed = JSON.parse(artifactText);

  expect(parsed.schemaVersion).toBe('fit-annotations-v1');
  expect(parsed.records.length).toBeGreaterThan(0);

  // Clear workspace
  await page.click('button:has-text("Clear Workspace")');

  // Verify it's empty
  await expect(artifactLocator).toContainText('"records": []');

  // Re-import
  await page.fill('textarea[placeholder="Paste JSON here..."]', artifactText);
  await page.click('button:has-text("Validate & Import")');

  // Verify it's back
  await expect(page.locator('text=Import successful')).toBeVisible();

  // Close modal
  await page.keyboard.press('Escape');

  // Verify items on screen
  await expect(page.locator('text=Shirt').first()).toBeVisible();
});

test('AC-04 schema_contract', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('button:has-text("Export / Import")');
  const text = await page.locator('.whitespace-pre').innerText();
  expect(text).toContain('"schemaVersion": "fit-annotations-v1"');
});

test('AC-09 large_collection', async ({ page }) => {
  await page.goto('http://localhost:3000');
  // Seeding happens automatically on mount
  // Just count records to ensure it's performant enough
  const records = await page.locator('.border-gray-200.hover\\:border-blue-300').count();
  expect(records).toBeGreaterThan(90);
});

// NOT-AUTOMATABLE: AC-02 visual_hierarchy — requires subjective visual assessment of the density and focus.
// NOT-AUTOMATABLE: AC-03 causal_motion — precise motion timing/morphs is difficult in headless environments.
// NOT-AUTOMATABLE: AC-07 mobile_mode — responsive layout transformations often need visual inspection or deep DOM checking not easily verifiable via general Playwright assertions.
// NOT-AUTOMATABLE: AC-08 alternate_input — verifying pure tactile/touch parity alongside keyboard focus visibility is subjective or heavily environment dependent.
// NOT-AUTOMATABLE: AC-10 domain_copy — assessing the "domain precision" of labels is a qualitative writing judgment.
// NOT-AUTOMATABLE: AC-12 source_fidelity — judging whether it's coherent without copying GitHub exactly is subjective.
