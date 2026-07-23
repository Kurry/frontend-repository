import { expect, test } from '@playwright/test'
import { addFinding, boot, exportText, openExport, openSubmission, queueRow, queueRows, titles } from './helpers.js'

test('4.1 empty_findings_and_filter_states', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.empty)
  await expect(page.getByText('No findings recorded')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Add first finding' })).toBeVisible()
  await page.getByRole('button', { name: 'Back to queue' }).click()
  await page.getByLabel('Filter by stage').selectOption('approved')
  await page.getByLabel('Filter by finding tier').selectOption('blocker')
  await expect(page.getByText('No submissions match')).toBeVisible()
})

test('4.2 forms_validate_inline', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.blocker)
  await page.getByRole('button', { name: 'Add finding' }).first().click()
  const add = page.getByRole('dialog', { name: 'Add finding' })
  expect(await add.getByLabel('Category').locator('option').allTextContents()).toEqual(['Select closed category', 'Correctness', 'Instruction clarity', 'Rubric alignment', 'Environment', 'Scoring', 'Tooling'])
  await expect(add.getByRole('button', { name: 'Add finding' })).toBeDisabled()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Request revision' }).click()
  await page.getByRole('dialog', { name: 'Request revision' }).getByLabel('Summary').fill('short')
  await expect(page.getByText('Summary must be at least 20 characters.')).toBeVisible()
})

test('4.3 errors_are_actionable', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.blocker)
  await expect(page.getByRole('status').filter({ hasText: /Approval unavailable.*open blocker/ })).toBeVisible()
  await page.getByRole('button', { name: 'Add finding' }).first().click()
  await expect(page.getByText('Description must be at least 10 characters.')).toBeVisible()
})

test('4.4 actions_show_confirmation', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.empty)
  await addFinding(page)
  await expect(page.getByRole('status').filter({ hasText: 'Finding added to the review record' }).first()).toBeVisible()
})

test('4.5 async_work_shows_loading_state', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.blocker)
  await page.getByRole('button', { name: 'Run re-check' }).click()
  await expect(page.getByRole('button', { name: /Running/ })).toBeVisible()
  await expect(page.locator('.recheck-steps li')).toHaveCount(4)
})

test('4.6 undo_cancel_on_destructive_paths', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.empty)
  await page.getByRole('button', { name: 'Add finding' }).first().click()
  await page.getByRole('dialog', { name: 'Add finding' }).getByLabel('Description').fill('Unsubmitted draft finding')
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.locator('.finding-card')).toHaveCount(0)
})

test('4.7 approve_wrong_stage_explanation', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.empty)
  await expect(page.getByRole('button', { name: 'Approve' })).toBeDisabled()
  await expect(page.getByRole('status').filter({ hasText: /wrong stage/ })).toBeVisible()
})

test('4.8 double_submit_adds_one_finding', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.empty)
  await page.getByRole('button', { name: 'Add finding' }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Add finding' })
  await dialog.getByLabel('Tier').selectOption('minor')
  await dialog.getByLabel('Category').selectOption('tooling')
  await dialog.getByLabel('Description').fill('Exactly one finding is expected')
  const submit = dialog.getByRole('button', { name: 'Add finding' })
  await submit.dblclick()
  await expect(page.locator('.finding-card')).toHaveCount(1)
})

test('4.9 modal_supports_close_paths', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.empty)
  await page.getByRole('button', { name: 'Add finding' }).first().click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Add finding' })).toBeHidden()
  await page.keyboard.press('Control+k')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeHidden()
})

test('4.10 bulk_skips_non_submitted_and_export_baseline', async ({ page }) => {
  await boot(page)
  await openExport(page)
  const baseline = await exportText(page)
  const baselinePackage = JSON.parse(baseline)
  expect(baselinePackage.submissions).toHaveLength(12)
  expect(baselinePackage.submissions.every((submission) => submission.id && submission.stage && Array.isArray(submission.findings))).toBe(true)
  await page.getByRole('button', { name: 'Queue' }).click()
  await page.getByRole('checkbox', { name: `Select ${titles.empty}` }).check()
  await page.getByRole('checkbox', { name: `Select ${titles.revision}` }).check()
  await page.getByRole('button', { name: 'Move to in-review' }).click()
  await expect(queueRow(page, titles.empty)).toContainText('in review')
  await expect(queueRow(page, titles.revision)).toContainText('needs revision')
  await openExport(page)
  expect(await exportText(page)).not.toBe(baseline)
})
