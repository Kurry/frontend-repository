/*
 * NOT-AUTOMATABLE:
 * 11.1 delightful_microinteractions — “delightful” is a subjective quality judgment.
 * 11.7 polished_brand_narrative — polish and narrative quality require editorial review.
 * 11.10 competition_level_innovation — competition-level merit has no deterministic threshold.
 * innovation.catchall innovation_catchall — by definition requires a judge to identify an uncatalogued enhancement.
 */
import { activeForm, loadApp, test, expect } from './helpers'

test.beforeEach(async ({ page }) => loadApp(page))

test('11.2 advanced_motion_mechanics', async ({ page }) => {
  const glyph = page.locator('.hero-glyph')
  expect(await glyph.evaluate((node) => getComputedStyle(node).transform)).not.toBe('none')
  await page.getByRole('button', { name: /Few-Shot/ }).first().click()
  await expect(page.locator('.hero-parallax')).toBeAttached()
})

test('11.3 guided_onboarding', async ({ page }) => {
  await page.getByRole('button', { name: 'Guided tour' }).click()
  await expect(page.getByRole('complementary', { name: 'Guided onboarding' })).toContainText('Welcome to Template Forms')
  await page.getByRole('button', { name: 'Continue tour' }).click()
  await expect(page.getByRole('complementary', { name: 'Guided onboarding' })).toContainText('Craft in Studio')
})

test('11.4 enhanced_interactive_graphics', async ({ page }) => {
  const zeroBar = page.locator('.technique-pulse__bar').first().locator('span')
  const before = await zeroBar.evaluate((node) => getComputedStyle(node).height)
  await activeForm(page).getByLabel('Task description').fill('Update the session chart')
  await activeForm(page).getByRole('button', { name: 'Generate prompt' }).click()
  const after = await zeroBar.evaluate((node) => getComputedStyle(node).height)
  expect(after).not.toBe(before)
  await expect(page.getByRole('img', { name: 'Relative activity across prompting techniques' })).toBeVisible()
})

test('11.5 alternative_input_support', async ({ page }) => {
  await page.getByRole('button', { name: 'Start voice input' }).click()
  await expect(page.getByRole('button', { name: /(Start|Stop) voice input/ })).toBeVisible()
})

test('11.6 preference_personalization', async ({ page }) => {
  await page.getByRole('button', { name: 'Switch to dark theme' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.getByRole('button', { name: 'Switch to compact density' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-density', 'compact')
})

test('11.8 dynamic_theming_beyond_requirements', async ({ page }) => {
  const shell = page.locator('.app-shell')
  const light = await shell.evaluate((node) => getComputedStyle(node).backgroundColor)
  await page.getByRole('button', { name: 'Switch to dark theme' }).click()
  const dark = await shell.evaluate((node) => getComputedStyle(node).backgroundColor)
  expect(dark).not.toBe(light)
  await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible()
})

test('11.9 genre_appropriate_platform_features', async ({ page }) => {
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest')
  const manifest = await page.evaluate(async () => (await fetch('/manifest.webmanifest')).json())
  expect(manifest.name).toMatch(/Template Forms/)
  await expect.poll(() => page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length)).toBeGreaterThan(0)
})
