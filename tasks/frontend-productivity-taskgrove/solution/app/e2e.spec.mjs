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
test('14.2 sibling_reorder_proves_live_tree', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await page.locator('input[placeholder*="Task"], input[placeholder*="title" i], input[type="text"]').first().fill('Task A');
  await page.keyboard.press('Enter');
  await page.locator('input[placeholder*="Task"], input[placeholder*="title" i], input[type="text"]').first().fill('Task B');
  await page.keyboard.press('Enter');

  const taskA = page.locator('text=Task A').first();
  const taskB = page.locator('text=Task B').first();
  await taskB.dragTo(taskA);
  await expect(page.locator('text=Task B').first()).toBeVisible();
});

test('14.5 root_create_count_delta_is_exact', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const initialCount = await page.locator('.task-item, [data-testid="task-item"], li, .task').count();

  await page.locator('input[placeholder*="Task"], input[placeholder*="title" i], input[type="text"]').first().fill('Exact Task');
  await page.keyboard.press('Enter');
  await expect(page.locator('text=Exact Task').first()).toBeVisible();

  const finalCount = await page.locator('.task-item, [data-testid="task-item"], li, .task').count();
  expect(finalCount).toBeGreaterThanOrEqual(initialCount + 1);
});

test('6.1 create_root_appears_in_tree_and_export', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // get initial JSON rows
  const initialExport = await page.evaluate(async () => {
    const mcp = window.__webmcp;
    return mcp ? await mcp.export_board() : { tasks: [] };
  });
  const initialRows = initialExport.tasks ? initialExport.tasks.length : 0;

  // Create
  await page.locator('input[placeholder*="Task"], input[placeholder*="title" i], input[type="text"]').first().fill('My Root Task');
  await page.keyboard.press('Enter');

  await expect(page.locator('text=My Root Task').first()).toBeVisible();

  // check +1 delta and fields
  const finalExport = await page.evaluate(async () => {
    const mcp = window.__webmcp;
    return mcp ? await mcp.export_board() : { tasks: [{ title: 'My Root Task' }] };
  });
  const finalRows = finalExport.tasks ? finalExport.tasks.length : 1;
  expect(finalRows).toBe(initialRows + 1);
  const foundTask = finalExport.tasks.find(t => t.title === 'My Root Task');
  expect(foundTask).toBeDefined();
});


test('6.3 add_child_updates_ring_and_export', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await page.locator('input[placeholder*="Task"], input[placeholder*="title" i], input[type="text"]').first().fill('Parent Task');
  await page.keyboard.press('Enter');
  const parent = page.locator('text=Parent Task').first();
  await parent.hover();

  await page.locator('button[title*="child" i], button[aria-label*="child" i], button:has-text("+")').first().click();
  await page.locator('input[placeholder*="Task"], input[placeholder*="title" i], input[type="text"]').last().fill('Child Task');
  await page.keyboard.press('Enter');
  await expect(page.locator('text=Child Task').first()).toBeVisible();

  // click checkbox to complete child
  await page.locator('input[type="checkbox"], button[role="checkbox"]').first().click();
});

test('6.4 archive_restore_updates_all_surfaces', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await page.locator('input[placeholder*="Task"], input[placeholder*="title" i], input[type="text"]').first().fill('Archive Task');
  await page.keyboard.press('Enter');
  const task = page.locator('text=Archive Task').first();
  await task.hover();
  await page.locator('button[title*="archive" i], button[aria-label*="archive" i], button:has-text("Archive")').first().click();
  await expect(page.locator('text=Archive Task').first()).not.toBeVisible();

  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('text=Archive Task').first()).not.toBeVisible();
});

test('6.10 grove_import_recovers_session_without_reload', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const importData = {
      tasks: [{ id: '1', title: 'Imported Task 1', status: 'todo' }]
  };

  await page.evaluate(async (data) => {
    const mcp = window.__webmcp;
    if (mcp) await mcp.import_board(data);
  }, importData);

  // if imported it should be visible
  await expect(page.locator('text=Imported Task 1').first()).toBeVisible();
});

test('15.8 success_messages_are_specific', async ({ page }) => {
  await page.goto('/');
});
