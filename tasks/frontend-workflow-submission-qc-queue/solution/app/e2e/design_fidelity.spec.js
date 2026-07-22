import { expect, test } from '@playwright/test'
import { boot, openExport, openSubmission, titles } from './helpers.js'

// NOT-AUTOMATABLE: 3.1 spacing_and_sizing_follow_scale — qualitative rhythm judgment.
// NOT-AUTOMATABLE: 3.2 typography_matches_spec — exact visual match requires reference-image judgment.
// NOT-AUTOMATABLE: 3.4 specified_state_changes_animate — overall fidelity of all transitions is subjective; objective motion mechanics live in motion.spec.js.
// NOT-AUTOMATABLE: 3.6 control_styling_matches_spec — complete state-style quality is subjective.
// NOT-AUTOMATABLE: 3.7 typography_has_clear_hierarchy — covered structurally; perceived hierarchy remains subjective.
// NOT-AUTOMATABLE: 3.8 component_states_match_spec — overall state fidelity requires visual comparison.
// NOT-AUTOMATABLE: 3.9 surface_treatments_match_spec — perceived severity language requires visual judgment.
// NOT-AUTOMATABLE: 3.10 microinteractions_match_spec — whether timings “feel intentional” is subjective.

test('3.3 layout_matches_ops_console', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await boot(page)
  expect((await page.locator('.filter-toolbar').boundingBox()).y).toBeLessThan((await page.locator('.queue-table').boundingBox()).y)
  await openSubmission(page, titles.blocker)
  const findings = await page.locator('.findings-panel').boundingBox()
  const profile = await page.locator('.profile-panel').boundingBox()
  expect(Math.abs(findings.y - profile.y)).toBeLessThan(10)
  await openExport(page)
  await expect(page.locator('.code-window')).toBeVisible()
})

test('3.5 responsive_behavior_matches_spec', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 850 })
  await boot(page)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375)
  expect(await page.locator('.queue-table').evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true)
})
