// Self-test for the TagNote oracle. Uses the repo's installed Playwright
// (NOT the shared playwright MCP). Serves the built app on port 3102, drives
// core workflows, exercises the WebMCP surface, verifies localStorage
// persistence across reload, and requires zero console errors / page errors.
//
// Run:  node Tagnote/selftest.mjs   (from repo root, after building the oracle)
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { setTimeout as sleep } from 'node:timers/promises';

const require = createRequire('/Users/kurrytran/frontend-repository/');
const { chromium } = require('playwright');

const PORT = 3102;
const APP = '/Users/kurrytran/frontend-repository/Tagnote/solution/app';
const URL = `http://localhost:${PORT}`;

const consoleErrors = [];
const pageErrors = [];

function fail(msg) {
  console.error('SELFTEST FAIL:', msg);
  process.exitCode = 1;
  throw new Error(msg);
}
function assert(cond, msg) {
  if (!cond) fail(msg);
  else console.log('  ok -', msg);
}

// Serve the built dist on PORT via the app's own http-server dependency.
const server = spawn(
  `${APP}/node_modules/.bin/http-server`,
  ['dist', '-a', '127.0.0.1', '-p', String(PORT), '-c-1', '--silent'],
  { cwd: APP, stdio: 'ignore' }
);

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(URL);
      if (r.ok) return;
    } catch {}
    await sleep(300);
  }
  fail('server did not come up on port ' + PORT);
}

async function main() {
  await waitForServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('h1:has-text("TagNote")');

  // Empty state on fresh load.
  assert(
    await page.getByText('Send your first note to get started!').isVisible(),
    'empty-state prompt shown on fresh load'
  );

  // 1) Create a note through the composer with inline tags + a URL.
  const composer = page.getByLabel('Note composer');
  await composer.fill('call mom #family #todo see https://example.com');
  await page.getByRole('button', { name: 'Send' }).click();
  await page.waitForSelector('text=call mom');
  assert(
    (await page.locator('span:has-text("#family")').count()) >= 1,
    'note shows #family tag chip'
  );
  assert(
    (await page.locator('span:has-text("#link")').count()) >= 1,
    'URL auto-adds #link tag chip'
  );
  assert(
    (await page.locator('a[href="https://example.com"]').count()) >= 1,
    'URL renders as a clickable link'
  );

  // 2) Create a second note, tag/filter workflow.
  await composer.fill('buy milk #todo');
  await page.getByRole('button', { name: 'Send' }).click();
  await page.waitForSelector('text=buy milk');

  // Tag rail shows #todo with count 2; filter by it.
  const todoChip = page.locator('button', { hasText: '#todo' }).first();
  await todoChip.click();
  await page.waitForTimeout(150);
  assert(await page.getByText('Clear filter').isVisible(), 'Clear filter affordance visible when filtered');
  assert(
    (await page.locator('text=call mom').count()) >= 1 &&
      (await page.locator('text=buy milk').count()) >= 1,
    'filtering by #todo shows both notes'
  );
  await page.getByText('Clear filter').click();

  // 3) Edit workflow. Wait for edit mode (composer sync task done) before filling.
  await page.getByRole('button', { name: 'Edit' }).first().click();
  await page.waitForSelector('text=Editing note');
  await composer.fill('call dad #family');
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForSelector('text=call dad');

  // 4) WebMCP: session info + list + invoke create, assert visible result.
  const sess = await page.evaluate(() => window.webmcp_session_info());
  assert(sess && sess.contract === 'zto-webmcp-v1', 'webmcp_session_info contract is zto-webmcp-v1');
  const toolNames = await page.evaluate(() => window.webmcp_list_tools().map((t) => t.name));
  const expected = [
    'entity_create_note', 'entity_select_note', 'entity_update_note',
    'entity_toggle_note', 'entity_delete_note',
    'browse_open', 'browse_search', 'browse_apply_filter', 'browse_clear_filter',
  ];
  assert(expected.every((n) => toolNames.includes(n)), 'all expected webmcp tools listed');

  const createRes = await page.evaluate(() =>
    window.webmcp_invoke_tool('entity_create_note', { text: 'mcp made this #work' })
  );
  assert(createRes.ok === true && createRes.result.id, 'webmcp entity_create_note returns ok with id');
  const mcpId = createRes.result.id;
  await page.waitForSelector('text=mcp made this');
  assert(
    (await page.locator('text=mcp made this').count()) >= 1,
    'note created via WebMCP is visible in the timeline'
  );

  // WebMCP toggle (pin) reflects visibly.
  const pinRes = await page.evaluate((id) =>
    window.webmcp_invoke_tool('entity_toggle_note', { id, field: 'pinned' }), mcpId);
  assert(pinRes.ok === true && pinRes.result.pinned === true, 'webmcp toggle pinned=true');
  await page.waitForSelector('h2:has-text("Pinned")');
  assert(await page.locator('h2:has-text("Pinned")').isVisible(), 'Pinned section appears after WebMCP pin');

  // WebMCP delete requires confirm=true; without it should error.
  const noConfirm = await page.evaluate((id) =>
    window.webmcp_invoke_tool('entity_delete_note', { id }), mcpId);
  assert(noConfirm.ok === false, 'webmcp delete without confirm=true is rejected');

  // 5) View switch via WebMCP browse_open (calendar) then back to timeline.
  const cal = await page.evaluate(() => window.webmcp_invoke_tool('browse_open', { destination: 'calendar' }));
  assert(cal.ok === true, 'webmcp browse_open calendar ok');
  await page.waitForTimeout(150);
  assert((await page.locator('button:has-text("Previous")').count()) >= 1, 'calendar month grid visible');
  await page.evaluate(() => window.webmcp_invoke_tool('browse_open', { destination: 'timeline' }));
  await page.waitForTimeout(150);

  // 6) Delete a note via the visible UI confirm dialog.
  const before = await page.locator('.group.relative.rounded-\\[7px\\]').count();
  await page.getByRole('button', { name: 'Delete' }).first().click();
  await page.waitForSelector('text=Are you sure');
  await page.getByRole('button', { name: 'Delete' }).last().click();
  await page.waitForTimeout(200);
  const after = await page.locator('.group.relative.rounded-\\[7px\\]').count();
  assert(after === before - 1, 'confirmed delete removes exactly one note');

  // 7) Persistence: capture note texts, reload, assert restored.
  const textsBefore = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('tagnote-state')).notes.map((n) => n.text).sort()
  );
  assert(textsBefore.length >= 2, 'localStorage holds the created notes before reload');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('h1:has-text("TagNote")');
  const textsAfter = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('tagnote-state')).notes.map((n) => n.text).sort()
  );
  assert(
    JSON.stringify(textsBefore) === JSON.stringify(textsAfter),
    'state persists identically across a full reload'
  );
  assert(
    (await page.locator('text=call dad').count()) >= 1,
    'persisted note text is rendered after reload'
  );

  await browser.close();

  if (consoleErrors.length) fail('console errors: ' + JSON.stringify(consoleErrors, null, 2));
  if (pageErrors.length) fail('page errors: ' + JSON.stringify(pageErrors, null, 2));
  console.log('\nSELFTEST PASS — console errors: 0, page errors: 0');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => {
    server.kill('SIGKILL');
  });
