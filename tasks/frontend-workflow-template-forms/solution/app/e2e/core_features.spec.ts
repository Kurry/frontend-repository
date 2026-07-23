/*
 * NOT-AUTOMATABLE: none. Criterion 1.11 is retained as fixme because the current
 * oracle intentionally leaves Generate enabled to expose inline validation.
 */
import {
  TECHNIQUES,
  activeForm,
  chooseTechnique,
  confirmDelete,
  dialogByHeading,
  exportedDocument,
  fillFewShot,
  generateFewShot,
  generateZeroShot,
  libraryCount,
  loadApp,
  openLibrary,
  saveCurrentPrompt,
  test,
  expect,
} from './helpers'

test.beforeEach(async ({ page }) => loadApp(page))

test('1.1 seven_techniques_switchable', async ({ page }) => {
  const url = page.url()
  const sidebar = page.getByRole('complementary', { name: 'Prompting techniques' })
  for (const technique of TECHNIQUES) {
    const button = sidebar.getByRole('button', { name: new RegExp(technique) })
    await button.click()
    await expect(page.getByRole('heading', { name: technique, exact: true })).toBeVisible()
    await expect(button).toHaveAttribute('aria-current', 'page')
    await expect(button).toHaveClass(/is-active/)
    expect(page.url()).toBe(url)
  }
  await expect(sidebar.locator('.technique-item')).toHaveCount(7)
})

test('1.2 status_chips_track_lifecycle', async ({ page }) => {
  const zeroShot = page.getByRole('button', { name: /Zero-Shot/ }).first()
  await expect(zeroShot).toContainText('Neutral')
  await activeForm(page).getByLabel('Task description').fill('Track this lifecycle')
  await expect(zeroShot).toContainText('In progress')
  await activeForm(page).getByRole('button', { name: 'Generate prompt' }).click()
  await expect(zeroShot).toContainText('Generated')
  await saveCurrentPrompt(page, 'Lifecycle proof')
  await expect(zeroShot).toContainText('Saved')
})

test('1.3 zero_shot_form_generates', async ({ page }) => {
  const preview = await generateZeroShot(page, 'Summarize the release plan')
  await expect(preview).toContainText('Summarize the release plan')
  await expect(preview).toContainText('Bullets')
  await expect(preview).toContainText('Professional')
})

test('1.4 one_shot_example_pair', async ({ page }) => {
  await chooseTechnique(page, 'One-Shot')
  const form = activeForm(page)
  await expect(form.getByLabel('Example input')).toHaveCount(1)
  await expect(form.getByLabel('Expected output')).toHaveCount(1)
  await form.getByLabel('Task description').fill('Reply to the request')
  await form.getByLabel('Example input').fill('Can I change my plan?')
  await form.getByLabel('Expected output').fill('Yes, open billing settings.')
  await form.getByRole('button', { name: 'Generate prompt' }).click()
  await expect(page.locator('#prompt-preview pre')).toContainText('Reply to the request')
  await expect(page.locator('#prompt-preview pre')).toContainText('Can I change my plan?')
  await expect(page.locator('#prompt-preview pre')).toContainText('Yes, open billing settings.')
})

test('1.5 few_shot_dynamic_rows', async ({ page }) => {
  const form = await fillFewShot(page)
  await form.getByRole('button', { name: 'Add example' }).click()
  await expect(form.locator('.dynamic-row')).toHaveCount(2)
  await form.getByLabel('Example input').nth(1).fill('Fixed a typo')
  await form.getByLabel('Expected output').nth(1).fill('Fix')
  await form.getByRole('button', { name: 'Remove example 1' }).first().click()
  await expect(form.locator('.dynamic-row')).toHaveCount(1)
  await form.getByRole('button', { name: 'Generate prompt' }).click()
  await expect(page.locator('#prompt-preview pre')).toContainText('Fixed a typo')
  await expect(page.locator('#prompt-preview pre')).not.toContainText('Added an audit log')
})

test('1.6 few_shot_requires_one_example', async ({ page }) => {
  await chooseTechnique(page, 'Few-Shot')
  const form = activeForm(page)
  const rows = form.locator('.dynamic-row:not([style]):has(input[name^="examples"])')
  await rows.getByRole('button', { name: 'Remove example 1' }).click()
  await expect(rows).toHaveCount(0)
  await expect(form.getByRole('button', { name: 'Generate prompt' })).toBeDisabled()
  await expect(page.getByText('At least one example is required.')).toBeVisible()
  await form.getByRole('button', { name: 'Add example' }).click()
  await form.getByLabel('Task description').fill('Classify updates')
  await form.getByLabel('Example input').fill('New report')
  await form.getByLabel('Expected output').fill('Feature')
  await expect(form.getByText('All required fields complete')).toBeVisible()
})

