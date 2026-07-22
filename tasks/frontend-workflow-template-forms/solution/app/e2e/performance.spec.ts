/*
 * NOT-AUTOMATABLE:
 * 9.7 animations_maintain_smooth_frame_rate — CI scheduling cannot produce a stable perceptual 60fps verdict.
 */
import { activeForm, loadApp, test, expect } from './helpers'

test('9.1 cold_start_is_under_two_seconds', async ({ page }) => {
  const started = Date.now()
  await page.goto('/')
  await expect(page.getByRole('button', { name: /Zero-Shot/ }).first()).toBeVisible()
  expect(Date.now() - started).toBeLessThan(2_000)
  await page.getByRole('button', { name: 'Skip tour' }).click()
  await activeForm(page).getByLabel('Task description').fill('Interactive now')
})

test('9.2 console_is_clean', async ({ page }) => {
  const warnings: string[] = []
  page.on('console', (message) => { if (message.type() === 'warning') warnings.push(message.text()) })
  await loadApp(page)
  for (const name of ['One-Shot', 'Few-Shot', 'Chain-of-Thought', 'Outcome-Based', 'Role-Based', 'Constraint-Based', 'Zero-Shot']) {
    await page.getByRole('button', { name: new RegExp(name) }).first().click()
  }
  await page.getByRole('button', { name: /Library/ }).first().click()
  expect(warnings).toEqual([])
})

test('9.3 transitions_respond_under_100ms', async ({ page }) => {
  await loadApp(page)
  const elapsed = await page.evaluate(async () => {
    const button = [...document.querySelectorAll('button')].find((node) => node.textContent?.includes('Few-Shot')) as HTMLButtonElement
    const start = performance.now()
    button.click()
    while (![...document.querySelectorAll('h1,h2,h3')].some((node) => node.textContent?.trim() === 'Few-Shot' && (node as HTMLElement).offsetParent !== null)) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    }
    return performance.now() - start
  })
  expect(elapsed).toBeLessThan(100)
  await expect(page.getByRole('heading', { name: 'Few-Shot', exact: true })).toBeVisible()
})

test('9.4 async_work_has_loading_indicators', async ({ page }) => {
  await loadApp(page)
  await activeForm(page).getByLabel('Task description').fill('Generate asynchronously')
  await activeForm(page).getByRole('button', { name: 'Generate prompt' }).click()
  await expect(activeForm(page).getByText('Generating...')).toBeVisible()
  await expect(page.locator('#prompt-preview')).toContainText('Generate asynchronously')
})

test('9.5 large_collections_render_without_lag', async ({ page }) => {
  await loadApp(page)
  await page.getByRole('button', { name: /Few-Shot/ }).first().click()
  const form = activeForm(page)
  for (let index = 1; index < 10; index += 1) await form.getByRole('button', { name: 'Add example' }).click()
  await expect(form.locator('.dynamic-row')).toHaveCount(10)
  const start = Date.now()
  await form.getByLabel('Example input').nth(9).fill('Tenth row remains responsive')
  expect(Date.now() - start).toBeLessThan(500)
})

test('9.6 state_changes_remain_interactive', async ({ page }) => {
  await loadApp(page)
  await activeForm(page).getByLabel('Task description').fill('Start a generation')
  await activeForm(page).getByRole('button', { name: 'Generate prompt' }).click()
  await page.getByRole('button', { name: /Role-Based/ }).first().click()
  await activeForm(page).getByLabel('Role or persona').fill('responsive editor')
  await expect(activeForm(page).getByLabel('Role or persona')).toHaveValue('responsive editor')
})

test('9.8 rapid_input_does_not_freeze', async ({ page }) => {
  await loadApp(page)
  const field = activeForm(page).getByLabel('Task description')
  const text = 'rapid-input-'.repeat(80)
  const elapsed = await field.evaluate((node, value) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!
    const started = performance.now()
    for (let index = 1; index <= 100; index += 1) {
      setter.call(node, value.slice(0, Math.ceil((value.length * index) / 100)))
      node.dispatchEvent(new Event('input', { bubbles: true }))
    }
    return performance.now() - started
  }, text)
  expect(elapsed).toBeLessThan(500)
  await expect(field).toHaveValue(text)
  await page.getByRole('button', { name: /Few-Shot/ }).first().click()
  await expect(page.getByRole('heading', { name: 'Few-Shot', exact: true })).toBeVisible()
})
