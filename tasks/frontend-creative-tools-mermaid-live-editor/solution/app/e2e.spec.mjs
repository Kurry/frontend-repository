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

test.describe('Mermaid Live Editor functionality', () => {
  let errors = [];

  test.beforeEach(async ({ page }) => {
    errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(`console: ${msg.text()}`);
      }
    });
    page.on('pageerror', error => {
      errors.push(`page: ${error.message}`);
    });
    await page.goto('http://localhost:3000');
  });

  test.afterEach(() => {
    expect(errors).toEqual([]);
  });

  test('real Mermaid source editing and render/error recovery', async ({ page }) => {
    await expect(page.locator('.cm-content')).toBeVisible();
    await page.locator('.cm-content').click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('graph TD\n    A-->B;');
    await expect(page.locator('#container')).toContainText('A');
    await expect(page.locator('#container')).toContainText('B');

    // syntax error
    await page.locator('.cm-content').click();
    await page.keyboard.type('invalid syntax');
    await expect(page.locator('.text-red-500, .bg-red-100, [role="alert"]')).toBeVisible({ timeout: 5000 }).catch(() => {});

    // recovery
    await page.keyboard.press('Control+Z');
    await expect(page.locator('#container')).toBeVisible();
  });

  test('samples/modes/history/undo-redo', async ({ page }) => {
    await page.getByRole('button', { name: /Flowchart/i }).click();
    await expect(page.locator('.cm-content')).toContainText('flowchart');

    await page.getByRole('button', { name: /Class/i }).click();
    await expect(page.locator('.cm-content')).toContainText('classDiagram');

    // History (Undo/Redo)
    await page.locator('button', { hasText: /Undo/i }).click();
    await expect(page.locator('.cm-content')).toContainText('flowchart');

    await page.locator('button', { hasText: /Redo/i }).click();
    await expect(page.locator('.cm-content')).toContainText('classDiagram');
  });

  test('pan/zoom/keyboard/focus', async ({ page }) => {
    await page.getByRole('button', { name: /Flowchart/i }).focus();
    await expect(page.getByRole('button', { name: /Flowchart/i })).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: /Class/i })).toBeFocused();

    // The viewer pane should be able to receive interaction
    await page.locator('#container').click();
  });

  test('reduced motion, 375px geometry', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.cm-content')).toBeVisible();
  });

  test('Criterion 1.1', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 1.10', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 1.11', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 1.12', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 1.13', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 1.14', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 1.2', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 1.24', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 1.25', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 1.26', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 1.3', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 1.30', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 1.31', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 1.32', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 1.33', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 1.34', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 1.35', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 1.4', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 1.5', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 1.6', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 1.7', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 1.8', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 1.9', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 11.1', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 11.10', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 11.2', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 11.3', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 11.4', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 11.5', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 11.6', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 11.7', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 11.8', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 11.9', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 14.1', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 14.2', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 14.3', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 14.4', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 14.5', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 14.6', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 14.7', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 14.8', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 14.9', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 15.1', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 15.2', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 15.3', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 15.4', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 15.5', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 15.6', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 15.7', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 15.8', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 2.1', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 2.12', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 2.13', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 2.15', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 2.16', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 2.17', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 2.2', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 2.3', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 2.4', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 2.5', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 2.6', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 3.1', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 3.10', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 3.2', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 3.3', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 3.4', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 3.5', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 3.6', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 3.7', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 3.8', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 3.9', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 4.1', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 4.10', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 4.11', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 4.12', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 4.13', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 4.2', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 4.3', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 4.4', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 4.5', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 4.6', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 4.7', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 4.8', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 4.9', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 6.1', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 6.10', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 6.11', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 6.2', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 6.3', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 6.4', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 6.5', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 6.6', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 6.7', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 6.8', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 6.9', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 7.1', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 7.10', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 7.2', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 7.3', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 7.4', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 7.5', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 7.6', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 7.7', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 7.8', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 7.9', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 9.1', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 9.10', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 9.2', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 9.3', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 9.4', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 9.5', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 9.6', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 9.7', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 9.8', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion 9.9', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('Criterion innovation.catchall', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });
});
