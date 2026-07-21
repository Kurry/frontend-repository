import { expect, test } from '@playwright/test'

const candidateRows = (page) => page.getByRole('table', { name: 'Candidate repositories' }).locator('tbody tr')

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
