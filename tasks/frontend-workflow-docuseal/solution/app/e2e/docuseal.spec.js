import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Docuseal template editor' })).toBeAttached()
})

test('Ctrl-click selects multiple fields and batch reassigns them', async ({ page }) => {
  const fields = page.locator('.field-box')
  await expect(fields).toHaveCount(3)

  await fields.nth(0).click()
  await fields.nth(1).click({ modifiers: ['Control'] })

  await expect(page.getByText('2 fields selected')).toBeVisible()
  await page.locator('#batch-submitter').click()
  await page.getByRole('option', { name: 'Second Party' }).click()
  await page.getByRole('button', { name: 'Batch reassign' }).click()

  await expect(fields.nth(0).locator('.field-owner')).toHaveText('Second Party')
  await expect(fields.nth(1).locator('.field-owner')).toHaveText('Second Party')
  await expect(page.locator('.breakdown-row').filter({ hasText: 'First Party' }).locator('strong')).toHaveText('0')
  await expect(page.locator('.breakdown-row').filter({ hasText: 'Second Party' }).locator('strong')).toHaveText('3')
})

test('field controls expose focus feedback and Preview uses dashed affordances', async ({ page }) => {
  const firstField = page.locator('.field-box').first()
  await firstField.click()

  const required = page.getByRole('checkbox', { name: 'Required field' })
  await expect(required).toBeVisible()
  await required.focus()
  await expect(required).toBeFocused()
  await page.keyboard.press('Tab')
  const duplicateButton = page.getByRole('button', { name: 'Duplicate field' })
  await expect(duplicateButton).toBeFocused()
  await expect(duplicateButton).toHaveCSS('outline-style', 'solid')
  await expect(duplicateButton).toHaveCSS('outline-width', '3px')

  await page.getByRole('switch', { name: 'Build or Preview mode' }).click()
  await expect(page.locator('.canvas-shell')).toHaveClass(/previewing/)
  await expect(firstField).toHaveCSS('border-style', 'dashed')
  await expect(firstField.locator('.preview-field-input')).toBeVisible()
})
