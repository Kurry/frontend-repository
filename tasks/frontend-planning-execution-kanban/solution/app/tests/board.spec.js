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
  await page.getByRole('button', { name: 'Export' }).click()
  await page.locator('[data-export-copy]:visible').click()

  await expect(page.getByText('The exact visible preview is on your clipboard.')).toBeVisible()
  await expect(page.locator('[aria-live="polite"]')).toContainText('Export copied to clipboard.')
  const clipboard = await page.evaluate(() => navigator.clipboard.readText())
  expect(clipboard).toContain('"board"')
  expect(clipboard).toContain('"cards"')
})
