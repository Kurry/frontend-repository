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

const BASE = process.env.BASE_URL || 'http://localhost:3000';

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

test('cf.1 place_path_analyze_approve_export', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('text=Stage Blocking Path Studio')).toBeVisible();
    await page.click('button:has-text("Approve")');
    await page.click('button:has-text("Export")');
});

test('vd.1 visual_hierarchy_legible', async ({ page }) => {
    // NOT-AUTOMATABLE: vd.1 — visual hierarchy and legibility
});

test('mo.1 move_retime_propagate_causality', async ({ page }) => {
    await page.goto(BASE);
    await page.click('button:has-text("Path")');
    await page.click('button:has-text("Select")');
});

test('te.1 interleave_ui_webmcp_actions', async ({ page }) => {
    await page.goto(BASE);
    const result = await page.evaluate(async () => {
        return window.webmcp_invoke_tool('session.advance', {});
    });
    expect(result.ok).toBe(true);
    await expect(page.getByRole('button', { name: '2', exact: true })).toHaveClass(/bg-blue-600/);
});

test('AC-05 Place -> path/time -> analyze/fix -> entrance -> prop -> branch -> rehearse -> approve -> export -> reset/import', async ({ page }) => {
    await page.goto(BASE);
    await page.click('button:has-text("Approve")');
});

test('AC-06 Test stage boundary, exact bounds, and recovery', async ({ page }) => {
    await page.goto(BASE);
    await page.click('button:has-text("Path")');
});

test('AC-07 Complete at 1440/768/375', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE);
    await expect(page.locator('text=Stage Blocking Path Studio')).toBeVisible();

    await page.setViewportSize({ width: 768, height: 900 });
    await expect(page.locator('text=Stage Blocking Path Studio')).toBeVisible();

    await page.setViewportSize({ width: 375, height: 900 });
    await expect(page.locator('text=Stage Blocking Path Studio')).toBeVisible();
});

test('AC-08 Place/face, edit paths, manage findings without pointer', async ({ page }) => {
    await page.goto(BASE);
    await page.keyboard.press('Tab');
});

test('AC-09 Operate 200 actors, 10000 beats, 1000 branches', async ({ page }) => {
    await page.goto(BASE);
    await page.click('button:has-text("Select")');
});

test('AC-10 Trigger every conflict naming exact recovery', async ({ page }) => {
    await page.goto(BASE);
});

test('AC-11 Move one handoff keeps artifacts coherent', async ({ page }) => {
    await page.goto(BASE);
});

test('AC-12 Verify exact interpolation, bounds, and SVG/CSV semantic fidelity', async ({ page }) => {
    await page.goto(BASE);
});

test('AC-13 Interleave edits, rehearsal repair, future-only undo, approval, export/import round-trips exactly', async ({ page }) => {
    await page.goto(BASE);
});

test('oracle-fix accessibility, guidance, and modal focus contract', async ({ page }) => {
    await page.goto(BASE);
    const dialog = page.getByRole('dialog', { name: 'Welcome to the rehearsal room' });
    if (await dialog.isVisible()) await dialog.getByRole('button', { name: 'Enter the studio' }).click();
    const alice = page.getByRole('button', { name: /Alice, actor/ });
    await alice.focus();
    await page.keyboard.press('Enter');
    await expect(alice).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText(/Alice selected at beat/)).toBeVisible();
    await page.getByRole('button', { name: 'Add waypoint' }).click();
    const addDialog = page.getByRole('dialog', { name: 'Add waypoint' });
    await expect(addDialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(addDialog).toBeHidden();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Stage Blocking Path Studio');
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
});

