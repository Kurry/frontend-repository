/* NOT-AUTOMATABLE: none; explicit desktop/mobile viewports cover every responsive criterion. */
import { expectNoPageOverflow, loadApp, stageButton, test, expect } from './helpers'

test.use({ hasTouch: true })

test('7.1 layout_adapts_desktop_to_mobile', async ({ page }) => { await page.setViewportSize({width:1440,height:900}); await loadApp(page); await expect(page.locator('.workspace')).toHaveCSS('display','grid'); await page.setViewportSize({width:375,height:844}); await expect(page.locator('.workspace')).toHaveCSS('display','block') })

test('7.2 mobile_tap_targets_are_large_enough', async ({ page }) => { await page.setViewportSize({width:375,height:844}); await loadApp(page); const boxes=await page.locator('button:visible:not(:disabled),select:visible,input:visible').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return {w:r.width,h:r.height,label:n.getAttribute('aria-label')||n.textContent}})); expect(boxes.length).toBeGreaterThan(10); expect(boxes.filter(b=>b.w<44||b.h<44)).toEqual([]) })

test('7.3 typography_resizes_across_breakpoints', async ({ page }) => { await page.setViewportSize({width:1440,height:900}); await loadApp(page); const d=Number.parseFloat(await page.locator('.run-detail-head h2').evaluate(n=>getComputedStyle(n).fontSize)); await page.setViewportSize({width:375,height:844}); const m=Number.parseFloat(await page.locator('.run-detail-head h2').evaluate(n=>getComputedStyle(n).fontSize)); expect(m).toBeLessThanOrEqual(d); expect(m).toBeGreaterThanOrEqual(16) })

test('7.4 content_avoids_clipping_and_overflow', async ({ page }) => { await page.setViewportSize({width:375,height:844}); await loadApp(page); await expectNoPageOverflow(page); for(const selector of ['.run-pane','.detail-canvas','.stage-card','.timeline']){const b=await page.locator(selector).boundingBox(); expect(b!.x).toBeGreaterThanOrEqual(0); expect(b!.width).toBeLessThanOrEqual(375)} })

test('7.5 chrome_adapts_to_small_screens', async ({ page }) => { await page.setViewportSize({width:375,height:844}); await loadApp(page); const pane=await page.locator('.run-pane').boundingBox(), canvas=await page.locator('.detail-canvas').boundingBox(); expect(canvas!.y).toBeGreaterThanOrEqual(pane!.y+pane!.height-1); await expect(page.locator('.header-action span').first()).toBeHidden() })

test('7.6 stacking_reflows_logically', async ({ page }) => { await page.setViewportSize({width:375,height:844}); await loadApp(page); const order=await page.evaluate(()=>{const p=document.querySelector('.run-pane')!,d=document.querySelector('.detail-canvas')!;return Boolean(p.compareDocumentPosition(d)&Node.DOCUMENT_POSITION_FOLLOWING)}); expect(order).toBe(true) })

test('7.7 mobile_touch_gestures_work', async ({ page }) => { await page.setViewportSize({width:375,height:844}); await loadApp(page); const stage=stageButton(page,'Source'); await stage.tap(); await expect(page.getByRole('heading',{name:'Source'})).toBeVisible(); const gate=page.locator('.gate-disclosure').first(); await gate.tap(); await expect(gate).toHaveAttribute('aria-expanded','true') })

test('7.8 small_screens_avoid_horizontal_scroll', async ({ page }) => { await page.setViewportSize({width:375,height:844}); await loadApp(page); await expectNoPageOverflow(page); await page.getByRole('button',{name:'Gate registry'}).click(); await expectNoPageOverflow(page) })

test('7.9 media_and_canvases_resize', async ({ page }) => { await page.setViewportSize({width:375,height:844}); await loadApp(page); for(const selector of ['.stage-card','.chain-section','.timeline']) expect((await page.locator(selector).boundingBox())!.width).toBeLessThanOrEqual(375); expect(await page.locator('canvas,img').count()).toBe(0) })

test('7.10 fixed_controls_remain_accessible', async ({ page }) => { await page.setViewportSize({width:375,height:844}); await loadApp(page); await expect(page.locator('.app-header')).toBeVisible(); await page.evaluate(()=>scrollTo(0,document.body.scrollHeight)); await expect(page.locator('.app-header')).toBeVisible(); await page.getByRole('button',{name:'Export acceptance package'}).first().click(); await expect(page.getByRole('dialog',{name:'Export acceptance package'})).toBeVisible() })
