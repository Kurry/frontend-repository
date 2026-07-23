import { test, expect } from './fixtures';
import { css, fillEvaluate, openApp, openResults, openSubmit, submitAndGetNewRun } from './helpers';

test.beforeEach(async ({ page }) => openApp(page));

test('4.1 hover_feedback_on_chrome', async ({ page }) => {
  const button = page.getByRole('button', { name: 'Submit job' }).first(); const beforeButton = await css(button, 'box-shadow'); await button.hover(); expect(await css(button, 'box-shadow')).not.toBe(beforeButton);
  const strip = page.locator('.run-strip').first(); const beforeStrip = await css(strip, 'background-color'); await strip.hover(); await expect.poll(() => css(strip, 'background-color')).not.toBe(beforeStrip);
  const nav = page.getByRole('button', { name: 'Datasets', exact: true }); const beforeNav = await css(nav, 'background-color'); await nav.hover(); await expect.poll(() => css(nav, 'background-color')).not.toBe(beforeNav);
});

test('4.2 strip_and_row_microinteractions', async ({ page }) => {
  const dialog = await fillEvaluate(page); const run = await submitAndGetNewRun(page, dialog); await expect(run).toHaveClass(/new-run/);
  expect(parseFloat(await css(run, 'transition-duration'))).toBeGreaterThan(0);
  await openResults(page); const row = page.locator('.leaderboard-row').first(); await page.getByRole('button', { name: /Sort by Cost/ }).click(); expect(await css(row, 'animation-name')).toBe('row-place');
});

test('4.3 status_transition_animation', async ({ page }) => {
  const running = page.locator('.status-running').first(); expect(await css(running, 'animation-name')).toContain('pulse'); expect(parseFloat(await css(running, 'transition-duration'))).toBeGreaterThan(0);
  const connector = page.locator('.connector.filled').first().locator('span'); await expect(connector).toBeVisible(); expect(parseFloat(await css(connector, 'transition-duration'))).toBeGreaterThan(0);
});

test('4.4 submission_panel_transition', async ({ page }) => {
  await openSubmit(page); const content = page.getByRole('dialog'); expect(parseFloat(await css(content, 'transition-duration'))).toBeGreaterThanOrEqual(.2); await page.keyboard.press('Escape'); await expect(content).toHaveCount(0);
});

test('4.5 toasts_slide_and_autodismiss', async ({ page }) => {
  const dialog = await fillEvaluate(page); await submitAndGetNewRun(page, dialog); const toast = page.getByText(/run-\d+ submitted to aurora/).first(); await expect(toast).toBeVisible(); await expect(toast).toHaveCount(0, { timeout: 5_000 });
});

test('4.6 trace_streams_with_indicator', async ({ page }) => {
  await openResults(page); await page.locator('.result-cell').first().click(); await page.locator('.mantine-Accordion-control').first().click();
  const text = page.locator('.trace-box p'); const early = await text.textContent(); await expect(page.getByText('streaming trace…')).toBeVisible(); await expect(page.getByText('streaming trace…')).toHaveCount(0, { timeout: 5_000 }); expect((await text.textContent())!.length).toBeGreaterThan(early!.length);
});

test('4.7 reduced_motion_respected', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.reload(); const strip = page.locator('.run-strip').first(); expect(parseFloat(await css(strip, 'transition-duration'))).toBeLessThanOrEqual(.001); await expect(page.getByText('advancing live')).toBeVisible();
});
