import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('status filters show a union, preserve rollups, and clear reliably', async ({ page }) => {
  const total = page.locator('.rollup-total strong')
  await expect(total).toHaveText('9')

  await page.getByRole('checkbox', { name: 'Idle' }).check()
  await expect(page.locator('.agent-row')).toHaveCount(2)
  await page.getByRole('checkbox', { name: 'Running' }).check()
  await expect(page.locator('.agent-row')).toHaveCount(5)
  await expect(total).toHaveText('9')

  await page.getByRole('checkbox', { name: 'Idle' }).uncheck()
  await page.getByRole('checkbox', { name: 'Running' }).uncheck()
  await expect(page.locator('.agent-row')).toHaveCount(9)
})

test('timeline kind filtering never crashes and clearing restores entries', async ({ page }) => {
  await page.locator('.agent-row').filter({ hasText: 'Aster Finch' }).click()
  await page.getByRole('tab', { name: 'History' }).click()
  const timeline = page.locator('.timeline-list')
  await expect(timeline.locator('.timeline-item')).toHaveCount(2)

  await page.getByLabel('Timeline event kind').selectOption('status')
  await expect(timeline.locator('.timeline-item')).toHaveCount(2)
  await page.getByLabel('Timeline event kind').selectOption('retry')
  await expect(page.getByText('No timeline entries match this event kind.')).toBeVisible()
  await page.getByRole('button', { name: 'Clear filter' }).last().click()
  await expect(timeline.locator('.timeline-item')).toHaveCount(2)
})

test('seeded retry exposes a changing countdown and attempt counter', async ({ page }) => {
  await page.locator('.agent-row').filter({ hasText: 'Cinder Vale' }).click()
  await page.getByRole('tab', { name: 'Activity' }).click()
  const retry = page.locator('.step-row.status-retrying')
  await expect(retry).toContainText('Attempt 1 of 3')
  const first = await retry.locator('.backoff-copy').textContent()
  await expect(retry.locator('.backoff-copy')).not.toHaveText(first, { timeout: 2_500 })
  await expect(retry.locator('.backoff-copy')).toContainText(/Waiting \d+s before retry 2 of 3/)
})

test('registration validates bounds and double activation creates one animated row', async ({ page }) => {
  await page.getByRole('button', { name: 'Register Agent' }).first().click()
  const modal = page.locator('.cds--modal-container').filter({ hasText: 'Create the exact payload' })
  const submit = modal.getByRole('button', { name: 'Register Agent' })
  await expect(submit).toBeDisabled()
  for (const message of ['Name is required', 'Agent type is required', 'Editor integration is required', 'Access key is required']) {
    await expect(modal.locator('.cds--form-requirement').filter({ hasText: message })).toBeVisible()
  }

  await modal.getByLabel('Name').fill('A')
  await expect(modal.locator('.cds--form-requirement').filter({ hasText: 'Name must be 2 to 40 characters' })).toBeVisible()
  await modal.getByLabel('Name').fill('X'.repeat(41))
  await expect(modal.locator('.cds--form-requirement').filter({ hasText: 'Name must be 2 to 40 characters' })).toBeVisible()
  await modal.getByLabel('Access key').fill('invalid key!')
  await expect(modal.locator('.cds--form-requirement').filter({ hasText: 'Access key must be 16 to 64 characters' })).toBeVisible()
  await modal.getByRole('combobox', { name: 'Agent type' }).click()
  await page.getByRole('option', { name: 'Aster', exact: true }).click()
  await modal.getByRole('combobox', { name: 'Editor integration' }).click()
  await page.getByRole('option', { name: 'Vector', exact: true }).click()
  await modal.getByLabel('Access key').fill('K'.repeat(65))
  await expect(modal.locator('.cds--form-requirement').filter({ hasText: 'Access key must be 16 to 64 characters' })).toBeVisible()
  await modal.getByLabel('Access key').fill('invalid!key_12345678')
  await expect(modal.locator('.cds--form-requirement').filter({ hasText: 'Access key may use only letters, digits, hyphens, and underscores' })).toBeVisible()
  await modal.getByLabel('Access key').fill('delta_signal_key_2026')
  await modal.getByLabel('Name').fill('aster finch')
  await expect(modal.locator('.cds--form-requirement').filter({ hasText: 'Name must be unique (ignoring letter case)' })).toBeVisible()

  await modal.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.locator('.agent-row')).toHaveCount(9)
  await page.getByRole('button', { name: 'Register Agent' }).first().click()
  const reopened = page.locator('.cds--modal-container').filter({ hasText: 'Create the exact payload' })
  const reopenedSubmit = reopened.getByRole('button', { name: 'Register Agent' })
  await reopened.getByLabel('Name').fill('Delta Signal')
  await reopened.getByRole('combobox', { name: 'Agent type' }).click()
  await page.getByRole('option', { name: 'Aster', exact: true }).click()
  await reopened.getByRole('combobox', { name: 'Editor integration' }).click()
  await page.getByRole('option', { name: 'Vector', exact: true }).click()
  await reopened.getByLabel('Access key').fill('delta_signal_key_2026')
  await expect(reopenedSubmit).toBeEnabled()
  await reopenedSubmit.dblclick()

  const row = page.locator('.agent-row').filter({ hasText: 'Delta Signal' })
  await expect(row).toHaveCount(1)
  await expect(row).toHaveClass(/new-agent-row/)
  await expect(page.locator('.agent-row')).toHaveCount(10)
})

