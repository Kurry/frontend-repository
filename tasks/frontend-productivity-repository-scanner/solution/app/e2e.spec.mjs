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

// Seeded repositories (see solution/app/src/store.ts):
//   repo-1  /workspace/design-system   "Design system"   (clean scan path)
//   repo-2  /workspace/product-catalog "Product catalog" (deterministic scan
//           failure on its root .cursorrules step — used only when a test
//           needs the failure path)
//   repo-3  /workspace/agent-toolkit   "Agent toolkit"    (clean scan path)

async function gotoApp(page) {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('.repository-row')).toHaveCount(3);
}

function addModal(page) {
  return page.locator('.cds--modal.is-visible');
}

test.describe('task criteria', () => {
  test('1.1 add_repository_form_validation', async ({ page }) => {
    await gotoApp(page);
    await page.locator('.toolbar-primary').getByRole('button', { name: 'Add repository' }).click();
    const modal = addModal(page);
    await expect(modal).toBeVisible();
    const primary = modal.locator('.cds--modal-footer .cds--btn--primary');
    const pathInput = page.locator('#repository-path');

    // Empty path: submit stays disabled.
    await expect(primary).toBeDisabled();

    // Whitespace-only path: still invalid, submit stays disabled.
    await pathInput.fill('    ');
    await expect(primary).toBeDisabled();
    await expect(page.locator('#repository-path-error')).toContainText(/whitespace/i);

    // Over 260 characters: named inline validation message, submit stays disabled.
    await pathInput.fill('/workspace/' + 'x'.repeat(261));
    await expect(page.locator('#repository-path-error')).toContainText(/260 characters/i);
    await expect(primary).toBeDisabled();

    // Valid path: submit becomes enabled.
    await pathInput.fill('/workspace/valid-path');
    await expect(primary).toBeEnabled();
  });

  test('1.2 add_repository_creates_exactly_one', async ({ page }) => {
    await gotoApp(page);
    const before = await page.locator('.repository-row').count();
    await page.locator('.toolbar-primary').getByRole('button', { name: 'Add repository' }).click();
    const modal = addModal(page);
    const distinctPath = `/workspace/e2e-add-${Date.now()}`;
    await modal.locator('#repository-path').fill(distinctPath);
    await modal.locator('.cds--modal-footer .cds--btn--primary').click();
    await expect(modal).toBeHidden();
    await expect(page.locator('.repository-row')).toHaveCount(before + 1);
    await expect(page.locator('.repository-row', { hasText: distinctPath })).toHaveCount(1);
  });

  test('1.3 repository_row_anatomy_and_seed', async ({ page }) => {
    await gotoApp(page);
    const rows = page.locator('.repository-row');
    await expect(rows).toHaveCount(3);
    for (let index = 0; index < 3; index += 1) {
      const row = rows.nth(index);
      await expect(row.locator('input[type="checkbox"]')).toHaveCount(1);
      await expect(row.locator('.repository-path')).not.toHaveText('');
      await expect(row.locator('h3')).not.toHaveText('');
      await expect(row.locator('.repository-meta')).toContainText(/documents/);
      await expect(row.locator('.repository-meta')).not.toContainText('Not scanned yet');
      await expect(row.getByRole('button', { name: 'Scan now' })).toBeVisible();
      const metaText = await row.locator('.repository-meta').innerText();
      const match = metaText.match(/(\d+)\s+documents/);
      expect(Number(match[1]), `row ${index} has at least 8 seeded documents`).toBeGreaterThanOrEqual(8);
    }
    const totalDocumentRows = await page.locator('.document-row').count();
    expect(totalDocumentRows, 'document tree reaches at least 8 docs per seeded repository').toBeGreaterThanOrEqual(24);
  });

  test('1.4 rename_and_remove_repository', async ({ page }) => {
    await gotoApp(page);
    // Use the stable seeded id (see store.ts) instead of matching on the
    // display name text, which disappears from the row while renaming.
    const row = page.locator('#repository-repo-1');
    await row.getByRole('button', { name: /Rename/ }).click();
    const newName = `Renamed Repo ${Date.now()}`;
    await row.getByRole('textbox').fill(newName);
    await row.getByRole('button', { name: 'Save name' }).click();
    await expect(row.locator('h3')).toHaveText(newName);

    // Renamed value shows up everywhere the repository is referenced (Export preview).
    await page.locator('.toolbar-secondary').getByRole('button', { name: 'Export scan index' }).click();
    await expect(page.locator('.artifact-preview').first()).toContainText(newName);
    await page.keyboard.press('Escape');

    // Remove asks for confirmation, then deletes the row and its documents together.
    const countBefore = await page.locator('.repository-row').count();
    await row.getByRole('button', { name: /Remove/ }).click();
    const confirmModal = addModal(page);
    await expect(confirmModal.getByRole('heading', { name: 'Remove repository?' })).toBeVisible();
    await confirmModal.getByRole('button', { name: 'Remove repository', exact: true }).click();
    await expect(page.locator('.repository-row')).toHaveCount(countBefore - 1);
    await expect(page.locator('.repository-row', { hasText: newName })).toHaveCount(0);
    await expect(page.locator('.document-row', { hasText: '/workspace/design-system/' })).toHaveCount(0);
  });

  test('1.10 pause_resume_from_checkpoint', async ({ page }) => {
    test.setTimeout(45000);
    await gotoApp(page);
    const row = page.locator('.repository-row', { hasText: 'Agent toolkit' });
    await row.getByRole('button', { name: 'Scan now' }).click();
    await expect(page.locator('#scan-panel')).toBeVisible();
    // Let at least one step start running before pausing.
    await page.waitForTimeout(650);
    await page.locator('.scan-actions').getByRole('button', { name: 'Pause' }).click();
    await expect(row.getByText('Paused')).toBeVisible();
    const percentAt = async () => page.locator('.scan-progress-bar [role="progressbar"]').getAttribute('aria-valuenow');
    const frozen = await percentAt();
    await page.waitForTimeout(1000);
    expect(await percentAt(), 'progress does not advance while paused').toBe(frozen);
    const completeCountAt = async () => (await page.locator('.step-row[data-status="complete"]').count());
    const completeFrozen = await completeCountAt();
    await page.waitForTimeout(1000);
    expect(await completeCountAt(), 'no further steps complete while paused').toBe(completeFrozen);

    await page.locator('.scan-actions').getByRole('button', { name: 'Resume' }).click();
    await expect
      .poll(async () => (await row.locator('.repository-meta').innerText()), { timeout: 20000 })
      .toContain('8 documents');
    await expect(row.locator('.repository-meta')).not.toContainText('Not scanned yet');
  });

  test('1.13 document_tree_grouped_by_type', async ({ page }) => {
    await gotoApp(page);
    const groups = ['CLAUDE.md', 'AGENTS.md', '.cursorrules', 'README files'];
    for (const label of groups) {
      const group = page.locator('.document-group', { hasText: label });
      await expect(group).toBeVisible();
      const countText = await group.locator('.group-count').innerText();
      const rowCount = await group.locator('.document-row').count();
      expect(Number(countText), `${label} group header count matches its rendered rows`).toBe(rowCount);
      expect(rowCount).toBeGreaterThan(0);
    }
  });

  test('1.17 type_filter_checkboxes', async ({ page }) => {
    await gotoApp(page);
    const totalBefore = await page.locator('.document-row').count();
    await page.getByRole('checkbox', { name: 'CLAUDE.md', exact: true }).check({ force: true });
    const filteredCount = await page.locator('.document-row').count();
    expect(filteredCount, 'checking one type narrows the tree').toBeLessThan(totalBefore);
    await expect(page.locator('.document-group')).toHaveCount(1);
    await expect(page.locator('.document-group')).toContainText('CLAUDE.md');

    await page.getByRole('checkbox', { name: 'CLAUDE.md', exact: true }).uncheck({ force: true });
    await expect(page.locator('.document-row')).toHaveCount(totalBefore);
  });

  test('1.18 pattern_toggles_affect_future_scans', async ({ page }) => {
    test.setTimeout(45000);
    await gotoApp(page);
    const readmeGroupCount = async () => {
      const group = page.locator('.document-group', { hasText: 'README files' });
      return Number(await group.locator('.group-count').innerText());
    };
    const before = await readmeGroupCount();

    await page.locator('#pattern-readme').click({ force: true });
    const row = page.locator('.repository-row', { hasText: 'Design system' });
    await row.getByRole('button', { name: 'Scan now' }).click();
    await expect
      .poll(async () => (await row.locator('.repository-meta').innerText()), { timeout: 15000 })
      .toContain('6 documents');
    expect(await readmeGroupCount(), 'rescanned repository stops contributing README docs').toBe(before - 2);

    // Toggling off the last enabled pattern shows an inline validation message.
    await page.locator('#pattern-agents-md').click({ force: true });
    await page.locator('#pattern-cursorrules').click({ force: true });
    await page.locator('#pattern-claude-md').click({ force: true });
    await expect(page.locator('.settings-panel')).toContainText(/at least one document pattern must remain enabled/i);
  });

  test('1.21 undo_redo_repository_mutations', async ({ page }) => {
    await gotoApp(page);
    const before = await page.locator('.repository-row').count();
    await page.locator('.toolbar-primary').getByRole('button', { name: 'Add repository' }).click();
    const modal = addModal(page);
    const distinctPath = `/workspace/e2e-undo-${Date.now()}`;
    await modal.locator('#repository-path').fill(distinctPath);
    await modal.locator('.cds--modal-footer .cds--btn--primary').click();
    await expect(page.locator('.repository-row')).toHaveCount(before + 1);

    const undoButton = page.getByRole('button', { name: 'Undo', exact: true });
    const redoButton = page.getByRole('button', { name: 'Redo', exact: true });
    await expect(undoButton).toBeEnabled();
    await expect(redoButton).toBeDisabled();

    await undoButton.click();
    await expect(page.locator('.repository-row')).toHaveCount(before);
    await expect(page.locator('.repository-row', { hasText: distinctPath })).toHaveCount(0);
    await expect(redoButton).toBeEnabled();

    await redoButton.click();
    await expect(page.locator('.repository-row')).toHaveCount(before + 1);
    await expect(page.locator('.repository-row', { hasText: distinctPath })).toHaveCount(1);
  });

  test('1.23 export_scan_index_json_field_contract', async ({ page }) => {
    await gotoApp(page);
    await page.locator('.toolbar-secondary').getByRole('button', { name: 'Export scan index' }).click();
    await expect(page.getByRole('tab', { name: 'Scan Index JSON' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Inventory Markdown' })).toBeVisible();
    const jsonText = await page.locator('[aria-label="Scan Index JSON preview"]').innerText();
    const payload = JSON.parse(jsonText);
    expect(payload.schemaVersion).toBe('repo-scan-index/v1');
    expect(typeof payload.exportedAt).toBe('string');
    expect(Number.isNaN(Date.parse(payload.exportedAt))).toBe(false);
    const patternKeys = ['claude-md', 'agents-md', 'cursorrules', 'readme'];
    for (const key of patternKeys) expect(typeof payload.patterns[key]).toBe('boolean');
    expect(Object.values(payload.patterns).some(Boolean)).toBe(true);
    expect(Array.isArray(payload.repositories)).toBe(true);
    expect(payload.repositories.length).toBeGreaterThanOrEqual(3);
    for (const repository of payload.repositories) {
      expect(typeof repository.path).toBe('string');
      expect(repository.path.length).toBeGreaterThan(0);
      expect(repository.documentCount).toBe(repository.documents.length);
    }
  });

  test('1.25 import_scan_index_round_trip', async ({ page }) => {
    await gotoApp(page);
    const countBefore = await page.locator('.repository-row').count();

    await page.locator('.toolbar-secondary').getByRole('button', { name: 'Import scan index' }).click();
    const importModal = addModal(page);
    const importSubmit = importModal.locator('.cds--modal-footer .cds--btn--primary');

    // Malformed JSON: named inline validation, submit stays disabled, no mutation applied.
    await importModal.locator('#import-payload').fill('{ this is not json');
    await expect(page.locator('#import-payload-error')).toContainText(/malformed JSON/i);
    await expect(importSubmit).toBeDisabled();
    await expect(page.locator('.repository-row')).toHaveCount(countBefore);

    // Payload that fails the field contract (wrong schemaVersion): named validation, still no mutation.
    const badSchema = JSON.stringify({
      schemaVersion: 'wrong-version',
      exportedAt: new Date().toISOString(),
      patterns: { 'claude-md': true, 'agents-md': true, cursorrules: true, readme: true },
      repositories: [],
    });
    await importModal.locator('#import-payload').fill(badSchema);
    await expect(page.locator('#import-payload-error')).toContainText(/schemaVersion/i);
    await expect(importSubmit).toBeDisabled();
    await expect(page.locator('.repository-row')).toHaveCount(countBefore);

    const distinctPath = `/workspace/e2e-import-${Date.now()}`;
    const goodSchema = JSON.stringify({
      schemaVersion: 'repo-scan-index/v1',
      exportedAt: new Date().toISOString(),
      patterns: { 'claude-md': true, 'agents-md': true, cursorrules: true, readme: true },
      repositories: [{
        path: distinctPath,
        documentCount: 1,
        documents: [{ path: `${distinctPath}/CLAUDE.md`, type: 'CLAUDE.md', content: 'hello', findings: [] }],
      }],
    });
    await importModal.locator('#import-payload').fill(goodSchema);
    await expect(importSubmit).toBeEnabled();
    await importSubmit.click();
    await expect(page.locator('.repository-row')).toHaveCount(1);
    await expect(page.locator('.repository-row', { hasText: distinctPath })).toHaveCount(1);
  });

  test('5.4 reload_returns_seeded_baseline', async ({ page }) => {
    await gotoApp(page);
    await page.locator('.toolbar-primary').getByRole('button', { name: 'Add repository' }).click();
    const modal = addModal(page);
    await modal.locator('#repository-path').fill(`/workspace/e2e-reload-${Date.now()}`);
    await modal.locator('.cds--modal-footer .cds--btn--primary').click();
    await expect(modal).toBeHidden();
    await expect(page.locator('.repository-row')).toHaveCount(4);

    await page.locator('#pattern-readme').click({ force: true });
    await page.locator('.repository-row').first().locator('.cds--checkbox-label').click({ force: true });
    await page.locator('.repository-row', { hasText: 'Agent toolkit' }).getByRole('button', { name: 'Scan now' }).click();
    const disclosureToggle = page.locator('.findings-toggle').first();
    await disclosureToggle.click();
    await page.locator('.toolbar-secondary').getByRole('button', { name: 'Export scan index' }).click();
    await page.keyboard.press('Escape');

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.repository-row')).toHaveCount(3);
    const rows = page.locator('.repository-row');
    for (let index = 0; index < 3; index += 1) {
      const metaText = await rows.nth(index).locator('.repository-meta').innerText();
      const match = metaText.match(/(\d+)\s+documents/);
      expect(Number(match[1])).toBeGreaterThanOrEqual(8);
    }
    for (const key of ['claude-md', 'agents-md', 'cursorrules', 'readme']) {
      await expect(page.locator(`#pattern-${key}`)).toHaveAttribute('aria-checked', 'true');
    }
    await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Redo', exact: true })).toBeDisabled();
    await expect(page.locator('.repository-actions').getByText('Scanning')).toHaveCount(0);
    await expect(addModal(page)).toHaveCount(0);
  });

  test('5.9 webmcp_registry_matches_ui', async ({ page }) => {
    await gotoApp(page);
    const distinctPath = `/workspace/webmcp-e2e-${Date.now()}`;
    const result = await invokeTool(page, 'entity_repository_create', { path: distinctPath });
    expect(result.ok).toBe(true);
    await expect(page.locator('.repository-row', { hasText: distinctPath })).toHaveCount(1);
    await expect(page.locator('.repository-row')).toHaveCount(4);
  });

  test('4.7 no_concurrent_scan_and_empty_batch', async ({ page }) => {
    test.setTimeout(30000);
    await gotoApp(page);
    const row = page.locator('.repository-row', { hasText: 'Agent toolkit' });
    await row.getByRole('button', { name: 'Scan now' }).click();
    await expect(page.locator('.step-row')).toHaveCount(8);

    const concurrent = await invokeTool(page, 'session_scan_start', { repositoryId: 'repo-3' });
    expect(concurrent.ok).toBe(false);
    await expect(page.locator('.step-row')).toHaveCount(8);

    const scanSelectedButton = page.locator('.toolbar-primary').getByRole('button', { name: /Scan selected/ });
    await expect(scanSelectedButton).toBeDisabled();
  });

  test('4.6 hover_wash_system', async ({ page }) => {
    await gotoApp(page);
    const row = page.locator('.repository-row').first();
    await page.mouse.move(2, 2);
    const before = await row.evaluate((element) => getComputedStyle(element).backgroundColor);
    await row.hover();
    await expect
      .poll(async () => row.evaluate((element) => getComputedStyle(element).backgroundColor))
      .not.toBe(before);
  });

  test('batch scans complete normally while the explicit failure demo remains isolated', async ({ page }) => {
    test.setTimeout(45000);
    await gotoApp(page);
    await page.getByRole('button', { name: 'Select all' }).click();
    await page.getByRole('button', { name: /Scan selected/ }).click();
    await expect.poll(async () => page.locator('.repository-title-line .cds--tag--green').count(), { timeout: 30000 }).toBe(3);
    await expect(page.locator('#repository-repo-2')).toContainText('Complete');
  });

  test('scan state stays interactive across filters viewer pause and export', async ({ page }) => {
    test.setTimeout(30000);
    await gotoApp(page);
    const scanRow = page.locator('#repository-repo-3');
    await scanRow.getByRole('button', { name: 'Scan now' }).click();
    await page.getByRole('checkbox', { name: 'CLAUDE.md', exact: true }).check({ force: true });
    await page.locator('.document-row').first().locator('.document-open').click();
    await expect(page.locator('.code-viewer')).toBeVisible();
    await page.locator('.scan-actions').getByRole('button', { name: 'Pause' }).click();
    await page.getByRole('button', { name: 'Export scan index' }).click();
    await expect(page.getByRole('dialog', { name: 'Live scan package' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(scanRow.getByText('Paused')).toBeVisible();
    await expect(page.locator('.code-viewer')).toBeVisible();
    await page.getByRole('button', { name: 'Back to document tree' }).click();
    await expect(page.getByRole('checkbox', { name: 'CLAUDE.md', exact: true })).toBeChecked();
  });

  test('display preferences and export confirmations are specific and reversible', async ({ page }) => {
    await gotoApp(page);
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.getByRole('button', { name: 'Compact density' }).click();
    await expect(page.locator('.app-shell')).toHaveClass(/density-compact/);
    await page.getByRole('button', { name: 'High contrast' }).click();
    await expect(page.locator('.app-shell')).toHaveClass(/is-high-contrast/);
    await page.getByRole('button', { name: 'Export scan index' }).click();
    await page.getByRole('button', { name: 'Copy', exact: true }).click();
    await expect(page.locator('.export-live')).toContainText('Scan Index JSON copied');
    await page.getByRole('button', { name: 'Download', exact: true }).click();
    await expect(page.locator('.export-live')).toContainText('Scan Index JSON downloaded');
  });
});
