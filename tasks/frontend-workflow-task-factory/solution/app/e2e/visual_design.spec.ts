/** NOT-AUTOMATABLE: none; this file limits assertions to measurable composition and computed styling. */
import { expect, gotoApp, openRepository, openTask, submitRun, test } from './fixtures'

test('3.1 dashboard_shell_composition', async ({ page }) => {
  await gotoApp(page)
  const sidebar = page.getByRole('complementary', { name: 'Primary navigation' })
  await expect(sidebar).toBeVisible()
  expect(await sidebar.evaluate((element) => getComputedStyle(element).position)).toBe('fixed')
  for (const name of ['Repositories', 'Timeline', 'Analytics', 'Create task']) await expect(sidebar.getByRole('button', { name, exact: true })).toBeVisible()
  await openRepository(page)
  await expect(page.getByRole('table')).toBeVisible()
  await expect(page.getByRole('table').locator('.stage-strip').first()).toBeVisible()
})

test('3.2 stage_status_color_system', async ({ page }) => {
  await openRepository(page)
  const statusColors = new Map<string, string>()
  for (const status of ['pending', 'running', 'complete', 'skipped']) {
    const stage = page.locator(`.stage-${status}`).first()
    await expect(stage).toContainText(status)
    statusColors.set(status, await stage.evaluate((element) => getComputedStyle(element).backgroundColor))
  }
  await submitRun(page, { pullRequestNumber: '1001' })
  const failed = page.locator('.stage-failed').first()
  await expect(failed).toBeVisible({ timeout: 6_000 })
  statusColors.set('failed', await failed.evaluate((element) => getComputedStyle(element).backgroundColor))
  expect(new Set(statusColors.values()).size).toBe(5)
})

test('3.3 verdict_hue_consistency', async ({ page }) => {
  await openTask(page)
  const colors = new Set<string>()
  for (const verdict of ['good-success', 'bad-success', 'good-failure', 'bad-failure', 'infrastructure-error']) {
    const segment = page.locator(`.dist-segment.verdict-${verdict}`)
    const swatch = page.locator(`.legend-swatch.verdict-${verdict}`)
    const chip = page.locator(`.verdict-chip.verdict-${verdict}`).first()
    const [segmentColor, swatchColor, chipColor] = await Promise.all([
      segment.evaluate((element) => getComputedStyle(element).backgroundColor),
      swatch.evaluate((element) => getComputedStyle(element).backgroundColor),
      chip.evaluate((element) => getComputedStyle(element).backgroundColor),
    ])
    expect(swatchColor).toBe(segmentColor)
    expect(chipColor).toBe(segmentColor)
    colors.add(segmentColor)
  }
  expect(colors.size).toBe(5)
})

test('3.4 typography_hierarchy', async ({ page }) => {
  await gotoApp(page)
  const sizes = await page.evaluate(() => ({
    page: Number.parseFloat(getComputedStyle(document.querySelector('.page-title')!).fontSize),
    section: Number.parseFloat(getComputedStyle(document.querySelector('.repo-card h2')!).fontSize),
    body: Number.parseFloat(getComputedStyle(document.querySelector('.repo-card p')!).fontSize),
    numeric: getComputedStyle(document.querySelector('.overview-stat strong')!).fontVariantNumeric,
  }))
  expect(sizes.page).toBeGreaterThan(sizes.section)
  expect(sizes.section).toBeGreaterThan(sizes.body)
  expect(sizes.numeric).toContain('tabular-nums')
})

test('3.5 monospace_code_surfaces', async ({ page }) => {
  await openTask(page)
  const manifestFont = await page.locator('.manifest-code').evaluate((element) => getComputedStyle(element).fontFamily)
  expect(manifestFont).toMatch(/Mono|monospace/i)
  await page.getByRole('button', { name: 'Log excerpt' }).first().click()
  const logFont = await page.locator('.log-code').first().evaluate((element) => getComputedStyle(element).fontFamily)
  expect(logFont).toMatch(/Mono|monospace/i)
  for (const card of await page.locator('.check-card, .trial-card').all()) {
    const style = await card.evaluate((element) => getComputedStyle(element))
    expect(style.borderStyle).not.toBe('none')
    expect(style.boxShadow).not.toBe('none')
  }
})

test('3.6 responsive_reflow_clean', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await openRepository(page)
  await expect(page.getByRole('complementary', { name: 'Primary navigation' })).toBeHidden()
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375)
  const table = page.locator('.table-scroll')
  expect(await table.evaluate((element) => getComputedStyle(element).overflowX)).toBe('auto')
})
