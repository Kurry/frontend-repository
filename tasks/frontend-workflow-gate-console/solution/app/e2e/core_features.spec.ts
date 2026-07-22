/* NOT-AUTOMATABLE: none; every core contract has a browser-observable probe. */
import { addNote, chainButton, closeDialog, expandGate, exportPackage, gateRow, loadApp, openExport, openRegistry, stageButton, startRerun, STAGES, test, expect } from './helpers'

test.beforeEach(async ({ page }) => loadApp(page))

test('1.1 seeded_runs_and_stage_strip', async ({ page }) => {
  const runs = page.locator('.run-card')
  await expect(runs).toHaveCount(6)
  for (let i = 0; i < 6; i += 1) {
    await expect(runs.nth(i).locator('code').first()).not.toBeEmpty()
    await expect(runs.nth(i)).toContainText('Submitted')
    await expect(runs.nth(i).locator('.stage-segment')).toHaveCount(5)
  }
  await expect(page.getByLabel('Status color legend')).toContainText(/passed.*rejected.*running.*pending/i)
  await expect(page.locator('.run-card .status-rejected').first()).toBeVisible()
  await expect(page.locator('.run-card .status-pending').first()).toBeVisible()
})

test('1.2 run_selection_opens_detail', async ({ page }) => {
  const url = page.url()
  const run = page.getByRole('button', { name: 'Open run RUN-2407-B04' })
  await run.click()
  await expect(run).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.run-detail-head')).toContainText('RUN-2407-B04')
  expect(page.url()).toBe(url)
})

test('1.3 stage_gate_checklist_anatomy', async ({ page }) => {
  const rows = page.locator('.gate-row')
  expect(await rows.count()).toBeGreaterThanOrEqual(6)
  expect(await rows.count()).toBeLessThanOrEqual(10)
  await expect(rows.first().locator('code')).not.toBeEmpty()
  await expect(rows.first().locator('.severity')).toHaveText(/S[123]/)
  await expect(rows.first().locator('.gate-state')).toContainText(/Pass|Fail/)
  const a = rows.nth(0).locator('.gate-disclosure'); const b = rows.nth(1).locator('.gate-disclosure')
  await a.click(); await b.click()
  await expect(a).toHaveAttribute('aria-expanded', 'true'); await expect(b).toHaveAttribute('aria-expanded', 'true')
  await a.click(); await expect(a).toHaveAttribute('aria-expanded', 'false')
})

test('1.4 failed_hard_gate_rejects_stage', async ({ page }) => {
  await page.getByRole('button', { name: 'Open run RUN-2407-D12' }).click()
  await stageButton(page, 'Hardening', 'rejected').click()
  await expect(page.getByRole('alert')).toContainText('HRD-442 · Network isolation')
  await expect(page.locator('.stage-status')).toContainText('rejected')
})

test('1.5 aggregation_mode_and_outcome', async ({ page }) => {
  await expect(page.locator('.stage-subtitle')).toContainText('weighted-mean')
  await expect(page.locator('.suite-outcome')).toContainText(/FAIL.*\d+\.\d%/)
  await stageButton(page, 'Source', 'passed').click()
  await expect(page.locator('.stage-subtitle')).toContainText('required-pass')
  await expect(page.locator('.suite-outcome')).toContainText('PASS')
})

test('1.6 whatif_flip_recomputes_live', async ({ page }) => {
  const before = await page.locator('.suite-outcome .score').innerText()
  await page.getByRole('switch', { name: 'What-if mode' }).check()
  await page.getByRole('button', { name: /TST-328 Fail; flip simulated state/ }).click()
  await expect(gateRow(page, 'TST-328')).toContainText('Simulated')
  await expect(page.locator('.suite-outcome')).toContainText('PASS')
  await expect(page.locator('.suite-outcome .score')).not.toHaveText(before)
  await expect(page.locator('.stage-status')).toContainText('passed')
})

