/* NOT-AUTOMATABLE: none; visual requirements are reduced to computed style and layout contracts. */
import { loadApp, openExport, stageButton, test, expect } from './helpers'

test.beforeEach(async ({ page }) => loadApp(page))

test('2.1 console_pane_composition', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 }); const pane=await page.locator('.run-pane').boundingBox(), canvas=await page.locator('.detail-canvas').boundingBox()
  expect(pane).not.toBeNull(); expect(canvas).not.toBeNull(); expect(canvas!.x).toBeGreaterThanOrEqual(pane!.x+pane!.width-1)
  await expect(page.locator('.stage-card.surface')).toBeVisible(); await expect(page.locator('.gate-register')).toBeVisible(); await expect(page.locator('.chain-section')).toBeVisible(); await expect(page.locator('.timeline')).toBeVisible()
})

test('2.2 consistent_status_color_language', async ({ page }) => {
  for (const status of ['passed','rejected','running','pending']) {
    const samples=page.locator(`.status-${status}`); expect(await samples.count()).toBeGreaterThan(0)
    const colors=await samples.evaluateAll((nodes)=>nodes.slice(0,4).map((n)=>getComputedStyle(n).getPropertyValue('--status').trim()).filter(Boolean)); expect(new Set(colors).size).toBeLessThanOrEqual(1)
    await expect(page.getByLabel('Status color legend')).toContainText(status)
  }
})

test('2.3 severity_chips_distinct_and_consistent', async ({ page }) => {
  const checklist: Record<string,string>={}; for(const severity of ['S1','S2','S3']) checklist[severity]=await page.locator(`.gate-row .severity-${severity}`).first().evaluate(n=>getComputedStyle(n).color)
  expect(new Set(Object.values(checklist)).size).toBe(3); await page.getByRole('button',{name:'Gate registry'}).click()
  for(const severity of ['S1','S2','S3']) await expect(page.locator(`.registry-list .severity-${severity}`).first()).toHaveCSS('color',checklist[severity])
})

test('2.4 typography_hierarchy_and_monospace', async ({ page }) => {
  const size=async(s:string)=>Number.parseFloat(await page.locator(s).first().evaluate(n=>getComputedStyle(n).fontSize)); expect(await size('.run-detail-head h2')).toBeGreaterThan(await size('.gate-identity strong')); expect(await size('.gate-identity strong')).toBeGreaterThan(await size('.evidence-copy p'))
  await expect(page.locator('.gate-row code').first()).toHaveCSS('font-family',/mono/i); await stageButton(page,'Source','passed').click(); await page.getByRole('button',{name:'View certificate'}).click(); await expect(page.locator('.fingerprint-block code')).toHaveCSS('font-family',/mono/i)
})

test('2.5 theme_toggle_recolors_surfaces', async ({ page }) => {
  const shell=page.locator('.app-shell'), chain=page.locator('.chain-section'); const before=[await shell.evaluate(n=>getComputedStyle(n).backgroundColor),await chain.evaluate(n=>getComputedStyle(n).backgroundColor)]
  await page.getByRole('button',{name:'Switch to dark theme'}).click(); await expect(page.locator('html')).toHaveClass(/dark/); expect([await shell.evaluate(n=>getComputedStyle(n).backgroundColor),await chain.evaluate(n=>getComputedStyle(n).backgroundColor)]).not.toEqual(before)
  await page.getByRole('button',{name:'Switch to light theme'}).click(); await expect(page.locator('html')).not.toHaveClass(/dark/)
})

test('2.6 component_states_and_icons', async ({ page }) => {
  const button=page.getByRole('button',{name:'Export acceptance package'}).first(); const before=await button.evaluate(n=>getComputedStyle(n).backgroundColor); await button.hover(); await page.waitForTimeout(120); expect(await button.evaluate(n=>getComputedStyle(n).backgroundColor)).not.toBe(before)
  await button.focus(); expect(await button.evaluate(n=>getComputedStyle(n).outlineStyle)).not.toBe('none'); await expect(page.getByRole('button',{name:/TST-328 Fail$/})).toBeDisabled(); expect(await page.locator('svg').count()).toBeGreaterThan(10); expect(await page.locator('img').count()).toBe(0)
})

test('2.7 responsive_layout_at_narrow_widths', async ({ page }) => {
  await page.setViewportSize({width:375,height:844}); await expect(page.locator('.workspace')).toHaveCSS('display','block'); expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
  await expect(page.locator('.strip-scroll')).toHaveCSS('overflow-x','auto'); await expect(page.locator('.chain-scroll')).toHaveCSS('overflow-x','auto')
})

test('2.8 copy_conventions_consistent', async ({ page }) => {
  for(const label of ['Start re-run','Add note','Export acceptance package','Import acceptance package']) await expect(page.getByRole('button',{name:label}).first()).toBeVisible()
  expect(await page.locator('[placeholder]').count()).toBe(0); const dialog=await openExport(page); await expect(dialog.getByRole('tab',{name:'Acceptance Package JSON'})).toBeVisible(); await expect(dialog.getByRole('tab',{name:'Certificate Chain Markdown'})).toBeVisible(); await expect(dialog.locator('pre.preview')).toHaveCSS('font-family',/mono/i)
})
