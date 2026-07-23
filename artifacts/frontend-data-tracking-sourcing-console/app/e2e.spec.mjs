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

test('1.1 seeded_candidates_columns_complete', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  const rows = page.locator('tbody tr');
  // It might have more than 25 rows
  await expect(async () => {
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(25);
  }).toPass({ timeout: 5000 });
  const row = rows.first();
  await expect(row.locator('td').nth(1)).not.toBeEmpty();
  await expect(row.locator('td').nth(2)).not.toBeEmpty();
});

test('1.2 seeded_quota_complete', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('button', { name: 'Quota', exact: true }).click();
  const headings = page.getByRole('heading', { name: 'Quota dashboard' });
  await expect(headings).toBeVisible();
});

test('1.4 status_select_flow_no_reload', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  // Pin the row by name (a generic "first scored row" locator self-invalidates
  // once the status flips). copperfield/wren-query is seeded scored with a
  // unique cluster and org, so no diversity guard interferes.
  const row = page.getByRole('row').filter({ hasText: 'copperfield/wren-query' });
  await expect(row).toContainText('Scored');
  await row.getByRole('button', { name: 'Select' }).click();
  await expect(row).toContainText('Selected');
});

test('1.8 quota_cell_click_filters_candidates', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('button', { name: 'Quota', exact: true }).click();
  const pythonEasy = page.getByRole('button', { name: /Python easy:/ });
  await pythonEasy.click();
  await expect(page.getByRole('heading', { name: 'Candidate workbench' })).toBeVisible();
  await expect(page.getByLabel('Active filters')).toContainText('language Python');
});

test('1.9 guard_blocks_duplicate_cluster_or_org', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  // Seeded state: emberforge/ash-parser (cl-aurora) is already 'selected' and
  // northloom/thread-cache (also cl-aurora) is 'scored'. Selecting the second
  // must be blocked by the cluster diversity guard, in place, with the row
  // staying 'Scored' and showing the named guard message.
  const holder = page.getByRole('row').filter({ hasText: 'emberforge/ash-parser' });
  await expect(holder).toContainText('Selected');
  const blocked = page.getByRole('row').filter({ hasText: 'northloom/thread-cache' });
  await expect(blocked).toContainText('Scored');
  await blocked.getByRole('button', { name: 'Select' }).click();
  await expect(blocked).toContainText('Cluster guard: cl-aurora is already held by emberforge/ash-parser');
  await expect(blocked).toContainText('Scored');
});

test('1.10 pin_confirm_dialog_and_copy', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('http://localhost:3000/');
  const row = page.getByRole('row').filter({ hasText: 'selected' }).first();
  await row.getByRole('button', { name: 'Pin' }).click();
  const dialog = page.getByRole('dialog', { name: /Pin/ });
  await dialog.getByLabel(/Notes/).fill('x'.repeat(201));
  const btn = dialog.getByRole('button', { name: 'Confirm pin' });
  await expect(btn).toBeDisabled();
});

test('1.11 queue_pinned_candidate', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  // Seed a pinned row first for deterministic testing
  const scoreRow = page.getByRole('row').filter({ hasText: 'scored' }).first();
  await scoreRow.getByRole('button', { name: 'Select' }).first().click();
  const selectRow = page.getByRole('row').filter({ hasText: 'selected' }).first();
  await selectRow.getByRole('button', { name: 'Pin' }).first().click();
  const dialog = page.getByRole('dialog', { name: /Pin/ });
  await dialog.getByRole('button', { name: 'Confirm pin' }).click();

  const row = page.getByRole('row').filter({ hasText: 'pinned' }).first();
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Queue' }).click();
  await expect(page.getByLabel('Ordered build queue').first()).toBeVisible();
});

test('1.13 queue_removal_restores_selected', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  // Seed: score -> select -> pin -> queue, all from the candidate workbench.
  const scoreRow = page.getByRole('row').filter({ hasText: 'scored' }).first();
  await scoreRow.getByRole('button', { name: 'Select' }).first().click();
  const selectRow = page.getByRole('row').filter({ hasText: 'selected' }).first();
  await selectRow.getByRole('button', { name: 'Pin' }).first().click();
  const dialog = page.getByRole('dialog', { name: /Pin/ });
  await dialog.getByRole('button', { name: 'Confirm pin' }).click();
  const pinnedRow = page.getByRole('row').filter({ hasText: 'pinned' }).first();
  await pinnedRow.getByRole('button', { name: 'Queue' }).click();

  // Remove the queued entry and assert both the queue and the restored status.
  const queue = page.getByLabel('Ordered build queue').first();
  const entry = queue.getByRole('listitem').first();
  const name = (await entry.locator('.mono').innerText()).trim();
  await entry.getByRole('button', { name: `Remove ${name} from queue` }).click();
  await expect(queue.getByRole('listitem').filter({ hasText: name })).toHaveCount(0);
  const restored = page.getByRole('row').filter({ hasText: name }).first();
  await expect(restored).toContainText(/selected/i);
});

