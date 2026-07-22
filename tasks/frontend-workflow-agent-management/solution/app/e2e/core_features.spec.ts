import { test, expect } from './fixtures';
import { closeTopOverlay, downloadedText, exportJson, fillRegister, importText, openApp, openDetail, openExport, openRegister, register, removeAgent, row, total } from './helpers';

test.beforeEach(async ({ page }) => openApp(page));

test('1.1 seeded_registry_complete', async ({ page }) => {
  const rows = page.locator('.agent-row'); await expect(rows).toHaveCount(9);
  expect(new Set(await rows.locator('td:nth-child(4)').allTextContents()).size).toBeGreaterThanOrEqual(3);
  for (const status of ['Idle', 'Running', 'Error', 'Offline']) await expect(rows.filter({ hasText: status }).first()).toBeVisible();
  for (let i = 0; i < 9; i++) { await expect(rows.nth(i).locator('td')).toHaveCount(8); await expect(rows.nth(i).locator('time')).toHaveAttribute('datetime', /T.*Z$/); }
});

test('1.2 rollup_strip_tracks_collection', async ({ page }) => {
  const sum = async () => (await Promise.all(['idle','running','paused','error','offline'].map(async (s) => Number(await page.locator(`.rollup-${s} strong`).textContent())))).reduce((a,b)=>a+b,0);
  expect(await sum()).toBe(9); await expect(total(page)).toHaveText('9'); await register(page); await expect(total(page)).toHaveText('10'); expect(await sum()).toBe(10);
});

test('1.3 error_retry_transitions_to_idle', async ({ page }) => {
  const target = row(page, 'Boreal Sable'); await expect(target).toContainText('Error'); await target.getByRole('button', { name: 'Retry' }).click(); await expect(target).toContainText('Idle');
  const panel = await openDetail(page, 'Boreal Sable'); await panel.getByRole('tab', { name: 'History' }).click(); await expect(panel.locator('.timeline-item').first()).toContainText(/Manual retry cleared the error/i);
});

test('1.4 register_valid_agent_appears', async ({ page }) => {
  const before = Number(await total(page).textContent()); const created = await register(page); await expect(created).toContainText('Idle'); await expect(created.locator('time')).toHaveAttribute('datetime', /T.*Z$/); await expect(total(page)).toHaveText(String(before + 1));
});

test('1.5 register_invalid_shows_inline_errors', async ({ page }) => {
  const modal = await openRegister(page); const submit = modal.getByRole('button', { name: 'Register Agent' }); await expect(submit).toBeDisabled();
  for (const id of ['#agent-name-error-msg','#agent-type-error-msg','#agent-editor-error-msg','#agent-access-key-error-msg']) await expect(modal.locator(id)).toBeVisible();
  await modal.getByLabel('Name').fill('A'); await expect(modal.locator('#agent-name-error-msg')).toHaveText('Name must be 2 to 40 characters'); await modal.getByLabel('Access key').fill('bad key!!!!!!!!'); await expect(modal.locator('#agent-access-key-error-msg')).toBeVisible(); await expect(page.locator('.agent-row')).toHaveCount(9);
});

