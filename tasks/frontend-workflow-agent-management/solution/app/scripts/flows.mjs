import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('/usr/lib/node_modules/playwright')

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const page = await browser.contexts()[0].newPage()
const problems = []
page.on('console', (message) => { if (['warning', 'error'].includes(message.type())) problems.push(`${message.type()}: ${message.text()}`) })
page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`))

try {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('http://127.0.0.1:3000')
  await page.getByRole('button', { name: 'Register Agent' }).first().click()
  const modal = page.locator('.cds--modal-container').filter({ hasText: 'Create the exact payload' })
  const registerSubmit = modal.getByRole('button', { name: 'Register Agent' })
  const initialValidation = {
    submitDisabled: await registerSubmit.isDisabled(),
    requiredMessages: await modal.getByText(/is required/).count(),
  }
  await modal.getByLabel('Name').fill('Aster Vale')
  await modal.getByRole('combobox', { name: 'Agent type' }).click()
  await page.getByRole('option', { name: 'Aster', exact: true }).click()
  await modal.getByRole('combobox', { name: 'Editor integration' }).click()
  await page.getByRole('option', { name: 'Vector', exact: true }).click()
  await modal.getByLabel('Access key').fill('aster_access_key_2026')
  await registerSubmit.waitFor({ state: 'visible' })
  await registerSubmit.click()
  await page.getByText('Aster Vale', { exact: true }).waitFor()
  const afterRegister = {
    rows: await page.locator('.agent-row').count(),
    totalText: await page.locator('.rollup-total').innerText(),
    registeredVisible: await page.getByText('Aster Vale', { exact: true }).isVisible(),
  }

  const newRow = page.locator('.agent-row').filter({ hasText: 'Aster Vale' })
  await newRow.getByRole('button', { name: 'Start run' }).click()
  await page.waitForTimeout(1200)
  const started = await newRow.innerText()
  await newRow.getByRole('button', { name: 'Pause' }).click()
  const paused = await newRow.innerText()
  await newRow.getByRole('button', { name: 'Resume' }).click()
  const resumed = await newRow.innerText()

  await page.getByRole('button', { name: 'Export fleet' }).first().click()
  const preview = await page.locator('.json-preview').textContent()
  const exported = JSON.parse(preview)
  const exportChecks = {
    total: exported.rollup.total,
    containsNewAgent: exported.agents.some((agent) => agent.name === 'Aster Vale' && agent.agentType === 'aster' && agent.editorIntegration === 'vector'),
    newAgentRunStatus: exported.agents.find((agent) => agent.name === 'Aster Vale')?.run?.status,
  }
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'Import fleet' }).first().click()
  const importModal = page.locator('.cds--modal-container').filter({ hasText: 'Paste a complete fleet JSON' })
  await importModal.getByLabel('Fleet JSON').fill(preview)
  await importModal.getByRole('button', { name: 'Import fleet' }).click()
  await page.waitForTimeout(300)
  const roundTrip = {
    rows: await page.locator('.agent-row').count(),
    totalText: await page.locator('.rollup-total').innerText(),
    importedAgentVisible: await page.getByText('Aster Vale', { exact: true }).isVisible(),
  }

  await page.keyboard.press('Control+K')
  await page.getByRole('searchbox', { name: 'Search commands' }).fill('Boreal Echo')
  await page.getByRole('button', { name: /Jump to Boreal Echo/ }).click()
  const paletteJump = {
    panelVisible: await page.locator('.detail-panel').isVisible(),
    panelTitle: await page.locator('.detail-panel h2').innerText(),
  }

  console.log(JSON.stringify({ initialValidation, afterRegister, started: started.includes('Running'), paused: paused.includes('Paused'), resumed: resumed.includes('Running'), exportChecks, roundTrip, paletteJump, problems }, null, 2))
} catch (error) {
  console.log(JSON.stringify({ flowError: error.message, problems }, null, 2))
  process.exitCode = 1
} finally {
  await page.close()
  await browser.close()
}
