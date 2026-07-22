/** NOT-AUTOMATABLE: none; all behavioral criteria define state/delta observables. */
import {
  expect, fillCreateForm, gotoApp, openCreateDialog, openRepository, openTask,
  pipelineRows, readManifest, repositoryMetrics, submitRun, test, waitForAcceptedRun,
} from './fixtures'

test('14.1 multi_facet_round_trip', async ({ page }) => {
  await openRepository(page)
  await page.getByLabel('Search pull requests').fill('cursor')
  await page.getByRole('button', { name: 'Accepted', exact: true }).click()
  await page.getByRole('combobox', { name: 'Sort pull requests' }).click()
  await page.getByRole('option', { name: 'Oldest first' }).click()
  await page.getByRole('button', { name: /^Open pull request 183,/ }).click()
  await page.getByRole('button', { name: 'Log excerpt' }).first().click()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Repository intake' })).toBeVisible()
  await expect(page.getByLabel('Search pull requests')).toHaveCount(0)
  await expect(page.locator('.repo-card')).toHaveCount(4)
})

test('14.2 sort_reversal_proves_live_data', async ({ page }) => {
  await openRepository(page)
  const numbers = () => pipelineRows(page).locator('.pr-number').allTextContents().then((items) => items.map((item) => Number(item.slice(1))))
  const newest = await numbers()
  await page.getByRole('combobox', { name: 'Sort pull requests' }).click()
  await page.getByRole('option', { name: 'Oldest first' }).click()
  const oldest = await numbers()
  expect(oldest).toEqual([...newest].reverse())
})

test('14.3 derived_view_responds_to_input', async ({ page }) => {
  await openRepository(page)
  const all = await pipelineRows(page).count()
  await page.getByRole('button', { name: 'Rejected', exact: true }).click()
  await expect.poll(() => pipelineRows(page).count()).toBeLessThan(all)
  const rejected = await pipelineRows(page).count()
  expect(rejected).toBeGreaterThan(0)
  expect(rejected).toBeLessThan(all)
  for (const row of await pipelineRows(page).all()) await expect(row.locator('.badge-danger')).toBeVisible()
})

test('14.4 cross_view_echo_without_reload', async ({ page }) => {
  await gotoApp(page)
  const before = await repositoryMetrics(page)
  await submitRun(page, { pullRequestNumber: '951' })
  await waitForAcceptedRun(page, '951')
  await page.getByRole('button', { name: 'Repositories', exact: true }).click()
  const after = await repositoryMetrics(page)
  expect(after.tasks).toBe(before.tasks + 1)
  await page.getByRole('button', { name: 'Timeline', exact: true }).click()
  await expect(page.getByText('Task accepted').first()).toBeVisible()
  await page.getByRole('button', { name: 'Analytics', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Tasks per week' })).toBeVisible()
})

test('14.5 count_delta_is_exact', async ({ page }) => {
  await openRepository(page)
  const before = await pipelineRows(page).count()
  await openCreateDialog(page)
  const dialog = await fillCreateForm(page, { pullRequestNumber: '952', minFiles: '2', maxFiles: '20' })
  await dialog.getByRole('button', { name: 'Start pipeline run' }).click()
  await expect(pipelineRows(page)).toHaveCount(before + 1)
})

test('14.6 different_inputs_change_outcomes', async ({ page }) => {
  await gotoApp(page)
  await submitRun(page, { repository: 'quartz-orm', pullRequestNumber: '953', minFiles: '2', maxFiles: '4' })
  await waitForAcceptedRun(page, '953')
  const first = await readManifest(page)
  await submitRun(page, { repository: 'copperline', pullRequestNumber: '954', minFiles: '10', maxFiles: '18' })
  await waitForAcceptedRun(page, '954')
  const second = await readManifest(page)
  expect(second.repository).not.toBe(first.repository)
  expect(second.pullRequestNumber).not.toBe(first.pullRequestNumber)
  expect(second.minFiles).not.toBe(first.minFiles)
  expect(second.maxFiles).not.toBe(first.maxFiles)
})

test('14.7 interleaved_flows_preserve_state', async ({ page }) => {
  await gotoApp(page)
  await openCreateDialog(page)
  await fillCreateForm(page, { pullRequestNumber: '955', minFiles: '7', maxFiles: '19' })
  await page.getByRole('button', { name: 'Analytics', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Task analytics' })).toBeVisible()
  const dialog = page.getByRole('dialog', { name: 'Create benchmark task' })
  await expect(dialog.getByLabel('Pull-request number')).toHaveValue('955')
  await page.getByRole('button', { name: 'Repositories', exact: true }).click()
  await expect(dialog.getByLabel('Minimum file bound')).toHaveValue('7')
  await expect(dialog.getByLabel('Maximum file bound')).toHaveValue('19')
})

test('14.8 empty_to_repopulated_round_trip', async ({ page }) => {
  await openRepository(page)
  await page.getByRole('button', { name: 'Empty register' }).click()
  await expect(page.getByRole('heading', { name: 'No pull requests' })).toBeVisible()
  await expect(page.getByText('0 processed · 0 tasks produced · 0% yield')).toBeVisible()
  await page.getByRole('button', { name: 'Restore seed register' }).click()
  await expect(pipelineRows(page)).toHaveCount(9)
  await expect(page.getByText('9 processed · 3 tasks produced · 33% yield')).toBeVisible()
})

test('14.9 reload_resets_factory_baseline', async ({ page }) => {
  await openTask(page)
  await page.getByRole('button', { name: /^bad-success ·/ }).click()
  await page.getByRole('button', { name: 'Log excerpt' }).first().click()
  await submitRun(page, { pullRequestNumber: '956' })
  await expect(page.getByRole('button', { name: /^Open pull request 956,/ })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Repository intake' })).toBeVisible()
  await openRepository(page)
  await expect(page.getByRole('button', { name: /^Open pull request 956,/ })).toHaveCount(0)
  await openTask(page)
  await expect(page.locator('.trial-row')).toHaveCount(7)
  await expect(page.getByRole('button', { name: 'Log excerpt' }).first()).toHaveAttribute('aria-expanded', 'false')
})
