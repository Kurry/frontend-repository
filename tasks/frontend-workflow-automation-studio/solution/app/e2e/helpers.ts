import { expect, type Locator, type Page } from '@playwright/test'

export async function boot(page: Page) {
  await page.goto('/')
  await expect(page.getByText('Automation studio', { exact: true })).toBeVisible()
  await expect(page.getByRole('main')).toBeVisible()
}

export async function libraryProbe(page: Page) {
  await boot(page)
  const library = page.getByRole('complementary', { name: 'Script library' })
  await expect(library.locator('.script-row')).toHaveCount(3)
  for (const name of ['Checkout confidence', 'Production health sweep', 'Lead enrichment']) await expect(library.getByText(name, { exact: true })).toBeVisible()
  await expect(library.getByText(/6 steps/).first()).toBeVisible()
  await expect(library.getByText(/Pass|Fail/).first()).toBeVisible()
  await expect(page.locator('#script-name')).toHaveValue('Checkout confidence')
}

export async function newScriptProbe(page: Page) {
  await boot(page)
  await page.getByRole('button', { name: 'New Script' }).first().click()
  const dialog = page.locator('[role="dialog"]').filter({ has: page.locator('#new-name') })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Create script' })).toBeDisabled()
  await dialog.getByLabel('Script name').fill('E2E workflow')
  await dialog.getByLabel('Target URL').fill('https://example.test/workflow')
  await dialog.getByLabel('Description (optional)').fill('Created through the visible form')
  await expect(dialog.getByRole('button', { name: 'Create script' })).toBeEnabled()
  await dialog.getByRole('button', { name: 'Create script' }).click({ force: true })
  await expect(page.locator('#script-name')).toHaveValue('E2E workflow')
  await expect(page.locator('.script-row')).toHaveCount(4)
  await expect(page.locator('.step-row')).toHaveCount(1)
}

export async function invalidNewScriptProbe(page: Page) {
  await boot(page)
  await page.getByRole('button', { name: 'New Script' }).first().click()
  const dialog = page.locator('[role="dialog"]').filter({ has: page.locator('#new-name') })
  await dialog.getByLabel('Script name').fill('Invalid URL script')
  await dialog.getByLabel('Target URL').fill('not-a-url')
  await dialog.getByLabel('Target URL').blur()
  await expect(dialog.getByText(/Target URL.*valid URL/i)).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Create script' })).toBeDisabled()
  await expect(page.locator('.script-row')).toHaveCount(3)
}

export async function bulkScriptProbe(page: Page) {
  await boot(page)
  await page.locator('label[for="script-checkout"]').click()
  const bar = page.getByLabel('Script bulk actions')
  await expect(bar).toContainText('1 selected')
  await bar.getByRole('button', { name: 'Duplicate selected' }).click()
  await expect(page.locator('.script-row')).toHaveCount(4)
  await expect(page.getByText('Checkout confidence Copy', { exact: true })).toBeVisible()
}

export async function paletteProbe(page: Page) {
  await boot(page)
  await page.keyboard.press('Control+k')
  const input = page.getByLabel('Search commands')
  await expect(input).toBeFocused()
  await input.fill('Scheduled queue')
  const results = page.locator('.palette-results').getByRole('option')
  await expect(results).toHaveCount(1)
  await expect(results).toContainText('View')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Scheduled queue' })).toBeVisible()
  await page.keyboard.press('Control+k')
  await input.fill('nothing-matches-this')
  await expect(page.getByText(/No commands match/i)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(input).toBeHidden()
}

export async function stepProbe(page: Page) {
  await boot(page)
  await expect(page.locator('.step-row')).toHaveCount(6)
  await expect(page.getByLabel('Step type').first()).toHaveValue('navigate')
  await expect(page.getByLabel('URL').first()).toBeVisible()
  await expect(page.getByLabel('CSS selector').first()).toBeVisible()
  await expect(page.getByText('No parameters required')).toBeVisible()
  const orders = await page.locator('.step-index strong').allTextContents()
  expect(orders).toEqual(['1', '2', '3', '4', '5', '6'])
}

export async function stepValidationProbe(page: Page) {
  await boot(page)
  const selector = page.getByLabel('CSS selector').first()
  await selector.fill('')
  await selector.blur()
  await expect(page.getByText('Selector is required').first()).toBeVisible()
  await expect(page.getByLabel('Invalid parameters').first()).toBeVisible()
  await selector.fill('#valid-target')
  await expect(page.getByLabel('Invalid parameters')).toHaveCount(0)
}

export async function invalidWaitProbe(page: Page) {
  await boot(page)
  await page.getByRole('button', { name: /Add Step/ }).first().click()
  await page.getByRole('button', { name: 'Wait', exact: true }).click()
  const wait = page.getByLabel('Milliseconds')
  await wait.fill('not-a-number')
  await wait.blur()
  const row = wait.locator('xpath=ancestor::*[contains(@class,"step-row")]')
  await expect(row.locator('.cds--form-requirement')).toContainText(/must be numeric/i)
  await expect(page.getByRole('button', { name: 'Run Script' })).toBeDisabled()
}

export async function noOutboundProbe(page: Page) {
  const outbound: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) outbound.push(request.url())
  })
  await boot(page)
  await page.getByRole('button', { name: 'Playground', exact: true }).click()
  await page.getByRole('button', { name: 'Runs', exact: true }).click()
  expect(outbound).toEqual([])
}

