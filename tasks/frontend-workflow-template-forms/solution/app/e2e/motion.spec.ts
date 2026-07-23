/* NOT-AUTOMATABLE: none; motion is checked through real controls and computed timing. */
import { activeForm, dialogByHeading, generateZeroShot, loadApp, openLibrary, saveCurrentPrompt, test, expect } from './helpers'

const seconds = (value: string) => Math.max(...value.split(',').map((part) => Number.parseFloat(part) || 0))

test.beforeEach(async ({ page }) => loadApp(page))

test('4.1 technique_switch_crossfade', async ({ page }) => {
  await page.getByRole('button', { name: /Few-Shot/ }).first().click()
  const animation = await page.locator('.form-fade').evaluate((node) => getComputedStyle(node).animationDuration)
  expect(seconds(animation)).toBeCloseTo(0.15, 2)
})

test('4.2 dynamic_row_height_animation', async ({ page }) => {
  await page.getByRole('button', { name: /Few-Shot/ }).first().click()
  await activeForm(page).getByRole('button', { name: 'Add example' }).click()
  const transition = await activeForm(page).locator('.dynamic-row').last().evaluate((node) => getComputedStyle(node).transitionDuration)
  expect(seconds(transition)).toBeCloseTo(0.15, 2)
  await activeForm(page).getByRole('button', { name: 'Remove example 2' }).click()
  await expect(activeForm(page).locator('.dynamic-row')).toHaveCount(1)
})

test('4.3 inline_error_easing', async ({ page }) => {
  const field = activeForm(page).getByLabel('Task description')
  await field.focus()
  await field.blur()
  const error = page.locator('.cds--form-requirement').filter({ hasText: 'Task description is required' })
  await expect(error).toBeVisible()
  expect(seconds(await error.evaluate((node) => getComputedStyle(node).animationDuration))).toBeCloseTo(0.09, 2)
  await activeForm(page).getByLabel('Task description').fill('Resolved smoothly')
  await expect(error).toHaveCount(0)
})

test('4.4 status_chip_transition', async ({ page }) => {
  await activeForm(page).getByLabel('Task description').fill('Animate status')
  const chip = page.locator('.status-in-progress').first()
  await expect(chip).toBeVisible()
  expect(seconds(await chip.evaluate((node) => getComputedStyle(node).animationDuration))).toBeCloseTo(0.09, 2)
  await activeForm(page).getByRole('button', { name: 'Generate prompt' }).click()
  await expect(page.locator('.status-generated').first()).toBeVisible()
})

test('4.5 modal_and_toast_motion', async ({ page }) => {
  await generateZeroShot(page)
  await page.getByRole('button', { name: 'Save to library' }).click()
  const modal = page.locator('.cds--modal-container')
  expect(seconds(await modal.evaluate((node) => getComputedStyle(node).animationDuration))).toBeCloseTo(0.09, 2)
  const dialog = dialogByHeading(page, 'Save prompt to library')
  await dialog.getByLabel('Title').fill('Motion proof')
  await dialog.getByRole('button', { name: 'Save prompt', exact: true }).click()
  const toast = page.getByRole('status', { name: 'Notifications' })
  await expect(toast).toBeVisible()
  expect(seconds(await toast.evaluate((node) => getComputedStyle(node).animationDuration))).toBeCloseTo(4.2, 1)
  await expect(toast).toHaveCount(0, { timeout: 5_000 })
})

test('4.6 copy_and_library_microinteractions', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await generateZeroShot(page)
  await page.getByRole('button', { name: 'Copy assembled prompt' }).click()
  const copied = page.getByRole('button', { name: 'Prompt copied' })
  await expect(copied).toBeVisible()
  await saveCurrentPrompt(page, 'Animated library row')
  await openLibrary(page)
  const row = page.locator('.library-row').filter({ hasText: 'Animated library row' })
  expect(seconds(await row.evaluate((node) => getComputedStyle(node).animationDuration))).toBeCloseTo(0.09, 2)
})

test('4.7 hover_system_present', async ({ page }) => {
  const technique = page.getByRole('button', { name: /Few-Shot/ }).first()
  await technique.hover()
  await expect(technique).toHaveCSS('background-color', 'rgb(237, 243, 255)')
  const generate = activeForm(page).getByRole('button', { name: 'Generate prompt' })
  expect(seconds(await generate.evaluate((node) => getComputedStyle(node).transitionDuration))).toBeGreaterThan(0)
  await activeForm(page).getByLabel('Task description').focus()
  expect(await activeForm(page).getByLabel('Task description').evaluate((node) => getComputedStyle(node).outlineStyle !== 'none' || getComputedStyle(node).boxShadow !== 'none')).toBe(true)
})

test('4.8 reduced_motion_respected', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload()
  await page.getByRole('button', { name: 'Skip tour' }).click()
  await page.getByRole('button', { name: /Few-Shot/ }).first().click()
  await activeForm(page).getByRole('button', { name: 'Add example' }).click()
  const maxDuration = await page.evaluate(() => Math.max(0, ...Array.from(document.querySelectorAll('.form-fade, .dynamic-row')).flatMap((node) => {
    const style = getComputedStyle(node)
    return [...style.animationDuration.split(','), ...style.transitionDuration.split(',')].map((value) => Number.parseFloat(value) || 0)
  })))
  expect(maxDuration).toBeLessThanOrEqual(0.001)
  await expect(activeForm(page).locator('.dynamic-row')).toHaveCount(2)
})
