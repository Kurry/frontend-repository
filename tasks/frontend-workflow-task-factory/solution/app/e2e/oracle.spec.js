import { expect, test } from '@playwright/test'

test('create dialog traps focus, closes from its backdrop, and returns focus', async ({ page }) => {
  await page.goto('/')
  const opener = page.getByRole('button', { name: 'Create task', exact: true }).first()
  await opener.click()

  const dialog = page.getByRole('dialog', { name: 'Create benchmark task' })
  await expect(dialog).toBeVisible()
  await expect(page.getByLabel('Repository', { exact: true })).toBeVisible()

  await page.keyboard.press('Shift+Tab')
  await expect(dialog.locator(':focus')).toHaveCount(1)
  await page.mouse.click(4, 4)
  await expect(dialog).toBeHidden()
  await expect(opener).toBeFocused()
})

test('mobile layout has no page overflow and exposes an accessible navigation drawer', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 760 })
  await page.goto('/')

  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(375)
  const navigation = page.getByRole('complementary', { name: 'Primary navigation' })
  await expect(navigation).toBeHidden()
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await expect(navigation).toBeVisible()
})
