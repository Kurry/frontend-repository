/**
 * NOT-AUTOMATABLE:
 * - 3.1 spacing_and_sizing_follow_scale — “arbitrary” values require design judgment.
 * - 3.2 typography_matches_spec — screenshot/spec parity is a visual judgment.
 * - 3.3 layout_matches_reference — pixel-parity requires committed golden baselines.
 * - 3.6 control_styling_matches_spec — global aesthetic conformity is subjective.
 * - 3.7 typography_has_clear_hierarchy — clarity is subjective (numeric hierarchy is tested in visual_design).
 * - 3.9 surface_treatments_match_spec — precision against screenshots needs visual review.
 */
import { expect, gotoApp, openCreateDialog, openTask, test } from './fixtures'

test('3.4 specified_state_changes_animate', async ({ page }) => {
  await openTask(page)
  const toggle = page.getByRole('button', { name: 'Log excerpt' }).first()
  await toggle.click()
  expect(await page.locator('.log-disclosure').first().evaluate((element) => getComputedStyle(element).transitionDuration)).not.toBe('0s')
  await page.getByRole('button', { name: /^bad-success ·/ }).click()
  expect(await page.locator('.trial-row').first().evaluate((element) => getComputedStyle(element).animationName)).toBe('fadeMove')
})

test('3.5 responsive_behavior_matches_reference', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 })
  await gotoApp(page)
  await expect(page.getByRole('complementary', { name: 'Primary navigation' })).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('complementary', { name: 'Primary navigation' })).toBeHidden()
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
})

test('3.8 component_states_match_spec', async ({ page }) => {
  await gotoApp(page)
  const nav = page.getByRole('button', { name: 'Timeline', exact: true })
  const before = await nav.evaluate((element) => getComputedStyle(element).transform)
  await nav.hover()
  expect(await nav.evaluate((element) => getComputedStyle(element).transform)).not.toBe(before)
  const { dialog } = await openCreateDialog(page)
  const submit = dialog.getByRole('button', { name: 'Start pipeline run' })
  await expect(submit).toBeDisabled()
  expect(await submit.evaluate((element) => getComputedStyle(element).cursor)).toBe('not-allowed')
})

test('3.10 microinteractions_match_spec', async ({ page }) => {
  await gotoApp(page)
  const button = page.getByRole('button', { name: 'Create task', exact: true }).first()
  const transition = await button.evaluate((element) => getComputedStyle(element).transitionDuration)
  expect(transition.split(',').every((duration) => Number.parseFloat(duration) <= 0.16)).toBe(true)
  await button.hover()
  expect(await button.evaluate((element) => getComputedStyle(element).transform)).not.toBe('none')
})
