import { chromium } from '/usr/lib/node_modules/playwright/index.mjs'

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const context = browser.contexts()[0]
const page = await context.newPage()
await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' })
const info = await page.evaluate(() => window.webmcp_session_info())
const tools = await page.evaluate(() => window.webmcp_list_tools().map((tool) => tool.name))
const validation = await page.evaluate(() => window.webmcp_invoke_tool('form_validate', { form: 'add-repository', repository: 'malformed' }))
const selection = await page.evaluate(() => window.webmcp_invoke_tool('entity_select_library_package', { repository: 'nimbusworks/driftline', pr_number: 54 }))
console.log(JSON.stringify({ info, tools, validation, selection, visibleHeading: await page.locator('h1').textContent() }, null, 2))
await page.close()
await browser.close()