test('1.6 detail_panel_tabs_render', async ({ page }) => {
  const panel = await openDetail(page); await expect(panel.getByRole('tab')).toHaveText(['Configuration','History','Activity']); await expect(panel.locator('.config-list')).toContainText('Aster Finch'); await expect(panel.locator('.masked-key')).toContainText('••••');
  await panel.getByRole('tab', { name: 'History' }).click(); const times = panel.locator('.timeline-item time'); expect(await times.count()).toBeLessThanOrEqual(10); await expect(times.first()).toHaveAttribute('datetime', /T.*Z$/);
  await panel.getByRole('tab', { name: 'Activity' }).click(); await expect(panel).toContainText(/Today's prompts|No prompts executed today/);
});

test('1.7 edit_prefilled_updates_in_place', async ({ page }) => {
  const panel = await openDetail(page, 'Boreal Echo'); await panel.getByRole('button', { name: 'Edit' }).click(); const modal = page.locator('.cds--modal-container').filter({ hasText: 'Update the API configuration' }); await expect(modal.getByLabel('Name')).toHaveValue('Boreal Echo'); await modal.getByLabel('Name').fill('Boreal Echo Prime'); await modal.getByRole('button', { name: 'Save changes' }).click(); await expect(row(page, 'Boreal Echo Prime')).toHaveCount(1); await expect(panel).toContainText('Boreal Echo Prime');
});

test('1.8 remove_requires_confirm', async ({ page }) => {
  const before = Number(await total(page).textContent()); const target = row(page, 'Boreal Kite'); await target.getByRole('button', { name: 'Actions for Boreal Kite' }).click(); await page.getByRole('menuitem', { name: 'Remove' }).click(); await expect(target).toHaveCount(1); await page.getByRole('dialog').getByRole('button', { name: 'Remove agent' }).click(); await expect(target).toHaveCount(0); await expect(total(page)).toHaveText(String(before - 1));
});

test('1.9 start_run_advances_steps', async ({ page }) => {
  const target = row(page, 'Boreal Echo'); await target.getByRole('button', { name: 'Start run' }).click(); await expect(target).toContainText('Running'); const panel = await openDetail(page, 'Boreal Echo'); await panel.getByRole('tab', { name: 'Activity' }).click(); await expect(panel.locator('.step-row')).toHaveCount(5); const progress = panel.getByText(/\d of 5 steps complete/); const before = await progress.textContent(); await expect.poll(() => progress.textContent(), { timeout: 6_000 }).not.toBe(before);
});

test('1.10 retry_backoff_countdown_visible', async ({ page }) => {
  const panel = await openDetail(page, 'Cinder Vale'); await panel.getByRole('tab', { name: 'Activity' }).click(); const retry = panel.locator('.step-row.status-retrying'); await expect(retry).toContainText('Attempt 1 of 3'); const first = await retry.locator('.backoff-copy').textContent(); await expect.poll(() => retry.locator('.backoff-copy').textContent()).not.toBe(first); await expect(retry).toContainText(/retry \d of 3/);
});

test('1.11 manual_retry_resumes_from_step', async ({ page }) => {
  const panel = await openDetail(page, 'Cinder Vale'); await panel.getByRole('tab', { name: 'Activity' }).click(); const firstTime = await panel.locator('.step-row').first().locator('time').getAttribute('datetime'); const failed = panel.locator('.step-row.status-failed'); await expect(failed).toBeVisible({ timeout: 20_000 }); await expect(failed).toContainText('Verification failed after 3 automatic attempts'); await failed.getByRole('button', { name: 'Retry step' }).click(); await expect(failed).toHaveCount(0); await expect(panel.locator('.step-row').first().locator('time')).toHaveAttribute('datetime', firstTime!);
});

test('1.12 run_completion_returns_idle', async ({ page }) => {
  const target = row(page, 'Boreal Echo'); await target.getByRole('button', { name: 'Start run' }).click(); const panel = await openDetail(page, 'Boreal Echo'); await panel.getByRole('tab', { name: 'Activity' }).click(); await expect(panel.getByText('Run complete', { exact: true })).toBeVisible({ timeout: 15_000 }); await expect(panel.locator('.duration-pill')).toContainText(/s total/); await expect(target).toContainText('Idle');
});

test('1.13 pause_checkpoint_resume', async ({ page }) => {
  const target = row(page, 'Aster Finch'); const panel = await openDetail(page, 'Aster Finch'); await panel.getByRole('tab', { name: 'Activity' }).click(); await panel.getByRole('button', { name: 'Pause' }).click(); await expect(target).toContainText('Paused'); await expect(panel.locator('.checkpoint-copy')).toBeVisible(); const progress = panel.getByText(/\d of 5 steps complete/); const before = await progress.textContent(); await page.waitForTimeout(1_200); await expect(progress).toHaveText(before!); await panel.getByRole('button', { name: 'Resume' }).click(); await expect(target).toContainText('Running');
});

test('1.14 bulk_pause_resume_selection', async ({ page }) => {
  for (const name of ['Aster Finch','Cinder Vale','Aster Rune']) await page.getByRole('checkbox', { name: `Select ${name}` }).check(); await page.getByRole('button', { name: 'Pause All' }).click(); for (const name of ['Aster Finch','Cinder Vale','Aster Rune']) await expect(row(page,name)).toContainText('Paused'); await expect(page.locator('.rollup-paused strong')).toHaveText('4'); await page.getByRole('button', { name: 'Resume All' }).click(); for (const name of ['Aster Finch','Cinder Vale','Aster Rune']) await expect(row(page,name)).toContainText('Running');
});

test('1.15 timeline_appends_and_filters', async ({ page }) => {
  const target = row(page, 'Aster Finch'); await target.getByRole('button', { name: 'Pause' }).click(); const panel = await openDetail(page, 'Aster Finch'); await panel.getByRole('tab', { name: 'History' }).click(); await expect(panel.locator('.timeline-item').first()).toContainText(/Manual pause checkpoint saved/i); const all = await panel.locator('.timeline-item').count(); await panel.getByLabel('Timeline event kind').selectOption('checkpoint'); expect(await panel.locator('.timeline-item').count()).toBeLessThan(all); await panel.getByRole('button', { name: 'Clear filter' }).click(); await expect(panel.locator('.timeline-item')).toHaveCount(all);
});

test('1.16 timeline_entry_highlights_step', async ({ page }) => {
  const target = row(page, 'Aster Finch'); await target.getByRole('button', { name: 'Pause' }).click(); const panel = await openDetail(page, 'Aster Finch'); await panel.getByRole('tab', { name: 'History' }).click(); await panel.locator('.timeline-label').filter({ hasText: /checkpoint/i }).first().click(); await expect(panel.getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected','true'); await expect(panel.locator('.step-row.is-highlighted')).toBeVisible();
});

test('1.17 work_summary_disclosure_behavior', async ({ page }) => {
  const first = row(page,'Aster Finch'); const toggle = first.locator('.summary-toggle'); await expect(toggle).toHaveAttribute('aria-expanded','false'); await toggle.click(); await expect(toggle).toHaveAttribute('aria-expanded','true'); await expect(first.locator('.summary-region')).toContainText('Active now'); await row(page,'Boreal Echo').locator('.summary-toggle').click(); await expect(toggle).toHaveAttribute('aria-expanded','true');
});

test('1.18 status_filter_union_and_clear', async ({ page }) => {
  await page.getByRole('checkbox',{name:'Idle'}).check(); await expect(page.locator('.agent-row')).toHaveCount(2); await page.getByRole('checkbox',{name:'Running'}).check(); await expect(page.locator('.agent-row')).toHaveCount(5); await expect(total(page)).toHaveText('9'); await page.getByRole('checkbox',{name:'Idle'}).uncheck(); await page.getByRole('checkbox',{name:'Running'}).uncheck(); await expect(page.locator('.agent-row')).toHaveCount(9);
  await row(page,'Boreal Sable').getByRole('button',{name:'Retry'}).click(); await page.getByRole('checkbox',{name:'Error'}).check(); await expect(page.getByText('No agents match the active filter')).toBeVisible(); await page.getByRole('button',{name:'Clear filter'}).click(); await expect(page.locator('.agent-row')).toHaveCount(9);
});

test('1.19 cancel_and_double_submit_guarded', async ({ page }) => {
  let modal = await openRegister(page); await modal.getByRole('button',{name:'Cancel'}).click(); await expect(page.locator('.agent-row')).toHaveCount(9); modal = await openRegister(page); await fillRegister(page,modal); await modal.getByRole('button',{name:'Register Agent'}).dblclick(); await expect(row(page,'Delta Signal')).toHaveCount(1); await expect(page.locator('.agent-row')).toHaveCount(10);
});

test('1.20 removed_agent_leaves_selection', async ({ page }) => {
  await page.getByRole('checkbox',{name:'Select Boreal Kite'}).check(); await removeAgent(page,'Boreal Kite'); await expect(page.getByRole('button',{name:'Pause All'})).toBeDisabled(); await expect(page.getByRole('button',{name:'Resume All'})).toBeDisabled();
});

test('1.23 fleet_export_live_snapshot', async ({ page }) => {
  await register(page); const data = await exportJson(page); expect(data.version).toBeTruthy(); expect(data.exportedAt).toMatch(/Z$/); expect(data.rollup.total).toBe(10); expect(data.agents).toHaveLength(10); expect(data.agents.find((a:any)=>a.name==='Delta Signal')).toMatchObject({agentType:'aster',editorIntegration:'vector',status:'idle',accessKey:'delta_signal_key_2026'}); expect(data.agents[0].timeline).toBeInstanceOf(Array); expect(data.agents[0].lastSeen).toMatch(/Z$/);
});

test('1.24 export_copy_and_download', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read','clipboard-write']); const modal = await openExport(page); const preview = await page.locator('.json-preview').textContent(); await modal.getByRole('button',{name:'Copy'}).click(); expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(preview); await expect(page.getByLabel('Notifications')).toContainText('Fleet JSON copied'); const event = page.waitForEvent('download'); await modal.getByRole('button',{name:'Download'}).click(); const download = await event; expect(download.suggestedFilename()).toMatch(/\.json$/); expect(await downloadedText(download)).toBe(preview);
});

test('1.25 fleet_import_round_trip', async ({ page }) => {
  await register(page); const data = await exportJson(page); await closeTopOverlay(page); const modal = await importText(page,JSON.stringify(data)); await modal.getByRole('button',{name:'Import fleet'}).click(); await expect(page.locator('.agent-row')).toHaveCount(10); await expect(row(page,'Delta Signal')).toContainText('Idle'); const next = await exportJson(page); expect(next.agents.map((a:any)=>a.name)).toEqual(data.agents.map((a:any)=>a.name)); expect(next.rollup).toEqual(data.rollup);
});

test('1.26 undo_redo_registry_mutations', async ({ page }) => {
  await expect(page.getByRole('button',{name:'Undo registry mutation'})).toBeDisabled(); await expect(page.getByRole('button',{name:'Redo registry mutation'})).toBeDisabled(); await register(page); await page.getByRole('button',{name:'Undo registry mutation'}).click(); await expect(row(page,'Delta Signal')).toHaveCount(0); await expect(total(page)).toHaveText('9'); await page.getByRole('button',{name:'Redo registry mutation'}).click(); await expect(row(page,'Delta Signal')).toHaveCount(1); await expect(total(page)).toHaveText('10');
});

test('1.27 command_palette_jump_and_actions', async ({ page }) => {
  await page.keyboard.press('Control+K'); const palette = page.locator('.palette-modal'); await expect(palette.getByRole('searchbox',{name:'Search commands'})).toBeVisible(); for (const label of ['Register Agent','Export fleet','Undo','Redo']) await expect(palette).toContainText(label); await palette.getByRole('searchbox').fill('Boreal Echo'); await palette.getByRole('button',{name:/Jump to Boreal Echo/}).click(); await expect(page.locator('.detail-panel')).toContainText('Boreal Echo'); await page.keyboard.press('Control+K'); await page.keyboard.press('Escape'); await expect(palette).toHaveCount(0);
});
