/* NOT-AUTOMATABLE: 1.8 exhaustive page-wide perceptual contrast review; representative critical text/control contrast is measured below. */
import { addNote, loadApp, openExport, stageButton, test, expect } from './helpers'

test.beforeEach(async ({ page }) => loadApp(page))

test('1.1 controls_are_keyboard_accessible', async ({ page }) => {
  const run = page.getByRole('button', { name: 'Open run RUN-2407-B04' }); await run.focus(); await page.keyboard.press('Enter'); await expect(run).toHaveAttribute('aria-pressed', 'true')
  const stage = stageButton(page, 'Build'); await stage.focus(); await page.keyboard.press('Space'); await expect(page.getByRole('heading', { name: 'Build' })).toBeVisible()
  const gate = page.locator('.gate-disclosure').first(); await gate.focus(); await page.keyboard.press('Enter'); await expect(gate).toHaveAttribute('aria-expanded', 'true')
  await page.getByRole('switch', { name: 'What-if mode' }).focus(); await page.keyboard.press('Space'); await expect(page.getByRole('switch', { name: 'What-if mode' })).toBeChecked()
  await page.getByRole('button', { name: 'Gate registry' }).focus(); await page.keyboard.press('Enter'); await expect(page.getByRole('heading', { name: 'Gate registry' })).toBeVisible()
  await page.getByLabel('Severity filter').focus(); await page.keyboard.press('s'); await expect(page.getByLabel('Severity filter')).toHaveValue('S1')
})

test('1.2 modals_manage_focus', async ({ page }) => {
  for (const [openerName, dialogName] of [['Add note', 'Add gate note'], ['Export acceptance package', 'Export acceptance package'], ['Import acceptance package', 'Import acceptance package']] as const) {
    const opener = page.getByRole('button', { name: openerName }).first(); await opener.click(); const dialog = page.getByRole('dialog', { name: dialogName }); await expect(dialog).toBeVisible()
    for (let i = 0; i < 8; i += 1) { await page.keyboard.press('Tab'); expect(await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')))).toBe(true) }
    await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0); await expect(opener).toBeFocused()
  }
})

test('1.3 images_and_icons_have_alt_text', async ({ page }) => {
  expect(await page.locator('img:not([alt])').count()).toBe(0)
  expect(await page.locator('svg:not([aria-hidden="true"]):not([aria-label]):not([aria-labelledby])').count()).toBe(0)
})

test('1.4 feedback_uses_live_regions', async ({ page, context }) => {
  await expect(page.locator('.live-region')).toHaveAttribute('aria-live', 'polite'); await expect(page.getByRole('alert')).toContainText('Hard-gate rejection')
  await addNote(page, 'live-region-note'); await expect(page.locator('.live-region')).toContainText('Note added')
  await context.grantPermissions(['clipboard-read', 'clipboard-write']); const dialog = await openExport(page); await dialog.getByRole('button', { name: 'Copy' }).click(); await expect(page.locator('.live-region')).toContainText('Preview copied')
})

test('1.5 forms_have_explicit_labels', async ({ page }) => {
  await page.getByRole('button', { name: 'Add note' }).first().click(); const note = page.getByRole('dialog', { name: 'Add gate note' })
  await expect(note.getByLabel('Text Required')).toBeVisible(); await expect(note.getByLabel('Category Required')).toBeVisible(); await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Import acceptance package' }).first().click(); await expect(page.getByLabel('Acceptance Package JSON Required')).toBeVisible()
})

test('1.6 headings_follow_logical_order', async ({ page }) => {
  const levels = await page.locator('h1,h2,h3,h4,h5,h6').evaluateAll((nodes) => nodes.map((node) => Number(node.tagName.slice(1))))
  expect(levels[0]).toBe(1); for (let i = 1; i < levels.length; i += 1) expect(levels[i]).toBeLessThanOrEqual(levels[i - 1] + 1)
})

test('1.7 landmark_navigation_is_present', async ({ page }) => {
  await expect(page.locator('.app-header')).toHaveCount(1); await expect(page.getByRole('navigation', { name: 'Console views' })).toBeVisible(); await expect(page.getByRole('main')).toBeVisible(); expect(await page.getByRole('complementary').count()).toBeGreaterThanOrEqual(1)
})

test('1.8 text_and_controls_have_contrast', async ({ page }) => {
  const ratio = await page.locator('.app-header').evaluate((header) => {
    const button = header.querySelector('button.primary')!; const parse = (s: string) => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number)
    const lum = (rgb: number[]) => rgb.map((v) => { const c=v/255; return c<=.03928?c/12.92:((c+.055)/1.055)**2.4 }).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0)
    const a=lum(parse(getComputedStyle(button).color)), b=lum(parse(getComputedStyle(button).backgroundColor)); return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)
  })
  expect(ratio).toBeGreaterThanOrEqual(3)
})

test('1.9 semantic_html_roles_are_used', async ({ page }) => {
  await expect(page.locator('nav')).toHaveCount(1); await expect(page.locator('main')).toHaveCount(1); await expect(page.locator('aside')).toHaveCount(1)
  expect(await page.locator('[onclick]:not(button):not([role="button"])').count()).toBe(0)
})

test('1.10 reduced_motion_is_respected', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.reload(); expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true)
  const durations = await page.locator('.gate-disclosure svg, .banner-enter').evaluateAll((nodes) => nodes.map((node) => { const s=getComputedStyle(node); return Math.max(Number.parseFloat(s.animationDuration)||0, Number.parseFloat(s.transitionDuration)||0) }))
  expect(Math.max(...durations)).toBeLessThanOrEqual(.001)
  await page.getByRole('switch', { name: 'What-if mode' }).check(); await expect(page.getByText('What-if simulation is active')).toBeVisible()
})
