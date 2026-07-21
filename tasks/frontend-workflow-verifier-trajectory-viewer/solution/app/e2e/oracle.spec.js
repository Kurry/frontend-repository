import { expect, test } from '@playwright/test'

async function openWorkspace(page) {
  await page.goto('/')
  await page.getByRole('button', { name: /^Open task / }).first().click()
  await page.getByRole('button', { name: /^Open review workspace for trial / }).first().click()
  const dismiss = page.getByRole('button', { name: 'Dismiss tour' })
  if (await dismiss.isVisible()) await dismiss.click()
}

test('timeline Home and End select, focus, and mark the boundary steps', async ({ page }) => {
  await openWorkspace(page)
  const timeline = page.getByRole('listbox', { name: 'agent trajectory steps' })
  const options = timeline.getByRole('option')
  await timeline.focus()
  await timeline.press('End')
  await expect(options.last()).toHaveAttribute('aria-current', 'step')
  await expect(options.last()).toBeFocused()
  await options.last().press('Home')
  await expect(options.first()).toHaveAttribute('aria-current', 'step')
  await expect(options.first()).toBeFocused()
})

test('Escape closes the command palette and restores its launcher focus', async ({ page }) => {
  await openWorkspace(page)
  const launcher = page.getByRole('button', { name: 'Open command palette' })
  await launcher.click()
  const palette = page.getByRole('dialog', { name: 'Command palette' })
  await expect(palette).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(palette).toBeHidden()
  await expect(launcher).toBeFocused()
})