test('undo cancels a pending animated removal without a delayed delete', async ({ page }) => {
  await page.addInitScript(() => {
    const nativeSetTimeout = window.setTimeout
    window.setTimeout = (callback, delay, ...args) => nativeSetTimeout(callback, delay === 210 ? 1_000 : delay, ...args)
  })
  await page.reload()

  const row = page.locator('.agent-row').filter({ hasText: 'Aster Finch' })
  await row.getByRole('button', { name: 'Actions for Aster Finch' }).click()
  await page.getByRole('menuitem', { name: 'Remove' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Remove agent' }).click()
  await expect(row).toHaveClass(/agent-row-exit/)

  await page.getByRole('button', { name: 'Undo registry mutation' }).click()
  await expect(page.getByLabel('Notifications').getByText('Removal of Aster Finch canceled', { exact: true })).toBeVisible()
  await page.waitForTimeout(1_100)
  await expect(row).toHaveCount(1)
  await expect(page.locator('.agent-row')).toHaveCount(9)
})

test('a second removal stays open and reports the pending operation', async ({ page }) => {
  await page.addInitScript(() => {
    const nativeSetTimeout = window.setTimeout
    window.setTimeout = (callback, delay, ...args) => nativeSetTimeout(callback, delay === 210 ? 1_000 : delay, ...args)
  })
  await page.reload()

  const first = page.locator('.agent-row').filter({ hasText: 'Aster Finch' })
  await first.getByRole('button', { name: 'Actions for Aster Finch' }).click()
  await page.getByRole('menuitem', { name: 'Remove' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Remove agent' }).click()

  const second = page.locator('.agent-row').filter({ hasText: 'Cinder Vale' })
  await second.getByRole('button', { name: 'Actions for Cinder Vale' }).click()
  await page.getByRole('menuitem', { name: 'Remove' }).click()
  const dialog = page.getByRole('dialog').filter({ hasText: 'Remove Cinder Vale?' })
  await dialog.getByRole('button', { name: 'Remove agent' }).click()

  await expect(dialog).toBeVisible()
  await expect(page.getByLabel('Notifications').getByText('Another agent removal is already in progress', { exact: true })).toBeVisible()
})

test('bulk pause and resume preserve checkpoints, rollups, and toast feedback', async ({ page }) => {
  const runningNames = ['Aster Finch', 'Cinder Vale', 'Aster Rune']
  for (const name of runningNames) await page.getByRole('checkbox', { name: `Select ${name}` }).check()
  await page.getByRole('button', { name: 'Pause All' }).click()
  await expect(page.getByText('3 agents paused', { exact: true })).toBeVisible()
  for (const name of runningNames) await expect(page.locator('.agent-row').filter({ hasText: name })).toContainText('Paused')
  await expect(page.locator('.rollup-paused strong')).toHaveText('4')

  await page.locator('.agent-row').filter({ hasText: 'Aster Finch' }).click()
  await page.getByRole('tab', { name: 'Activity' }).click()
  await expect(page.locator('.checkpoint-copy')).toContainText('Checkpoint saved at')
  await page.getByRole('button', { name: 'Close agent detail' }).click()

  await page.getByRole('button', { name: 'Resume All' }).click()
  await expect(page.getByText('3 agents resumed', { exact: true })).toBeVisible()
  for (const name of runningNames) await expect(page.locator('.agent-row').filter({ hasText: name })).toContainText('Running')
})

test('export tracks live status mutations and offers print-ready feedback', async ({ page }) => {
  const row = page.locator('.agent-row').filter({ hasText: 'Aster Finch' })
  await row.getByRole('button', { name: 'Pause' }).click()
  await expect(row).toContainText('Paused')
  await page.getByRole('button', { name: 'Export fleet' }).first().click()

  await expect(page.getByRole('status')).toContainText('First snapshot in this session')
  await expect(page.locator('.json-preview')).toContainText('"name": "Aster Finch"')
  await expect(page.locator('.json-preview')).toContainText('"status": "paused"')
  await expect(page.getByRole('button', { name: 'Print summary' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Printable fleet summary' })).toContainText('Fleet total9')

  const exported = JSON.parse(await page.locator('.json-preview').textContent())
  await page.getByRole('button', { name: 'Close', exact: true }).last().click()
  await row.getByRole('button', { name: 'Resume' }).click()
  await page.getByRole('button', { name: 'Import fleet' }).first().click()
  const importModal = page.locator('.cds--modal-container').filter({ hasText: 'Paste a complete fleet JSON' })
  await importModal.getByLabel('Fleet JSON').fill(JSON.stringify(exported))
  await importModal.getByRole('button', { name: 'Import fleet' }).click()
  await expect(page.locator('.agent-row').filter({ hasText: 'Aster Finch' })).toContainText('Paused')
  await expect(page.locator('.rollup-paused strong')).toHaveText(String(exported.rollup.paused))

  await page.getByRole('button', { name: 'Export fleet' }).first().click()
  const roundTrip = JSON.parse(await page.locator('.json-preview').textContent())
  expect(roundTrip.agents).toEqual(exported.agents)
  expect(roundTrip.rollup).toEqual(exported.rollup)
})

test('reduced motion keeps controls usable and removes transition duration', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload()
  await page.getByRole('checkbox', { name: 'Offline' }).check()
  await expect(page.locator('.agent-row')).toHaveCount(2)
  const duration = await page.locator('.agent-row').first().evaluate((element) => getComputedStyle(element).transitionDuration)
  expect(duration).toMatch(/^(0\.001ms|1e-06s)$/)
})
