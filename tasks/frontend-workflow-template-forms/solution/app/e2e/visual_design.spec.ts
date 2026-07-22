/* NOT-AUTOMATABLE: none; visual requirements are reduced to explicit computed-style/layout contracts. */
import { activeForm, expectNoHorizontalOverflow, generateZeroShot, loadApp, test, expect } from './helpers'

test.beforeEach(async ({ page }) => loadApp(page))

test('3.1 sidebar_form_preview_layout', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const sidebar = await page.getByRole('complementary', { name: 'Prompting techniques' }).boundingBox()
  const form = await activeForm(page).boundingBox()
  const preview = await page.getByLabel('Prompt preview').boundingBox()
  expect(sidebar!.width).toBeGreaterThanOrEqual(190)
  expect(sidebar!.width).toBeLessThanOrEqual(240)
  expect(form!.x).toBeGreaterThan(sidebar!.x + sidebar!.width - 1)
  expect(preview!.y).toBeGreaterThan(form!.y)
})

test('3.2 grouped_vertical_forms', async ({ page }) => {
  await expect(activeForm(page).locator('.form-section')).toHaveCount(2)
  const sections = await activeForm(page).locator('.form-section').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().y))
  expect(sections[1]).toBeGreaterThan(sections[0])
  await expect(activeForm(page).locator('.character-count')).toContainText('0 characters')
  await expect(activeForm(page).getByLabel('Output format')).toBeVisible()
})

test('3.3 preview_monospace_container', async ({ page }) => {
  await generateZeroShot(page)
  const surface = page.locator('#prompt-preview .code-surface')
  await expect(surface).toBeVisible()
  const family = await surface.locator('pre').evaluate((node) => getComputedStyle(node).fontFamily.toLowerCase())
  expect(family).toMatch(/mono|menlo/)
  const surfaceBox = await surface.boundingBox()
  const copyBox = await page.getByRole('button', { name: 'Copy assembled prompt' }).boundingBox()
  expect(copyBox!.x).toBeGreaterThan(surfaceBox!.x + surfaceBox!.width / 2)
})

test('3.4 active_state_and_chip_colors', async ({ page }) => {
  const active = page.getByRole('button', { name: /Zero-Shot/ }).first()
  const inactive = page.getByRole('button', { name: /One-Shot/ }).first()
  const styles = await Promise.all([active, inactive].map((item) => item.evaluate((node) => ({
    background: getComputedStyle(node).backgroundColor,
    beforeTransform: getComputedStyle(node, '::before').transform,
  }))))
  expect(styles[0].background).not.toBe(styles[1].background)
  expect(styles[0].beforeTransform).not.toBe(styles[1].beforeTransform)
  await activeForm(page).getByLabel('Task description').fill('Color status')
  await expect(page.locator('.status-in-progress').first()).toBeVisible()
})

test('3.5 component_states_and_icons', async ({ page }) => {
  const field = activeForm(page).getByLabel('Task description')
  await field.fill('Enable hover state')
  const button = activeForm(page).getByRole('button', { name: 'Generate prompt' })
  const before = await button.evaluate((node) => getComputedStyle(node).boxShadow)
  await button.hover()
  const hover = await button.evaluate((node) => getComputedStyle(node).boxShadow)
  expect(hover).not.toBe(before)
  await field.fill('')
  await field.blur()
  await expect(page.locator('.cds--form-requirement')).toHaveCSS('color', 'rgb(218, 30, 40)')
  expect(await page.locator('img').count()).toBe(0)
  expect(await page.locator('svg').count()).toBeGreaterThan(0)
})

test('3.6 typographic_hierarchy', async ({ page }) => {
  const size = (selector: string) => page.locator(selector).first().evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize))
  const [title, section, label, helper] = await Promise.all([size('.technique-hero h1'), size('.section-intro h2'), size('.technique-form label'), size('.character-count')])
  expect(title).toBeGreaterThan(section)
  expect(section).toBeGreaterThan(label)
  expect(label).toBeGreaterThanOrEqual(helper)
})

test('3.7 responsive_narrow_layout', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 })
  await expect(page.getByRole('complementary', { name: 'Prompting techniques' })).toBeHidden()
  await page.getByLabel('Prompting technique', { exact: true }).selectOption('few-shot')
  await expect(page.getByRole('heading', { name: 'Few-Shot', exact: true })).toBeVisible()
  await activeForm(page).getByRole('button', { name: 'Add example' }).click()
  await expectNoHorizontalOverflow(page)
})
