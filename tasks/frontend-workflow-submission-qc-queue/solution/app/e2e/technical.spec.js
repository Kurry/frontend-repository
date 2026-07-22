import { expect, test } from '@playwright/test'
import { addFinding, boot, exportJson, openExport, openSubmission, queueRow, queueRows, submissionFromPackage, titles } from './helpers.js'

test('4.1 shared_state_coherence', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.empty)
  const payload = await addFinding(page, { tier: 'major', category: 'environment' })
  await openExport(page)
  expect(submissionFromPackage(await exportJson(page), titles.empty).findings[0]).toMatchObject(payload)
})

test('4.2 no_storage_reload_seeded', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.empty)
  await addFinding(page)
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 })
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Submission queue' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Undo last action' })).toBeDisabled()
})

test('4.3 console_clean_full_exercise', async ({ page }) => {
  const messages = await boot(page)
  await page.getByLabel('Filter by stage').selectOption('submitted')
  await page.getByLabel('Sort by open finding count').selectOption('asc')
  await page.getByLabel('Filter by stage').selectOption('')
  await openSubmission(page, titles.blocker)
  await page.locator('.evidence-toggle').first().click()
  await openExport(page)
  expect(messages).toEqual([])
})

test('4.4 cold_load_interactive_2s', async ({ page }) => {
  const started = Date.now()
  await boot(page)
  await page.getByLabel('Filter by stage').selectOption('approved')
  expect(Date.now() - started).toBeLessThan(2_000)
  await expect(queueRows(page)).toHaveCount(3)
})

test('4.5 rapid_input_stability', async ({ page }) => {
  await boot(page)
  for (const value of ['submitted', 'approved', 'in-review', '', 'needs-revision', '']) await page.getByLabel('Filter by stage').selectOption(value)
  await expect(queueRows(page)).toHaveCount(12)
  await openSubmission(page, titles.blocker)
  for (let i = 0; i < 4; i++) await page.locator('.evidence-toggle').first().click()
  await expect(page.locator('.evidence-toggle').first()).toHaveAttribute('aria-expanded', 'false')
})

test('4.6 keyboard_operability_focus', async ({ page }) => {
  await boot(page)
  await page.getByLabel('Filter by stage').focus()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Filter by finding tier')).toBeFocused()
  await queueRow(page, titles.blocker).focus()
  await page.keyboard.press('Space')
  await expect(page.getByRole('heading', { name: titles.blocker })).toBeVisible()
})

test('4.7 drawer_focus_and_semantics', async ({ page }) => {
  await boot(page)
  const opener = page.getByRole('button', { name: 'Mara Voss' }).first()
  await opener.click()
  await expect(page.getByRole('button', { name: 'Close contributor drawer' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(opener).toBeFocused()
  await openSubmission(page, titles.blocker)
  await expect(page.locator('.evidence-toggle').first()).toHaveAttribute('aria-expanded', 'false')
})

test('4.8 api_shaped_field_contracts', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.empty)
  const payload = await addFinding(page, { tier: 'minor', category: 'tooling', description: '  Trimmed field contract text  ', evidence: 'same-key evidence' })
  await openExport(page)
  const item = submissionFromPackage(await exportJson(page), titles.empty).findings[0]
  expect(item).toMatchObject({ tier: payload.tier, category: payload.category, description: payload.description.trim(), evidence: payload.evidence, status: 'open' })
})

test('webmcp contract read and mutation round-trip', async ({ page }) => {
  await boot(page)
  const surface = await page.evaluate(async () => ({
    session: window.webmcp_session_info(),
    tools: window.webmcp_list_tools(),
    read: await window.webmcp_invoke_tool('browse_search', { query: 'constraint ambiguity' }),
  }))
  expect(surface.session.contract_version).toBe('zto-webmcp-v1')
  expect(surface.tools.map((tool) => tool.name)).toEqual(expect.arrayContaining(['browse_search', 'browse_open', 'form_submit', 'artifact_export']))
  expect(surface.read.isError).toBeFalsy()
  await page.evaluate(() => window.webmcp_invoke_tool('browse_open', { destination: 'submission-detail', submission_id: 'sub-1048' }))
  await expect(page.getByRole('heading', { name: titles.empty })).toBeVisible()
  const mutation = await page.evaluate(() => window.webmcp_invoke_tool('form_submit', {
    workflow_step: 'add-finding', submission_id: 'sub-1048', tier: 'major', category: 'tooling',
    description: 'WebMCP deterministic mutation', evidence: 'Contract round-trip evidence',
  }))
  expect(mutation.isError).toBeFalsy()
  await expect(page.locator('.finding-card')).toContainText('WebMCP deterministic mutation')
  await openExport(page)
  expect(submissionFromPackage(await exportJson(page), titles.empty).findings[0].description).toBe('WebMCP deterministic mutation')
})
