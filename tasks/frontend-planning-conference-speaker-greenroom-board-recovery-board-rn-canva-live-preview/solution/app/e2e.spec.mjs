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


const errorsFor = (page) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  return errors;
};

test('clean seeded state, visible recovery mutation, and complete undo', async ({ page }) => {
  const errors = errorsFor(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Greenroom Recovery Board' })).toBeVisible();
  await expect(page.getByText('No authored events yet')).toBeVisible();
  await expect(page.locator('.metric').filter({ hasText: 'Total' }).locator('strong')).toHaveText('8');
  await expect(page.locator('.metric').filter({ hasText: 'Recovery' }).locator('strong')).toHaveText('0');
  await expect(page.locator('.metric').filter({ hasText: 'Resolved' }).locator('strong')).toHaveText('0');
  await page.getByRole('button', { name: 'Move to recovery' }).filter({ visible: true }).first().click();
  await expect(page.locator('[data-lane="recovery"]')).toContainText('Designing calm incident rooms');
  await expect(page.locator('.preview-state')).toHaveText('holding');
  await expect(page.locator('.event')).toHaveCount(1);
  await page.getByRole('button', { name: /Undo/ }).click();
  await expect(page.locator('[data-lane="failed"]')).toContainText('Designing calm incident rooms');
  await expect(page.locator('.event')).toHaveCount(0);
  await expect(page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).resolves.toEqual({ local: 0, session: 0 });
  expect(errors).toEqual([]);
});

test('WebMCP uses exact module tool names and linked canonical commands', async ({ page }) => {
  const errors = errorsFor(page);
  await page.goto('/');
  const info = await page.evaluate(() => window.webmcp_session_info());
  expect(info.modules).toEqual(['browse-query-v1', 'entity-collection-v1', 'form-workflow-v1', 'artifact-transfer-v1']);
  const tools = await page.evaluate(() => window.webmcp_list_tools());
  const names = tools.map((tool) => tool.name);
  expect(names).toContain('entity.update');
  expect(names).toContain('artifact.export');
  expect(names).toContain('form.validate');
  const moved = await page.evaluate(() => window.webmcp_invoke_tool('entity.update', { id: 'slot-maya', action: 'move_to_recovery' }));
  expect(moved).toMatchObject({ ok: true, lane: 'recovery', previewState: 'holding' });
  const repaired = await page.evaluate(() => window.webmcp_invoke_tool('entity.update', { id: 'slot-maya', action: 'repair', fields: { recoveryStartMinute: 600, repairNote: 'Restaged the A/V handoff with a verified cue.' } }));
  expect(repaired).toMatchObject({ ok: true, status: 'resolved', previewState: 'live' });
  const queried = await page.evaluate(() => window.webmcp_invoke_tool('entity.select', { id: 'slot-maya' }));
  expect(queried.record.repairNote).toContain('verified cue');
  expect(queried.derived.resolvedCount).toBe(1);
  expect(queried.history.map((event) => event.type)).toEqual(['move-to-recovery', 'repair']);
  await expect(page.locator('.preview-state')).toHaveText('live');
  expect(errors).toEqual([]);
});

test('export-clear-import round trip is atomic and semantic', async ({ page }) => {
  const errors = errorsFor(page);
  await page.goto('/');
  await page.evaluate(() => window.webmcp_invoke_tool('entity.update', { id: 'slot-maya', action: 'move_to_recovery' }));
  await page.evaluate(() => window.webmcp_invoke_tool('entity.update', { id: 'slot-maya', action: 'repair', fields: { recoveryStartMinute: 600, repairNote: 'Verified the repaired downstream stage cue.' } }));
  await page.getByRole('button', { name: 'Preview artifact' }).click();
  const exported = await page.locator('#export-preview').textContent();
  const before = JSON.parse(exported);
  await page.getByRole('button', { name: 'Close artifact preview' }).click();
  await page.locator('[data-confirm-clear]').click();
  await page.getByRole('button', { name: 'Clear session' }).click();
  await expect(page.locator('.metric').filter({ hasText: 'Total' }).locator('strong')).toHaveText('0');
  await page.getByRole('button', { name: 'Import JSON' }).first().click();
  await page.locator('#import-text').fill(exported);
  await page.getByRole('button', { name: 'Validate and import' }).click();
  await expect(page.locator('.metric').filter({ hasText: 'Total' }).locator('strong')).toHaveText('8');
  const queried = await page.evaluate(() => window.webmcp_invoke_tool('entity.select', { id: 'slot-maya' }));
  expect(queried.record.status).toBe('resolved');
  await page.getByRole('button', { name: 'Preview artifact' }).click();
  const after = JSON.parse(await page.locator('#export-preview').textContent());
  delete before.exportedAt;
  delete after.exportedAt;
  expect(after).toEqual(before);
  expect(errors).toEqual([]);
});

test('malformed import reports all diagnostics and leaves state unchanged', async ({ page }) => {
  const errors = errorsFor(page);
  await page.goto('/');
  const before = await page.evaluate(() => window.webmcp_invoke_tool('entity.select', { id: 'slot-maya' }));
  await page.getByRole('button', { name: 'Import JSON' }).first().click();
  await page.locator('#import-text').fill(JSON.stringify({ schemaVersion: 'wrong', exportedAt: 'bad', records: [{ id: 'slot-maya' }], derived: {}, history: [], extra: true }));
  await page.getByRole('button', { name: 'Validate and import' }).click();
  await expect(page.locator('#import-report')).toContainText('Import rejected');
  const diagnostics = await page.locator('#import-report li').count();
  expect(diagnostics).toBeGreaterThan(8);
  await page.getByRole('button', { name: 'Close import dialog' }).click();
  const after = await page.evaluate(() => window.webmcp_invoke_tool('entity.select', { id: 'slot-maya' }));
  expect(after.record).toEqual(before.record);
  expect(after.history).toEqual(before.history);
  expect(errors).toEqual([]);
});

test('mobile three-step path has no overflow and repairs through visible controls', async ({ page }) => {
  const errors = errorsFor(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await page.getByRole('tab', { name: /Recover/ }).click();
  await page.locator('[data-recover="slot-maya"]').click();
  await expect(page.locator('.mobile-repair')).toBeVisible();
  await page.locator('[data-repair-form="mobile"] input[name="startMinute"]').fill('600');
  await page.locator('[data-repair-form="mobile"] textarea[name="repairNote"]').fill('Restaged the A/V handoff and verified the confidence cue.');
  await page.locator('[data-repair-form="mobile"]').getByRole('button', { name: 'Apply repair' }).click();
  await expect(page.getByRole('tab', { name: /Preview/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.inspector-surface.mobile-active .preview-state')).toHaveText('live');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
