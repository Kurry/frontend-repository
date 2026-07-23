/**
 * NOT-AUTOMATABLE:
 * - 9.7 animations_maintain_smooth_frame_rate — CI scheduling cannot provide a
 *   stable 60fps oracle; animation presence and reduced-motion are tested elsewhere.
 */
import { expect, gotoApp, openRepository, submitRun, test, waitForAcceptedRun } from './fixtures'

test('9.1 cold_start_is_under_two_seconds', async ({ page }) => {
  const started = performance.now()
  await gotoApp(page)
  await expect(page.getByRole('button', { name: 'Create task', exact: true }).first()).toBeEnabled()
  expect(performance.now() - started).toBeLessThan(2_000)
})

test('9.2 console_is_clean', async ({ page }) => {
  await gotoApp(page)
  await openRepository(page)
  await page.getByRole('button', { name: /^Open pull request 184,/ }).click()
  await page.getByRole('button', { name: 'Log excerpt' }).first().click()
  await page.getByRole('button', { name: /^bad-success ·/ }).click()
  await page.getByRole('button', { name: 'Analytics', exact: true }).click()
  await submitRun(page, { pullRequestNumber: '995' })
  await waitForAcceptedRun(page, '995')
})

test('9.3 transitions_respond_under_100ms', async ({ page }) => {
  await gotoApp(page)
  const started = performance.now()
  await page.getByRole('button', { name: 'Timeline', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Event timeline' })).toBeVisible()
  expect(performance.now() - started).toBeLessThan(100)
})

test('9.4 async_work_has_loading_indicators', async ({ page }) => {
  await gotoApp(page)
  const row = await submitRun(page, { pullRequestNumber: '996' })
  await expect(row.locator('.stage-running .running-spin')).toBeVisible({ timeout: 2_000 })
  await expect(page.getByText(/pipeline run advancing/)).toBeVisible()
})

test('9.5 large_collections_render_without_lag', async ({ page }) => {
  const started = performance.now()
  await gotoApp(page)
  for (const repository of ['quartz-orm', 'copperline', 'fernweh-gateway', 'lattice-db']) {
    await page.getByRole('button', { name: `Open ${repository} pipeline` }).click()
    await expect(page.locator('.pipeline-row')).toHaveCount(repository === 'quartz-orm' ? 9 : 8)
    await page.getByRole('button', { name: 'All repositories' }).click()
  }
  expect(performance.now() - started).toBeLessThan(2_000)
})

test('9.6 state_changes_remain_interactive', async ({ page }) => {
  await gotoApp(page)
  await submitRun(page, { pullRequestNumber: '997' })
  await page.getByRole('button', { name: 'Timeline', exact: true }).click()
  await expect(page.getByRole('button', { name: 'failed', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: 'Analytics', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Export accepted tasks' })).toBeEnabled()
})

test('9.8 rapid_input_does_not_freeze', async ({ page }) => {
  await gotoApp(page)
  const started = performance.now()
  for (let index = 0; index < 20; index += 1) {
    await page.getByRole('button', { name: index % 2 ? 'Timeline' : 'Analytics', exact: true }).click()
  }
  expect(performance.now() - started).toBeLessThan(5_000)
  await expect(page.getByRole('heading', { name: 'Event timeline' })).toBeVisible()
})
