import { test, expect } from '@playwright/test';

test.describe('AC-01 signature_mutation', () => {
  test('AC-01 signature_mutation', async ({ page }) => {
    await page.goto('/');

    // Select first and second record
    await page.getByRole('checkbox', { name: 'Select Scale Warmup' }).check();
    await page.getByRole('checkbox', { name: 'Select Arpeggios' }).check();

    // Check initial summary
    await expect(page.getByText('Selected2')).toBeVisible();
    await expect(page.getByText('Total Ready1 / 3')).toBeVisible();

    // Reconcile
    await page.getByRole('button', { name: 'Reconcile Batch to Ready' }).click();

    // Check updated status in main view
    await expect(page.locator('.group').nth(0).getByText('ready')).toBeVisible();
    await expect(page.locator('.group').nth(1).getByText('ready')).toBeVisible();

    // Check updated summary
    await expect(page.getByText('Total Ready2 / 3')).toBeVisible();
  });
});

test.describe('AC-03 causal_motion', () => {
  test('AC-03 causal_motion', async ({ page }) => {
    await page.goto('/');
    const firstRow = page.locator('.transition-all.duration-300').first();
    await expect(firstRow).toBeVisible();
  });
});

test.describe('AC-05 complete_user_flow', () => {
  test('AC-05 complete_user_flow', async ({ page }) => {
    await page.goto('/');

    // Create new
    await page.getByRole('button', { name: 'New Segment' }).click();

    // Edit
    const newRecordTitle = page.getByPlaceholder('Segment Title').last();
    await newRecordTitle.fill('My New Song');

    const newRecordStatus = page.locator('.group').last().getByText('changed');
    await expect(newRecordStatus).toBeVisible();

    // Select and mutate
    await page.getByRole('checkbox', { name: 'Select My New Song' }).check();
    await page.getByRole('button', { name: 'Reconcile Batch to Ready' }).click();
    await expect(page.locator('.group').last().getByText('ready')).toBeVisible();

    // Undo
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(page.locator('.group').last().getByText('changed')).toBeVisible();

    // Delete
    await page.getByRole('button', { name: 'Delete My New Song' }).click();
    await expect(page.getByPlaceholder('Segment Title').last()).not.toHaveValue('My New Song');
  });
});

test.describe('AC-06 boundaries_recovery', () => {
  test('AC-06 boundaries_recovery', async ({ page }) => {
    await page.goto('/');
    const firstDurationInput = page.locator('input[type="number"]').first();
    await firstDurationInput.fill('0');
    await expect(page.getByText('Invalid duration for Scale Warmup. Must be between 1 and 300 minutes.')).toBeVisible();

    // Prior valid state preserved
    await page.reload();
    await expect(page.locator('input[type="number"]').first()).toHaveValue('10');
  });
});

test.describe('AC-11 linked_utility', () => {
  test('AC-11 linked_utility', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('checkbox', { name: 'Select Scale Warmup' }).check();
    await page.getByRole('checkbox', { name: 'Select New Piece Section A' }).check();
    await expect(page.getByText('Selected2')).toBeVisible();
    await expect(page.getByText('Batch Duration40 min')).toBeVisible();
    await expect(page.getByText('Avg BPM70')).toBeVisible();
  });
});
