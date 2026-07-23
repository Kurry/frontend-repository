# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: fleet.spec.js >> reduced motion keeps controls usable and removes transition duration
- Location: tests/fleet.spec.js:181:1

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:3656/
Call log:
  - navigating to "http://127.0.0.1:3656/", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | 
  3   | test.beforeEach(async ({ page }) => {
> 4   |   await page.goto('/')
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:3656/
  5   | })
  6   | 
  7   | test('status filters show a union, preserve rollups, and clear reliably', async ({ page }) => {
  8   |   const total = page.locator('.rollup-total strong')
  9   |   await expect(total).toHaveText('9')
  10  | 
  11  |   await page.getByRole('checkbox', { name: 'Idle' }).check()
  12  |   await expect(page.locator('.agent-row')).toHaveCount(2)
  13  |   await page.getByRole('checkbox', { name: 'Running' }).check()
  14  |   await expect(page.locator('.agent-row')).toHaveCount(5)
  15  |   await expect(total).toHaveText('9')
  16  | 
  17  |   await page.getByRole('checkbox', { name: 'Idle' }).uncheck()
  18  |   await page.getByRole('checkbox', { name: 'Running' }).uncheck()
  19  |   await expect(page.locator('.agent-row')).toHaveCount(9)
  20  | })
  21  | 
  22  | test('timeline kind filtering never crashes and clearing restores entries', async ({ page }) => {
  23  |   await page.locator('.agent-row').filter({ hasText: 'Aster Finch' }).click()
  24  |   await page.getByRole('tab', { name: 'History' }).click()
  25  |   const timeline = page.locator('.timeline-list')
  26  |   await expect(timeline.locator('.timeline-item')).toHaveCount(2)
  27  | 
  28  |   await page.getByLabel('Timeline event kind').selectOption('status')
  29  |   await expect(timeline.locator('.timeline-item')).toHaveCount(2)
  30  |   await page.getByLabel('Timeline event kind').selectOption('retry')
  31  |   await expect(page.getByText('No timeline entries match this event kind.')).toBeVisible()
  32  |   await page.getByRole('button', { name: 'Clear filter' }).last().click()
  33  |   await expect(timeline.locator('.timeline-item')).toHaveCount(2)
  34  | })
  35  | 
  36  | test('seeded retry exposes a changing countdown and attempt counter', async ({ page }) => {
  37  |   await page.locator('.agent-row').filter({ hasText: 'Cinder Vale' }).click()
  38  |   await page.getByRole('tab', { name: 'Activity' }).click()
  39  |   const retry = page.locator('.step-row.status-retrying')
  40  |   await expect(retry).toContainText('Attempt 1 of 3')
  41  |   const first = await retry.locator('.backoff-copy').textContent()
  42  |   await expect(retry.locator('.backoff-copy')).not.toHaveText(first, { timeout: 2_500 })
  43  |   await expect(retry.locator('.backoff-copy')).toContainText(/Waiting \d+s before retry 2 of 3/)
  44  | })
  45  | 
  46  | test('registration validates bounds and double activation creates one animated row', async ({ page }) => {
  47  |   await page.getByRole('button', { name: 'Register Agent' }).first().click()
  48  |   const modal = page.locator('.cds--modal-container').filter({ hasText: 'Create the exact payload' })
  49  |   const submit = modal.getByRole('button', { name: 'Register Agent' })
  50  |   await expect(submit).toBeDisabled()
  51  |   for (const message of ['Name is required', 'Agent type is required', 'Editor integration is required', 'Access key is required']) {
  52  |     await expect(modal.locator('.cds--form-requirement').filter({ hasText: message })).toBeVisible()
  53  |   }
  54  | 
  55  |   await modal.getByLabel('Name').fill('A')
  56  |   await expect(modal.locator('.cds--form-requirement').filter({ hasText: 'Name must be 2 to 40 characters' })).toBeVisible()
  57  |   await modal.getByLabel('Name').fill('X'.repeat(41))
  58  |   await expect(modal.locator('.cds--form-requirement').filter({ hasText: 'Name must be 2 to 40 characters' })).toBeVisible()
  59  |   await modal.getByLabel('Access key').fill('invalid key!')
  60  |   await expect(modal.locator('.cds--form-requirement').filter({ hasText: 'Access key must be 16 to 64 characters' })).toBeVisible()
  61  |   await modal.getByRole('combobox', { name: 'Agent type' }).click()
  62  |   await page.getByRole('option', { name: 'Aster', exact: true }).click()
  63  |   await modal.getByRole('combobox', { name: 'Editor integration' }).click()
  64  |   await page.getByRole('option', { name: 'Vector', exact: true }).click()
  65  |   await modal.getByLabel('Access key').fill('K'.repeat(65))
  66  |   await expect(modal.locator('.cds--form-requirement').filter({ hasText: 'Access key must be 16 to 64 characters' })).toBeVisible()
  67  |   await modal.getByLabel('Access key').fill('invalid!key_12345678')
  68  |   await expect(modal.locator('.cds--form-requirement').filter({ hasText: 'Access key may use only letters, digits, hyphens, and underscores' })).toBeVisible()
  69  |   await modal.getByLabel('Access key').fill('delta_signal_key_2026')
  70  |   await modal.getByLabel('Name').fill('aster finch')
  71  |   await expect(modal.locator('.cds--form-requirement').filter({ hasText: 'Name must be unique (ignoring letter case)' })).toBeVisible()
  72  | 
  73  |   await modal.getByRole('button', { name: 'Cancel' }).click()
  74  |   await expect(page.locator('.agent-row')).toHaveCount(9)
  75  |   await page.getByRole('button', { name: 'Register Agent' }).first().click()
  76  |   const reopened = page.locator('.cds--modal-container').filter({ hasText: 'Create the exact payload' })
  77  |   const reopenedSubmit = reopened.getByRole('button', { name: 'Register Agent' })
  78  |   await reopened.getByLabel('Name').fill('Delta Signal')
  79  |   await reopened.getByRole('combobox', { name: 'Agent type' }).click()
  80  |   await page.getByRole('option', { name: 'Aster', exact: true }).click()
  81  |   await reopened.getByRole('combobox', { name: 'Editor integration' }).click()
  82  |   await page.getByRole('option', { name: 'Vector', exact: true }).click()
  83  |   await reopened.getByLabel('Access key').fill('delta_signal_key_2026')
  84  |   await expect(reopenedSubmit).toBeEnabled()
  85  |   await reopenedSubmit.dblclick()
  86  | 
  87  |   const row = page.locator('.agent-row').filter({ hasText: 'Delta Signal' })
  88  |   await expect(row).toHaveCount(1)
  89  |   await expect(row).toHaveClass(/new-agent-row/)
  90  |   await expect(page.locator('.agent-row')).toHaveCount(10)
  91  | })
  92  | 
  93  | test('undo cancels a pending animated removal without a delayed delete', async ({ page }) => {
  94  |   await page.addInitScript(() => {
  95  |     const nativeSetTimeout = window.setTimeout
  96  |     window.setTimeout = (callback, delay, ...args) => nativeSetTimeout(callback, delay === 210 ? 1_000 : delay, ...args)
  97  |   })
  98  |   await page.reload()
  99  | 
  100 |   const row = page.locator('.agent-row').filter({ hasText: 'Aster Finch' })
  101 |   await row.getByRole('button', { name: 'Actions for Aster Finch' }).click()
  102 |   await page.getByRole('menuitem', { name: 'Remove' }).click()
  103 |   await page.getByRole('dialog').getByRole('button', { name: 'Remove agent' }).click()
  104 |   await expect(row).toHaveClass(/agent-row-exit/)
```