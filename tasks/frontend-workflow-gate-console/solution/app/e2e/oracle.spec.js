import { expect, test } from '@playwright/test'

test('what-if flips recompute the stage and show a simulated marker', async ({ page }) => {
  await page.goto('/')
  const score = page.locator('.suite-outcome .score')
  const before = await score.textContent()
  await page.getByRole('switch', { name: 'What-if mode' }).check()
  const failingGate = page.getByRole('button', { name: /Fail; flip simulated state/ }).first()
  await failingGate.click()

  await expect(page.getByText('Simulated', { exact: true }).first()).toBeVisible()
  await expect(score).not.toHaveText(before)
  await expect(page.getByRole('status').filter({ hasText: 'What-if simulation is active' })).toBeVisible()
})

test('double activation starts exactly one re-run timeline event', async ({ page }) => {
  await page.goto('/')
  const start = page.getByRole('button', { name: 'Start re-run' })
  await start.evaluate((button) => { button.click(); button.click() })

  await expect(page.getByText('Re-run in progress')).toBeVisible()
  await expect(page.getByText(/re-run passed|re-run rejected/).last()).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText(/Test Generation re-run started/)).toHaveCount(1)
})

test('mobile stage controls meet the minimum target and stay inside the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 760 })
  await page.goto('/')
  const controls = page.locator('.stage-controls button, .stage-controls label')
  for (const control of await controls.all()) {
    const box = await control.boundingBox()
    expect(box.height).toBeGreaterThanOrEqual(44)
    expect(box.x + box.width).toBeLessThanOrEqual(375)
  }
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(375)
})
