import { expect, test } from '@playwright/test'
import { boot, expectNoPageOverflow, openExport, openSubmission, selectQueueRows, titles } from './helpers.js'

test('7.1 layout_adapts_desktop_to_mobile', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await boot(page)
  await expect(page.getByRole('columnheader', { name: 'Payout' })).toBeVisible()
  await page.setViewportSize({ width: 768, height: 900 })
  expect(await page.locator('.queue-table').evaluate((el) => getComputedStyle(el).overflowX)).toBe('auto')
})

test('7.2 mobile_tap_targets_are_large_enough', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 850 })
  await boot(page)
  for (const locator of [page.getByLabel('Filter by stage'), page.getByRole('button', { name: 'Export' }), page.getByRole('button', { name: 'Undo last action' })]) {
    const box = await locator.boundingBox()
    expect(Math.max(box.width, box.height)).toBeGreaterThanOrEqual(44)
  }
})

test('7.3 typography_resizes_across_breakpoints', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 850 })
  await boot(page)
  expect(parseFloat(await page.getByRole('heading', { name: 'Submission queue' }).evaluate((el) => getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(24)
  expect(parseFloat(await page.locator('.submission-title').first().evaluate((el) => getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(12)
})

test('7.4 content_avoids_clipping_and_overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 850 })
  await boot(page)
  await expectNoPageOverflow(page)
})

test('7.5 chrome_adapts_to_small_screens', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 850 })
  await boot(page)
  await selectQueueRows(page, [titles.empty])
  await expect(page.getByRole('form', { name: 'Bulk submission actions' })).toBeVisible()
  await page.getByRole('button', { name: 'Mara Voss' }).first().click()
  const drawer = page.getByRole('dialog')
  await expect.poll(() => drawer.evaluate((el) => Math.round(el.getBoundingClientRect().width))).toBe(375)
})

test('7.6 stacking_reflows_logically', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 })
  await boot(page)
  await openSubmission(page, titles.blocker)
  const findings = await page.locator('.findings-panel').boundingBox()
  const profile = await page.locator('.profile-panel').boundingBox()
  expect(profile.y).toBeGreaterThan(findings.y)
})

test('7.7 queue_scroll_container_on_narrow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 850 })
  await boot(page)
  expect(await page.locator('.queue-table').evaluate((el) => ({ internal: el.scrollWidth > el.clientWidth, overflow: getComputedStyle(el).overflowX }))).toEqual({ internal: true, overflow: 'auto' })
  await expectNoPageOverflow(page)
})

test('7.8 small_screens_avoid_horizontal_scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 850 })
  await boot(page)
  await openSubmission(page, titles.blocker)
  await expectNoPageOverflow(page)
  await openExport(page)
  await expectNoPageOverflow(page)
})

test('7.9 export_preview_fits_narrow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 850 })
  await boot(page)
  await openExport(page)
  const box = await page.locator('.code-window pre').boundingBox()
  expect(box.width).toBeLessThanOrEqual(339)
  await expectNoPageOverflow(page)
})

test('7.10 fixed_controls_remain_accessible', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 850 })
  await boot(page)
  for (const name of ['Undo last action', 'Redo last action', 'Export']) await expect(page.getByRole('button', { name })).toBeVisible()
})
