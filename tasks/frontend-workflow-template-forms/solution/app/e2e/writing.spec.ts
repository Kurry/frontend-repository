/*
 * NOT-AUTOMATABLE:
 * 15.5 body_copy_is_well_written — broad grammar/style quality requires editorial judgment.
 */
import { activeForm, confirmDelete, dialogByHeading, generateZeroShot, loadApp, openLibrary, saveCurrentPrompt, test, expect } from './helpers'

test.beforeEach(async ({ page }) => loadApp(page))

test('15.1 headings_use_consistent_capitalization', async ({ page }) => {
  const headings = await page.locator('h1, h2, h3').allTextContents()
  for (const heading of headings.map((text) => text.trim()).filter(Boolean)) expect(heading[0]).toBe(heading[0].toUpperCase())
})

test('15.2 actions_use_specific_labels', async ({ page }) => {
  const labels = (await page.getByRole('button').allTextContents()).map((text) => text.trim()).filter(Boolean)
  expect(labels).not.toContain('Submit')
  expect(labels).not.toContain('OK')
  expect(labels).toEqual(expect.arrayContaining(['Generate prompt', 'Reset form']))
  await page.getByRole('button', { name: /Few-Shot/ }).first().click()
  await expect(activeForm(page).getByRole('button', { name: 'Add document' })).toBeVisible()
})

test('15.3 errors_name_problem_and_fix', async ({ page }) => {
  const field = activeForm(page).getByLabel('Task description')
  await field.focus()
  await field.blur()
  await expect(page.getByText('Task description is required. Enter task description.')).toBeVisible()
  await openLibrary(page)
  await page.getByRole('button', { name: 'Import JSON' }).click()
  await dialogByHeading(page, 'Import library JSON').getByLabel('Library document').fill('{')
  await dialogByHeading(page, 'Import library JSON').getByRole('button', { name: 'Replace library' }).click()
  await expect(page.locator('#import-document-text-error-msg')).toHaveText('Library JSON is malformed. Check its syntax and try again.')
})

test('15.4 empty_states_explain_next_step', async ({ page }) => {
  await openLibrary(page)
  for (const title of ['Executive brief distiller', 'Support reply exemplar', 'Launch message patterns', 'Research synthesis path', 'Product strategist review']) await confirmDelete(page, title)
  await expect(page.getByText('Build and generate a prompt, then save it here for future use.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Return to forms' })).toBeVisible()
})

test('15.6 terminology_is_consistent', async ({ page }) => {
  await expect(page.getByLabel('Prompt preview')).toContainText('assembled prompt')
  await generateZeroShot(page)
  await expect(page.getByRole('button', { name: 'Save to library' })).toBeVisible()
  await openLibrary(page)
  await expect(page.getByRole('heading', { name: 'Prompt library' })).toBeVisible()
  await expect(page.getByText(/saved prompts/).first()).toBeVisible()
})

test('15.7 numbers_dates_and_units_are_consistent', async ({ page }) => {
  await openLibrary(page)
  await expect(page.locator('.row-time strong')).toHaveCount(5)
  expect(await page.locator('.row-time').allTextContents()).toEqual(Array(5).fill('Savedthis session'))
  await expect(page.locator('.library-summary')).toContainText('5saved prompts')
})

test('15.8 success_messages_are_specific', async ({ page }) => {
  await generateZeroShot(page)
  await saveCurrentPrompt(page, 'Specific success')
  await expect(page.getByRole('status', { name: 'Notifications' })).toContainText('“Specific success” is ready in your library.')
})
