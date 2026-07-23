import { expect, test } from '@playwright/test'
import { addFinding, boot, exportJson, moveEmptySubmissionToReview, openExport, openSubmission, overrideFirstFinding, queueRow, requestRevision, selectQueueRows, submissionFromPackage, titles } from './helpers.js'

test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

test('6.1 triage_end_to_end_flow', async ({ page }) => {
  await boot(page)
  await moveEmptySubmissionToReview(page)
  await addFinding(page)
  await expect(page.getByRole('heading', { name: 'Gate failed' })).toBeVisible()
  await overrideFirstFinding(page, 'This blocker has a documented exception.')
  await expect(page.getByRole('heading', { name: 'Gate passed' })).toBeVisible()
  await page.getByRole('button', { name: 'Back to queue' }).click()
  await expect(queueRow(page, titles.empty)).toContainText(/Zero open/i)
})

test('6.2 revision_loop_flow', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.major)
  await addFinding(page, { tier: 'major', category: 'rubric-alignment' })
  await requestRevision(page)
  await expect(page.locator('.detail-meta')).toContainText('needs revision')
  await page.getByRole('button', { name: 'Mara Voss' }).click()
  await expect(page.getByRole('dialog')).toContainText('Please revise the documented scoring boundary.')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Mark revised' }).click()
  await expect(page.locator('.detail-meta')).toContainText('in review')
})

test('6.3 approval_gate_flow', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.blocker)
  await expect(page.getByRole('button', { name: 'Approve' })).toBeDisabled()
  await overrideFirstFinding(page)
  await page.getByRole('button', { name: 'Approve' }).click()
  await page.getByRole('dialog', { name: 'Approve submission' }).getByRole('button', { name: 'Confirm approval' }).click()
  await expect(page.locator('.detail-meta')).toContainText(/approved.*released/i)
})

test('6.4 profile_sensitivity_flow', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.blocker)
  const before = await page.locator('.profile-row').allTextContents()
  await page.getByRole('button', { name: 'Recent' }).click()
  expect(await page.locator('.profile-row').allTextContents()).not.toEqual(before)
  await page.getByRole('button', { name: 'All' }).click()
  expect(await page.locator('.profile-row').allTextContents()).toEqual(before)
})

test('6.5 bulk_hold_and_export_flow', async ({ page }) => {
  await boot(page)
  await selectQueueRows(page, [titles.empty, titles.blocker])
  await page.getByRole('button', { name: 'Hold payout' }).click()
  await openExport(page)
  const pkg = await exportJson(page)
  expect(submissionFromPackage(pkg, titles.empty).payout_state).toBe('held')
  expect(submissionFromPackage(pkg, titles.blocker).payout_state).toBe('held')
  await page.getByRole('button', { name: 'Copy export' }).click()
  await expect(page.getByRole('button', { name: 'Copied!' })).toBeVisible()
})

test('6.6 undo_after_mutation_flow', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.empty)
  await addFinding(page, { description: 'Undo flow unique finding' })
  await openExport(page)
  await expect(page.locator('.code-window')).toContainText('Undo flow unique finding')
  await page.getByRole('button', { name: 'Undo last action' }).click()
  await expect(page.locator('.code-window')).not.toContainText('Undo flow unique finding')
})

test('6.7 filters_update_all_surfaces', async ({ page }) => {
  await boot(page)
  await page.getByLabel('Filter by stage').selectOption('approved')
  await expect(page.locator('.table-summary')).toContainText('Showing 3 of 12')
  await page.getByLabel('Filter by finding tier').selectOption('blocker')
  await expect(page.getByText('No submissions match')).toBeVisible()
  await page.getByRole('button', { name: 'Clear all filters' }).click()
  await expect(page.locator('.table-summary')).toContainText('Showing 12 of 12')
})

test('6.8 drawer_and_palette_support_flows', async ({ page }) => {
  await boot(page)
  const opener = page.getByRole('button', { name: 'Mara Voss' }).first()
  await opener.click()
  await page.keyboard.press('Escape')
  await expect(opener).toBeFocused()
  await page.keyboard.press('Control+k')
  await page.getByRole('searchbox', { name: 'Search commands' }).fill('export')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'QC package export' })).toBeVisible()
})

test('6.9 finding_revision_override_approve_overlays', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.blocker)
  for (const [button, dialogName] of [['Add finding', 'Add finding'], ['Request revision', 'Request revision'], ['Override', 'Override finding']]) {
    await page.getByRole('button', { name: button }).first().click()
    await expect(page.getByRole('dialog', { name: dialogName })).toBeVisible()
    await page.getByRole('button', { name: 'Cancel' }).click()
  }
})

test('6.10 flow_recovers_without_reload', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.major)
  await page.getByRole('button', { name: 'Request revision' }).click()
  const dialog = page.getByRole('dialog', { name: 'Request revision' })
  await dialog.getByLabel('Summary').fill('short')
  await expect(dialog.getByRole('button', { name: 'Request revision' })).toBeDisabled()
  await dialog.getByLabel('Summary').fill('Corrected summary now exceeds twenty characters.')
  await dialog.getByRole('button', { name: 'Request revision' }).click()
  await expect(page.locator('.detail-meta')).toContainText('needs revision')
})
