import { test, expect } from './fixtures';
import { css, openApp, openResults, openSubmit } from './helpers';

test.beforeEach(async ({ page }) => openApp(page));

test('3.1 console_shell_composition', async ({ page }) => {
  await expect(page.locator('.sidebar')).toBeVisible(); await expect(page.locator('.rollup-strip')).toBeVisible(); await expect(page.locator('.canvas')).toContainText('Pipeline board');
  await page.getByRole('button', { name: 'Datasets', exact: true }).click(); await expect(page.locator('.sidebar')).toBeVisible(); await expect(page.locator('.rollup-strip')).toBeVisible(); await expect(page.locator('.canvas')).toContainText('Datasets');
});

test('3.2 status_color_system_consistent', async ({ page }) => {
  const expected: Record<string, string> = { Pending: 'rgb(238, 240, 243)', Running: 'rgb(234, 240, 255)', Complete: 'rgb(230, 245, 239)', Failed: 'rgb(255, 235, 238)' };
  for (const [status, color] of Object.entries(expected)) { const chip = page.locator(`.status-${status.toLowerCase()}`).first(); await expect(chip).toHaveText(status); expect(await css(chip, 'background-color')).toBe(color); }
  await expect(page.locator('.status-skipped').first()).toHaveText('Skipped');
});

test('3.3 connector_progress_scannable', async ({ page }) => {
  const completeRun = page.locator('.run-strip').first(); await expect(completeRun.locator('.connector.filled')).toHaveCount(2); const incomplete = page.locator('.run-strip', { hasText: 'Nova data forge' }); await expect(incomplete.locator('.connector.filled')).toHaveCount(0);
});

test('3.4 charts_and_code_block_styling', async ({ page }) => {
  const loss = page.locator('.micro-chart .recharts-area-curve').first(); expect(await loss.getAttribute('stroke')).toBe('#6d5dfc');
  await page.getByRole('button', { name: 'Datasets', exact: true }).click(); expect(await page.locator('.distribution .recharts-rectangle').first().getAttribute('fill')).toBe('#6d5dfc');
  await page.getByRole('button', { name: 'Pipeline board' }).click(); await openSubmit(page); expect(await page.getByLabel('Live job configuration preview').evaluate((e) => getComputedStyle(e).fontFamily)).toMatch(/mono/i);
});

test('3.5 component_states_and_hierarchy', async ({ page }) => {
  const viewTitle = parseFloat(await css(page.getByRole('heading', { name: 'Pipeline board' }), 'font-size')); const cardTitle = parseFloat(await css(page.locator('.phase-card h3').first(), 'font-size')); const metadata = parseFloat(await css(page.locator('.config-grid dt').first(), 'font-size')); expect(viewTitle).toBeGreaterThan(cardTitle); expect(cardTitle).toBeGreaterThan(metadata);
  const submit = page.getByRole('button', { name: 'Submit job' }).first(); const normal = await css(submit, 'background-color'); await submit.hover(); expect(await css(submit, 'background-color')).not.toBe(normal); await submit.click();
  const disabled = page.getByRole('dialog').getByRole('button', { name: 'Submit job' }); await expect(disabled).toBeDisabled(); await expect(disabled).toHaveAttribute('data-disabled', 'true'); expect(await css(disabled, 'background-color')).not.toBe(normal);
});

test('3.7 responsive_sidebar_breakpoints', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 }); await expect(page.locator('.sidebar')).toBeVisible(); await page.setViewportSize({ width: 768, height: 768 }); await expect(page.locator('.sidebar')).toBeHidden(); await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible();
});

test('3.8 writing_conventions', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Submit job' }).first()).toBeVisible(); await expect(page.getByRole('button', { name: 'Export runs' })).toBeVisible();
  await openSubmit(page); await expect(page.getByText('Dataset is missing. Select a dataset.')).toBeVisible();
  await page.keyboard.press('Escape'); await page.getByRole('button', { name: 'Datasets', exact: true }).click(); await page.getByLabel('Search datasets').fill('none'); await expect(page.getByText('Try a different dataset name or clear the search.')).toBeVisible();
});
