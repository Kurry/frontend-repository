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

import { test, expect } from '@playwright/test';

test('6.1 create_flow_updates_all_surfaces and 14.5 new_note_count_delta_exact', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('app-sidebar')).toBeVisible();

  const getNoteCount = async () => page.locator('.notes-list-wrapper > *:not(.empty-state)').count();
  const initialCount = await getNoteCount();

  await page.keyboard.press('Alt+n');

  await expect(async () => {
      expect(await getNoteCount()).toBe(initialCount + 1);
  }).toPass();

  const focused = page.locator(':focus');
  await expect(focused).toBeVisible();
});

test('6.3 edit_flow_updates_related_displays', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Alt+n');

  const editor = page.locator('.ProseMirror, [contenteditable="true"]').first();
  await expect(editor).toBeVisible();

  await editor.fill('Edit flow test content');

  const firstNoteInSidebar = page.locator('.notes-list-wrapper > *:not(.empty-state)').first();
  await expect(firstNoteInSidebar).toContainText('Edit flow test content');
});

test('6.4 delete_flow_updates_all_surfaces', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('app-sidebar')).toBeVisible();
  await page.keyboard.press('Alt+n');

  const getNoteCount = async () => page.locator('.notes-list-wrapper > *:not(.empty-state)').count();

  await expect(async () => {
    expect(await getNoteCount()).toBeGreaterThan(0);
  }).toPass();

  const countAfterCreate = await getNoteCount();

  const deleteBtn = page.getByRole('button', { name: /delete/i }).first();
  await deleteBtn.click();

  const confirmDialog = page.getByRole('dialog', { name: /confirm delete note/i });
  await expect(confirmDialog).toBeVisible();
  await confirmDialog.getByRole('button', { name: /^delete note$/i }).click();

  await expect(async () => {
      expect(await getNoteCount()).toBe(countAfterCreate - 1);
  }).toPass();
});

test('6.8 focus_mode_hides_and_restores_sidebar', async ({ page }) => {
  await page.goto('/');
  const sidebar = page.locator('app-sidebar');
  await expect(sidebar).toBeVisible();

  await page.keyboard.press('Control+Shift+F');

  await expect(async () => {
      const display = await sidebar.evaluate(el => getComputedStyle(el).display);
      const isHiddenClass = await sidebar.evaluate(el => el.classList.contains('hidden') || el.style.display === 'none');
      expect(display === 'none' || isHiddenClass || await sidebar.isHidden()).toBeTruthy();
  }).toPass();

  await page.keyboard.press('Escape');

  await expect(async () => {
      const display = await sidebar.evaluate(el => getComputedStyle(el).display);
      expect(display !== 'none').toBeTruthy();
  }).toPass();
});

test('6.11 artifact_end_state_export_import and 14.9 workspace_export_import_pipeline', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Alt+n');

  await page.waitForTimeout(100);
  await page.keyboard.type('Testing export import pipeline');

  const editor = page.locator('.ProseMirror, [contenteditable="true"]').first();
  await expect(editor).toBeVisible();

  const imageTag = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" alt="test image">';
  const imageObj = {
      id: 'img-1',
      filename: 'test.png',
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
  };

  const exportWsBtn = page.getByRole('button', { name: /export workspace/i });
  await exportWsBtn.click();

  const jsonTextarea = page.locator('textarea, pre').first();
  const wsJson = await jsonTextarea.inputValue().catch(async () => await jsonTextarea.textContent());

  await page.keyboard.press('Escape');

  let parsed = JSON.parse(wsJson);
  parsed.notes[0].bodyHtml += imageTag;
  parsed.notes[0].images = [imageObj];
  parsed.notes[0].createdAt = new Date(parsed.notes[0].createdAt).toISOString();
  parsed.notes[0].updatedAt = new Date(parsed.notes[0].updatedAt).toISOString();
  parsed.notes[0].title = 'Modified via import';

  const modifiedJson = JSON.stringify(parsed);

  const importWsBtn = page.getByRole('button', { name: /import workspace/i });
  await importWsBtn.click();

  const importTextarea = page.locator('textarea').filter({ state: 'visible' }).first();
  await importTextarea.fill(modifiedJson);

  const confirmImport = page.getByRole('button', { name: /import/i }).last();
  await expect(confirmImport).toBeEnabled();
  await confirmImport.click();

  await expect(async () => {
      const firstNoteInSidebar = page.locator('.notes-list-wrapper > *:not(.empty-state)').first();
      expect(await firstNoteInSidebar.textContent()).toContain('Modified via import');
  }).toPass({ timeout: 5000 });
});

test('4.11 import_rejects_bad_workspace_json', async ({ page }) => {
  await page.goto('/');

  const getNoteCount = async () => page.locator('.notes-list-wrapper > *:not(.empty-state)').count();
  const startCount = await getNoteCount();

  const importWsBtn = page.getByRole('button', { name: /import workspace/i });
  await importWsBtn.click();

  const importTextarea = page.locator('textarea').filter({ state: 'visible' }).first();
  await importTextarea.fill('{"schemaVersion":"bad","notes":[{}]}');

  const confirmImport = page.getByRole('button', { name: /import/i }).last();
  if (await confirmImport.isEnabled()) {
      await confirmImport.click();
  }

  const errorMsg = page.locator('text=/invalid|error|schema|fail/i').first();
  await expect(errorMsg).toBeVisible();

  await page.keyboard.press('Escape');

  await expect(async () => {
      expect(await getNoteCount()).toBe(startCount);
  }).toPass();
});
