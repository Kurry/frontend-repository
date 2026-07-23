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
