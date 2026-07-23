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

// Helpers shared by the task-specific suite below.
const PROMPT_TITLE = 'Executive summary from support transcript';
const LONG_PROMPT_TITLE = 'Design a reliable incident response plan for a multi-region service with dependency failures';

async function openCreateModal(page) {
  await page.getByRole('button', { name: 'New Suite' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  return dialog;
}

// Opens the prompt multi-select, checks the given option(s) by visible title,
// then dismisses the still-open dropdown by clicking neutral modal chrome
// (Escape is unusable here — the modal's own capture-phase Escape listener
// would close the whole dialog, not just the listbox).
async function selectPrompts(dialog, titles) {
  await dialog.locator('#suite-prompts .cds--list-box__field').click();
  for (const title of titles) {
    await dialog.getByRole('option', { name: title }).click();
  }
  await dialog.locator('.modal-intro').click();
}

test.describe('task-specific criteria', () => {
  test('1.2 create_suite_flow', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const before = await page.locator('.suite-card').count();
    const dialog = await openCreateModal(page);
    const submit = dialog.getByRole('button', { name: 'Submit' });
    await expect(submit, 'submit disabled with no name and no prompts').toBeDisabled();
    await dialog.locator('#suite-name').fill('Release readiness check');
    await expect(submit, 'submit still disabled with a name but no prompts').toBeDisabled();
    await selectPrompts(dialog, [PROMPT_TITLE]);
    await expect(submit, 'submit enabled once name and a prompt are set').toBeEnabled();
    await submit.click();
    await expect(dialog, 'modal closes after a valid submit').toBeHidden();
    const after = page.locator('.suite-card');
    await expect(after).toHaveCount(before + 1);
    await expect(after.last().locator('.suite-title-row strong')).toHaveText('Release readiness check');
  });

  test('1.3 invalid_create_validation', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const before = await page.locator('.suite-card').count();
    const dialog = await openCreateModal(page);
    const submit = dialog.getByRole('button', { name: 'Submit' });
    // Empty name, zero prompts.
    await expect(submit, 'empty name and zero prompts blocks submit').toBeDisabled();
    // Name over 80 characters (the field's maxlength is 81, so 81 chars is
    // reachable input that still fails the 80-char zod bound).
    await dialog.locator('#suite-name').fill('x'.repeat(81));
    await expect(dialog.locator('#suite-name-error-msg'), 'inline error names the suite name field').toHaveText('Suite name must be 80 characters or fewer');
    await expect(submit, 'over-length name blocks submit').toBeDisabled();
    // Fix the name but leave prompts empty.
    await dialog.locator('#suite-name').fill('');
    await dialog.locator('#suite-name').fill('Valid name, no prompts');
    await expect(dialog.locator('#suite-prompts-error-msg'), 'inline error names the prompts field').toHaveText('Prompt selection requires at least one prompt');
    await expect(submit, 'zero prompts blocks submit even with a valid name').toBeDisabled();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('.suite-card'), 'no entry was added for any invalid attempt').toHaveCount(before);
  });

  test('1.4 edit_suite_prefilled_updates', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const card = page.locator('.suite-card').filter({ hasText: 'Customer care quality' });
    const originalPromptCount = (await card.locator('.suite-meta').textContent());
    const editButton = card.getByRole('button', { name: 'Edit Customer care quality' });
    await editButton.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.locator('.cds--modal-header__heading'), 'edit modal heading').toHaveText('Edit evaluation suite');
    await expect(dialog.locator('#suite-name'), 'name field is prefilled with the current suite name').toHaveValue('Customer care quality');
    await dialog.locator('#suite-name').fill('Customer care quality v2');
    // Add one more prompt so the prompt count visibly changes too.
    await dialog.locator('#suite-prompts .cds--list-box__field').click();
    await dialog.getByRole('option', { name: 'Diagnose a production TypeScript exception' }).click();
    await dialog.locator('.modal-intro').click();
    await dialog.getByRole('button', { name: 'Save Suite' }).click();
    await expect(dialog, 'modal closes after save').toBeHidden();
    const updatedCard = page.locator('.suite-card').filter({ hasText: 'Customer care quality v2' });
    await expect(updatedCard.locator('.suite-title-row strong')).toHaveText('Customer care quality v2');
    await expect(updatedCard.locator('.suite-meta')).toContainText('6 prompts');
    expect(originalPromptCount).toContain('5 prompts');
  });

  test('1.5 delete_confirm_cancel', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const before = await page.locator('.suite-card').count();
    const targetCard = page.locator('.suite-card').filter({ hasText: 'Grounded generation' });
    // Cancel path: suite remains.
    await targetCard.getByRole('button', { name: 'Delete Grounded generation' }).click();
    let dialog = page.getByRole('dialog');
    await expect(dialog.locator('.cds--modal-header__heading'), 'delete confirmation heading').toHaveText('Delete evaluation suite?');
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('.suite-card'), 'cancel leaves the suite list untouched').toHaveCount(before);
    await expect(page.locator('.suite-card').filter({ hasText: 'Grounded generation' }), 'suite still present after cancel').toHaveCount(1);
    // Confirm path: exactly that suite is removed.
    await page.locator('.suite-card').filter({ hasText: 'Grounded generation' }).getByRole('button', { name: 'Delete Grounded generation' }).click();
    dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Delete Suite' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('.suite-card'), 'exactly one suite removed').toHaveCount(before - 1);
    await expect(page.locator('.suite-card').filter({ hasText: 'Grounded generation' }), 'deleted suite is gone').toHaveCount(0);
  });

  test('1.15 column_sort_round_trip', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const scoreHeader = page.locator('.sort-button').nth(2);
    await expect(scoreHeader).toHaveText(/Score/);
    await scoreHeader.click();
    const ascending = (await page.locator('.results-table-wrap tbody .table-score').allTextContents()).map(Number);
    const sortedAsc = [...ascending].sort((a, b) => a - b);
    expect(ascending, 'clicking Score sorts ascending, consistent with the visible values').toEqual(sortedAsc);
    await scoreHeader.click();
    const descending = (await page.locator('.results-table-wrap tbody .table-score').allTextContents()).map(Number);
    const sortedDesc = [...ascending].sort((a, b) => b - a);
    expect(descending, 'clicking Score again reverses to descending order').toEqual(sortedDesc);
    expect(descending, 'the descending order is the reverse of the ascending order').toEqual([...ascending].reverse());
  });

  test('1.19 comparison_view_coherent', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Sort by prompt title first so the results-view ordering is deterministic.
    await page.locator('.sort-button').first().click();
    const MODEL_ORDER = ['Granite 3.2 8B', 'GPT-4.1 mini', 'Claude 3.7 Sonnet'];
    const firstRow = page.locator('.result-row').first();
    const promptTitle = (await firstRow.locator('.prompt-cell').textContent()).trim();
    const model = (await firstRow.locator('td').nth(1).textContent()).trim();
    const score = (await firstRow.locator('.table-score').textContent()).trim();
    const latency = (await firstRow.locator('td').nth(3).textContent()).trim();
    const modelColumnIndex = MODEL_ORDER.indexOf(model);
    expect(modelColumnIndex, 'row model is one of the known comparison columns').toBeGreaterThanOrEqual(0);

    await page.getByRole('button', { name: 'Compare models' }).click();
    await expect(page.locator('.comparison-table'), 'toggling shows the side-by-side comparison table').toBeVisible();
    const compRow = page.locator('.comparison-table tbody tr').filter({ hasText: promptTitle });
    await expect(compRow, 'comparison table has a row for the same prompt').toHaveCount(1);
    // Comparison columns follow MODEL_ORDER; the row's model picks the cell.
    const matchingCell = compRow.locator('td').nth(modelColumnIndex);
    await expect(matchingCell.locator('strong'), 'comparison cell score matches the results table for the same prompt/model').toHaveText(score);
    await expect(matchingCell.locator('span'), 'comparison cell latency matches the results table for the same prompt/model').toContainText(latency);

    await page.getByRole('button', { name: 'Results view' }).click();
    await expect(page.locator('.comparison-table'), 'toggling back hides the comparison table').toHaveCount(0);
    const restoredFirstRow = page.locator('.result-row').first();
    await expect(restoredFirstRow.locator('.prompt-cell'), 'toggling back restores the prior sort (still sorted by prompt title)').toHaveText(promptTitle);
  });

  test('1.22 double_activation_single_effect', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const before = await page.locator('.suite-card').count();
    const dialog = await openCreateModal(page);
    await dialog.locator('#suite-name').fill('Double activation suite');
    await selectPrompts(dialog, [PROMPT_TITLE]);
    const submit = dialog.getByRole('button', { name: 'Submit' });
    await expect(submit).toBeEnabled();
    // Fire two activations back-to-back without waiting between them.
    await Promise.all([submit.click(), submit.click({ force: true }).catch(() => {})]);
    await expect(dialog).toBeHidden();
    const matches = page.locator('.suite-card').filter({ hasText: 'Double activation suite' });
    await expect(matches, 'rapid double-activation creates exactly one suite').toHaveCount(1);
    await expect(page.locator('.suite-card'), 'suite count increases by exactly one').toHaveCount(before + 1);
  });

  test('1.24 long_title_truncation', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.locator('.suite-card').filter({ hasText: 'Engineering copilot' }).locator('.suite-select').click();
    const row = page.locator('.result-row').filter({ hasText: 'Design a reliable incident' }).first();
    const cell = row.locator('.prompt-cell');
    await expect(cell).toBeVisible();
    const box = await cell.evaluate((el) => ({ scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));
    expect(box.scrollWidth, 'the long title overflows its cell and is visually truncated (ellipsis)').toBeGreaterThan(box.clientWidth);
    await row.click();
    await expect(page.locator('.detail-panel h2'), 'the detail panel shows the full, untruncated title').toHaveText(LONG_PROMPT_TITLE);
  });

  test('1.28 suite_payload_field_contract', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const dialog = await openCreateModal(page);
    await dialog.locator('#suite-name').fill('  Payload contract suite  ');
    await selectPrompts(dialog, [PROMPT_TITLE, 'Diagnose a production TypeScript exception', 'Policy-grounded refund response']);
    await dialog.getByRole('button', { name: 'Submit' }).click();
    await expect(dialog).toBeHidden();
    const card = page.locator('.suite-card').filter({ hasText: 'Payload contract suite' });
    await expect(card.locator('.suite-title-row strong'), 'entry shows the trimmed name').toHaveText('Payload contract suite');
    await expect(card.locator('.suite-meta'), 'entry prompt count matches the 3 selected prompts').toContainText('3 prompts');
  });

  test('1.29 export_results_json_csv_live', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const rowCount = await page.locator('.result-row').count();
    const tableScores = (await page.locator('.results-table-wrap tbody .table-score').allTextContents()).map(Number).sort((a, b) => a - b);
    await page.getByRole('button', { name: 'Export results' }).click();
    const drawer = page.locator('[role="dialog"][aria-labelledby="export-title"]');
    await expect(drawer).toBeVisible();
    const jsonText = await drawer.locator('pre').textContent();
    const doc = JSON.parse(jsonText);
    expect(doc.version, 'JSON tab shows version 1').toBe(1);
    expect(doc).toHaveProperty('suite');
    expect(doc).toHaveProperty('run');
    expect(doc).toHaveProperty('results');
    expect(doc.results.length, 'JSON results array length matches the visible results table').toBe(rowCount);
    const jsonScores = doc.results.map((r) => r.score).sort((a, b) => a - b);
    expect(jsonScores, 'JSON result scores match the visible results table').toEqual(tableScores);

    await drawer.getByRole('tab', { name: 'CSV' }).click();
    const csvText = await drawer.locator('pre').textContent();
    const lines = csvText.trim().split('\n');
    expect(lines[0], 'CSV header matches the normative shape').toBe('promptTitle,model,score,latencyMs,tokens,passFail');
    expect(lines.length - 1, 'CSV row count matches the visible results table').toBe(rowCount);
  });

  test('1.30 export_download_and_copy', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Export results' }).click();
    const drawer = page.locator('[role="dialog"][aria-labelledby="export-title"]');
    const jsonText = await drawer.locator('pre').textContent();

    const [jsonDownload] = await Promise.all([
      page.waitForEvent('download'),
      drawer.getByRole('button', { name: 'Download JSON' }).click(),
    ]);
    expect(jsonDownload.suggestedFilename(), 'Download JSON offers eval-run-results.json').toBe('eval-run-results.json');

    await drawer.getByRole('tab', { name: 'CSV' }).click();
    const csvText = await drawer.locator('pre').textContent();
    const [csvDownload] = await Promise.all([
      page.waitForEvent('download'),
      drawer.getByRole('button', { name: 'Download CSV' }).click(),
    ]);
    expect(csvDownload.suggestedFilename(), 'Download CSV offers eval-run-results.csv').toBe('eval-run-results.csv');

    await expect(drawer.locator('.copied-confirm'), 'no Copied confirmation before Copy is pressed').toHaveCount(0);
    await drawer.getByRole('button', { name: 'Copy' }).click();
    await expect(drawer.locator('.copied-confirm'), 'Copy shows a visible Copied confirmation').toBeVisible();
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText.trim(), 'the clipboard holds the active (CSV) tab contents').toBe(csvText.trim());
    void jsonText;
    await expect(drawer.locator('.copied-confirm'), 'Copied confirmation clears within 5 seconds').toHaveCount(0, { timeout: 5000 });
  });

  test('1.31 import_results_round_trip', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Export results' }).click();
    let drawer = page.locator('[role="dialog"][aria-labelledby="export-title"]');
    const originalJson = await drawer.locator('pre').textContent();
    await drawer.getByRole('button', { name: 'Close export results' }).click();
    await expect(drawer).toBeHidden();

    const doc = JSON.parse(originalJson);
    doc.results = doc.results.map((row, index) => ({ ...row, score: 55, passFail: 'fail', tokens: row.tokens + index }));
    doc.run.averageScore = 55;
    doc.run.passCount = 0;
    doc.run.failCount = doc.results.length;

    await page.getByRole('button', { name: 'Import results' }).click();
    const importDrawer = page.locator('[role="dialog"][aria-labelledby="import-title"]');
    await importDrawer.locator('#import-document').fill(JSON.stringify(doc));
    await importDrawer.getByRole('button', { name: 'Import results', exact: true }).click();
    await expect(importDrawer, 'import drawer closes after a valid import').toBeHidden();

    const scores = await page.locator('.results-table-wrap tbody .table-score').allTextContents();
    expect(scores.every((s) => s === '55'), 'results table now reflects the imported document').toBe(true);
    await expect(page.locator('.suite-card.selected .score-tag, .suite-card:has(button[aria-pressed="true"]) .score-tag'), 'selected suite average badge updates to the imported average').toHaveText('55');

    await page.getByRole('button', { name: 'Export results' }).click();
    drawer = page.locator('[role="dialog"][aria-labelledby="export-title"]');
    const reExportedJson = await drawer.locator('pre').textContent();
    const reExported = JSON.parse(reExportedJson);
    expect(reExported.run.averageScore, 'a subsequent export matches the imported document').toBe(55);
    expect(reExported.results.every((r) => r.score === 55)).toBe(true);
  });

  test('1.32 import_rejects_invalid_payload', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const before = await page.locator('.results-table-wrap tbody .table-score').allTextContents();

    async function attemptImport(document, expectedFieldFragment) {
      await page.getByRole('button', { name: 'Import results' }).click();
      const drawer = page.locator('[role="dialog"][aria-labelledby="import-title"]');
      await expect(drawer).toBeVisible();
      await drawer.locator('#import-document').fill(document);
      await drawer.getByRole('button', { name: 'Import results', exact: true }).click();
      await expect(drawer, 'drawer stays open on invalid import').toBeVisible();
      await expect(drawer.locator('#import-document-error-msg'), `error names the import field (${expectedFieldFragment})`).toContainText(expectedFieldFragment);
      await drawer.getByRole('button', { name: 'Cancel' }).click();
      await expect(drawer).toBeHidden();
    }

    await attemptImport('{ this is not valid json', 'Import');
    await attemptImport(JSON.stringify({ version: 1, suite: { name: 'x' } }), 'Import');

    const baseDoc = {
      version: 1,
      suite: { name: 'Bad suite', promptCount: 1, nightMode: false },
      run: { id: 'r1', startedAt: new Date().toISOString(), finishedAt: new Date().toISOString(), averageScore: 90, passCount: 0, failCount: 1, totalLatencyMs: 100, totalTokens: 100 },
      // The result score itself (not the run rollup) is out of the 0-100 bound.
      results: [{ promptTitle: 'x', model: 'Granite 3.2 8B', score: 200, latencyMs: 100, tokens: 100, passFail: 'fail', promptText: 'x', response: 'x', scoringBreakdown: [{ dimension: 'Accuracy', score: 50 }] }],
    };
    await attemptImport(JSON.stringify(baseDoc), 'score');

    const mismatchedDoc = {
      ...baseDoc,
      run: { ...baseDoc.run, averageScore: 90 },
      results: [{ ...baseDoc.results[0], score: 90, passFail: 'fail' }],
    };
    await attemptImport(JSON.stringify(mismatchedDoc), 'passFail');

    const after = await page.locator('.results-table-wrap tbody .table-score').allTextContents();
    expect(after, 'current results are unchanged after every rejected import').toEqual(before);
  });

  test('1.33 undo_redo_suite_mutations', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const before = await page.locator('.suite-card').count();
    const dialog = await openCreateModal(page);
    await dialog.locator('#suite-name').fill('Undo redo suite');
    await selectPrompts(dialog, [PROMPT_TITLE, 'Policy-grounded refund response']);
    await dialog.getByRole('button', { name: 'Submit' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('.suite-card')).toHaveCount(before + 1);

    const undoButton = page.getByRole('button', { name: 'Undo', exact: true });
    await expect(undoButton).toBeEnabled();
    await undoButton.click();
    await expect(page.locator('.suite-card'), 'Undo removes the created suite, count decreases by one').toHaveCount(before);
    await expect(page.locator('.suite-card').filter({ hasText: 'Undo redo suite' })).toHaveCount(0);

    const redoButton = page.getByRole('button', { name: 'Redo', exact: true });
    await expect(redoButton).toBeEnabled();
    await redoButton.click();
    const restored = page.locator('.suite-card').filter({ hasText: 'Undo redo suite' });
    await expect(restored, 'Redo restores the same suite name').toHaveCount(1);
    await expect(restored.locator('.suite-meta'), 'Redo restores the same prompt count').toContainText('2 prompts');
  });

  test('1.34 result_row_field_contract', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const row = page.locator('.result-row').first();
    const promptTitle = (await row.locator('.prompt-cell').textContent()).trim();
    const model = (await row.locator('td').nth(1).textContent()).trim();
    const score = Number(await row.locator('.table-score').textContent());
    const latencyText = (await row.locator('td').nth(3).textContent()).replaceAll(',', '');
    const tokensText = (await row.locator('td').nth(4).textContent()).replaceAll(',', '');
    const passText = (await row.locator('.pass-tag').textContent()).trim();

    expect(promptTitle.length, 'row exposes a non-empty prompt title').toBeGreaterThan(0);
    expect(model.length, 'row exposes a non-empty model').toBeGreaterThan(0);
    expect(score, 'score is within 0-100').toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(Number(latencyText), 'row exposes a numeric latency').toBeGreaterThanOrEqual(0);
    expect(Number(tokensText), 'row exposes a numeric token count').toBeGreaterThanOrEqual(0);
    expect(passText, 'pass/fail badge is consistent with the 70-point threshold').toBe(score >= 70 ? 'Pass' : 'Fail');

    await row.click();
    const detail = page.locator('.detail-panel.open');
    await expect(detail).toBeVisible();
    await expect(detail.locator('.detail-section p').first(), 'detail panel shows the full promptText').not.toHaveText('');
    await expect(detail.locator('.detail-section.response p'), 'detail panel shows the model response').not.toHaveText('');
    await detail.locator('.disclosure button').click();
    const dimensionRows = detail.locator('.rubric-row');
    await expect(dimensionRows.first(), 'scoringBreakdown has at least one dimension score').toBeVisible();
    expect(await dimensionRows.count()).toBeGreaterThanOrEqual(1);
  });
});
