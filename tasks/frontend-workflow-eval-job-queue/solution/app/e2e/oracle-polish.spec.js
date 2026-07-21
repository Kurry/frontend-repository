import { test, expect } from '@playwright/test'

test('submit validation creates an exact two-model sweep', async ({ page }) => {
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await page.getByRole('button', { name: 'Skip tour' }).click()

  await expect(page.getByLabel('Status: failed').first()).toBeVisible()
  const rowsBefore = await page.locator('.jobs-table tbody tr').count()
  await page.getByRole('button', { name: 'Submit job' }).click()
  const submit = page.getByRole('dialog', { name: 'Submit job' }).getByRole('button', { name: 'Submit job', exact: true })
  await expect(submit).toBeDisabled()

  await page.getByLabel(/Dataset/).selectOption('orchard-qa')
  await page.getByLabel(/Agent/).selectOption('scouthand')
  await page.getByLabel(/Primary model/).selectOption('cobalt-4')
  await page.getByLabel(/Trial count/).fill('3')
  await page.getByLabel(/Sweep model/).selectOption('cobalt-4')
  await expect(page.getByText('sweepModel must differ from model')).toBeVisible()
  await expect(submit).toBeDisabled()

  await page.getByLabel(/Sweep model/).selectOption('meridian-xl')
  await expect(submit).toBeEnabled()
  await submit.click()
  await expect(page.locator('.jobs-table tbody tr')).toHaveCount(rowsBefore + 2)
  await expect(page.locator('.chakra-toast__title', { hasText: '2 sweep jobs submitted' })).toBeVisible()
  expect(errors).toEqual([])
})

test('export preview follows the active empty filter', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Skip tour' }).click()
  await page.getByLabel('Filter by status').selectOption('failed')
  await page.getByLabel('Filter by model').selectOption('cobalt-4')
  await expect(page.getByText(/No jobs match/)).toBeVisible()
  await page.getByRole('button', { name: 'Export queue' }).click()
  const preview = page.getByLabel('Queue snapshot JSON preview')
  await expect(preview).toContainText('"jobs": []')
})
