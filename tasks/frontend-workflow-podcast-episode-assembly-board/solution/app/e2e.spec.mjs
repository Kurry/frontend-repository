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

const enterWorkspace = async (page, width = 1280, height = 900) => {
  await page.setViewportSize({ width, height });
  await page.goto(BASE);
  await page.getByRole('button', { name: 'Skip Tour' }).click();
};

test('4.4 te_4 WebMCP covers every podcast workflow domain', async ({ page }) => {
  await enterWorkspace(page);
  const tools = await listTools(page);
  const surface = tools.map(tool => `${tool.name} ${tool.description}`).join('\n').toLowerCase();
  for (const domain of ['clip', 'timeline', 'transcript', 'citation', 'chapter', 'mix', 'rights', 'approval', 'branch', 'render', 'history', 'transfer', 'reset']) {
    expect(surface, `WebMCP surface documents ${domain}`).toContain(domain);
  }

  expect((await invokeTool(page, 'editor.switch_mode', { mode: 'transcript' })).ok).toBe(true);
  expect((await invokeTool(page, 'editor.add', { object_type: 'branch-cut', name: 'te4-fork' })).ok).toBe(true);
  expect((await invokeTool(page, 'editor.preview')).history.length).toBeGreaterThan(0);
  expect((await invokeTool(page, 'artifact.export', { format: 'canonical-json' })).ok).toBe(true);
  expect((await invokeTool(page, 'session.restart')).ok).toBe(true);
});

test('4.5 te_5 mobile reflow retains source, edit, lineage, approval, render, and export actions', async ({ page }) => {
  await enterWorkspace(page, 375, 812);
  await expect(page.getByRole('button', { name: 'Sources' })).toBeVisible();
  await page.getByRole('button', { name: 'Sources' }).click();
  await expect(page.getByRole('button', { name: 'Insert', exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Timeline' }).click();
  await expect(page.getByLabel('Timeline mini-map')).toBeVisible();

  await page.getByTitle(/Select Clip 1/).first().focus();
  await page.keyboard.press('Enter');
  const mobileInspector = page.getByRole('region', { name: 'Selected clip editor' }).last();
  await expect(mobileInspector).toBeVisible();
  await expect(mobileInspector.getByLabel('Episode start (ms)')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Approval and render stepper' }).last()).toBeVisible();

  await page.getByRole('button', { name: 'Chapters' }).click();
  await expect(page.getByText(/Narrative Outline|Chapter Lineage/).first()).toBeVisible();
  await page.getByRole('button', { name: 'Render' }).first().click();
  await expect(page.getByText('Render Pipeline')).toBeVisible();
  await page.getByRole('button', { name: 'Export' }).click();
  await expect(page.getByRole('button', { name: /Export All/ })).toBeVisible();
});

test('4.6 te_6 keyboard-only editing, navigation, approval review, render, and export', async ({ page }) => {
  await enterWorkspace(page);
  await page.getByTitle(/Select Clip 1/).first().focus();
  await page.keyboard.press('Enter');
  const start = page.locator('#desktop-f-start');
  const before = Number(await start.inputValue());
  await page.keyboard.press('ArrowRight');
  await expect(start).toHaveValue(String(before + 10));
  const countBeforeSplit = (await invokeTool(page, 'editor.preview')).instances;
  await page.keyboard.press('s');
  expect((await invokeTool(page, 'editor.preview')).instances).toBe(countBeforeSplit + 1);

  await page.keyboard.press('Alt+6');
  await expect(page.getByText('Rights Review').first()).toBeVisible();
  await page.keyboard.press('Alt+8');
  await expect(page.getByText('Render Pipeline')).toBeVisible();
  await page.keyboard.press('Alt+9');
  await expect(page.getByRole('button', { name: /Export All/ })).toBeVisible();
});

test('4.7 te_7 UI and WebMCP share ids, milliseconds, checksums, history, and artifact files', async ({ page }) => {
  await enterWorkspace(page);
  const selected = await invokeTool(page, 'entity.select', { id: 'inst-1' });
  expect(selected.ok).toBe(true);
  const changed = await invokeTool(page, 'editor.update_property', {
    object_type: 'timeline-instance', id: 'inst-1', property: 'start-ms', value: 1230,
  });
  expect(changed.ok).toBe(true);
  await expect(page.locator('#desktop-f-start')).toHaveValue('1230');

  const preview = await invokeTool(page, 'editor.preview');
  expect(preview.ok).toBe(true);
  expect(preview.checksum).toMatch(/^[0-9a-f]{8}$/);
  expect(preview.history.some(entry => entry.detail.includes('inst-1'))).toBe(true);

  const exported = await invokeTool(page, 'artifact.export', { format: 'timeline-svg' });
  expect(exported.ok).toBe(true);
  expect(exported.formats).toEqual(expect.objectContaining({
    'canonical-json': expect.any(Number),
    'edl-csv': expect.any(Number),
    'transcript-csv': expect.any(Number),
    webvtt: expect.any(Number),
    'rss-xml': expect.any(Number),
    'show-notes-markdown': expect.any(Number),
    'timeline-svg': expect.any(Number),
  }));
  await expect(page.getByRole('button', { name: /Re-Export/ })).toBeVisible();
});
