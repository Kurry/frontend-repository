import { expect, test as base, type Locator, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'

export const test = base.extend({
  page: async ({ page }, use) => {
    const browserProblems: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') {
        browserProblems.push(`${message.type()}: ${message.text()}`)
      }
    })
    page.on('pageerror', (error) => browserProblems.push(`pageerror: ${error.message}`))
    await use(page)
    expect(browserProblems, 'no console errors, warnings, or page errors').toEqual([])
  },
})

export { expect }

export const stageNames = ['Fetch', 'Evaluate', 'Skeleton', 'Generate', 'Validate'] as const
export const verdicts = ['good-success', 'bad-success', 'good-failure', 'bad-failure', 'infrastructure-error'] as const

export async function gotoApp(page: Page) {
  await page.goto('/')
  const onboarding = page.getByRole('dialog', { name: 'Factory onboarding' })
  if (await onboarding.isVisible()) await onboarding.getByRole('button', { name: 'Skip' }).click()
}

export async function openRepository(page: Page, repository = 'quartz-orm') {
  await gotoApp(page)
  await page.getByRole('button', { name: `Open ${repository} pipeline` }).click()
  await expect(page.getByRole('heading', { name: repository, exact: true })).toBeVisible()
}

export async function openTask(page: Page, pullRequestNumber = 184, repository = 'quartz-orm') {
  await openRepository(page, repository)
  await page.getByRole('button', { name: new RegExp(`^Open pull request ${pullRequestNumber},`) }).click()
  await expect(page.getByText(`Pull request #${pullRequestNumber}`, { exact: true })).toBeVisible()
}

export async function openCreateDialog(page: Page) {
  const opener = page.getByRole('button', { name: 'Create task', exact: true }).first()
  await opener.click()
  const dialog = page.getByRole('dialog', { name: 'Create benchmark task' })
  await expect(dialog).toBeVisible()
  return { dialog, opener }
}

async function chooseRepository(page: Page, dialog: Locator, repository: string) {
  const trigger = dialog.getByRole('combobox', { name: 'Repository' })
  if ((await trigger.textContent())?.trim() === repository) return
  await trigger.click()
  await page.getByRole('option', { name: repository, exact: true }).click()
}

export async function fillCreateForm(
  page: Page,
  values: { repository?: string; pullRequestNumber?: string; minFiles?: string; maxFiles?: string } = {},
) {
  const dialog = page.getByRole('dialog', { name: 'Create benchmark task' })
  const repository = values.repository ?? 'quartz-orm'
  await chooseRepository(page, dialog, repository)
  if (values.pullRequestNumber !== undefined) await dialog.getByLabel('Pull-request number').fill(values.pullRequestNumber)
  if (values.minFiles !== undefined) await dialog.getByLabel('Minimum file bound').fill(values.minFiles)
  if (values.maxFiles !== undefined) await dialog.getByLabel('Maximum file bound').fill(values.maxFiles)
  return dialog
}

export async function submitRun(
  page: Page,
  values: { repository?: string; pullRequestNumber: string; minFiles?: string; maxFiles?: string },
) {
  await openCreateDialog(page)
  const dialog = await fillCreateForm(page, {
    minFiles: '2',
    maxFiles: '20',
    ...values,
  })
  await dialog.getByRole('button', { name: 'Start pipeline run' }).click()
  const row = page.getByRole('button', { name: new RegExp(`^Open pull request ${values.pullRequestNumber},`) })
  await expect(row).toBeVisible()
  return row
}

export async function waitForAcceptedRun(page: Page, pullRequestNumber: string) {
  // The simulated five-stage pipeline takes about 6.3s at idle. Allow CI CPU
  // contention without weakening the accepted-run and manifest assertions.
  await expect(page.getByText(`Pull request #${pullRequestNumber}`, { exact: true })).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText('Accepted', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Task manifest' })).toBeVisible()
}

export async function readManifest(page: Page) {
  return JSON.parse((await page.locator('[data-manifest-text]').textContent()) ?? '{}')
}

export function expectManifestContract(
  manifest: Record<string, any>,
  request?: { repository: string; pullRequestNumber: number; minFiles: number; maxFiles: number },
) {
  expect(manifest.schemaVersion).toBe(1)
  expect(manifest.id).toEqual(expect.any(String))
  expect(manifest.id.length).toBeGreaterThan(0)
  if (request) expect(manifest).toMatchObject(request)
  expect(manifest.checks).toEqual({ skeleton: true, validate: true })
  expect(manifest.stages).toHaveLength(5)
  expect(manifest.stages.map((stage: any) => stage.name)).toEqual(stageNames)
  for (const stage of manifest.stages) {
    expect(['pending', 'running', 'complete', 'failed']).toContain(stage.status)
    expect(Number.isInteger(stage.attemptCount)).toBe(true)
    expect(stage.attemptCount).toBeGreaterThanOrEqual(1)
  }
  expect(manifest.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/)
}

export async function downloadJson(page: Page, buttonName: string | RegExp) {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: buttonName }).click(),
  ])
  const path = await download.path()
  expect(path).not.toBeNull()
  return JSON.parse(await readFile(path!, 'utf8'))
}

export function pipelineRows(page: Page) {
  return page.locator('.pipeline-row:visible')
}

export async function repositoryMetrics(page: Page, repository = 'quartz-orm') {
  const card = page.locator('.repo-card').filter({ has: page.getByRole('heading', { name: repository, exact: true }) })
  const values = await card.locator('.repo-metric strong').allTextContents()
  const [tasks, yieldPercent] = values[2].split('·').map((value) => Number.parseInt(value, 10))
  return { language: values[0].trim(), processed: Number(values[1]), tasks, yieldPercent }
}
