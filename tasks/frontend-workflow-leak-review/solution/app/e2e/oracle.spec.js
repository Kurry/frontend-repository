import { expect, test } from '@playwright/test'

async function openFirstSubmission(page) {
  await page.goto('/')
  await page.getByRole('button', { name: /^Open .* similarity/ }).first().click()
}

test('decision validation is announced when no verdict is selected', async ({ page }) => {
  await openFirstSubmission(page)
  await page.getByLabel('Rationale').fill('This is a sufficiently detailed review rationale.')
  await page.getByRole('button', { name: 'Choose a verdict' }).click()

  const error = page.getByRole('alert').filter({ hasText: /verdict/i })
  await expect(error).toBeVisible()
  await expect(error).toHaveAttribute('aria-live', 'assertive')
})

test('an interleaved Canary visit preserves the decision draft', async ({ page }) => {
  await openFirstSubmission(page)
  const rationale = 'Preserve this reviewer rationale while inspecting canary results.'
  await page.getByLabel('Confirm leak').check()
  await page.getByLabel('Rationale').fill(rationale)

  await page.getByRole('button', { name: 'Canary', exact: true }).click()
  await page.getByRole('button', { name: 'Queue', exact: true }).click()
  await page.getByRole('button', { name: /^Open .* similarity/ }).first().click()

  await expect(page.getByLabel('Confirm leak')).toBeChecked()
  await expect(page.getByLabel('Rationale')).toHaveValue(rationale)
})

test('a valid decision records successfully and returns to the queue', async ({ page }) => {
  await openFirstSubmission(page)
  await page.getByLabel('Confirm clean').check()
  await page.getByLabel('Rationale').fill('The matched evidence is contextual and does not establish a leak.')
  await page.getByRole('button', { name: 'Confirm clean' }).click()

  await expect(page.getByRole('heading', { name: 'Submission queue' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Open Emberline Parser.*confirmed-clean/ })).toBeVisible()
})

test('threshold extremes update the visible value and rollup', async ({ page }) => {
  await page.goto('/')
  const slider = page.getByRole('slider', { name: 'Threshold value' })
  await slider.focus()
  await slider.press('Home')
  await expect(slider).toHaveValue('0.5')
  await expect(page.locator('output[for="threshold"]')).toHaveText('0.50')
  await slider.press('End')
  await expect(page.locator('output[for="threshold"]')).toHaveText('0.95')
})

test('copy chords do not trigger evidence verdict shortcuts', async ({ page }) => {
  await openFirstSubmission(page)

  await page.keyboard.press('Control+c')
  await page.keyboard.press('Meta+c')
  await page.keyboard.press('Shift+c')
  await expect(page.getByLabel('Confirm clean')).not.toBeChecked()
  await expect(page.getByLabel('Confirm leak')).not.toBeChecked()

  await page.keyboard.press('c')
  await expect(page.getByLabel('Confirm clean')).toBeChecked()
})

test('pasted JSON takes precedence over a selected file', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Export', exact: true }).click()

  const report = JSON.parse(await page.getByTestId('export-preview').textContent())
  report.threshold = 0.61
  await page.locator('#report-import').setInputFiles({
    name: 'stale-report.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"invalid": true}')
  })
  await page.getByPlaceholder('Or paste JSON payload here...').fill(JSON.stringify(report))
  await page.getByRole('button', { name: 'Import report' }).click()

  await expect(page.getByRole('form', { name: 'Import Review report JSON' }).getByRole('alert')).toHaveCount(0)
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(page.getByRole('slider', { name: 'Threshold value' })).toHaveValue('0.61')
})

test('inbox-zero uses an in-app CSS celebration', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Review state').selectOption('review-triggered')
  await page.getByRole('slider', { name: 'Threshold value' }).press('End')

  await expect(page.getByRole('status').filter({ hasText: 'Inbox zero — all flagged submissions reviewed' })).toBeVisible()
})

test('reduced motion suppresses the inbox-zero celebration', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByLabel('Review state').selectOption('review-triggered')
  await page.getByRole('slider', { name: 'Threshold value' }).press('End')

  await expect(page.getByRole('status').filter({ hasText: 'Inbox zero — all flagged submissions reviewed' })).toHaveCount(0)
})
