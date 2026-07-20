import { chromium } from '/usr/lib/node_modules/playwright/index.mjs'
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const page = browser.contexts()[0].pages()[0]
page.on('console', m => console.log('console', m.type(), m.text()))
page.on('pageerror', e => console.log('pageerror', e.message, e.stack))
console.log('form count', await page.locator('form.review-form').count())
await page.locator('form.review-form').evaluate((form) => { form.addEventListener('submit', () => console.log('native form submit seen'), { once: true }) })
await page.getByRole('button', { name: 'Confirm override' }).click()
await page.waitForTimeout(1500)
console.log('dialog', await page.locator('[role=dialog]').count())
console.log('gate', await page.locator('.gate-banner h2').innerText())
await browser.close()
