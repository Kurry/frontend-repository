import { expect, test } from '@playwright/test'

const candidateRows = (page) => page.getByRole('table', { name: 'Candidate repositories' }).locator('tbody tr')
const candidateRow = (page, name) => page.getByRole('row').filter({ hasText: name })

async function exportPack(page) {
  await page.getByRole('button', { name: 'Export pack' }).click()
  const dialog = page.getByRole('dialog', { name: 'Export sourcing pack' })
  const pack = JSON.parse(await dialog.getByLabel('Active export text').textContent())
  await dialog.getByRole('button', { name: 'Close export panel' }).click()
  return pack
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('quota navigation renders its grid and a cell drills into matching candidates', async ({ page }) => {
  await page.getByRole('button', { name: 'Quota', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Quota dashboard' })).toBeVisible()

  const pythonEasy = page.getByRole('button', { name: /Python easy:/ })
  await expect(pythonEasy).toContainText('3')
  await expect(pythonEasy).toContainText('of 1')
  await expect(pythonEasy).toContainText('+2 excess')
  await pythonEasy.click()

  await expect(page.getByRole('heading', { name: 'Candidate workbench' })).toBeVisible()
  await expect(page.getByLabel('Active filters')).toContainText('language Python')
  await expect(page.getByLabel('Active filters')).toContainText('difficulty Easy')
  await expect(candidateRows(page)).toHaveCount(3)
  for (const row of await candidateRows(page).all()) {
    await expect(row).toContainText('Python')
    const difficulty = Number(await row.locator('td').nth(4).locator('span').first().textContent())
    expect(difficulty).toBeLessThan(4)
  }
})

test('sortable headers expose and reverse Stars direction without changing row count', async ({ page }) => {
  const starsHeader = page.locator('th').filter({ has: page.getByRole('button', { name: 'Stars' }) })
  const stars = page.getByRole('button', { name: 'Stars' })
  const rowCount = await candidateRows(page).count()

  await stars.click()
  await expect(starsHeader).toHaveAttribute('aria-sort', 'ascending')
  const ascending = await candidateRows(page).evaluateAll((rows) => rows.map((row) => Number(row.children[3].textContent.replaceAll(',', ''))))
  expect(ascending).toEqual([...ascending].sort((a, b) => a - b))

  await stars.click()
  await expect(starsHeader).toHaveAttribute('aria-sort', 'descending')
  const descending = await candidateRows(page).evaluateAll((rows) => rows.map((row) => Number(row.children[3].textContent.replaceAll(',', ''))))
  expect(descending).toEqual([...ascending].reverse())
  await expect(candidateRows(page)).toHaveCount(rowCount)
})

test('opening export through the contract retires an earlier pin dialog', async ({ page }) => {
  const row = page.getByRole('row').filter({ hasText: 'emberforge/ash-parser' })
  await row.getByRole('button', { name: 'Pin' }).click()
  await expect(page.getByRole('dialog', { name: /Pin emberforge\/ash-parser/ })).toBeVisible()

  await page.evaluate(() => window.webmcp_invoke_tool('artifact_copy', { format: 'queue-json' }))

  await expect(page.getByRole('dialog', { name: /Pin emberforge\/ash-parser/ })).toBeHidden()
  await expect(page.getByRole('dialog', { name: 'Export sourcing pack' })).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Export sourcing pack' }).getByRole('button', { name: 'Copy', exact: true })).toBeFocused()
  await expect(row).toContainText('Selected')
})

test('pin validation, commit copy, and export copy are visible and announced', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  const row = page.getByRole('row').filter({ hasText: 'emberforge/ash-parser' })
  await row.getByRole('button', { name: 'Pin' }).click()
  const dialog = page.getByRole('dialog', { name: /Pin emberforge\/ash-parser/ })
  const commit = (await dialog.locator('code').textContent()).trim()
  expect(commit).toMatch(/^[0-9a-f]{12}$/)

  await dialog.getByLabel(/Notes/).fill('x'.repeat(201))
  await expect(dialog.getByText('Notes field: use 200 characters or fewer.')).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Confirm pin' })).toBeDisabled()
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(row).toContainText('Selected')

  await row.getByRole('button', { name: 'Pin' }).click()
  const confirmedCommit = (await page.getByRole('dialog', { name: /Pin emberforge\/ash-parser/ }).locator('code').textContent()).trim()
  await page.getByRole('dialog', { name: /Pin emberforge\/ash-parser/ }).getByRole('button', { name: 'Confirm pin' }).click()
  await expect(row).toContainText('Pinned')
  await row.getByRole('button', { name: `Copy commit ${confirmedCommit}` }).click()
  await expect(row).toContainText('Copied')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(confirmedCommit)

  await page.getByRole('button', { name: 'Export pack' }).click()
  const exportDialog = page.getByRole('dialog', { name: 'Export sourcing pack' })
  const visibleExport = await exportDialog.getByLabel('Active export text').textContent()
  await exportDialog.getByRole('button', { name: 'Copy', exact: true }).click()
  await expect(page.locator('.sr-only[role="status"]')).toHaveText('Queue JSON copied to the clipboard.')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(visibleExport)
})

test('invalid import names the field and preserves active filters and rows', async ({ page }) => {
  await page.getByLabel('Language').selectOption('Rust')
  await page.getByLabel('Difficulty band').selectOption('hard')
  const namesBefore = await candidateRows(page).evaluateAll((rows) => rows.map((row) => row.children[1].textContent.trim()))

  await page.getByRole('button', { name: 'Import', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Import sourcing pack' })
  await dialog.getByLabel('Raw JSON text').fill('{"schemaVersion":"wrong"}')
  await dialog.getByRole('button', { name: 'Apply import' }).click()
  await expect(dialog.getByRole('alert')).toContainText('schemaVersion field')
  await dialog.getByRole('button', { name: 'Cancel' }).click()

  await expect(page.getByLabel('Language')).toHaveValue('Rust')
  await expect(page.getByLabel('Difficulty band')).toHaveValue('hard')
  const namesAfter = await candidateRows(page).evaluateAll((rows) => rows.map((row) => row.children[1].textContent.trim()))
  expect(namesAfter).toEqual(namesBefore)
})

test('selection changes the matching quota cell and export by exactly one', async ({ page }) => {
  const name = 'northloom/thread-cache'
  const before = await exportPack(page)
  const beforeCandidate = before.candidates.find((candidate) => candidate.name === name)
  const beforeCell = before.quota.find((cell) => cell.language === beforeCandidate.language && cell.band === 'hard')

  await candidateRow(page, name).getByRole('button', { name: 'Select' }).click()
  await expect(candidateRow(page, name)).toContainText('Selected')
  const after = await exportPack(page)
  const afterCell = after.quota.find((cell) => cell.language === beforeCandidate.language && cell.band === 'hard')

  expect(after.candidates.find((candidate) => candidate.name === name).status).toBe('selected')
  expect(afterCell.achieved).toBe(beforeCell.achieved + 1)
  await page.getByRole('button', { name: 'Quota', exact: true }).click()
  await expect(page.getByRole('button', { name: new RegExp(`${beforeCandidate.language} hard: ${afterCell.achieved} of`) })).toBeVisible()
})

test('distinct rejection reasons remain distinct across rows timeline and export', async ({ page }) => {
  for (const [name, reason] of [['northloom/thread-cache', 'license-blocked'], ['mirthworks/jolly-log', 'too-large']]) {
    await candidateRow(page, name).getByRole('button', { name: 'Reject' }).click()
    const dialog = page.getByRole('dialog', { name: new RegExp(`Reject ${name.replace('/', '\\/')}`) })
    await dialog.getByLabel('Rejection reason').selectOption(reason)
    await dialog.getByRole('button', { name: 'Reject', exact: true }).click()
    await expect(candidateRow(page, name)).toContainText(`Reason: ${reason}`)
  }

  await page.getByRole('button', { name: 'Timeline', exact: true }).click()
  await expect(page.locator('article').filter({ hasText: 'northloom/thread-cache' }).first()).toContainText('license-blocked')
  await expect(page.locator('article').filter({ hasText: 'mirthworks/jolly-log' }).first()).toContainText('too-large')
  await page.getByRole('button', { name: 'Candidates', exact: true }).click()
  const pack = await exportPack(page)
  expect(pack.candidates.find((candidate) => candidate.name === 'northloom/thread-cache').rejectionReason).toBe('license-blocked')
  expect(pack.candidates.find((candidate) => candidate.name === 'mirthworks/jolly-log').rejectionReason).toBe('too-large')
})

test('queue can be emptied and repopulated with coherent rollup and export order', async ({ page }) => {
  await page.getByRole('button', { name: 'Build queue', exact: true }).click()
  for (const button of await page.getByRole('button', { name: /^Remove .* from queue$/ }).all()) await button.click()
  await expect(page.getByRole('heading', { name: 'Queue is ready' })).toBeVisible()

  await page.getByRole('button', { name: 'Candidates', exact: true }).click()
  const row = candidateRow(page, 'emberforge/ash-parser')
  await row.getByRole('button', { name: 'Pin' }).click()
  await page.getByRole('dialog', { name: /Pin emberforge\/ash-parser/ }).getByRole('button', { name: 'Confirm pin' }).click()
  await row.getByRole('button', { name: 'Queue' }).click()
  await expect(page.getByRole('button', { name: 'Toggle build queue' })).toContainText('1')

  const pack = await exportPack(page)
  expect(pack.queue).toHaveLength(1)
  expect(pack.queue[0]).toMatchObject({ position: 1, name: 'emberforge/ash-parser' })
  expect(pack.queue[0].commit).toMatch(/^[0-9a-f]{12}$/)
})

test('export mutation import and bulk undo redo round-trip through visible controls', async ({ page }) => {
  const original = await exportPack(page)
  await candidateRow(page, 'northloom/thread-cache').getByRole('button', { name: 'Reject' }).click()
  await page.getByRole('dialog', { name: /Reject northloom\/thread-cache/ }).getByLabel('Rejection reason').selectOption('gui-heavy')
  await page.getByRole('dialog', { name: /Reject northloom\/thread-cache/ }).getByRole('button', { name: 'Reject', exact: true }).click()

  await page.getByRole('button', { name: 'Import', exact: true }).click()
  const importDialog = page.getByRole('dialog', { name: 'Import sourcing pack' })
  await importDialog.getByLabel('Raw JSON text').fill(JSON.stringify(original))
  await importDialog.getByRole('button', { name: 'Apply import' }).click()
  await expect(candidateRow(page, 'northloom/thread-cache')).toContainText('Scored')

  const scored = ['northloom/thread-cache', 'emberforge/flint-schema', 'copperfield/wren-query']
  for (const name of scored) await candidateRow(page, name).getByRole('checkbox').check()
  const selectedBefore = Number(await page.locator('.rollups').getByText('Selected').locator('..').locator('.text-xl').textContent())
  await page.getByRole('button', { name: 'Bulk Select' }).click()
  for (const name of scored) await expect(candidateRow(page, name)).toContainText('Selected')
  await page.getByRole('button', { name: 'Undo' }).click()
  for (const name of scored) await expect(candidateRow(page, name)).toContainText('Scored')
  await page.getByRole('button', { name: 'Redo' }).click()
  for (const name of scored) await expect(candidateRow(page, name)).toContainText('Selected')
  await expect(page.locator('.rollups').getByText('Selected').locator('..').locator('.text-xl')).toHaveText(String(selectedBefore + 3))
})

test('dialogs trap focus, restore openers, and workflows survive reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const opener = page.getByRole('button', { name: 'Export pack' })
  await opener.focus()
  await opener.click()
  const dialog = page.getByRole('dialog', { name: 'Export sourcing pack' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Download' }).focus()
  await page.keyboard.press('Tab')
  expect(await page.evaluate(() => document.activeElement.closest('[role="dialog"]')?.getAttribute('aria-labelledby'))).toBe('export-title')
  await page.keyboard.press('Escape')
  await expect(opener).toBeFocused()

  await page.getByRole('button', { name: 'Open command palette' }).click()
  const palette = page.getByRole('dialog', { name: 'Command palette' })
  await palette.getByLabel('Search commands').fill('fetch')
  await palette.getByRole('button', { name: /Fetch more candidates/ }).click()
  await expect(page.getByRole('button', { name: 'Sourcing in progress…' })).toBeDisabled()
  await expect(page.getByLabel('Fetch more candidates progress')).toContainText('running')
  await expect(page.getByRole('button', { name: 'Fetch more candidates' })).toBeEnabled()
})

test('queued candidate echoes through timeline quota and export without reload', async ({ page }) => {
  const name = 'emberforge/ash-parser'
  const row = candidateRow(page, name)
  await row.getByRole('button', { name: 'Pin' }).click()
  await page.getByRole('dialog', { name: /Pin emberforge\/ash-parser/ }).getByRole('button', { name: 'Confirm pin' }).click()
  await row.getByRole('button', { name: 'Queue' }).click()

  await page.getByRole('button', { name: 'Timeline', exact: true }).click()
  const events = page.locator('article').filter({ hasText: name })
  await expect(events.nth(0)).toContainText('Pinned')
  await expect(events.nth(0)).toContainText('Queued')
  await expect(events.nth(1)).toContainText('Selected')
  await expect(events.nth(1)).toContainText('Pinned')

  await page.getByRole('button', { name: 'Quota', exact: true }).click()
  await expect(page.getByRole('button', { name: /Python medium:/ })).toContainText('1')
  await page.getByRole('button', { name: 'Candidates', exact: true }).click()
  const pack = await exportPack(page)
  expect(pack.queue.map((entry) => entry.name)).toContain(name)
  expect(pack.candidates.find((candidate) => candidate.name === name)).toMatchObject({ status: 'queued', queuePosition: 3 })
})

test('full mutation pipeline exports queued commit rejection quota and exact clipboard text', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  const queuedName = 'emberforge/ash-parser'
  const rejectedName = 'northloom/thread-cache'
  const before = await exportPack(page)

  await candidateRow(page, queuedName).getByRole('button', { name: 'Pin' }).click()
  await page.getByRole('dialog', { name: /Pin emberforge\/ash-parser/ }).getByRole('button', { name: 'Confirm pin' }).click()
  await candidateRow(page, queuedName).getByRole('button', { name: 'Queue' }).click()
  await candidateRow(page, rejectedName).getByRole('button', { name: 'Reject' }).click()
  await page.getByRole('dialog', { name: /Reject northloom\/thread-cache/ }).getByLabel('Rejection reason').selectOption('gui-heavy')
  await page.getByRole('dialog', { name: /Reject northloom\/thread-cache/ }).getByRole('button', { name: 'Reject', exact: true }).click()

  await page.getByRole('button', { name: 'Export pack' }).click()
  const dialog = page.getByRole('dialog', { name: 'Export sourcing pack' })
  const text = await dialog.getByLabel('Active export text').textContent()
  const after = JSON.parse(text)
  const queued = after.candidates.find((candidate) => candidate.name === queuedName)
  const rejected = after.candidates.find((candidate) => candidate.name === rejectedName)
  expect(before.candidates.find((candidate) => candidate.name === queuedName).status).toBe('selected')
  expect(queued.status).toBe('queued')
  expect(queued.commit).toMatch(/^[0-9a-f]{12}$/)
  expect(queued.queuePosition).toBeGreaterThan(0)
  expect(rejected).toMatchObject({ status: 'rejected', rejectionReason: 'gui-heavy' })
  expect(after.quotaFillPercent).toBe(before.quotaFillPercent)
  await dialog.getByRole('button', { name: 'Copy', exact: true }).click()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(text)
})

test('two fetch runs expose ordered progress and append twelve distinct rows', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const initial = await candidateRows(page).count()
  for (const expected of [initial + 6, initial + 12]) {
    await page.getByRole('button', { name: 'Fetch more candidates' }).click()
    const progress = page.getByLabel('Fetch more candidates progress')
    await expect(page.getByRole('button', { name: 'Sourcing in progress…' })).toBeDisabled()
    await expect(progress).toContainText('Querying')
    await expect(progress).toContainText('Scoring')
    await expect(progress).toContainText('Classifying')
    await expect(page.getByRole('button', { name: 'Fetch more candidates' })).toBeEnabled()
    await expect(candidateRows(page)).toHaveCount(expected)
  }
  const names = await candidateRows(page).evaluateAll((rows) => rows.map((row) => row.children[1].textContent.trim()))
  expect(new Set(names).size).toBe(names.length)
})

test('command palette invokes candidate and top-level flows with focus restoration', async ({ page }) => {
  const name = 'emberforge/cinder-cli'
  await candidateRow(page, name).getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Open command palette' }).click()
  let palette = page.getByRole('dialog', { name: 'Command palette' })
  await palette.getByLabel('Search commands').fill('score cinder')
  await palette.getByRole('button', { name: new RegExp(`Score ${name.replace('/', '\\/')}`) }).click()
  await expect(candidateRow(page, name)).toContainText('Scored')

  await page.getByRole('button', { name: 'Open command palette' }).click()
  palette = page.getByRole('dialog', { name: 'Command palette' })
  await palette.getByLabel('Search commands').fill('select cinder')
  await palette.getByRole('button', { name: new RegExp(`Select ${name.replace('/', '\\/')}`) }).click()
  await expect(candidateRow(page, name)).toContainText('Selected')

  await candidateRow(page, name).click()
  await page.getByRole('button', { name: 'Open command palette' }).click()
  palette = page.getByRole('dialog', { name: 'Command palette' })
  await palette.getByLabel('Search commands').fill('pin cinder')
  await palette.getByRole('button', { name: new RegExp(`Pin ${name.replace('/', '\\/')}`) }).click()
  await expect(page.getByRole('dialog', { name: new RegExp(`Pin ${name.replace('/', '\\/')}`) })).toBeVisible()
  await page.keyboard.press('Escape')

  for (const [query, heading] of [['export', 'Export sourcing pack'], ['import', 'Import sourcing pack']]) {
    const opener = page.getByRole('button', { name: 'Open command palette' })
    await opener.click()
    palette = page.getByRole('dialog', { name: 'Command palette' })
    await palette.getByLabel('Search commands').fill(query)
    await palette.getByRole('button', { name: new RegExp(heading) }).click()
    const dialog = page.getByRole('dialog', { name: heading })
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(opener).toBeFocused()
  }
})

test('interleaved pin quota rejection and cancel preserve both candidates', async ({ page }) => {
  const pending = 'emberforge/ash-parser'
  const rejected = 'northloom/thread-cache'
  await candidateRow(page, pending).getByRole('button', { name: 'Pin' }).click()
  await page.getByRole('dialog', { name: /Pin emberforge\/ash-parser/ }).getByLabel(/Notes/).fill('leave pending')
  await page.getByRole('button', { name: 'Quota', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Quota dashboard' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Resume pending pin' })).toBeVisible()

  await page.getByRole('button', { name: 'Candidates', exact: true }).click()
  await candidateRow(page, rejected).getByRole('button', { name: 'Reject' }).click()
  await page.getByRole('dialog', { name: /Reject northloom\/thread-cache/ }).getByLabel('Rejection reason').selectOption('duplicate-cluster')
  await page.getByRole('dialog', { name: /Reject northloom\/thread-cache/ }).getByRole('button', { name: 'Reject', exact: true }).click()
  await page.getByRole('button', { name: 'Resume pending pin' }).click()
  const resumed = page.getByRole('dialog', { name: /Pin emberforge\/ash-parser/ })
  await expect(resumed.getByLabel(/Notes/)).toHaveValue('leave pending')
  await resumed.getByRole('button', { name: 'Cancel' }).click()

  await expect(candidateRow(page, pending)).toContainText('Selected')
  await expect(candidateRow(page, pending)).not.toContainText(/^[0-9a-f]{12}$/)
  await expect(candidateRow(page, rejected)).toContainText('duplicate-cluster')
})

test('one candidate traverses score select pin queue while another rejection reaches clipboard export', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  const queuedName = 'emberforge/cinder-cli'
  const rejectedName = 'northloom/thread-cache'
  const row = candidateRow(page, queuedName)
  await row.getByRole('button', { name: 'Score' }).click()
  await row.getByRole('button', { name: 'Select' }).click()
  await row.getByRole('button', { name: 'Pin' }).click()
  await page.getByRole('dialog', { name: /Pin emberforge\/cinder-cli/ }).getByRole('button', { name: 'Confirm pin' }).click()
  await row.getByRole('button', { name: 'Queue' }).click()

  await candidateRow(page, rejectedName).getByRole('button', { name: 'Reject' }).click()
  await page.getByRole('dialog', { name: /Reject northloom\/thread-cache/ }).getByLabel('Rejection reason').selectOption('gui-heavy')
  await page.getByRole('dialog', { name: /Reject northloom\/thread-cache/ }).getByRole('button', { name: 'Reject', exact: true }).click()

  await page.getByRole('button', { name: 'Export pack' }).click()
  const dialog = page.getByRole('dialog', { name: 'Export sourcing pack' })
  const text = await dialog.getByLabel('Active export text').textContent()
  const pack = JSON.parse(text)
  const queued = pack.candidates.find((candidate) => candidate.name === queuedName)
  expect(queued).toMatchObject({ status: 'queued' })
  expect(queued.commit).toMatch(/^[0-9a-f]{12}$/)
  expect(queued.queuePosition).toBe(pack.queue.find((entry) => entry.name === queuedName).position)
  expect(pack.candidates.find((candidate) => candidate.name === rejectedName).rejectionReason).toBe('gui-heavy')
  await dialog.getByRole('button', { name: 'Copy', exact: true }).click()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(text)
})

test('command palette covers score select reject pin queue fetch export and import', async ({ page }) => {
  const invoke = async (query, expected) => {
    await page.getByRole('button', { name: 'Open command palette' }).click()
    const palette = page.getByRole('dialog', { name: 'Command palette' })
    await palette.getByLabel('Search commands').fill(query)
    await palette.getByRole('button', { name: expected }).click()
  }
  const flow = 'emberforge/cinder-cli'
  await candidateRow(page, flow).click()
  await invoke('score cinder', new RegExp(`Score ${flow.replace('/', '\\/')}`))
  await invoke('select cinder', new RegExp(`Select ${flow.replace('/', '\\/')}`))
  await invoke('pin cinder', new RegExp(`Pin ${flow.replace('/', '\\/')}`))
  await page.getByRole('dialog', { name: /Pin emberforge\/cinder-cli/ }).getByRole('button', { name: 'Confirm pin' }).click()
  await candidateRow(page, flow).click()
  await invoke('queue cinder', new RegExp(`Queue ${flow.replace('/', '\\/')}`))
  await expect(candidateRow(page, flow)).toContainText('Queued')

  const rejected = 'northloom/thread-cache'
  await candidateRow(page, rejected).click()
  await invoke('reject thread', new RegExp(`Reject ${rejected.replace('/', '\\/')}`))
  await page.getByRole('dialog', { name: /Reject northloom\/thread-cache/ }).getByLabel('Rejection reason').selectOption('license-blocked')
  await page.getByRole('dialog', { name: /Reject northloom\/thread-cache/ }).getByRole('button', { name: 'Reject', exact: true }).click()

  await invoke('fetch', /Fetch more candidates/)
  await expect(page.getByRole('button', { name: 'Sourcing in progress…' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Fetch more candidates' })).toBeEnabled()
  await invoke('export', /Export sourcing pack/)
  await expect(page.getByRole('dialog', { name: 'Export sourcing pack' })).toBeVisible()
  await page.keyboard.press('Escape')
  await invoke('import', /Import sourcing pack/)
  await expect(page.getByRole('dialog', { name: 'Import sourcing pack' })).toBeVisible()
})

test('all required overlays trap focus, close on Escape, and restore their opener', async ({ page }) => {
  const cases = [
    { opener: () => candidateRow(page, 'emberforge/ash-parser').getByRole('button', { name: 'Pin' }), dialog: /Pin emberforge\/ash-parser/ },
    { opener: () => page.getByRole('button', { name: 'Open command palette' }), dialog: 'Command palette' },
    { opener: () => page.getByRole('button', { name: 'Export pack' }), dialog: 'Export sourcing pack' },
    { opener: () => page.getByRole('button', { name: 'Import', exact: true }), dialog: 'Import sourcing pack' }
  ]
  for (const item of cases) {
    const opener = item.opener()
    await opener.focus()
    await opener.click()
    const dialog = page.getByRole('dialog', { name: item.dialog })
    await expect(dialog).toBeVisible()
    const focusables = dialog.locator('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)')
    await focusables.last().focus()
    await page.keyboard.press('Tab')
    expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true)
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(opener).toBeFocused()
  }

  await candidateRow(page, 'northloom/thread-cache').getByRole('button', { name: 'Reject' }).click()
  const reject = page.getByRole('dialog', { name: /Reject northloom\/thread-cache/ })
  await reject.getByRole('button', { name: 'Reject', exact: true }).click()
  const error = reject.getByRole('alert')
  await expect(error).toBeVisible()
  await expect(reject.getByLabel('Rejection reason')).toHaveAttribute('aria-describedby', await error.getAttribute('id'))
})

test('motion states and reduced motion are observable through real controls', async ({ page }) => {
  const durationMs = async (locator) => locator.evaluate((node) => {
    const style = getComputedStyle(node)
    const values = `${style.transitionDuration},${style.animationDuration}`.match(/[\d.]+m?s/g) || []
    return Math.max(...values.map((value) => value.endsWith('ms') ? Number.parseFloat(value) : Number.parseFloat(value) * 1000), 0)
  })

  const chip = candidateRow(page, 'northloom/thread-cache').locator('.status-chip')
  expect(await durationMs(chip)).toBeGreaterThanOrEqual(200)
  await candidateRow(page, 'emberforge/ash-parser').getByRole('button', { name: 'Pin' }).click()
  expect(await durationMs(page.getByRole('dialog', { name: /Pin emberforge\/ash-parser/ }))).toBeGreaterThanOrEqual(200)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Open command palette' }).click()
  expect(await durationMs(page.getByRole('dialog', { name: 'Command palette' }))).toBeGreaterThanOrEqual(200)
  await page.keyboard.press('Escape')

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('button', { name: 'Export pack' }).click()
  expect(await durationMs(page.getByRole('dialog', { name: 'Export sourcing pack' }))).toBeLessThan(1)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Import', exact: true }).click()
  expect(await durationMs(page.getByRole('dialog', { name: 'Import sourcing pack' }))).toBeLessThan(1)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Import', exact: true })).toBeFocused()
})

test('control states expose hover focus disabled and field-linked error treatments', async ({ page }) => {
  const fetch = page.getByRole('button', { name: 'Fetch more candidates' })
  const background = await fetch.evaluate((node) => getComputedStyle(node).backgroundColor)
  await fetch.hover()
  await expect.poll(() => fetch.evaluate((node) => getComputedStyle(node).backgroundColor)).not.toBe(background)
  await fetch.focus()
  expect(await fetch.evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe('none')
  await fetch.click()
  await expect(page.getByRole('button', { name: 'Sourcing in progress…' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Fetch more candidates' })).toBeEnabled()

  await candidateRow(page, 'northloom/thread-cache').getByRole('button', { name: 'Reject' }).click()
  const field = page.getByRole('dialog', { name: /Reject northloom\/thread-cache/ }).getByLabel('Rejection reason')
  await page.getByRole('dialog', { name: /Reject northloom\/thread-cache/ }).getByRole('button', { name: 'Reject', exact: true }).click()
  await expect(field).toHaveAttribute('aria-invalid', 'true')
  expect(await field.evaluate((node) => getComputedStyle(node).borderColor)).toBe('rgb(255, 143, 160)')
})

test('snapshot comparison is an additional operator-efficiency enhancement', async ({ page }) => {
  await page.getByRole('button', { name: 'Export pack' }).click()
  const dialog = page.getByRole('dialog', { name: 'Export sourcing pack' })
  await dialog.getByRole('button', { name: 'Take snapshot' }).click()
  await page.keyboard.press('Escape')
  await candidateRow(page, 'northloom/thread-cache').getByRole('button', { name: 'Select' }).click()
  await page.getByRole('button', { name: 'Export pack' }).click()
  await dialog.getByRole('button', { name: 'Take snapshot' }).click()
  await dialog.getByRole('button', { name: 'Compare snapshots' }).click()
  await expect(dialog.getByLabel('Snapshot comparison')).toContainText('northloom/thread-cache: scored → selected')
})

test('undo redo mutation matrix keeps table queue timeline quota and export coherent', async ({ page }) => {
  const statusInExport = async (name) => (await exportPack(page)).candidates.find((candidate) => candidate.name === name).status
  const undoRedoStatus = async (name, before, after) => {
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(candidateRow(page, name)).toContainText(before)
    expect(await statusInExport(name)).toBe(before.toLowerCase())
    await page.getByRole('button', { name: 'Redo' }).click()
    await expect(candidateRow(page, name)).toContainText(after)
    expect(await statusInExport(name)).toBe(after.toLowerCase())
  }

  const flow = 'emberforge/cinder-cli'
  await candidateRow(page, flow).getByRole('button', { name: 'Score' }).click()
  await undoRedoStatus(flow, 'Candidate', 'Scored')
  await candidateRow(page, flow).getByRole('button', { name: 'Select' }).click()
  await undoRedoStatus(flow, 'Scored', 'Selected')
  await candidateRow(page, flow).getByRole('button', { name: 'Pin' }).click()
  await page.getByRole('dialog', { name: /Pin emberforge\/cinder-cli/ }).getByRole('button', { name: 'Confirm pin' }).click()
  await undoRedoStatus(flow, 'Selected', 'Pinned')
  await candidateRow(page, flow).getByRole('button', { name: 'Queue' }).click()
  await undoRedoStatus(flow, 'Pinned', 'Queued')

  await page.getByRole('button', { name: 'Build queue', exact: true }).click()
  await page.getByRole('button', { name: `Remove ${flow} from queue` }).click()
  await page.getByRole('button', { name: 'Candidates', exact: true }).click()
  await undoRedoStatus(flow, 'Queued', 'Selected')

  await page.getByRole('button', { name: 'Build queue', exact: true }).click()
  const firstBefore = await page.getByRole('list', { name: 'Ordered build queue' }).locator('li').first().textContent()
  await page.getByRole('button', { name: /Move .* down/ }).first().click()
  const firstAfter = await page.getByRole('list', { name: 'Ordered build queue' }).locator('li').first().textContent()
  expect(firstAfter).not.toBe(firstBefore)
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.getByRole('list', { name: 'Ordered build queue' }).locator('li').first()).toContainText(firstBefore.match(/[a-z]+\/[a-z-]+/)[0])
  await page.getByRole('button', { name: 'Redo' }).click()
  await expect(page.getByRole('list', { name: 'Ordered build queue' }).locator('li').first()).toContainText(firstAfter.match(/[a-z]+\/[a-z-]+/)[0])

  await page.getByRole('button', { name: 'Candidates', exact: true }).click()
  const bulk = ['lanternvale/glow-jobs', 'bluequartz/prism-diff', 'willowgrid/sedge-graph']
  for (const name of bulk) await candidateRow(page, name).getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Bulk Score' }).click()
  for (const name of bulk) await expect(candidateRow(page, name)).toContainText('Scored')
  await page.getByRole('button', { name: 'Undo' }).click()
  for (const name of bulk) await expect(candidateRow(page, name)).toContainText('Candidate')
  await page.getByRole('button', { name: 'Redo' }).click()
  for (const name of bulk) await expect(candidateRow(page, name)).toContainText('Scored')

  const beforeImport = await exportPack(page)
  await candidateRow(page, 'northloom/thread-cache').getByRole('button', { name: 'Reject' }).click()
  await page.getByRole('dialog', { name: /Reject northloom\/thread-cache/ }).getByLabel('Rejection reason').selectOption('too-large')
  await page.getByRole('dialog', { name: /Reject northloom\/thread-cache/ }).getByRole('button', { name: 'Reject', exact: true }).click()
  await page.getByRole('button', { name: 'Import', exact: true }).click()
  await page.getByRole('dialog', { name: 'Import sourcing pack' }).getByLabel('Raw JSON text').fill(JSON.stringify(beforeImport))
  await page.getByRole('dialog', { name: 'Import sourcing pack' }).getByRole('button', { name: 'Apply import' }).click()
  await expect(candidateRow(page, 'northloom/thread-cache')).toContainText('Scored')
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(candidateRow(page, 'northloom/thread-cache')).toContainText('Rejected')
  await page.getByRole('button', { name: 'Redo' }).click()
  await expect(candidateRow(page, 'northloom/thread-cache')).toContainText('Scored')

  await page.getByRole('button', { name: 'Timeline', exact: true }).click()
  await expect(page.getByRole('button', { name: /Import · 1/ })).toBeVisible()
  await page.getByRole('button', { name: 'Quota', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Quota dashboard' })).toBeVisible()
  await page.getByRole('button', { name: 'Candidates', exact: true }).click()
  expect((await exportPack(page)).queue.map((entry) => entry.name)).toEqual(beforeImport.queue.map((entry) => entry.name))
})