test('1.7 whatif_revert_restores_recorded', async ({ page }) => {
  await page.getByRole('switch', { name: 'What-if mode' }).check()
  await page.getByRole('button', { name: /TST-328 Fail; flip simulated state/ }).click()
  await page.getByRole('button', { name: 'Revert' }).click()
  await expect(page.getByText('Simulated', { exact: true })).toHaveCount(0)
  await expect(page.locator('.stage-status')).toContainText('rejected')
  await expect(page.getByRole('button', { name: /TST-328 Fail$/ })).toBeVisible()
})

test('1.8 certificate_view_contents', async ({ page }) => {
  await stageButton(page, 'Source', 'passed').click()
  await page.getByRole('button', { name: 'View certificate' }).click()
  const dialog = page.getByRole('dialog', { name: 'Source' })
  await expect(dialog).toContainText('Issued')
  await expect(dialog.locator('.fingerprint-block code')).toContainText('sha256:')
  await expect(dialog.locator('.certificate-gates > div')).toHaveCount(6)
})

test('1.9 chain_break_renders_distinctly', async ({ page }) => {
  await expect(page.getByLabel('Five-stage certificate chain').getByRole('button')).toHaveCount(5)
  await expect(page.getByLabel('broken or pending link')).toHaveCount(3)
  await expect(chainButton(page, 'Test Generation')).toBeDisabled()
})

test('1.10 copy_fingerprint_with_confirmation', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await stageButton(page, 'Source', 'passed').click()
  await page.getByRole('button', { name: 'View certificate' }).click()
  const hash = await page.locator('.fingerprint-block code').innerText()
  await page.getByRole('button', { name: 'Copy fingerprint' }).click()
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(hash)
  await expect(page.getByRole('button', { name: 'Copy fingerprint' })).toBeVisible({ timeout: 3_000 })
})

test('1.11 registry_lists_and_filters_gates', async ({ page }) => {
  await openRegistry(page)
  const all = await page.getByLabel('Registered gates').getByRole('button').count()
  expect(all).toBeGreaterThan(10)
  await page.getByLabel('Severity filter').selectOption('S1')
  const filtered = page.getByLabel('Registered gates').getByRole('button')
  expect(await filtered.count()).toBeLessThan(all)
  for (const row of await filtered.all()) await expect(row.locator('.severity')).toHaveText('S1')
  await page.getByRole('button', { name: 'Clear filter' }).click()
  await expect(page.getByLabel('Registered gates').getByRole('button')).toHaveCount(all)
})

test('1.12 registry_selection_highlights_stages', async ({ page }) => {
  await openRegistry(page)
  await page.getByLabel('Registered gates').getByRole('button').filter({ hasText: 'SRC-101' }).click()
  await expect(page.locator('.registry-detail')).toContainText('Provenance attestation')
  await expect(page.locator('.stage-membership .included')).toHaveCount(1)
  await expect(page.locator('.stage-membership .included')).toContainText('Source')
})

test('1.13 rerun_ticks_gates_sequentially', async ({ page }) => {
  await page.getByRole('button', { name: 'Start re-run' }).click()
  await expect(page.getByText('Re-run in progress')).toBeVisible()
  await expect(page.locator('.rerun-progress strong')).not.toHaveText('100%')
  await expect(page.locator('.gate-state').filter({ hasText: 'Running' }).first()).toBeVisible()
  await expect(page.getByText(/re-run passed|re-run rejected/).last()).toBeVisible({ timeout: 10_000 })
})

test('1.14 rerun_updates_all_surfaces', async ({ page }) => {
  await startRerun(page)
  await expect(page.locator('.stage-status')).toContainText('passed')
  await expect(stageButton(page, 'Test Generation', 'passed')).toBeVisible()
  await expect(chainButton(page, 'Test Generation')).toBeEnabled()
  await expect(page.locator('.suite-outcome')).toContainText('PASS')
  await expect(page.locator('.timeline-list')).toContainText('Test Generation re-run started')
  await expect(page.locator('.timeline-list')).toContainText('certificate issued')
})

