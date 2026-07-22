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

test.describe('AB Experiments user paths', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
  });

  test('library starts with the five seeded experiments', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Experiment Library' })).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(5);
    await expect(page.getByRole('button', { name: 'Onboarding assistant — confidence and warmth' })).toBeVisible();
  });

  test('search and status filters narrow the same library table', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Search experiments' }).fill('Safety response');
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Safety response formatting' })).toBeVisible();
    await page.getByRole('textbox', { name: 'Search experiments' }).fill('');
    await page.getByRole('button', { name: 'Pending', exact: true }).click();
    await expect(page.locator('tbody tr')).toHaveCount(2);
  });

  test('new experiment modal exposes labelled API-shaped fields', async ({ page }) => {
    await page.getByRole('button', { name: 'New Experiment' }).click();
    const dialog = page.getByRole('dialog', { name: 'ExperimentUpsert · API-shaped design' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel('Experiment name')).toBeVisible();
    await expect(dialog.getByLabel('Hypothesis')).toBeVisible();
    await expect(dialog.getByLabel('Success metric')).toBeVisible();
    await expect(dialog.getByText('Traffic allocation', { exact: true })).toBeVisible();
  });

  test('valid experiment creation adds exactly one pending row', async ({ page }) => {
    const before = await page.locator('tbody tr').count();
    await page.getByRole('button', { name: 'New Experiment' }).click();
    const dialog = page.getByRole('dialog', { name: 'ExperimentUpsert · API-shaped design' });
    await dialog.getByLabel('Experiment name').fill('CI allocation study');
    await dialog.getByLabel('Hypothesis').fill('Evidence prompts will improve factual accuracy for the seeded evaluation set.');
    await dialog.getByRole('button', { name: 'Create Experiment' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('tbody tr')).toHaveCount(before + 1);
    await expect(page.getByRole('button', { name: 'CI allocation study' })).toBeVisible();
  });

  test('preview compares every configured variant for one shared input', async ({ page }) => {
    await page.getByRole('button', { name: 'New Experiment' }).click();
    const dialog = page.getByRole('dialog', { name: 'ExperimentUpsert · API-shaped design' });
    await dialog.getByRole('button', { name: 'Preview playground' }).click();
    await dialog.getByLabel('Shared test input').fill('Explain confidence intervals.');
    await dialog.getByRole('button', { name: 'Run preview' }).click();
    await expect(dialog.locator('.preview-column')).toHaveCount(2);
    await expect(dialog.locator('.preview-column p').filter({ hasText: 'Explain confidence intervals.' })).toHaveCount(2);
  });

  test('criteria view exposes the seeded reusable judges', async ({ page }) => {
    await page.getByRole('button', { name: 'Criteria' }).click();
    await expect(page.getByRole('heading', { name: 'Scoring Criteria' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Factual accuracy' })).toBeVisible();
    await expect(page.locator('.criterion-card')).toHaveCount(4);
  });

  test('completed experiment opens coherent result views and export', async ({ page }) => {
    await page.getByRole('button', { name: 'Onboarding assistant — confidence and warmth' }).click();
    const panel = page.getByRole('complementary', { name: /Results for Onboarding assistant/ });
    await expect(panel.getByText('Mean score')).toBeVisible();
    await expect(panel.getByRole('tab', { name: 'Results' })).toBeVisible();
    await panel.getByRole('tab', { name: 'Monitoring' }).click();
    await expect(panel.getByRole('heading', { name: 'Sequential monitoring' })).toBeVisible();
    await panel.getByRole('button', { name: 'Export report' }).click();
    await expect(page.getByRole('dialog', { name: /portable result pack/ })).toBeVisible();
    await expect(page.getByLabel('Experiment Report JSON preview')).toContainText('generatedAt');
  });

  test('pending experiment starts a visible per-variant run', async ({ page }) => {
    const row = page.getByRole('row', { name: /Launch copy brevity/ });
    await row.getByRole('button', { name: 'Run Experiment' }).click();
    const panel = page.getByRole('complementary', { name: /Results for Launch copy brevity/ });
    await expect(panel.getByText('Evaluation in progress')).toBeVisible();
    await expect(panel.getByText(/A progress|A progress/i)).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Pause run' })).toBeVisible();
  });
});
