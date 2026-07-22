import { expect, test } from '@playwright/test'
import { addFinding, boot, exportJson, exportText, openExport, openSubmission, overrideFirstFinding, queueRows, selectQueueRows, submissionFromPackage, titles } from './helpers.js'

test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

test('14.1 multi_facet_round_trip', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.empty)
  await addFinding(page)
  await page.getByRole('button', { name: 'Queue', exact: true }).click()
  await page.getByLabel('Filter by stage').selectOption('submitted')
  await page.reload()
  await expect(queueRows(page)).toHaveCount(12)
  await expect(page.getByLabel('Filter by stage')).toHaveValue('')
  await expect(page.getByRole('button', { name: 'Undo last action' })).toBeDisabled()
  await openExport(page)
  expect(submissionFromPackage(await exportJson(page), titles.empty).findings).toHaveLength(0)
})

test('14.2 sort_reversal_proves_live_data', async ({ page }) => {
  await boot(page)
  const order = () => queueRows(page).evaluateAll((rows) => rows.map((row) => row.getAttribute('aria-label')))
  await page.getByLabel('Sort by open finding count').selectOption('asc')
  const ascending = await order()
  await page.getByLabel('Sort by open finding count').selectOption('desc')
  expect(await order()).toEqual([...ascending].reverse())
})

test('14.3 derived_view_responds_to_input', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.empty)
  const profile = await page.locator('.profile-row').allTextContents()
  await page.getByRole('button', { name: 'Early' }).click()
  expect(await page.locator('.profile-row').allTextContents()).not.toEqual(profile)
  await addFinding(page)
  await openExport(page)
  expect(submissionFromPackage(await exportJson(page), titles.empty).gate_status).toBe('failed')
})

test('14.4 cross_view_echo_without_reload', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.major)
  await page.getByRole('button', { name: 'Request revision' }).click()
  const dialog = page.getByRole('dialog', { name: 'Request revision' })
  await dialog.getByLabel('Summary').fill('Cross-view revision timeline summary.')
  await dialog.getByRole('button', { name: 'Request revision' }).click()
  await openExport(page)
  const item = submissionFromPackage(await exportJson(page), titles.major)
  expect(item.stage).toBe('needs-revision')
  expect(item.history[0]).toMatchObject({ type: 'revision-requested', summary: 'Cross-view revision timeline summary.' })
})

test('14.5 count_delta_is_exact', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.empty)
  await addFinding(page, { tier: 'blocker' })
  await openExport(page)
  expect(submissionFromPackage(await exportJson(page), titles.empty).open_finding_counts.blocker).toBe(1)
})

test('14.6 different_inputs_change_outcomes', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.empty)
  await addFinding(page, { tier: 'blocker', category: 'correctness', description: 'Blocker correctness outcome' })
  await addFinding(page, { tier: 'minor', category: 'tooling', description: 'Minor tooling outcome' })
  await openExport(page)
  const findings = submissionFromPackage(await exportJson(page), titles.empty).findings
  expect(findings.map(({ tier, category }) => ({ tier, category }))).toEqual([{ tier: 'minor', category: 'tooling' }, { tier: 'blocker', category: 'correctness' }])
})

test('14.7 interleaved_flows_preserve_state', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.empty)
  await page.getByRole('button', { name: 'Add finding' }).first().click()
  const findingDialog = page.getByRole('dialog', { name: 'Add finding' })
  await findingDialog.getByLabel('Tier').selectOption('minor')
  await findingDialog.getByLabel('Category').selectOption('tooling')
  await findingDialog.getByLabel('Description').fill('Interleaved draft remains isolated')

  await page.keyboard.press('Control+k')
  const palette = page.getByRole('dialog', { name: 'Command palette' })
  await palette.getByLabel('Search commands').fill(titles.major)
  await palette.getByRole('option', { name: new RegExp(titles.major) }).click()
  await expect(page.getByRole('heading', { name: titles.major })).toBeVisible()
  await page.getByRole('button', { name: 'Request revision' }).click()
  const revisionDialog = page.getByRole('dialog', { name: 'Request revision' })
  await revisionDialog.getByLabel('Summary').fill('Interleaved revision remains isolated from the draft.')
  await revisionDialog.getByRole('button', { name: 'Request revision' }).click()

  await page.keyboard.press('Control+k')
  await palette.getByLabel('Search commands').fill(titles.empty)
  await palette.getByRole('option', { name: new RegExp(titles.empty) }).click()
  await page.getByRole('button', { name: 'Add finding' }).first().click()
  await expect(findingDialog.getByLabel('Tier')).toHaveValue('minor')
  await expect(findingDialog.getByLabel('Category')).toHaveValue('tooling')
  await expect(findingDialog.getByLabel('Description')).toHaveValue('Interleaved draft remains isolated')
  await findingDialog.getByRole('button', { name: 'Add finding' }).click()

  await openExport(page)
  const pkg = await exportJson(page)
  expect(submissionFromPackage(pkg, titles.empty).findings[0]).toMatchObject({
    tier: 'minor', category: 'tooling', description: 'Interleaved draft remains isolated',
  })
  expect(submissionFromPackage(pkg, titles.major).stage).toBe('needs-revision')
})

test('14.8 empty_to_repopulated_round_trip', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.revision)
  await overrideFirstFinding(page)
  await expect(page.getByRole('heading', { name: 'Gate passed' })).toBeVisible()
  await addFinding(page, { tier: 'blocker' })
  await expect(page.getByRole('heading', { name: 'Gate failed' })).toBeVisible()
})

test('14.9 mutate_export_pipeline', async ({ page }) => {
  await boot(page)
  await selectQueueRows(page, [titles.empty, titles.blocker])
  await page.getByRole('button', { name: 'Hold payout' }).click()
  await openExport(page)
  const mutated = await exportText(page)
  await page.getByRole('button', { name: 'Copy export' }).click()
  await expect(page.getByRole('button', { name: 'Copied!' })).toBeVisible()
  await page.getByRole('button', { name: 'Undo last action' }).click()
  expect(await exportText(page)).not.toBe(mutated)
})
