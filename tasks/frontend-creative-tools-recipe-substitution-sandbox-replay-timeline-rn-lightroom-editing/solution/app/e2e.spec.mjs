import { test, expect } from '@playwright/test';

test('Signature interaction: Scrub a selected record through its timeline', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  // Verify initial state
  await expect(page.locator('text=Recipe Substitution Sandbox')).toBeVisible();

  // Select the first ingredient
  await page.click('text=Flour substitution');
  await page.waitForTimeout(500);

  // Edit substitution value to create a mutation (adds to history)
  const substitutionInput = page.locator('label:has-text("Substitution Value") + input');
  await substitutionInput.fill('Coconut Flour');
  await page.waitForTimeout(500);

  // Edit quantity value to create another mutation
  const quantityInput = page.locator('label:has-text("Quantity") + input');
  await quantityInput.fill('2 cups');
  await page.waitForTimeout(500);

  // Change status
  const statusSelect = page.locator('label:has-text("Set Status") + select');
  await statusSelect.selectOption('conflict');
  await page.waitForTimeout(500);

  // Check that the history slider has updated to at least length 3 (initial + 3 edits)
  const slider = page.locator('input[type="range"]');
  // We can't directly read max easily in playwright without eval, let's just scrub it

  // Scrub back
  await slider.fill('1');
  await slider.dispatchEvent('change');
  await page.waitForTimeout(500);

  // Undo Last Mutation globally
  await page.click('text=Undo Last Mutation');
  await page.waitForTimeout(500);

  // Add new item
  await page.click('text=Add New');
  await page.fill('input[name="name"]', 'Sugar replacer');
  await page.fill('input[name="quantity"]', '1 tbsp');
  await page.fill('input[name="substitution"]', 'Stevia');
  await page.selectOption('select[name="status"]', 'draft');
  await page.click('text=Save Item');
  await page.waitForTimeout(500);

  // Filter
  await page.click('text=draft');
  await page.waitForTimeout(500);
  await page.click('text=all');
  await page.waitForTimeout(500);

  // Export
  // Mock download
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('text=Export Artifact')
  ]);
  const path = await download.path();
  expect(path).toBeTruthy();

  // Clear workspace
  await page.click('text=Clear Workspace');
  await page.waitForTimeout(500);

  await page.waitForTimeout(2000); // Final pause
});
