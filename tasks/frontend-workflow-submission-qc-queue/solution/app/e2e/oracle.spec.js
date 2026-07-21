import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 360, height: 900 } })

test('the mobile queue contains wide data and a full-width drawer without page overflow', async ({ page }) => {
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.goto('/')
  await page.getByRole('button', { name: 'Dismiss tip' }).click()

  await expect(page.getByRole('button', { name: 'Undo last action' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Redo last action' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open command palette' })).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      })),
    )
    .toEqual({ clientWidth: 360, scrollWidth: 360 })

  const queueScrollsInternally = await page.locator('.queue-table').evaluate(
    (table) => table.scrollWidth > table.clientWidth,
  )
  expect(queueScrollsInternally).toBe(true)

  const opener = page.getByRole('button', { name: 'Mara Voss' }).first()
  await opener.click()
  const drawer = page.getByRole('dialog')
  await expect(drawer).toBeVisible()
  await expect
    .poll(() => drawer.evaluate((element) => Math.round(element.getBoundingClientRect().width)))
    .toBe(360)
  await expect(drawer.getByRole('button', { name: 'Close contributor drawer' })).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(drawer).toBeHidden()
  await expect(opener).toBeFocused()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360)
  expect(pageErrors).toEqual([])
})
