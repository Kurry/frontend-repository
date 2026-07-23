import { expect, test as base, type Page } from '@playwright/test'

type Diagnostics = { errors: string[]; warnings: string[]; pageErrors: string[] }

export const test = base.extend<{ diagnostics: Diagnostics }>({
  diagnostics: [async ({ page }, use) => {
    const diagnostics: Diagnostics = { errors: [], warnings: [], pageErrors: [] }
    page.on('console', (message) => {
      if (message.type() === 'error') diagnostics.errors.push(message.text())
      if (message.type() === 'warning') diagnostics.warnings.push(message.text())
    })
    page.on('pageerror', (error) => diagnostics.pageErrors.push(error.message))
    await use(diagnostics)
    expect(diagnostics.errors, 'console errors').toEqual([])
    expect(diagnostics.pageErrors, 'uncaught page errors').toEqual([])
  }, { auto: true }],
})

export { expect }

export const STAGES = ['Source', 'Build', 'Test Generation', 'Hardening', 'Publish'] as const

export async function loadApp(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Recorded runs' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open run RUN-2407-A91' })).toHaveAttribute('aria-pressed', 'true')
}

export function gateRow(page: Page, gateId = 'TST-328') {
  return page.locator('.gate-row').filter({ has: page.getByText(gateId, { exact: true }) })
}

export function stageButton(page: Page, name: typeof STAGES[number], status?: string) {
  const stages = page.locator('.detail-canvas .stage-strip .stage-segment')
  return status
    ? page.locator(`.detail-canvas .stage-strip .stage-segment[aria-label*="${name}: ${status}"]`)
    : stages.filter({ hasText: name })
}

export function chainButton(page: Page, name: typeof STAGES[number]) {
  return page.getByLabel('Five-stage certificate chain').getByRole('button').filter({ hasText: name })
}

export async function expandGate(page: Page, gateId = 'TST-328') {
  const row = gateRow(page, gateId)
  const disclosure = row.locator('.gate-disclosure')
  if (await disclosure.getAttribute('aria-expanded') !== 'true') await disclosure.click()
  await expect(disclosure).toHaveAttribute('aria-expanded', 'true')
  return row
}

export async function addNote(page: Page, text: string, category = 'observation', gateId = 'TST-328') {
  await page.locator(`[data-add-note="${gateId}"]`).click()
  const dialog = page.getByRole('dialog', { name: 'Add gate note' })
  await dialog.getByLabel('Text Required').fill(text)
  await dialog.getByLabel('Category Required').selectOption(category)
  await dialog.getByRole('button', { name: 'Attach note' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(gateRow(page, gateId)).toContainText(text)
}

export async function openExport(page: Page) {
  await page.getByRole('button', { name: 'Export acceptance package' }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Export acceptance package' })
  await expect(dialog).toBeVisible()
  return dialog
}

export async function exportPackage(page: Page) {
  const dialog = await openExport(page)
  await dialog.getByRole('tab', { name: 'Acceptance Package JSON' }).click()
  return JSON.parse(await dialog.getByLabel('json export preview').innerText())
}

export async function closeDialog(page: Page, label: 'export' | 'import' | 'certificate') {
  await page.getByRole('button', { name: `Close ${label}` }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
}

export async function importPackage(page: Page, payload: unknown) {
  await page.getByRole('button', { name: 'Import acceptance package' }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Import acceptance package' })
  await dialog.getByLabel('Acceptance Package JSON Required').fill(JSON.stringify(payload))
  await dialog.getByRole('button', { name: 'Import package' }).click()
  await expect(dialog).toHaveCount(0)
}

export async function startRerun(page: Page) {
  await page.getByRole('button', { name: 'Start re-run' }).click()
  await expect(page.getByText('Re-run in progress')).toBeVisible()
  await expect(page.getByText(/re-run passed|re-run rejected/).last()).toBeVisible({ timeout: 10_000 })
}

export async function openRegistry(page: Page) {
  await page.getByRole('button', { name: 'Gate registry' }).click()
  await expect(page.getByRole('heading', { name: 'Gate registry' })).toBeVisible()
}

export async function expectNoPageOverflow(page: Page) {
  const width = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
  expect(width.scroll).toBeLessThanOrEqual(width.client)
}
