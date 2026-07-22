/*
 * NOT-AUTOMATABLE:
 * 3.1 spacing_and_sizing_follow_scale — arbitrary-value detection is a system-level visual judgment.
 * 3.2 typography_matches_spec — no machine-comparable font baseline is supplied.
 * 3.3 layout_matches_reference — pixel parity requires reference-image visual judgment.
 * 3.6 control_styling_matches_spec — “conform to spec” has no numeric radius/shadow oracle.
 * 3.7 typography_has_clear_hierarchy — perceptual clarity is covered objectively in visual_design 2.4.
 * 3.8 component_states_match_spec — pixel fidelity of all states requires visual review.
 * 3.9 surface_treatments_match_spec — precision of depth/color is subjective without a baseline.
 * 3.10 microinteractions_match_spec — objective mechanics/timing are covered by motion.spec.ts.
 */
import { loadApp, test, expect } from './helpers'

test('3.4 specified_state_changes_animate', async ({ page }) => {
  await loadApp(page); const row=page.locator('.gate-disclosure').first(); await row.click()
  const animations=await page.locator('.evidence-grid').first().evaluate(n=>n.getAnimations({subtree:true}).map(a=>Number(a.effect?.getTiming().duration)||0)); expect(Math.max(...animations)).toBeGreaterThan(0)
})

test('3.5 responsive_behavior_matches_reference', async ({ page }) => {
  await page.setViewportSize({width:1440,height:900}); await loadApp(page); await expect(page.locator('.workspace')).toHaveCSS('display','grid')
  await page.setViewportSize({width:375,height:844}); await expect(page.locator('.workspace')).toHaveCSS('display','block'); expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
})