test('1.15 fetch_more_adds_6_rows', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  const rows = page.locator('tbody tr');
  const initial = await rows.count();
  await page.getByRole('button', { name: 'Fetch more' }).click();
  await expect(rows).toHaveCount(initial + 6, { timeout: 8000 });
});

test('1.18 bulk_actions_work', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  // Pin the row by name — a "first candidate row" locator re-resolves to a
  // different row once this one's status chip flips to Scored.
  const row = page.getByRole('row').filter({ hasText: 'cloudthimble/mist-template' });
  await expect(row).toContainText('Candidate');
  await row.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Bulk Score' }).click();
  await expect(row).toContainText('Scored');
});

test('1.20 command_palette_fuzzy_search', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.keyboard.press('ControlOrMeta+k');
  const palette = page.getByRole('dialog', { name: 'Command palette' });
  await expect(palette).toBeVisible();
  // Fuzzy query: non-contiguous characters must still match "Quota".
  await page.keyboard.type('Qta');
  const opt = palette.getByRole('button', { name: /Quota/ }).first();
  await opt.click();
  await expect(page.getByRole('heading', { name: 'Quota dashboard' })).toBeVisible();
});

test('1.21 export_sourcing_pack', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('button', { name: 'Export pack' }).click();
  await expect(page.getByRole('dialog', { name: 'Export sourcing pack' })).toBeVisible();
});

test('1.23 import_sourcing_pack_validates', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('button', { name: 'Import' }).click();
  const dialog = page.getByRole('dialog', { name: 'Import sourcing pack' });
  await dialog.getByLabel('Raw JSON text').fill('{"schemaVersion":"wrong"}');
  await dialog.getByRole('button', { name: 'Apply import' }).click();
  await expect(dialog.getByRole('alert')).toContainText('schemaVersion field');
});

test('1.28 command_palette_contextual_actions', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  // Select a candidate-status row, then the palette must offer its contextual
  // "Score <name>" action, and choosing it must run the same row handler.
  const row = page.getByRole('row').filter({ hasText: 'cloudthimble/mist-template' });
  await row.getByRole('checkbox').check();
  await page.keyboard.press('ControlOrMeta+k');
  const palette = page.getByRole('dialog', { name: 'Command palette' });
  await expect(palette).toBeVisible();
  await page.keyboard.type('Score');
  await palette.getByRole('button', { name: 'Score cloudthimble/mist-template' }).click();
  await expect(palette).not.toBeVisible();
  await expect(row).toContainText('Scored');
});

test('1.29 export_queue_json_format', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  const row = page.getByRole('row').filter({ hasText: 'copperfield/wren-query' });
  await row.getByRole('button', { name: 'Select' }).click();
  await row.getByRole('button', { name: 'Pin' }).click();
  await page.getByRole('dialog', { name: /Pin copperfield\/wren-query/ }).getByRole('button', { name: 'Confirm pin' }).click();
  await row.getByRole('button', { name: 'Queue' }).click();
  await page.getByRole('button', { name: 'Export pack' }).click();
  const text = await page.getByLabel('Active export text').textContent();
  const pack = JSON.parse(text ?? '');

  expect(Object.keys(pack).sort()).toEqual(['candidates', 'generatedAt', 'queue', 'quota', 'quotaFillPercent', 'schemaVersion', 'timeline'].sort());
  expect(pack.schemaVersion).toBe('sourcing-pack/v1');
  expect(new Date(pack.generatedAt).toISOString()).toBe(pack.generatedAt);
  expect(pack.quotaFillPercent).toBeGreaterThanOrEqual(0);
  expect(pack.quotaFillPercent).toBeLessThanOrEqual(100);
  expect(pack.queue.length).toBeGreaterThan(0);
  pack.queue.forEach((entry, index) => {
    expect(Object.keys(entry).sort()).toEqual(['clusterId', 'commit', 'difficulty', 'name', 'position'].sort());
    expect(entry.position).toBe(index + 1);
    expect(entry.commit).toMatch(/^[0-9a-f]{12}$/);
  });
  pack.candidates.forEach((candidate) => {
    const required = ['category', 'clusterId', 'difficulty', 'language', 'license', 'name', 'stars', 'status'];
    const optional = ['commit', 'notes', 'queuePosition', 'rejectionReason'];
    expect(Object.keys(candidate).every((key) => required.includes(key) || optional.includes(key))).toBe(true);
    expect(required.every((key) => Object.hasOwn(candidate, key))).toBe(true);
    expect(Object.hasOwn(candidate, 'rejectionReason')).toBe(candidate.status === 'rejected');
    expect(Object.hasOwn(candidate, 'commit')).toBe(['pinned', 'queued'].includes(candidate.status));
    expect(Object.hasOwn(candidate, 'queuePosition')).toBe(candidate.status === 'queued');
  });
  pack.quota.forEach((entry) => {
    expect(Object.keys(entry).sort()).toEqual(['achieved', 'band', 'language', 'target'].sort());
    expect(['easy', 'medium', 'hard']).toContain(entry.band);
    expect(entry.achieved).toBeGreaterThanOrEqual(0);
    expect(entry.target).toBeGreaterThan(0);
  });
  pack.timeline.forEach((entry) => {
    const expected = entry.rejectionReason
      ? ['at', 'fromStatus', 'name', 'rejectionReason', 'toStatus']
      : ['at', 'fromStatus', 'name', 'toStatus'];
    expect(Object.keys(entry).sort()).toEqual(expected.sort());
  });
});

