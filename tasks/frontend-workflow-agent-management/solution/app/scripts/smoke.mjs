import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require('/usr/lib/node_modules/playwright')
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const context = browser.contexts()[0]
const pages = context.pages()
const page = pages[0] || await context.newPage()
const consoleProblems = []
page.on('console', (message) => {
  if (['error', 'warning'].includes(message.type())) consoleProblems.push(`${message.type()}: ${message.text()}`)
})
page.on('pageerror', (error) => consoleProblems.push(`pageerror: ${error.message}`))

await page.setViewportSize({ width: 1440, height: 1000 })
await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
const initial = await page.evaluate(() => ({
  title: document.title,
  rows: document.querySelectorAll('tbody .agent-row').length,
  bodyWidth: document.body.scrollWidth,
  viewportWidth: window.innerWidth,
  webmcpTools: window.webmcp_list_tools?.().tools?.length,
  heading: document.querySelector('h1')?.textContent,
}))
console.log(JSON.stringify({ initial }, null, 2))
await page.screenshot({ path: '/app/smoke-desktop.png', fullPage: true })

try {
  await page.getByText('Boreal Echo', { exact: true }).click()
  await page.getByRole('tab', { name: 'Activity' }).click()
  console.log(JSON.stringify({ detail: await page.locator('.detail-panel').innerText() }, null, 2))
  await page.getByRole('button', { name: 'Close agent detail' }).click()

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K')
  console.log(JSON.stringify({ paletteOpen: await page.getByText('Command palette', { exact: true }).isVisible() }))
  await page.keyboard.press('Escape')
  await page.getByText('Command palette', { exact: true }).waitFor({ state: 'hidden' })

  await page.getByRole('button', { name: 'Export fleet' }).first().click()
  console.log(JSON.stringify({ exportVisible: await page.locator('.json-preview').isVisible(), exportHasRollup: (await page.locator('.json-preview').textContent()).includes('"rollup"') }))
  await page.keyboard.press('Escape')

  await page.setViewportSize({ width: 375, height: 812 })
  await page.waitForTimeout(250)
  const mobile = await page.evaluate(() => ({ bodyWidth: document.body.scrollWidth, viewportWidth: innerWidth }))
  await page.screenshot({ path: '/app/smoke-mobile.png', fullPage: true })
  console.log(JSON.stringify({ mobile }, null, 2))
} catch (error) {
  console.log(JSON.stringify({ smokeError: error.message }, null, 2))
} finally {
  console.log(JSON.stringify({ consoleProblems }, null, 2))
  await browser.close()
}
