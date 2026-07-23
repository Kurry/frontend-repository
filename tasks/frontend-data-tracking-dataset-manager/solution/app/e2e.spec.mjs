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

// Cross-checks reuse the oracle's own real logic (seeded data + pure domain
// functions) instead of hard-coded magic numbers, so assertions fail if the
// app's actual computation ever diverges from the source of truth it ships.
import { seedDatasets } from './src/store.js';
import { computeStats, flaggedFields, parseFormula } from './src/domain.js';

const flagship = seedDatasets.find((d) => d.id === 'ds-eval-prompts');

// The dataset header's row-count Tag ("521 rows") and the sidebar entry's own
// row-count span share identical text, which trips Playwright's strict-mode
// uniqueness check on a plain getByText. Scope to the header Tag specifically
// (class tag-blue, "<n> rows" shape — sidebar entries and split-column tags
// never share that exact shape) so the assertion is unambiguous.
const rowsBadge = (page) => page.locator('.tag-blue', { hasText: /^[\d,]+ rows$/ });

// The first-run guided tour opens itself 900ms after mount (App.jsx) and, as
// an unclosable overlay, intercepts clicks anywhere behind it. Give it its
// full trigger window up front and dismiss it once so it can never appear
// mid-test and steal a click meant for the grid underneath.
async function openApp(page, base) {
  await page.goto(base);
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Skip tour' }).click({ timeout: 1200 }).catch(() => {});
}

