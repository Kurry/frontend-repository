// Real-browser self-test for the CipherLog oracle.
// Uses the repo-installed Playwright (NOT the shared playwright MCP).
// Serves the built app on :3101, exercises core workflows + WebMCP tools,
// asserts persistence across reload, and requires zero console/page errors.
import { chromium } from 'playwright/index.mjs';

const URL = 'http://localhost:3101';
const consoleErrors = [];
const pageErrors = [];
const results = [];
let failed = false;

function check(name, cond, detail = '') {
  results.push({ name, ok: !!cond, detail });
  if (!cond) { failed = true; console.log(`  FAIL: ${name} ${detail}`); }
  else console.log(`  ok:   ${name}`);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => pageErrors.push(String(e && e.message || e)));

try {
  await page.goto(URL, { waitUntil: 'networkidle' });

  // --- WebMCP surface present ---
  const info = await page.evaluate(() => window.webmcp_session_info && window.webmcp_session_info());
  check('webmcp_session_info exposed', info && info.contract_version === 'zto-webmcp-v1', JSON.stringify(info));
  const tools = await page.evaluate(() => window.webmcp_list_tools && window.webmcp_list_tools());
  check('webmcp_list_tools returns 12 tools', Array.isArray(tools) && tools.length === 12, `count=${tools && tools.length}`);

  // --- Create a channel via UI, then create a memo via WebMCP into it ---
  await page.getByRole('button', { name: 'Add New Channel' }).first().click();
  await page.locator('#desktop-new-channel-input').fill('Ops');
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await page.waitForTimeout(150);

  const created = await page.evaluate(() => window.webmcp_invoke_tool('entity_create_memo',
    { title: 'Falcon Handoff', channel: 'Ops', priority: 'high' }));
  check('entity_create_memo ok', created && created.ok === true, JSON.stringify(created));
  await page.waitForTimeout(150);
  check('created memo visible in list', await page.getByText('Falcon Handoff').count() > 0);
  check('High badge visible', await page.getByText('High', { exact: true }).count() > 0);

  // --- Create a second memo through the visible UI flow ---
  await page.getByRole('button', { name: 'Create New Transmission' }).click();
  await page.locator('#memo-title-input').fill('Night Watch');
  await page.locator('#memo-title-input').dispatchEvent('input');
  await page.waitForTimeout(150);
  await page.getByRole('button', { name: 'Return to list' }).click();
  await page.waitForTimeout(100);
  check('UI-created memo visible', await page.getByText('Night Watch').count() > 0);

  // --- Update memo priority via WebMCP, assert visible badge change ---
  const upd = await page.evaluate(() => window.webmcp_invoke_tool('entity_update_memo',
    { memo: 'Falcon Handoff', field: 'priority', value: 'low' }));
  check('entity_update_memo ok', upd && upd.ok === true, JSON.stringify(upd));
  await page.waitForTimeout(150);
  check('Low badge now present', await page.getByText('Low', { exact: true }).count() > 0);

  // --- Search filter via WebMCP ---
  await page.evaluate(() => window.webmcp_invoke_tool('browse_search', { query: 'Falcon' }));
  await page.waitForTimeout(150);
  check('search narrows list (Night Watch hidden)', await page.getByText('Night Watch').count() === 0);
  check('search keeps Falcon', await page.getByText('Falcon Handoff').count() > 0);
  await page.evaluate(() => window.webmcp_invoke_tool('browse_search', { query: '' }));
  await page.waitForTimeout(100);
  check('clearing search restores Night Watch', await page.getByText('Night Watch').count() > 0);

  // --- Theme core via WebMCP recolors app ---
  const themed = await page.evaluate(() => window.webmcp_invoke_tool('browse_set_theme', { theme: 'blood-red' }));
  check('browse_set_theme ok', themed && themed.ok === true, JSON.stringify(themed));
  await page.waitForTimeout(100);
  const htmlClass = await page.evaluate(() => document.documentElement.className);
  check('html carries blood-red theme class', htmlClass.includes('theme-blood-red'), htmlClass);

  // --- Delete (decommission) via WebMCP requires confirm ---
  const noConfirm = await page.evaluate(() => window.webmcp_invoke_tool('entity_delete_memo', { memo: 'Night Watch' }));
  check('delete without confirm rejected', noConfirm && noConfirm.ok === false, JSON.stringify(noConfirm));
  const del = await page.evaluate(() => window.webmcp_invoke_tool('entity_delete_memo', { memo: 'Night Watch', confirm: true }));
  check('entity_delete_memo confirm ok', del && del.ok === true, JSON.stringify(del));
  await page.waitForTimeout(150);
  check('decommissioned memo left main list', await page.getByText('Night Watch').count() === 0);

  // --- Cipher Lock through the real UI (passcode gesture) ---
  await page.getByText('Falcon Handoff').first().click();
  await page.waitForTimeout(150);
  await page.getByRole('main').getByRole('button', { name: 'Lock', exact: true }).click();
  await page.locator('#passcode-input').fill('1234');
  await page.getByRole('dialog').getByRole('button', { name: 'Lock', exact: true }).click();
  await page.waitForTimeout(150);
  check('ENCRYPTED placeholder shown when locked', await page.getByText('[ENCRYPTED]').count() > 0);

  // --- Persistence across full reload ---
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  check('memo persists after reload', await page.getByText('Falcon Handoff').count() > 0);
  check('theme persists after reload', (await page.evaluate(() => document.documentElement.className)).includes('theme-blood-red'));
  check('locked memo stays ENCRYPTED after reload', await page.getByText('[ENCRYPTED]').count() > 0);
  // decommissioned memo still in decommissioned view
  await page.evaluate(() => window.webmcp_invoke_tool('browse_open', { destination: 'decommissioned' }));
  await page.waitForTimeout(150);
  check('decommissioned memo persisted in decommissioned view', await page.getByText('Night Watch').count() > 0);

  check('zero console errors', consoleErrors.length === 0, consoleErrors.join(' | '));
  check('zero page errors', pageErrors.length === 0, pageErrors.join(' | '));
} catch (e) {
  failed = true;
  console.log('EXCEPTION:', e && e.stack || e);
} finally {
  await browser.close();
}

console.log('\n=== SUMMARY ===');
console.log(`checks: ${results.filter(r => r.ok).length}/${results.length} passed`);
console.log(`consoleErrors: ${consoleErrors.length}  pageErrors: ${pageErrors.length}`);
if (consoleErrors.length) console.log('console errors:', consoleErrors);
if (pageErrors.length) console.log('page errors:', pageErrors);
process.exit(failed ? 1 : 0);
