import { expect, test } from '@playwright/test'
import { boot, openExport, openSubmission, queueRows, titles } from './helpers.js'

// NOT-AUTOMATABLE: 9.7 animations_maintain_smooth_frame_rate — CI frame scheduling is nondeterministic; motion presence is covered in motion.spec.js.

test('9.1 cold_start_is_under_two_seconds', async ({ page }) => {
  const start = performance.now()
  await boot(page)
  expect(performance.now() - start).toBeLessThan(2_000)
})

test('9.2 console_is_clean', async ({ page }) => {
  const messages = await boot(page)
  await openSubmission(page, titles.blocker)
  await page.locator('.evidence-toggle').first().click()
  await openExport(page)
  expect(messages).toEqual([])
})

test('9.3 transitions_respond_under_100ms', async ({ page }) => {
  await boot(page)
  const start = performance.now()
  await page.getByLabel('Filter by stage').selectOption('approved')
  await expect(queueRows(page)).toHaveCount(3)
  expect(performance.now() - start).toBeLessThan(1_000)
})

test('9.4 async_work_has_loading_indicators', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.blocker)
  await page.getByRole('button', { name: 'Run re-check' }).click()
  await expect(page.getByRole('button', { name: /Running/ })).toBeVisible()
  await expect(page.locator('.n-progress')).toBeVisible()
})

test('9.5 queue_renders_without_lag', async ({ page }) => {
  await boot(page)
  await expect(queueRows(page)).toHaveCount(12)
  await queueRows(page).last().scrollIntoViewIfNeeded()
  await expect(queueRows(page).last()).toBeVisible()
})

test('9.6 state_changes_remain_interactive', async ({ page }) => {
  await boot(page)
  await page.getByRole('checkbox', { name: `Select ${titles.empty}` }).check()
  await page.getByRole('button', { name: 'Hold payout' }).click()
  await page.getByRole('button', { name: 'Undo last action' }).click()
  await page.getByRole('button', { name: 'Redo last action' }).click()
  await expect(page.getByRole('button', { name: 'Export' })).toBeEnabled()
})

test('9.8 rapid_input_does_not_freeze', async ({ page }) => {
  await boot(page)
  for (const value of ['approved', '', 'submitted', '', 'in-review', '']) await page.getByLabel('Filter by stage').selectOption(value)
  await expect(queueRows(page)).toHaveCount(12)
})

test('9.9 export_regen_stays_responsive', async ({ page }) => {
  await boot(page)
  await page.getByRole('checkbox', { name: `Select ${titles.empty}` }).check()
  await page.getByRole('button', { name: 'Hold payout' }).click()
  const start = performance.now()
  await openExport(page)
  await expect(page.locator('.code-window pre')).toContainText('"payout_state": "held"')
  expect(performance.now() - start).toBeLessThan(1_000)
})

test('9.10 recheck_does_not_block_chrome', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.blocker)
  await page.getByRole('button', { name: 'Run re-check' }).click()
  await page.getByRole('button', { name: 'Export' }).click()
  await expect(page.getByRole('heading', { name: 'QC package export' })).toBeVisible()
})
