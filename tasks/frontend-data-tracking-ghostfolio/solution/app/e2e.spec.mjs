// ============================================================================
// CANONICAL ORACLE E2E SUITE — workspace contract (do not edit this region).
// Owned by `corpuscheck propagate`; the canonical region ends at the marker
// below. ADD task-specific criterion tests AFTER the marker — one test per
// rubric criterion, named `test('<id> <criterion_name>', ...)`.
//
// Run: start the app first (`npm run start`, port 3000), then
//   npx playwright test -c e2e.playwright.config.mjs
// (the sibling canonical config pins discovery to this file, so it works even
// when the app has its own playwright.config for other suites).
// Requires devDependency: @playwright/test (^1.x) — use the app's EXISTING
// @playwright/test if present; never install a second copy (duplicate
// instances break test loading).
// ============================================================================
import { test as base, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

export const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`console.error: ${m.text()}`); });
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    await use(page);
    expect(errors, 'zero console/page errors required').toEqual([]);
  },
});
export { expect };

export const listTools = (page) => page.evaluate(async () => {
  const r = await window.webmcp_list_tools();
  return typeof r === 'string' ? JSON.parse(r) : r;
});
export const invokeTool = (page, name, args = {}) => page.evaluate(async ([n, a]) => {
  const r = await window.webmcp_invoke_tool(n, a);
  try { return typeof r === 'string' ? JSON.parse(r) : r; } catch { return r; }
}, [name, args]);

test.describe('workspace contract (canonical)', () => {
  test('serves non-empty app with zero console errors', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len, 'body renders visible content').toBeGreaterThan(0);
  });

  test('webmcp surface is registered and well-formed', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const kinds = await page.evaluate(() => ({
      session_info: typeof window.webmcp_session_info,
      list_tools: typeof window.webmcp_list_tools,
      invoke_tool: typeof window.webmcp_invoke_tool,
    }));
    expect(kinds).toEqual({ session_info: 'function', list_tools: 'function', invoke_tool: 'function' });
    const tools = await listTools(page);
    const arr = Array.isArray(tools) ? tools : tools?.tools ?? [];
    expect(arr.length, 'at least one webmcp tool registered').toBeGreaterThan(0);
    for (const t of arr) expect(typeof (t.name ?? t.id), 'every tool has a name').toBe('string');
  });

  test('reduced motion behaviorally suppresses animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // Install the collector before navigation so load/hydration animations are
    // observed too. Keep it running through network idle and a settled 1.5s
    // window so late-starting effects cannot escape the assertion.
    await page.addInitScript(() => {
      window.__reducedMotionOffenders = [];
      const seen = new Set();
      const sample = () => {
        for (const animation of document.getAnimations({ subtree: true })) {
          if (animation.playState !== 'running') continue;
          let timing = {};
          try { timing = animation.effect?.getComputedTiming?.() ?? {}; } catch { /* detached */ }
          const duration = typeof timing.duration === 'number' ? timing.duration : 0;
          if (duration <= 1) continue;
          const offender = {
            kind: animation.constructor?.name ?? 'Animation',
            name: animation.animationName ?? animation.transitionProperty ?? animation.id ?? '(anonymous)',
            duration,
            iterations: timing.iterations ?? 1,
          };
          const key = JSON.stringify(offender);
          if (!seen.has(key)) {
            seen.add(key);
            window.__reducedMotionOffenders.push(offender);
          }
        }
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Precondition sanity check: the emulation actually reaches the app.
    const reduced = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
    expect(reduced, 'precondition: app sees prefers-reduced-motion: reduce').toBe(true);
    // Observe every frame for another 1.5s after load settles and assert on
    // everything seen since the document started.
    // Finished, idle, or paused effects and durations <=1ms are allowed; any
    // meaningfully timed RUNNING effect at any sample is a reduced-motion
    // failure. Apps with zero animations pass vacuously (the render/console
    // test still gates them).
    await page.waitForTimeout(1500);
    const offenders = await page.evaluate(() => window.__reducedMotionOffenders ?? []);
    expect(offenders, 'no running animation/transition with meaningful duration under reduced motion').toEqual([]);
  });

  test('no horizontal overflow at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, 'no horizontal page scroll at 375px').toBeLessThanOrEqual(1);
  });
});

// ==== END CANONICAL REGION — add task-specific criterion tests below. ====