test('1.7 chain_of_thought_scratchpad', async ({ page }) => {
  await chooseTechnique(page, 'Chain-of-Thought')
  const form = activeForm(page)
  await form.getByLabel('Goal').fill('Choose the safest release plan')
  const rows = form.locator('.dynamic-row:not([style]):has(input[name^="reasoningSteps"])')
  const before = await rows.count()
  await form.getByRole('button', { name: 'Add reasoning step' }).click()
  await expect(rows).toHaveCount(before + 1)
  await rows.first().getByRole('button', { name: /Remove reasoning step/ }).click()
  await expect(rows).toHaveCount(before)
  await form.locator('input[name^="reasoningSteps"]').first().fill('Rank the mitigations')
  expect(await rows.locator('.row-number').allTextContents()).toEqual(Array.from({ length: before }, (_, index) => String(index + 1).padStart(2, '0')))
  const scratchpad = form.getByRole('switch', { name: 'Scratchpad' })
  await form.locator('label[for="chain-of-thought-scratchpad"]').click()
  await expect(scratchpad).toHaveAttribute('aria-checked', 'true')
  await form.getByRole('button', { name: 'Generate prompt' }).click()
  await expect(page.locator('#prompt-preview pre')).toContainText('Think step by step')
  await form.locator('label[for="chain-of-thought-scratchpad"]').click()
  await expect(scratchpad).toHaveAttribute('aria-checked', 'false')
  await form.getByRole('button', { name: 'Generate prompt' }).click()
  await expect(page.locator('#prompt-preview pre')).not.toContainText('Think step by step')
})

test('1.8 remaining_technique_forms_distinct', async ({ page }) => {
  await chooseTechnique(page, 'Outcome-Based')
  await activeForm(page).getByLabel('Goal').fill('Improve onboarding')
  const criteria = activeForm(page).locator('input[name^="successCriteria"]')
  for (let index = 0; index < await criteria.count(); index += 1) await criteria.nth(index).fill(`Completion criterion ${index + 1}`)
  await activeForm(page).getByLabel('Measurement').selectOption('percentage')
  await activeForm(page).getByRole('button', { name: 'Generate prompt' }).click()
  await expect(page.locator('#prompt-preview pre')).toContainText('Completion criterion 1')

  await chooseTechnique(page, 'Role-Based')
  await activeForm(page).getByLabel('Role or persona').fill('security reviewer')
  await activeForm(page).getByLabel('Audience').fill('engineers')
  await activeForm(page).getByLabel('Task description').fill('Audit this design')
  await activeForm(page).getByRole('button', { name: 'Generate prompt' }).click()
  await expect(page.locator('#prompt-preview pre')).toHaveText(/^You are security reviewer\./)

  await chooseTechnique(page, 'Constraint-Based')
  await activeForm(page).getByLabel('Task description').fill('Write a launch brief')
  await activeForm(page).getByLabel('Constraint type').first().selectOption('length')
  const constraintTexts = activeForm(page).locator('input[name^="constraints"][name$=".text"]')
  for (let index = 0; index < await constraintTexts.count(); index += 1) await constraintTexts.nth(index).fill(`Constraint ${index + 1}`)
  await activeForm(page).getByRole('button', { name: 'Add constraint' }).click()
  await activeForm(page).locator('input[name^="constraints"][name$=".text"]').last().fill('No jargon')
  await activeForm(page).getByRole('button', { name: 'Generate prompt' }).click()
  await expect(page.locator('#prompt-preview pre')).toContainText('1. [Length] Constraint 1')
  await expect(page.locator('#prompt-preview pre')).toContainText('No jargon')
})

test('1.9 reference_document_attachments', async ({ page }) => {
  for (const technique of ['Few-Shot', 'Role-Based'] as const) {
    await chooseTechnique(page, technique)
    const form = activeForm(page)
    await form.getByRole('button', { name: 'Add document' }).click()
    await expect(page.getByRole('option')).toHaveCount(6)
    await page.getByRole('option', { name: /brand-voice-guide\.pdf/ }).click()
    const badge = form.locator('.asset-badge').filter({ hasText: 'brand-voice-guide.pdf' })
    await expect(badge).toBeVisible()
    await badge.hover()
    await expect(badge.getByRole('tooltip')).toContainText('PDF')
    const remove = badge.getByRole('button', { name: 'Remove brand-voice-guide.pdf' })
    await remove.evaluate(async (node) => {
      const animations = []
      for (let current = node; current; current = current.parentElement) animations.push(...current.getAnimations())
      await Promise.allSettled(animations.map((animation) => animation.finished))
    })
    await remove.click()
    await expect(badge).toHaveCount(0)
  }
})

