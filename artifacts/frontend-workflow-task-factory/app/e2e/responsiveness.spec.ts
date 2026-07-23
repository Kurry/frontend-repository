/**
 * NOT-AUTOMATABLE:
 * - 7.2 mobile_tap_targets_are_large_enough — effective target size includes
 *   platform hit slop and adjacent spacing that DOM bounding boxes cannot prove.
 */
import { expect, gotoApp, openRepository, test } from './fixtures'

test('7.1 layout_adapts_desktop_to_mobile', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await gotoApp(page)
  await expect(page.getByRole('complementary', { name: 'Primary navigation' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeHidden()
  await page.setViewportSize({ width: 375, height: 812 })
  await expect(page.getByRole('complementary', { name: 'Primary navigation' })).toBeHidden()
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible()
})

test('7.3 typography_resizes_across_breakpoints', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await gotoApp(page)
  const desktop = await page.locator('.page-title').evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))
  await page.setViewportSize({ width: 375, height: 812 })
  const mobile = await page.locator('.page-title').evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))
  expect(mobile).toBeLessThan(desktop)
  expect(mobile).toBeGreaterThanOrEqual(20)
})

test('7.4 content_avoids_clipping_and_overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await gotoApp(page)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
  await page.getByRole('button', { name: 'Open navigation' }).click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
})

test('7.5 chrome_adapts_to_small_screens', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await gotoApp(page)
  const sidebar = page.getByRole('complementary', { name: 'Primary navigation' })
  await expect(sidebar).toBeHidden()
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await expect(sidebar).toBeVisible()
  await page.getByRole('button', { name: 'Close navigation' }).click()
  await expect(sidebar).toBeHidden()
})

test('7.6 stacking_reflows_logically', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await gotoApp(page)
  const cards = page.locator('.repo-card')
  const boxes = await cards.evaluateAll((items) => items.map((item) => item.getBoundingClientRect()).map(({ x, y, width }) => ({ x, y, width })))
  expect(new Set(boxes.map((box) => Math.round(box.x))).size).toBe(1)
  expect(boxes.map((box) => box.y)).toEqual([...boxes.map((box) => box.y)].sort((a, b) => a - b))
  for (const box of boxes) expect(box.width).toBeLessThanOrEqual(375)
})

test('7.7 mobile_touch_gestures_work', async ({ page, context }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await gotoApp(page)
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await page.getByRole('button', { name: /Gesture shortcuts off/ }).click()
  await page.getByRole('button', { name: 'Repositories', exact: true }).click()
  await expect(page.getByRole('complementary', { name: 'Primary navigation' })).toBeHidden()
  const cdp = await context.newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 180, y: 650 }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 180, y: 500 }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect(page.getByRole('dialog', { name: 'Create benchmark task' })).toBeVisible()
  await expect(page.getByText('Gesture recognized: opened dialog')).toBeVisible()
})

test('7.8 small_screens_avoid_horizontal_scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await openRepository(page)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375)
  const table = page.locator('.table-scroll')
  expect(await table.evaluate((element) => element.scrollWidth)).toBeGreaterThan(await table.evaluate((element) => element.clientWidth))
})

test('7.9 media_and_canvases_resize', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await gotoApp(page)
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await page.getByRole('button', { name: 'Analytics', exact: true }).click()
  for (const wrapper of await page.locator('.chart-wrap').all()) {
    const box = await wrapper.boundingBox()
    expect(box?.width).toBeLessThanOrEqual(347)
    expect(box?.width).toBeGreaterThan(200)
  }
})

test('7.10 fixed_controls_remain_accessible', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 375, height: 812 }]) {
    await page.setViewportSize(viewport)
    await gotoApp(page)
    const create = page.getByRole('button', { name: 'Create task', exact: true }).first()
    await expect(create).toBeVisible()
    const box = await create.boundingBox()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width)
  }
})
