/*
 * NOT-AUTOMATABLE:
 * 11.1 delightful_microinteractions — delight is subjective.
 * 11.2 advanced_motion_mechanics — the app has specified transitions but no distinct advanced/parallax mechanic.
 * 11.3 guided_onboarding — no onboarding flow is shipped.
 * 11.4 enhanced_interactive_graphics — the required chain/status graphics are covered by core criteria, not extra innovation.
 * 11.5 alternative_input_support — no alternative input beyond required keyboard/touch support is shipped.
 * 11.7 polished_brand_narrative — polish and narrative quality require editorial judgment.
 * 11.10 competition_level_innovation — competition merit has no deterministic threshold.
 * innovation.catchall innovation_catchall — by definition requires a judge to identify an uncatalogued enhancement.
 */
import { loadApp, test, expect } from './helpers'

test.beforeEach(async ({page})=>loadApp(page))

test('11.6 preference_personalization', async ({page})=>{await page.getByRole('button',{name:'Switch to dark theme'}).click();await expect(page.locator('html')).toHaveClass(/dark/);await page.getByRole('button',{name:'Switch to light theme'}).click();await expect(page.locator('html')).not.toHaveClass(/dark/)})

test('11.8 dynamic_theming_beyond_requirements', async ({page})=>{const before=await page.locator('.app-shell').evaluate(n=>getComputedStyle(n).backgroundColor);await page.getByRole('button',{name:'Switch to dark theme'}).click();expect(await page.locator('.app-shell').evaluate(n=>getComputedStyle(n).backgroundColor)).not.toBe(before)})

test('11.9 genre_appropriate_platform_features', async ({page})=>{const manifest=await page.locator('link[rel="manifest"]').getAttribute('href');expect(manifest).toBe('/manifest.json');const data=await page.evaluate(async()=>await (await fetch('/manifest.json')).json());expect(data.name).toMatch(/Stagegate/i)})
