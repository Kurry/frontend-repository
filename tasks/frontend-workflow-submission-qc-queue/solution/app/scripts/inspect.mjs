import { chromium } from '/usr/lib/node_modules/playwright/index.mjs'
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const page = browser.contexts()[0].pages()[0]
console.log('url', page.url())
console.log('dialogs', await page.locator('[role=dialog]').count())
console.log('body', (await page.locator('body').innerText()).slice(0, 5000))
console.log('state', await page.evaluate(() => ({ active: document.querySelector('h1')?.textContent, toasts: [...document.querySelectorAll('.app-toast')].map(x => x.textContent), vue: !!document.querySelector('#app').__vue_app__ })))
console.log('fields', await page.locator('textarea').evaluateAll((els) => els.map((x) => ({ value: x.value, name: x.name, outer: x.outerHTML.slice(0, 400) }))))
console.log('errors', await page.locator('.field-error').allTextContents())
console.log('submit buttons', await page.locator('form.review-form button[type=submit]').evaluateAll((els) => els.map(x => ({ text: x.textContent, disabled: x.disabled }))))
await page.screenshot({ path: '/tmp/arcfield-current.png', fullPage: true })
await browser.close()