test('1.30 export_csv_markdown_format', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  const visibleNames = await page.locator('tbody tr td:nth-child(2) > span.mono.font-semibold').allTextContents();
  await page.getByRole('button', { name: 'Export pack' }).click();
  const dialog = page.getByRole('dialog', { name: 'Export sourcing pack' });
  const queuePack = JSON.parse(await dialog.getByLabel('Active export text').textContent() ?? '');

  await dialog.getByRole('tab', { name: 'Candidates CSV' }).click();
  const csv = await dialog.getByLabel('Active export text').textContent() ?? '';
  const lines = csv.split('\n');
  expect(lines[0]).toBe('name,language,stars,difficulty,category,clusterId,license,status,rejectionReason,commit,notes,queuePosition');
  expect(lines).toHaveLength(visibleNames.length + 1);
  const csvNames = lines.slice(1).map((line) => line.match(/^"((?:[^"]|"")*)"/)?.[1].replaceAll('""', '"'));
  expect(csvNames).toEqual(visibleNames);

  await dialog.getByRole('tab', { name: 'Sourcing report' }).click();
  const report = await dialog.getByLabel('Active export text').textContent() ?? '';
  expect(report).toContain('# Sourcebench sourcing report');
  expect(report).toContain(`Quota fill: **${queuePack.quotaFillPercent}%**`);
  for (const status of ['candidate', 'scored', 'selected', 'rejected', 'pinned', 'queued']) {
    const count = queuePack.candidates.filter((candidate) => candidate.status === status).length;
    expect(report).toContain(`- ${status[0].toUpperCase() + status.slice(1)}: ${count}`);
  }
  for (const cell of queuePack.quota.filter((entry) => entry.achieved < entry.target)) {
    expect(report).toContain(`- ${cell.language} / ${cell.band[0].toUpperCase() + cell.band.slice(1)}: ${cell.achieved} of ${cell.target}`);
  }
  queuePack.queue.forEach((entry) => expect(report).toContain(`${entry.position}. \`${entry.name}\``));
});

test('1.31 import_success_message', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('button', { name: 'Export pack' }).click();
  const exportDialog = page.getByRole('dialog', { name: 'Export sourcing pack' });
  const exported = await exportDialog.getByLabel('Active export text').textContent() ?? '';
  const pack = JSON.parse(exported);
  await exportDialog.getByRole('button', { name: 'Close' }).click();

  await page.getByRole('button', { name: 'Import' }).click();
  const importDialog = page.getByRole('dialog', { name: 'Import sourcing pack' });
  await importDialog.getByLabel('Raw JSON text').fill(exported);
  await importDialog.getByRole('button', { name: 'Apply import' }).click();

  await expect(importDialog).not.toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Complete' }).first()).toContainText(
    `Import applied: ${pack.candidates.length} candidates and ${pack.queue.length} queue entries.`,
  );
});

// ==== AUTOMATABLE WEB_MCP TESTS ====