// ----------------------------------------------------------------------------
// Task-specific criterion tests for frontend-data-tracking-ghostfolio.
// One test per tests/<dim>/<dim>.toml criterion, traced against the real
// oracle at solution/app/src/app.js (vanilla-JS single store, localStorage
// key 'ghostfolio.store.v2', seeded with AAPL/VT/USD-cash/BTC holdings and
// four seeded activities).
// ----------------------------------------------------------------------------

const parseMoney = (t) => Number(String(t ?? '').replace(/[$,]/g, ''));
const parsePct = (t) => Number(String(t ?? '').replace('%', ''));

async function holdingRows(page) {
  return page.locator('#holdings-body tr[data-id]');
}

async function fillHoldingForm(page, { name, symbol, assetClass, quantity, unitPrice, currency, dataSource }) {
  if (name !== undefined) await page.locator('#f-name').fill(name);
  if (symbol !== undefined) await page.locator('#f-symbol').fill(symbol);
  if (assetClass !== undefined) await page.locator('#f-class').selectOption(assetClass);
  if (quantity !== undefined) await page.locator('#f-qty').fill(String(quantity));
  if (unitPrice !== undefined) await page.locator('#f-price').fill(String(unitPrice));
  if (currency !== undefined) await page.locator('#f-currency').selectOption(currency);
  if (dataSource !== undefined) await page.locator('#f-source').selectOption(dataSource);
}

async function addHoldingViaForm(page, data) {
  await page.locator('#add-holding-btn').click();
  await fillHoldingForm(page, data);
  await page.locator('#save-holding-btn').click();
}

async function addActivityViaForm(page, { type, symbol, quantity, unitPrice, fee, currency, dataSource, date, comment }) {
  await page.locator('#add-activity-btn').click();
  if (type !== undefined) await page.locator('#a-type').selectOption(type);
  if (symbol !== undefined) await page.locator('#a-symbol').fill(symbol);
  if (quantity !== undefined) await page.locator('#a-qty').fill(String(quantity));
  if (unitPrice !== undefined) await page.locator('#a-price').fill(String(unitPrice));
  if (fee !== undefined) await page.locator('#a-fee').fill(String(fee));
  if (currency !== undefined) await page.locator('#a-currency').selectOption(currency);
  if (dataSource !== undefined) await page.locator('#a-source').selectOption(dataSource);
  if (date !== undefined) await page.locator('#a-date').fill(date);
  if (comment !== undefined) await page.locator('#a-comment').fill(comment);
  await page.locator('#save-activity-btn').click();
}

