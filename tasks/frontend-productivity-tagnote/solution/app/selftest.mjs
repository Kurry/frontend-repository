// Self-test for the TagNote oracle. Uses the repo's installed Playwright
// (NOT the shared playwright MCP). Serves the built app on port 3102, drives
// core workflows, exercises the WebMCP surface, verifies in-memory reload
// baseline, and requires zero console errors / page errors.
//
// Run:  node selftest.mjs   (from solution/app, after building the oracle)
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const APP = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(APP, 'package.json'));
const { chromium } = require('playwright');

const PORT = 3102;
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

  assert(
    await page.getByText('Send your first note to get started!').isVisible(),
    'empty-state prompt shown on fresh load'
  );

  const composer = page.getByLabel('Note text');
  await composer.fill('call mom #family #todo see https://example.com');
  await page.getByRole('button', { name: 'Send' }).click();
  await page.waitForSelector('text=call mom');
  assert(
    (await page.locator('span:has-text("#family")').count()) >= 1,
    'note shows #family tag chip'
  );

  await composer.fill('buy milk #todo');
  await page.getByRole('button', { name: 'Send' }).click();
  await page.waitForSelector('text=buy milk');

  const todoChip = page.locator('button', { hasText: '#todo' }).first();
  await todoChip.click();
  await page.waitForTimeout(150);
  assert(await page.getByText('Clear filter').isVisible(), 'Clear filter affordance visible when filtered');
  await page.getByText('Clear filter').click();

  await page.getByRole('button', { name: 'Edit' }).first().click();
  await page.waitForSelector('text=Editing Note');
  await composer.fill('call dad #family');
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForSelector('text=call dad');

  const sess = await page.evaluate(() => window.webmcp_session_info());
  assert(sess && sess.contract === 'zto-webmcp-v1', 'webmcp_session_info contract is zto-webmcp-v1');
  const toolNames = await page.evaluate(() => window.webmcp_list_tools().map((t) => t.name));
  const expected = [
    'entity_create_note', 'entity_select_note', 'entity_update_note',
    'entity_toggle_note', 'entity_delete_note',
    'browse_open', 'browse_search', 'browse_apply_filter', 'browse_clear_filter',
    'artifact_export', 'artifact_import', 'artifact_copy',
  ];
  assert(expected.every((n) => toolNames.includes(n)), 'all expected webmcp tools listed');

  const createRes = await page.evaluate(() =>
    window.webmcp_invoke_tool('entity_create_note', { text: 'mcp made this #work' })
  );
  assert(createRes.ok === true && createRes.result.id, 'webmcp entity_create_note returns ok with id');
  await page.waitForSelector('text=mcp made this');
  assert(
    (await page.locator('text=mcp made this').count()) >= 1,
    'note created via WebMCP is visible in the timeline'
  );

  const exportRes = await page.evaluate(() => window.webmcp_invoke_tool('artifact_export', {}));
  assert(exportRes.ok === true, 'webmcp artifact_export ok');
  await page.waitForSelector('text=Session JSON');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('h1:has-text("TagNote")');
  assert(
    await page.getByText('Send your first note to get started!').isVisible(),
    'reload returns empty seeded baseline'
  );
  const storageEmpty = await page.evaluate(
    () => localStorage.length === 0 && sessionStorage.length === 0
  );
  assert(storageEmpty, 'browser storage remains empty after reload');

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
