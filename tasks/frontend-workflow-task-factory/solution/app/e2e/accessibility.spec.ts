/**
 * NOT-AUTOMATABLE:
 * - 1.8 text_and_controls_have_contrast — “all” foreground/background pairs,
 *   including anti-aliased text and every transient state, require a visual audit.
 */
import { expect, fillCreateForm, gotoApp, openCreateDialog, openRepository, openTask, test } from './fixtures'

test('1.1 controls_are_keyboard_accessible', async ({ page }) => {
  await gotoApp(page)
  const repository = page.getByRole('button', { name: 'Open quartz-orm pipeline' })
  await repository.focus()
  await expect(repository).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'quartz-orm' })).toBeVisible()
  const row = page.getByRole('button', { name: /^Open pull request 184,/ })
  await row.focus()
  await page.keyboard.press('Space')
  await expect(page.getByText('Pull request #184', { exact: true })).toBeVisible()
  const disclosure = page.getByRole('button', { name: 'Log excerpt' }).first()
  await disclosure.focus()
  await page.keyboard.press('Enter')
  await expect(disclosure).toHaveAttribute('aria-expanded', 'true')
})

test('1.2 modals_manage_focus', async ({ page }) => {
  await gotoApp(page)
  const { dialog, opener } = await openCreateDialog(page)
  const focusable = dialog.locator('button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')
  const first = focusable.first()
  const last = focusable.last()
  await first.focus()
  await page.keyboard.press('Shift+Tab')
  await expect(last).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(first).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(opener).toBeFocused()
})

test('1.3 images_and_icons_have_alt_text', async ({ page }) => {
  await gotoApp(page)
  expect(await page.locator('img:not([alt])').count()).toBe(0)
  expect(await page.locator('svg:not([aria-label]):not([aria-hidden="true"])').count()).toBe(0)
  await openTask(page)
  expect(await page.locator('svg:not([aria-label]):not([aria-hidden="true"])').count()).toBe(0)
})

test('1.4 feedback_uses_live_regions', async ({ page }) => {
  await gotoApp(page)
  const notifications = page.getByRole('region', { name: 'Notifications' })
  await expect(notifications).toHaveAttribute('aria-live', 'polite')
  await openCreateDialog(page)
  const error = page.locator('#pullRequestNumber-error')
  await expect(error).toHaveAttribute('aria-live', 'polite')
  await fillCreateForm(page, { pullRequestNumber: 'bad' })
  await expect(error).toContainText('Pull-request number')
  await expect(error).toHaveAttribute('role', 'alert')
})

test('1.5 forms_have_explicit_labels', async ({ page }) => {
  await gotoApp(page)
  await openCreateDialog(page)
  for (const label of ['Repository', 'Pull-request number', 'Minimum file bound', 'Maximum file bound']) {
    const field = page.getByLabel(label, { exact: true })
    await expect(field).toBeVisible()
    const id = await field.getAttribute('id')
    expect(id).toBeTruthy()
    await expect(page.locator(`label[for="${id}"]`)).toHaveText(label)
  }
})

test('1.6 headings_follow_logical_order', async ({ page }) => {
  for (const destination of ['Repositories', 'Timeline', 'Analytics']) {
    await gotoApp(page)
    if (destination !== 'Repositories') await page.getByRole('button', { name: destination, exact: true }).click()
    const levels = await page.locator('h1, h2, h3, h4, h5, h6').evaluateAll((headings) => headings.map((heading) => Number(heading.tagName.slice(1))))
    expect(levels[0]).toBe(1)
    for (let index = 1; index < levels.length; index += 1) expect(levels[index] - levels[index - 1]).toBeLessThanOrEqual(1)
  }
})

test('1.7 landmark_navigation_is_present', async ({ page }) => {
  await gotoApp(page)
  await expect(page.getByRole('main')).toBeVisible()
  await expect(page.getByRole('complementary', { name: 'Primary navigation' })).toBeVisible()
  await expect(page.getByRole('navigation')).toBeVisible()
})

test('1.9 semantic_html_roles_are_used', async ({ page }) => {
  await openRepository(page)
  await expect(page.getByRole('main')).toBeVisible()
  await expect(page.getByRole('table')).toBeVisible()
  await expect(page.getByRole('button', { name: 'All repositories' })).toHaveJSProperty('tagName', 'BUTTON')
  await expect(page.getByRole('textbox', { name: 'Search pull requests' })).toHaveJSProperty('tagName', 'INPUT')
})

test('1.10 reduced_motion_is_respected', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await gotoApp(page)
  await openCreateDialog(page)
  const styles = await page.locator('.dialog-content').evaluate((element) => {
    const style = getComputedStyle(element)
    return { animation: style.animationName, duration: style.animationDuration, transition: style.transitionDuration }
  })
  expect(styles.animation).toBe('none')
  expect(styles.duration).toBe('0s')
  expect(styles.transition).toBe('0s')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Create benchmark task' })).toBeHidden()
})
