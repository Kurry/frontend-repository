import { expect, test as base, type Page } from '@playwright/test'

type Diagnostics = { consoleErrors: string[]; pageErrors: string[] }

export const test = base.extend<{ diagnostics: Diagnostics }>({
  diagnostics: [async ({ page }, use) => {
    const diagnostics: Diagnostics = { consoleErrors: [], pageErrors: [] }
    page.on('console', (message) => {
      if (message.type() === 'error') diagnostics.consoleErrors.push(message.text())
    })
    page.on('pageerror', (error) => diagnostics.pageErrors.push(error.message))
    await use(diagnostics)
    expect(diagnostics.consoleErrors, 'console.error messages').toEqual([])
    expect(diagnostics.pageErrors, 'uncaught page errors').toEqual([])
  }, { auto: true }],
})

export { expect }

export const TECHNIQUES = [
  'Zero-Shot',
  'One-Shot',
  'Few-Shot',
  'Chain-of-Thought',
  'Outcome-Based',
  'Role-Based',
  'Constraint-Based',
] as const

export async function loadApp(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Zero-Shot', exact: true })).toBeVisible()
  const skipTour = page.getByRole('button', { name: 'Skip tour' })
  if (await skipTour.isVisible()) await skipTour.click()
}

export function activeForm(page: Page) {
  return page.locator('form.technique-form.is-active').last()
}

export async function chooseTechnique(page: Page, name: typeof TECHNIQUES[number]) {
  await page.getByRole('button', { name: new RegExp(name) }).first().click()
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
  await page.waitForTimeout(180)
}

export function dialogByHeading(page: Page, heading: string) {
  return page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: heading, exact: true }) })
}

export async function generateZeroShot(page: Page, task = 'Explain deterministic browser testing') {
  const form = activeForm(page)
  await form.getByLabel('Task description').fill(task)
  await form.getByLabel('Output format').selectOption('bullets')
  await form.getByLabel('Tone').selectOption('professional')
  await form.getByRole('button', { name: 'Generate prompt' }).click()
  await expect(page.locator('#prompt-preview')).toContainText(task)
  return page.locator('#prompt-preview pre')
}

export async function fillFewShot(page: Page, task = 'Classify release notes') {
  await chooseTechnique(page, 'Few-Shot')
  const form = activeForm(page)
  await form.getByLabel('Task description').fill(task)
  await form.getByLabel('Example input').fill('Added an audit log')
  await form.getByLabel('Expected output').fill('Feature')
  return form
}

export async function generateFewShot(page: Page, task = 'Classify release notes') {
  const form = await fillFewShot(page, task)
  await form.getByRole('button', { name: 'Generate prompt' }).click()
  await expect(page.locator('#prompt-preview')).toContainText(task)
  return form
}

export async function saveCurrentPrompt(page: Page, title: string) {
  await page.getByRole('button', { name: 'Save to library' }).click()
  const dialog = dialogByHeading(page, 'Save prompt to library')
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('Title').fill(title)
  await dialog.getByRole('button', { name: 'Save prompt', exact: true }).click()
  await expect(page.getByRole('status', { name: 'Notifications' })).toContainText('Saved to library')
}

export async function openLibrary(page: Page) {
  await page.getByRole('button', { name: /Library/ }).first().click()
  await expect(page.getByRole('heading', { name: 'Prompt library' })).toBeVisible()
}

export async function libraryCount(page: Page) {
  return Number(await page.locator('.library-summary strong').first().innerText())
}

export async function confirmDelete(page: Page, title: string) {
  await page.getByRole('button', { name: `Delete ${title}` }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Delete prompt' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: /Delete prompt/ }).click({ force: true })
  await expect(page.getByRole('status', { name: 'Notifications' })).toContainText('Prompt deleted')
  const closeToast = page.locator('.cds--toast-notification__close-button')
  if (await closeToast.isVisible()) await closeToast.click()
}

export async function exportedDocument(page: Page) {
  const panel = page.getByRole('region', { name: 'Export library' })
  if (!(await panel.isVisible())) await page.getByRole('button', { name: 'Export library' }).click()
  await expect(panel).toBeVisible()
  return JSON.parse(await panel.locator('pre').innerText())
}

export async function expectNoHorizontalOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }))
  expect(sizes.document).toBeLessThanOrEqual(sizes.viewport)
}
