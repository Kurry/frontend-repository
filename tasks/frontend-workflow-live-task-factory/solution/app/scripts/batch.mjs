import { chromium } from '/usr/lib/node_modules/playwright/index.mjs'

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const context = browser.contexts()[0]
const page = await context.newPage()
const logs = []
page.on('console', (message) => { if (['error', 'warning'].includes(message.type())) logs.push(`${message.type()}: ${message.text()}`) })
page.on('pageerror', (error) => logs.push(`pageerror: ${error.message}`))
await page.setViewportSize({ width: 1440, height: 1000 })
await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: 'Runs', exact: true }).click()
const queueItems = page.locator('.queue-item')
await queueItems.nth(0).click()
await queueItems.nth(2).click()
await page.getByRole('button', { name: /Start batch · 2/ }).click()
await page.getByText('BatchRunReport', { exact: true }).waitFor({ timeout: 15000 })
const report = await page.evaluate(() => {
  const state = JSON.parse(localStorage.getItem('taskfoundry-state-v1')).state
  return { packageCount: state.packages.length }
})
const buckets = await page.locator('.report-bucket strong').allTextContents()
const itemOutcomes = await page.locator('.batch-row .status').allTextContents()
console.log(JSON.stringify({ buckets, itemOutcomes, ...report, logs }, null, 2))
await page.close()
await browser.close()