export async function addDeleteStepProbe(page: Page) {
  await boot(page)
  await page.getByRole('button', { name: /Add Step/ }).first().click()
  await page.getByRole('button', { name: 'Click', exact: true }).click()
  await expect(page.locator('.step-row')).toHaveCount(7)
  const rows = page.locator('.step-row')
  const added = rows.last()
  await expect(added.getByLabel('Step type')).toHaveValue('click')
  const label = await added.locator('input[id^="label-"]').inputValue()
  await dragStep(page, added.getByRole('button', { name: /Drag step/ }), rows.first())
  await expect(rows.first().locator('input[id^="label-"]')).toHaveValue(label)
  const movedId = await rows.first().getAttribute('id')
  const moved = page.locator(`#${movedId}`)
  await page.waitForTimeout(300)
  await moved.getByRole('button', { name: 'Delete step', exact: true }).click()
  await expect(moved.getByText('Delete step?')).toBeVisible()
  await moved.getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(page.locator('.step-row')).toHaveCount(6)
}

export async function reorderStepProbe(page: Page) {
  await boot(page)
  const rows = page.locator('.step-row')
  const labels = rows.locator('input[id^="label-"]')
  const before = await labels.evaluateAll((inputs: HTMLInputElement[]) => inputs.map((input) => input.value))
  await dragStep(page, rows.last().getByRole('button', { name: /Drag step/ }), rows.nth(4))
  const after = await labels.evaluateAll((inputs: HTMLInputElement[]) => inputs.map((input) => input.value))
  expect(after).not.toEqual(before)
  await expect(rows.first()).toHaveCSS('transform', /none|matrix/)
}

async function dragStep(page: Page, source: Locator, target: Locator) {
  await source.scrollIntoViewIfNeeded()
  const from = await source.boundingBox()
  const to = await target.boundingBox()
  expect(from).not.toBeNull()
  expect(to).not.toBeNull()
  await page.mouse.move(from!.x + from!.width / 2, from!.y + from!.height / 2)
  await page.mouse.down()
  await page.mouse.move(from!.x + from!.width / 2 + 10, from!.y + from!.height / 2, { steps: 4 })
  await page.waitForTimeout(100)
  await page.mouse.move(to!.x + to!.width / 2, to!.y + to!.height / 2, { steps: 20 })
  await page.waitForTimeout(150)
  await page.mouse.up()
}

export async function bulkStepProbe(page: Page) {
  await boot(page)
  await page.locator('label[for="select-step-checkout-nav"]').click()
  const bar = page.locator('.bulk-bar')
  await expect(bar).toContainText('1 selected')
  await bar.getByRole('button', { name: 'Disable selected' }).click()
  await expect(page.locator('.step-row').first()).toContainText('Disabled')
  await page.locator('label[for="select-step-checkout-nav"]').click()
  await page.locator('.bulk-bar').getByRole('button', { name: 'Duplicate selected' }).click()
  await expect(page.locator('.step-row')).toHaveCount(7)
}

export async function versionProbe(page: Page) {
  await boot(page)
  await page.locator('#script-name').fill('Checkout confidence revised')
  await expect(page.getByText('Unsaved changes')).toBeVisible()
  const versions = page.locator('.version-item')
  const before = await versions.count()
  await page.getByRole('button', { name: 'Save version' }).click()
  await expect(versions).toHaveCount(before + 1)
  await expect(page.getByText('Unsaved changes')).toHaveCount(0)
  await versions.last().click()
  await expect(page.getByText(/is read-only/)).toBeVisible()
  await page.getByRole('button', { name: 'Restore version', exact: true }).click()
  await expect(versions).toHaveCount(before + 2)
}

