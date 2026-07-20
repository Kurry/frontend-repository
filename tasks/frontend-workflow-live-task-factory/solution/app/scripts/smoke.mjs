import { chromium } from '/usr/lib/node_modules/playwright/index.mjs'

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const context = browser.contexts()[0]
const pages = context.pages()
const page = pages[0] || await context.newPage()
const logs = []
page.on('console', (message) => {
  if (['error', 'warning'].includes(message.type())) logs.push(`${message.type()}: ${message.text()}`)
})
page.on('pageerror', (error) => logs.push(`pageerror: ${error.message}`))
await page.setViewportSize({ width: 1440, height: 1000 })
await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'networkidle' })
await page.screenshot({ path: '/tmp/taskfoundry-home.png', fullPage: true })
const body = await page.locator('body').innerText()
const initial = {
  title: await page.title(),
  mode: await page.getByText('Demo data', { exact: true }).count(),
  repos: ['nimbusworks/driftline', 'cobalt-labs/loomdb', 'fernfield/petrel'].map((name) => body.includes(name)),
  heading: await page.locator('h1').first().textContent(),
}

const connectionTip = page.getByRole('button', { name: 'Dismiss Connect when you’re ready tip' })
if (await connectionTip.count()) await connectionTip.click()
await page.getByRole('button', { name: 'Runs', exact: true }).click()
const loomRow = page.locator('.pr-row').filter({ hasText: 'cobalt-labs/loomdb' })
await loomRow.getByRole('button', { name: /Run pipeline/ }).click()
await page.locator('.package-viewer').waitFor({ state: 'visible', timeout: 20000 })
const stages = await page.locator('.stage-card .status').allTextContents()
const packageHeader = await page.locator('.package-hero h3').last().textContent()
const persistedBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('taskfoundry-state-v1')).state.packages.length)
await page.reload({ waitUntil: 'networkidle' })
const modeAfterReload = await page.getByText('Demo data', { exact: true }).count()
const persistedAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('taskfoundry-state-v1')).state.packages.length)
await page.setViewportSize({ width: 375, height: 812 })
await page.getByRole('button', { name: 'Library', exact: true }).click().catch(async () => {
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await page.getByRole('button', { name: 'Library', exact: true }).click()
})
await page.screenshot({ path: '/tmp/taskfoundry-mobile.png', fullPage: true })
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
console.log(JSON.stringify({ initial, stages, packageHeader, persistedBefore, persistedAfter, modeAfterReload, mobilePageOverflow: overflow, logs }, null, 2))
await browser.close()
