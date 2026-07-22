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
    await page.goto(BASE);
    // Load fully first: animations kicked off during hydration or by
    // late-arriving resources must fall inside the observation window, so the
    // sampling loop only starts once the page is settled.
    await page.waitForLoadState('networkidle');
    // Precondition sanity check: the emulation actually reaches the app.
    const reduced = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
    expect(reduced, 'precondition: app sees prefers-reduced-motion: reduce').toBe(true);
    await page.waitForTimeout(250); // small settle after idle
    // Observe every frame across a 1.5s window and assert on what was seen.
    // Finished, idle, or paused effects and durations <=1ms are allowed; any
    // meaningfully timed RUNNING effect at any sample is a reduced-motion
    // failure. Apps with zero animations pass vacuously (the render/console
    // test still gates them).
    const offenders = await page.evaluate(async () => {
      const seen = new Map();
      const deadline = performance.now() + 1500;
      while (performance.now() < deadline) {
        for (const a of document.getAnimations({ subtree: true })) {
          if (a.playState !== 'running') continue;
          let timing = {};
          try { timing = a.effect?.getComputedTiming?.() ?? {}; } catch { /* detached */ }
          const dur = typeof timing.duration === 'number' ? timing.duration : 0;
          if (dur <= 1) continue; // fill-only / effectively instant
          const offender = {
            kind: a.constructor?.name ?? 'Animation',
            name: a.animationName ?? a.transitionProperty ?? a.id ?? '(anonymous)',
            duration: dur,
            iterations: timing.iterations ?? 1,
          };
          seen.set(JSON.stringify(offender), offender);
        }
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      return [...seen.values()];
    });
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

test('interleaved annotation draft retains its line anchor and text', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => {
    const lines = [...document.querySelectorAll('.split-diff .diff-line[data-side="base"]')];
    const first = lines[0]?.querySelector('.line-code');
    const second = lines[1]?.querySelector('.line-code');
    if (!first || !second) throw new Error('Expected two visible base lines');
    const range = document.createRange();
    range.setStart(first, 0);
    range.setEnd(second, second.childNodes.length);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    first.closest('.diff-scroll').dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  });
  await page.getByRole('button', { name: 'Annotate range' }).click();
  await page.getByLabel('bodyMarkdown').fill('INTERLEAVED ANNOTATION SENTINEL');
  await page.keyboard.press('Escape');
  await page.getByLabel('Studio modes').getByRole('button', { name: 'Graph', exact: true }).click();
  await page.getByLabel('Studio modes').getByRole('button', { name: 'Diff', exact: true }).click();
  await expect(page.getByText('Lines 1–2 selected')).toBeVisible();
  await page.getByLabel('Studio modes').getByRole('button', { name: 'Compare branches', exact: true }).click();
  await page.getByRole('button', { name: 'Merge branches' }).click();
  await page.getByRole('button', { name: 'Use all left' }).click();
  await page.getByRole('button', { name: 'Complete merge' }).click();
  await page.getByRole('dialog', { name: 'Confirm merge' }).getByRole('button', { name: 'Create merge version' }).click();
  await expect(page.getByText('Lines 1–2 selected')).toBeVisible();
  await page.getByRole('button', { name: 'Annotate range' }).click();
  await expect(page.getByLabel('bodyMarkdown')).toHaveValue('INTERLEAVED ANNOTATION SENTINEL');
  await page.getByRole('button', { name: 'Post annotation' }).click();
  await expect(page.getByLabel('Annotation thread on lines 1–2')).toContainText('INTERLEAVED ANNOTATION SENTINEL');
});
