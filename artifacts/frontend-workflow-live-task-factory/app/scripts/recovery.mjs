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

const connectionTip = page.getByRole('button', { name: 'Dismiss Connect when you’re ready tip' })
if (await connectionTip.count()) await connectionTip.click()
await page.getByRole('button', { name: 'Runs', exact: true }).click()
const petrelRow = page.locator('.pr-row').filter({ hasText: 'fernfield/petrel' })
await petrelRow.getByRole('button', { name: /Run pipeline/ }).click()
await page.locator('#stage-generate .status.status-failed').waitFor({ timeout: 25000 })
const timesBefore = await page.locator('.stage-card').evaluateAll((cards) => cards.slice(0, 2).map((card) => card.querySelector('.stage-time')?.textContent))
const failedText = await page.locator('#stage-generate').innerText()
await page.locator('#stage-generate').getByRole('button', { name: /Retry Generate/ }).click()
await page.locator('#stage-package .status.status-complete').waitFor({ timeout: 20000 })
const timesAfter = await page.locator('.stage-card').evaluateAll((cards) => cards.slice(0, 2).map((card) => card.querySelector('.stage-time')?.textContent))
const recoveredHeader = await page.locator('#stage-package .package-hero h3').textContent()
console.log(JSON.stringify({ failedContainsAttempts: failedText.includes('failed after 3 attempts'), timesBefore, timesAfter, checkpointsPreserved: JSON.stringify(timesBefore) === JSON.stringify(timesAfter), recoveredHeader, logs }, null, 2))
await browser.close()
