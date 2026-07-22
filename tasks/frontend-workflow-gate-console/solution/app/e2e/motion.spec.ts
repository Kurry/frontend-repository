/* NOT-AUTOMATABLE: none; real controls and computed animation timing cover each motion criterion. */
import { addNote, loadApp, stageButton, test, expect } from './helpers'

test.beforeEach(async ({ page }) => loadApp(page))

test('4.1 hover_feedback_on_chrome', async ({ page }) => {
  for(const locator of [page.getByRole('button',{name:'Export acceptance package'}).first(),page.locator('.run-card').first(),page.locator('.gate-row').first()]){
    const before=await locator.evaluate(n=>({bg:getComputedStyle(n).backgroundColor,shadow:getComputedStyle(n).boxShadow,transform:getComputedStyle(n).transform})); await locator.hover(); await page.waitForTimeout(120); const after=await locator.evaluate(n=>({bg:getComputedStyle(n).backgroundColor,shadow:getComputedStyle(n).boxShadow,transform:getComputedStyle(n).transform})); expect(after).not.toEqual(before)
  }
})

test('4.2 gate_disclosure_animates', async ({ page }) => {
  const row=page.locator('.gate-row').first(), disclosure=row.locator('.gate-disclosure'), evidence=row.locator('.evidence-grid'), chevron=disclosure.locator('svg')
  const closed=await chevron.evaluate(n=>getComputedStyle(n).transform); await disclosure.click(); const duration=await evidence.evaluate(n=>getComputedStyle(n).transitionDuration); expect(duration).not.toBe('0s'); await expect(evidence).toHaveClass(/open/); expect(await chevron.evaluate(n=>getComputedStyle(n).transform)).not.toBe(closed)
  await disclosure.click(); await expect(evidence).not.toHaveClass(/open/)
})

test('4.3 rerun_progress_animates', async ({ page }) => {
  await page.getByRole('button',{name:'Start re-run'}).click(); const bar=page.locator('.progress-track span'); await expect(bar).toBeVisible(); const transition=await bar.evaluate(n=>getComputedStyle(n).transitionDuration); expect(transition).not.toBe('0s')
  await expect(page.locator('.gate-state').filter({hasText:'Running'}).first()).toBeVisible(); await expect(page.locator('.rerun-progress strong')).not.toHaveText('0%'); await expect(page.getByText(/re-run passed|re-run rejected/).last()).toBeVisible({timeout:10_000})
})

test('4.4 banners_toasts_timeline_motion', async ({ page }) => {
  await page.getByRole('switch',{name:'What-if mode'}).check(); const banner=page.locator('.whatif-banner'); await expect(banner).toBeVisible(); expect(await banner.evaluate(n=>getComputedStyle(n).animationDuration)).not.toBe('0s'); await page.getByRole('button',{name:'Revert'}).click()
  await addNote(page,'motion-note'); const toast=page.locator('.toast'); await expect(toast).toBeVisible(); expect(await toast.evaluate(n=>getComputedStyle(n).animationDuration)).not.toBe('0s'); await expect(page.locator('.timeline-entry').first()).toHaveClass(/timeline-enter/)
})

test('4.5 certificate_dialog_transition', async ({ page }) => {
  await stageButton(page,'Source','passed').click(); await page.getByRole('button',{name:'View certificate'}).click(); const card=page.locator('.modal-card'); const duration=await card.evaluate(n=>getComputedStyle(n).animationDuration); expect(Number.parseFloat(duration)).toBeGreaterThanOrEqual(.2); expect(Number.parseFloat(duration)).toBeLessThanOrEqual(.3); await page.getByRole('button',{name:'Close certificate'}).click(); await expect(card).toHaveCount(0)
})

test('4.6 reduced_motion_respected', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'reduce'}); await page.reload(); await page.getByRole('switch',{name:'What-if mode'}).check(); await expect(page.locator('.whatif-banner')).toBeVisible()
  const values=await page.locator('.whatif-banner,.gate-disclosure svg,.evidence-grid').evaluateAll(ns=>ns.map(n=>Math.max(Number.parseFloat(getComputedStyle(n).animationDuration)||0,Number.parseFloat(getComputedStyle(n).transitionDuration)||0))); expect(Math.max(...values)).toBeLessThanOrEqual(.001)
})