test('1.10 inline_errors_name_field_and_fix', async ({ page }) => {
  const form = activeForm(page)
  const taskDescription = form.getByLabel('Task description')
  await taskDescription.fill('Temporary value')
  await taskDescription.fill('')
  await taskDescription.blur()
  await expect(form.getByText('Task description is required. Enter task description.')).toBeVisible()
  await expect(form.getByRole('button', { name: 'Generate prompt' })).toBeDisabled()
  await expect(page.getByLabel('Prompt preview')).toContainText('Your assembled prompt will appear here')
  await form.getByLabel('Task description').fill('Now valid')
  await expect(form.getByText('Task description is required. Enter task description.')).toHaveCount(0)
})

test('1.11 submit_disabled_until_valid', async ({ page }) => {
  for (const technique of ['Zero-Shot', 'One-Shot', 'Few-Shot', 'Chain-of-Thought', 'Outcome-Based', 'Role-Based', 'Constraint-Based'] as const) {
    await chooseTechnique(page, technique)
    const form = activeForm(page)
    const submit = form.getByRole('button', { name: 'Generate prompt' })
    await expect(submit).toBeDisabled()
    const required = form.locator('input[required], textarea[required], select[required]')
    for (let index = 0; index < await required.count(); index += 1) {
      const field = required.nth(index)
      const tag = await field.evaluate((element) => element.tagName)
      if (tag === 'SELECT') await field.selectOption({ index: 1 })
      else if ((await field.getAttribute('type')) !== 'checkbox') await field.fill(`Valid value ${index + 1}`)
    }
    await expect(submit).toBeEnabled()
  }
})

test('1.12 draft_retention_across_switches', async ({ page }) => {
  await activeForm(page).getByLabel('Task description').fill('Retain the zero-shot draft')
  await chooseTechnique(page, 'Role-Based')
  await activeForm(page).getByLabel('Role or persona').fill('editor')
  await chooseTechnique(page, 'Zero-Shot')
  await expect(activeForm(page).getByLabel('Task description')).toHaveValue('Retain the zero-shot draft')
  await expect(page.getByRole('button', { name: /Zero-Shot/ }).first()).toContainText('In progress')
})

test('1.13 preview_copy_confirmation', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  const preview = await generateZeroShot(page, 'Copy this exact prompt')
  const expectedText = await preview.innerText()
  await page.getByRole('button', { name: 'Copy assembled prompt' }).click()
  await expect(page.getByRole('button', { name: 'Prompt copied' })).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(expectedText)
})

test('1.14 regenerate_reflects_edits', async ({ page }) => {
  await generateZeroShot(page, 'Original wording')
  await activeForm(page).getByLabel('Task description').fill('Revised wording')
  await activeForm(page).getByRole('button', { name: 'Generate prompt' }).click()
  await expect(page.locator('#prompt-preview pre')).toContainText('Revised wording')
  await expect(page.locator('#prompt-preview pre')).not.toContainText('Original wording')
})

test('1.15 save_modal_autotitle_and_toast', async ({ page }) => {
  await generateZeroShot(page)
  await page.getByRole('button', { name: 'Save to library' }).click()
  const dialog = dialogByHeading(page, 'Save prompt to library')
  await expect(dialog.getByLabel('Title')).toHaveValue('Zero-Shot prompt')
  await dialog.getByLabel('Title').fill('')
  await expect(dialog.getByRole('button', { name: 'Save prompt', exact: true })).toBeDisabled()
  await dialog.getByLabel('Title').fill('Reusable test prompt')
  await dialog.getByRole('button', { name: 'Save prompt', exact: true }).click()
  await expect(page.getByRole('status', { name: 'Notifications' })).toContainText('Saved to library')
})

test('1.16 library_seeded_and_round_trip', async ({ page }) => {
  await openLibrary(page)
  await expect(page.locator('.library-row')).toHaveCount(5)
  await expect(page.locator('.library-row').first()).toContainText('Zero-Shot')
  await expect(page.locator('.library-row').first()).toContainText('this session')
  await page.getByRole('button', { name: 'Open Launch message patterns' }).first().click()
  await expect(page.getByRole('heading', { name: 'Few-Shot', exact: true })).toBeVisible()
  await expect(activeForm(page).getByLabel('Task description')).toHaveValue(/product-launch headline/)
  await expect(activeForm(page).locator('.dynamic-row')).toHaveCount(2)
  await expect(activeForm(page).locator('.asset-badge')).toContainText('brand-voice-guide.pdf')
  await expect(page.locator('#prompt-preview pre')).toContainText('Ideas move faster together')
})

