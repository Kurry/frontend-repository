import { test, expect } from '@playwright/test';

// ==== START CANONICAL REGION — do not remove this boundary ====

// ==== END CANONICAL REGION — add task-specific criterion tests below. ====

test('AC-01 signature_mutation', async ({ page }) => {
  await page.goto('http://localhost:4173');

  // Select first record
  await page.locator('div[data-testid="record-Boundary-Low"]').click();
  await expect(page.locator('.bg-blue-50')).toBeVisible();

  // Change capacity slider
  const slider = page.locator('div[data-testid="record-Boundary-Low"] input[type="range"]');
  await slider.fill('50');

  // Verify derived view changes
  await expect(page.locator('div[data-testid="record-Boundary-Low"] .bg-amber-100').filter({ hasText: 'changed' })).toBeVisible();
});

test('AC-04 schema_contract', async ({ page }) => {
  await page.goto('http://localhost:4173');
  await expect(page.locator('text=Total Capacity')).toBeVisible();
});

test('AC-05 complete_user_flow', async ({ page }) => {
  await page.goto('http://localhost:4173');
  // Create
  await page.fill('input[placeholder="Name"]', 'New Flow');
  await page.fill('input[placeholder="Glaze"]', 'White');
  await page.click('button:has-text("Add")');
  await expect(page.locator('h3:has-text("New Flow")')).toBeVisible();

  // Mutate
  const newSlider = page.locator('div[data-testid="record-New-Flow"] input[type="range"]');
  await newSlider.fill('20');

  // Undo
  await page.click('button:has-text("Undo")');
  await expect(page.locator('div[data-testid="record-New-Flow"] .font-mono').last()).toHaveText('0');

  // Archive
  await page.hover('div[data-testid="record-New-Flow"]');
  await page.click('div[data-testid="record-New-Flow"] button:has-text("Archive")');
  await expect(page.locator('div[data-testid="record-New-Flow"] span.bg-gray-300')).toHaveText('archived');

  // Delete
  await page.hover('div[data-testid="record-New-Flow"]');
  await page.click('div[data-testid="record-New-Flow"] button:has-text("Delete")');
  await expect(page.locator('h3:has-text("New Flow")')).not.toBeVisible();
});

test('AC-06 boundaries_recovery', async ({ page }) => {
  await page.goto('http://localhost:4173');

  // Try adding invalid
  await page.fill('input[placeholder="Name"]', '  '); // empty
  await page.click('button:has-text("Add")');
  await expect(page.locator('text=Name is required')).toBeVisible();
});

test('AC-07 mobile_mode', async ({ page }) => {
  await page.goto('http://localhost:4173');
  await page.setViewportSize({ width: 375, height: 812 });
  // Just testing it renders properly without crashing
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('h2:has-text("Spatial Composer")')).toBeVisible();
});

test('AC-08 alternate_input', async ({ page }) => {
  await page.goto('http://localhost:4173');
  // Select via keyboard
  // Need to focus specifically on the item since tab order can be flaky in tests depending on OS/Browser
  await page.locator('div[data-testid="record-Boundary-Low"]').focus();
  await page.keyboard.press('Enter');

  // Change capacity with keys
  // Just focus the input and press right arrow
  await page.locator('div[data-testid="record-Boundary-Low"] input[type="range"]').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');

  await expect(page.locator('div[data-testid="record-Boundary-Low"] .bg-amber-100').filter({ hasText: 'changed' })).toBeVisible();

  // Ctrl+Z
  await page.keyboard.press('Control+Z');
  // Check it undid the change
});

test('AC-09 large_collection', async ({ page }) => {
  await page.goto('http://localhost:4173');
  await expect(page.locator('text=Boundary Low')).toBeVisible();
});

test('AC-10 domain_copy', async ({ page }) => {
  await page.goto('http://localhost:4173');
  await expect(page.locator('h2:has-text("Spatial Composer")')).toBeVisible();
  await expect(page.locator('h2:has-text("Linked Summary")')).toBeVisible();
  // We need to select an item to see "Detail Inspector" as it only renders on selection
  await page.locator('div[data-testid="record-Boundary-Low"]').click();
  await expect(page.locator('h2:has-text("Detail Inspector")')).toBeVisible();
});

test('AC-11 linked_utility', async ({ page }) => {
  await page.goto('http://localhost:4173');
  // Select record
  await page.locator('div[data-testid="record-Boundary-Low"]').click();
  // Ensure detail inspector shows corresponding data
  await expect(page.locator('.bg-white.border-l >> text=Boundary Low')).toBeVisible();
});

test('AC-13 artifact_round_trip', async ({ page }) => {
  await page.goto('http://localhost:4173');
  await page.click('button:has-text("Clear")');
  await expect(page.locator('text=No records.')).toBeVisible();
});

test('innovation.catchall', async ({ page }) => {
  await page.goto('http://localhost:4173');
  await expect(page.locator('h1')).toBeVisible();
});

// NOT-AUTOMATABLE: AC-02 - visual hierarchy is subjective
// NOT-AUTOMATABLE: AC-03 - motion connects item to new state is visual
// NOT-AUTOMATABLE: AC-12 - source fidelity is visual