test.describe('dataset-manager criteria', () => {
  test('1.2 create_dataset_field_contract', async ({ page }) => {
    await openApp(page, BASE);
    const initialCount = seedDatasets.length;
    await expect(page.getByText(`Datasets · ${initialCount}`)).toBeVisible();

    await page.getByRole('button', { name: 'New dataset' }).click();
    await page.locator('#dataset-name').fill('Playwright Widgets');
    await page.locator('#dataset-description').fill('Created by e2e suite');
    await page.locator('#schema-name-0').fill('metric');
    const submit = page.getByRole('button', { name: 'Create dataset' });
    await expect(submit).toBeEnabled();
    await submit.click();

    await expect(page.getByText(`Datasets · ${initialCount + 1}`)).toBeVisible();
    const entry = page.locator('.sidebar-entry', { hasText: 'Playwright Widgets' });
    await expect(entry).toHaveClass(/selected/);
    await expect(entry.getByText('0 rows')).toBeVisible();

    // schema actually propagated: the new dataset's Add Row form exposes the
    // submitted field with its submitted type.
    await page.locator('#toolbar-actions').getByRole('button', { name: 'Add row' }).click();
    await expect(page.getByText('metric (text)')).toBeVisible();
  });

  test('1.3 invalid_create_field_contract', async ({ page }) => {
    await openApp(page, BASE);
    const before = await page.locator('.sidebar-entry').count();

    await page.getByRole('button', { name: 'New dataset' }).click();
    await page.locator('#dataset-name').fill('Bad Dataset');
    await page.locator('#schema-name-0').fill('bad name!');
    await expect(page.locator('#schema-name-0-error')).toContainText('letters, digits, and underscores');
    await expect(page.getByRole('button', { name: 'Create dataset' })).toBeDisabled();

    await page.getByRole('button', { name: 'Close dialog' }).click();
    await expect(page.locator('.sidebar-entry')).toHaveCount(before);
  });

  test('1.6 inline_cell_edit_contract', async ({ page }) => {
    await openApp(page, BASE);
    const cell = page.locator('[aria-label^="score: "]').first();
    const original = (await cell.locator('.cell-text').innerText()).trim();

    await cell.dblclick();
    const editor = page.getByLabel('Edit score');
    await editor.fill('not-a-number');
    await editor.press('Enter');
    await expect(page.locator('[role="alert"]', { hasText: 'score must be a finite number' })).toBeVisible();
    await editor.press('Escape');
    await expect(cell.locator('.cell-text')).toHaveText(original);

    await cell.dblclick();
    const editor2 = page.getByLabel('Edit score');
    await editor2.fill('42.5');
    await editor2.press('Enter');
    await expect(cell.locator('.cell-text')).toHaveText('42.5');
  });

  test('1.7 add_edit_delete_row_contract', async ({ page }) => {
    await openApp(page, BASE);
    const before = flagship.rows.length;

    await page.locator('#toolbar-actions').getByRole('button', { name: 'Add row' }).click();
    await page.locator('#row-prompt').fill('Playwright added prompt');
    await page.locator('#row-score').fill('7.2');
    await page.locator('#row-category').selectOption('Reasoning');
    await page.locator('#row-expected').fill('Playwright expected output');
    await page.locator('button[form="row-form"]').click();
    await expect(rowsBadge(page)).toHaveText(`${(before + 1).toLocaleString()} rows`);

    // The grid is virtualized: the new row only exists in the DOM while the
    // scroll container is positioned near it. Force-scroll to the bottom
    // before every interaction that needs the row actually mounted.
    const grid = page.locator('.grid-scroll');
    const scrollToBottom = async () => {
      await grid.evaluate((el) => { el.scrollTop = el.scrollHeight; });
      // Let the virtualizer's scroll-driven re-render settle before any
      // actionability check runs, or Playwright's bounding-box stability
      // check can chase a still-shifting row indefinitely.
      await page.waitForTimeout(300);
    };
    await scrollToBottom();
    const row = page.locator('.data-row', { hasText: 'Playwright added prompt' });
    await expect(row).toBeVisible();

    await row.getByRole('button', { name: /^Edit row/ }).click();
    await page.locator('#row-expected').fill('Updated expected output');
    await page.locator('button[form="row-form"]').click();
    await scrollToBottom();
    await expect(row.getByRole('gridcell', { name: /^Expected output: Updated expected output$/ })).toBeVisible();

    // cancel leaves the row intact
    await row.getByRole('button', { name: /^Delete row/ }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await scrollToBottom();
    await expect(row).toBeVisible();

    // confirm deletes and decrements the count
    await row.getByRole('button', { name: /^Delete row/ }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(rowsBadge(page)).toHaveText(`${before.toLocaleString()} rows`);
    await expect(page.locator('.data-row', { hasText: 'Playwright added prompt' })).toHaveCount(0);
  });

  test('1.12 verified_toggle_and_badge', async ({ page }) => {
    await openApp(page, BASE);
    const stats = computeStats(flagship);
    const badge = page.locator('.tag-green', { hasText: 'verified' });
    await expect(badge).toHaveText(`${stats.verifiedCount} verified`);

    const toggle = page.locator('[aria-label^="Mark "]').first();
    const wasVerified = (await toggle.getAttribute('aria-pressed')) === 'true';
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', String(!wasVerified));
    const expected = stats.verifiedCount + (wasVerified ? -1 : 1);
    await expect(badge).toHaveText(`${expected} verified`);
  });

  test('1.13 unverified_filter_round_trip', async ({ page }) => {
    await openApp(page, BASE);
    const grid = page.locator('[role="grid"]');
    const total = flagship.rows.length;
    const unverified = flagship.rows.filter((r) => !r.verified).length;
    await expect(grid).toHaveAttribute('aria-rowcount', String(total));

    // The switch's real input is visually covered by its custom track/thumb
    // graphic, so click the wrapping <label> (native label-click semantics
    // toggle the associated input) instead of the occluded input itself.
    const unverifiedLabel = page.locator('label.tgl', { hasText: 'Show unverified only' });
    await unverifiedLabel.click();
    await expect(grid).toHaveAttribute('aria-rowcount', String(unverified));

    await unverifiedLabel.click();
    await expect(grid).toHaveAttribute('aria-rowcount', String(total));
  });

  test('1.14 formula_bar_functions', async ({ page }) => {
    await openApp(page, BASE);
    const formulaInput = page.locator('#formula');
    const status = page.locator('#formula-status');
    const formulas = ['=SUM(score)', '=AVERAGE(score)', '=MIN(score)', '=MAX(score)', '=COUNT(score)', '=SUM(score, 1:100)'];
    for (const formula of formulas) {
      const expected = parseFormula(formula, flagship);
      await formulaInput.fill(formula);
      await formulaInput.press('Enter');
      const text = (await status.innerText()).trim();
      expect(text.startsWith('=')).toBe(true);
      const numeric = Number(text.replace(/^=\s*/, '').replace(/,/g, ''));
      expect(numeric).toBeCloseTo(Number(expected.value.toFixed?.(4) ?? expected.value), 2);
    }
  });

  test('1.15 formula_recomputes_on_edit', async ({ page }) => {
    await openApp(page, BASE);
    const formulaInput = page.locator('#formula');
    const status = page.locator('#formula-status');
    await formulaInput.fill('=AVERAGE(score)');
    await formulaInput.press('Enter');
    const before = (await status.innerText()).trim();

    const cell = page.locator('[aria-label^="score: "]').first();
    await cell.dblclick();
    await page.getByLabel('Edit score').fill('999');
    await page.getByLabel('Edit score').press('Enter');

    await expect(status).not.toHaveText(before);
    const editedRows = flagship.rows.map((r, i) => (i === 0 ? { ...r, values: { ...r.values, score: 999 } } : r));
    const expected = parseFormula('=AVERAGE(score)', { ...flagship, rows: editedRows });
    const text = (await status.innerText()).trim();
    const numeric = Number(text.replace(/^=\s*/, '').replace(/,/g, ''));
    expect(numeric).toBeCloseTo(expected.value, 2);
  });

  test('1.16 formula_error_messages', async ({ page }) => {
    await openApp(page, BASE);
    const formulaInput = page.locator('#formula');
    const status = page.locator('#formula-status');

    await formulaInput.fill('=FOO(score)');
    await formulaInput.press('Enter');
    await expect(status).toHaveText(/Unknown formula function/);
    await expect(status).toHaveAttribute('role', 'alert');

    await formulaInput.fill('=SUM(doesNotExist)');
    await formulaInput.press('Enter');
    await expect(status).toHaveText(/Unknown formula column/);

    await formulaInput.fill('=SUM(prompt)');
    await formulaInput.press('Enter');
    await expect(status).toHaveText(/Choose a number column instead/);
  });

  test('1.17 threshold_rules_flag_rows', async ({ page }) => {
    await openApp(page, BASE);
    const stats = computeStats(flagship);
    expect(stats.flaggedCount).toBeGreaterThan(0);
    const flaggedRowIds = flagship.rows.filter((r) => flaggedFields(r, flagship).length).map((r) => r.id);
    expect(flaggedRowIds.length).toBe(stats.flaggedCount);

    const badge = page.locator('.tag-warn', { hasText: 'flagged' });
    await expect(badge).toHaveText(`${stats.flaggedCount} flagged`);

    const minScore = Math.min(...flagship.rows.map((r) => r.values.score));
    expect(minScore).toBeLessThan(3); // sanity: the seeded rule (score below 3) does breach real rows

    await page.getByRole('button', { name: 'Sort by score' }).click();
    const firstRow = page.locator('.data-row').first();
    await expect(firstRow.locator('[aria-label="Row flagged by threshold rule"]')).toBeVisible();
  });

  test('1.26 undo_redo_coverage', async ({ page }) => {
    await openApp(page, BASE);
    const undoBtn = page.getByRole('button', { name: 'Undo (Ctrl+Z)' });
    const redoBtn = page.getByRole('button', { name: 'Redo (Ctrl+Shift+Z)' });
    await expect(undoBtn).toBeDisabled();
    await expect(redoBtn).toBeDisabled();

    const before = flagship.rows.length;
    await page.locator('#toolbar-actions').getByRole('button', { name: 'Add row' }).click();
    await page.locator('#row-prompt').fill('Undo redo probe');
    await page.locator('#row-score').fill('5');
    await page.locator('#row-category').selectOption('Reasoning');
    await page.locator('button[form="row-form"]').click();
    await expect(rowsBadge(page)).toHaveText(`${(before + 1).toLocaleString()} rows`);
    await expect(undoBtn).toBeEnabled();

    await page.locator('h2').first().click();
    await page.keyboard.press('Control+z');
    await expect(rowsBadge(page)).toHaveText(`${before.toLocaleString()} rows`);
    await expect(undoBtn).toBeDisabled();
    await expect(redoBtn).toBeEnabled();

    await page.keyboard.press('Control+Shift+z');
    await expect(rowsBadge(page)).toHaveText(`${(before + 1).toLocaleString()} rows`);
    await expect(redoBtn).toBeDisabled();
  });

  test('1.27 export_package_live_derived', async ({ page }) => {
    await openApp(page, BASE);
    await page.locator('#toolbar-actions').getByRole('button', { name: 'Export package' }).click();
    await expect(page.getByRole('tab', { name: 'Dataset Package JSON' })).toHaveAttribute('aria-selected', 'true');

    const pre = page.locator('#export-panel');
    const parsedBefore = JSON.parse(await pre.innerText());
    expect(parsedBefore.schemaVersion).toBe('dataset-manager.package/v1');
    expect(parsedBefore.dataset.id).toBe(flagship.id);
    expect(parsedBefore.stats.totalRows).toBe(parsedBefore.dataset.rows.length);
    expect(parsedBefore.stats.totalRows).toBe(flagship.rows.length);

    await page.getByRole('tab', { name: 'Rows CSV' }).click();
    const csvBefore = await pre.innerText();
    expect(csvBefore.trim().split('\n').length - 1).toBe(flagship.rows.length);

    await page.getByRole('tab', { name: 'Dataset Package JSON' }).click();
    const verifiedBefore = parsedBefore.stats.verifiedCount;

    // The export panel is a full-viewport overlay (role="dialog") that sits
    // above the grid, so the grid's verified toggle isn't reachable while it
    // is open — close it, mutate, then reopen to read the recomputed export.
    await page.getByRole('button', { name: 'Close panel' }).click();
    await page.locator('[aria-label^="Mark "]').first().click();
    await page.locator('#toolbar-actions').getByRole('button', { name: 'Export package' }).click();
    const parsedAfter = JSON.parse(await pre.innerText());
    expect(Math.abs(parsedAfter.stats.verifiedCount - verifiedBefore)).toBe(1);
  });

  test('1.28 capacity_gauge_updates', async ({ page }) => {
    await openApp(page, BASE);
    const totalRows = seedDatasets.reduce((n, d) => n + d.rows.length, 0);
    const section = page.locator('section[aria-labelledby="capacity-title"]');
    await expect(section).toContainText(`${totalRows.toLocaleString()} / ${(5000).toLocaleString()}`);

    const before = flagship.rows.length;
    await page.locator('#toolbar-actions').getByRole('button', { name: 'Add row' }).click();
    await page.locator('#row-prompt').fill('Capacity probe');
    await page.locator('#row-score').fill('3');
    await page.locator('#row-category').selectOption('Reasoning');
    await page.locator('button[form="row-form"]').click();

    await expect(section).toContainText(`${(totalRows + 1).toLocaleString()} / ${(5000).toLocaleString()}`, { timeout: 5000 });
    await expect(section).toContainText(`${before + 1} · ~${Math.round((before + 1) * 1.8)} KB`);
  });

  test('1.31 double_activation_single_effect', async ({ page }) => {
    await openApp(page, BASE);
    const before = flagship.rows.length;
    await page.locator('#toolbar-actions').getByRole('button', { name: 'Add row' }).click();
    await page.locator('#row-prompt').fill('Double click probe');
    await page.locator('#row-score').fill('4');
    await page.locator('#row-category').selectOption('Reasoning');
    // Fire both clicks from a single in-page script so they land back-to-back
    // in the same task, before React can unmount the modal after the first
    // submit — Playwright's locator-based dispatchEvent re-resolves the
    // element and hangs once the first click removes it from the DOM.
    await page.evaluate(() => {
      const btn = document.querySelector('button[form="row-form"]');
      btn.click();
      btn.click();
    });

    await expect(rowsBadge(page)).toHaveText(`${(before + 1).toLocaleString()} rows`);
    await expect(page.locator('.data-row', { hasText: 'Double click probe' })).toHaveCount(1);
  });

  test('1.33 import_package_round_trip', async ({ page }) => {
    await openApp(page, BASE);
    const before = flagship.rows.length;

    await page.locator('#toolbar-actions').getByRole('button', { name: 'Add row' }).click();
    await page.locator('#row-prompt').fill('Round trip added row');
    await page.locator('#row-score').fill('6');
    await page.locator('#row-category').selectOption('Safety');
    await page.locator('button[form="row-form"]').click();
    await expect(rowsBadge(page)).toHaveText(`${(before + 1).toLocaleString()} rows`);

    await page.locator('#toolbar-actions').getByRole('button', { name: 'Compare snapshots' }).click();
    await page.locator('#snapshot-name').fill('RT snapshot');
    await page.getByRole('button', { name: 'Save snapshot' }).click();
    await expect(page.getByText('RT snapshot', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Close panel' }).click();

    await page.locator('#toolbar-actions').getByRole('button', { name: 'Export package' }).click();
    const pre = page.locator('#export-panel');
    const packageAText = await pre.innerText();
    const packageA = JSON.parse(packageAText);
    expect(packageA.dataset.rows.length).toBe(before + 1);
    expect(packageA.dataset.snapshots.some((s) => s.name === 'RT snapshot')).toBe(true);
    await page.getByRole('button', { name: 'Close panel' }).click();

    // The Add Row step above scrolled the virtualized grid toward the newly
    // appended (last) row; reset to the top so "first score cell" reliably
    // targets row index 0 rather than whatever happens to be rendered near
    // the bottom of the scroll container.
    await page.locator('.grid-scroll').evaluate((el) => { el.scrollTop = 0; });
    const cell = page.locator('[aria-label^="score: "]').first();
    await cell.dblclick();
    await page.getByLabel('Edit score').fill('123.4');
    await page.getByLabel('Edit score').press('Enter');
    await expect(cell.locator('.cell-text')).toHaveText('123.4');

    await page.locator('#toolbar-actions').getByRole('button', { name: 'Export package' }).click();
    await page.getByRole('button', { name: 'Import package' }).click();
    // Playwright's .fill() hangs on this react-hook-form-controlled textarea
    // for a payload this size (500+ row JSON). Set the value through React's
    // native input value setter and dispatch a real 'input' event instead —
    // functionally identical to a user pasting the text, but reliable at
    // this payload size.
    await page.locator('#package-json-input').evaluate((el, text) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(el, text);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, packageAText);
    await expect(page.locator('#package-json-input')).toHaveValue(packageAText);
    await page.getByRole('button', { name: 'Import pasted package' }).click();

    await expect(rowsBadge(page)).toHaveText(`${(before + 1).toLocaleString()} rows`);
    const verifiedBadge = page.locator('.tag-green', { hasText: 'verified' });
    await expect(verifiedBadge).toHaveText(`${packageA.stats.verifiedCount} verified`);
    const fresh = JSON.parse(await pre.innerText());
    expect(fresh.dataset.rows.length).toBe(packageA.dataset.rows.length);
    expect(fresh.dataset.snapshots.map((s) => s.name).sort()).toEqual(packageA.dataset.snapshots.map((s) => s.name).sort());
    await expect(page.locator('[aria-label^="score: "]').first().locator('.cell-text')).not.toHaveText('123.4');
  });

  test('1.34 invalid_package_import_rejected', async ({ page }) => {
    await openApp(page, BASE);
    const before = flagship.rows.length;

    await page.locator('#toolbar-actions').getByRole('button', { name: 'Export package' }).click();
    await page.getByRole('button', { name: 'Import package' }).click();
    const badPayload = JSON.stringify({
      schemaVersion: 'wrong-version',
      generatedAt: new Date().toISOString(),
      dataset: {
        id: 'x', name: 'Bad', description: '', createdAt: new Date().toISOString(), schema: flagship.schema,
        rows: [], thresholdRules: [], snapshots: [], splitPercentages: { train: 100, validation: 0, test: 0 }, attachedSuiteId: null,
      },
      stats: { totalRows: 0, verifiedCount: 0, flaggedCount: 0, numericSummaries: [], splitDistribution: { train: 0, validation: 0, test: 0 }, snapshotCount: 0 },
    });
    await page.locator('#package-json-input').fill(badPayload);
    await page.getByRole('button', { name: 'Import pasted package' }).click();
    await expect(page.locator('#package-json-input-error')).toContainText('schemaVersion must be exactly dataset-manager.package/v1');

    await page.getByRole('button', { name: 'Close panel' }).click();
    await expect(rowsBadge(page)).toHaveText(`${before.toLocaleString()} rows`);
    await page.locator('#toolbar-actions').getByRole('button', { name: 'Compare snapshots' }).click();
    await expect(page.getByText(`Saved snapshots · ${flagship.snapshots.length}`)).toBeVisible();
  });
});
