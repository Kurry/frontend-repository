/* NOT-AUTOMATABLE: none; each criterion has an observable UI-state assertion. */
import { activeForm, confirmDelete, dialogByHeading, generateZeroShot, libraryCount, loadApp, openLibrary, test, expect } from './helpers'

test.beforeEach(async ({ page }) => loadApp(page))

test('4.1 empty_state_is_present', async ({ page }) => {
  await openLibrary(page)
  for (const title of ['Executive brief distiller', 'Support reply exemplar', 'Launch message patterns', 'Research synthesis path', 'Product strategist review']) await confirmDelete(page, title)
  await expect(page.getByRole('heading', { name: 'Your library is ready for its first prompt' })).toBeVisible()
  await expect(page.getByText('Build and generate a prompt, then save it here for future use.')).toBeVisible()
})

test('4.2 forms_validate_inline', async ({ page }) => {
  const field = activeForm(page).getByLabel('Task description')
  await field.focus()
  await field.blur()
  await expect(field).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByText('Task description is required. Enter task description.')).toBeVisible()
})

test('4.3 errors_are_actionable', async ({ page }) => {
  const field = activeForm(page).getByLabel('Task description')
  await field.focus()
  await field.blur()
  await expect(page.getByText('Task description is required. Enter task description.')).toBeVisible()
  await openLibrary(page)
  await page.getByRole('button', { name: 'Import JSON' }).click()
  await dialogByHeading(page, 'Import library JSON').getByRole('button', { name: 'Replace library' }).click()
  await expect(page.locator('#import-document-text-error-msg')).toHaveText('Library JSON is required. Paste JSON or choose a file.')
})

test('4.4 actions_show_confirmation', async ({ page }) => {
  await generateZeroShot(page)
  await page.getByRole('button', { name: 'Save to library' }).click()
  const dialog = dialogByHeading(page, 'Save prompt to library')
  await dialog.getByLabel('Title').fill('Confirmation proof')
  await dialog.getByRole('button', { name: 'Save prompt', exact: true }).click()
  await expect(page.getByRole('status', { name: 'Notifications' })).toContainText('“Confirmation proof” is ready in your library.')
})

test('4.5 async_work_shows_loading_state', async ({ page }) => {
  await activeForm(page).getByLabel('Task description').fill('Show progress')
  await activeForm(page).getByRole('button', { name: 'Generate prompt' }).click()
  await expect(activeForm(page).getByText('Generating...')).toBeVisible()
  await expect(page.locator('#prompt-preview')).toContainText('Show progress')
})

test('4.6 destructive_actions_support_undo_or_cancel', async ({ page }) => {
  await openLibrary(page)
  const before = await libraryCount(page)
  await page.getByRole('button', { name: 'Delete Executive brief distiller' }).click()
  const dialog = page.getByRole('dialog', { name: 'Delete prompt' })
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toHaveCount(0)
  expect(await libraryCount(page)).toBe(before)
})

test('4.7 non_obvious_controls_have_help', async ({ page }) => {
  await page.getByRole('button', { name: /Few-Shot/ }).first().click()
  await activeForm(page).getByRole('button', { name: 'Add document' }).click()
  await page.getByRole('option', { name: /brand-voice-guide\.pdf/ }).click()
  const badge = activeForm(page).locator('.asset-badge')
  await badge.hover()
  await expect(badge.getByRole('tooltip')).toContainText('Tone, terminology, and editorial principles')
  await expect(page.getByRole('button', { name: 'Start voice input' })).toHaveAttribute('aria-label', 'Start voice input')
})

test('4.8 controls_use_semantic_tags', async ({ page }) => {
  expect(await page.locator('[onclick]:not(button):not(a):not(input):not(select):not(textarea)').count()).toBe(0)
  await expect(activeForm(page).getByRole('button', { name: 'Generate prompt' })).toHaveJSProperty('tagName', 'BUTTON')
  await expect(activeForm(page).getByLabel('Task description')).toHaveJSProperty('tagName', 'TEXTAREA')
})

test('4.9 modal_supports_close_paths', async ({ page }) => {
  await generateZeroShot(page)
  await page.getByRole('button', { name: 'Save to library' }).click()
  let dialog = dialogByHeading(page, 'Save prompt to library')
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toHaveCount(0)
  await page.getByRole('button', { name: 'Save to library' }).click()
  dialog = dialogByHeading(page, 'Save prompt to library')
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await page.getByRole('button', { name: 'Save to library' }).click()
  await page.locator('.cds--modal').click({ position: { x: 5, y: 5 } })
  await expect(dialogByHeading(page, 'Save prompt to library')).toHaveCount(0)
})

test('4.10 long_flows_show_progress', async ({ page }) => {
  await page.getByRole('button', { name: 'Guided tour' }).click()
  await expect(page.getByText('Studio tour · 1/3')).toBeVisible()
  await page.getByRole('button', { name: 'Continue tour' }).click()
  await expect(page.getByText('Studio tour · 2/3')).toBeVisible()
  await page.getByRole('button', { name: 'Continue tour' }).click()
  await expect(page.getByText('Studio tour · 3/3')).toBeVisible()
  await page.getByRole('button', { name: 'Start building prompts' }).click()
  await expect(page.getByRole('button', { name: 'Guided tour' })).toBeVisible()
})
