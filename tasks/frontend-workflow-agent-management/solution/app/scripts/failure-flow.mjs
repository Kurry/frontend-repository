import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('/usr/lib/node_modules/playwright')

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const page = await browser.contexts()[0].newPage()
page.setDefaultTimeout(40000)
const problems = []
page.on('console', (message) => { if (['warning', 'error'].includes(message.type())) problems.push(`${message.type()}: ${message.text()}`) })
page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`))

try {
  await page.goto('http://127.0.0.1:3000')
  const row = page.locator('.agent-row').filter({ hasText: 'Cinder Vale' })
  await row.getByRole('button', { name: 'Start run' }).click()
  const retryingStep = page.locator('.step-row.status-retrying')
  await retryingStep.waitFor({ state: 'visible', timeout: 18000 })
  const retryingText = await retryingStep.innerText()
  const firstCompletedAt = await page.locator('.step-row').first().locator('time').getAttribute('datetime')
  const failedStep = page.locator('.step-row.status-failed')
  await failedStep.waitFor({ state: 'visible', timeout: 30000 })
  const failureText = await failedStep.innerText()
  await failedStep.getByRole('button', { name: 'Retry step' }).click()
  await page.getByText('Run complete', { exact: true }).waitFor({ timeout: 18000 })
  const firstCompletedAfter = await page.locator('.step-row').first().locator('time').getAttribute('datetime')
  const completeText = await page.locator('.activity-tab').innerText()
  console.log(JSON.stringify({
    retryingHasCountdown: /Waiting \d+s before retry/.test(retryingText),
    retryingHasAttempts: /Attempt \d of 3/.test(retryingText),
    failureHasSummary: failureText.includes('Verification failed after 3 automatic attempts'),
    resumedFromFailedStep: firstCompletedAt === firstCompletedAfter,
    finishedAllSteps: completeText.includes('5 of 5 steps complete'),
    problems,
  }, null, 2))
} catch (error) {
  console.log(JSON.stringify({ error: error.message, problems }, null, 2))
  process.exitCode = 1
} finally {
  await page.close()
  await browser.close()
}
