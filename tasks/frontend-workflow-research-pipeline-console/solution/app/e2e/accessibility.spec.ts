import { test, expect } from './fixtures';
import { fillEvaluate, openApp, openRun, openSubmit, submitAndGetNewRun } from './helpers';

test.beforeEach(async ({ page }) => openApp(page));

test('1.1 controls_are_keyboard_accessible', async ({ page }) => {
  await page.getByRole('button', { name: 'Datasets', exact: true }).focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Datasets', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Filter runs by Helix-12K' }).focus(); await page.keyboard.press('Space');
  await expect(page.locator('.active-filter')).toBeVisible();
});

test('1.2 modals_manage_focus', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Submit job' }).first(); await trigger.focus(); await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog'); await expect(dialog).toBeVisible();
  for (let i = 0; i < 30; i++) { await page.keyboard.press('Tab'); expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true); }
  await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0); await expect(trigger).toBeFocused();
});

test('1.3 images_and_icons_have_alt_text', async ({ page }) => {
  const invalid = await page.locator('svg.tabler-icon').evaluateAll((icons) => icons.filter((icon) => icon.getAttribute('aria-hidden') !== 'true' && !icon.getAttribute('aria-label') && icon.getAttribute('role') !== 'presentation').length);
  expect(invalid).toBe(0);
  await expect(page.getByRole('img', { name: 'Relay brand mark' })).toBeVisible();
});

test('1.4 feedback_uses_live_regions', async ({ page }) => {
  const dialog = await fillEvaluate(page); await submitAndGetNewRun(page, dialog);
  await expect(page.locator('.sr-only[aria-live="polite"]').filter({ hasText: /submitted/ })).toBeAttached();
  await openSubmit(page); await page.setInputFiles('#job-config-file', { name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{bad') });
  await expect(page.locator('.field-error[role="alert"]')).toContainText('Import rejected');
});

test('1.5 forms_have_explicit_labels', async ({ page }) => {
  await openSubmit(page);
  for (const name of ['Job type', 'Dataset', 'Model', 'Cluster']) await expect(page.getByRole('textbox', { name })).toBeVisible();
  for (const name of ['Epoch count', 'Start evaluation automatically when training completes']) await expect(page.getByLabel(name)).toBeVisible();
  await expect(page.locator('label[for="job-config-file"]')).toHaveText('Import job-config JSON file');
});

test('1.6 headings_follow_logical_order', async ({ page }) => {
  const levels = await page.locator('h1,h2,h3,h4,h5,h6').evaluateAll((items) => items.map((item) => Number(item.tagName.slice(1))));
  expect(levels[0]).toBe(1);
  for (let i = 1; i < levels.length; i++) expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
});

test('1.7 landmark_navigation_is_present', async ({ page }) => {
  await expect(page.getByRole('navigation')).toBeVisible(); await expect(page.getByRole('main')).toBeVisible(); await expect(page.locator('aside[aria-label="Primary navigation"]')).toBeVisible();
});

test('1.8 text_and_controls_have_contrast', async ({ page }) => {
  const parse = (s: string) => (s.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
  const lum = (rgb: number[]) => rgb.map((c) => { const n = c / 255; return n <= .03928 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4; }).reduce((v, c, i) => v + c * [.2126, .7152, .0722][i], 0);
  for (const locator of [page.getByRole('heading', { name: 'Pipeline board' }), page.getByRole('button', { name: 'Submit job' }).first(), page.locator('.status-complete').first()]) {
    const [fg, bg] = await locator.evaluate((el) => { let node: Element | null = el; let background = 'rgba(0, 0, 0, 0)'; while (node && /rgba?\([^)]*,\s*0\)/.test(background)) { background = getComputedStyle(node).backgroundColor; node = node.parentElement; } return [getComputedStyle(el).color, background]; });
    const [a, b] = [lum(parse(fg)), lum(parse(bg))]; expect((Math.max(a, b) + .05) / (Math.min(a, b) + .05)).toBeGreaterThan(3);
  }
});

test('1.9 semantic_html_roles_are_used', async ({ page }) => {
  await expect(page.locator('nav button')).toHaveCount(3); await expect(page.locator('main')).toHaveCount(1); await expect(page.locator('article.run-strip')).toHaveCount(7);
  const dialog = await openRun(page, 'run-1027'); await expect(dialog).toHaveAttribute('role', 'dialog');
});

test('1.10 reduced_motion_is_respected', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.reload();
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  const running = page.locator('.status-running').first(); expect(parseFloat(await running.evaluate((el) => getComputedStyle(el).animationDuration))).toBeLessThanOrEqual(.001);
  await expect(page.getByText('advancing live')).toBeVisible();
});
