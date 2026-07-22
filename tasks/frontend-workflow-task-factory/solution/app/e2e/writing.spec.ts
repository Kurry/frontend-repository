/**
 * NOT-AUTOMATABLE:
 * - 15.5 body_copy_is_well_written — grammar/style quality is an editorial judgment.
 */
import { expect, fillCreateForm, gotoApp, openCreateDialog, openRepository, test } from './fixtures'

test('15.1 headings_use_consistent_capitalization', async ({ page }) => {
  await gotoApp(page)
  for (const destination of ['Repositories', 'Timeline', 'Analytics']) {
    if (destination !== 'Repositories') await page.getByRole('button', { name: destination, exact: true }).click()
    const headings = await page.locator('.page > .page-header h1, .section-head h2, .chart-head h2').allTextContents()
    for (const heading of headings) expect(heading.trim()).toMatch(/^[A-Z0-9]/)
  }
})

test('15.2 actions_use_specific_labels', async ({ page }) => {
  await gotoApp(page)
  const labels = await page.getByRole('button').allTextContents()
  for (const forbidden of ['Submit', 'OK', 'Go', 'Yes']) expect(labels.map((label) => label.trim())).not.toContain(forbidden)
  await expect(page.getByRole('button', { name: 'Create task', exact: true }).first()).toBeVisible()
  await openCreateDialog(page)
  await expect(page.getByRole('button', { name: 'Start pipeline run' })).toBeVisible()
})

test('15.3 errors_name_problem_and_fix', async ({ page }) => {
  await gotoApp(page)
  await openCreateDialog(page)
  const dialog = await fillCreateForm(page, { pullRequestNumber: 'bad', minFiles: '0', maxFiles: '501' })
  const errors = (await dialog.locator('.field-error').allTextContents()).filter(Boolean)
  expect(errors).toEqual(expect.arrayContaining([
    expect.stringContaining('Pull-request number'),
    expect.stringContaining('between 1 and 500'),
  ]))
  for (const error of errors) expect(error).not.toMatch(/^invalid\.?$/i)
})

test('15.4 empty_states_explain_next_step', async ({ page }) => {
  await openRepository(page)
  await page.getByLabel('Search pull requests').fill('no-match-value')
  await expect(page.getByRole('heading', { name: 'No pull requests match' })).toBeVisible()
  await expect(page.getByText(/Clear the current search or status filter/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Clear filter' })).toBeVisible()
})

test('15.6 terminology_is_consistent', async ({ page }) => {
  await gotoApp(page)
  await expect(page.getByRole('button', { name: 'Create task', exact: true }).first()).toBeVisible()
  await openCreateDialog(page)
  await expect(page.getByRole('heading', { name: 'Create benchmark task' })).toBeVisible()
  expect((await page.locator('body').innerText()).toLowerCase()).not.toContain('create todo')
})

test('15.7 numbers_dates_and_units_are_consistent', async ({ page }) => {
  await gotoApp(page)
  await page.getByRole('button', { name: 'Timeline', exact: true }).click()
  for (const time of await page.locator('time').all()) {
    await expect(time).toHaveText(/^\d{2}:\d{2}:\d{2} UTC$/)
    await expect(time).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}T.*Z$/)
  }
  await page.getByRole('button', { name: 'Repositories', exact: true }).click()
  for (const metric of await page.locator('.repo-metric').filter({ hasText: 'Tasks · yield' }).all()) await expect(metric).toHaveText(/\d+ · \d+%/)
})

test('15.8 success_messages_are_specific', async ({ page }) => {
  await gotoApp(page)
  await openCreateDialog(page)
  await page.getByRole('button', { name: 'Voice fill (demo)' }).click()
  const message = page.getByRole('status').filter({ hasText: 'Voice draft filled: 999' })
  await expect(message).toBeVisible()
  await expect(message).not.toHaveText(/^(Success|Done|OK)$/)
})
