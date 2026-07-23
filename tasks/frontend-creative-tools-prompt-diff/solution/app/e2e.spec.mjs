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

test('version changes and undo invalidate annotation drafts tied to stale lines', async ({ page }) => {
  const selectFirstTwoBaseLines = () => page.evaluate(() => {
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
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await selectFirstTwoBaseLines();
  await page.getByRole('button', { name: 'Annotate range' }).click();
  await page.getByLabel('bodyMarkdown').fill('STALE PICKER DRAFT');
  await page.keyboard.press('Escape');
  const base = page.getByLabel('Base version');
  const options = await base.locator('option').evaluateAll(nodes => nodes.map(node => node.value));
  const currentBase = await base.inputValue();
  await base.selectOption(options.find(value => value !== currentBase));
  await selectFirstTwoBaseLines();
  await page.getByRole('button', { name: 'Annotate range' }).click();
  await expect(page.getByLabel('bodyMarkdown')).toHaveValue('');
  await page.getByLabel('bodyMarkdown').fill('STALE UNDO DRAFT');
  await page.keyboard.press('Escape');
  await page.getByLabel('Studio modes').getByRole('button', { name: 'Compare branches', exact: true }).click();
  await page.getByRole('button', { name: 'Merge branches' }).click();
  await page.locator('.merge-region').first().getByRole('button', { name: /Choose left/ }).click();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: /^Undo/ }).click();
  await page.getByLabel('Studio modes').getByRole('button', { name: 'Diff', exact: true }).click();
  await selectFirstTwoBaseLines();
  await page.getByRole('button', { name: 'Annotate range' }).click();
  await expect(page.getByLabel('bodyMarkdown')).toHaveValue('');
});

test('restore and import invalidate annotation drafts tied to replaced context', async ({ page }) => {
  const selectFirstTwoBaseLines = () => page.evaluate(() => {
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
  const draftAndClose = async (text) => {
    await selectFirstTwoBaseLines();
    await page.getByRole('button', { name: 'Annotate range' }).click();
    await page.getByLabel('bodyMarkdown').fill(text);
    await page.keyboard.press('Escape');
  };
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await draftAndClose('STALE RESTORE DRAFT');
  await page.getByRole('button', { name: 'Restore to compare' }).click();
  const restoreHeading = await page.getByRole('heading', { name: /Restore source v/ }).textContent();
  const sourceVersion = restoreHeading.match(/v\d+/)[0];
  await page.getByLabel('Change note').fill(`Restore ${sourceVersion} after review`);
  await page.getByRole('button', { name: 'Restore version' }).click();
  await selectFirstTwoBaseLines();
  await page.getByRole('button', { name: 'Annotate range' }).click();
  await expect(page.getByLabel('bodyMarkdown')).toHaveValue('');
  await page.keyboard.press('Escape');

  await draftAndClose('STALE IMPORT DRAFT');
  await page.getByRole('button', { name: 'Export' }).click();
  await page.getByRole('tab', { name: 'Version package' }).click();
  const preview = page.getByLabel('package preview');
  await expect(preview).toBeVisible({ timeout: 3000 });
  const packageJson = await preview.textContent();
  await page.getByRole('button', { name: 'Import' }).click();
  await page.getByLabel('Package JSON').fill(packageJson);
  await page.getByRole('button', { name: 'Import package' }).click();
  await expect(page.getByText(/Imported \d+ versions/).first()).toBeVisible();
  await page.keyboard.press('Escape');
  await selectFirstTwoBaseLines();
  await page.getByRole('button', { name: 'Annotate range' }).click();
  await expect(page.getByLabel('bodyMarkdown')).toHaveValue('');
});
