import { expect, test } from '@playwright/test'
import { boot, openSubmission, titles } from './helpers.js'

// NOT-AUTOMATABLE: 15.5 body_copy_is_well_written — holistic grammar/style quality is a language judgment.

test('15.1 headings_use_consistent_capitalization', async ({ page }) => {
  await boot(page)
  for (const text of await page.locator('h1,h2,h3').allTextContents()) expect(text.trim()).not.toMatch(/^[a-z]/)
})

test('15.2 actions_use_specific_labels', async ({ page }) => {
  await boot(page)
  const labels = await page.getByRole('button').allTextContents()
  expect(labels.map((value) => value.trim())).not.toContain('Submit')
  expect(labels.map((value) => value.trim())).not.toContain('OK')
  for (const label of ['Export', 'Undo', 'Redo']) expect(labels.some((value) => value.includes(label))).toBe(true)
})

test('15.3 errors_name_problem_and_fix', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.empty)
  await page.getByRole('button', { name: 'Add finding' }).first().click()
  await expect(page.getByText('Description must be at least 10 characters.')).toBeVisible()
})

test('15.4 empty_states_explain_next_step', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.empty)
  await expect(page.getByText('Quality issues and supporting evidence belong here.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Add first finding' })).toBeVisible()
})

test('15.6 terminology_is_consistent', async ({ page }) => {
  await boot(page)
  const text = (await page.locator('body').innerText()).toLowerCase()
  for (const term of ['submission', 'finding', 'stage', 'payout']) expect(text).toContain(term)
})

test('15.7 numbers_dates_and_units_are_consistent', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.blocker)
  for (const rate of await page.locator('.profile-label strong').allTextContents()) expect(rate).toMatch(/^\d+%$/)
  for (const mean of await page.locator('.profile-meta strong').allTextContents()) expect(mean).toMatch(/^\d\.\d$/)
})

test('15.8 success_messages_are_specific', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.empty)
  await page.getByRole('button', { name: 'Move to in-review' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Submission moved to in-review' }).first()).toBeVisible()
})