test('6.3 quota_drilldown_then_select', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('button', { name: 'Quota', exact: true }).click();
  const before = page.getByRole('button', { name: /Python medium: 1 of 2;/ });
  const beforeWidth = await before.locator('.quota-fill').evaluate((element) => getComputedStyle(element).width);
  await before.click();
  await expect(page.getByRole('heading', { name: 'Candidate workbench' })).toBeVisible();
  await expect(page.getByLabel('Active filters')).toContainText('language Python');
  await expect(page.getByLabel('Active filters')).toContainText('difficulty Medium');
  const row = page.getByRole('row').filter({ hasText: 'redmaple/acorn-plan' });
  await expect(row).toContainText('Scored');
  await row.getByRole('button', { name: 'Select' }).click();
  await page.getByRole('button', { name: 'Quota', exact: true }).click();
  const after = page.getByRole('button', { name: /Python medium: 2 of 2;/ });
  const afterWidth = await after.locator('.quota-fill').evaluate((element) => getComputedStyle(element).width);
  expect(Number.parseFloat(afterWidth)).toBeGreaterThan(Number.parseFloat(beforeWidth));
});

test('6.12 import_round_trip_flow', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  const row = page.getByRole('row').filter({ hasText: 'cloudthimble/mist-template' });
  await expect(row).toContainText('Candidate');

  await page.getByRole('button', { name: 'Export pack' }).click();
  const exportDialog = page.getByRole('dialog', { name: 'Export sourcing pack' });
  const exported = await exportDialog.getByLabel('Active export text').textContent() ?? '';
  await exportDialog.getByRole('button', { name: 'Close' }).click();

  await row.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Bulk Score' }).click();
  await expect(row).toContainText('Scored');

  await page.getByRole('button', { name: 'Import' }).click();
  const importDialog = page.getByRole('dialog', { name: 'Import sourcing pack' });
  await importDialog.getByLabel('Raw JSON text').fill(exported);
  await expect(importDialog.getByLabel('Preview of changes this import will apply')).toContainText(
    'cloudthimble/mist-template: scored → candidate',
  );
  await importDialog.getByRole('button', { name: 'Apply import' }).click();

  await expect(importDialog).not.toBeVisible();
  await expect(row).toContainText('Candidate');
  await page.getByRole('button', { name: 'Timeline', exact: true }).click();
  await expect(page.getByText('Sourcing pack import')).toBeVisible();
});

/*
NOT-AUTOMATABLE: 1.3 - UI timeline visual state (timeline records change)
NOT-AUTOMATABLE: 1.5 - drag and drop UI reorder tests (Playwright drag is flaky for this list component)
NOT-AUTOMATABLE: 1.6 - bulk undo tray behavior visual details
NOT-AUTOMATABLE: 1.7 - quota grid visual highlights (fill bars proportional)
NOT-AUTOMATABLE: 1.12 - bulk operations guard blocking UI alerts visual stack
NOT-AUTOMATABLE: 1.14 - animated fetch progress (pending/running/complete)
NOT-AUTOMATABLE: 1.19 - Undo/Redo visual transitions
NOT-AUTOMATABLE: 1.22 - export JSON structural validation (complex dynamic validation)
NOT-AUTOMATABLE: 1.26 - WebMCP form fields bounded
NOT-AUTOMATABLE: 1.27 - drag reorder WebMCP mechanics
NOT-AUTOMATABLE: 3.1 - layout composition and density
NOT-AUTOMATABLE: 3.2 - status and license chips distinctness
NOT-AUTOMATABLE: 3.3 - quota matrix visual system
NOT-AUTOMATABLE: 3.4 - typography hierarchy and monospace
NOT-AUTOMATABLE: 3.5 - component state treatments (hover, focus rings)
NOT-AUTOMATABLE: 3.6 - responsive queue collapse and no overflow
NOT-AUTOMATABLE: 3.9 - panels share surface language
NOT-AUTOMATABLE: 3.10 - real product copy no lorem
NOT-AUTOMATABLE: 15.1 - headings capitalization
NOT-AUTOMATABLE: 15.2 - actions use specific labels
NOT-AUTOMATABLE: 15.3 - errors name problem and fix
NOT-AUTOMATABLE: 15.4 - empty states explain next step
NOT-AUTOMATABLE: 15.5 - status chips exact tokens
NOT-AUTOMATABLE: 15.6 - license chips exact labels
NOT-AUTOMATABLE: 15.7 - rejection reasons exact tokens
NOT-AUTOMATABLE: 15.8 - no lorem ipsum
*/

// Task-owned oracle regressions. The CI runner intentionally pins discovery to
// this canonical entrypoint, so import the focused suite from the authored
// suffix instead of relying on the app-local Playwright config.
import './tests/sourcing.spec.js';
