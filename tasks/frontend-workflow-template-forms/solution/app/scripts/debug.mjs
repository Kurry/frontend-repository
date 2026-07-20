import { chromium } from '/usr/lib/node_modules/playwright/index.mjs'
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const page = await browser.contexts()[0].newPage()
await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' })
await page.getByRole('button', { name: /Library 5/ }).click()
await page.getByRole('button', { name: 'Export library' }).click()
const json = await page.locator('.export-panel pre').textContent()
await page.getByRole('button', { name: 'Import JSON' }).click()
await page.locator('#import-document-text').fill(json)
await page.waitForTimeout(500)
console.log(JSON.stringify({
  valueLength: (await page.locator('#import-document-text').inputValue()).length,
  error: await page.locator('#import-document-text-error-msg').textContent().catch(() => ''),
  disabled: await page.getByRole('button', { name: 'Replace library' }).isDisabled(),
}))
await page.close()
process.exit(0)
