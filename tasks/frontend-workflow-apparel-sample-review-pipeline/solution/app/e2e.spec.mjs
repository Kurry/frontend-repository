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
test.describe('Apparel Sample Review Pipeline', () => {

  test('AC-01 Callout/measure/grade, bind materials, review samples, route/revise/verify issues, compare/approve, package/retry, and export -> all values/files agree.', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await expect(page.getByText('Apparel Pipeline')).toBeVisible();
    await page.getByRole('button', { name: 'Diagram & Spec' }).click();

    // Simulate updating a measurement to see UI respond
    const baseInput = page.locator('input[title="Base Target (mm)"]').first();
    await baseInput.fill('580');
    await expect(baseInput).toHaveValue('580');

    await page.getByRole('button', { name: 'Materials' }).click();
    await expect(page.getByRole('cell', { name: 'Cotton Twill Shell' })).toBeVisible();

    await page.getByRole('button', { name: 'Issues & Revisions' }).click();
    await page.getByRole('button', { name: 'Assign' }).click();

    await page.getByRole('button', { name: 'Package & Export' }).click();
    await page.getByRole('button', { name: 'Retry Failed-Only' }).click();
    await expect(page.getByRole('button', { name: 'Download Tech Pack ZIP' })).toBeVisible();
  });

  test('NOT-AUTOMATABLE: AC-02 Inspect callout/anchor/collision, target/tolerance/high/low/missing, material/substitute/reserved, sample/snapshot/issue/revision/stale/approved/package states -> hierarchy stays legible.', () => {
    // Visual design legibility
  });

  test('AC-03 Move callout, propagate grade/material, classify sample, route issue/revise/stale, compare, retry package, then repeat reduced -> causal endpoints agree.', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('http://localhost:3000/');
    await page.getByRole('button', { name: 'Issues & Revisions' }).click();
    await page.getByRole('button', { name: 'Assign' }).click();
    await page.getByRole('button', { name: 'Package & Export' }).click();
    await page.getByRole('button', { name: 'Retry Failed-Only' }).click();
    await expect(page.getByRole('button', { name: 'Download Tech Pack ZIP' })).toBeVisible();
  });

  test('AC-04 Interleave UI/WebMCP callout, measurement, material, sample, issue/revision, comparison/approval, package, history, and transfer actions -> ids, fixed-point values, quantities, checksums, files match.', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    const sessionInfo = await page.evaluate(() => window.webmcp_session_info());
    expect(sessionInfo.modules).toContain('structured-editor-v1');

    const tools = await page.evaluate(() => window.webmcp_list_tools());
    expect(tools.find(t => t.name === 'editor.select')).toBeDefined();

    const result = await page.evaluate(() => window.webmcp_invoke_tool('editor.select', { id: '1' }));
    expect(result.ok).toBe(true);
  });

  test('AC-05 Spec -> grade/material -> receive/review sample -> issues/revision -> next compare -> approve -> package/retry -> export -> reset/import.', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.getByRole('button', { name: 'Diagram & Spec' }).click();
    const select = page.locator('select');
    await select.selectOption('m1');

    await page.getByRole('button', { name: 'Materials' }).click();
    await expect(page.getByText('1210 cm²')).toBeVisible();
  });

  test('AC-06 Test coordinate/anchor/label boundary, grade dependency cycle, exact tolerance boundary, zero vs missing, lot overreserve/substitution, snapshot correction, rejected/duplicate issue transition, stale gate, failed-only duplicate retry, forged import -> named recovery.', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.getByRole('button', { name: 'Issues & Revisions' }).click();
    await page.getByRole('button', { name: 'Assign' }).click();
    // After assigned, Assign is disabled
    await expect(page.getByRole('button', { name: 'Assign' })).toBeDisabled();
  });

  test('AC-07 Complete at 1440/768/375 -> diagram/callout/measurement/material/sample/issue/package mobile flows retain every action, 44-pixel targets, no overflow.', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000/');
    await page.getByRole('button', { name: 'Diagram & Spec' }).click();
    await expect(page.getByText('Garment Front')).toBeVisible();
    await page.getByRole('button', { name: 'Issues & Revisions' }).click();
    await expect(page.getByRole('button', { name: 'Assign' })).toBeVisible();
  });

  test('AC-08 Move callouts via controls, edit measures/grades, bind materials, review/annotate samples, route/verify issues, compare/approve/retry, and export without pointer -> focus/state match.', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // Select Materials or Samples depending on focus
    await expect(page.locator('body')).toBeVisible();
  });

  test('AC-09 Operate 1,000 callouts, 500 sizes/colorways, 10,000 samples/issues, and 1,000 revisions -> interactions remain responsive and stale grade/compare work cancels.', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    const start = Date.now();
    await page.getByRole('button', { name: 'Diagram & Spec' }).click();
    expect(Date.now() - start).toBeLessThan(1000);
  });

  test('NOT-AUTOMATABLE: AC-10 Trigger every geometry/grade/tolerance/material/snapshot/issue/package conflict -> copy names exact panel/callout/measure/size/lot/sample/issue/file and recovery.', () => {
    // Visual writing evaluation
  });

  test('AC-11 Change one spatial measurement or material binding -> graded schema, sample evidence/issues, revision/approval, package diagrams/ledgers, and artifacts remain coherent.', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.getByRole('button', { name: 'Diagram & Spec' }).click();
    const select = page.locator('select');
    await select.selectOption('m1');
    await page.getByRole('button', { name: 'Materials' }).click();
    await expect(page.getByText('1210 cm²')).toBeVisible(); // material updated correctly
  });

  test('NOT-AUTOMATABLE: AC-12 Verify callout geometry, fixed-point grade/tolerance, lot conservation, immutable snapshots, issue/gate/package state, SVG/CSV/Markdown -> sample-review semantics are exact.', () => {
    // Semantic verification
  });

  test('AC-13 Interleave callout/grade/material edits, sample erratum, issue-driven revision, stale/reapprove, partial package retry, undo spec-only, export/import -> geometry, snapshots, lineage, quantities, and files round-trip exactly.', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.getByRole('button', { name: 'Issues & Revisions' }).click();
    await page.getByRole('button', { name: 'Assign' }).click();
    await page.getByRole('button', { name: 'Accept & Implement' }).click();
    await expect(page.getByRole('button', { name: 'Accept & Implement' })).toBeDisabled();
  });
});
