import { chromium } from '/usr/lib/node_modules/playwright/index.mjs'

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const context = browser.contexts()[0]
const page = await context.newPage()
await page.setViewportSize({ width: 1440, height: 1000 })
await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' })
await page.screenshot({ path: '/app/studio.png', fullPage: true })
await page.getByRole('button', { name: /Library 5/ }).click()
await page.screenshot({ path: '/app/library.png', fullPage: true })
await page.close()
process.exit(0)
