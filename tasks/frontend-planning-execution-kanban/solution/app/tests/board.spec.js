import { expect, test } from '@playwright/test'

const card = (page, id) => page.locator(`[data-card-id="${id}"]`)

async function dragCard(page, cardId, targetCardId) {
  const sourceBox = await card(page, cardId).boundingBox()
  const targetBox = await card(page, targetCardId).boundingBox()
  if (!sourceBox || !targetBox) throw new Error('Expected source and target cards to be visible')

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + 34)
  await page.mouse.down()
  await page.mouse.move(sourceBox.x + sourceBox.width / 2 + 10, sourceBox.y + 44, { steps: 4 })
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height * 0.8, { steps: 16 })
  await page.mouse.up()
}

const columnIds = async (page, column) => page.locator(`.column-${column} article.card-tile`).evaluateAll((items) => items.map((item) => item.dataset.cardId))

const exportPayload = async (page) => {
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  const text = await page.locator('pre[aria-label="json export preview"]:visible').textContent()
  return JSON.parse(text)
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('pointer drag moves a card at the indicated insertion position and updates counts', async ({ page }) => {
  const backlogCount = page.locator('.column-backlog .count-badge')
  const reviewCount = page.locator('.column-review .count-badge')
  await expect(backlogCount).toHaveText('4')
  await expect(reviewCount).toHaveText('3')

  await dragCard(page, 'card-tone-calibration', 'card-onboarding')

  await expect(backlogCount).toHaveText('3')
  await expect(reviewCount).toHaveText('4')
  await expect.poll(() => page.locator('.column-review article.card-tile').evaluateAll((cards) => cards.map((item) => item.dataset.cardId))).toEqual([
    'card-onboarding',
    'card-tone-calibration',
    'card-policy-extraction',
    'card-meeting-miner',
  ])
})

test('whitespace title reports an inline error without creating a card', async ({ page }) => {
  await page.getByRole('button', { name: 'Add Card to Backlog' }).click()
  const title = page.getByRole('textbox', { name: 'Title', exact: true })
  await title.fill('   ')
  await title.blur()

  await expect(page.locator('#create-title-error-msg')).toHaveText('Title is required.')
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Add Card', exact: true })).toBeDisabled()
  await expect(page.locator('.column-backlog article.card-tile')).toHaveCount(4)
})

test('Escape closes a prompt panel and returns focus to its chip', async ({ page }) => {
  const promptChip = card(page, 'card-tone-calibration').getByRole('button', { name: 'Calibrate customer tone' })
  await promptChip.click()
  await expect(page.getByRole('dialog', { name: 'Calibrate customer tone' })).toBeVisible()

  await page.keyboard.press('Escape')

  await expect(page.getByRole('dialog', { name: 'Calibrate customer tone' })).toBeHidden()
  await expect(promptChip).toBeFocused()
})

test('copy confirmation is announced from the live export drawer', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  await page.locator('[data-export-copy]:visible').click()

  await expect(page.getByText('The exact visible preview is on your clipboard.')).toBeVisible()
  await expect(page.locator('[aria-live="polite"]')).toContainText('Export copied to clipboard.')
  const clipboard = await page.evaluate(() => navigator.clipboard.readText())
  expect(clipboard).toContain('"board"')
  expect(clipboard).toContain('"cards"')
})

test('keyboard menu reorders both ways and moves across every column', async ({ page }) => {
  const target = card(page, 'card-long-context')
  const openMenu = async () => {
    await target.getByRole('button', { name: /Move Tune long-context synthesis prompt/ }).click()
  }

  const before = await columnIds(page, 'backlog')
  await openMenu()
  await page.getByRole('menuitem', { name: 'Move down' }).click()
  const down = await columnIds(page, 'backlog')
  expect(down.indexOf('card-long-context')).toBe(before.indexOf('card-long-context') + 1)
  await openMenu()
  await page.getByRole('menuitem', { name: 'Move up' }).click()
  await expect.poll(() => columnIds(page, 'backlog')).toEqual(before)

  await openMenu()
  for (const name of ['Backlog', 'In Progress', 'Review', 'Done']) {
    await expect(page.getByRole('menuitem', { name: `Move to ${name}` })).toBeVisible()
  }
  await page.getByRole('menuitem', { name: 'Move to Review' }).click()
  await expect(card(page, 'card-long-context')).toHaveAttribute('data-column', 'review')
})

