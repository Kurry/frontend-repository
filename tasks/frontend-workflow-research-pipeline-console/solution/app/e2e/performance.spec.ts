import { test, expect } from './fixtures';
import { openApp, openSubmit } from './helpers';

// NOT-AUTOMATABLE:
// - 9.5 large_collections_render_without_lag — the seeded oracle intentionally has seven runs; "large" and perceived lag require an agreed load profile.
// - 9.7 animations_maintain_smooth_frame_rate — a deterministic 60fps claim depends on host/GPU scheduling and cannot be proven reliably in CI.

test.beforeEach(async ({ page }) => openApp(page));

test('9.1 cold_start_is_under_two_seconds', async ({ page }) => {
  const start = Date.now(); await page.goto('/'); await expect(page.getByRole('button', { name: 'Submit job' }).first()).toBeEnabled(); expect(Date.now() - start).toBeLessThan(2_000);
});

test('9.2 console_is_clean', async ({ page }) => {
  await page.getByRole('button', { name: 'Datasets', exact: true }).click(); await page.getByRole('button', { name: 'Results', exact: true }).click(); await page.waitForTimeout(2_100); await expect(page.getByRole('heading', { name: 'Results', exact: true })).toBeVisible();
});

test('9.3 transitions_respond_under_100ms', async ({ page }) => {
  const response = await page.getByRole('button', { name: 'Datasets', exact: true }).evaluate((button) => new Promise<number>((resolve) => { const start = performance.now(); (button as HTMLButtonElement).click(); const observe = () => document.querySelector('h1')?.textContent === 'Datasets' ? resolve(performance.now() - start) : requestAnimationFrame(observe); observe(); }));
  expect(response).toBeLessThan(100); await expect(page.getByRole('heading', { name: 'Datasets', exact: true })).toBeVisible();
});

test('9.4 async_work_has_loading_indicators', async ({ page }) => {
  await expect(page.locator('[role="progressbar"]').first()).toBeVisible(); await expect(page.locator('.status-running.is-live').first()).toBeVisible();
});

test('9.6 state_changes_remain_interactive', async ({ page }) => {
  const progress = page.locator('.run-strip', { hasText: 'Nova data forge' }).getByText(/\d+ \/ 2,000/); const before = await progress.textContent(); await openSubmit(page); await page.getByRole('button', { name: 'Cancel submission' }).click(); await expect.poll(() => progress.textContent()).not.toBe(before);
});

test('9.8 rapid_input_does_not_freeze', async ({ page }) => {
  for (let i = 0; i < 6; i++) { await page.getByRole('button', { name: 'Datasets', exact: true }).click(); await page.getByLabel('Search datasets').fill(`x${i}`); await page.getByRole('button', { name: 'Pipeline board' }).click(); }
  await expect(page.getByRole('heading', { name: 'Pipeline board', exact: true })).toBeVisible();
});
