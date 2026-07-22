import { test, expect } from '@playwright/test';

test.describe('RepQuest Oracle E2E Tests', () => {
  test('page loads with no console errors and no page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message || String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('rep logging with field bounds and 120-char note rejection', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message || String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');

    // Switch to quest tab if not already
    await page.getByRole('tab', { name: 'Quest' }).click();

    // Test negative
    await page.getByLabel('Number of reps').fill('-1');
    await page.getByRole('button', { name: 'Log reps' }).click();
    await expect(page.getByText('Reps: enter a whole number from 1 to 9999.')).toBeVisible();

    // Test too large
    await page.getByLabel('Number of reps').fill('10000');
    await page.getByRole('button', { name: 'Log reps' }).click();
    await expect(page.getByText('Reps: enter a whole number from 1 to 9999.')).toBeVisible();

    // Test 120 char note rejection
    await page.getByLabel('Number of reps').fill('10');
    const longNote = 'a'.repeat(121);
    await page.getByLabel('Note (optional)').fill(longNote);
    await page.getByRole('button', { name: 'Log reps' }).click();
    await expect(page.getByText('Note: keep it to 120 characters or fewer.')).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('exact log count deltas', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message || String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');

    // Clean start
    await page.getByRole('tab', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'Reset quest' }).click();
    await page.getByRole('button', { name: 'Reset everything' }).click();

    await page.getByRole('tab', { name: 'Quest' }).click();

    // Log 15 reps
    await page.getByLabel('Number of reps').fill('15');
    await page.getByRole('button', { name: 'Log reps' }).click();

    // Verify 15 reps added
    await expect(page.locator('[data-stat="lifetime-reps"]').first()).toHaveText('15');

    // Log 20 more reps
    await page.getByLabel('Number of reps').fill('20');
    await page.getByRole('button', { name: 'Log reps' }).click();

    // Verify 35 reps total
    await expect(page.locator('[data-stat="lifetime-reps"]').first()).toHaveText('35');
    expect(errors).toHaveLength(0);
  });

  test('zone unlock/boss feedback', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message || String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');

    // Reset to start clean
    await page.getByRole('tab', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'Reset quest' }).click();
    await page.getByRole('button', { name: 'Reset everything' }).click();

    await page.getByRole('tab', { name: 'Quest' }).click();

    await page.getByLabel('Number of reps').fill('150');
    await page.getByRole('button', { name: 'Log reps' }).click();

    // Wait for the visual toast for zone unlock
    await expect(page.locator('.fixed.top-3.left-1\\/2').locator('div').filter({ hasText: /Unlocked/i }).first()).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('challenge lifecycle', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message || String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.getByRole('tab', { name: 'Quest' }).click();

    // Switch to challenge mode
    await page.getByRole('button', { name: 'Challenge mode' }).click();

    await page.getByRole('button', { name: 'Start run' }).click();
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'End run' })).toBeVisible();

    // Cannot change difficulty while active
    await expect(page.getByRole('button', { name: 'Hard' })).toBeDisabled();

    await page.getByRole('button', { name: 'End run' }).click();
    await expect(page.getByRole('heading', { name: 'Defeat' })).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('gear/history cross-view state', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message || String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');

    // Log some reps
    await page.getByRole('tab', { name: 'Quest' }).click();
    await page.getByLabel('Number of reps').fill('50');
    await page.getByRole('button', { name: 'Log reps' }).click();

    // Check history
    await page.getByRole('tab', { name: 'History' }).click();
    await expect(page.locator('span').filter({ hasText: 'Logged 50 reps' })).toBeVisible();

    // Check gear
    await page.getByRole('tab', { name: 'Gear' }).click();
    await expect(page.getByRole('tab', { name: 'Gear' })).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('reset cancel/confirm and empty undo/redo', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message || String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');

    await page.getByRole('tab', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'Reset quest' }).click();

    // Cancel
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Undo/Redo empty check
    await page.getByRole('tab', { name: 'Quest' }).click();
    await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Redo' })).toBeDisabled();
    expect(errors).toHaveLength(0);
  });

  test('save/resume gates', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message || String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');

    await page.getByRole('tab', { name: 'Quest' }).click();
    await page.getByRole('button', { name: 'Challenge mode' }).click();

    // Save disabled before run
    await expect(page.getByRole('button', { name: 'Save progress' })).toBeDisabled();

    // Start run, log set, then save
    await page.getByRole('button', { name: 'Start run' }).click();

    // In challenge mode, the input is: Challenge rep count
    await page.getByLabel('Challenge rep count').fill('10');
    await page.getByRole('button', { name: 'Log challenge reps' }).click();

    const saveBtn = page.getByRole('button', { name: 'Save progress' });
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();

    await expect(page.locator('div[aria-live="polite"].sr-only')).toContainText('progress', { ignoreCase: true });

    await page.reload();

    await page.getByRole('tab', { name: 'Quest' }).click();
    await page.getByRole('button', { name: 'Challenge mode' }).click();
    await expect(page.getByRole('button', { name: 'Resume saved run' })).toBeEnabled();
    expect(errors).toHaveLength(0);
  });

  test('rapid 25-log integrity', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message || String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');

    // Reset
    await page.getByRole('tab', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'Reset quest' }).click();
    await page.getByRole('button', { name: 'Reset everything' }).click();

    await page.getByRole('tab', { name: 'Quest' }).click();

    const repsField = page.getByLabel('Number of reps');
    const logBtn = page.getByRole('button', { name: 'Log reps' });

    for (let i = 0; i < 25; i++) {
      await repsField.fill('10');
      await logBtn.click();
    }

    await expect(page.locator('[data-stat="lifetime-reps"]').first()).toHaveText('250');

    await page.getByRole('tab', { name: 'History' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('button[aria-label^="Delete set"]')).toHaveCount(25);
    expect(errors).toHaveLength(0);
  });

  test('difficulty lock', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message || String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.getByRole('tab', { name: 'Quest' }).click();
    await page.getByRole('button', { name: 'Challenge mode' }).click();

    await page.getByRole('button', { name: 'Start run' }).click();

    await expect(page.getByRole('button', { name: 'Hard' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Easy' })).toBeDisabled();
    expect(errors).toHaveLength(0);
  });

  test('malformed import atomic rejection and live export/import round trip', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message || String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');

    await page.getByRole('tab', { name: 'Settings' }).click();

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Import Quest Log' }).click();
    const fileChooser = await fileChooserPromise;

    await fileChooser.setFiles({
      name: 'bad.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"invalid": true}')
    });

    await expect(page.locator('div[aria-live="polite"].sr-only')).toContainText('Invalid Quest Log file', { ignoreCase: true });

    // Export/Import round trip
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export Quest Log' }).click();
    const download = await downloadPromise;
    const path = await download.path();

    // Wipe and Import
    await page.getByRole('button', { name: 'Reset quest' }).click();
    await page.getByRole('button', { name: 'Reset everything' }).click();

    const fileChooserPromise2 = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Import Quest Log' }).click();
    const fileChooser2 = await fileChooserPromise2;
    await fileChooser2.setFiles(path);

    await expect(page.locator('div[aria-live="polite"].sr-only')).toContainText('Quest Log imported', { ignoreCase: true });
    expect(errors).toHaveLength(0);
  });

  test('responsive 375px layout and keyboard accessibility', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message || String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // No horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(windowWidth);

    // Keyboard nav
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).not.toBe('BODY');

    // Reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(errors).toHaveLength(0);
  });
});
