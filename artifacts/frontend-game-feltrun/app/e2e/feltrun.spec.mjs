import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('main')).toBeVisible()
})

test('1.1 opens_at_root_with_deal_prompt', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Deal first hand' })).toBeVisible()
  await page.getByRole('button', { name: 'Show history' }).click()
  await expect(page.getByRole('heading', { name: 'Hand history' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Hand history' }).getByText('No hands played yet')).toBeVisible()
})

test('1.2 deal_first_hand_seats_four', async ({ page }) => {
  await page.getByRole('button', { name: 'Deal first hand' }).click()
  await expect(page.locator('[data-seat-id]')).toHaveCount(4)
  await expect(page.getByText('Aggressive', { exact: true })).toBeVisible()
  await expect(page.getByText('Tight', { exact: true })).toBeVisible()
  await expect(page.getByText('Bluffer', { exact: true })).toBeVisible()
})

test('1.40 export_session_json_schema', async ({ page }) => {
  const exportRegion = page.getByRole('region', { name: 'Export session' })
  const report = JSON.parse(await exportRegion.getByLabel('Session JSON preview').inputValue())
  expect(report.schemaVersion).toBe('feltrun-session-v1')
  expect(report).toEqual(expect.objectContaining({
    session: expect.any(Object),
    stacks: expect.any(Array),
    handHistory: expect.any(Array),
    inProgressHand: null,
  }))
  expect(report.stacks).toHaveLength(4)
})

test('6.7 difficulty_switch_preserves_progress', async ({ page }) => {
  await page.getByRole('button', { name: 'Deal first hand' }).click()
  const exportRegion = page.getByRole('region', { name: 'Export session' })
  await expect(page.getByText('Hand 1', { exact: true })).toBeVisible()
  await exportRegion.getByLabel('Difficulty').selectOption('Hard')
  await expect(exportRegion.getByLabel('Difficulty')).toHaveValue('Hard')
  await expect(page.getByText('Hand 1', { exact: true })).toBeVisible()
})

test('4.6 new_session_cancel_preserves', async ({ page }) => {
  await page.getByRole('button', { name: 'Deal first hand' }).click()
  await expect(page.getByText('Hand 1', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Start new session' }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Start a new session?' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByText('Hand 1', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Deal first hand' })).toBeHidden()
})

test('2.8 mobile_drawer_layout_holds', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.reload()
  await expect(page.getByRole('button', { name: 'Show panels' })).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
})
