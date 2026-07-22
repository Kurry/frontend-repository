// SwiftNote oracle self-test — real headless Chromium via the repo's installed playwright.
// Serves the built Angular app on port 3104, exercises the core workflows and the
// WebMCP surface, verifies localStorage persistence across reload, and REQUIRES zero
// console errors and zero page errors.
//
//   node Swiftnote/selftest.mjs
//
// Uses playwright resolved from /Users/kurrytran/frontend-repository/node_modules.

import { createRequire } from 'module';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const REPO = '/Users/kurrytran/frontend-repository';
const require = createRequire(path.join(REPO, 'node_modules', 'placeholder.js'));
const { chromium } = require('playwright');

const APP_DIR = path.dirname(fileURLToPath(import.meta.url)) + '/solution/app';
const DIST = path.join(APP_DIR, 'dist/angular-ngrx-material/browser');
const PORT = 3104;
const URL = `http://localhost:${PORT}/`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
function check(cond, msg) {
  if (cond) { console.log('  ok  ', msg); }
  else { console.log('  FAIL', msg); failures++; }
}

async function main() {
  // 1. serve the built app
  const server = spawn(
    path.join(APP_DIR, 'node_modules/.bin/http-server'),
    [DIST, '-p', String(PORT), '-a', '0.0.0.0', '-c-1', '--silent'],
    { stdio: 'ignore' }
  );
  await sleep(1200);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  try {
    await page.goto(URL, { waitUntil: 'networkidle' });

    // ---- WebMCP surface present ----
    const info = await page.evaluate(() => window.webmcp_session_info && window.webmcp_session_info());
    check(!!info && info.contract_version === 'zto-webmcp-v1', 'webmcp_session_info exposes contract zto-webmcp-v1');
    const tools = await page.evaluate(() => window.webmcp_list_tools());
    const toolNames = tools.map((t) => t.name).sort();
    check(
      ['browse_open', 'browse_search', 'entity_create', 'entity_delete', 'entity_select', 'entity_toggle', 'entity_update'].every((n) => toolNames.includes(n)),
      'webmcp_list_tools lists all 7 tools: ' + toolNames.join(', ')
    );

    // ---- empty state on first load ----
    check(await page.locator('text=No notes yet').count() > 0, 'empty-state message shown before any note exists');

    // ---- create note via UI (Create note button) ----
    await page.locator('button.pill-btn', { hasText: 'Create note' }).click();
    await sleep(150);
    // title field should be focused — type without clicking
    await page.keyboard.type('Grocery List');
    await sleep(100);
    await page.locator('#note-body').fill('milk eggs bread pineapple');
    await sleep(200);
    check(await page.locator('.note-title', { hasText: 'Grocery List' }).count() > 0, 'sidebar row reflects typed title "Grocery List"');
    check(await page.locator('.saved-indicator').count() > 0, 'transient Saved indicator appears after edit');

    // ---- create a second note, edit it, confirm it sorts to top ----
    await page.locator('button.pill-btn', { hasText: 'Create note' }).click();
    await sleep(150);
    await page.keyboard.type('Meeting Notes');
    await sleep(100);
    await page.locator('#note-body').fill('sync with alpha team');
    await sleep(200);
    const firstRowTitle = await page.locator('.note-row .note-title').first().innerText();
    check(firstRowTitle.includes('Meeting Notes'), 'most-recently-edited note sorts to top of sidebar');

    // ---- pin the older note via WebMCP entity_toggle, confirm it rises above ----
    const groceryId = await page.evaluate(() => {
      const info = window.webmcp_session_info();
      void info;
      // find the Grocery note id via the store-independent list tool path:
      // use entity_select on each? Simpler: read from list via a search.
      return null;
    });
    void groceryId;
    // Pin via UI: select Grocery List row then click Pin
    await page.locator('.note-row .note-title', { hasText: 'Grocery List' }).click();
    await sleep(150);
    await page.locator('button[aria-label="Pin note"]').click();
    await sleep(200);
    const topAfterPin = await page.locator('.note-row .note-title').first().innerText();
    check(topAfterPin.includes('Grocery List'), 'pinned note rises above newer unpinned note');

    // ---- WebMCP invoke: browse_search narrows the list, returns match count ----
    const searchResult = await page.evaluate(() => window.webmcp_invoke_tool('browse_search', { query: 'pineapple' }));
    await sleep(200);
    check(searchResult && searchResult.ok === true && searchResult.matches === 1, 'browse_search("pineapple") returns ok with matches=1');
    const rowsWhileSearching = await page.locator('.note-row').count();
    check(rowsWhileSearching === 1, 'sidebar visibly narrows to 1 row during WebMCP search');
    check(await page.locator('mark', { hasText: 'pineapple' }).count() > 0, 'matching term highlighted in preview');
    // clear search
    await page.evaluate(() => window.webmcp_invoke_tool('browse_search', { query: '' }));
    await sleep(150);
    check(await page.locator('.note-row').count() === 2, 'clearing search restores both rows');

    // ---- WebMCP invoke: browse_open quick-switcher opens overlay ----
    const openRes = await page.evaluate(() => window.webmcp_invoke_tool('browse_open', { destination: 'quick-switcher' }));
    await sleep(200);
    check(openRes && openRes.quickSwitcherOpen === true, 'browse_open quick-switcher reports overlay open');
    check(await page.locator('.qs-panel').count() > 0, 'Quick Switcher overlay visible in DOM');
    await page.keyboard.press('Escape');
    await sleep(150);
    check(await page.locator('.qs-panel').count() === 0, 'Escape closes Quick Switcher');

    // ---- WebMCP invoke: entity_create then entity_update ----
    const created = await page.evaluate(() => window.webmcp_invoke_tool('entity_create', {}));
    await sleep(150);
    check(created && created.ok === true && created.count === 3, 'entity_create adds a 3rd note');
    const upd = await page.evaluate((id) => window.webmcp_invoke_tool('entity_update', { id, field: 'title', value: 'Via WebMCP' }), created.id);
    await sleep(200);
    check(upd && upd.ok === true, 'entity_update sets title');
    check(await page.locator('.note-title', { hasText: 'Via WebMCP' }).count() > 0, 'WebMCP-updated title visible in sidebar');
    // guardrail: bogus field rejected
    const bad = await page.evaluate((id) => window.webmcp_invoke_tool('entity_update', { id, field: 'evil', value: 'x' }), created.id);
    check(bad && bad.ok === false, 'entity_update rejects field outside {title,body}');
    // guardrail: delete without confirm rejected
    const noConfirm = await page.evaluate((id) => window.webmcp_invoke_tool('entity_delete', { id }), created.id);
    check(noConfirm && noConfirm.ok === false, 'entity_delete without confirm=true is rejected');
    // delete with confirm
    const del = await page.evaluate((id) => window.webmcp_invoke_tool('entity_delete', { id, confirm: true }), created.id);
    await sleep(200);
    check(del && del.ok === true && del.count === 2, 'entity_delete with confirm=true removes the note');

    // ---- delete via UI requires confirm step ----
    // (clicking a row toggles selection, so land on Grocery first, then Meeting Notes)
    await page.locator('.note-row .note-title', { hasText: 'Grocery List' }).click();
    await sleep(150);
    await page.locator('.note-row .note-title', { hasText: 'Meeting Notes' }).click();
    await sleep(150);
    await page.locator('button[aria-label="Delete note"]').click();
    await sleep(150);
    check(await page.locator('.delete-confirm-bar').count() > 0, 'Delete shows an explicit confirm step, not a one-click wipe');
    await page.locator('.delete-confirm-bar button', { hasText: 'Cancel' }).click();
    await sleep(150);
    check(await page.locator('.note-row .note-title', { hasText: 'Meeting Notes' }).count() > 0, 'Cancel preserves the note');

    // ---- persistence across reload ----
    const beforeReload = await page.locator('.note-row').count();
    await page.reload({ waitUntil: 'networkidle' });
    await sleep(400);
    const afterReload = await page.locator('.note-row').count();
    check(afterReload === beforeReload && afterReload === 2, `notes persist across reload (${afterReload} rows restored)`);
    check(await page.locator('.note-title', { hasText: 'Grocery List' }).count() > 0, 'pinned "Grocery List" restored after reload');
    const topAfterReload = await page.locator('.note-row .note-title').first().innerText();
    check(topAfterReload.includes('Grocery List'), 'pin ordering survives reload (pinned note still on top)');

    // ---- console / page error gate ----
    check(consoleErrors.length === 0, `zero console errors (saw ${consoleErrors.length})`);
    check(pageErrors.length === 0, `zero page errors (saw ${pageErrors.length})`);
    if (consoleErrors.length) console.log('  console errors:', consoleErrors);
    if (pageErrors.length) console.log('  page errors:', pageErrors);
  } finally {
    await browser.close();
    server.kill('SIGKILL');
  }

  console.log(failures === 0 ? '\nSELFTEST PASS' : `\nSELFTEST FAIL (${failures} failures)`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
