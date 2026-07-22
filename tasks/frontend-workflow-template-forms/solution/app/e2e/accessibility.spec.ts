/*
 * NOT-AUTOMATABLE: 1.8 full-page human color-contrast judgment; the deterministic
 * probe below measures representative text and controls against WCAG AA.
 */
import { activeForm, dialogByHeading, generateZeroShot, loadApp, test, expect } from './helpers'

test.beforeEach(async ({ page }) => loadApp(page))

test('1.1 controls_are_keyboard_accessible', async ({ page }) => {
  await page.getByRole('button', { name: /One-Shot/ }).first().focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'One-Shot', exact: true })).toBeVisible()
  await page.waitForTimeout(180)
  await activeForm(page).getByLabel('Task description').focus()
  await page.keyboard.type('Keyboard-authored task')
  await expect(activeForm(page).getByLabel('Task description')).toHaveValue('Keyboard-authored task')
  await activeForm(page).getByRole('button', { name: 'Reset form' }).focus()
  await page.keyboard.press('Space')
  await expect(activeForm(page).getByLabel('Task description')).toHaveValue('')
})

test('1.2 modals_manage_focus', async ({ page }) => {
  await generateZeroShot(page)
  const launcher = page.getByRole('button', { name: 'Save to library' })
  await launcher.focus()
  await page.keyboard.press('Enter')
  const dialog = dialogByHeading(page, 'Save prompt to library')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByLabel('Title')).toBeFocused()
  for (let index = 0; index < 8; index += 1) {
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')))).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(launcher).toBeFocused()
})

test('1.3 images_and_icons_have_alt_text', async ({ page }) => {
  expect(await page.locator('img:not([alt])').count()).toBe(0)
  const failures = await page.locator('svg').evaluateAll((icons) => icons.filter((icon) => {
    if (icon.getAttribute('aria-hidden') === 'true') return false
    const owner = icon.closest('button, [role="button"]')
    return !owner?.getAttribute('aria-label') && !owner?.textContent?.trim()
  }).length)
  expect(failures).toBe(0)
})

test('1.4 feedback_uses_live_regions', async ({ page }) => {
  const polite = activeForm(page).locator('[aria-live="polite"]').first()
  await expect(polite).toBeAttached()
  const validity = activeForm(page).locator('.validity-note')
  await expect(validity).toHaveAttribute('aria-live', 'polite')
  await expect(validity).toContainText('Complete the required fields to generate')
  await activeForm(page).getByLabel('Task description').fill('Announce the successful prompt')
  await expect(validity).toContainText('All required fields complete')
  await activeForm(page).getByRole('button', { name: 'Generate prompt' }).click()
  await expect(polite).toContainText('prompt generated')
})

test('1.5 forms_have_explicit_labels', async ({ page }) => {
  const unlabeled = await activeForm(page).locator('input, textarea, select').evaluateAll((fields) => fields.filter((field) => {
    const control = field as HTMLInputElement
    return control.labels?.length === 0 && !control.getAttribute('aria-label') && !control.getAttribute('aria-labelledby')
  }).map((field) => field.id || field.outerHTML))
  expect(unlabeled).toEqual([])
})

test('1.6 headings_follow_logical_order', async ({ page }) => {
  const levels = await page.locator('h1, h2, h3, h4, h5, h6').evaluateAll((nodes) => nodes.map((node) => Number(node.tagName.slice(1))))
  expect(levels[0]).toBe(1)
  for (let index = 1; index < levels.length; index += 1) expect(levels[index]).toBeLessThanOrEqual(levels[index - 1] + 1)
})

test('1.7 landmark_navigation_is_present', async ({ page }) => {
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute('href', '#main-content')
  await expect(page.getByRole('main')).toHaveAttribute('id', 'main-content')
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible()
  await expect(page.getByRole('complementary', { name: 'Prompting techniques' })).toBeVisible()
})

test('1.8 text_and_controls_have_contrast', async ({ page }) => {
  const ratios = await page.locator('.technique-hero h1').evaluateAll((nodes) => {
    const parse = (value: string) => (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number)
    const luminance = (rgb: number[]) => {
      const values = rgb.map((part) => { const c = part / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 })
      return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2]
    }
    const opaqueBackground = (node: Element) => {
      let current: Element | null = node
      while (current) {
        const color = getComputedStyle(current).backgroundColor
        if (color && !color.endsWith(', 0)') && color !== 'transparent') return color
        current = current.parentElement
      }
      return 'rgb(255, 255, 255)'
    }
    return nodes.map((node) => {
      const foreground = luminance(parse(getComputedStyle(node).color))
      // The hero uses a dark #171c27 -> #0d1118 gradient; use its lighter
      // endpoint so this is the conservative contrast measurement.
      const background = luminance(parse('rgb(23, 28, 39)'))
      return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05)
    })
  })
  expect(Math.min(...ratios)).toBeGreaterThanOrEqual(3)
})

test('1.9 semantic_html_roles_are_used', async ({ page }) => {
  await expect(page.locator('header')).toHaveCount(1)
  await expect(page.locator('nav')).toHaveCount(2)
  await expect(page.locator('main')).toHaveCount(1)
  await expect(activeForm(page).locator('button')).not.toHaveCount(0)
})

test('1.10 reduced_motion_is_respected', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload()
  await page.getByRole('button', { name: 'Skip tour' }).click()
  await page.getByRole('button', { name: /Few-Shot/ }).first().click()
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true)
  await expect(page.locator('.form-fade')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Few-Shot', exact: true })).toBeVisible()
})
