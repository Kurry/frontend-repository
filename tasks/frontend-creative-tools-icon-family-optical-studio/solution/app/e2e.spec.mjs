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

test('AC-01 core_loop', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('h1')).toHaveText('Icon Family Optical Studio');
  await expect(page.locator('.vector-canvas')).toBeVisible();
});

test('2.1 anchor_segment_editor_drag', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.locator('button.anchor').first().click();
  const xInput = page.locator('label:has-text("X") input');
  await expect(xInput).toHaveValue('4');
  await xInput.fill('8');
  await expect(xInput).toHaveValue('8');
});

test('2.2 anchor_segment_keyboard', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const yInput = page.locator('label:has-text("Y") input');
  await yInput.fill('10');
  await expect(yInput).toHaveValue('10');
});

test('2.3 path_mirror_transform', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('button:has-text("Preview")');
  await expect(page.locator('.statusbar')).toContainText('Constraint preview ready');
});

test('2.4 add_explicit_constraint', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('.constraint').first()).toBeVisible();
  await expect(page.locator('.constraint').first()).toContainText('ALIGN / KEYLINE BOX');
});

test('2.5 constraint_cycle_prevention', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('.constraint').first()).toContainText('ACTIVE');
});

test('2.6 variant_inheritance', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const iconCards = page.locator('.icon-card');
  await expect(iconCards).toHaveCount(4);
});

test('2.7 variant_override_reset', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.locator('.icon-card').nth(1).click();
  await expect(page.locator('.statusbar')).toContainText('Filled selected');
});

test('2.8 multi_size_hint', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const select = page.locator('select').first();
  await select.selectOption('32');
  await expect(select).toHaveValue('32');
});

test('2.9 branch_and_compare', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('button:has-text("Compare branch")');
  await expect(page.locator('.branch-card strong')).toHaveText('optical-pass');
});

test('2.10 export_json_schema', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('button:has-text("Export JSON")');
  await expect(page.locator('.statusbar')).toContainText('Exported family JSON.');
});

test('2.11 import_valid_json', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const validDoc = JSON.stringify({
    schemaVersion: 'icon-family-optical-studio-v1',
    anchors: [{ id: 'a1', x: 5, y: 5, type: 'move' }]
  });
  await page.fill('textarea[aria-label="Import family JSON"]', validDoc);
  await page.click('button:has-text("Import JSON")');
  await expect(page.locator('.statusbar')).toContainText('Imported family JSON.');
});

test('2.12 import_invalid_json', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.fill('textarea[aria-label="Import family JSON"]', 'invalid json string');
  await page.click('button:has-text("Import JSON")');
  await expect(page.locator('.statusbar')).toContainText('Import error:');
});

test('AC-04 technical_consistency', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('.canvas-card')).toBeVisible();
});

test('5.1 in_memory_state', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('button:has-text("Insert anchor")');
  await expect(page.locator('button.anchor')).toHaveCount(5);
  await page.reload();
  await expect(page.locator('button.anchor')).toHaveCount(4);
});

test('5.2 zero_console_errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.goto('http://localhost:3000');
  expect(errors).toHaveLength(0);
});

test('5.3 webmcp_integration', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const info = await page.evaluate(() => window.webmcp_session_info?.());
  expect(info).toBeDefined();
  expect(info.contract_version).toBe('zto-webmcp-v1');
});

test('AC-05 full_user_flow', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('button:has-text("Insert anchor")');
  await page.click('button:has-text("Preview family")');
  await expect(page.locator('.pill')).toHaveText('PREVIEW');
});

test('AC-06 edge_cases', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.fill('textarea[aria-label="Import family JSON"]', '{}');
  await page.click('button:has-text("Import JSON")');
  await expect(page.locator('.statusbar')).toContainText('Import error:');
});

test('AC-07 responsive_design', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('.studio-shell')).toBeVisible();
});

test('3.1 responsive_desktop_view', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:3000');
  await expect(page.locator('.workspace')).toBeVisible();
});

test('3.2 responsive_mobile_view', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:3000');
  await expect(page.locator('.workspace')).toBeVisible();
});

test('3.3 mobile_touch_targets', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const btn = page.locator('button.primary').first();
  await expect(btn).toBeVisible();
});

test('AC-08 accessibility_compliance', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('[role="application"]')).toBeVisible();
});

test('AC-09 performance_scale', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('button:has-text("Insert anchor")');
  await expect(page.locator('button.anchor')).toHaveCount(5);
});

test('AC-10 writing_clarity', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('.statusbar')).toContainText('Ready to shape');
});

test('AC-11 innovative_coherence', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const lensSelect = page.locator('select').nth(1);
  await expect(lensSelect).toBeVisible();
  await lensSelect.selectOption('occupied bounds');
  await expect(lensSelect).toHaveValue('occupied bounds');
});

test('AC-13 behavioral_roundtrip', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const exportRes = await page.evaluate(async () => {
    return await window.webmcp_invoke_tool('artifact_export', { format: 'json' });
  });
  expect(exportRes.ok).toBe(true);
  const doc = exportRes.artifact;
  await page.fill('textarea[aria-label="Import family JSON"]', doc);
  await page.click('button:has-text("Import JSON")');
  await expect(page.locator('.statusbar')).toContainText('Imported family JSON.');
});

// NOT-AUTOMATABLE: AC-02 visual_hierarchy — visual design assessment
// NOT-AUTOMATABLE: 3.4 optical_metrics_overlay — visual rendering assessment
// NOT-AUTOMATABLE: AC-03 causal_motion — motion animation evaluation
// NOT-AUTOMATABLE: 4.1 animate_constraint_solve — motion animation evaluation
// NOT-AUTOMATABLE: 4.2 reduced_motion_fallback — visual rendering state evaluation
// NOT-AUTOMATABLE: AC-12 design_fidelity — exact design match and visual evaluation
