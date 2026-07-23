import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

test('visible failure demo counts down, exhausts retries, and manually resumes', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Run failure demo' }).click()
  const panel = page.locator('#scan-panel')
  await expect(panel).toContainText('Scan run · Product catalog')
  await expect(panel.locator('.status-pending').first()).toBeVisible()

  const retry = panel.locator('.retry-text')
  await expect(retry).toContainText('Waiting 3s before retry 2 of 3', { timeout: 8_000 })
  await expect(retry).toContainText('Waiting 2s before retry 2 of 3', { timeout: 2_000 })
  await expect(retry).toContainText('Waiting 3s before retry 3 of 3', { timeout: 6_000 })

  const manualRetry = panel.getByRole('button', { name: 'Retry step' })
  await expect(manualRetry).toBeVisible({ timeout: 7_000 })
  await expect(panel.getByRole('alert')).toContainText('Parser could not resolve')
  const completedOutput = await panel.locator('[data-status="complete"] .step-output').first().textContent()
  await manualRetry.click()
  await expect(panel.locator('.run-status')).toHaveText('complete', { timeout: 8_000 })
  await expect(panel.locator('[data-status="complete"] .step-output').first()).toHaveText(completedOutput || '')
})

test('viewer retains the active scan context and can pause without losing filters', async ({ page }) => {
  await page.goto('/')
  const designSystem = page.locator('.repository-row').filter({ hasText: 'Design system' })
  await designSystem.getByRole('button', { name: 'Scan now' }).click()

  const tree = page.locator('.tree-panel')
  await tree.locator('label[for="filter-AGENTS.md"]').click()
  const otherRepositoryDocument = tree.locator('.document-row').filter({ hasText: 'agent-toolkit' }).first()
  await otherRepositoryDocument.locator('.document-open').click()

  const context = page.locator('.active-scan-context')
  await expect(context).toContainText('Active scan · Design system')
  await context.getByRole('button', { name: 'Pause scan' }).click()
  await expect(context).toContainText('paused')
  await expect(page.locator('#scan-panel')).toContainText('Scan run · Design system')

  await page.getByRole('button', { name: 'Back to document tree' }).click()
  await expect(tree.locator('[id="filter-AGENTS.md"]')).toBeChecked()
  await expect(tree.locator('.document-group')).toHaveCount(1)
})

test('dialogs restore focus and copy confirmation is announced', async ({ page }) => {
  await page.goto('/')

  const add = page.getByRole('button', { name: 'Add repository' }).first()
  await add.click()
  await expect(page.getByRole('dialog', { name: 'Repository scanner' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(add).toBeFocused()

  const exportButton = page.getByRole('button', { name: 'Export scan index' })
  await exportButton.click()
  await expect(page.getByRole('dialog', { name: 'Live scan package' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(exportButton).toBeFocused()

  const paletteButton = page.getByRole('button', { name: /Command palette/ })
  await paletteButton.click()
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(paletteButton).toBeFocused()

  const firstDocument = page.locator('.document-row .document-open').first()
  await firstDocument.click()
  await page.locator('.viewer-toolbar').getByRole('button', { name: 'Copy' }).click()
  await expect(page.locator('.viewer-toolbar [role="status"]')).toContainText('File content copied')
})

test('layout is side by side at 1024 and stacked immediately below', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 })
  await page.goto('/')
  const columnsAt1024 = await page.locator('.workspace-grid').evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length)
  expect(columnsAt1024).toBe(2)

  await page.setViewportSize({ width: 1023, height: 768 })
  const columnsBelow = await page.locator('.workspace-grid').evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length)
  expect(columnsBelow).toBe(1)
})

test('add validation names Path and undo/redo boundaries stay coherent', async ({ page }) => {
  await page.goto('/')
  const initialRows = await page.locator('.repository-row').count()
  await page.getByRole('button', { name: 'Add repository' }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Repository scanner' })
  const path = dialog.getByLabel('Local path')
  await path.fill(' '.repeat(4))
  await expect(dialog).toContainText('Path must not be empty or whitespace only')
  await path.fill('x'.repeat(261))
  await expect(dialog).toContainText('Path must be 260 characters or fewer')
  await path.fill('/workspace/regression-suite')
  await dialog.getByLabel('Display name (optional)').fill('Regression suite')
  await dialog.getByRole('button', { name: 'Add repository' }).click()
  await expect(page.locator('.repository-row')).toHaveCount(initialRows + 1)

  const undo = page.getByRole('button', { name: 'Undo' })
  const redo = page.getByRole('button', { name: 'Redo' })
  await undo.click()
  await expect(page.locator('.repository-row')).toHaveCount(initialRows)
  await redo.click()
  await expect(page.locator('.repository-row')).toHaveCount(initialRows + 1)
  await expect(redo).toBeDisabled()
})

test('downloaded Scan Index JSON round-trips through the real file importer', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Export scan index' }).click()
  const exportDialog = page.getByRole('dialog', { name: 'Live scan package' })
  const downloadPromise = page.waitForEvent('download')
  await exportDialog.getByRole('button', { name: 'Download' }).click()
  const download = await downloadPromise
  const downloadPath = await download.path()
  expect(downloadPath).not.toBeNull()
  const payload = JSON.parse(await readFile(downloadPath!, 'utf8'))
  expect(payload.schemaVersion).toBe('repo-scan-index/v1')
  expect(payload.repositories).toHaveLength(3)
  await page.keyboard.press('Escape')

  const readmeToggle = page.locator('[id="pattern-readme"]')
  await page.locator('label[for="pattern-readme"]').click()
  await expect(readmeToggle).not.toBeChecked()

  await page.getByRole('button', { name: 'Import scan index' }).click()
  const importDialog = page.getByRole('dialog', { name: 'Replace the current in-memory session' })
  await importDialog.locator('input[type="file"]').setInputFiles(downloadPath!)
  await importDialog.getByRole('button', { name: 'Import scan index' }).click()
  await expect(importDialog).not.toBeVisible({ timeout: 4_000 })
  await expect(readmeToggle).toBeChecked()
  await expect(page.locator('.repository-row')).toHaveCount(3)
})

test('innovation criteria expose a live, derived guidance topology', async ({ page }) => {
  test.setTimeout(30_000)
  await page.goto('/')
  const topology = page.getByRole('region', { name: 'Guidance topology' })
  await expect(topology).toBeVisible()
  await expect(topology.getByRole('button')).toHaveCount(3)
  await expect(topology).toContainText('Design system')
  await expect(topology).toContainText('4/4')
  await expect(topology.getByText('2 indexed')).toHaveCount(4)

  await topology.getByRole('button', { name: 'Product catalog' }).click()
  await expect(topology).toContainText('Active fingerprint')
  await expect(topology).toContainText('Product catalog')
  await expect(topology).toContainText(/risk index \d+/)
  await expect(topology).toContainText('Next best action')

  await page.locator('label[for="pattern-readme"]').click()
  await page.locator('#repository-repo-2').getByRole('button', { name: 'Scan now' }).click()
  await expect.poll(async () => topology.getByText('Coverage gap').count(), { timeout: 15_000 }).toBe(1)
  await expect(topology).toContainText('3/4')
  await expect(topology).toContainText('Restore README files coverage')
})
