/*
 * NOT-AUTOMATABLE:
 * 3.1 spacing_and_sizing_follow_scale — detecting arbitrary one-off design values is a subjective system-level judgment.
 * 3.2 typography_matches_spec — the rubric provides no machine-comparable font metrics or baseline.
 * 3.3 layout_matches_reference — reference screenshots are intentionally outside the allowed E2E change surface.
 * 3.6 control_styling_matches_spec — “conform to the spec” has no exact numeric oracle.
 * 3.7 typography_has_clear_hierarchy — clarity is a perceptual judgment (explicit sizing is covered in visual_design).
 * 3.8 component_states_match_spec — pixel-level state fidelity needs visual review; interaction presence is covered elsewhere.
 * 3.9 surface_treatments_match_spec — precision of color/depth/borders is subjective without a baseline.
 * 3.10 microinteractions_match_spec — perceived motion fidelity is covered with objective duration probes in motion.spec.ts.
 */
import { expectNoHorizontalOverflow, loadApp, test, expect } from './helpers'

test('3.4 specified_state_changes_animate', async ({ page }) => {
  await loadApp(page)
  await page.getByRole('button', { name: /Few-Shot/ }).first().click()
  const duration = await page.locator('.form-panel > div').evaluate((node) => {
    const animations = node.getAnimations({ subtree: true })
    return Math.max(0, ...animations.map((animation) => Number(animation.effect?.getTiming().duration) || 0))
  })
  expect(duration).toBeGreaterThan(0)
})

test('3.5 responsive_behavior_matches_reference', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 })
  await loadApp(page)
  await expect(page.getByRole('complementary', { name: 'Prompting techniques' })).toBeHidden()
  await expect(page.getByLabel('Prompting technique', { exact: true })).toBeVisible()
  await page.getByLabel('Prompting technique', { exact: true }).selectOption('role-based')
  await expect(page.getByRole('heading', { name: 'Role-Based', exact: true })).toBeVisible()
  await expectNoHorizontalOverflow(page)
})