test('1.17 library_delete_and_empty_state', async ({ page }) => {
  await openLibrary(page)
  for (const title of ['Executive brief distiller', 'Support reply exemplar', 'Launch message patterns', 'Research synthesis path', 'Product strategist review']) {
    const before = await libraryCount(page)
    await confirmDelete(page, title)
    expect(await libraryCount(page)).toBe(before - 1)
  }
  await expect(page.getByRole('heading', { name: 'Your library is ready for its first prompt' })).toBeVisible()
  await page.getByRole('button', { name: 'Return to forms' }).click()
  await expect(page.getByRole('heading', { name: 'Zero-Shot', exact: true })).toBeVisible()
})

test('1.18 double_save_creates_one_entry', async ({ page }) => {
  await generateZeroShot(page)
  await page.getByRole('button', { name: 'Save to library' }).click()
  const dialog = dialogByHeading(page, 'Save prompt to library')
  await dialog.getByLabel('Title').fill('Exactly once')
  await dialog.getByRole('button', { name: 'Save prompt', exact: true }).dblclick()
  await openLibrary(page)
  await expect(page.getByRole('button', { name: 'Open Exactly once' })).toHaveCount(2)
  expect(await libraryCount(page)).toBe(6)
})

test('1.19 long_description_handled', async ({ page }) => {
  const longText = `A${' very-long-description'.repeat(30)}`
  await generateZeroShot(page, longText)
  await expect(page.locator('#prompt-preview pre')).toContainText(longText)
  await saveCurrentPrompt(page, 'Long description')
  await openLibrary(page)
  const summary = await page.getByRole('button', { name: 'Open Long description' }).locator('small').innerText()
  expect(summary.length).toBeLessThanOrEqual(96)
  expect(summary.endsWith('…')).toBe(true)
})

test('1.22 save_to_library_request_body_field_contract', async ({ page }) => {
  const preview = await generateZeroShot(page, 'Validate the save payload')
  const promptText = await preview.innerText()
  await page.getByRole('button', { name: 'Save to library' }).click()
  const dialog = dialogByHeading(page, 'Save prompt to library')
  await dialog.getByLabel('Title').fill(' ')
  await expect(dialog.getByRole('button', { name: 'Save prompt', exact: true })).toBeDisabled()
  await expect(dialog.getByText(/Title must be at least 2 characters/)).toBeVisible()
  await dialog.getByLabel('Title').fill('  Payload proof  ')
  await dialog.getByRole('button', { name: 'Save prompt', exact: true }).click()
  await openLibrary(page)
  const document = await exportedDocument(page)
  const saved = document.entries.at(-1)
  expect(saved).toMatchObject({ title: 'Payload proof', technique: 'zero-shot', promptText })
  expect(saved.fields).toEqual({ taskDescription: 'Validate the save payload', outputFormat: 'bullets', tone: 'professional' })
})

test('1.23 export_library_json_field_contract', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  const preview = await generateZeroShot(page, 'Export this session work')
  const promptText = await preview.innerText()
  await saveCurrentPrompt(page, 'Export contract')
  await openLibrary(page)
  const document = await exportedDocument(page)
  expect(document.schemaVersion).toBe(1)
  expect(document.product).toBe('Template Forms')
  expect(document.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/)
  expect(document.entries.at(-1)).toMatchObject({ title: 'Export contract', technique: 'zero-shot', promptText })
  await page.getByRole('region', { name: 'Export library' }).getByRole('button', { name: 'Copy' }).click()
  expect(JSON.parse(await page.evaluate(() => navigator.clipboard.readText())).entries).toHaveLength(6)
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download JSON' }).click()
  expect((await download).suggestedFilename()).toBe('template-library.json')
})

test('1.24 import_library_round_trip', async ({ page }) => {
  await generateZeroShot(page, 'Round-trip this prompt')
  await saveCurrentPrompt(page, 'Round-trip entry')
  await openLibrary(page)
  const before = await exportedDocument(page)
  await confirmDelete(page, 'Round-trip entry')
  expect(await libraryCount(page)).toBe(5)
  await page.getByRole('button', { name: 'Import JSON' }).click()
  const dialog = dialogByHeading(page, 'Import library JSON')
  await dialog.getByLabel('Library document').fill(JSON.stringify(before))
  await dialog.getByRole('button', { name: 'Replace library' }).click()
  await expect(page.getByRole('status', { name: 'Notifications' })).toContainText('Library imported')
  expect((await exportedDocument(page)).entries).toEqual(before.entries)
  const count = await libraryCount(page)
  await page.getByRole('button', { name: 'Import JSON' }).click()
  await dialogByHeading(page, 'Import library JSON').getByLabel('Library document').fill('{bad json')
  await dialogByHeading(page, 'Import library JSON').getByRole('button', { name: 'Replace library' }).click()
  await expect(page.getByText(/malformed|does not match/i).last()).toBeVisible()
  expect(await libraryCount(page)).toBe(count)
})
