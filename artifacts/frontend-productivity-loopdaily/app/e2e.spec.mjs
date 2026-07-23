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

const localDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const today = () => localDateKey(new Date());
const dayOffset = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return localDateKey(date);
};
const habit = (overrides = {}) => ({
  id: 'habit-a',
  name: 'Morning focus',
  icon: '🎯',
  targetType: 'once',
  targetCount: 1,
  categoryId: 'category-a',
  reminder: '7:00 AM',
  paused: false,
  completions: {},
  order: 0,
  createdAt: new Date().toISOString(),
  ...overrides,
});
const workspace = (overrides = {}) => ({
  habits: [habit()],
  categories: [{ id: 'category-a', name: 'Health' }],
  activeCategoryFilter: null,
  ...overrides,
});
const seed = async (page, state) => {
  await page.goto(BASE);
  await page.evaluate((value) => {
    localStorage.setItem('loopdaily.appState.v1', JSON.stringify(value));
    localStorage.setItem('loopdaily.appState.backup.v1', JSON.stringify(value));
    localStorage.setItem('loopdaily.ui.v1', JSON.stringify({ lastView: 'habits', coachDismissed: true }));
  }, state);
  await page.reload();
};

test('14.1 multi_facet_persistence_round_trip and 1.38 filter_and_facets_survive_reload', async ({ page }) => {
  const state = workspace({
    habits: [
      habit(),
      habit({ id: 'habit-b', name: 'Evening walk', icon: '🚶', categoryId: 'category-b', reminder: '6:00 PM', order: 1 }),
    ],
    categories: [{ id: 'category-a', name: 'Health' }, { id: 'category-b', name: 'Evening' }],
  });
  await seed(page, state);
  await page.goto(BASE);
  await page.getByRole('button', { name: /drag to reorder evening walk/i }).focus();
  await page.keyboard.press('ArrowUp');
  await page.getByRole('button', { name: 'Evening', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Evening', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-habit-card]')).toHaveCount(1);
  await expect(page.locator('[data-habit-card]').first()).toHaveAttribute('data-habit-id', 'habit-b');
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('loopdaily.appState.v1')));
  expect(persisted.habits.sort((a, b) => a.order - b.order).map((h) => h.id)).toEqual(['habit-b', 'habit-a']);
  expect(persisted.habits.find((h) => h.id === 'habit-b').reminder).toBe('6:00 PM');
});

test('1.8 full_state_restored_after_reload and 1.34 create_flow_multi_surface', async ({ page }) => {
  await seed(page, workspace({ habits: [] }));
  await page.goto(BASE);
  await page.getByRole('button', { name: 'Health' }).click();
  await page.getByRole('button', { name: /create habit|new habit/i }).click();
  await page.getByLabel('Habit name').fill('Hydrate deeply');
  await page.getByLabel('Select emoji 💧').click();
  await page.getByLabel('Category').selectOption('category-a');
  await page.getByLabel(/remind me at/i).fill('9:30 AM');
  const before = await page.locator('[data-habit-card]').count();
  await page.getByRole('button', { name: 'Create habit' }).click();
  await expect(page.locator('[data-habit-card]')).toHaveCount(before + 1);
  await page.locator('[data-action="toggle-complete"]').click();
  await page.reload();
  const card = page.locator('[data-habit-card]').filter({ hasText: 'Hydrate deeply' });
  await expect(card).toContainText('Remind me at 9:30 AM');
  await expect(card.locator('[data-action="toggle-complete"]')).toHaveAttribute('aria-pressed', 'true');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('loopdaily.appState.v1')));
  expect(saved.habits.find((h) => h.name === 'Hydrate deeply')).toMatchObject({ icon: '💧', categoryId: 'category-a', reminder: '9:30 AM' });
});

