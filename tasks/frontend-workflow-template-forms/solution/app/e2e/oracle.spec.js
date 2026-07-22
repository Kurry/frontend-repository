import { expect, test } from '@playwright/test'

test('the document starts with its H1 and invalid generation announces named fields', async ({ page }) => {
  await page.goto('/')
  const headings = await page.locator('h1, h2, h3').evaluateAll((nodes) => nodes.map((node) => ({ tag: node.tagName, text: node.textContent.trim() })))
  expect(headings[0].tag).toBe('H1')

  const task = page.locator('#zero-shot-taskDescription')
  await task.focus()
  await task.blur()
  await expect(page.locator('#zero-shot-taskDescription-error-msg')).toBeVisible()
  await expect(page.locator('form.technique-form.is-active > [aria-live="polite"]')).toContainText('Task description has a validation error')
})

test('editing a prior generated draft marks the technique in progress and survives switches', async ({ page }) => {
  await page.goto('/')
  const task = page.locator('#zero-shot-taskDescription')
  await task.fill('Draft content that must survive navigation')
  await page.getByRole('button', { name: /Role-Based/ }).first().click()
  await page.getByRole('button', { name: /Zero-Shot/ }).first().click()
  await expect(task).toHaveValue('Draft content that must survive navigation')
  await expect(page.getByRole('button', { name: /Zero-Shot/ }).first()).toContainText('In progress')
})

test('editing during generation cancels the stale submitted snapshot', async ({ page }) => {
  await page.goto('/')
  const task = page.locator('#zero-shot-taskDescription')
  await task.fill('Initial prompt content')
  await page.locator('form.technique-form.is-active').getByRole('button', { name: 'Generate prompt' }).click()
  await task.fill('Revised before generation settled')
  await page.waitForTimeout(400)
  await expect(page.getByLabel('Prompt preview')).toContainText('Your assembled prompt will appear here')
  await expect(page.getByRole('button', { name: /Zero-Shot/ }).first()).toContainText('In progress')
})

test('clearing a generated form restores the neutral lifecycle state', async ({ page }) => {
  await page.goto('/')
  const task = page.locator('#zero-shot-taskDescription')
  await task.fill('Generate this prompt, then clear it')
  await page.locator('form.technique-form.is-active').getByRole('button', { name: 'Generate prompt' }).click()
  await expect(page.locator('#prompt-preview')).toContainText('Generate this prompt, then clear it')
  await task.fill('')
  await expect(page.getByRole('button', { name: /Zero-Shot/ }).first()).toContainText('Neutral')
  await expect(page.getByLabel('Prompt preview')).toContainText('Your assembled prompt will appear here')
})

test('few-shot can reach zero examples and explains the minimum', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Few-Shot/ }).first().click()
  await expect(page.locator('form.technique-form.is-active #few-shot-taskDescription')).toBeVisible()
  const removeExamples = page.locator('form.technique-form.is-active').getByRole('button', { name: /Remove example/i })
  await removeExamples.evaluateAll((buttons) => buttons.forEach((button) => button.click()))
  await expect(removeExamples).toHaveCount(0)
  await expect(page.locator('form.technique-form.is-active').getByRole('button', { name: 'Generate prompt' })).toBeDisabled()
  await expect(page.getByText('At least one example is required.')).toBeVisible()
})
