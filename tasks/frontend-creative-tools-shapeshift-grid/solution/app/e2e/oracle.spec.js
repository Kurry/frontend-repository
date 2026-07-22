import { expect, test } from '@playwright/test'

test('save fields are explicitly labeled and empty validation is announced', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Save current board' }).click()
  await expect(page.getByLabel('Name required · max 40')).toHaveAttribute('id', 'save-board-name')
  await expect(page.getByLabel('Tag required · max 24')).toHaveAttribute('id', 'save-board-tag')
  await page.getByLabel('Name required · max 40').focus()
  await page.getByLabel('Name required · max 40').blur()
  const alerts = page.getByRole('alert')
  await expect(alerts.first()).toHaveAttribute('aria-live', 'assertive')
})

test('painting locks the keyboard slider and confirmed clear unlocks it', async ({ page }) => {
  await page.goto('/')
  const slider = page.getByRole('slider', { name: 'Cell size' })
  await expect(slider).toHaveAttribute('tabindex', '0')
  await page.getByRole('gridcell').first().click()
  await expect(slider).toBeDisabled()
  await page.getByRole('button', { name: 'Clear the board' }).click()
  await page.getByRole('button', { name: 'Confirm clear — empties the whole board' }).click()
  await expect(slider).toBeEnabled()
})

test('confirmed deletion updates the gallery count immediately', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /^Gallery / }).click()
  const cards = page.locator('.board-card')
  const before = await cards.count()
  const remove = page.getByRole('button', { name: /^Delete / }).first()
  await remove.click()
  await page.getByRole('button', { name: /^Confirm delete / }).first().click()
  await expect(cards).toHaveCount(before - 1)
})
