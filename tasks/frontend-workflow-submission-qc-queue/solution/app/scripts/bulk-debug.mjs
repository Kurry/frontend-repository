import { chromium } from '/usr/lib/node_modules/playwright/index.mjs'
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const page = browser.contexts()[0].pages()[0]
await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle' })
for (const name of ['Map constraint ambiguity in routing prompts', 'Normalize regional date instructions']) {
  const row = page.locator('tr').filter({ hasText: name })
  console.log('before', name, await row.getByRole('checkbox').isChecked())
  await row.getByRole('checkbox').click()
  console.log('after', name, await row.getByRole('checkbox').isChecked())
}
console.log('bulk', await page.locator('.bulk-bar').innerText())
await page.getByRole('button', { name: 'Hold payout' }).click()
await page.waitForTimeout(500)
for (const name of ['Map constraint ambiguity in routing prompts', 'Normalize regional date instructions']) console.log('row', await page.locator('tr').filter({ hasText: name }).innerText())
await browser.close()
