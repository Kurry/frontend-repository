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

test.describe('seed dataset studio (task-specific)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
  });

  test('1.1 seeded_manifest_scale_and_repos', async ({ page }) => {
    const total = await page.locator('.seed-table tbody tr').count();
    expect(total, 'at least 60 seeds shown on first load').toBeGreaterThanOrEqual(60);
    const heading = await page.locator('.stats-head h2').innerText();
    expect(heading, 'visible total count states the number of seeds').toMatch(/\d+.*seeds/i);
    for (const repo of ['quartz-orm', 'copperline', 'lattice-db', 'brineworks', 'fernwheel', 'ashgrid']) {
      await expect(page.locator('.seed-table tbody tr', { hasText: repo }).first(), `${repo} present in queue`).toBeVisible();
    }
    const repoRow = page.locator('.repo-row', { hasText: 'quartz-orm' });
    await expect(repoRow, 'quartz-orm rollup row present').toBeVisible();
  });

  test('1.2 queue_row_anatomy', async ({ page }) => {
    const row = page.locator('.seed-table tbody tr').filter({ hasText: 'quartz-orm-issue-142' });
    await expect(row, 'seed row present').toBeVisible();
    const rowText = await row.innerText();
    expect(rowText).toContain('quartz-orm-issue-142');
    expect(rowText).toContain('quartz-orm');
    expect(rowText).toContain('TypeScript');
    expect(rowText).toContain('issue');
    await expect(row.locator('.badge.draft'), 'status badge present').toBeVisible();
    await expect(row.locator('.badge.unset, .badge.hard'), 'difficulty badge present').toBeVisible();
  });

  test('1.3 named_seed_present_with_fields', async ({ page }) => {
    const row = page.locator('.seed-table tbody tr').filter({ hasText: 'quartz-orm-issue-142' });
    await expect(row, 'seed row exists').toBeVisible();
    await expect(row.getByTitle('Connection pool exhausts when nested transactions roll back')).toBeVisible();
    await expect(row.locator('.badge.draft')).toBeVisible();
    await expect(row.locator('.badge.unset')).toBeVisible();
    await row.click();
    await expect(page.locator('.workbench-id h2')).toHaveText('quartz-orm-issue-142');
    const meta = await page.locator('.meta-row').first().innerText();
    expect(meta).toContain('Deference: premise-acceptance');
    expect(meta).toContain('Failure: wrong-answer');
  });

  test('1.5 pinned_commit_display_and_copy', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const row = page.locator('.seed-table tbody tr').filter({ hasText: 'quartz-orm-issue-142' });
    const rowCommit = await row.locator('.commit').innerText();
    expect(rowCommit, 'row shows first 10 chars of commit hash').toHaveLength(10);
    await row.click();
    const fullCommit = await page.locator('.full-commit').innerText();
    expect(fullCommit, 'detail shows full 40-char lowercase hex hash').toMatch(/^[0-9a-f]{40}$/);
    expect(fullCommit.slice(0, 10)).toBe(rowCommit);
    await page.locator('.meta-row button', { hasText: 'Copy commit' }).click();
    await expect(page.locator('.meta-row button', { hasText: 'Copied' })).toBeVisible();
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(fullCommit);
  });

  test('1.7 combined_filters_indicated', async ({ page }) => {
    await page.getByLabel('Filter by status').selectOption('draft');
    await page.getByLabel('Filter by language').selectOption('TypeScript');
    await expect(page.locator('.active-summary')).toContainText('status: draft');
    await expect(page.locator('.active-summary')).toContainText('language: TypeScript');
    const rows = page.locator('.seed-table tbody tr');
    const count = await rows.count();
    expect(count, 'combined filters narrow rows').toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).innerText();
      expect(text).toContain('TypeScript');
      await expect(rows.nth(i).locator('.badge.draft')).toBeVisible();
    }
  });

  test('1.8 search_narrows_and_restores', async ({ page }) => {
    const before = await page.locator('.seed-table tbody tr').count();
    await page.getByLabel('Search seed id or title').fill('quartz-orm-issue-142');
    await expect(page.locator('.seed-table tbody tr')).toHaveCount(1);
    await expect(page.locator('.seed-table tbody tr').first()).toContainText('quartz-orm-issue-142');
    await page.getByLabel('Search seed id or title').fill('');
    await expect(page.locator('.seed-table tbody tr')).toHaveCount(before);
  });

  test('1.9 column_sort_round_trip', async ({ page }) => {
    const idHeaderButton = page.locator('thead th button', { hasText: 'id' }).first();
    await idHeaderButton.click();
    const ascending = await page.locator('.seed-table tbody .seed-id').allInnerTexts();
    await idHeaderButton.click();
    const descending = await page.locator('.seed-table tbody .seed-id').allInnerTexts();
    expect(descending[0], 'descending sort reverses relative to ascending').not.toBe(ascending[0]);
    // Descending click reverses the row order relative to the ascending list —
    // exactly what the criterion requires — without re-deriving the locale sort.
    expect(descending).toEqual([...ascending].reverse());
  });

  test('1.10 saved_filter_chips', async ({ page }) => {
    await page.getByLabel('Filter by status').selectOption('draft');
    await page.getByLabel('Saved filter name').fill('My draft filter');
    await page.locator('button', { hasText: 'Save filter' }).click();
    const chip = page.locator('.chip', { hasText: 'My draft filter' });
    await expect(chip).toBeVisible();
    await page.getByLabel('Filter by status').selectOption('');
    await expect(page.locator('.active-summary')).not.toContainText('status: draft');
    await chip.click();
    await expect(page.getByLabel('Filter by status')).toHaveValue('draft');
    await chip.getByRole('button', { name: /Remove saved filter/ }).click();
    await expect(page.locator('.chip', { hasText: 'My draft filter' })).toHaveCount(0);
  });

  test('1.15 accept_opens_workbench', async ({ page }) => {
    const row = page.locator('.seed-table tbody tr').filter({ hasText: 'quartz-orm-issue-142' });
    await row.locator('.row-button', { hasText: 'Accept' }).click();
    await expect(page.locator('.workbench-id h2')).toHaveText('quartz-orm-issue-142');
    // First badge in the header is the status chip; it must have left draft.
    await expect(page.locator('.workbench-id .badge').first()).not.toHaveClass(/draft/);
  });

  test('1.16 reject_form_constrained_and_gated', async ({ page }) => {
    const row = page.locator('.seed-table tbody tr').filter({ hasText: 'quartz-orm-issue-142' });
    await row.locator('.row-button', { hasText: 'Reject' }).click();
    const optionValues = await page.locator('#reject-class option').evaluateAll((options) => options.map((o) => o.value));
    expect(optionValues.filter((v) => v)).toEqual([
      'duplicate-report', 'insufficient-signal', 'environment-specific', 'ambiguous-report', 'trivial-fix'
    ]);
    const submit = page.locator('.form-actions button', { hasText: 'Reject seed' });
    await expect(submit, 'submit disabled with nothing filled').toBeDisabled();
    await page.locator('#reject-class').selectOption('duplicate-report');
    await page.locator('#reject-justification').fill('too short');
    await expect(submit, 'submit still disabled below 20 chars').toBeDisabled();
    await page.locator('#reject-justification').fill('This is a sufficiently long justification.');
    await expect(submit, 'submit enabled once both valid').toBeEnabled();
  });

  test('1.17 valid_rejection_updates_everything', async ({ page }) => {
    const draftCountBefore = await page.locator('.status-cell.draft strong').innerText();
    const rejectedCountBefore = await page.locator('.status-cell.rejected strong').innerText();
    const row = page.locator('.seed-table tbody tr').filter({ hasText: 'quartz-orm-issue-142' });
    await row.locator('.row-button', { hasText: 'Reject' }).click();
    await page.locator('#reject-class').selectOption('duplicate-report');
    await page.locator('#reject-justification').fill('Duplicate of an existing tracked report.');
    await page.locator('.form-actions button', { hasText: 'Reject seed' }).click();
    await expect(page.locator('.status-cell.draft strong')).toHaveText(String(Number(draftCountBefore) - 1));
    await expect(page.locator('.status-cell.rejected strong')).toHaveText(String(Number(rejectedCountBefore) + 1));
    const updatedRow = page.locator('.seed-table tbody tr').filter({ hasText: 'quartz-orm-issue-142' });
    await expect(updatedRow.locator('.badge.rejected')).toBeVisible();
  });

  test('1.18 short_justification_rejected_inline', async ({ page }) => {
    const draftCountBefore = await page.locator('.status-cell.draft strong').innerText();
    const row = page.locator('.seed-table tbody tr').filter({ hasText: 'quartz-orm-issue-142' });
    await row.locator('.row-button', { hasText: 'Reject' }).click();
    await page.locator('#reject-class').selectOption('duplicate-report');
    await page.locator('#reject-justification').fill('too short');
    await page.locator('#reject-justification').blur();
    await expect(page.locator('#reject-justification-error')).toContainText('justification');
    await expect(page.locator('.status-cell.draft strong')).toHaveText(draftCountBefore);
  });

  test('1.19 multi_select_toolbar', async ({ page }) => {
    const row = page.locator('.seed-table tbody tr').filter({ hasText: 'quartz-orm-issue-142' });
    await row.locator('input[type=checkbox]').check();
    await expect(page.locator('.batch-bar')).toContainText('1 selected');
    await expect(page.locator('.batch-bar button', { hasText: 'Accept for authoring' })).toBeEnabled();
    await expect(page.locator('.batch-bar button', { hasText: 'Batch reject' })).toBeEnabled();
  });

  test('1.21 undo_reverses_last_triage', async ({ page }) => {
    const draftCountBefore = await page.locator('.status-cell.draft strong').innerText();
    const row = page.locator('.seed-table tbody tr').filter({ hasText: 'quartz-orm-issue-142' });
    await row.locator('.row-button', { hasText: 'Accept' }).click();
    await page.locator('.view-switch button', { hasText: 'Queue' }).click();
    await expect(page.locator('.status-cell.draft strong')).toHaveText(String(Number(draftCountBefore) - 1));
    await page.locator('button[aria-label="Undo triage"]').click();
    await expect(page.locator('.status-cell.draft strong')).toHaveText(draftCountBefore);
    const restoredRow = page.locator('.seed-table tbody tr').filter({ hasText: 'quartz-orm-issue-142' });
    await expect(restoredRow.locator('.badge.draft')).toBeVisible();
  });

  test('1.24 positive_rubric_editable_15', async ({ page }) => {
    const row = page.locator('.seed-table tbody tr').filter({ hasText: 'quartz-orm-issue-142' });
    await row.click();
    const ids = await page.locator('#pane-positive .criterion-id').evaluateAll((inputs) => inputs.map((i) => i.value));
    expect(ids).toEqual(['1.1', '1.2', '1.3', '1.4', '1.5']);
    const nameField = page.locator('#pane-positive .criterion input[aria-label="1.1 name"]');
    await nameField.fill('Renamed investigation criterion');
    await expect(page.locator('#pane-positive .criterion input[aria-label="1.1 name"]')).toHaveValue('Renamed investigation criterion');
  });

  test('1.25 locked_runtime_evidence_gate', async ({ page }) => {
    const row = page.locator('.seed-table tbody tr').filter({ hasText: 'quartz-orm-issue-142' });
    await row.click();
    const lockedRow = page.locator('#criterion-1-4');
    await expect(lockedRow.locator('button[aria-label*="Locked criterion 1.4"]')).toBeVisible();
    await expect(lockedRow.locator('button[aria-label*="Locked criterion 1.4"]')).toBeDisabled();
    const countBefore = await page.locator('#pane-positive .criterion').count();
    await lockedRow.locator('button[aria-label*="Locked criterion 1.4"]').click({ force: true });
    expect(await page.locator('#pane-positive .criterion').count()).toBe(countBefore);
    await expect(page.locator('#criterion-1-4')).toBeVisible();
  });

  test('1.41 export_manifest_field_contract', async ({ page }) => {
    await page.getByLabel('Filter by status').selectOption('authored');
    await page.locator('.seed-table tbody tr').first().click();
    await page.locator('.head-actions button', { hasText: 'Export package' }).click();
    const preview = await page.locator('.preview').innerText();
    const manifest = JSON.parse(preview);
    expect(manifest.schemaVersion).toBe('seed-package-manifest-v1');
    expect(manifest.pinnedCommit).toMatch(/^[0-9a-f]{40}$/);
    expect(['issue', 'pr']).toContain(manifest.kind);
    expect(Array.isArray(manifest.positiveCriteria)).toBe(true);
    expect(Array.isArray(manifest.foils)).toBe(true);
    expect(['present', 'harvest-pending']).toContain(manifest.goldenAnswer.status);
  });

  test('1.42 export_reflects_fresh_edits', async ({ page }) => {
    await page.getByLabel('Filter by status').selectOption('authored');
    await page.locator('.seed-table tbody tr').first().click();
    const nameField = page.locator('#pane-positive .criterion input[aria-label="1.1 name"]');
    await nameField.fill('Freshly edited criterion name');
    await page.locator('.head-actions button', { hasText: 'Export package' }).click();
    const preview = await page.locator('.preview').innerText();
    const manifest = JSON.parse(preview);
    expect(manifest.positiveCriteria.find((c) => c.id === '1.1').name).toBe('Freshly edited criterion name');
  });

  test('1.44 dataset_snapshot_field_contract', async ({ page }) => {
    await page.locator('button[aria-label="Export center"]').click();
    await page.getByRole('tab', { name: 'Dataset snapshot JSON' }).click();
    const preview = await page.locator('.preview').innerText();
    const snapshot = JSON.parse(preview);
    expect(snapshot.schemaVersion).toBe('dataset-snapshot-v1');
    expect(snapshot.generatedAt).toMatch(/Z$/);
    const total = Object.values(snapshot.byStatus).reduce((sum, n) => sum + n, 0);
    expect(total).toBe(snapshot.totalSeeds);
    const rejectedSum = Object.values(snapshot.rejectedByClass).reduce((sum, n) => sum + n, 0);
    expect(rejectedSum).toBe(snapshot.byStatus.rejected);
  });

  test('1.46 empty_filter_state_recoverable', async ({ page }) => {
    await page.getByLabel('Filter by status').selectOption('draft');
    await page.getByLabel('Filter by language').selectOption('TypeScript');
    await page.getByLabel('Filter by repository').selectOption('copperline');
    await expect(page.locator('.table-scroller .empty')).toBeVisible();
    await expect(page.locator('.table-scroller .empty')).toContainText('status: draft');
    await page.locator('.table-scroller .empty button', { hasText: 'Clear all filters' }).click();
    await expect(page.locator('.seed-table tbody tr').first()).toBeVisible();
    await expect(page.getByLabel('Filter by status')).toHaveValue('');
  });
});
