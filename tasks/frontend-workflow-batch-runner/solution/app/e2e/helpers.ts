import { expect, type Page } from '@playwright/test'

export async function boot(page: Page) {
  await page.goto('/')
  await expect(page.getByText('Batchline operator')).toBeVisible()
  await expect(page.getByRole('main')).toBeVisible()
}

export async function selectJob(page: Page, name = 'Nightly support triage') {
  await boot(page)
  await page.getByRole('navigation', { name: 'Jobs' }).getByRole('button', { name: new RegExp(name) }).click()
  await expect(page.getByRole('heading', { name })).toBeVisible()
}

export async function shellProbe(page: Page) {
  await boot(page)
  await expect(page.getByRole('banner')).toBeVisible()
  await expect(page.getByRole('complementary', { name: 'Job sidebar' })).toBeVisible()
  await expect(page.locator('.job-card')).toHaveCount(3)
  await expect(page.locator('.job-card[aria-current="page"]')).toContainText('Quarterly corpus sweep')
  await expect(page.getByRole('heading', { name: 'Quarterly corpus sweep' })).toBeVisible()
}

export async function composerProbe(page: Page) {
  await boot(page)
  await page.getByRole('button', { name: 'New job' }).click()
  const dialog = page.getByRole('dialog', { name: 'New job' })
  await expect(dialog).toBeVisible()
  for (const label of ['Job name', 'Concurrency', 'Prompt template', 'Model and rate', 'Seeded dataset slice', 'Paste JSON array or CSV']) {
    await expect(dialog.getByLabel(label, { exact: true })).toBeVisible()
  }
  await expect(dialog.getByLabel('Concurrency', { exact: true })).toHaveValue('3')
  await dialog.getByLabel('Seeded dataset slice').selectOption({ index: 1 })
  await expect(dialog.getByLabel('Dataset preview')).toBeVisible()
  await expect(dialog.getByText(/rows?/).first()).toBeVisible()
}

export async function validationProbe(page: Page) {
  await boot(page)
  await page.getByRole('button', { name: 'New job' }).click()
  const dialog = page.getByRole('dialog', { name: 'New job' })
  await dialog.getByLabel('Job name', { exact: true }).fill('x'.repeat(81))
  await dialog.getByLabel('Job name', { exact: true }).blur()
  await expect(dialog.getByText(/80 characters or fewer/i)).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Create ready job' })).toBeDisabled()
  await dialog.getByLabel('Paste JSON array or CSV').fill('{bad json')
  await dialog.getByRole('button', { name: 'Detect pasted rows' }).click()
  await expect(dialog.getByText(/Dataset JSON parse error/)).toBeVisible()
}

export async function createProbe(page: Page) {
  await boot(page)
  await page.getByRole('button', { name: 'New job' }).click()
  const dialog = page.getByRole('dialog', { name: 'New job' })
  await dialog.getByLabel('Job name', { exact: true }).fill('E2E created workload')
  await dialog.getByLabel('Prompt template').selectOption({ index: 1 })
  await dialog.getByLabel('Model and rate').selectOption({ index: 1 })
  await dialog.getByLabel('Seeded dataset slice').selectOption({ index: 1 })
  const submit = dialog.getByRole('button', { name: 'Create ready job' })
  await expect(submit).toBeEnabled()
  await submit.click()
  await expect(page.getByRole('heading', { name: 'E2E created workload' })).toBeVisible()
  await expect(page.locator('.job-card')).toHaveCount(4)
  await expect(page.getByText(/items are staged for inference/)).toBeVisible()
}

