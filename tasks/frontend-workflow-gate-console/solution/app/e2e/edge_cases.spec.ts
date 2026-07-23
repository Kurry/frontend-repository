/* NOT-AUTOMATABLE: none; all edge states produce deterministic visible evidence. */
import { addNote, closeDialog, exportPackage, loadApp, openExport, stageButton, test, expect } from './helpers'

test.beforeEach(async ({ page }) => loadApp(page))

test('4.1 timeline_and_registry_empty_states', async ({ page }) => {
  await page.getByRole('button', { name: 'Open run RUN-2407-F63' }).click()
  await expect(page.locator('.timeline-list')).toContainText(/No events yet.*Re-runs, rejections, certificates, and gate notes will appear here/s)
  await page.getByRole('button', { name: 'Gate registry' }).click()
  await page.evaluate(() => window.webmcp_invoke_tool('browse_apply_filter', { filter: 'severity', value: 'S1' }))
  await expect(page.locator('.registry-list > button').first()).toBeVisible()
})

test('4.2 gatenote_and_import_validate_inline', async ({ page }) => {
  await page.locator('[data-add-note="TST-328"]').click(); const note = page.getByRole('dialog', { name: 'Add gate note' })
  await expect(note).toContainText('text must contain 1 to 200 trimmed characters'); await expect(note).toContainText('category is required')
  await note.getByRole('button', { name: 'Cancel', exact: true }).click()
  await page.getByRole('button', { name: 'Import acceptance package' }).first().click(); const input = page.getByRole('dialog', { name: 'Import acceptance package' })
  await input.getByLabel('Acceptance Package JSON Required').fill('{bad'); await expect(input.getByRole('alert')).toContainText('payload')
})

test('4.3 field_contract_errors_name_fields', async ({ page }) => {
  await page.locator('[data-add-note="TST-328"]').click(); const dialog = page.getByRole('dialog', { name: 'Add gate note' })
  await dialog.getByLabel('Text Required').fill('x'.repeat(201)); await expect(dialog).toContainText('text must contain 1 to 200')
  await expect(dialog).toContainText('category is required and must match the allowed enum')
})

test('4.4 copy_note_and_import_confirmations', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await addNote(page, 'confirmation-note'); await expect(page.locator('.live-region')).toContainText('Note added to TST-328')
  const payload = await exportPackage(page); await page.getByRole('button', { name: 'Copy' }).click(); await expect(page.locator('.live-region')).toContainText('Preview copied')
  await closeDialog(page, 'export'); await stageButton(page, 'Source', 'passed').click(); await page.getByRole('button', { name: 'View certificate' }).click()
  await page.getByRole('button', { name: 'Copy fingerprint' }).click(); await expect(page.locator('.live-region')).toContainText('Fingerprint copied')
  await closeDialog(page, 'certificate'); await stageButton(page, 'Test Generation', 'rejected').click()
  await page.getByRole('button', { name: 'Import acceptance package' }).first().click(); const dialog = page.getByRole('dialog', { name: 'Import acceptance package' })
  await dialog.getByLabel('Acceptance Package JSON Required').fill(JSON.stringify(payload)); await dialog.getByRole('button', { name: 'Import package' }).click()
  await expect(page.locator('.live-region')).toContainText('Acceptance package imported')
})

test('4.5 rerun_shows_progress_indicator', async ({ page }) => {
  await page.getByRole('button', { name: 'Start re-run' }).click(); await expect(page.locator('.rerun-progress')).toBeVisible()
  const initial = Number((await page.locator('.rerun-progress strong').innerText()).replace('%', ''))
  await expect.poll(async () => Number((await page.locator('.rerun-progress strong').innerText()).replace('%', ''))).toBeGreaterThan(initial)
})

test('4.6 note_cancel_and_whatif_revert', async ({ page }) => {
  const before = await page.locator('.timeline-entry').count(); await page.locator('[data-add-note="TST-328"]').click()
  await page.getByRole('dialog', { name: 'Add gate note' }).getByRole('button', { name: 'Cancel', exact: true }).click(); await expect(page.locator('.timeline-entry')).toHaveCount(before)
  await page.getByRole('switch', { name: 'What-if mode' }).check(); await page.getByRole('button', { name: /TST-328 Fail; flip/ }).click(); await page.getByRole('button', { name: 'Revert' }).click()
  await expect(page.getByRole('button', { name: /TST-328 Fail$/ })).toBeVisible()
})

test('4.7 status_legend_explains_colors', async ({ page }) => {
  const legend = page.getByLabel('Status color legend'); for (const status of ['passed', 'rejected', 'running', 'pending']) await expect(legend).toContainText(status)
})

test('4.8 note_and_export_controls_semantic', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Add note' }).first()).toBeVisible(); await expect(page.getByRole('button', { name: 'Export acceptance package' }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Import acceptance package' }).first()).toBeVisible(); const dialog = await openExport(page)
  await expect(dialog.getByRole('button', { name: 'Copy' })).toBeVisible(); await expect(dialog.getByRole('button', { name: 'Download' })).toBeVisible()
})

test('4.9 note_export_import_dismissible', async ({ page }) => {
  for (const [opener, dialogName] of [['Add note', 'Add gate note'], ['Export acceptance package', 'Export acceptance package'], ['Import acceptance package', 'Import acceptance package']] as const) {
    const button = page.getByRole('button', { name: opener }).first(); await button.focus(); await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog', { name: dialogName })).toBeVisible(); await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0); await expect(button).toBeFocused()
  }
})

test('4.10 rerun_progress_and_export_tabs', async ({ page }) => {
  await page.getByRole('button', { name: 'Start re-run' }).click(); await expect(page.locator('.rerun-progress')).toContainText(/Re-run in progress.*%/)
  await expect(page.locator('.gate-state').filter({ hasText: /Pending|Running/ }).first()).toBeVisible()
  await expect(page.getByText(/re-run passed|re-run rejected/).last()).toBeVisible({ timeout: 10_000 }); const dialog = await openExport(page)
  await expect(dialog.getByRole('tab')).toHaveCount(2)
})

test('4.11 invalid_import_leaves_run_unchanged', async ({ page }) => {
  const before = await page.locator('.stage-segment').evaluateAll((nodes) => nodes.map((n) => n.getAttribute('aria-label')))
  await page.getByRole('button', { name: 'Import acceptance package' }).first().click(); const dialog = page.getByRole('dialog', { name: 'Import acceptance package' })
  await dialog.getByLabel('Acceptance Package JSON Required').fill('{ nope'); await expect(dialog.getByRole('alert')).toContainText('payload')
  await page.keyboard.press('Escape'); expect(await page.locator('.stage-segment').evaluateAll((nodes) => nodes.map((n) => n.getAttribute('aria-label')))).toEqual(before)
})

test('4.12 double_rerun_starts_once', async ({ page }) => {
  await page.getByRole('button', { name: 'Start re-run' }).evaluate((button: HTMLButtonElement) => { button.click(); button.click() })
  await expect(page.getByText(/re-run passed|re-run rejected/).last()).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText('Test Generation re-run started')).toHaveCount(1)
})
