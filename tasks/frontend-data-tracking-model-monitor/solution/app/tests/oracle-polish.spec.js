import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Model marketplace monitor', { exact: true })).toBeVisible()
})

test('zero-result search replaces the catalog with a useful reset action', async ({ page }) => {
  const search = page.getByRole('searchbox', { name: 'Search models or providers' })
  await search.fill('no-such-route-623')

  await expect(page.getByText('No models found')).toBeVisible()
  await expect(page.getByText(/Nothing matched “no-such-route-623”/)).toBeVisible()
  await expect(page.getByRole('table', { name: 'Model catalog' })).toHaveCount(0)
  await expect(page.locator('.model-count')).toContainText('0 of 22 models')

  await page.locator('.catalog-empty').getByRole('button', { name: 'Clear filters' }).click()
  await expect(page.getByRole('table', { name: 'Model catalog' })).toBeVisible()
  await expect(page.locator('.model-count')).toContainText('22 of 22 models')
})

test('manual usage participates in a complete visible Undo and Redo round trip', async ({ page }) => {
  const feed = page.locator('.event-list .event-card')
  const probe = feed.filter({ hasText: 'undo-probe-623' })
  const totalMetric = page.locator('.ops-metric').filter({ hasText: 'Session total' })
  const initialCount = await feed.count()
  const initialMetric = await totalMetric.innerText()

  await page.evaluate(async () => window.webmcp_invoke_tool('entity_create', {
    model: 'GPT-4.1 Mini',
    request_label: 'undo-probe-623',
    prompt_tokens: 25_000,
    completion_tokens: 4_000,
  }))
  await expect(probe).toBeVisible()
  await expect(feed).toHaveCount(initialCount + 1)
  const loggedMetric = await totalMetric.innerText()
  expect(loggedMetric).not.toBe(initialMetric)

  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(probe).toHaveCount(0)
  await expect(feed).toHaveCount(initialCount)
  await expect.poll(() => totalMetric.innerText()).toBe(initialMetric)

  await page.getByRole('button', { name: 'Redo', exact: true }).click()
  await expect(probe).toBeVisible()
  await expect(feed).toHaveCount(initialCount + 1)
  await expect.poll(() => totalMetric.innerText()).toBe(loggedMetric)
})

test('form fields expose explicit labels and catalog headers remain sticky', async ({ page }) => {
  await page.getByRole('button', { name: 'Log usage' }).click()
  const dialog = page.getByRole('dialog', { name: 'Manual usage event' })
  await expect(dialog).toBeVisible()

  for (const label of ['Model', 'Request label', 'Prompt tokens', 'Completion tokens']) {
    const field = dialog.getByLabel(label, { exact: true })
    await expect(field).toHaveCount(1)
    await expect(field).toHaveAttribute('aria-labelledby', /-label$/)
  }
  await page.keyboard.press('Escape')

  const position = await page.getByRole('columnheader', { name: 'Model' }).evaluate((element) => getComputedStyle(element).position)
  expect(position).toBe('sticky')
})
