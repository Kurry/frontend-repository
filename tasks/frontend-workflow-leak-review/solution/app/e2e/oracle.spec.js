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
