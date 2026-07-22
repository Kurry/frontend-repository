import { expect, test } from '@playwright/test'
import { boot, openExport, openSubmission, titles } from './helpers.js'

// NOT-AUTOMATABLE: overall aesthetic quality is subjective; these tests cover the rubric's objective layout and state invariants.

test('2.1 console_composition_regions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await boot(page)
  const toolbar = await page.locator('.filter-toolbar').boundingBox()
  const table = await page.locator('.queue-table').boundingBox()
  expect(toolbar.y).toBeLessThan(table.y)
  await openSubmission(page, titles.blocker)
  const gate = await page.locator('.gate-banner').boundingBox()
  const findings = await page.locator('.findings-panel').boundingBox()
  expect(gate.y).toBeLessThan(findings.y)
})

test('2.2 stage_and_payout_tags_consistent', async ({ page }) => {
  await boot(page)
  const pills = page.locator('.status-pill')
  const groups = await pills.evaluateAll((els) => els.map((el) => ({ text: el.textContent.trim(), color: getComputedStyle(el).color, border: getComputedStyle(el).borderColor })))
  for (const label of ['submitted', 'in review', 'needs revision', 'approved', 'pending', 'held', 'released']) expect(groups.some((item) => item.text === label)).toBe(true)
  const same = groups.filter((item) => item.text === 'in review')
  expect(new Set(same.map((item) => `${item.color}|${item.border}`)).size).toBe(1)
})

test('2.3 tier_chips_escalate_visually', async ({ page }) => {
  await boot(page)
  const colors = await page.locator('.tier-chip').evaluateAll((els) => Object.fromEntries(els.map((el) => [el.textContent.replace(/\d|!/g, '').trim(), getComputedStyle(el).color])))
  expect(colors.blocker).toBeTruthy()
  expect(colors.major).toBeTruthy()
  expect(colors.minor).toBeTruthy()
  expect(new Set([colors.blocker, colors.major, colors.minor]).size).toBe(3)
})

test('2.4 gate_banner_states_beyond_color', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.blocker)
  await expect(page.getByRole('heading', { name: 'Gate failed' })).toBeVisible()
  await expect(page.locator('.gate-icon svg')).toBeVisible()
  await expect(page.locator('.gate-count')).toContainText('open blockers')
})

test('2.5 load_bearing_accent_in_profile', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.blocker)
  const bearing = await page.locator('.profile-row.bearing .bar-fill').first().evaluate((el) => getComputedStyle(el).backgroundImage)
  const standard = await page.locator('.profile-row:not(.bearing) .bar-fill').first().evaluate((el) => getComputedStyle(el).backgroundImage)
  expect(bearing).not.toBe(standard)
})

test('2.6 typography_and_component_states', async ({ page }) => {
  await boot(page)
  const h1 = parseFloat(await page.locator('h1').evaluate((el) => getComputedStyle(el).fontSize))
  const body = parseFloat(await page.locator('.queue-intro p').evaluate((el) => getComputedStyle(el).fontSize))
  expect(h1).toBeGreaterThan(body)
  await openExport(page)
  expect((await page.locator('.code-window pre').evaluate((el) => getComputedStyle(el).fontFamily)).toLowerCase()).toMatch(/mono|menlo|consolas/)
})

test('2.7 responsive_reflow_clean', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 850 })
  await boot(page)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375)
  await openExport(page)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375)
})