test('1.15 timeline_filter_and_empty_states', async ({ page }) => {
  const filter = page.getByLabel('Filter timeline by entry type')
  await filter.selectOption('note')
  await expect(page.locator('.timeline-list')).toContainText('No notes yet')
  await filter.selectOption('all')
  await expect(page.locator('.timeline-entry').first()).toBeVisible()
  await page.getByRole('button', { name: 'Open run RUN-2407-F63' }).click()
  await expect(page.locator('.timeline-list')).toContainText('No events yet')
})

test('1.16 note_form_validates_and_attaches', async ({ page }) => {
  await page.locator('[data-add-note="TST-328"]').click()
  const dialog = page.getByRole('dialog', { name: 'Add gate note' })
  await expect(dialog.getByText(/text must contain 1 to 200/)).toBeVisible()
  await expect(dialog.getByText(/category is required/)).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Attach note' })).toBeDisabled()
  await dialog.getByLabel('Text Required').fill('core-note-17')
  await dialog.getByLabel('Category Required').selectOption('observation')
  await dialog.getByRole('button', { name: 'Attach note' }).click()
  await expect(gateRow(page, 'TST-328')).toContainText('core-note-17')
  await expect(gateRow(page, 'TST-328')).toContainText('observation')
  await expect(page.locator('.timeline-list')).toContainText('Note added to TST-328')
})

test('1.17 acceptance_package_export_field_contract', async ({ page }) => {
  await addNote(page, 'contract-note-17')
  const payload = await exportPackage(page)
  expect(payload.schemaVersion).toBe('gate-console.acceptance-package.v1')
  expect(Date.parse(payload.exportedAt)).not.toBeNaN(); expect(Date.parse(payload.submittedAt)).not.toBeNaN()
  expect(payload.runId).toBe('RUN-2407-A91')
  expect(payload.stages.map((stage: { name: string }) => stage.name)).toEqual(STAGES)
  for (const stage of payload.stages) {
    expect(['passed', 'rejected', 'running', 'pending']).toContain(stage.status)
    expect(['required-pass', 'all-pass', 'weighted-mean']).toContain(stage.aggregationMode)
    expect(stage.gates.length).toBeGreaterThanOrEqual(6); expect(stage.gates.length).toBeLessThanOrEqual(10)
    expect(stage.status === 'passed' ? stage.certificate : null).toEqual(stage.certificate)
    expect(stage.aggregationMode === 'weighted-mean' ? typeof stage.scorePercent : stage.scorePercent).toBe(stage.aggregationMode === 'weighted-mean' ? 'number' : null)
  }
  expect(JSON.stringify(payload)).toContain('contract-note-17')
})

test('1.18 acceptance_package_copy_and_download', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  const dialog = await openExport(page)
  for (const tab of ['Acceptance Package JSON', 'Certificate Chain Markdown']) {
    await dialog.getByRole('tab', { name: tab }).click()
    const preview = dialog.locator('pre.preview'); const text = await preview.innerText()
    await dialog.getByRole('button', { name: 'Copy' }).click()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(text)
    const download = page.waitForEvent('download'); await dialog.getByRole('button', { name: 'Download' }).click()
    const item = await download; expect(await item.createReadStream()).not.toBeNull()
  }
})

test('1.19 acceptance_package_import_round_trip', async ({ page }) => {
  await addNote(page, 'round-trip-note')
  const payload = await exportPackage(page); await closeDialog(page, 'export')
  await gateRow(page, 'TST-328').getByRole('button', { name: /Remove note 1/ }).click()
  await expect(gateRow(page, 'TST-328')).not.toContainText('round-trip-note')
  await page.getByRole('button', { name: 'Import acceptance package' }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Import acceptance package' })
  await dialog.getByLabel('Acceptance Package JSON Required').fill(JSON.stringify(payload))
  await dialog.getByRole('button', { name: 'Import package' }).click()
  await stageButton(page, 'Test Generation', 'rejected').click()
  await expandGate(page, 'TST-328')
  await expect(gateRow(page, 'TST-328')).toContainText('round-trip-note')
  expect(JSON.stringify(await exportPackage(page))).toContain('round-trip-note')
})
