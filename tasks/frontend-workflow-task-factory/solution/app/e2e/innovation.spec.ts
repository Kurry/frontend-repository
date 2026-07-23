/**
 * NOT-AUTOMATABLE:
 * - 11.1 delightful_microinteractions — delight is subjective.
 * - 11.7 polished_brand_narrative — polish is subjective.
 * - 11.10 competition_level_innovation — competitive novelty requires comparative review.
 * - innovation.catchall innovation_catchall — by definition requires open-ended human identification.
 */
import { expect, gotoApp, openCreateDialog, test } from './fixtures'

test('11.2 advanced_motion_mechanics', async ({ page }) => {
  await gotoApp(page)
  await page.getByRole('button', { name: 'Analytics', exact: true }).click()
  const story = page.locator('.scroll-story')
  const before = await story.evaluate((element) => getComputedStyle(element).transform)
  await page.mouse.wheel(0, 500)
  await expect.poll(() => story.evaluate((element) => getComputedStyle(element).transform)).not.toBe(before)
})

test('11.3 guided_onboarding', async ({ page }) => {
  await page.goto('/')
  const tour = page.getByRole('dialog', { name: 'Factory onboarding' })
  await expect(tour).toContainText('Guided setup · 1 / 3')
  await tour.getByRole('button', { name: 'Next' }).click()
  await expect(tour).toContainText('Guided setup · 2 / 3')
  await tour.getByRole('button', { name: 'Open create' }).click()
  await expect(page.getByRole('dialog', { name: 'Create benchmark task' })).toBeVisible()
})

test('11.4 enhanced_interactive_graphics', async ({ page }) => {
  await gotoApp(page)
  await page.getByRole('button', { name: 'Analytics', exact: true }).click()
  await expect(page.locator('.recharts-wrapper')).toHaveCount(3)
  await page.locator('.recharts-pie-sector path').first().hover()
  await expect(page.locator('[data-chart-tooltip="true"]')).toBeVisible()
})

test('11.5 alternative_input_support', async ({ page }) => {
  await gotoApp(page)
  const { dialog } = await openCreateDialog(page)
  await dialog.getByRole('button', { name: 'Voice fill (demo)' }).click()
  await expect(dialog.getByLabel('Pull-request number')).toHaveValue('999')
})

test('11.6 preference_personalization', async ({ page }) => {
  await gotoApp(page)
  await page.getByRole('button', { name: 'Dark', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.getByRole('button', { name: 'Compact', exact: true }).click()
  await expect(page.locator('.app-shell')).toHaveClass(/density-compact/)
  await page.getByRole('button', { name: /Gesture shortcuts off/ }).click()
  await expect(page.locator('.app-shell')).toHaveClass(/gesture-on/)
})

test('11.8 dynamic_theming_beyond_requirements', async ({ page }) => {
  await gotoApp(page)
  const before = await page.locator('.main').evaluate((element) => getComputedStyle(element).backgroundColor)
  await page.getByRole('button', { name: 'Dark', exact: true }).click()
  const after = await page.locator('.main').evaluate((element) => getComputedStyle(element).backgroundColor)
  expect(after).not.toBe(before)
  await expect(page.getByRole('button', { name: 'Dark', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

test('11.9 genre_appropriate_platform_features', async ({ page }) => {
  await gotoApp(page)
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.json')
  const manifest = await page.evaluate(async () => (await fetch('/manifest.json')).json())
  expect(manifest.name).toBeTruthy()
  expect(manifest.display).toBe('standalone')
  await expect(page.getByText(/Offline-ready · installable session shell/)).toBeVisible()
})
