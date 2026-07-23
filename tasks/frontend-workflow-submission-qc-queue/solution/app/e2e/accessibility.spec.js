import { expect, test } from '@playwright/test'
import { boot, openExport, openSubmission, queueRow, titles } from './helpers.js'

test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

// NOT-AUTOMATABLE: 1.8 text_and_controls_have_contrast — full WCAG contrast judgment depends on rendered color compositing across all themes and states.

test('1.1 controls_are_keyboard_accessible', async ({ page }) => {
  await boot(page)
  await page.getByLabel('Filter by stage').focus()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Filter by finding tier')).toBeFocused()
  await queueRow(page, titles.empty).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: titles.empty })).toBeVisible()
})

test('1.2 modals_manage_focus', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.empty)
  const opener = page.getByRole('button', { name: 'Add finding' }).first()
  await opener.focus()
  await opener.click()
  const dialog = page.getByRole('dialog', { name: 'Add finding' })
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(opener).toBeFocused()
})

test('1.3 icons_have_accessible_names', async ({ page }) => {
  await boot(page)
  await expect(page.getByRole('button', { name: 'Undo last action' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Redo last action' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open command palette' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Switch to .* theme/ })).toBeVisible()
})

test('1.4 feedback_uses_live_regions', async ({ page }) => {
  await boot(page)
  await expect(page.locator('[aria-live="polite"]')).toHaveCount(1)
  await openExport(page)
  await page.getByRole('button', { name: 'Copy export' }).click()
  await expect(page.locator('[aria-live="polite"]').filter({ hasText: /copied/i }).first()).toBeVisible()
})

test('1.5 forms_have_explicit_labels', async ({ page }) => {
  await boot(page)
  await openSubmission(page, titles.empty)
  await page.getByRole('button', { name: 'Add finding' }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Add finding' })
  for (const label of ['Tier', 'Category', 'Description', 'Evidence']) await expect(dialog.getByLabel(label)).toBeVisible()
  await expect(dialog.getByLabel('Description')).toHaveAttribute('aria-describedby', 'description-error')
})

test('1.6 headings_follow_logical_order', async ({ page }) => {
  await boot(page)
  expect(await page.locator('h1').count()).toBe(1)
  await openSubmission(page, titles.blocker)
  expect(await page.locator('h1').count()).toBe(1)
  expect(await page.locator('h2').count()).toBeGreaterThanOrEqual(3)
  await openExport(page)
  expect(await page.locator('h1').count()).toBe(1)
})

test('1.7 landmark_navigation_is_present', async ({ page }) => {
  await boot(page)
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible()
  await expect(page.getByRole('main')).toHaveCount(1)
  await openExport(page)
  await expect(page.getByRole('main')).toHaveCount(1)
})

test('1.9 semantic_html_roles_are_used', async ({ page }) => {
  await boot(page)
  await expect(page.getByRole('checkbox', { name: `Select ${titles.empty}` })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Export' })).toBeVisible()
  await expect(page.getByRole('row', { name: `Open ${titles.empty}` })).toBeVisible()
})

test('1.10 reduced_motion_is_respected', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await boot(page)
  await openSubmission(page, titles.blocker)
  const durations = await page.locator('.gate-banner, .bar-fill, .finding-card, .evidence-toggle svg').evaluateAll((elements) =>
    elements.map((element) => getComputedStyle(element).transitionDuration),
  )
  expect(durations.length).toBeGreaterThan(3)
  expect(durations.every((duration) => Number.parseFloat(duration) <= 0.001)).toBe(true)
})
