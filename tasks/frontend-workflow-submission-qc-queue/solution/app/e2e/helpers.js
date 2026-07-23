import { expect } from '@playwright/test'

export const titles = {
  empty: 'Map constraint ambiguity in routing prompts',
  blocker: 'Score multi-turn evidence reconciliation',
  revision: 'Calibrate terse response rubric',
  approved: 'Verify sandbox dependency recovery',
  major: 'Audit tool-call recovery sequence',
}

export async function boot(page, options = {}) {
  const messages = []
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') messages.push(`${message.type()}: ${message.text()}`)
  })
  page.on('pageerror', (error) => messages.push(`pageerror: ${error.message}`))
  await page.goto('/')
  if (options.dismissTip !== false) {
    const dismiss = page.getByRole('button', { name: 'Dismiss tip' })
    if (await dismiss.isVisible().catch(() => false)) await dismiss.click()
  }
  await expect(page.getByRole('heading', { name: 'Submission queue' })).toBeVisible()
  return messages
}

export function queueRows(page) {
  return page.locator('.n-data-table-tr[aria-label^="Open "]')
}

export function queueRow(page, title) {
  return page.locator(`.n-data-table-tr[aria-label="Open ${title}"]`)
}

export async function openSubmission(page, title) {
  await queueRow(page, title).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
}

export async function moveEmptySubmissionToReview(page) {
  await openSubmission(page, titles.empty)
  await page.getByRole('button', { name: 'Move to in-review' }).click()
  await expect(page.locator('.detail-meta')).toContainText('in review')
}

export async function addFinding(page, values = {}) {
  const payload = {
    tier: 'blocker',
    category: 'correctness',
    description: 'Deterministic regression finding',
    evidence: 'Observed in the Playwright workflow.',
    ...values,
  }
  await page.getByRole('button', { name: 'Add finding' }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Add finding' })
  await dialog.getByLabel('Tier').selectOption(payload.tier)
  await dialog.getByLabel('Category').selectOption(payload.category)
  await dialog.getByLabel('Description').fill(payload.description)
  if (payload.evidence !== undefined) await dialog.getByLabel('Evidence').fill(payload.evidence)
  await dialog.getByRole('button', { name: 'Add finding' }).click()
  await expect(dialog).toBeHidden()
  return payload
}

export async function requestRevision(page, summary = 'Please revise the documented scoring boundary.') {
  await page.getByRole('button', { name: 'Request revision' }).click()
  const dialog = page.getByRole('dialog', { name: 'Request revision' })
  await dialog.getByLabel('Summary').fill(summary)
  await dialog.getByRole('button', { name: 'Request revision' }).click()
  await expect(dialog).toBeHidden()
}

export async function overrideFirstFinding(page, justification = 'Reviewed exception is appropriate.') {
  const card = page.locator('.finding-card').filter({ has: page.getByRole('button', { name: 'Override' }) }).first()
  await card.getByRole('button', { name: 'Override' }).click()
  const dialog = page.getByRole('dialog', { name: 'Override finding' })
  await dialog.getByLabel('Justification').fill(justification)
  await dialog.getByRole('button', { name: 'Confirm override' }).click()
  await expect(dialog).toBeHidden()
  return { card, justification }
}

export async function openExport(page, format = 'json') {
  await page.getByRole('button', { name: 'Export' }).click()
  await expect(page.getByRole('heading', { name: 'QC package export' })).toBeVisible()
  if (format === 'markdown') await page.getByRole('button', { name: /QC report/ }).click()
  else await page.getByRole('button', { name: /QC package/ }).click()
}

export async function exportText(page) {
  return page.locator('.code-window pre').innerText()
}

export async function exportJson(page) {
  return JSON.parse(await exportText(page))
}

export async function selectQueueRows(page, names) {
  for (const name of names) await page.getByRole('checkbox', { name: `Select ${name}` }).check()
}

export async function expectNoPageOverflow(page) {
  await expect.poll(() => page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))).toEqual(await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.clientWidth,
  })))
}

export function submissionFromPackage(pkg, title) {
  return pkg.submissions.find((submission) => submission.title === title)
}
