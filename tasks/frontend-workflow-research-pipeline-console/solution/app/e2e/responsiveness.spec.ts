import { test, expect } from './fixtures';
import { openApp, openResults } from './helpers';

test.beforeEach(async ({ page }) => openApp(page));

test('7.1 layout_adapts_desktop_to_mobile', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 }); await expect(page.locator('.sidebar')).toBeVisible(); await page.setViewportSize({ width: 375, height: 812 }); await expect(page.locator('.mobile-header')).toBeVisible();
});

test('7.2 mobile_tap_targets_are_large_enough', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 }); const controls = page.locator('.mobile-header button, .heading-actions button'); for (let i = 0; i < await controls.count(); i++) { const box = await controls.nth(i).boundingBox(); expect(box!.height).toBeGreaterThanOrEqual(44); }
});

test('7.3 typography_resizes_across_breakpoints', async ({ page }) => {
  const h1 = page.getByRole('heading', { name: 'Pipeline board' }); await page.setViewportSize({ width: 1440, height: 900 }); const desktop = parseFloat(await h1.evaluate((e) => getComputedStyle(e).fontSize)); await page.setViewportSize({ width: 375, height: 812 }); const mobile = parseFloat(await h1.evaluate((e) => getComputedStyle(e).fontSize)); expect(mobile).toBeLessThan(desktop);
});

test('7.4 content_avoids_clipping_and_overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 }); expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375); await expect(page.getByRole('heading', { name: 'Pipeline board' })).toBeVisible();
});

test('7.5 chrome_adapts_to_small_screens', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 }); await expect(page.locator('.sidebar')).toBeHidden(); await page.getByRole('button', { name: 'Open navigation' }).click(); await expect(page.locator('.mobile-sidebar')).toBeVisible(); await expect(page.getByRole('button', { name: 'Close navigation' })).toBeVisible();
});

test('7.6 stacking_reflows_logically', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 }); const cards = page.locator('.run-strip').first().locator('.phase-card'); const boxes = await cards.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().top)); expect(boxes[1]).toBeGreaterThan(boxes[0]); expect(boxes[2]).toBeGreaterThan(boxes[1]);
});

test('7.7 mobile_touch_gestures_work', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 }); const button = page.getByRole('button', { name: 'Open navigation' }); const box = await button.boundingBox(); const cdp = await page.context().newCDPSession(page); await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box!.x + 10, y: box!.y + 10 }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await expect(page.locator('.mobile-sidebar')).toBeVisible();
});

test('7.8 small_screens_avoid_horizontal_scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 }); expect(await page.evaluate(() => document.body.scrollWidth)).toBeLessThanOrEqual(375);
});

test('7.9 media_and_canvases_resize', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 }); await page.getByRole('button', { name: 'Open navigation' }).click(); await page.locator('.mobile-sidebar').getByRole('button', { name: 'Results', exact: true }).click(); const chart = page.locator('.comparison-chart').first(); const box = await chart.boundingBox(); expect(box!.width).toBeLessThanOrEqual(343);
});

test('7.10 fixed_controls_remain_accessible', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 500 }); await page.evaluate(() => scrollTo(0, document.body.scrollHeight)); await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible();
});
