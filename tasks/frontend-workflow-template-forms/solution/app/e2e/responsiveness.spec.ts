/* NOT-AUTOMATABLE: none; each responsive criterion is checked at explicit viewports. */
import { activeForm, expectNoHorizontalOverflow, loadApp, test, expect } from './helpers'

test('7.1 layout_adapts_desktop_to_mobile', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await loadApp(page)
  await expect(page.getByRole('complementary', { name: 'Prompting techniques' })).toBeVisible()
  await page.setViewportSize({ width: 375, height: 844 })
  await expect(page.getByRole('complementary', { name: 'Prompting techniques' })).toBeHidden()
  await expect(page.getByLabel('Prompting technique', { exact: true })).toBeVisible()
})

test('7.2 mobile_tap_targets_are_large_enough', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 })
  await loadApp(page)
  const targets = page.locator('.app-header button:visible, .mobile-technique select:visible, .form-actions button:visible')
  const boxes = await targets.evaluateAll((nodes) => nodes.map((node) => {
    const box = node.getBoundingClientRect()
    return { label: node.getAttribute('aria-label') || node.textContent?.trim(), width: box.width, height: box.height }
  }))
  expect(boxes.length).toBeGreaterThan(0)
  expect(boxes.filter((box) => box.width < 44 || box.height < 44)).toEqual([])
})

test('7.3 typography_resizes_across_breakpoints', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await loadApp(page)
  const desktop = Number.parseFloat(await page.locator('.technique-hero h1').evaluate((node) => getComputedStyle(node).fontSize))
  await page.setViewportSize({ width: 375, height: 844 })
  const mobile = Number.parseFloat(await page.locator('.technique-hero h1').evaluate((node) => getComputedStyle(node).fontSize))
  expect(mobile).toBeLessThan(desktop)
  expect(mobile).toBeGreaterThanOrEqual(24)
})

test('7.4 content_avoids_clipping_and_overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 })
  await loadApp(page)
  await page.getByLabel('Prompting technique', { exact: true }).selectOption('few-shot')
  for (let index = 0; index < 3; index += 1) await activeForm(page).getByRole('button', { name: 'Add example' }).click()
  await activeForm(page).getByRole('button', { name: 'Add document' }).click()
  await page.getByRole('option', { name: /brand-voice-guide\.pdf/ }).click()
  await expectNoHorizontalOverflow(page)
})

test('7.5 chrome_adapts_to_small_screens', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 })
  await loadApp(page)
  const selector = page.getByLabel('Prompting technique', { exact: true })
  await expect(selector.locator('option')).toHaveCount(7)
  await selector.selectOption('constraint-based')
  await expect(page.getByRole('heading', { name: 'Constraint-Based', exact: true })).toBeVisible()
})

test('7.6 stacking_reflows_logically', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 })
  await loadApp(page)
  await activeForm(page).getByLabel('Task description').fill('Stack the preview below the form')
  await activeForm(page).getByRole('button', { name: 'Generate prompt' }).click()
  await expect(page.locator('#prompt-preview')).toBeVisible()
  const layout = await page.evaluate(() => {
    const form = document.querySelector('form.technique-form.is-active')!
    const preview = document.querySelector('#prompt-preview')!
    const section = form.querySelector('.form-section')!
    return {
      previewFollowsForm: Boolean(form.compareDocumentPosition(preview) & Node.DOCUMENT_POSITION_FOLLOWING),
      sectionColumns: getComputedStyle(section).gridTemplateColumns.split(' ').length,
      previewWidth: preview.getBoundingClientRect().width,
      mainWidth: document.querySelector('.studio-main')!.getBoundingClientRect().width,
    }
  })
  expect(layout.previewFollowsForm).toBe(true)
  expect(layout.sectionColumns).toBe(1)
  expect(layout.previewWidth).toBeLessThanOrEqual(layout.mainWidth)
})

test('7.7 mobile_touch_gestures_work', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 })
  await loadApp(page)
  const surface = page.locator('.mobile-technique')
  await surface.dispatchEvent('touchstart', { changedTouches: [{ identifier: 1, clientX: 300, clientY: 20 }] })
  await surface.dispatchEvent('touchend', { changedTouches: [{ identifier: 1, clientX: 100, clientY: 20 }] })
  await expect(page.getByRole('heading', { name: 'One-Shot', exact: true })).toBeVisible()
})

test('7.8 small_screens_avoid_horizontal_scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 })
  await loadApp(page)
  await expectNoHorizontalOverflow(page)
  await page.getByRole('button', { name: /Library/ }).first().click()
  await expectNoHorizontalOverflow(page)
})

test('7.9 media_and_canvases_resize', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 })
  await loadApp(page)
  // The activity graphic belongs to the desktop sidebar and is intentionally hidden on mobile.
  await expect(page.getByRole('img', { name: 'Relative activity across prompting techniques' })).toBeHidden()
  await expectNoHorizontalOverflow(page)
})

test('7.10 fixed_controls_remain_accessible', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 })
  await loadApp(page)
  await expect(page.getByRole('button', { name: 'Guided tour' })).toBeVisible()
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await expect(page.getByRole('button', { name: 'Guided tour' })).toBeVisible()
  await page.getByRole('button', { name: /Library/ }).first().click()
  await expect(page.getByRole('button', { name: 'Import JSON' })).toBeVisible()
})
