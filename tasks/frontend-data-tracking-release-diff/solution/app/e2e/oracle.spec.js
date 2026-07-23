import { expect, test } from '@playwright/test'

test('export and import dialogs restore focus to their launchers', async ({ page }) => {
  await page.goto('/')
  const exportButton = page.getByRole('button', { name: /Export release pack/ })
  await exportButton.click()
  await expect(page.getByRole('dialog', { name: 'Export release pack' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(exportButton).toBeFocused()

  const importButton = page.getByRole('button', { name: /Import release pack/ })
  await importButton.click()
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(importButton).toBeFocused()
})

test('exported JSON restores rotation state after it diverges', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Export release pack/ }).click()
  const json = await page.getByLabel('Release pack JSON preview').textContent()
  const expectedCycle = JSON.parse(json).rotation.cycle
  await page.keyboard.press('Escape')
  await page.getByRole('tab', { name: 'Rotation' }).click()
  await page.getByRole('button', { name: /Advance rotation/ }).click()
  await page.getByRole('button', { name: /Import release pack/ }).click()
  await page.getByLabel('Release pack JSON').fill(json)
  await page.getByRole('button', { name: 'Confirm import' }).click()
  await page.getByRole('tab', { name: 'Rotation' }).click()
  await expect(page.getByText(new RegExp(`Cycle ${expectedCycle}\\b`)).first()).toBeVisible()
})

test('mobile sidebar close stays clickable and manifest stays in bounds', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 760 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Open releases' }).click()
  await page.getByRole('button', { name: 'Close releases' }).click()
  await expect(page.getByRole('button', { name: 'Open releases' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(375)
  await expect.poll(() => page.locator('.manifest-table').evaluate((node) => Math.ceil(node.getBoundingClientRect().right))).toBeLessThanOrEqual(375)
})