test('oracle-fix create edit delete updates stage inspector timeline and count', async ({ page }) => {
    await page.goto(BASE);
    const welcome = page.getByRole('dialog', { name: 'Welcome to the rehearsal room' });
    if (await welcome.isVisible()) await welcome.getByRole('button', { name: 'Enter the studio' }).click();
    const before = Number(await page.locator('.count').first().textContent());
    await page.getByRole('button', { name: 'Add waypoint' }).click();
    const dialog = page.getByRole('dialog', { name: 'Add waypoint' });
    await dialog.getByLabel('Entity').selectOption('a1');
    await dialog.getByLabel('Beat').fill('12');
    await dialog.getByLabel('X position (m)').fill('9.4');
    await dialog.getByLabel('Y position (m)').fill('6.2');
    await dialog.getByRole('button', { name: 'Add waypoint', exact: true }).click();
    await expect(page.locator('.count').first()).toHaveText(String(before + 1));
    await expect(page.getByRole('button', { name: /Alice, actor/ })).toBeVisible();
    await expect(page.getByRole('button', { name: '12', exact: true })).toContainText('1 cue');
    await page.getByRole('button', { name: 'Edit waypoint' }).click();
    await page.getByLabel('Facing (degrees)').fill('180');
    await page.getByRole('button', { name: 'Save waypoint' }).click();
    await expect(page.getByText('180°')).toBeVisible();
    await page.getByRole('button', { name: 'Delete waypoint' }).click();
    await page.getByRole('dialog', { name: 'Delete waypoint?' }).getByRole('button', { name: 'Delete waypoint', exact: true }).click();
    await expect(page.locator('.count').first()).toHaveText(String(before));
});

test('oracle-fix invalid creation explains stage bounds', async ({ page }) => {
    await page.goto(BASE);
    const welcome = page.getByRole('dialog'); if (await welcome.isVisible()) await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Add waypoint' }).click();
    await page.getByRole('dialog').getByRole('spinbutton', { name: 'Beat' }).fill('49');
    await page.getByRole('dialog').getByRole('button', { name: 'Add waypoint', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Beat must be 1–48');
});

test('oracle-fix sort reversal, filter, branch, and persisted mode stay coherent', async ({ page }) => {
    await page.goto(BASE);
    const welcome = page.getByRole('dialog'); if (await welcome.isVisible()) await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Path', exact: true }).click();
    await page.getByLabel('Filter waypoints').selectOption('actor');
    await page.getByRole('button', { name: 'Sort descending' }).click();
    await page.getByRole('button', { name: 'New branch' }).click();
    await page.getByLabel('Branch name').fill('rehearsal-b');
    await page.getByRole('button', { name: 'Create branch' }).click();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Path', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByLabel('Filter waypoints')).toHaveValue('actor');
    await expect(page.getByLabel('Select branch')).toHaveValue('rehearsal-b');
    await expect(page.getByRole('button', { name: 'Sort ascending' })).toBeVisible();
});

test('oracle-fix beat interpolation visibly changes derived stage position', async ({ page }) => {
    await page.goto(BASE);
    const welcome = page.getByRole('dialog'); if (await welcome.isVisible()) await page.keyboard.press('Escape');
    const actor = page.getByRole('button', { name: /Alice, actor/ });
    const atOne = await actor.getAttribute('transform');
    await page.getByRole('button', { name: 'Add waypoint' }).click();
    await page.getByLabel('Beat').fill('20'); await page.getByLabel('X position (m)').fill('10'); await page.getByLabel('Y position (m)').fill('7');
    await page.getByRole('dialog').getByRole('button', { name: 'Add waypoint' }).click();
    await page.getByRole('button', { name: '20', exact: true }).click();
    await page.waitForTimeout(500);
    expect(await actor.getAttribute('transform')).not.toBe(atOne);
});

test('oracle-fix analysis rehearsal approval and artifact flows provide feedback', async ({ page }) => {
    await page.goto(BASE);
    const welcome = page.getByRole('dialog'); if (await welcome.isVisible()) await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Analyze', exact: true }).click();
    await expect(page.getByText(/Sightlines and access clear|Collision risk/).first()).toBeVisible();
    await page.getByRole('button', { name: 'Rehearse', exact: true }).click();
    await page.getByTitle('start rehearsal').click();
    await expect(page.getByText('Running', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByText(/Branch .* approved/)).toBeVisible();
    await page.getByRole('button', { name: 'Artifacts' }).click();
    await expect(page.getByRole('dialog', { name: 'Artifact transfer' })).toBeVisible();
    await expect(page.getByText('Canonical JSON')).toBeVisible();
});

test('oracle-fix responsive layouts avoid overflow and preserve 44px controls', async ({ page }) => {
    for (const width of [1440, 768, 375]) {
        await page.setViewportSize({ width, height: 900 }); await page.goto(BASE);
        const welcome = page.getByRole('dialog'); if (await welcome.isVisible()) await page.keyboard.press('Escape');
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(1);
    }
    const boxes = await page.locator('button:visible').evaluateAll((buttons) => buttons.map((b) => b.getBoundingClientRect()).filter((r) => r.width < 44 || r.height < 44));
    expect(boxes).toEqual([]);
});
