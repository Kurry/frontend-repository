/** NOT-AUTOMATABLE: none; each edge-case criterion has a concrete UI state. */
import {
  expect, fillCreateForm, gotoApp, openCreateDialog, openRepository, openTask,
  pipelineRows, repositoryMetrics, submitRun, test,
} from './fixtures'

test('4.1 empty_state_is_present', async ({ page }) => {
  await openRepository(page)
  await page.getByRole('button', { name: 'Empty register' }).click()
  await expect(page.getByRole('heading', { name: 'No pull requests' })).toBeVisible()
  await expect(page.getByText(/pipeline register is empty/i)).toBeVisible()
})

test('4.2 forms_validate_inline', async ({ page }) => {
  await gotoApp(page)
  await openCreateDialog(page)
  const dialog = await fillCreateForm(page, { pullRequestNumber: 'bad', minFiles: '0', maxFiles: '501' })
  await expect(dialog.getByText(/Pull-request number must/)).toBeVisible()
  await expect(dialog.getByText(/Minimum file bound must/)).toBeVisible()
  await expect(dialog.getByText(/Maximum file bound must/)).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Start pipeline run' })).toBeDisabled()
})

test('4.3 errors_are_actionable', async ({ page }) => {
  await gotoApp(page)
  await openCreateDialog(page)
  const dialog = await fillCreateForm(page, { pullRequestNumber: 'x', minFiles: '30', maxFiles: '20' })
  const errors = await dialog.locator('.field-error').allTextContents()
  expect(errors.filter(Boolean)).toEqual(expect.arrayContaining([
    expect.stringContaining('Pull-request number must be a positive integer'),
    expect.stringContaining('Minimum file bound must not exceed maximum file bound'),
  ]))
  for (const error of errors.filter(Boolean)) expect(error.trim()).not.toBe('Invalid')
})

test('4.4 actions_show_confirmation', async ({ page }) => {
  await gotoApp(page)
  await openCreateDialog(page)
  await page.getByRole('button', { name: 'Voice fill (demo)' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Voice draft filled: 999' })).toBeVisible()
})

test('4.5 async_work_shows_loading_state', async ({ page }) => {
  await gotoApp(page)
  const row = await submitRun(page, { pullRequestNumber: '961' })
  await expect(row.locator('.stage-running')).toBeVisible({ timeout: 2_000 })
  await expect(row.locator('.running-spin')).toBeVisible()
  await expect(page.getByText(/pipeline run advancing/)).toBeVisible()
})

test('4.6 destructive_actions_support_undo_or_cancel', async ({ page }) => {
  await openRepository(page)
  const before = await pipelineRows(page).count()
  await page.getByRole('button', { name: 'Empty register' }).click()
  await expect(pipelineRows(page)).toHaveCount(0)
  await page.getByRole('button', { name: 'Restore seed register' }).click()
  await expect(pipelineRows(page)).toHaveCount(before)
})

test('4.7 non_obvious_controls_have_help', async ({ page }) => {
  await openRepository(page)
  const stages = pipelineRows(page).first().locator('.stage-cell')
  for (const stage of await stages.all()) await expect(stage).toHaveAttribute('title', /^(Fetch|Evaluate|Skeleton|Generate|Validate):/)
  await page.getByRole('button', { name: 'All repositories' }).click()
  await expect(page.getByText(/Offline-ready · installable session shell/)).toHaveAttribute('title', /network round-trip/)
})

test('4.8 controls_use_semantic_tags', async ({ page }) => {
  await gotoApp(page)
  expect(await page.locator('[onclick]').count()).toBe(0)
  for (const element of await page.getByRole('button').all()) {
    expect(await element.evaluate((node) => ['BUTTON', 'A'].includes(node.tagName) || node.getAttribute('role') === 'button')).toBe(true)
  }
  await openCreateDialog(page)
  await expect(page.locator('label[for="pullRequestNumber"]')).toBeVisible()
})

test('4.9 modal_supports_close_paths', async ({ page }) => {
  await gotoApp(page)
  let result = await openCreateDialog(page)
  await result.dialog.getByRole('button', { name: 'Close create task dialog' }).click()
  await expect(result.dialog).toBeHidden()
  result = await openCreateDialog(page)
  await page.mouse.click(260, 4)
  await expect(result.dialog).toBeHidden()
})

test('4.10 long_flows_show_progress', async ({ page }) => {
  await gotoApp(page)
  const row = await submitRun(page, { pullRequestNumber: '962' })
  await expect(row.locator('.stage-running')).toBeVisible({ timeout: 2_000 })
  await expect(row.locator('.stage-complete')).toBeVisible({ timeout: 3_000 })
  await expect(page.getByRole('region', { name: 'Notifications' })).toContainText('Run started')
})

test('4.11 long_pr_title_truncates', async ({ page }) => {
  await openRepository(page, 'fernweh-gateway')
  const row = page.getByRole('button', { name: /^Open pull request 418,/ })
  const title = row.locator('.pr-title')
  const full = await title.getAttribute('title')
  expect(full?.length).toBeGreaterThan(60)
  const clipped = await title.evaluate((element) => ({ scroll: element.scrollWidth, client: element.clientWidth, overflow: getComputedStyle(element).textOverflow }))
  expect(clipped.scroll).toBeGreaterThan(clipped.client)
  expect(clipped.overflow).toBe('ellipsis')
  await row.click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(full!)
})

test('4.12 create_cancel_changes_nothing', async ({ page }) => {
  await gotoApp(page)
  const metricsBefore = await repositoryMetrics(page)
  await page.getByRole('button', { name: 'Timeline', exact: true }).click()
  const timelineBefore = await page.locator('.event-row').count()
  await page.getByRole('button', { name: 'Repositories', exact: true }).click()
  const { dialog } = await openCreateDialog(page)
  await fillCreateForm(page, { pullRequestNumber: '963' })
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()
  expect(await repositoryMetrics(page)).toEqual(metricsBefore)
  await page.getByRole('button', { name: 'Timeline', exact: true }).click()
  await expect(page.locator('.event-row')).toHaveCount(timelineBefore)
})
