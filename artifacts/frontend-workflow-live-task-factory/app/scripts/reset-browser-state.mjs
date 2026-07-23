import { chromium } from '/usr/lib/node_modules/playwright/index.mjs'

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const context = browser.contexts()[0]
const matches = context.pages().filter((page) => page.url().startsWith('http://127.0.0.1:3000') || page.url().startsWith('http://localhost:3000'))
const page = matches[0] || await context.newPage()
await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'networkidle' })
await page.setViewportSize({ width: 1440, height: 1000 })
for (const extra of matches.slice(1)) await extra.close()
const cleanMode = await page.getByText('Demo data', { exact: true }).count()
await page.getByRole('button', { name: 'Library', exact: true }).click()
const seededPackages = await page.locator('.library-row').count()
await page.reload({ waitUntil: 'networkidle' })
console.log(JSON.stringify({ cleanMode, seededPackages, cleanHeading: await page.locator('h1').textContent() }))
await browser.close()
