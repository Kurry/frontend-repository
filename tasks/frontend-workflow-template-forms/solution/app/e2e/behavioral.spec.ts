/* NOT-AUTOMATABLE: none; all behavioral probes have deterministic state deltas. */
import { activeForm, chooseTechnique, confirmDelete, dialogByHeading, exportedDocument, generateZeroShot, libraryCount, loadApp, openLibrary, saveCurrentPrompt, test, expect } from './helpers'

test.beforeEach(async ({ page }) => loadApp(page))

test('14.1 multi_facet_round_trip', async ({ page }) => {
  await generateZeroShot(page, 'Transient multi-facet state')
  await saveCurrentPrompt(page, 'Transient entry')
  await openLibrary(page)
  await confirmDelete(page, 'Executive brief distiller')
  await page.getByRole('button', { name: 'Sort prompts ascending by title' }).click()
  await page.getByRole('searchbox', { name: 'Search prompts' }).fill('Transient')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Zero-Shot', exact: true })).toBeVisible()
  await openLibrary(page)
  expect(await libraryCount(page)).toBe(5)
  await expect(page.getByRole('searchbox', { name: 'Search prompts' })).toHaveValue('')
  await expect(page.getByRole('button', { name: 'Sort prompts ascending by title' })).toBeVisible()
})

test('14.2 sort_reversal_proves_live_data', async ({ page }) => {
  await openLibrary(page)
  const titles = () => page.locator('.library-row .row-copy strong').allTextContents()
  await page.getByRole('button', { name: 'Sort prompts ascending by title' }).click()
  const ascending = await titles()
  expect(ascending).toEqual([...ascending].sort((a, b) => a.localeCompare(b)))
  await page.getByRole('button', { name: 'Sort prompts descending by title' }).click()
  const descending = await titles()
  expect(descending).toEqual([...ascending].reverse())
})

test('14.3 derived_view_responds_to_input', async ({ page }) => {
  await openLibrary(page)
  await expect(page.locator('.library-row')).toHaveCount(5)
  await page.getByLabel('Filter by technique').selectOption('few-shot')
  await expect(page.locator('.library-row')).toHaveCount(1)
  await expect(page.locator('.library-row')).toContainText('Launch message patterns')
  await page.getByRole('searchbox', { name: 'Search prompts' }).fill('no-result-value')
  await expect(page.locator('.library-row')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'No prompts match the current filters' })).toBeVisible()
})

test('14.4 cross_view_echo_without_reload', async ({ page }) => {
  await generateZeroShot(page, 'Echo this across views')
  await saveCurrentPrompt(page, 'Cross-view echo')
  await openLibrary(page)
  await expect(page.getByRole('button', { name: 'Open Cross-view echo' }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Open Cross-view echo' }).first().click()
  await expect(page.locator('#prompt-preview pre')).toContainText('Echo this across views')
})

test('14.5 count_delta_is_exact', async ({ page }) => {
  await openLibrary(page)
  const before = await libraryCount(page)
  await confirmDelete(page, 'Executive brief distiller')
  expect(await libraryCount(page)).toBe(before - 1)
  await expect(page.locator('.library-row')).toHaveCount(before - 1)
})

test('14.6 different_inputs_change_outcomes', async ({ page }) => {
  await generateZeroShot(page, 'First distinct task')
  const first = await page.locator('#prompt-preview pre').innerText()
  await activeForm(page).getByLabel('Task description').fill('Second distinct task')
  await activeForm(page).getByLabel('Tone').selectOption('friendly')
  await activeForm(page).getByRole('button', { name: 'Generate prompt' }).click()
  await expect(page.locator('#prompt-preview pre')).toContainText('Second distinct task')
  const second = await page.locator('#prompt-preview pre').innerText()
  expect(second).not.toBe(first)
  expect(second).toContain('Second distinct task')
  expect(second).toContain('Friendly')
})

test('14.7 interleaved_flows_preserve_state', async ({ page }) => {
  await activeForm(page).getByLabel('Task description').fill('Draft A')
  await chooseTechnique(page, 'Role-Based')
  await activeForm(page).getByLabel('Role or persona').fill('Draft B role')
  await activeForm(page).getByLabel('Task description').fill('Draft B task')
  await openLibrary(page)
  await page.getByRole('button', { name: 'Studio' }).click()
  await expect(activeForm(page).getByLabel('Role or persona')).toHaveValue('Draft B role')
  await chooseTechnique(page, 'Zero-Shot')
  await expect(activeForm(page).getByLabel('Task description')).toHaveValue('Draft A')
})

test('14.8 empty_to_repopulated_round_trip', async ({ page }) => {
  await openLibrary(page)
  const baseline = await exportedDocument(page)
  for (const title of baseline.entries.map((entry: { title: string }) => entry.title)) await confirmDelete(page, title)
  expect(await libraryCount(page)).toBe(0)
  await page.getByRole('button', { name: 'Import JSON' }).click()
  const dialog = dialogByHeading(page, 'Import library JSON')
  await dialog.getByLabel('Library document').fill(JSON.stringify(baseline))
  await dialog.getByRole('button', { name: 'Replace library' }).click()
  expect(await libraryCount(page)).toBe(5)
  await expect(page.locator('.library-row')).toHaveCount(5)
})
