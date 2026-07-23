import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Prompt Editor' })).toBeVisible()
})

test('bindings and model choice update distinct derived surfaces', async ({ page }) => {
  await page.evaluate(async () => window.webmcp_invoke_tool('editor_set_content', { content: 'Explain {{topic}} clearly.' }))
  const preview = page.locator('.preview-body')
  await expect(preview).toContainText('{{topic}}')

  await page.evaluate(async () => window.webmcp_invoke_tool('editor_update_property', { property: 'variable-value', name: 'topic', value: 'rate limits' }))
  await expect(preview).toContainText('Explain rate limits clearly.')

  const tokenMetric = page.locator('.toolbar .metric').first().locator('strong')
  const firstEstimate = await tokenMetric.innerText()
  await page.getByLabel('Selected model').selectOption('nova-2-mini')
  await expect.poll(() => tokenMetric.innerText()).not.toBe(firstEstimate)
})

test('icon-only history controls always have names and visible disabled state', async ({ page }) => {
  const undo = page.getByRole('button', { name: 'Undo', exact: true })
  const redo = page.getByRole('button', { name: 'Redo', exact: true })
  await expect(undo).toBeDisabled()
  await expect(redo).toBeDisabled()

  await page.evaluate(async () => window.webmcp_invoke_tool('editor_set_content', { content: 'A named history mutation' }))
  await expect(undo).toBeEnabled()
  await undo.click()
  await expect(redo).toBeEnabled()
})

test('completed reasoning starts collapsed and code copy is exact', async ({ context, page }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.evaluate(async () => window.webmcp_invoke_tool('editor_set_content', { content: 'Propose a measurable launch plan.' }))
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(page.locator('.status-complete')).toContainText('Complete', { timeout: 15_000 })

  const reasoning = page.getByRole('button', { name: /Reasoning/ })
  await expect(reasoning).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('.reasoning-region')).toHaveAttribute('aria-hidden', 'true')
  await expect(page.locator('.reasoning-region p')).not.toBeVisible()
  await reasoning.click()
  await expect(reasoning).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('.reasoning-region p')).toBeVisible()

  const code = page.locator('.code-block code')
  const exactCode = await code.textContent()
  await page.locator('.code-block').getByRole('button', { name: 'Copy', exact: true }).click()
  await expect(page.locator('.code-block').getByRole('button', { name: 'Copied', exact: true })).toBeVisible()
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(exactCode)
})
