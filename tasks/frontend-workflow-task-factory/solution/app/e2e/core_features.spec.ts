/**
 * NOT-AUTOMATABLE: none. Every criterion in this dimension has a stable DOM,
 * interaction, timing, download, clipboard, or computed-geometry observable.
 */
import {
  downloadJson, expect, expectManifestContract, fillCreateForm, gotoApp, openCreateDialog,
  openRepository, openTask, pipelineRows, readManifest, repositoryMetrics, stageNames,
  submitRun, test, verdicts, waitForAcceptedRun,
} from './fixtures'

test('1.1 seeded_repositories_complete', async ({ page }) => {
  await gotoApp(page)
  const cards = page.locator('.repo-card')
  await expect(cards).toHaveCount(4)
  for (const card of await cards.all()) {
    const values = await card.locator('.repo-metric strong').allTextContents()
    expect(values).toHaveLength(3)
    expect(values[0].trim()).not.toBe('')
    const processed = Number(values[1])
    const [tasks, yieldPercent] = values[2].split('·').map((value) => Number.parseInt(value, 10))
    expect(yieldPercent).toBe(Math.round(tasks / processed * 100))
  }
})

test('1.2 repo_opens_pipeline_view', async ({ page }) => {
  await openRepository(page)
  await expect(pipelineRows(page)).toHaveCount(9)
  for (const row of await pipelineRows(page).all()) {
    await expect(row.locator('.pr-number')).toHaveText(/^#\d+$/)
    await expect(row.locator('.pr-title')).not.toBeEmpty()
    await expect(row.locator('.file-count')).toHaveText(/^\d+$/)
    await expect(row.locator('td').nth(3)).toHaveText(/ISS-|No linked issue/)
  }
  await page.getByRole('button', { name: 'All repositories' }).click()
  await expect(page.getByRole('heading', { name: 'Repository intake' })).toBeVisible()
})

test('1.3 stage_strip_five_stages', async ({ page }) => {
  await openRepository(page)
  for (const row of await pipelineRows(page).all()) {
    const stages = row.locator('.stage-cell')
    await expect(stages).toHaveCount(5)
    expect(await stages.locator('.stage-name').allTextContents()).toEqual(stageNames)
    for (const stage of await stages.all()) {
      await expect(stage).toHaveAttribute('aria-label', /stage, (pending|running|complete|failed|skipped), attempt \d/)
      await expect(stage.locator('.stage-status')).toHaveText(/^(pending|running|complete|failed|skipped)$/)
    }
  }
})

test('1.4 rejection_reason_taxonomy', async ({ page }) => {
  const allowed = ['docs-only', 'formatting-only', 'too-few-files', 'too-many-files', 'no-linked-issue']
  for (const repository of ['quartz-orm', 'copperline', 'fernweh-gateway', 'lattice-db']) {
    await openRepository(page, repository)
    const reasons = await page.locator('.badge-danger').allTextContents()
    for (const reason of reasons) expect(allowed).toContain(reason.trim())
  }
})

test('1.5 paired_check_cards', async ({ page }) => {
  await openTask(page)
  const checks = page.locator('.check-card')
  await expect(checks).toHaveCount(2)
  await expect(checks.nth(0)).toContainText('Baseline check')
  await expect(checks.nth(0)).toContainText('Tests must fail on the reproduced bug')
  await expect(checks.nth(1)).toContainText('Reference check')
  await expect(checks.nth(1)).toContainText('Tests must pass with the fix applied')
  for (const card of await checks.all()) {
    await expect(card).toHaveAttribute('data-log-collapsed', 'true')
    await expect(card.locator('.check-attempt')).toHaveText(/Attempt \d+/)
    const toggle = card.getByRole('button', { name: 'Log excerpt' })
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(card.locator('.log-code')).toBeVisible()
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  }
})

test('1.6 accepted_badge_derives_from_checks', async ({ page }) => {
  await openTask(page, 184)
  await expect(page.getByText('Accepted', { exact: true }).first()).toBeVisible()
  await openTask(page, 173)
  await expect(page.getByText('Accepted', { exact: true })).toHaveCount(0)
  await gotoApp(page)
  const row = await submitRun(page, { pullRequestNumber: '941' })
  await expect(row.getByText('Accepted', { exact: true })).toHaveCount(0)
  await waitForAcceptedRun(page, '941')
})

test('1.7 trial_panel_distribution_bar', async ({ page }) => {
  await openTask(page)
  const trials = page.locator('.trial-row')
  await expect(trials).toHaveCount(7)
  for (const row of await trials.all()) await expect(row.locator('.verdict-chip')).toHaveText(new RegExp(`^(${verdicts.join('|')})$`))
  const segments = page.locator('.dist-segment')
  const counts = await segments.evaluateAll((items) => items.map((item) => ({ width: Number.parseFloat((item as HTMLElement).style.width), count: Number(item.getAttribute('aria-label')?.match(/, (\d+) trials/)?.[1]) })))
  for (const item of counts) expect(item.width).toBeCloseTo(item.count / 7 * 100, 4)
})

test('1.8 verdict_filter_round_trip', async ({ page }) => {
  await openTask(page)
  const trials = page.locator('.trial-row')
  const total = await trials.count()
  await page.getByRole('button', { name: /^bad-success ·/ }).click()
  await expect(trials).toHaveCount(1)
  await expect(trials.locator('.verdict-chip')).toHaveText('bad-success')
  await page.getByRole('button', { name: 'Clear filter' }).click()
  await expect(trials).toHaveCount(total)
})

test('1.9 needs_review_banner_on_bad_success', async ({ page }) => {
  await openTask(page, 184)
  await expect(page.getByText('Needs review', { exact: true })).toBeVisible()
  await openTask(page, 183)
  await expect(page.getByText('Needs review', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Review clear', { exact: true })).toBeVisible()
})

test('1.10 create_form_validation_rules', async ({ page }) => {
  await gotoApp(page)
  await openCreateDialog(page)
  const dialog = await fillCreateForm(page, { pullRequestNumber: 'abc' })
  await expect(dialog.getByText('Pull-request number must be a positive integer of 1–6 digits')).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Start pipeline run' })).toBeDisabled()
  await fillCreateForm(page, { pullRequestNumber: '900', minFiles: '21', maxFiles: '20' })
  await expect(dialog.getByText('Minimum file bound must not exceed maximum file bound').first()).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Start pipeline run' })).toBeDisabled()
})

test('1.12 created_run_stages_advance', async ({ page }) => {
  await gotoApp(page)
  const row = await submitRun(page, { pullRequestNumber: '942' })
  for (let index = 0; index < stageNames.length; index += 1) {
    await expect(row.locator('.stage-cell').nth(index)).toHaveClass(/stage-running/, { timeout: 4_000 })
    await expect(row.locator('.stage-cell').nth(index)).toHaveClass(/stage-complete/, { timeout: 4_000 })
  }
  await waitForAcceptedRun(page, '942')
})

test('1.13 retry_resumes_from_failed_stage', async ({ page }) => {
  await gotoApp(page)
  const row = await submitRun(page, { pullRequestNumber: '943' })
  const generate = row.locator('.stage-cell').nth(3)
  await expect(generate).toHaveClass(/stage-failed/, { timeout: 6_000 })
  await expect(generate).toContainText('a1')
  for (let index = 0; index < 3; index += 1) await expect(row.locator('.stage-cell').nth(index)).toHaveClass(/stage-complete/)
  await expect(generate).toHaveClass(/stage-running/, { timeout: 3_000 })
  await expect(generate).toContainText('a2')
  await waitForAcceptedRun(page, '943')
})

test('1.14 timeline_appends_live', async ({ page }) => {
  await gotoApp(page)
  await submitRun(page, { pullRequestNumber: '944' })
  await page.getByRole('button', { name: 'Timeline', exact: true }).click()
  const events = page.locator('.event-row')
  const before = await events.count()
  await expect(events).toHaveCount(before + 1, { timeout: 2_500 })
  await expect(page.getByText('Generate failed · attempt 1')).toBeVisible({ timeout: 6_000 })
  await page.getByRole('button', { name: 'failed', exact: true }).click()
  const failedEvents = page.locator('.event-row:visible')
  await expect.poll(() => failedEvents.count()).toBeGreaterThan(0)
  await expect.poll(async () => ({
    events: await failedEvents.count(),
    failedIcons: await page.locator('.event-row:visible .event-icon.failed').count(),
  })).toEqual(expect.objectContaining({ events: 2, failedIcons: 2 }))
  await page.getByRole('button', { name: /^All ·/ }).click()
  expect(await events.count()).toBeGreaterThan(before)
})

test('1.15 charts_update_on_completion', async ({ page }) => {
  await gotoApp(page)
  await page.getByRole('button', { name: 'Analytics', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Tasks per week' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Language distribution' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Difficulty histogram' })).toBeVisible()
  const before = await page.locator('.chart-legend').textContent()
  await page.getByRole('button', { name: 'Repositories', exact: true }).click()
  await submitRun(page, { repository: 'copperline', pullRequestNumber: '945' })
  await waitForAcceptedRun(page, '945')
  await page.getByRole('button', { name: 'Analytics', exact: true }).click()
  await expect(page.locator('.chart-legend')).not.toHaveText(before ?? '')
  const mark = page.locator('.recharts-pie-sector path').first()
  await mark.hover()
  await expect(page.locator('[data-chart-tooltip="true"]')).toBeVisible()
})

test('1.16 manifest_copy_confirmation', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await openTask(page)
  const text = await page.locator('[data-manifest-text]').textContent()
  await page.getByRole('button', { name: 'Copy', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Copied', exact: true })).toBeVisible()
  await expect(page.getByText('Task manifest copied to clipboard')).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(text)
})

test('1.16b create_task_request_body_field_contract', async ({ page }) => {
  await gotoApp(page)
  await openCreateDialog(page)
  const dialog = await fillCreateForm(page, { pullRequestNumber: '0', minFiles: '0', maxFiles: '501' })
  await expect(dialog.getByText(/Pull-request number must be/)).toBeVisible()
  await expect(dialog.getByText('Minimum file bound must be between 1 and 500')).toBeVisible()
  await expect(dialog.getByText('Maximum file bound must be between 1 and 500')).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Start pipeline run' })).toBeDisabled()
  await fillCreateForm(page, { pullRequestNumber: '999999', minFiles: '1', maxFiles: '500' })
  await expect(dialog.getByRole('button', { name: 'Start pipeline run' })).toBeEnabled()
})

test('1.16c task_manifest_download_field_contract', async ({ page }) => {
  await gotoApp(page)
  await submitRun(page, { repository: 'lattice-db', pullRequestNumber: '946', minFiles: '3', maxFiles: '11' })
  await waitForAcceptedRun(page, '946')
  const visible = await readManifest(page)
  expectManifestContract(visible, { repository: 'lattice-db', pullRequestNumber: 946, minFiles: 3, maxFiles: 11 })
  const downloaded = await downloadJson(page, 'Download task-manifest.json')
  expect(downloaded).toEqual(visible)
})

test('1.17 double_submit_single_run', async ({ page }) => {
  await openRepository(page)
  const before = await pipelineRows(page).count()
  await openCreateDialog(page)
  const dialog = await fillCreateForm(page, { pullRequestNumber: '947', minFiles: '2', maxFiles: '20' })
  const submit = dialog.getByRole('button', { name: 'Start pipeline run' })
  await submit.focus()
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')
  await expect(pipelineRows(page)).toHaveCount(before + 1)
  await expect(page.getByRole('button', { name: /^Open pull request 947,/ })).toHaveCount(1)
})

test('1.18 empty_states_on_no_match', async ({ page }) => {
  await openTask(page)
  await page.getByRole('button', { name: /^infrastructure-error ·/ }).click()
  await expect(page.locator('.trial-row')).toHaveCount(1)
  await page.getByRole('button', { name: /^infrastructure-error ·/ }).click()
  await page.getByRole('button', { name: /^good-success ·/ }).click()
  await expect(page.locator('.trial-row')).toHaveCount(2)
  await page.getByRole('button', { name: 'Timeline', exact: true }).click()
  await page.getByRole('button', { name: 'skipped', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'No events match' })).toBeVisible()
  await page.getByRole('button', { name: 'Clear filter' }).click()
  await expect(page.locator('.event-row')).not.toHaveCount(0)
})

test('1.21 seed_covers_three_pipeline_situations', async ({ page }) => {
  await openRepository(page)
  await expect(page.getByText('Accepted', { exact: true }).first()).toBeVisible()
  await expect(page.locator('.badge-danger').first()).toBeVisible()
  await expect(page.locator('.stage-running').first()).toBeVisible()
  await expect(page.locator('.stage-pending').first()).toBeVisible()
})
