import { test, expect } from './fixtures';
import { css, openApp, openDetail, openExport, row } from './helpers';
// NOT-AUTOMATABLE:
// - 2.7 visual_polish_rating — a five-point aesthetic-quality score cannot be assigned deterministically.
test.beforeEach(async({page})=>openApp(page));
test('2.1 console_layout_composition',async({page})=>{await page.setViewportSize({width:1440,height:900});await expect(page.locator('.agent-table')).toBeVisible();for(const name of ['Register Agent','Export fleet','Import fleet','Pause All','Resume All'])await expect(page.getByRole('button',{name}).first()).toBeVisible();await expect(page.getByRole('button',{name:'Undo registry mutation'})).toBeVisible();await openDetail(page);await expect(page.getByRole('tab')).toHaveText(['Configuration','History','Activity']);});
test('2.2 status_color_mapping_consistent', async ({ page }) => {
  const colors = {
    running: { badge: 'rgb(208, 226, 255)', rollup: 'rgb(120, 169, 255)' },
    idle: { badge: 'rgb(167, 240, 186)', rollup: 'rgb(66, 190, 101)' },
    paused: { badge: 'rgb(158, 240, 240)', rollup: 'rgb(94, 229, 229)' },
    error: { badge: 'rgb(255, 215, 217)', rollup: 'rgb(250, 77, 86)' },
    offline: { badge: 'rgb(244, 244, 244)', rollup: 'rgb(141, 141, 141)' },
  };

  for (const [status, expected] of Object.entries(colors)) {
    const badges = page.locator(`.status-tag.status-${status}`);
    await expect(badges.first()).toBeVisible();
    const badgeColors = await badges.evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).color),
    );
    expect(new Set(badgeColors)).toEqual(new Set([expected.badge]));
    expect(await css(page.locator(`.rollup-${status} .status-dot`), 'background-color')).toBe(expected.rollup);
  }

  const detail = await openDetail(page);
  expect(await css(detail.locator('.status-tag.status-running').first(), 'color')).toBe(colors.running.badge);
  await expect(row(page, 'Boreal Sable').locator('.error-status-cell')).toBeVisible();
});
test('2.3 rollup_tiles_and_status_icons',async({page})=>{await expect(page.locator('.rollup-strip > div')).toHaveCount(6);const backgrounds=await page.locator('.rollup-strip > div').evaluateAll((els)=>els.map((e)=>getComputedStyle(e).backgroundColor));expect(new Set(backgrounds).size).toBe(1);const panel=await openDetail(page);await panel.getByRole('tab',{name:'Activity'}).click();await expect(panel.locator('.step-icon')).toHaveCount(5);});
test('2.4 type_hierarchy_clear',async({page})=>{const pageTitle=parseFloat(await css(page.getByRole('heading',{name:'Agent registry'}),'font-size'));const panelHeading=parseFloat(await css(page.getByRole('heading',{name:'Fleet agents'}),'font-size'));const body=parseFloat(await css(page.locator('.agent-row').first(),'font-size'));expect(pageTitle).toBeGreaterThan(panelHeading);expect(panelHeading).toBeGreaterThan(body);});
test('2.5 spacing_and_dividers_consistent',async({page})=>{const toolbar=page.locator('.fleet-toolbar');expect(parseFloat(await css(toolbar,'gap'))).toBeGreaterThan(0);const rowBorder=await css(page.locator('.agent-row td').first(),'border-bottom-width');expect(parseFloat(rowBorder)).toBeGreaterThan(0);const carbonIcons=await page.locator('svg').evaluateAll((els)=>els.filter((e)=>!e.classList.contains('cds--modal-close__icon')).length);expect(carbonIcons).toBeGreaterThan(5);});
test('2.6 control_states_distinct',async({page})=>{const button=page.getByRole('button',{name:'Register Agent'}).first();const bg=await css(button,'background-color');await button.hover();await expect.poll(()=>css(button,'background-color')).not.toBe(bg);await button.focus();expect(await css(button,'outline-style')).not.toBe('none');await expect(page.getByRole('button',{name:'Pause All'})).toBeDisabled();});
test('2.10 export_drawer_monospace_preview',async({page})=>{const modal=await openExport(page);const preview=page.locator('.json-preview');expect(await css(preview,'font-family')).toMatch(/mono/i);await expect(modal.getByRole('button',{name:'Copy'})).toBeVisible();await expect(modal.getByRole('button',{name:'Download'})).toBeVisible();});
