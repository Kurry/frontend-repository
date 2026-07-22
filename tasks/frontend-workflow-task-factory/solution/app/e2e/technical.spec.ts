/** NOT-AUTOMATABLE: none; every technical criterion is browser-observable. */
import {
  expect, fillCreateForm, gotoApp, openCreateDialog, openRepository, openTask,
  repositoryMetrics, submitRun, test, waitForAcceptedRun,
} from './fixtures'

test('2.1 shared_state_coherence', async ({ page }) => {
  await gotoApp(page)
  const before = await repositoryMetrics(page)
  await submitRun(page, { pullRequestNumber: '981' })
  await waitForAcceptedRun(page, '981')
  await page.getByRole('button', { name: 'Repositories', exact: true }).click()
  expect((await repositoryMetrics(page)).tasks).toBe(before.tasks + 1)
  await page.getByRole('button', { name: 'Timeline', exact: true }).click()
  await expect(page.getByText('Task accepted').first()).toBeVisible()
  await page.getByRole('button', { name: 'Analytics', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Tasks per week' })).toBeVisible()
})

test('2.2 no_storage_reload_seeded', async ({ page }) => {
  await openTask(page)
  await page.getByRole('button', { name: /^bad-success ·/ }).click()
  await page.getByRole('button', { name: 'Log excerpt' }).first().click()
  await submitRun(page, { pullRequestNumber: '982' })
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 })
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Repository intake' })).toBeVisible()
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 })
})

test('2.5 console_clean_during_session', async ({ page }) => {
  await gotoApp(page)
  await openRepository(page)
  await page.getByLabel('Search pull requests').fill('cursor')
  await page.getByRole('button', { name: 'Timeline', exact: true }).click()
  await page.getByRole('button', { name: 'failed', exact: true }).click()
  await page.getByRole('button', { name: 'Analytics', exact: true }).click()
  await gotoApp(page)
  await submitRun(page, { pullRequestNumber: '983' })
  await waitForAcceptedRun(page, '983')
})

test('2.6 keyboard_operability_focus', async ({ page }) => {
  await gotoApp(page)
  const targets = [
    page.getByRole('button', { name: 'Repositories', exact: true }),
    page.getByRole('button', { name: 'Timeline', exact: true }),
    page.getByRole('button', { name: 'Analytics', exact: true }),
    page.getByRole('button', { name: 'Create task', exact: true }).first(),
    page.getByRole('button', { name: 'Open quartz-orm pipeline' }),
  ]
  for (const target of targets) {
    await target.focus()
    await expect(target).toBeFocused()
    const outline = await target.evaluate((element) => getComputedStyle(element, ':focus-visible').outlineStyle)
    expect(outline).not.toBe('none')
  }
})

test('2.7 dialog_focus_labels', async ({ page }) => {
  await gotoApp(page)
  const { dialog, opener } = await openCreateDialog(page)
  await expect(dialog).toHaveAttribute('aria-describedby', 'create-task-description')
  for (const name of ['Repository', 'Pull-request number', 'Minimum file bound', 'Maximum file bound']) await expect(dialog.getByLabel(name, { exact: true })).toBeVisible()
  await fillCreateForm(page, { pullRequestNumber: 'bad' })
  await expect(dialog.locator('#pullRequestNumber-error')).toHaveAttribute('role', 'alert')
  await page.keyboard.press('Escape')
  await expect(opener).toBeFocused()
  await openRepository(page)
  await expect(page.locator('.stage-cell').first()).toHaveAttribute('aria-label', /stage, .* attempt/)
  await expect(page.locator('.badge-danger').first()).not.toBeEmpty()
})

test('2.8 cold_load_and_rapid_input', async ({ page }) => {
  const started = Date.now()
  await gotoApp(page)
  await expect(page.getByRole('button', { name: 'Create task', exact: true }).first()).toBeEnabled()
  expect(Date.now() - started).toBeLessThan(2_000)
  await submitRun(page, { pullRequestNumber: '984' })
  for (let index = 0; index < 6; index += 1) {
    await page.getByRole('button', { name: index % 2 ? 'Timeline' : 'Analytics', exact: true }).click()
  }
  await expect(page.getByRole('heading', { name: 'Event timeline' })).toBeVisible()
  await expect(page.getByText(/pipeline run advancing/)).toBeVisible()
})

test('contract webmcp surface round_trips_and_mutates_dom', async ({ page }) => {
  await openRepository(page)
  const surface = await page.evaluate(() => ({
    session: typeof window.webmcp_session_info,
    list: typeof window.webmcp_list_tools,
    invoke: typeof window.webmcp_invoke_tool,
  }))
  expect(surface).toEqual({ session: 'function', list: 'function', invoke: 'function' })
  const listed = await page.evaluate(() => window.webmcp_list_tools())
  expect(listed.map((tool: any) => tool.name)).toEqual(expect.arrayContaining(['browse.open', 'browse.search', 'form.validate', 'form.submit', 'artifact.copy']))
  const readResult = await page.evaluate(() => window.webmcp_invoke_tool('form.validate', { fields: { repository: 'quartz-orm', 'pull-request-number': '184', 'min-file-bound': '2', 'max-file-bound': '20' } }))
  expect(readResult).toEqual({ ok: true, valid: true })
  const before = await page.locator('.pipeline-row').count()
  const mutation = await page.evaluate(() => window.webmcp_invoke_tool('browse.search', { query: 'cursor' }))
  expect(mutation).toEqual({ ok: true, visibleQuery: 'cursor' })
  await expect(page.getByLabel('Search pull requests')).toHaveValue('cursor')
  await expect.poll(() => page.locator('.pipeline-row:visible').count()).toBeLessThan(before)
  expect(await page.locator('.pipeline-row:visible').count()).toBeLessThan(before)
  const navigation = await page.evaluate(() => window.webmcp_invoke_tool('browse.open', { destination: 'analytics' }))
  expect(navigation).toEqual({ ok: true, destination: 'analytics' })
  await expect(page.getByRole('heading', { name: 'Task analytics' })).toBeVisible()
})
