/* NOT-AUTOMATABLE: 9.7 animations_maintain_smooth_frame_rate — CI scheduling cannot yield a stable perceptual 60fps verdict. */
import { loadApp, openRegistry, test, expect } from './helpers'

test('9.1 cold_start_is_under_two_seconds', async ({ page }) => { const start=Date.now(); await page.goto('/'); await expect(page.getByRole('button',{name:'Open run RUN-2407-A91'})).toBeVisible(); expect(Date.now()-start).toBeLessThan(2000) })

test('9.2 console_is_clean', async ({ page, diagnostics }) => { await loadApp(page); await page.getByRole('switch',{name:'What-if mode'}).check(); await page.getByRole('button',{name:/TST-328 Fail; flip/}).click(); await page.getByRole('button',{name:'Revert'}).click(); expect(diagnostics.errors).toEqual([]); expect(diagnostics.warnings).toEqual([]); expect(diagnostics.pageErrors).toEqual([]) })

test('9.3 transitions_respond_under_100ms', async ({ page }) => { await loadApp(page); const elapsed=await page.evaluate(async()=>{const button=[...document.querySelectorAll('button')].find(node=>node.textContent?.includes('Gate registry')) as HTMLButtonElement; const start=performance.now(); button.click(); await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve())); return performance.now()-start}); await expect(page.getByRole('heading',{name:'Gate registry'})).toBeVisible(); expect(elapsed).toBeLessThan(100); const css=await page.locator('.registry-list > button').first().evaluate(n=>Number.parseFloat(getComputedStyle(n).transitionDuration)); expect(css).toBeLessThanOrEqual(.1) })

test('9.4 async_work_has_loading_indicators', async ({ page }) => { await loadApp(page); await page.getByRole('button',{name:'Start re-run'}).click(); await expect(page.locator('.rerun-progress')).toBeVisible(); await expect(page.locator('.gate-state').filter({hasText:/Pending|Running/}).first()).toBeVisible() })

test('9.5 large_collections_render_without_lag', async ({ page }) => { await loadApp(page); const start=Date.now(); await openRegistry(page); expect(await page.locator('.registry-list > button').count()).toBeGreaterThan(20); expect(Date.now()-start).toBeLessThan(1500) })

test('9.6 state_changes_remain_interactive', async ({ page }) => { await loadApp(page); await page.getByRole('button',{name:'Start re-run'}).click(); await page.getByLabel('Filter timeline by entry type').selectOption('re-run'); await expect(page.getByLabel('Filter timeline by entry type')).toHaveValue('re-run'); await expect(page.getByText(/re-run passed|re-run rejected/).last()).toBeVisible({timeout:10_000}) })

test('9.8 rapid_input_does_not_freeze', async ({ page }) => { await loadApp(page); const runs=page.locator('.run-card'); for(let i=0;i<12;i++) await runs.nth(i%6).click(); await expect(page.locator('.run-detail-head h2')).toBeVisible(); await page.getByRole('button',{name:'Gate registry'}).click(); const filter=page.getByLabel('Severity filter'); for(const value of ['S1','S2','S3','all']) await filter.selectOption(value); await expect(page.locator('.registry-list > button').first()).toBeVisible() })