test('move, export, undo, and divergent create stay coherent', async ({ page }) => {
  await card(page, 'card-tone-calibration').getByRole('button', { name: /Move Calibrate/ }).click()
  await page.getByRole('menuitem', { name: 'Move to Review' }).click()
  let payload = await exportPayload(page)
  expect(payload.cards.find((item) => item.id === 'card-tone-calibration').column).toBe('review')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: /Undo/ }).click()
  await expect(card(page, 'card-tone-calibration')).toHaveAttribute('data-column', 'backlog')

  await page.getByRole('button', { name: 'Add Card to Backlog' }).click()
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('Divergent branch card')
  await page.getByRole('dialog').getByRole('button', { name: 'Add Card', exact: true }).click()
  await expect(page.getByRole('button', { name: /Redo/ })).toBeDisabled()
  payload = await exportPayload(page)
  expect(payload.cards.some((item) => item.title === 'Divergent branch card')).toBe(true)
})

test('retry state exposes palette, attempts, and ticking backoff', async ({ page }) => {
  test.setTimeout(15000)
  const failing = card(page, 'card-support-triage')
  await failing.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(failing.locator('.status-retrying')).toContainText('retrying', { timeout: 5000 })
  await expect(failing.locator('.backoff-copy')).toContainText('waiting 2s before retry 2 of 3')
  await expect(failing.locator('.backoff-copy')).toContainText('waiting 1s before retry 2 of 3', { timeout: 2500 })
  await expect(failing.locator('.task-attempt')).toContainText('attempt 2', { timeout: 5000 })
})

test('comment and imported board each round-trip through undo and redo', async ({ page }) => {
  const first = card(page, 'card-tone-calibration')
  await first.locator('.card-title').click()
  await expect(page.getByRole('textbox', { name: 'Add a comment' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Add a comment' }).fill('Undoable evidence comment')
  await page.getByRole('button', { name: 'Add comment' }).click()
  await expect(page.locator('.comment-thread:visible').getByText('Undoable evidence comment')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('textbox', { name: 'Add a comment' })).toBeHidden()
  await page.getByRole('button', { name: /Undo/ }).click()
  let payload = await exportPayload(page)
  expect(payload.cards.find((item) => item.id === 'card-tone-calibration').comments).toHaveLength(0)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: /Redo/ }).click()
  payload = await exportPayload(page)
  expect(payload.cards.find((item) => item.id === 'card-tone-calibration').comments[0].body).toBe('Undoable evidence comment')

  const baseline = payload
  await page.keyboard.press('Escape')
  baseline.board.name = 'Imported proof board'
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  await page.getByRole('textbox', { name: 'Import' }).fill(JSON.stringify(baseline))
  await page.getByRole('button', { name: 'Import Board' }).click()
  await expect(page.getByRole('heading', { name: 'Imported proof board' })).toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: /Undo/ }).click()
  await expect(page.getByRole('heading', { name: 'PromptOps Execution Board' })).toBeVisible()
  await page.getByRole('button', { name: /Redo/ }).click()
  await expect(page.getByRole('heading', { name: 'Imported proof board' })).toBeVisible()
})

test('bulk bar, toast lifecycle, flow insight, and mobile export remain observable', async ({ page }) => {
  await page.locator('.column-backlog input[type="checkbox"]').first().check({ force: true })
  const bulk = page.getByRole('region', { name: 'Bulk card actions' })
  await expect(bulk).toBeVisible()
  await expect(bulk).toHaveCSS('transition-duration', '0.19s, 0.19s')
  await bulk.getByRole('button', { name: 'Clear card selection' }).click()
  await expect(bulk).toBeHidden()

  await page.getByRole('button', { name: 'Add Card to Backlog' }).click()
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('Toast lifecycle proof')
  await page.getByRole('dialog').getByRole('button', { name: 'Add Card', exact: true }).click()
  const toast = page.getByText('Toast lifecycle proof was added to Backlog.')
  await expect(toast).toBeVisible()
  await expect(toast).toBeHidden({ timeout: 5000 })
  await expect(page.getByText(/Flow pulse/)).toBeVisible()

  await page.setViewportSize({ width: 375, height: 812 })
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  const drawer = page.getByRole('dialog', { name: 'Export & import' })
  await expect(drawer).toBeVisible()
  const box = await drawer.boundingBox()
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(375)
  await expect(drawer.getByRole('button', { name: 'Copy' }).first()).toBeVisible()
  await expect(drawer.getByRole('button', { name: 'Import Board' })).toBeVisible()
})