test.describe('frontend-data-tracking-ghostfolio criteria', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#holdings-body tr[data-id]')).toHaveCount(4);
  });

  test('1.3 net_worth_equals_visible_sum', async ({ page }) => {
    const values = await page.locator('#holdings-body tr[data-id]').evaluateAll((rows) =>
      rows.map((r) => r.querySelectorAll('td.num')[1].textContent));
    const sum = values.reduce((s, v) => s + parseMoney(v), 0);
    const netWorth = parseMoney(await page.locator('#net-worth').textContent());
    expect(Math.abs(netWorth - sum)).toBeLessThanOrEqual(1);
    const meta = await page.locator('#portfolio-meta').textContent();
    expect(meta).toContain('4 holdings visible');
    expect(meta).toContain('4 classes visible');
  });

  test('1.4 allocation_percentages_sum_100', async ({ page }) => {
    const pcts = await page.locator('.allocation-pct').allTextContents();
    expect(pcts.length).toBeGreaterThan(0);
    const total = pcts.reduce((s, t) => s + parsePct(t), 0);
    expect(total).toBe(100);
  });

  test('1.5 class_filter_recomputes_derived', async ({ page }) => {
    await page.locator('#class-filter').selectOption('Equity');
    await expect(page.locator('#holdings-body tr[data-id]')).toHaveCount(1);
    const classCells = await page.locator('#holdings-body tr[data-id] td:nth-child(4)').allTextContents();
    for (const c of classCells) expect(c).toBe('Equity');
    const meta = await page.locator('#portfolio-meta').textContent();
    expect(meta).toContain('1 holding visible');
    expect(meta).toContain('1 class visible');
    const netWorth = parseMoney(await page.locator('#net-worth').textContent());
    expect(netWorth).toBeCloseTo(12 * 198.4, 0);
  });

  test('1.6 clear_filter_restores_full_list', async ({ page }) => {
    await page.locator('#class-filter').selectOption('Equity');
    await expect(page.locator('#holdings-body tr[data-id]')).toHaveCount(1);
    await page.locator('#class-filter').selectOption('all');
    await expect(page.locator('#holdings-body tr[data-id]')).toHaveCount(4);
    const ids = await page.locator('#holdings-body tr[data-id]').evaluateAll((rows) => rows.map((r) => r.dataset.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('1.7 selection_fills_detail_panel', async ({ page }) => {
    await page.locator('#holdings-body tr[data-id="h-aapl"]').click();
    await expect(page.locator('#detail-name')).toHaveText('Apple Inc.');
    await expect(page.locator('#d-symbol')).toHaveText('AAPL');
    await expect(page.locator('#d-class')).toHaveText('Equity');
    await expect(page.locator('#d-currency')).toHaveText('USD');
    await expect(page.locator('#d-source')).toHaveText('YAHOO');
    await expect(page.locator('#holdings-body tr[data-id="h-aapl"]')).toHaveClass(/selected/);
    await expect(page.locator('#holdings-body tr[data-id="h-aapl"]')).toHaveAttribute('aria-selected', 'true');
  });

  test('1.8 reselect_replaces_detail_fields', async ({ page }) => {
    await page.locator('#holdings-body tr[data-id="h-aapl"]').click();
    await expect(page.locator('#detail-name')).toHaveText('Apple Inc.');
    await page.locator('#holdings-body tr[data-id="h-vt"]').click();
    await expect(page.locator('#detail-name')).toHaveText('Vanguard Total World');
    await expect(page.locator('#d-symbol')).toHaveText('VT');
    await expect(page.locator('#d-symbol')).not.toHaveText('AAPL');
    await expect(page.locator('#holdings-body tr[data-id="h-aapl"]')).not.toHaveClass(/selected/);
  });

  test('1.9 add_holding_updates_totals', async ({ page }) => {
    const before = parseMoney(await page.locator('#net-worth').textContent());
    await addHoldingViaForm(page, {
      name: 'Test Fund', symbol: 'TFND', assetClass: 'ETF', quantity: 10, unitPrice: 50, currency: 'USD', dataSource: 'MANUAL',
    });
    await expect(page.locator('#holdings-body tr[data-id]')).toHaveCount(5);
    const after = parseMoney(await page.locator('#net-worth').textContent());
    expect(after - before).toBeCloseTo(500, 0);
    const pcts = await page.locator('.allocation-pct').allTextContents();
    expect(pcts.reduce((s, t) => s + parsePct(t), 0)).toBe(100);
  });

  test('1.10 empty_name_blocks_add', async ({ page }) => {
    await page.locator('#add-holding-btn').click();
    await fillHoldingForm(page, { symbol: 'ABCD', assetClass: 'Equity', quantity: 1, unitPrice: 1, currency: 'USD', dataSource: 'MANUAL' });
    await expect(page.locator('#save-holding-btn')).toBeDisabled();
    await page.locator('#save-holding-wrap').click();
    await expect(page.locator('#e-name')).toBeVisible();
    await expect(page.locator('#e-name')).toContainText(/name/i);
    await expect(page.locator('#holdings-body tr[data-id]')).toHaveCount(4);
  });

  test('1.11 reload_restores_persisted_holdings', async ({ page }) => {
    await addHoldingViaForm(page, {
      name: 'Reload Fund', symbol: 'RLFD', assetClass: 'Equity', quantity: 100, unitPrice: 1, currency: 'USD', dataSource: 'MANUAL',
    });
    await expect(page.locator('#holdings-body tr[data-id]')).toHaveCount(5);
    const netWorthBefore = parseMoney(await page.locator('#net-worth').textContent());
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#holdings-body tr[data-id]')).toHaveCount(5);
    await expect(page.locator('#holdings-body td.cell-symbol', { hasText: 'RLFD' })).toHaveCount(1);
    const netWorthAfter = parseMoney(await page.locator('#net-worth').textContent());
    expect(netWorthAfter).toBe(netWorthBefore);
  });

  test('1.29 sort_toggle_with_indicator', async ({ page }) => {
    const btn = page.locator('.sort-btn[data-sort="marketValue"]');
    await btn.click();
    await expect(btn.locator('.sort-ind')).toHaveText('▲');
    const asc = await page.locator('#holdings-body tr[data-id]').evaluateAll((rows) => rows.map((r) => r.dataset.id));
    await btn.click();
    await expect(btn.locator('.sort-ind')).toHaveText('▼');
    const desc = await page.locator('#holdings-body tr[data-id]').evaluateAll((rows) => rows.map((r) => r.dataset.id));
    expect(desc).toEqual([...asc].reverse());
  });

  test('1.30 sort_reversal_leaves_totals_unchanged', async ({ page }) => {
    const netWorthBefore = parseMoney(await page.locator('#net-worth').textContent());
    const allocBefore = await page.locator('.allocation-pct').allTextContents();
    const btn = page.locator('.sort-btn[data-sort="marketValue"]');
    await btn.click();
    await btn.click();
    const netWorthAfter = parseMoney(await page.locator('#net-worth').textContent());
    const allocAfter = await page.locator('.allocation-pct').allTextContents();
    expect(netWorthAfter).toBe(netWorthBefore);
    expect(allocAfter.sort()).toEqual(allocBefore.sort());
  });

  test('1.32 edit_flow_propagates_everywhere', async ({ page }) => {
    await page.locator('#holdings-body tr[data-id="h-aapl"]').click();
    await page.locator('#edit-holding-btn').click();
    await page.locator('#f-qty').fill('20');
    await page.locator('#save-holding-btn').click();
    const row = page.locator('#holdings-body tr[data-id="h-aapl"]');
    await expect(row.locator('td.num').first()).toHaveText('20');
    const rowValue = parseMoney(await row.locator('td.num').nth(1).textContent());
    expect(rowValue).toBeCloseTo(20 * 198.4, 0);
    const detailValue = parseMoney(await page.locator('#d-value').textContent());
    expect(detailValue).toBeCloseTo(20 * 198.4, 0);
    await expect(page.locator('#d-qty')).toHaveText('20');
  });

  test('1.33 delete_flow_clears_selection_and_totals', async ({ page }) => {
    const netWorthBefore = parseMoney(await page.locator('#net-worth').textContent());
    await page.locator('#holdings-body tr[data-id="h-btc"]').click();
    await page.locator('#delete-holding-btn').click();
    await expect(page.locator('#holdings-body tr[data-id]')).toHaveCount(3);
    await expect(page.locator('#holdings-body tr[data-id="h-btc"]')).toHaveCount(0);
    await expect(page.locator('#detail-name')).toHaveText('No holding selected');
    const netWorthAfter = parseMoney(await page.locator('#net-worth').textContent());
    expect(netWorthBefore - netWorthAfter).toBeCloseTo(0.35 * 64000, 0);
  });

  test('1.34 submit_disabled_until_valid', async ({ page }) => {
    await page.locator('#add-holding-btn').click();
    await expect(page.locator('#save-holding-btn')).toBeDisabled();
    for (const id of ['f-name', 'f-symbol', 'f-qty', 'f-price', 'f-currency', 'f-source']) {
      await expect(page.locator(`label[for="${id}"]`)).toBeVisible();
    }
    await fillHoldingForm(page, { name: 'Valid Co', symbol: 'VLCO', assetClass: 'Equity', quantity: 1, unitPrice: 1, currency: 'USD', dataSource: 'MANUAL' });
    await expect(page.locator('#save-holding-btn')).toBeEnabled();
  });

  test('1.35 inline_error_names_field_and_rule', async ({ page }) => {
    await page.locator('#add-holding-btn').click();
    const symbolInput = page.locator('#f-symbol');
    await symbolInput.fill('bad symbol!!');
    await symbolInput.blur();
    await expect(page.locator('#e-symbol')).toBeVisible();
    await expect(page.locator('#e-symbol')).toContainText(/symbol/i);
    const qtyInput = page.locator('#f-qty');
    await qtyInput.fill('-5');
    await qtyInput.blur();
    await expect(page.locator('#e-qty')).toBeVisible();
    await expect(page.locator('#e-qty')).toContainText(/quantity/i);
  });

  test('1.38 double_save_creates_one_holding', async ({ page }) => {
    await page.locator('#add-holding-btn').click();
    await fillHoldingForm(page, { name: 'Dup Guard', symbol: 'DUPG', assetClass: 'Equity', quantity: 3, unitPrice: 10, currency: 'USD', dataSource: 'MANUAL' });
    await expect(page.locator('#save-holding-btn')).toBeEnabled();
    const save = page.locator('#save-holding-btn');
    await Promise.all([save.click(), save.click()]);
    await expect(page.locator('#holdings-body tr[data-id]')).toHaveCount(5);
    await expect(page.locator('#holdings-body td.cell-symbol', { hasText: 'DUPG' })).toHaveCount(1);
  });

  test('1.45 buy_activity_updates_holding', async ({ page }) => {
    const netWorthBefore = parseMoney(await page.locator('#net-worth').textContent());
    const ledgerCountBefore = await page.locator('#activities-body tr[data-id]').count();
    await addActivityViaForm(page, {
      type: 'BUY', symbol: 'AAPL', quantity: 5, unitPrice: 200, fee: 0, currency: 'USD', dataSource: 'YAHOO', date: '2024-01-15',
    });
    const row = page.locator('#holdings-body tr[data-id="h-aapl"]');
    await expect(row.locator('td.num').first()).toHaveText('17');
    const rowValue = parseMoney(await row.locator('td.num').nth(1).textContent());
    expect(rowValue).toBeCloseTo(17 * 198.4, 0);
    await expect(page.locator('#activities-body tr[data-id]')).toHaveCount(ledgerCountBefore + 1);
    const netWorthAfter = parseMoney(await page.locator('#net-worth').textContent());
    expect(netWorthAfter - netWorthBefore).toBeCloseTo(5 * 198.4, 0);
  });

  test('1.47 portfolio_json_schema_keys', async ({ page }) => {
    await page.locator('#export-btn').click();
    await expect(page.locator('#export-drawer')).toBeVisible();
    const text = await page.locator('#export-preview').textContent();
    const doc = JSON.parse(text);
    expect(Object.keys(doc).sort()).toEqual(['activities', 'holdings', 'meta']);
    expect(doc.holdings.length).toBeGreaterThan(0);
    for (const k of ['name', 'symbol', 'assetClass', 'quantity', 'unitPrice', 'currency', 'dataSource', 'marketValue']) {
      expect(Object.keys(doc.holdings[0])).toContain(k);
    }
    for (const k of ['currency', 'dataSource', 'date', 'fee', 'quantity', 'symbol', 'type', 'unitPrice', 'comment']) {
      expect(Object.keys(doc.activities[0])).toContain(k);
    }
  });

  test('1.48 csv_headers_match_contracts', async ({ page }) => {
    await page.locator('#export-btn').click();
    await page.locator('.drawer-tab[data-tab="holdings-csv"]').click();
    const holdingsCsv = await page.locator('#export-preview').textContent();
    expect(holdingsCsv.split('\n')[0]).toBe('name,symbol,assetClass,quantity,unitPrice,currency,dataSource,marketValue');
    await page.locator('.drawer-tab[data-tab="activities-csv"]').click();
    const activitiesCsv = await page.locator('#export-preview').textContent();
    expect(activitiesCsv.split('\n')[0]).toBe('currency,dataSource,date,fee,quantity,symbol,type,unitPrice,comment');
  });

  test('1.50 import_round_trip_portfolio_json', async ({ page }) => {
    await page.locator('#export-btn').click();
    const snapshotText = await page.locator('#export-preview').textContent();
    const snapshot = JSON.parse(snapshotText);
    await page.locator('#drawer-close').click();

    // Mutate away from the exported snapshot.
    await addHoldingViaForm(page, {
      name: 'Post Snapshot', symbol: 'PSNP', assetClass: 'Equity', quantity: 1, unitPrice: 1, currency: 'USD', dataSource: 'MANUAL',
    });
    await expect(page.locator('#holdings-body tr[data-id]')).toHaveCount(5);

    // Import the pre-mutation snapshot back.
    await page.locator('#export-btn').click();
    await page.locator('#import-file').setInputFiles({
      name: 'portfolio.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(snapshot)),
    });
    await expect(page.locator('#drawer-overlay')).toBeHidden();
    await expect(page.locator('#holdings-body tr[data-id]')).toHaveCount(snapshot.holdings.length);
    const symbols = await page.locator('#holdings-body td.cell-symbol').allTextContents();
    expect(symbols.sort()).toEqual(snapshot.holdings.map((h) => h.symbol).sort());
    await expect(page.locator('#holdings-body td.cell-symbol', { hasText: 'PSNP' })).toHaveCount(0);
  });

  test('1.51 undo_reverses_mutation', async ({ page }) => {
    const netWorthBefore = parseMoney(await page.locator('#net-worth').textContent());
    await addHoldingViaForm(page, {
      name: 'Undo Me', symbol: 'UNDO', assetClass: 'Equity', quantity: 2, unitPrice: 50, currency: 'USD', dataSource: 'MANUAL',
    });
    await expect(page.locator('#holdings-body tr[data-id]')).toHaveCount(5);
    await expect(page.locator('#undo-btn')).toBeEnabled();
    await page.locator('#undo-btn').click();
    await expect(page.locator('#holdings-body tr[data-id]')).toHaveCount(4);
    const netWorthAfter = parseMoney(await page.locator('#net-worth').textContent());
    expect(netWorthAfter).toBe(netWorthBefore);
    await expect(page.locator('#holdings-body td.cell-symbol', { hasText: 'UNDO' })).toHaveCount(0);
  });

  test('1.55 average_unit_cost_and_basis_math', async ({ page }) => {
    await addActivityViaForm(page, {
      type: 'BUY', symbol: 'AVGT', quantity: 10, unitPrice: 100, fee: 0, currency: 'USD', dataSource: 'MANUAL', date: '2023-01-01',
    });
    await addActivityViaForm(page, {
      type: 'BUY', symbol: 'AVGT', quantity: 10, unitPrice: 120, fee: 0, currency: 'USD', dataSource: 'MANUAL', date: '2023-02-01',
    });
    // Bring the holding's current unit price to 130 (its own unitPrice does not
    // change on subsequent BUYs — only quantity does).
    const row = page.locator('#holdings-body td.cell-symbol', { hasText: 'AVGT' }).locator('xpath=ancestor::tr');
    await row.click();
    await page.locator('#edit-holding-btn').click();
    await page.locator('#f-price').fill('130');
    await page.locator('#save-holding-btn').click();

    await expect(page.locator('#d-avgcost')).toHaveText('$110');
    expect(parseMoney(await page.locator('#d-costbasis').textContent())).toBe(2200);
    expect(parseMoney(await page.locator('#d-value').textContent())).toBe(2600);
    expect(parseMoney(await page.locator('#d-unrealized').textContent())).toBe(400);
  });

  test('1.56 sell_updates_realized_and_unrealized', async ({ page }) => {
    const realizedGainLabel = page.locator('.perf-fig', { has: page.locator('.perf-label', { hasText: /^Realized gain$/ }) }).locator('.perf-val');
    const realizedBefore = parseMoney(await realizedGainLabel.textContent());
    await addActivityViaForm(page, {
      type: 'BUY', symbol: 'SELT', quantity: 10, unitPrice: 100, fee: 0, currency: 'USD', dataSource: 'MANUAL', date: '2023-01-01',
    });
    await addActivityViaForm(page, {
      type: 'BUY', symbol: 'SELT', quantity: 10, unitPrice: 120, fee: 0, currency: 'USD', dataSource: 'MANUAL', date: '2023-02-01',
    });
    await addActivityViaForm(page, {
      type: 'SELL', symbol: 'SELT', quantity: 5, unitPrice: 150, fee: 0, currency: 'USD', dataSource: 'MANUAL', date: '2023-03-01',
    });
    const realizedAfter = parseMoney(await realizedGainLabel.textContent());
    // realized gain increases by (150 - avgUnitCost(110)) * 5 = 200
    expect(realizedAfter - realizedBefore).toBeCloseTo(200, 0);
    const row = page.locator('#holdings-body td.cell-symbol', { hasText: 'SELT' }).locator('xpath=ancestor::tr');
    await expect(row.locator('td.num').first()).toHaveText('15');
  });

  test('1.60 batch_select_tray_shows_count', async ({ page }) => {
    await expect(page.locator('#holdings-tray')).toBeHidden();
    await page.locator('.row-check[data-id="h-aapl"]').check();
    await expect(page.locator('#holdings-tray')).toBeVisible();
    await expect(page.locator('#holdings-tray-count')).toHaveText('1 holding selected');
    await page.locator('.row-check[data-id="h-vt"]').check();
    await expect(page.locator('#holdings-tray-count')).toHaveText('2 holdings selected');
    await expect(page.locator('#bulk-delete-holdings')).toBeVisible();
    await expect(page.locator('#bulk-edit-holdings')).toBeVisible();
  });
});
