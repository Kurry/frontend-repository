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

test.describe('task-specific criteria', () => {
  test('1.4 feedback_uses_live_regions', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // 1. Export copy confirmation
    // Click the first task in the list
    await page.click('button[aria-label^="Open task"]');
    await expect(page.locator('text=Trial register')).toBeVisible();

    // Click the first trial in the list
    await page.locator('tr[aria-label^="Open review workspace"]').first().click();
    await expect(page.locator('h2:has-text("Verdict register")').first()).toBeVisible();

    await page.click('text=Export review package');

    // Check export copy
    await page.click('button:has-text("Copy")');
    const copyNotice = page.locator('[role="status"][aria-live="polite"]');
    await expect(copyNotice).toBeVisible();
    await expect(copyNotice).toContainText('copied to clipboard');

    await page.click('button[aria-label="Close export drawer"]');

    // 2. Validation errors (Bulk Apply)
    // The tour might be open; dismiss it first if present (no assertion made either way).
    await page.locator('button:has-text("Dismiss tour")').click().catch(() => {});
    await page.click('button:has-text("Flips only")');
    const checkboxes = page.locator('input[type="checkbox"]');
    await checkboxes.nth(0).click();
    await page.click('text=Apply classification to selected');

    // Check classification error — the bulk-apply form conveys validation
    // failures via a `role="alert"` message (an implicit ARIA live region),
    // which is what the "ARIA live regions or associated field messaging"
    // criterion requires.
    const classificationError = page.locator('p[role="alert"]', { hasText: 'classification:' });
    await expect(classificationError).toBeVisible();

    // Check rationale error
    const rationaleError = page.locator('p[role="alert"]', { hasText: 'rationale:' });
    await expect(rationaleError).toBeVisible();

    // 3. Validation errors (Import)
    await page.click('button:has-text("Import review package")');
    // Clear first to trigger required error
    await page.fill('textarea[name="json"]', '');
    await page.click('button[type="submit"]:has-text("Import review package")');

    const importJsonError = page.locator('p[role="alert"]', { hasText: 'document:' });
    await expect(importJsonError).toBeVisible();

    // also check JSON parse error
    await page.fill('textarea[name="json"]', '{ invalid json }');
    await page.click('button[type="submit"]:has-text("Import review package")');
    await expect(page.locator('[role="alert"]', { hasText: 'Import validation failed' })).toBeVisible();

    // Check successful import. The importer validates taskId/trialId/model/
    // activeLabel/comparedLabels/dimensionRollup against the currently open
    // trial (see src/schemas.js validateReviewPackage), so a fabricated
    // payload with made-up ids is rejected. Build a genuinely valid package
    // by reading the app's own "Export review package" preview (which is
    // always in sync with the open trial) and grafting in one real
    // criterionId read from the verdict register.
    await page.click('button[aria-label="Close import surface"]').catch(() => {});

    const firstCriterionRow = page.locator('[aria-label^="Select criterion "]').first();
    const rowLabel = await firstCriterionRow.getAttribute('aria-label');
    // aria-label is "Select criterion <id> <title>" — the id is the second token.
    const criterionId = rowLabel.split(' ')[2];
    expect(criterionId, 'a real criterionId must be extractable from the verdict register').toBeTruthy();

    await page.click('text=Export review package');
    const exportPreview = page.locator('pre');
    await expect(exportPreview).toBeVisible();
    const exportedPackage = JSON.parse(await exportPreview.textContent());
    await page.click('button[aria-label="Close export drawer"]');

    // evidenceStepIds is optional but, per src/schemas.js adjudicationSchema,
    // must contain at least one entry when present — omit it rather than
    // sending an empty array.
    exportedPackage.adjudications = [
      {
        criterionId,
        classification: 'agent-bug',
        rationale: 'This is a valid rationale for the imported adjudication under test.',
        reviewedAt: new Date().toISOString(),
      },
    ];
    // summaryCounts must agree with the adjudications array (see
    // src/schemas.js validateReviewPackage).
    exportedPackage.summaryCounts = { 'agent-bug': 1, 'rubric-bug': 0, 'scorer-error': 0 };
    const validJson = JSON.stringify(exportedPackage);

    await page.click('button:has-text("Import review package")');
    await page.fill('textarea[name="json"]', validJson);
    await page.click('button[type="submit"]:has-text("Import review package")');

    const globalAnnouncement = page.locator('div[aria-live="polite"] span');
    await expect(globalAnnouncement).toContainText('Imported 1 adjudications successfully');
  });
});