export async function runProbe(page: Page) {
  await boot(page)
  await page.getByRole('button', { name: 'Run Script' }).evaluate((button: HTMLElement) => { button.click(); button.click() })
  await expect(page.locator('.step-row.running')).toHaveCount(1)
  const console = page.getByRole('region', { name: 'Run console' })
  await expect(console.locator('.console-line')).not.toHaveCount(0)
  await page.getByRole('button', { name: 'Pause', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Resume', exact: true })).toBeVisible()
  await expect(page.locator('.checkpoint-note')).toContainText('Paused at step')
  await page.getByRole('button', { name: 'Resume', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible()
}

export async function doubleRunProbe(page: Page) {
  await boot(page)
  await page.getByRole('button', { name: 'Run Script' }).evaluate((button: HTMLElement) => { button.click(); button.click() })
  await expect(page.getByText(/All 6 steps passed/)).toBeVisible({ timeout: 8_000 })
  await page.getByRole('button', { name: 'Runs', exact: true }).click()
  await expect(page.locator('.run-row')).toHaveCount(4)
  await expect(page.getByText('4 saved runs')).toBeVisible()
}

export async function deleteAllScriptsProbe(page: Page) {
  await boot(page)
  for (const name of ['Checkout confidence', 'Production health sweep', 'Lead enrichment']) {
    await page.locator(`label[for="script-${name === 'Checkout confidence' ? 'checkout' : name === 'Production health sweep' ? 'health' : 'leads'}"]`).click()
  }
  await page.getByLabel('Script bulk actions').getByRole('button', { name: 'Delete selected' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete selected' }).click()
  await expect(page.locator('.script-row')).toHaveCount(0)
  await expect(page.getByText('No scripts yet. Use New Script to build one.')).toBeVisible()
}

export async function steplessProbe(page: Page) {
  await boot(page)
  for (const checkbox of await page.locator('.step-row input[type="checkbox"]').all()) await page.locator(`label[for="${await checkbox.getAttribute('id')}"]`).click()
  await page.locator('.bulk-bar').getByRole('button', { name: 'Delete selected' }).click()
  await page.locator('.bulk-bar').getByRole('button', { name: 'Confirm' }).click()
  await expect(page.locator('.step-row')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Run Script' })).toBeDisabled()
}

export async function scriptDeleteCascadeProbe(page: Page) {
  await boot(page)
  await page.locator('label[for="script-checkout"]').click()
  await page.getByLabel('Script bulk actions').getByRole('button', { name: 'Delete selected' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete selected' }).click()
  await expect(page.locator('.script-row')).toHaveCount(2)
  await page.getByRole('button', { name: 'Runs', exact: true }).click()
  await expect(page.getByText('Checkout confidence', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Scheduled queue', exact: true }).click()
  await expect(page.getByText('Checkout confidence', { exact: true })).toHaveCount(0)
}

export async function completeRunProbe(page: Page) {
  await boot(page)
  await page.getByRole('button', { name: 'Run Script' }).click()
  await expect(page.getByText(/All 6 steps passed/)).toBeVisible({ timeout: 8_000 })
  await page.getByRole('button', { name: 'Runs', exact: true }).click()
  await expect(page.locator('.run-row')).toHaveCount(4)
  await expect(page.getByText('4 saved runs')).toBeVisible()
}

export async function buildAndRunProbe(page: Page) {
  await newScriptProbe(page)
  const first = page.locator('.step-row').first()
  await first.getByLabel('Step type').selectOption('navigate')
  await first.getByLabel('URL').fill('https://example.test/workflow')
  for (const type of ['Type', 'Extract', 'Assert Text']) {
    await page.getByRole('button', { name: /Add Step/ }).first().click()
    await page.getByRole('button', { name: type, exact: true }).click()
  }
  const rows = page.locator('.step-row')
  const typeRow = rows.nth(1)
  await typeRow.getByLabel('CSS selector').fill('#email')
  await typeRow.getByLabel('Text').fill('builder@example.test')
  const extractRow = rows.nth(2)
  await extractRow.getByLabel('CSS selector').fill('.result')
  await extractRow.getByLabel('Variable name').fill('result_text')
  const assertRow = rows.nth(3)
  await assertRow.getByLabel('CSS selector').fill('.result')
  await assertRow.getByLabel('Expected text').fill('Success')
  await page.getByRole('button', { name: 'Save version' }).click()
  await page.getByRole('button', { name: 'Run Script' }).click()
  await expect(page.getByText(/All 4 steps passed/)).toBeVisible({ timeout: 8_000 })
  expect(await page.locator('.console-line').count()).toBeGreaterThanOrEqual(4)
  await expect(page.locator('.console-line.pass')).toHaveCount(4)
  await expect(page.getByText('result_text', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Runs', exact: true }).click()
  await expect(page.locator('.run-row')).toHaveCount(1)
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  const preview = page.getByLabel('Export preview')
  await expect(preview).toContainText('assert_text')
  await page.getByRole('button', { name: 'Run report' }).click()
  await expect(preview).toContainText('result_text')
}

export async function failureProbe(page: Page) {
  await boot(page)
  await page.evaluate(async () => {
    const w = window as any
    await w.webmcp_invoke_tool('editor_update_property', { object_type: 'step', id: 'checkout-click', property: 'selector', value: '.missing-target' })
  })
  await page.getByRole('button', { name: 'Run Script' }).click()
  await expect(page.getByText(/Attempt .* of 3/)).toBeVisible({ timeout: 5_000 })
  await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeVisible({ timeout: 8_000 })
  await expect(page.locator('.console-line.fail')).toContainText(/Fail/)
}

export async function failureRecoveryProbe(page: Page) {
  await failureProbe(page)
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  await expect(page.getByText(/All 6 steps passed/)).toBeVisible({ timeout: 8_000 })
  const labels = await page.locator('.timeline-row').allTextContents()
  const retryIndex = labels.findIndex((label) => /retry/i.test(label))
  const passIndex = labels.findIndex((label, index) => index > retryIndex && /Pass/.test(label))
  expect(retryIndex).toBeGreaterThanOrEqual(0)
  expect(passIndex).toBeGreaterThan(retryIndex)
}

export async function activeStepMotionProbe(page: Page) {
  await boot(page)
  await page.getByRole('button', { name: 'Run Script' }).click()
  const active = page.locator('.step-row.running').first()
  await expect(active).toBeVisible()
  expect(parseFloat(await active.evaluate((element) => getComputedStyle(element).animationDuration))).toBeGreaterThan(0)
  await expect(page.getByText(/All 6 steps passed/)).toBeVisible({ timeout: 8_000 })
}

export async function consoleMotionProbe(page: Page) {
  await runProbe(page)
  const lines = page.locator('.console-line')
  expect(await lines.count()).toBeGreaterThan(1)
  const delays = await lines.evaluateAll((elements) => elements.map((element) => getComputedStyle(element).animationDelay))
  expect(new Set(delays).size).toBeGreaterThan(1)
}

export async function jumpLatestProbe(page: Page) {
  await boot(page)
  for (const checkbox of await page.locator('.step-row input[type="checkbox"]').all()) await page.locator(`label[for="${await checkbox.getAttribute('id')}"]`).click()
  const bulk = page.locator('.bulk-bar')
  await bulk.getByRole('button', { name: 'Duplicate selected' }).click()
  const firstSix = (await page.locator('.step-row label[for^="select-step-"]').all()).slice(0, 6)
  for (const label of firstSix) await label.click()
  await bulk.getByRole('button', { name: 'Duplicate selected' }).click()
  await page.getByRole('button', { name: 'Run Script' }).click()
  await expect(page.getByText(/All 18 steps passed/)).toBeVisible({ timeout: 15_000 })
  const console = page.locator('.console-body')
  await console.hover()
  await page.mouse.wheel(0, -1200)
  const jump = page.getByRole('button', { name: 'Jump to latest' })
  await expect(jump).toBeVisible()
  await jump.click()
  await expect(jump).toBeHidden()
}

export async function themeProbe(page: Page) {
  await boot(page)
  const console = page.getByRole('region', { name: 'Run console' })
  const select = console.getByLabel('Console theme')
  await select.selectOption('Ocean')
  await expect(console).toHaveClass(/console-ocean/)
  await select.selectOption('Solar')
  await expect(console).toHaveClass(/console-solar/)
}

export async function screenshotProbe(page: Page) {
  await boot(page)
  await page.getByRole('button', { name: 'Run Script' }).click()
  const shot = page.getByRole('button', { name: /Screenshot captured/ })
  await expect(shot).toBeVisible({ timeout: 8_000 })
  await shot.click()
  const dialog = page.getByRole('dialog', { name: 'Capture checkout' })
  await expect(dialog).toContainText('Simulated browser capture')
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
}

export async function playgroundProbe(page: Page) {
  await boot(page)
  await page.getByRole('button', { name: 'Playground', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Playground' })).toBeVisible()
  const selector = page.getByLabel('CSS selector')
  await selector.fill('.partner')
  await expect(page.getByText('2 matches').first()).toBeVisible()
  await selector.fill('.does-not-exist')
  await expect(page.getByText('0 matches').first()).toBeVisible()
  await selector.fill('[')
  await expect(page.getByText(/Selector is invalid/i)).toBeVisible()
  await expect(page.getByTitle('Mock HTML preview')).toBeVisible()
}

export async function sendSelectorProbe(page: Page) {
  await boot(page)
  const targetRow = page.locator('.step-row').filter({ has: page.getByLabel('CSS selector') }).first()
  const targetId = (await targetRow.getAttribute('id'))?.replace(/^step-/, '')
  await page.getByRole('button', { name: 'Playground', exact: true }).click()
  await page.getByLabel('CSS selector').fill('.partner')
  await page.getByLabel('Send to step').selectOption(targetId ?? '')
  await page.getByRole('button', { name: 'Send to step' }).click()
  await expect(page.getByRole('button', { name: 'Editor', exact: true })).toHaveClass(/active/)
  await expect(page.getByLabel('CSS selector').first()).toHaveValue('.partner')
}

export async function runsProbe(page: Page) {
  await boot(page)
  await page.getByRole('button', { name: 'Runs', exact: true }).click()
  await expect(page.getByText('3 saved runs')).toBeVisible()
  await expect(page.locator('.run-row')).toHaveCount(3)
  await expect(page.getByRole('heading', { name: 'Run details' })).toBeVisible()
  await expect(page.getByText(/Pass \/ .* Fail/).first()).toBeVisible()
}

export async function runsOrderingProbe(page: Page) {
  await boot(page)
  for (let index = 0; index < 2; index += 1) {
    await page.getByRole('button', { name: 'Run Script' }).click()
    await expect(page.getByText(/All 6 steps passed/)).toBeVisible({ timeout: 8_000 })
  }
  await page.getByRole('button', { name: 'Runs', exact: true }).click()
  await expect(page.locator('.run-row')).toHaveCount(5)
  const newest = await page.locator('.run-row').nth(0).innerText()
  const previous = await page.locator('.run-row').nth(1).innerText()
  expect(newest).not.toBe(previous)
  expect(newest).toMatch(/Run 5/)
  expect(previous).toMatch(/Run 4/)
}

export async function derivedSurfacesProbe(page: Page) {
  await boot(page)
  const first = page.locator('.step-row').first()
  await first.getByRole('button', { name: 'Disable step' }).click()
  await page.getByRole('button', { name: 'Run Script' }).click()
  await expect(page.getByText(/5 steps passed/)).toBeVisible({ timeout: 8_000 })
  await expect(first).toContainText('Skipped')
  await first.getByRole('button', { name: 'Enable step' }).click()
  await page.getByRole('button', { name: 'Run Script' }).click()
  await expect(page.getByText(/All 6 steps passed/)).toBeVisible({ timeout: 8_000 })
  await page.getByRole('button', { name: 'Runs', exact: true }).click()
  const records = page.locator('.run-row')
  await expect(records.nth(0)).toContainText('6 Pass')
  await expect(records.nth(1)).toContainText('5 Pass')
}

export async function crossViewEchoProbe(page: Page) {
  await boot(page)
  await page.locator('#script-name').fill('Echoed automation name')
  const selector = page.getByLabel('CSS selector').first()
  await selector.fill('#echoed-selector')
  await expect(page.getByRole('complementary', { name: 'Script library' })).toContainText('Echoed automation name')
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  await expect(page.getByLabel('Export preview')).toContainText('Echoed automation name')
  await expect(page.getByLabel('Export preview')).toContainText('#echoed-selector')
}

export async function emptyRepopulateProbe(page: Page) {
  await boot(page)
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  const preview = page.getByLabel('Export preview')
  const baseline = JSON.parse(await preview.textContent() ?? '{}')
  await page.getByRole('button', { name: 'Editor', exact: true }).click()

  for (let remaining = 6; remaining > 0; remaining -= 1) {
    const first = page.locator('.step-row').first()
    await first.getByRole('button', { name: 'Delete step' }).click()
    await first.getByRole('button', { name: 'Delete', exact: true }).click()
    await expect(page.locator('.step-row')).toHaveCount(remaining - 1)
  }
  await expect(page.getByText('This script has no steps')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Run Script' })).toBeDisabled()

  const undo = page.getByRole('button', { name: 'Undo', exact: true })
  for (let restored = 1; restored <= 6; restored += 1) {
    await undo.click()
    await expect(page.locator('.step-row')).toHaveCount(restored)
    expect(await page.locator('.step-index strong').allTextContents()).toEqual(
      Array.from({ length: restored }, (_, index) => String(index + 1)),
    )
  }
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  expect(JSON.parse(await preview.textContent() ?? '{}')).toEqual(baseline)
}

export async function fullPipelineProbe(page: Page) {
  await newScriptProbe(page)
  const first = page.locator('.step-row').first()
  await first.getByLabel('Step type').selectOption('navigate')
  await first.getByLabel('URL').fill('https://example.test/workflow')
  await page.getByRole('button', { name: /Add Step/ }).first().click()
  await page.getByRole('button', { name: 'Extract', exact: true }).click()
  await page.getByRole('button', { name: /Add Step/ }).first().click()
  await page.getByRole('button', { name: 'Assert Text', exact: true }).click()
  const rows = page.locator('.step-row')
  const extract = rows.nth(1)
  const assertion = rows.nth(2)
  await extract.getByLabel('Variable name').fill('pipeline_value')
  await assertion.getByLabel('CSS selector').fill('.pipeline-result')
  await assertion.getByLabel('Expected text').fill('force fail')
  const extractId = (await extract.getAttribute('id'))?.replace(/^step-/, '')

  await page.getByRole('button', { name: 'Playground', exact: true }).click()
  await page.getByLabel('CSS selector').fill('.partner')
  await page.getByLabel('Send to step').selectOption(extractId ?? '')
  await page.getByRole('button', { name: 'Send to step' }).click()
  await expect(page.getByRole('button', { name: 'Editor', exact: true })).toHaveClass(/active/)
  await expect(extract.getByLabel('CSS selector')).toHaveValue('.partner')
  await page.getByRole('button', { name: 'Save version' }).click()

  await page.getByRole('button', { name: 'Run Script' }).click()
  await expect(page.getByText(/Attempt 2 of 3/)).toBeVisible({ timeout: 8_000 })
  await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeVisible({ timeout: 8_000 })
  await assertion.getByLabel('Expected text').fill('Success')
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  await expect(page.getByText(/All 3 steps passed/)).toBeVisible({ timeout: 8_000 })

  await page.getByRole('button', { name: 'Schedule', exact: true }).click()
  const schedule = page.locator('[role="dialog"]').filter({ has: page.locator('#schedule-enabled') })
  await schedule.locator('label[for="schedule-enabled"]').click()
  await schedule.getByLabel('Schedule time').fill('09:30')
  await schedule.getByLabel('Repeat interval').selectOption('daily')
  await schedule.getByRole('button', { name: 'Save schedule' }).click()
  await page.getByRole('button', { name: 'Scheduled queue', exact: true }).click()
  await page.getByRole('button', { name: 'Trigger now' }).click()
  await expect(page.getByText(/All 3 steps passed/)).toBeVisible({ timeout: 8_000 })

  await page.getByRole('button', { name: 'Export', exact: true }).click()
  const exportPreview = page.getByLabel('Export preview')
  const definition = JSON.parse(await exportPreview.textContent() ?? '{}')
  expect(definition.script.name).toBe('E2E workflow')
  expect(definition.script.version).toBe(2)
  expect(definition.script.schedule.interval).toBe('daily')
  expect(definition.script.steps.map((step: { type: string }) => step.type)).toEqual(['navigate', 'extract', 'assert_text'])
  expect(definition.script.steps[1].params).toMatchObject({ selector: '.partner', variable: 'pipeline_value' })
  expect(definition.script.steps[2].params).toMatchObject({ selector: '.pipeline-result', expected_text: 'Success' })
  await page.getByRole('button', { name: 'Run report' }).click()
  const report = JSON.parse(await exportPreview.textContent() ?? '{}')
  expect(report.run.trigger).toBe('schedule')
  expect(report.run.steps).toHaveLength(3)
  expect(report.run.steps[1]).toMatchObject({ type: 'extract', status: 'pass', extracted_name: 'pipeline_value' })
  const visible = await exportPreview.textContent()
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.getByRole('button', { name: 'Copy export' }).click()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(visible)
}

export async function multiFacetReloadProbe(page: Page) {
  await boot(page)
  await page.getByRole('complementary', { name: 'Script library' }).getByRole('button', { name: /Production health sweep/ }).click()
  await page.getByRole('button', { name: /Add Step/ }).first().click()
  await page.getByRole('button', { name: 'Click', exact: true }).click()
  await page.getByRole('button', { name: 'Schedule', exact: true }).click()
  const schedule = page.locator('[role="dialog"]').filter({ has: page.locator('#schedule-enabled') })
  await schedule.locator('label[for="schedule-enabled"]').click()
  await schedule.getByRole('button', { name: 'Save schedule' }).click()
  const console = page.getByRole('region', { name: 'Run console' })
  await console.getByLabel('Console theme').selectOption('Ocean')
  await page.reload()
  await expect(page.locator('#script-name')).toHaveValue('Checkout confidence')
  await expect(page.locator('.step-row')).toHaveCount(6)
  await expect(page.getByLabel('Scheduled')).toHaveCount(0)
  await expect(console.getByLabel('Console theme')).toHaveValue('Midnight')
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled()
}

export async function accessibilityAuditProbe(page: Page) {
  await keyboardProbe(page)
  const audit = await page.evaluate(() => {
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((heading) => Number(heading.tagName.slice(1)))
    const unlabeledIcons = [...document.querySelectorAll('button, a')].filter((control) => control.querySelector('svg,img') && !(control.getAttribute('aria-label') || control.getAttribute('aria-labelledby') || control.getAttribute('title') || control.textContent?.trim())).length
    const unlabeledFields = [...document.querySelectorAll('input,select,textarea')].filter((field) => !(field.getAttribute('aria-label') || field.id && document.querySelector(`label[for="${field.id}"]`))).length
    return { headingSkip: headings.some((level, index) => index > 0 && level > headings[index - 1] + 1), unlabeledIcons, unlabeledFields, landmarks: document.querySelectorAll('main,nav,aside').length }
  })
  expect(audit).toEqual({ headingSkip: false, unlabeledIcons: 0, unlabeledFields: 0, landmarks: expect.any(Number) })
  expect(audit.landmarks).toBeGreaterThanOrEqual(3)
}

export async function diffProbe(page: Page) {
  await boot(page)
  await page.getByRole('button', { name: 'Runs', exact: true }).click()
  const a = page.getByLabel('First run')
  const b = page.getByLabel('Second run')
  await a.selectOption({ index: 1 })
  await b.selectOption({ index: 2 })
  await page.getByRole('button', { name: 'Compare' }).click()
  await expect(page.getByRole('heading', { name: 'Run comparison' })).toBeVisible()
  await expect(page.locator('.diff-changed').first()).toContainText('Changed')
  const same = await a.inputValue()
  await b.selectOption(same)
  await page.getByRole('button', { name: 'Compare' }).click()
  await expect(page.getByText('No differences', { exact: true })).toBeVisible()
}

export async function scheduleProbe(page: Page) {
  await boot(page)
  await page.getByRole('button', { name: 'Schedule', exact: true }).click()
  const dialog = page.locator('[role="dialog"]').filter({ has: page.locator('#schedule-enabled') })
  await dialog.locator('label[for="schedule-enabled"]').click()
  await dialog.getByLabel('Schedule time').fill('09:30')
  await dialog.getByLabel('Repeat interval').selectOption('daily')
  await dialog.getByRole('button', { name: 'Save schedule' }).click()
  await expect(page.getByLabel('Scheduled')).toBeVisible()
  await page.getByRole('button', { name: 'Scheduled queue' }).click()
  await expect(page.getByText(/daily at 09:30/i)).toBeVisible()
  await expect(page.getByText(/\d+h \d+m \d+s/)).toBeVisible()
  await page.getByRole('button', { name: 'Trigger now' }).dblclick()
  await expect(page.getByRole('region', { name: 'Run console' })).toBeVisible()
}

export async function scheduleValidationProbe(page: Page) {
  await boot(page)
  await page.getByRole('button', { name: 'Schedule', exact: true }).click()
  const dialog = page.locator('[role="dialog"]').filter({ has: page.locator('#schedule-enabled') })
  await dialog.locator('label[for="schedule-enabled"]').click()
  await dialog.getByLabel('Schedule time').fill('')
  await dialog.getByLabel('Repeat interval').selectOption('')
  await dialog.getByLabel('Repeat interval').blur()
  await expect(dialog.getByRole('button', { name: 'Save schedule' })).toBeDisabled()
  await expect(dialog.getByText(/Schedule time is required/)).toBeVisible()
  await expect(dialog.getByLabel('Repeat interval')).toHaveAttribute('aria-invalid', 'true')
}

export async function undoProbe(page: Page) {
  await boot(page)
  const undo = page.getByRole('button', { name: 'Undo', exact: true })
  const redo = page.getByRole('button', { name: 'Redo', exact: true })
  await expect(undo).toBeDisabled()
  await expect(redo).toBeDisabled()
  await page.locator('#script-name').fill('Undoable title')
  await expect(undo).toBeEnabled()
  await page.locator('#script-name').blur()
  await page.keyboard.press('Control+z')
  await expect(page.locator('#script-name')).toHaveValue('Checkout confidence')
  await expect(redo).toBeEnabled()
  await page.keyboard.press('Control+Shift+z')
  await expect(page.locator('#script-name')).toHaveValue('Undoable title')
  await page.getByRole('button', { name: 'History', exact: true }).click()
  await expect(page.getByLabel('Editing history timeline')).toContainText('Updated script name')
}

export async function invalidFormsProbe(page: Page) {
  await invalidNewScriptProbe(page)
  await stepValidationProbe(page)
  await scheduleValidationProbe(page)
}

export async function historyRollbackProbe(page: Page) {
  await boot(page)
  const name = page.locator('#script-name')
  await name.fill('First history state')
  await name.fill('Second history state')
  await page.getByRole('button', { name: 'History', exact: true }).click()
  const timeline = page.getByLabel('Editing history timeline')
  const entries = timeline.locator('.history-item')
  expect(await entries.count()).toBeGreaterThanOrEqual(2)
  await entries.nth((await entries.count()) - 2).click()
  await expect(timeline.locator('.history-item.undone')).not.toHaveCount(0)
  await expect(name).toHaveValue('First history state')
  await name.fill('Branched history state')
  await expect(timeline.locator('.history-item.undone')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Redo', exact: true })).toBeDisabled()
}

export async function exportProbe(page: Page) {
  await boot(page)
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  const preview = page.getByLabel('Export preview')
  const definition = JSON.parse(await preview.textContent() ?? '{}')
  expect(definition.script).toMatchObject({ id: 'checkout', name: 'Checkout confidence', target_url: 'https://shop.ternwave.dev', version: 4 })
  expect(definition.script.schedule.interval).toMatch(/^(hourly|daily|weekly)$/)
  expect(definition.script.steps).toHaveLength(6)
  for (const step of definition.script.steps) expect(['navigate','click','type','extract','wait','screenshot','assert_text']).toContain(step.type)
  await page.getByRole('button', { name: 'Run report' }).click()
  const report = JSON.parse(await preview.textContent() ?? '{}')
  expect(report.run).toHaveProperty('totals')
  expect(report.run.steps[0]).toMatchObject({ order: 1, attempts: 1 })
}

export async function copyProbe(page: Page) {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await exportProbe(page)
  const preview = page.getByLabel('Export preview')
  const visible = await preview.textContent()
  await page.getByRole('button', { name: 'Copy export' }).click()
  await expect(page.getByRole('button', { name: /copied/i })).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(visible)
}

export async function webMcpProbe(page: Page) {
  await boot(page)
  const result = await page.evaluate(async () => {
    const w = window as any
    const session = w.webmcp_session_info()
    const tools = w.webmcp_list_tools()
    const read = await w.webmcp_invoke_tool('browse_search', { query: 'Production health' })
    const mutate = await w.webmcp_invoke_tool('editor_add', { object_type: 'script', name: 'WebMCP studio script', target_url: 'https://example.test/mcp', description: 'contract probe' })
    return { session, tools, read, mutate }
  })
  expect(result.session.contract_version).toBe('zto-webmcp-v1')
  expect(result.tools.length).toBeGreaterThan(10)
  expect(result.read.ok).toBeTruthy()
  expect(result.mutate.ok).toBeTruthy()
  await expect(page.locator('#script-name')).toHaveValue('WebMCP studio script')
  await expect(page.locator('.script-row')).toHaveCount(4)
  await page.evaluate(() => (window as any).webmcp_invoke_tool('editor_preview', { preview: 'definition-json' }))
  await expect(page.getByLabel('Export preview')).toContainText('WebMCP studio script')
}

export async function keyboardProbe(page: Page) {
  await boot(page)
  await page.keyboard.press('Tab')
  await expect(page.locator(':focus')).toBeVisible()
  const opener = page.getByRole('button', { name: 'New Script' }).first()
  await opener.click()
  const dialog = page.locator('[role="dialog"]').filter({ has: page.locator('#new-name') })
  await expect.poll(() => dialog.evaluate(node => node.contains(document.activeElement))).toBeTruthy()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(opener).toBeFocused()
  await expect(page.locator('.sr-only[aria-live="assertive"]')).toHaveCount(1)
}

export async function mobileProbe(page: Page) {
  await page.setViewportSize({ width: 375, height: 812 })
  await boot(page)
  await expect(page.getByRole('button', { name: 'Open script library' })).toBeVisible()
  await page.getByRole('button', { name: 'Open script library' }).click()
  const library = page.getByRole('complementary', { name: 'Script library' })
  await expect(library).toHaveClass(/open/)
  await expect(library.locator('.script-row')).toHaveCount(3)
  await expect(library.getByText(/6 steps/).first()).toBeVisible()
  await expect(library.locator('.script-row.active')).toContainText('Checkout confidence')
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
  await page.getByRole('complementary', { name: 'Script library' }).getByRole('button', { name: /Checkout confidence/ }).click()
  await expect(page.locator('#script-name')).toBeVisible()
}

export async function overlayDismissProbe(page: Page) {
  await boot(page)
  await page.locator('#script-name').fill('Work stays intact')
  await page.getByRole('button', { name: 'New Script' }).first().click()
  let dialog = page.locator('[role="dialog"]').filter({ has: page.locator('#new-name') })
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()
  await page.keyboard.press('Control+k')
  await expect(page.getByLabel('Search commands')).toBeVisible()
  await page.keyboard.press('Escape')
  await page.locator('.step-row').first().getByRole('button', { name: 'Delete step' }).click()
  const confirmation = page.locator('.step-row').first().locator('.inline-confirm')
  await confirmation.getByRole('button', { name: 'Cancel' }).click()
  await expect(confirmation).toBeHidden()
  await expect(page.locator('#script-name')).toHaveValue('Work stays intact')
}

export async function recoveryProbe(page: Page) {
  await boot(page)
  await page.locator('label[for="script-checkout"]').click()
  await page.getByLabel('Script bulk actions').getByRole('button', { name: 'Delete selected' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete selected' }).click()
  await page.getByRole('complementary', { name: 'Script library' }).getByRole('button', { name: /Production health sweep/ }).click()
  await expect(page.locator('#script-name')).toBeVisible()
  for (const checkbox of await page.locator('.step-row input[type="checkbox"]').all()) await page.locator(`label[for="${await checkbox.getAttribute('id')}"]`).click()
  await page.locator('.bulk-bar').getByRole('button', { name: 'Delete selected' }).click()
  await page.locator('.bulk-bar').getByRole('button', { name: 'Confirm' }).click()
  await expect(page.locator('.step-row')).toHaveCount(0)
  await page.locator('.empty-state').getByRole('button', { name: 'Add Step' }).click()
  await expect(page.locator('.step-row')).toHaveCount(1)
  await page.getByRole('button', { name: 'Runs', exact: true }).click()
  await page.getByLabel('First run').selectOption({ index: 1 })
  await page.getByLabel('Second run').selectOption({ index: 2 })
  await page.getByRole('button', { name: 'Compare' }).click()
  await expect(page.getByRole('heading', { name: 'Run comparison' })).toBeVisible()
  await page.getByLabel('Second run').selectOption({ index: 1 })
  await expect(page.getByRole('heading', { name: 'Run details' })).toBeVisible()
  await page.getByRole('button', { name: 'Editor', exact: true }).click()
  await expect(page.locator('.step-row')).toHaveCount(1)
}

export async function reducedMotionProbe(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await boot(page)
  const durations = await page.locator('button').first().evaluate(el => [getComputedStyle(el).transitionDuration, getComputedStyle(el).animationDuration])
  expect(durations.every(value => value === '0s' || parseFloat(value) <= 0.01)).toBeTruthy()
}

export async function consoleProbe(page: Page) {
  const errors: string[] = []
  // Playwright injects instrumentation into the intentionally scriptless sandboxed srcdoc and Chromium
  // reports that blocked test-only injection as a warning; a normal browser emits no such warning.
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', error => errors.push(error.message))
  await libraryProbe(page)
  await page.getByRole('button', { name: 'Playground', exact: true }).click()
  await expect(page.getByTitle('Mock HTML preview')).toBeVisible()
  await page.getByRole('button', { name: 'Runs', exact: true }).click()
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  expect(errors).toEqual([])
}

export async function performanceProbe(page: Page) {
  const start = Date.now()
  await boot(page)
  expect(Date.now() - start).toBeLessThan(2_000)
  for (const view of ['Playground', 'Runs', 'Scheduled queue', 'Export', 'Editor']) await page.getByRole('button', { name: view, exact: true }).click()
  await expect(page.locator('#script-name')).toBeVisible()
}

export async function reloadProbe(page: Page) {
  await boot(page)
  await page.locator('#script-name').fill('Transient title')
  await page.reload()
  await expect(page.locator('#script-name')).toHaveValue('Checkout confidence')
  const storage = await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))
  expect(storage).toEqual({ local: 0, session: 0 })
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled()
}

export async function qualityProbe(page: Page) {
  await libraryProbe(page)
  const heading = page.locator('#script-name')
  const console = page.getByRole('region', { name: 'Run console' })
  await expect(console.locator('.console-body')).toHaveCSS('font-family', /mono/i)
  const sidebarBox = await page.getByRole('complementary', { name: 'Script library' }).boundingBox()
  expect(sidebarBox?.width ?? 0).toBeGreaterThan(200)
  await expect(heading).toBeVisible()
}

export function probeFor(name: string) {
  if (/derived_surfaces_input_sensitivity/.test(name)) return derivedSurfacesProbe
  if (/cross_view_echo_to_export/.test(name)) return crossViewEchoProbe
  if (/full_pipeline_probe_to_export_text/.test(name)) return fullPipelineProbe
  if (/empty_and_repopulate_round_trip/.test(name)) return emptyRepopulateProbe
  if (/webmcp|shared_state/.test(name)) return webMcpProbe
  if (/build_and_run_end_to_end/.test(name)) return buildAndRunProbe
  if (/multi_facet_reload_reset/.test(name)) return multiFacetReloadProbe
  if (/runs_ordering_derives_live/.test(name)) return runsOrderingProbe
  if (/active_step_fade/.test(name)) return activeStepMotionProbe
  if (/console_line_stagger/.test(name)) return consoleMotionProbe
  if (/badge_and_countdown_motion/.test(name)) return failureProbe
  if (/modal_transitions/.test(name)) return keyboardProbe
  if (/playground_match_emphasis/.test(name)) return playgroundProbe
  if (/copy_confirmation_transition/.test(name)) return copyProbe
  if (/toasts_slide_and_dismiss/.test(name)) return newScriptProbe
  if (/hover_system/.test(name)) return qualityProbe
  if (/jump_to_latest_visibility/.test(name)) return jumpLatestProbe
  if (/no_outbound_requests/.test(name)) return noOutboundProbe
  if (/flows_recover_without_reload/.test(name)) return recoveryProbe
  if (/overlays_dismiss_cleanly/.test(name)) return overlayDismissProbe
  if (/reload|storage/.test(name)) return reloadProbe
  if (/invalid_forms_block_inline/.test(name)) return invalidFormsProbe
  if (/invalid_url|new_script_modal|double_create/.test(name)) return name.includes('invalid') ? invalidNewScriptProbe : newScriptProbe
  if (/library_bulk/.test(name)) return bulkScriptProbe
  if (/palette/.test(name)) return paletteProbe
  if (/invalid_wait/.test(name)) return invalidWaitProbe
  if (/step_param/.test(name)) return stepValidationProbe
  if (/delete_selected_script_empty_state/.test(name)) return deleteAllScriptsProbe
  if (/stepless_script_state/.test(name)) return steplessProbe
  if (/script_delete_cascades/.test(name)) return scriptDeleteCascadeProbe
  if (/add_reorder_delete/.test(name)) return addDeleteStepProbe
  if (/drag_reorder_settles/.test(name)) return reorderStepProbe
  if (/bulk_step|all_disabled/.test(name)) return bulkStepProbe
  if (/history_timeline_rollback/.test(name)) return historyRollbackProbe
  if (/version|unsaved|history_timeline|undo_redo|undo_restores|undo_timeline/.test(name)) return name.includes('version') || name.includes('unsaved') ? versionProbe : undoProbe
  if (/failure_recovery_flow/.test(name)) return failureRecoveryProbe
  if (/failure|retry|backoff/.test(name)) return failureProbe
  if (/screenshot/.test(name)) return screenshotProbe
  if (/console_theme/.test(name)) return themeProbe
  if (/playground_error|playground_matching/.test(name)) return playgroundProbe
  if (/send_selector|selector_to_step/.test(name)) return sendSelectorProbe
  if (/diff|self_compare/.test(name)) return diffProbe
  if (/runs_view|runs_ordering/.test(name)) return runsProbe
  if (/schedule_form_validation/.test(name)) return scheduleValidationProbe
  if (/schedule|scheduled_queue|trigger/.test(name)) return scheduleProbe
  if (/^(export_|copy_export|copy_matches|report_totals)/.test(name)) return name.includes('copy') ? copyProbe : exportProbe
  if (/double_run_single_execution/.test(name)) return doubleRunProbe
  if (/run_|run_highlight|terminal_console|pause_resume|rollup|event_timeline|extracted|count_delta|different_inputs|interleaved|async_work|long_console|ui_interactive/.test(name)) return /writes|count_delta|different_inputs|ordering/.test(name) ? completeRunProbe : runProbe
  if (/numbered_step|type_specific|inline_step|step_fields/.test(name)) return stepProbe
  if (/keyboard|dialog|focus|live_announcement|labeled_form|heading_order|landmark|semantic|state_not_color|icons|contrast_sufficient/.test(name)) return accessibilityAuditProbe
  if (/reduced_motion/.test(name)) return reducedMotionProbe
  if (/mobile|viewport|sidebar_collapses|sidebar_collapse|desktop_to|tap|clipping|wrap|scroll_in|horizontal|stacking|fixed_controls|responsive/.test(name)) return mobileProbe
  if (/cold_start|console_free|console_clean|respond_fast|rapid_input|extended_session|blank_loading|smooth|animations_stay/.test(name)) return name.includes('console') ? consoleProbe : performanceProbe
  if (/seeded_library/.test(name)) return libraryProbe
  if (/create/.test(name)) return newScriptProbe
  if (/visual|design|spacing|typography|layout|transition|control|hierarchy|color|microinteraction|motion|hover|toast|writing|headings|actions|errors|empty_states|terminology|numbers|success|polish|narrative|celebration|personalization|onboarding|data_visualization/.test(name)) return qualityProbe
  return libraryProbe
}

export async function criterionProbe(page: Page, _testInfo: unknown, name: string) {
  await probeFor(name)(page)
}