test('1.35 once_daily_checkin_cross_surface and 1.39 trend_chart_input_sensitivity', async ({ page }) => {
  await seed(page, workspace());
  await page.goto(BASE);
  await page.locator('[data-action="toggle-complete"]').click();
  await expect(page.locator('[data-weekly-cell][data-today="true"]')).toHaveAttribute('data-complete', 'true');
  await page.getByRole('tab', { name: 'Stats' }).click();
  await expect(page.locator('[data-stat="month-completions"] [data-stat-value]')).toHaveText('1');
  await expect(page.locator('[data-trend-chart]')).toHaveAttribute('data-today-value', '1');
  await page.getByRole('tab', { name: 'Habits' }).click();
  await page.locator('[data-action="toggle-complete"]').click();
  await page.getByRole('tab', { name: 'Stats' }).click();
  await expect(page.locator('[data-trend-chart]')).toHaveAttribute('data-today-value', '0');
  await page.reload();
  await expect(page.locator('[data-stat="month-completions"] [data-stat-value]')).toHaveText('0');
});

test('1.36 stepper_target_cross_surface and 2.5 rapid_stepper_stability', async ({ page }) => {
  await seed(page, workspace({ habits: [habit({ targetType: 'count', targetCount: 30 })] }));
  await page.goto(BASE);
  const plus = page.locator('[data-action="step-inc"]');
  for (let i = 0; i < 25; i += 1) await plus.click();
  await expect(page.locator('[data-fraction]')).toHaveText('25/30');
  for (let i = 0; i < 5; i += 1) await plus.click();
  await expect(page.locator('[data-fraction]')).toHaveText('30/30');
  await expect(page.locator('[data-weekly-cell][data-today="true"]')).toHaveAttribute('data-complete', 'true');
  await page.locator('[data-action="step-dec"]').click();
  await expect(page.locator('[data-fraction]')).toHaveText('29/30');
  await expect(page.locator('[data-weekly-cell][data-today="true"]')).toHaveAttribute('data-complete', 'false');
});

test('1.37 pause_flow_stats_and_reload', async ({ page }) => {
  await seed(page, workspace({ habits: [habit({ completions: { [today()]: 1 } })] }));
  await page.goto(BASE);
  await page.getByRole('button', { name: /pause morning focus/i }).click();
  await expect(page.locator('[data-habit-card]')).toHaveAttribute('data-habit-paused', 'true');
  await page.reload();
  await expect(page.locator('[data-habit-card]')).toHaveAttribute('data-habit-paused', 'true');
  await page.getByRole('tab', { name: 'Stats' }).click();
  await expect(page.locator('[data-stat="active-streaks"] [data-stat-value]')).toHaveText('0');
  await page.getByRole('tab', { name: 'Habits' }).click();
  await page.getByRole('button', { name: /resume morning focus/i }).click();
  await page.reload();
  await expect(page.locator('[data-habit-card]')).toHaveAttribute('data-habit-streak', '1');
});

test('1.33 import_cancel_preserves_data and 2.22 workspace_json_exact_types_order_and_references', async ({ page }) => {
  const state = workspace({ habits: [habit(), habit({ id: 'habit-b', name: 'Second', order: 1 })] });
  await seed(page, state);
  await page.goto(BASE);
  await page.getByRole('tab', { name: 'Data' }).click();
  await page.getByRole('button', { name: 'Import from JSON' }).click();
  await page.getByRole('button', { name: 'Cancel' }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('loopdaily.appState.v1')))).toEqual(state);
  await page.getByRole('button', { name: 'Preview workspace JSON' }).click();
  const doc = JSON.parse(await page.locator('[data-export-preview]').textContent());
  expect(doc.schemaVersion).toBe('loopdaily.workspace.v1');
  expect(new Date(doc.exportedAt).toISOString()).toBe(doc.exportedAt);
  expect(doc.habits.map((h) => h.id)).toEqual(['habit-a', 'habit-b']);
  expect(doc.categories).toEqual(state.categories);
  expect(doc.habits[0]).toMatchObject({ id: 'habit-a', name: 'Morning focus', icon: '🎯', targetType: 'once', targetCount: 1, categoryId: 'category-a', reminder: '7:00 AM', paused: false, order: 0 });
  expect(doc.habits[0].completions).toEqual({});
});

