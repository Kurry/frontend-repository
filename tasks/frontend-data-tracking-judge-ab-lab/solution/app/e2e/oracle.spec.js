import { expect, test } from '@playwright/test'

async function skipTour(page) {
  const skip = page.getByRole('button', { name: 'Skip tour' })
  if (await skip.isVisible()) await skip.click()
}

test('rescore form names an overlong config note and starts no run', async ({ page }) => {
  await page.goto('/')
  await skipTour(page)
  await page.getByRole('button', { name: 'Rescore with new label' }).click()
  await page.getByLabel('Label name').fill('Accessibility probe')
  await page.getByRole('textbox', { name: 'Scorer model' }).click()
  await page.getByRole('option').first().click()
  await page.getByLabel('Config note').fill('x'.repeat(121))
  await page.getByRole('button', { name: 'Start rescore' }).click()

  await expect(page.getByText(/configNote: use 120 characters or fewer/)).toBeVisible()
  await expect(page.getByText('Live rescore')).toHaveCount(0)
})

test('experiment table fits a phone viewport without page-level overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 760 })
  await page.goto('/')
  await skipTour(page)

  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(375)
  const table = page.getByRole('table').first()
  await expect(table).toBeVisible()
  await expect.poll(() => table.evaluate((node) => Math.ceil(node.getBoundingClientRect().right))).toBeLessThanOrEqual(375)
})

test('the app exposes install metadata and an atomic live status region', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest')
  await expect(page.getByRole('status')).toHaveAttribute('aria-atomic', 'true')
})
