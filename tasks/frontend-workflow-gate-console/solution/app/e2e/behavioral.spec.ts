/* NOT-AUTOMATABLE: none; each behavior is tested through observable state deltas. */
import { addNote, closeDialog, exportPackage, gateRow, loadApp, openRegistry, stageButton, test, expect } from './helpers'

test.beforeEach(async ({ page }) => loadApp(page))

test('14.1 multi_facet_reload_resets_in_memory', async ({ page }) => {
  await addNote(page, 'reload-reset-note')
  await page.getByRole('switch', { name: 'What-if mode' }).check()
  await page.getByRole('button', { name: /TST-328 Fail; flip simulated state/ }).click()
  await page.getByRole('button', { name: 'Switch to dark theme' }).click()
  await page.reload()
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await expect(page.getByText('Simulated', { exact: true })).toHaveCount(0)
  await expect(page.locator('.stage-status')).toContainText('rejected')
  await expect(page.locator('.stage-foot')).toContainText('0 gate notes')
  await expect(page.locator('.run-card')).toHaveCount(6)
})

test('14.2 severity_filter_reversal_proves_live_data', async ({ page }) => {
  await openRegistry(page)
  const filter = page.getByLabel('Severity filter')
  await filter.selectOption('S1'); const s1 = await page.locator('.registry-list > button code').allTextContents()
  await filter.selectOption('S3'); const s3 = await page.locator('.registry-list > button code').allTextContents()
  expect(s1.length).toBeGreaterThan(0); expect(s3.length).toBeGreaterThan(0); expect(s3).not.toEqual(s1)
  await filter.selectOption('all'); expect(await page.locator('.registry-list > button').count()).toBeGreaterThan(s1.length + s3.length)
})

test('14.3 whatif_derived_outcome_responds', async ({ page }) => {
  await page.getByRole('switch', { name: 'What-if mode' }).check()
  await page.getByRole('button', { name: /TST-328 Fail; flip simulated state/ }).click()
  await expect(page.locator('.suite-outcome')).toContainText('PASS')
  await expect(page.locator('.stage-status')).toContainText('passed')
  await page.getByRole('button', { name: 'Revert' }).click()
  await expect(page.locator('.suite-outcome')).toContainText('FAIL')
  await expect(page.locator('.stage-status')).toContainText('rejected')
})

test('14.4 note_echoes_evidence_timeline_and_export', async ({ page }) => {
  await addNote(page, 'echo-note-44')
  await expect(gateRow(page)).toContainText('echo-note-44')
  await expect(page.locator('.timeline-list')).toContainText('Note added to TST-328')
  expect(JSON.stringify(await exportPackage(page))).toContain('echo-note-44')
})

test('14.5 timeline_note_count_delta_exact', async ({ page }) => {
  const before = await page.locator('.timeline-entry').count()
  await addNote(page, 'one-count-delta')
  await expect(page.locator('.timeline-entry')).toHaveCount(before + 1)
})

test('14.6 different_notes_change_export', async ({ page }) => {
  await addNote(page, 'first-distinct-note'); const first = await exportPackage(page); await closeDialog(page, 'export')
  await addNote(page, 'second-distinct-note'); const second = await exportPackage(page)
  expect(JSON.stringify(first)).toContain('first-distinct-note'); expect(JSON.stringify(first)).not.toContain('second-distinct-note')
  expect(JSON.stringify(second)).toContain('first-distinct-note'); expect(JSON.stringify(second)).toContain('second-distinct-note')
})

test('14.7 interleaved_whatif_and_note_preserve_state', async ({ page }) => {
  await page.getByRole('switch', { name: 'What-if mode' }).check()
  await page.getByRole('button', { name: /TST-328 Fail; flip simulated state/ }).click()
  await addNote(page, 'interleaved-note', 'follow-up', 'TST-301')
  await page.getByRole('button', { name: 'Revert' }).click()
  await expect(gateRow(page, 'TST-301')).toContainText('interleaved-note')
  await expect(page.getByRole('button', { name: /TST-328 Fail$/ })).toBeVisible()
})

test('14.8 export_import_round_trip_restores_notes', async ({ page }) => {
  await addNote(page, 'behavior-roundtrip'); const payload = await exportPackage(page); await closeDialog(page, 'export')
  await gateRow(page).getByRole('button', { name: /Remove note 1/ }).click()
  await page.getByRole('button', { name: 'Import acceptance package' }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Import acceptance package' })
  await dialog.getByLabel('Acceptance Package JSON Required').fill(JSON.stringify(payload)); await dialog.getByRole('button', { name: 'Import package' }).click()
  await stageButton(page, 'Test Generation', 'rejected').click(); await gateRow(page).locator('.gate-disclosure').click()
  await expect(gateRow(page)).toContainText('behavior-roundtrip')
  expect(JSON.stringify(await exportPackage(page))).toContain('behavior-roundtrip')
})
