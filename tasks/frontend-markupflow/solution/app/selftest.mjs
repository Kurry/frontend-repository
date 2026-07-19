// MarkupFlow oracle self-test — real headless Chromium via the repo's installed
// Playwright. Serves the built app on port 3103, exercises the core annotation
// workflow + WebMCP tools, asserts persistence across reload, and requires zero
// console errors and zero page errors.
//
// Run:  node /Users/kurrytran/frontend-repository/Markupflow/selftest.mjs
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire('/Users/kurrytran/frontend-repository/');
const { chromium } = require('playwright');

const PORT = 3103;
const APP_DIR = '/Users/kurrytran/frontend-repository/Markupflow/solution/app';
const URL = `http://localhost:${PORT}`;

const consoleErrors = [];
const pageErrors = [];
let server;

function fail(msg) { throw new Error(msg); }
function assert(cond, msg) { if (!cond) fail(msg); }

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 300));
  }
  fail(`server did not come up at ${url}`);
}

async function main() {
  server = spawn('npm', ['start', '--', '--port', String(PORT), '--strictPort'], {
    cwd: APP_DIR, stdio: 'ignore', env: { ...process.env },
  });
  await waitForServer(URL);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  await page.goto(URL, { waitUntil: 'networkidle' });

  // 1. Empty state visible before any image.
  await page.getByRole('button', { name: 'Try sample image' }).waitFor({ state: 'visible' });
  assert(await page.getByText('No annotations yet.').isVisible(), 'empty layer message missing');

  // 2. Load the sample image.
  await page.getByRole('button', { name: 'Try sample image' }).click();
  await page.waitForFunction(() => !!document.querySelector('.base-canvas'), null, { timeout: 5000 });
  await page.waitForTimeout(400);

  // 3. Create/add an annotation via a real UI path (keyboard placement on canvas).
  //    Select the Rectangle tool, focus the canvas, press Enter.
  await page.getByRole('button', { name: 'Draw rectangle' }).click();
  const canvas = page.locator('canvas[role="application"]');
  await canvas.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  let layerCount = await page.locator('[role="listitem"][aria-label^="Layer"]').count();
  assert(layerCount === 1, `expected 1 layer after add, got ${layerCount}`);

  // 4. WebMCP: session info + list tools present.
  const session = await page.evaluate(() => window.webmcp_session_info());
  assert(session.contract_version === 'zto-webmcp-v1', 'wrong contract version');
  assert(session.modules.includes('structured-editor-v1') && session.modules.includes('entity-collection-v1'), 'missing modules');
  const tools = await page.evaluate(() => window.webmcp_list_tools().map((t) => t.name));
  for (const t of ['editor_add', 'editor_select', 'editor_delete', 'editor_update_property', 'editor_switch_mode', 'editor_preview', 'entity_create', 'entity_select', 'entity_update', 'entity_delete']) {
    assert(tools.includes(t), `missing tool ${t}`);
  }

  // 5. WebMCP editor_add adds an annotation (same store path) — assert visible layer delta.
  const addRes = await page.evaluate(() => window.webmcp_invoke_tool('editor_add', { object_type: 'text' }));
  assert(addRes.ok === true, `editor_add failed: ${JSON.stringify(addRes)}`);
  await page.waitForTimeout(150);
  layerCount = await page.locator('[role="listitem"][aria-label^="Layer"]').count();
  assert(layerCount === 2, `expected 2 layers after webmcp add, got ${layerCount}`);

  // 6. WebMCP select + update_property on the added text annotation.
  const selRes = await page.evaluate((id) => window.webmcp_invoke_tool('editor_select', { id }), addRes.id);
  assert(selRes.ok === true && selRes.selected === addRes.id, `editor_select failed: ${JSON.stringify(selRes)}`);
  const propRes = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { property: 'font-size', value: 48 }));
  assert(propRes.ok === true, `editor_update_property failed: ${JSON.stringify(propRes)}`);
  // bounds rejection
  const badProp = await page.evaluate(() => window.webmcp_invoke_tool('editor_update_property', { property: 'font-size', value: 999 }));
  assert(badProp.ok === false, 'out-of-bounds font-size should be rejected');

  // 7. WebMCP switch_mode preview then edit — assert toolbar hidden in preview.
  const pv = await page.evaluate(() => window.webmcp_invoke_tool('editor_switch_mode', { mode: 'preview' }));
  assert(pv.ok === true && pv.mode === 'preview', 'switch to preview failed');
  await page.waitForTimeout(100);
  assert(await page.locator('aside.tool-panel.preview-hidden').count() === 1, 'toolbar not hidden in preview mode');
  await page.evaluate(() => window.webmcp_invoke_tool('editor_switch_mode', { mode: 'edit' }));

  // 8. entity_create — save a project (visible in saved-projects list).
  await page.getByLabel('Project name').fill('Selftest project');
  const createRes = await page.evaluate(() => window.webmcp_invoke_tool('entity_create', { name: 'Selftest project' }));
  assert(createRes.ok === true, `entity_create failed: ${JSON.stringify(createRes)}`);
  await page.waitForTimeout(150);
  assert(await page.getByText('Selftest project').first().isVisible(), 'saved project row not visible');
  // delete requires confirm
  const noConfirm = await page.evaluate(() => window.webmcp_invoke_tool('entity_delete', { id: 'x', confirm: false }));
  assert(noConfirm.ok === false, 'entity_delete without confirm should fail');

  // 9. Delete one annotation via the Layer Panel Delete control (real UI path).
  const beforeDel = await page.locator('[role="listitem"][aria-label^="Layer"]').count();
  await page.locator('[role="listitem"][aria-label^="Layer"]').first().getByRole('button', { name: /^Delete/ }).click();
  await page.waitForTimeout(150);
  const afterDel = await page.locator('[role="listitem"][aria-label^="Layer"]').count();
  assert(afterDel === beforeDel - 1, `delete did not remove a layer (${beforeDel} -> ${afterDel})`);

  // 10. Persistence: capture annotation count, reload, assert restored.
  const preReload = await page.evaluate(() => JSON.parse(localStorage.getItem('markupflow-state')).annotations.length);
  assert(preReload === afterDel, `localStorage annotation count mismatch (${preReload} vs ${afterDel})`);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const restored = await page.locator('[role="listitem"][aria-label^="Layer"]').count();
  assert(restored === afterDel, `annotations not restored after reload (${restored} vs ${afterDel})`);
  assert(await page.getByText('Selftest project').first().isVisible(), 'saved project not restored after reload');

  await browser.close();

  if (consoleErrors.length) fail(`console errors:\n${consoleErrors.join('\n')}`);
  if (pageErrors.length) fail(`page errors:\n${pageErrors.join('\n')}`);
  console.log('SELFTEST PASS — all workflows OK, consoleErr=0 pageErr=0');
}

main()
  .then(() => { if (server) server.kill('SIGKILL'); process.exit(0); })
  .catch((err) => { console.error('SELFTEST FAIL:', err.message); if (server) server.kill('SIGKILL'); process.exit(1); });