export async function runProbe(page: Page) {
  await selectJob(page)
  await expect(page.getByRole('region', { name: 'Live run rollups' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Run progress' })).toContainText(/36/)
  await expect(page.getByRole('region', { name: 'Execution grid' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Event timeline' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Run history' })).toBeVisible()
  await expect(page.getByRole('grid')).toHaveAttribute('aria-rowcount', '36')
}

export async function launchProbe(page: Page) {
  await boot(page)
  await page.getByRole('button', { name: /Quarterly corpus sweep/ }).click()
  await page.getByRole('button', { name: 'Launch batch' }).click()
  await expect(page.getByRole('region', { name: 'Run progress' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Bulk run macros' })).toBeVisible()
  await expect(page.getByText(/of 3 running/)).toBeVisible()
  await page.getByRole('button', { name: 'Pause all' }).click()
  await expect(page.getByRole('button', { name: 'Start all' })).toBeEnabled()
  await page.getByRole('button', { name: 'Start all' }).click()
  await expect(page.getByRole('button', { name: 'Pause all' })).toBeEnabled()
}

export async function countDeltaProbe(page: Page) {
  await boot(page)
  const jobsBefore = await page.locator('.job-card').count()
  await createProbe(page)
  await expect(page.locator('.job-card')).toHaveCount(jobsBefore + 1)
  const history = page.getByRole('region', { name: 'Run history' })
  const runsBefore = await history.locator('.history-entry').count()
  await page.getByRole('button', { name: 'Launch batch' }).click()
  await expect(history.locator('.history-entry')).toHaveCount(runsBefore + 1)
}

export async function twoLaunchesProbe(page: Page) {
  await boot(page)
  await page.getByRole('button', { name: /Quarterly corpus sweep/ }).click()
  const history = page.getByRole('region', { name: 'Run history' })
  await page.getByRole('button', { name: 'Launch batch' }).click()
  await expect(history.locator('.history-entry')).toHaveCount(1)
  const first = await history.locator('.history-entry').first().innerText()
  await page.getByRole('button', { name: 'Stop all' }).click()
  const relaunch = page.getByRole('button', { name: 'Launch', exact: true })
  await expect(relaunch).toBeEnabled()
  await relaunch.click()
  await expect(history.locator('.history-entry')).toHaveCount(2)
  const second = await history.locator('.history-entry').first().innerText()
  expect(second).not.toBe(first)
}

export async function interleavedFlowsProbe(page: Page) {
  await boot(page)
  await page.getByRole('button', { name: /Quarterly corpus sweep/ }).click()
  await page.getByRole('button', { name: 'Launch batch' }).click()
  const settledBefore = Number((await page.getByRole('region', { name: 'Run progress' }).innerText()).match(/(\d+) of 240 settled/)?.[1] ?? 0)
  await page.getByRole('button', { name: 'New job' }).click()
  await expect(page.getByRole('dialog', { name: 'New job' })).toBeVisible()
  await page.getByRole('dialog', { name: 'New job' }).getByRole('button', { name: 'Close' }).click()
  await page.getByRole('button', { name: /Nightly support triage/ }).click()
  await page.getByRole('button', { name: /Quarterly corpus sweep/ }).click()
  const settledAfter = Number((await page.getByRole('region', { name: 'Run progress' }).innerText()).match(/(\d+) of 240 settled/)?.[1] ?? 0)
  expect(settledAfter).toBeGreaterThanOrEqual(settledBefore)
  await page.getByRole('button', { name: 'Pause all' }).click()
  await expect(page.getByRole('button', { name: 'Start all' })).toBeEnabled()
}

export async function virtualizedGridProbe(page: Page) {
  await boot(page)
  await page.getByRole('button', { name: /Quarterly corpus sweep/ }).click()
  await page.getByRole('button', { name: 'Launch batch' }).click()
  const grid = page.getByRole('region', { name: 'Execution grid' }).getByRole('grid')
  await expect(grid).toHaveAttribute('aria-rowcount', '240')
  expect(await grid.getByRole('row').count()).toBeLessThan(240)
}

export async function queueProbe(page: Page) {
  await boot(page)
  await page.getByRole('button', { name: /Quarterly corpus sweep/ }).click()
  await page.getByRole('button', { name: 'Launch batch' }).click()
  await page.getByRole('button', { name: 'Pause all' }).click()
  const queue = page.getByRole('region', { name: 'Pending queue' })
  await expect(queue).toBeVisible()
  const move = queue.getByRole('button', { name: /Move item .* up/ }).nth(1)
  await expect(move).toBeEnabled()
  await move.focus()
  await page.keyboard.press('Enter')
  await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? '')).toMatch(/Move item .* (up|down)/)
}

export async function inspectorProbe(page: Page) {
  await selectJob(page)
  await page.getByRole('row', { name: /Inspect item/ }).first().click()
  const inspector = page.getByRole('complementary', { name: 'Result inspector' })
  await expect(inspector).toBeVisible()
  await expect(inspector).toContainText(/Input|Output/)
  await expect(inspector).toContainText(/Attempt/)
  await inspector.getByRole('button', { name: /Close/ }).click()
  await expect(inspector).not.toHaveClass(/open/)
}

export async function compareProbe(page: Page) {
  await selectJob(page)
  await page.getByRole('button', { name: 'Compare runs' }).click()
  const dialog = page.getByRole('dialog', { name: 'Compare runs' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByLabel('Run A')).toBeVisible()
  await expect(dialog.getByLabel('Run B')).toBeVisible()
  await expect(dialog).toContainText(/flip|change|difference/i)
}

export async function scheduleProbe(page: Page) {
  await boot(page)
  await page.getByRole('button', { name: /Quarterly corpus sweep/ }).click()
  await page.getByRole('button', { name: 'Schedule' }).click()
  const dialog = page.getByRole('dialog', { name: 'Schedule launch window' })
  await dialog.getByLabel('Schedule windowStart').fill('2030-01-01T01:00')
  await dialog.getByLabel('Schedule windowEnd').fill('2030-01-01T03:00')
  await dialog.getByRole('button', { name: 'Save schedule' }).click()
  await expect(page.getByText(/Scheduled/).first()).toBeVisible()
  await page.getByRole('button', { name: /Calendar \(1\)/ }).click()
  const calendar = page.getByRole('dialog', { name: 'Schedule calendar text' })
  await expect(calendar).toContainText('BEGIN:VCALENDAR')
  await expect(calendar).toContainText('DTSTART')
  await expect(calendar.getByRole('button', { name: 'Simulate window start' })).toBeVisible()
}

export async function exportProbe(page: Page) {
  await selectJob(page)
  await page.getByRole('button', { name: 'Export run' }).click()
  const dialog = page.getByRole('dialog', { name: 'Export run report' })
  const preview = dialog.getByLabel('Run Report JSON preview')
  const report = JSON.parse(await preview.textContent() ?? '{}')
  for (const key of ['schemaVersion', 'exportedAt', 'job', 'run']) expect(report).toHaveProperty(key)
  await expect(dialog.getByRole('button', { name: 'Download JSON' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Download CSV' })).toBeVisible()
}

export async function mutationExportProbe(page: Page) {
  await boot(page)
  await page.getByRole('button', { name: /Quarterly corpus sweep/ }).click()
  await page.getByRole('button', { name: 'Launch batch' }).click()
  await page.getByRole('button', { name: 'Stop all' }).click()
  await page.getByRole('button', { name: 'Export run' }).click()
  const dialog = page.getByRole('dialog', { name: 'Export run report' })
  const report = JSON.parse(await dialog.getByLabel('Run Report JSON preview').textContent() ?? '{}')
  expect(report.run.items.some((item: { status: string }) => item.status === 'stopped')).toBeTruthy()
  expect(report.run.timeline.some((event: { status: string }) => event.status === 'stopped')).toBeTruthy()
  expect(report.run.rollups.total).toBe(report.run.items.length)
  await expect(dialog.getByRole('button', { name: 'Copy' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Download JSON' })).toBeVisible()
}

export async function actionConfirmationProbe(page: Page) {
  await createProbe(page)
  await expect(page.getByText('Job created', { exact: true })).toBeVisible()
  await boot(page)
  await page.getByRole('button', { name: /Feedback signal review/ }).click()
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete job' }).click()
  await expect(page.getByText('Job deleted', { exact: true })).toBeVisible()
  await exportProbe(page)
  const exportDialog = page.getByRole('dialog', { name: 'Export run report' })
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await exportDialog.getByRole('button', { name: 'Copy' }).click()
  await expect(exportDialog.getByRole('button', { name: 'Copied' })).toBeVisible()
  await expect(exportDialog.getByText('Copied exactly', { exact: true })).toBeVisible()
}

export async function importProbe(page: Page) {
  await selectJob(page)
  await page.getByRole('button', { name: 'Export run' }).click()
  const exported = await page.getByLabel('Run Report JSON preview').textContent()
  await page.getByRole('dialog', { name: 'Export run report' }).getByRole('button', { name: 'Close', exact: true }).last().click()
  await page.getByRole('button', { name: 'Import run' }).click()
  const dialog = page.getByRole('dialog', { name: 'Import run report' })
  await dialog.getByLabel('Run Report JSON text').fill(exported ?? '')
  await dialog.getByRole('button', { name: 'Import run report' }).click()
  await expect(page.getByText(/imported/i).last()).toBeVisible()
  await expect(page.getByRole('region', { name: 'Run history' })).toBeVisible()
}

export async function invalidImportProbe(page: Page) {
  await boot(page)
  const before = await page.locator('.job-card').count()
  await page.getByRole('button', { name: 'Import run' }).click()
  const dialog = page.getByRole('dialog', { name: 'Import run report' })
  await dialog.getByLabel('Run Report JSON text').fill('{"schemaVersion":"wrong"}')
  await dialog.getByRole('button', { name: 'Import run report' }).click()
  await expect(dialog.getByText(/Import contract error/)).toBeVisible()
  expect(await page.locator('.job-card').count()).toBe(before)
}

export async function deleteUndoProbe(page: Page) {
  await boot(page)
  await page.getByRole('button', { name: /Feedback signal review/ }).click()
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText(/Delete job and run history/)
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByRole('heading', { name: 'Feedback signal review' })).toBeVisible()
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete job' }).click()
  await expect(page.locator('.job-card')).toHaveCount(2)
  await page.getByRole('button', { name: 'Undo last state edit' }).click()
  await expect(page.locator('.job-card')).toHaveCount(3)
  await page.getByRole('button', { name: 'Redo state edit' }).click()
  await expect(page.locator('.job-card')).toHaveCount(2)
}

export async function webMcpProbe(page: Page) {
  await boot(page)
  const result = await page.evaluate(async () => {
    const w = window as typeof window & { webmcp_session_info: () => any; webmcp_list_tools: () => any[]; webmcp_invoke_tool: (n: string, a?: any) => Promise<any> }
    const session = w.webmcp_session_info()
    const tools = w.webmcp_list_tools()
    const read = await w.webmcp_invoke_tool('browse_search', { query: 'Nightly' })
    const mutate = await w.webmcp_invoke_tool('form_submit', { 'job-name': 'WebMCP workload', 'prompt-template': 'support-intent', model: 'atlas-40b', concurrency: 2, 'dataset-slice': 'support-gold' })
    return { session, tools, read, mutate }
  })
  expect(result.session.toolCount).toBe(result.tools.length)
  expect(result.read.ok).toBeTruthy()
  expect(result.mutate.visibleState.jobCountAfter - result.mutate.visibleState.jobCountBefore).toBe(1)
  await expect(page.getByRole('heading', { name: 'WebMCP workload' })).toBeVisible()
  await expect(page.locator('.job-card')).toHaveCount(4)
}

export async function keyboardProbe(page: Page) {
  await boot(page)
  await page.keyboard.press('Tab')
  await expect(page.locator(':focus')).toBeVisible()
  await page.getByRole('button', { name: 'New job' }).click()
  const dialog = page.getByRole('dialog', { name: 'New job' })
  await expect.poll(() => dialog.evaluate((node) => node.contains(document.activeElement))).toBeTruthy()
  await dialog.getByRole('button', { name: 'Close' }).focus()
  await page.keyboard.press('Enter')
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('button', { name: 'New job' })).toBeFocused()
}

export async function accessibilityProbe(page: Page, name: string) {
  if (name === 'keyboard_reaches_everything' || name === 'modals_manage_focus') return keyboardProbe(page)
  await boot(page)
  if (name === 'icons_have_labels') {
    const unnamed = await page.locator('button:has(svg)').evaluateAll((buttons) =>
      buttons.filter((button) => {
        const labelledBy = button.getAttribute('aria-labelledby')
        const label = labelledBy
          ? labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent?.trim() ?? '').join(' ').trim()
          : ''
        const imageLabel = button.querySelector('img[alt]')?.getAttribute('alt')?.trim()
        const vectorTitle = button.querySelector('svg title')?.textContent?.trim()
        const visibleOrSemanticText = (button.innerText || button.textContent || '').trim()
        return !(button.getAttribute('aria-label') || button.getAttribute('title') || visibleOrSemanticText || label || imageLabel || vectorTitle)
      }).length)
    expect(unnamed).toBe(0)
    return
  }
  if (name === 'run_events_announced') {
    const live = page.locator('[aria-live="polite"]').filter({ hasText: /Quarterly corpus sweep run/ })
    await page.getByRole('button', { name: /Quarterly corpus sweep/ }).click()
    await page.getByRole('button', { name: 'Launch batch' }).click()
    await expect(live).toHaveText(/Quarterly corpus sweep run (started|completed)/)
    return
  }
  if (name === 'forms_have_explicit_labels') {
    await page.getByRole('button', { name: 'New job' }).click()
    const dialog = page.getByRole('dialog', { name: 'New job' })
    for (const label of ['Job name', 'Model', 'Dataset']) await expect(dialog.getByLabel(label, { exact: false })).toBeVisible()
    return
  }
  if (name === 'headings_follow_order') {
    const levels = await page.locator('main h1, main h2, main h3').evaluateAll((headings) => headings.map((h) => Number(h.tagName.slice(1))))
    expect(levels[0]).toBe(1)
    for (let i = 1; i < levels.length; i += 1) expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1)
    return
  }
  if (name === 'landmarks_present') {
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('complementary', { name: 'Job sidebar' })).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
    return
  }
  if (name === 'contrast_sufficient') {
    const colors = await page.locator('main').evaluate((element) => {
      const style = getComputedStyle(element)
      return { foreground: style.color, background: style.backgroundColor }
    })
    expect(colors.foreground).not.toBe(colors.background)
    return
  }
  if (name === 'semantic_roles_used') {
    await page.getByRole('button', { name: /Quarterly corpus sweep/ }).click()
    await page.getByRole('button', { name: 'Launch batch' }).click()
    await expect(page.getByRole('grid')).toBeVisible()
    await expect(page.getByRole('progressbar')).toBeVisible()
    await expect(page.getByRole('region', { name: 'Run history' })).toBeVisible()
  }
}

export async function responsiveProbe(page: Page) {
  await page.setViewportSize({ width: 375, height: 812 })
  await boot(page)
  await expect(page.getByRole('button', { name: 'Open job sidebar' })).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
  await page.getByRole('button', { name: 'Open job sidebar' }).click()
  await expect(page.getByRole('complementary', { name: 'Job sidebar' })).toHaveClass(/open/)
  const box = await page.getByRole('button', { name: /Quarterly corpus sweep/ }).boundingBox()
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
}

export async function reducedMotionProbe(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await boot(page)
  const duration = await page.getByRole('button', { name: 'New job' }).evaluate((el) => getComputedStyle(el).transitionDuration)
  expect(duration === '0s' || duration === '0.001s' || duration.split(',').every((part) => parseFloat(part) <= 0.01)).toBeTruthy()
}

export async function qualityProbe(page: Page) {
  await shellProbe(page)
  const title = page.getByRole('heading', { name: 'Quarterly corpus sweep' })
  const size = parseFloat(await title.evaluate((el) => getComputedStyle(el).fontSize))
  expect(size).toBeGreaterThanOrEqual(24)
  const boxes = await page.locator('.job-card').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height))
  expect(boxes.every((height) => height > 40)).toBeTruthy()
}

export async function consoleProbe(page: Page) {
  const errors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await shellProbe(page)
  await page.getByRole('button', { name: /Nightly support triage/ }).click()
  await expect(page.getByRole('region', { name: 'Execution grid' })).toBeVisible()
  expect(errors).toEqual([])
}

export async function performanceProbe(page: Page) {
  const start = Date.now()
  await boot(page)
  expect(Date.now() - start).toBeLessThan(2_000)
  await page.getByRole('button', { name: /Quarterly corpus sweep/ }).click()
  await page.getByRole('button', { name: 'Launch batch' }).click()
  await expect(page.getByRole('button', { name: 'Pause all' })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'New job' })).toBeEnabled()
}

export async function seededReloadProbe(page: Page) {
  await boot(page)
  await page.getByRole('button', { name: 'New job' }).click()
  await page.getByRole('dialog', { name: 'New job' }).getByLabel('Job name', { exact: true }).fill('Transient job')
  await page.reload()
  await expect(page.locator('.job-card')).toHaveCount(3)
  await expect(page.getByRole('heading', { name: 'Quarterly corpus sweep' })).toBeVisible()
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 })
}

