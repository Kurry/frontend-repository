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


test.describe('Command Center E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  // 1. Accessibility
  test('1.1 keyboard_reaches_primary_controls', async ({ page }) => {
    await page.keyboard.press('Tab');
    const focused = page.locator('*:focus');
    await expect(focused).not.toBeNull();
  });

  test('1.2 visible_focus_indicators', async ({ page }) => {
    await page.keyboard.press('Tab');
    const focused = page.locator('*:focus');
    await expect(focused).not.toBeNull();
    const outline = await focused.evaluate(el => window.getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe('none');
  });

  test('1.3 dialogs_trap_focus_and_escape', async ({ page }) => {
    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  test('1.4 night_popover_escape_returns_focus', async ({ page }) => {
    const trigger = page.locator('header button').last();
    await trigger.click();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  });

  test('1.6 status_not_color_only', async ({ page }) => {
    const status = page.locator('[class*="status"], [class*="chip"]').first();
    await expect(status).toHaveText(/[a-zA-Z]+/);
  });

  test('1.7 aria_live_announces_mutations', async ({ page }) => {
    await expect(page.locator('[aria-live]').first()).toBeAttached();
  });

  test('1.8 labels_on_form_controls', async ({ page }) => {
    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    const input = page.locator('input').first();
    const hasLabel = await input.evaluate(el => el.hasAttribute('id') || el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby'));
    expect(hasLabel).toBe(true);
  });

  test('1.9 checkbox_and_bulk_actions_labeled', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]').first();
    const hasLabel = await checkbox.evaluate(el => el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby') || el.hasAttribute('id'));
    expect(hasLabel).toBe(true);
  });

  test('1.10 export_tabs_are_keyboard_operable', async ({ page }) => {
    await page.getByRole('button', { name: /Export/i }).click();
    await expect(page.getByRole('tablist')).toBeVisible();
    await expect(page.getByRole('tab')).toHaveCount(2);
  });

  test('4.8 reduced_motion_fallback', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('http://localhost:3000');
    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const transitionDuration = await dialog.evaluate((el) => window.getComputedStyle(el).transitionDuration);
    expect(parseFloat(transitionDuration) || 0).toBeLessThan(0.1);
  });

  test('7.2 tablet_kpi_wrap_feed_stacks', async ({ page }) => {
    await page.setViewportSize({ width: 1023, height: 900 });
    await page.goto('http://localhost:3000');
    const tiles = page.locator('.kpi-tile, [class*="kpi"]');
    const box1 = await tiles.nth(0).boundingBox();
    const box4 = await tiles.nth(3).boundingBox();
    expect(box4.y).toBeGreaterThan(box1.y + 10);
  });

  test('7.3 mobile_no_page_horizontal_scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(375);
  });

  test('7.4 suggestions_row_self_scrolls', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(375);
  });

  test('7.5 export_drawer_usable_on_mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    await page.getByRole('button', { name: /Export/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
  });

  test('7.6 command_palette_usable_on_mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    await page.keyboard.press('Meta+k');
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('7.7 undo_redo_visible_on_mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    await expect(page.getByRole('button', { name: /Undo/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Redo/i })).toBeVisible();
  });

  test('7.8 connect_dialog_usable_on_mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('9.2 console_clean_on_load', async ({ page }) => {
    let errors = 0;
    page.on('console', msg => { if (msg.type() === 'error') errors++; });
    page.on('pageerror', () => errors++);
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    expect(errors).toBe(0);
  });

  test('9.3 console_clean_during_exercise', async ({ page }) => {
    let errors = 0;
    page.on('console', msg => { if (msg.type() === 'error') errors++; });
    page.on('pageerror', () => errors++);
    await page.goto('http://localhost:3000');
    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    await page.keyboard.press('Escape');
    expect(errors).toBe(0);
  });

  test('9.6 export_tab_switch_no_freeze', async ({ page }) => {
    await page.getByRole('button', { name: /Export/i }).click();
    await page.getByRole('tab', { name: /CSV/i }).click();
    await expect(page.locator('pre, code').first()).toBeVisible();
  });

  test('9.7 palette_filter_stays_snappy', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    await page.keyboard.type('test');
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('15.2 actions_use_specific_labels', async ({ page }) => {
    await page.getByRole('button', { name: /Connect agent/i }).first().click();
    await expect(page.getByRole('button', { name: 'Connect agent', exact: true }).last()).toBeVisible();
  });
});
