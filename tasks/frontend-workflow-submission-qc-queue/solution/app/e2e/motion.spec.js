import { expect, test } from '@playwright/test'
import { addFinding, boot, openSubmission, selectQueueRows, titles } from './helpers.js'

test('3.1 hover_system_present', async ({ page }) => {
  await boot(page)
  const button = page.getByRole('button', { name: 'Export' })
  expect(await button.evaluate((el) => getComputedStyle(el).transitionDuration)).not.toBe('0s')
  await openSubmission(page, titles.blocker)
  const chip = page.locator('.tier-chip').first()
  const before = await chip.evaluate((el) => getComputedStyle(el).transform)
  await chip.hover()
  await expect.poll(() => chip.evaluate((el) => getComputedStyle(el).transform)).not.toBe(before)
})

test('3.2 drawer_slides_view_transitions', async ({ page }) => {
  await boot(page)
  await page.getByRole('button', { name: 'Mara Voss' }).first().click()
  const drawer = page.getByRole('dialog')
  expect(await drawer.evaluate((el) => getComputedStyle(el.closest('.n-drawer')).transitionDuration)).not.toBe('0s')
})

test('3.3 finding_changes_animate', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.empty)
  await addFinding(page)
  expect(await page.locator('.finding-card').evaluate((el) => getComputedStyle(el).transitionDuration)).not.toBe('0s')
})

test('3.4 gate_banner_animated_swap', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.empty)
  expect(await page.locator('.gate-banner').evaluate((el) => getComputedStyle(el).transitionDuration)).toContain('0.3s')
  expect(await page.locator('.bar-fill').first().evaluate((el) => getComputedStyle(el).transitionDuration)).toContain('0.3s')
})

test('3.6 recheck_steps_animate', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.blocker)
  await page.getByRole('button', { name: 'Run re-check' }).click()
  expect(await page.locator('.recheck-steps li').first().evaluate((el) => getComputedStyle(el).transitionDuration)).not.toBe('0s')
})

test('3.7 disclosures_and_toasts_animate', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.blocker)
  expect(await page.locator('.evidence-toggle svg').first().evaluate((el) => getComputedStyle(el).transitionDuration)).not.toBe('0s')
  await page.locator('.evidence-toggle').first().click()
  await page.getByRole('button', { name: 'Remove' }).first().click()
  await expect(page.getByRole('status').filter({ hasText: 'Finding removed' }).first()).toBeVisible()
})

test('3.8 reduced_motion_respected', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await boot(page)
  await openSubmission(page, titles.blocker)
  const durations = await page.locator('.gate-banner, .bar-fill, .finding-card, .evidence-toggle svg').evaluateAll((elements) =>
    elements.map((element) => getComputedStyle(element).transitionDuration),
  )
  expect(durations.length).toBeGreaterThan(3)
  expect(durations.every((duration) => Number.parseFloat(duration) <= 0.001)).toBe(true)
})

test('3.9 palette_and_bulk_bar_animate', async ({ page }) => {
  await boot(page)
  await page.keyboard.press('Control+k')
  expect(await page.getByRole('dialog', { name: 'Command palette' }).evaluate((el) => getComputedStyle(el).transitionDuration)).not.toBe('0s')
  await page.keyboard.press('Escape')
  await selectQueueRows(page, [titles.empty])
  expect(await page.getByRole('form', { name: 'Bulk submission actions' }).evaluate((el) => getComputedStyle(el).transitionDuration)).not.toBe('0s')
})