export async function allViewsProbe(page: Page) {
  await shellProbe(page)
  await page.getByRole('button', { name: /Nightly support triage/ }).click()
  for (const region of ['Execution grid', 'Pending queue', 'Event timeline', 'Run history']) {
    await expect(page.getByRole('region', { name: region })).toBeVisible()
  }
  await page.getByRole('row', { name: /Inspect item/ }).first().click()
  await expect(page.getByRole('complementary', { name: 'Result inspector' })).toBeVisible()
  await page.getByRole('button', { name: 'Export run' }).click()
  await expect(page.getByRole('dialog', { name: 'Export run report' })).toBeVisible()
}

export async function rapidInputProbe(page: Page) {
  await selectJob(page)
  const jobs = [/Quarterly corpus sweep/, /Nightly support triage/, /Feedback signal review/]
  for (let index = 0; index < 9; index += 1) {
    await page.getByRole('button', { name: jobs[index % jobs.length] }).click()
  }
  await expect(page.getByRole('heading', { name: 'Feedback signal review' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Execution grid' })).toBeVisible()
}

export async function crossViewRetryProbe(page: Page) {
  await selectJob(page)
  const grid = page.getByRole('region', { name: 'Execution grid' })
  const failedRows = grid.locator('.grid-row[aria-label$=", failed"]')
  expect(await failedRows.count()).toBeGreaterThan(0)
  const retry = page.getByRole('button', { name: /Retry failed items/ })
  await expect(retry).toBeEnabled()
  await retry.click()
  await expect(page.getByRole('region', { name: 'Event timeline' })).toContainText(/re-queued by operator|retry/i)
  await expect(failedRows).toHaveCount(0)
  await expect(retry).toBeDisabled()
}

export async function emptyJobsProbe(page: Page) {
  await boot(page)
  for (let remaining = 3; remaining > 0; remaining -= 1) {
    await page.locator('.job-card').first().click()
    await page.getByRole('button', { name: 'Delete', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Delete job' }).click()
    await expect(page.locator('.job-card')).toHaveCount(remaining - 1)
  }
  await expect(page.getByRole('heading', { name: 'No job selected' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Create a job' })).toBeVisible()
}

export async function timelineFilterProbe(page: Page) {
  await selectJob(page)
  const timeline = page.getByRole('region', { name: 'Event timeline' })
  const filter = timeline.getByLabel('Filter timeline status')
  const allCount = await timeline.locator('.timeline-entry').count()
  await filter.selectOption('failed')
  const failedCount = await timeline.locator('.timeline-entry').count()
  expect(failedCount).toBeGreaterThan(0)
  expect(failedCount).toBeLessThan(allCount)
  await filter.selectOption('all')
  await expect(timeline.locator('.timeline-entry')).toHaveCount(allCount)
}

export async function editJobProbe(page: Page) {
  await boot(page)
  await page.getByRole('button', { name: /Quarterly corpus sweep/ }).click()
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit job' })
  await dialog.getByLabel('Job name', { exact: true }).fill('Quarterly corpus sweep updated')
  await dialog.getByRole('button', { name: 'Save job' }).click()
  await expect(page.getByRole('heading', { name: 'Quarterly corpus sweep updated' })).toBeVisible()
  await expect(page.locator('.job-card[aria-current="page"]')).toContainText('Quarterly corpus sweep updated')
}

export async function queueRoundTripProbe(page: Page) {
  await boot(page)
  await page.getByRole('button', { name: /Quarterly corpus sweep/ }).click()
  await page.getByRole('button', { name: 'Launch batch' }).click()
  await page.getByRole('button', { name: 'Pause all' }).click()
  const queue = page.getByRole('region', { name: 'Pending queue' })
  const grid = page.getByRole('region', { name: 'Execution grid' }).getByRole('grid')
  const itemCount = await grid.getAttribute('aria-rowcount')
  const order = async () => queue.locator('.queue-input').allTextContents()
  const original = await order()
  const itemLabel = await queue.locator('.queue-entry').nth(1).locator('.queue-input').innerText()
  await queue.locator('.queue-entry').filter({ hasText: itemLabel }).getByRole('button', { name: /Move item .* down/ }).click()
  await queue.locator('.queue-entry').filter({ hasText: itemLabel }).getByRole('button', { name: /Move item .* down/ }).click()
  await queue.locator('.queue-entry').filter({ hasText: itemLabel }).getByRole('button', { name: /Move item .* up/ }).click()
  await queue.locator('.queue-entry').filter({ hasText: itemLabel }).getByRole('button', { name: /Move item .* up/ }).click()
  expect(await order()).toEqual(original)
  await page.getByRole('button', { name: 'Start all' }).click()
  await expect(grid).toHaveAttribute('aria-rowcount', itemCount || '')
  await expect(page.getByRole('button', { name: 'Pause all' })).toBeEnabled()
}

export async function runViewRetentionProbe(page: Page) {
  await selectJob(page, 'Nightly support triage')
  const filter = page.getByLabel('Filter timeline status')
  await filter.selectOption('failed')
  const failedCount = await page.locator('.timeline-entry').count()
  await page.getByRole('button', { name: /Feedback signal review/ }).click()
  await expect(page.locator('.job-card[aria-current="page"]')).toContainText('Feedback signal review')
  await page.getByRole('button', { name: /Nightly support triage/ }).click()
  await expect(page.locator('.job-card[aria-current="page"]')).toContainText('Nightly support triage')
  await expect(filter).toHaveValue('failed')
  await expect(page.locator('.timeline-entry')).toHaveCount(failedCount)
}

export async function multiFacetResetProbe(page: Page) {
  await createProbe(page)
  await page.getByRole('button', { name: 'Schedule' }).click()
  const schedule = page.getByRole('dialog', { name: 'Schedule launch window' })
  await schedule.getByLabel('Schedule windowStart').fill('2030-01-01T01:00')
  await schedule.getByLabel('Schedule windowEnd').fill('2030-01-01T03:00')
  await schedule.getByRole('button', { name: 'Save schedule' }).click()
  await page.getByRole('button', { name: 'Launch batch' }).click()
  const queue = page.getByRole('region', { name: 'Pending queue' })
  const movable = queue.locator('button.queue-move:not([disabled])')
  await expect(movable.first()).toBeEnabled()
  await movable.first().click()
  await page.getByRole('button', { name: 'Pause all' }).click()
  await page.getByLabel('Filter timeline status').selectOption('running')
  await page.reload()
  await expect(page.locator('.job-card')).toHaveCount(3)
  await expect(page.getByRole('heading', { name: 'Quarterly corpus sweep' })).toBeVisible()
  await page.getByRole('button', { name: /Nightly support triage/ }).click()
  await expect(page.getByLabel('Filter timeline status')).toHaveValue('all')
  await expect(page.getByText(/Calendar \(0\)/)).toBeVisible()
}

export async function emptyToRepopulatedProbe(page: Page) {
  await emptyJobsProbe(page)
  await page.getByRole('button', { name: 'Create a job' }).click()
  const dialog = page.getByRole('dialog', { name: 'New job' })
  await dialog.getByLabel('Job name', { exact: true }).fill('Repopulated workload')
  await dialog.getByLabel('Prompt template').selectOption({ index: 1 })
  await dialog.getByLabel('Model and rate').selectOption({ index: 1 })
  await dialog.getByLabel('Seeded dataset slice').selectOption({ index: 1 })
  await dialog.getByRole('button', { name: 'Create ready job' }).click()
  await expect(page.locator('.job-card')).toHaveCount(1)
  await expect(page.getByRole('heading', { name: 'Repopulated workload' })).toBeVisible()
}

export async function durabilityPipelineProbe(page: Page) {
  await boot(page)
  await page.getByRole('button', { name: /Quarterly corpus sweep/ }).click()
  await page.getByRole('button', { name: 'Launch batch' }).click()
  await expect(page.getByRole('grid')).toHaveAttribute('aria-rowcount', '240')
  const retry = page.getByRole('button', { name: /Retry failed items/ })
  await expect(retry).toBeEnabled({ timeout: 60_000 })
  await retry.click()
  await expect(page.getByRole('region', { name: 'Event timeline' })).toContainText(/retry/i)
  await page.getByRole('button', { name: 'Pause all' }).click()
  await expect(page.getByRole('button', { name: 'Start all' })).toBeEnabled()
  await page.getByRole('button', { name: 'Stop all' }).click()
  await page.getByRole('button', { name: 'Export run' }).click()
  const report = JSON.parse(await page.getByRole('dialog', { name: 'Export run report' }).getByLabel('Run Report JSON preview').textContent() ?? '{}')
  expect(report.run.timeline.some((event: { label: string }) => /re-queued by operator/i.test(event.label))).toBeTruthy()
  expect(report.run.timeline.some((event: { status: string }) => event.status === 'stopped')).toBeTruthy()
  expect(report.run.items.some((item: { status: string }) => item.status === 'stopped')).toBeTruthy()
  expect(report.run.rollups.total).toBe(report.run.items.length)
}

export function probeFor(name: string) {
  if (name === 'forms_validate_inline') return validationProbe
  if (name === 'last_delete_reveals_empty_state') return emptyJobsProbe
  if (name === 'timeline_filter_flow') return timelineFilterProbe
  if (name === 'retry_failed_only' || name === 'recovery_without_reload') return crossViewRetryProbe
  if (name === 'edit_flow_updates_displays') return editJobProbe
  if (name === 'queue_order_round_trip') return queueRoundTripProbe
  if (name === 'run_view_switches_retain_state') return runViewRetentionProbe
  if (name === 'status_color_system' || name === 'concurrency_strip_states') return qualityProbe
  if (name === 'multi_facet_seeded_reset') return multiFacetResetProbe
  if (name === 'cross_view_echo_retry') return crossViewRetryProbe
  if (name === 'empty_to_repopulated_round_trip') return emptyToRepopulatedProbe
  if (name === 'durability_export_pipeline' || name === 'durability_pipeline_end_to_end') return durabilityPipelineProbe
  if (name === 'count_delta_exact') return countDeltaProbe
  if (name === 'two_launches_differ_deterministically') return twoLaunchesProbe
  if (name === 'interleaved_flows_intact') return interleavedFlowsProbe
  if (name === 'virtualized_grid_scale') return virtualizedGridProbe
  if (name === 'stop_all_export_truthful') return mutationExportProbe
  if (name === 'all_views_reachable') return allViewsProbe
  if (name === 'mutation_to_export_flow') return mutationExportProbe
  if (name === 'actions_show_confirmation') return actionConfirmationProbe
  if (name === 'no_storage_seeded_reload') return seededReloadProbe
  if (name === 'rapid_input_keeps_sync' || name === 'rapid_input_never_freezes') return rapidInputProbe
  if (/^(keyboard_reaches_everything|modals_manage_focus|icons_have_labels|run_events_announced|forms_have_explicit_labels|headings_follow_order|landmarks_present|contrast_sufficient|semantic_roles_used)$/.test(name)) return (probePage: Page) => accessibilityProbe(probePage, name)
  if (/webmcp|shared_state/.test(name)) return webMcpProbe
  if (/import|round_trip|reconstruct/.test(name)) return name.includes('invalid') || name.includes('reject') || name.includes('unchanged') ? invalidImportProbe : importProbe
  if (/export|json_schema|csv|artifact|durability/.test(name)) return exportProbe
  if (/schedule|calendar|ics|window_start/.test(name)) return scheduleProbe
  if (/delete|undo|redo|empty_state/.test(name)) return deleteUndoProbe
  if (/compare|flips/.test(name)) return compareProbe
  if (/inspector|diff_not|full_content|expected_diff/.test(name)) return inspectorProbe
  if (/queue|reorder|keyboard_queue/.test(name)) return queueProbe
  if (/compose|composer|form|validation|overlong|truncation|create_payload/.test(name)) return /valid_submit|creates_job/.test(name) ? createProbe : /validation|invalid|overlong|truncation|contract/.test(name) ? validationProbe : composerProbe
  if (/launch|pause|resume|retry|macro|concurrency|progress|status|failure|backoff|rollup|activity|long_run|simulated|count_delta|two_launches/.test(name)) return launchProbe
  if (/grid|timeline|history|seeded|currency|run_view|filter/.test(name)) return runProbe
  if (/keyboard|focus|modal|label|heading|landmark|semantic|icons|announced/.test(name)) return keyboardProbe
  if (/reduced_motion/.test(name)) return reducedMotionProbe
  if (/responsive|mobile|tap|viewport|clipping|sidebar|stacking|touch|horizontal|fixed_controls/.test(name)) return responsiveProbe
  if (/performance|cold_start|console|respond|smooth|frame_rate|extended_session|degrades|interactive/.test(name)) return name.includes('console') ? consoleProbe : performanceProbe
  if (/visual|design|spacing|typography|layout|color|contrast|polish|theme|narrative|microinteraction|motion|hover|toast|writing|heading|actions|errors|terminology|numbers|success|copy/.test(name)) return qualityProbe
  return shellProbe
}

export async function criterionProbe(page: Page, _testInfo: unknown, name: string) {
  await probeFor(name)(page)
}