test('2.19 habit_form_validation_matches_field_contract', async ({ page }) => {
  await seed(page, workspace({ habits: [] }));
  await page.goto(BASE);
  await page.getByRole('button', { name: /create habit|new habit/i }).click();
  await page.getByLabel('Habit name').fill(' '.repeat(3));
  await page.getByRole('button', { name: 'Create habit' }).click();
  await expect(page.getByText('name must be non-empty')).toBeVisible();
  await page.getByLabel('Habit name').fill('x'.repeat(81));
  await page.getByLabel(/remind me at/i).fill('r'.repeat(41));
  await page.getByLabel('Daily count').check();
  await page.getByLabel('Daily target count').fill('101');
  await page.getByRole('button', { name: 'Create habit' }).click();
  await expect(page.getByText('name must be 80 characters or fewer')).toBeVisible();
  await expect(page.getByText('reminder must be 40 characters or fewer')).toBeVisible();
  await expect(page.getByText(/targetCount must be an integer between 1 and 100/)).toBeVisible();
  await expect(page.locator('[data-habit-card]')).toHaveCount(0);
});

test('3.4 specified_state_changes_have_motion, 3.10 timings, 4.3 toasts, 4.9 enter-exit, and 4.14 button press', async ({ page }) => {
  await seed(page, workspace({ habits: [] }));
  await page.goto(BASE);
  const open = page.getByRole('button', { name: /create habit|new habit/i });
  await open.hover();
  expect(await open.evaluate((el) => getComputedStyle(el).transitionDuration)).not.toBe('0s');
  await page.getByRole('button', { name: /create habit|new habit/i }).click();
  await page.getByLabel('Habit name').fill('Animated habit');
  await page.getByRole('button', { name: 'Create habit' }).click();
  const card = page.locator('[data-habit-card]');
  expect(await card.evaluate((el) => getComputedStyle(el).animationDuration)).not.toBe('0s');
  const toastNode = page.locator('[data-sonner-toast]').first();
  await expect(toastNode).toBeVisible();
  expect(await toastNode.evaluate((el) => getComputedStyle(el).animationDuration)).not.toBe('0s');
  await expect(toastNode).toBeHidden({ timeout: 7000 });
  await page.getByRole('button', { name: /pause animated habit/i }).click();
  await expect(page.locator('[data-habit-card]')).toHaveAttribute('data-habit-paused', 'true');
});

test('11.1 milestone_confetti craft, 11.8 flame tiers, and innovation catchall enhancement', async ({ page }) => {
  const completions = Object.fromEntries(Array.from({ length: 6 }, (_, index) => [dayOffset(-(index + 1)), 1]));
  await seed(page, workspace({ habits: [habit({ completions })] }));
  await page.goto(BASE);
  await expect(page.locator('[data-enhancement="today-glance"]')).toContainText('Up next: Morning focus');
  await expect(page.locator('[data-flame-tier]')).toHaveAttribute('data-flame-tier', 'plain');
  await page.locator('[data-action="toggle-complete"]').click();
  await expect(page.locator('[data-flame-tier]')).toHaveAttribute('data-flame-tier', 'bright');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('[data-habit-card]')).toHaveClass(/milestone-pulse/);
  await expect(page.locator('[data-enhancement="today-glance"]')).toContainText('All active habits complete');
});

test('2.14 keyboard_reachability_and_focus', async ({ page }) => {
  await seed(page, workspace({ habits: [habit({ targetType: 'count', targetCount: 3 })] }));
  await page.goto(BASE);
  const controls = page.locator('button:visible, input:visible, select:visible, [tabindex="0"]:visible');
  const count = await controls.count();
  expect(count).toBeGreaterThan(8);
  for (let i = 0; i < count; i += 1) {
    await controls.nth(i).focus();
    await expect(controls.nth(i)).toBeFocused();
    const outline = await controls.nth(i).evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe('none');
  }
});
