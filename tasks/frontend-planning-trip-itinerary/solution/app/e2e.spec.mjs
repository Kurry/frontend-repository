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
    const response = await page.goto(BASE);
    expect(response, 'navigation returns an HTTP response').not.toBeNull();
    expect(response.ok(), `HTTP ${response.status()} from ${response.url()}`).toBe(true);
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
    const session = await page.evaluate(async () => {
      const value = await window.webmcp_session_info();
      return typeof value === 'string' ? JSON.parse(value) : value;
    });
    expect(session, 'webmcp_session_info returns metadata').toBeTruthy();
    expect(Array.isArray(session), 'session metadata is an object, not an array').toBe(false);
    expect(typeof session, 'session metadata is an object').toBe('object');
    expect(Object.keys(session).length, 'session metadata is non-empty').toBeGreaterThan(0);
    const tools = await listTools(page);
    const arr = Array.isArray(tools) ? tools : tools?.tools ?? [];
    expect(arr.length, 'at least one webmcp tool registered').toBeGreaterThan(0);
    const names = arr.map((t) => t?.name ?? t?.id);
    for (const name of names) {
      expect(typeof name, 'every tool has a name').toBe('string');
      expect(name.trim().length, 'tool names are non-empty').toBeGreaterThan(0);
    }
    expect(new Set(names).size, 'tool names are unique').toBe(names.length);
  });

  test('reduced motion behaviorally suppresses animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // Start observing at navigation commit, before short intro animations can
    // finish and disappear from document.getAnimations(). Sampling only after
    // networkidle/settle would falsely pass a forbidden sub-second animation.
    await page.goto(BASE, { waitUntil: 'commit' });
    // Precondition sanity check: the emulation actually reaches the app.
    const reduced = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
    expect(reduced, 'precondition: app sees prefers-reduced-motion: reduce').toBe(true);
    // Observe every frame through the intro/settle window. Finished, idle, or
    // paused effects and durations <=1ms are allowed; any meaningfully timed
    // running effect at any sample is a reduced-motion failure.
    const offenders = await page.evaluate(async () => {
      const seen = new Map();
      const deadline = performance.now() + 1500;
      while (performance.now() < deadline) {
        for (const a of document.getAnimations({ subtree: true })) {
          if (a.playState !== 'running') continue;
          let timing = {};
          try { timing = a.effect?.getComputedTiming?.() ?? {}; } catch { /* detached */ }
          const dur = typeof timing.duration === 'number' ? timing.duration : 0;
          if (dur <= 1) continue; // fill-only / effectively instant
          const offender = {
            kind: a.constructor?.name ?? 'Animation',
            name: a.animationName ?? a.transitionProperty ?? a.id ?? '(anonymous)',
            duration: dur,
            iterations: timing.iterations ?? 1,
          };
          seen.set(JSON.stringify(offender), offender);
        }
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      return [...seen.values()];
    });
    await page.waitForLoadState('networkidle');
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
// ============================================================================
// Task-specific criterion tests for frontend-planning-trip-itinerary.
// One test per deterministic rubric criterion (id + name from tests/<dim>/<dim>.toml).
// Subjective/purely-visual criteria are intentionally NOT stubbed here; see the
// PR description for the "not automatable" list.
// ============================================================================

// ---------------------------- shared helpers -------------------------------
const SEEDED_STOP_COUNT = 15;
const SEEDED_EXPENSE_COUNT = 12;

async function gotoApp(page, { width = 1280, height = 900 } = {}) {
  await page.setViewportSize({ width, height });
  await page.goto(BASE);
}

function dayNavButton(page, dowMd) {
  return page.locator('.nav-item.nav-sub', { hasText: dowMd });
}

function stopRow(page, title) {
  return page.locator('.stop-row', { hasText: title });
}

async function openAddStopForDay(page, dayHeadingText) {
  const section = page.locator('.day-section', { hasText: dayHeadingText });
  await section.getByRole('button', { name: /Add stop/ }).first().click();
}

async function fillStopForm(page, { title, day, category, location, startTime, endTime, notes } = {}) {
  const modal = page.locator('.modal.wide');
  if (title != null) { await modal.locator('#sf-title').fill(''); await modal.locator('#sf-title').fill(title); }
  if (day != null) await modal.locator('#sf-day').selectOption(day);
  if (category != null) await modal.locator('#sf-category').selectOption(category);
  if (location != null) await modal.locator('#sf-location').fill(location);
  if (startTime != null) await modal.locator('#sf-start').fill(startTime);
  if (endTime != null) await modal.locator('#sf-end').fill(endTime);
  if (notes != null) await modal.locator('#sf-notes').fill(notes);
}

function stopSubmitButton(page) {
  return page.locator('.modal.wide .mfoot button.primary');
}

async function goBudgetTab(page, tab) {
  await page.getByRole('button', { name: 'Budget', exact: true }).click();
  await page.locator('.ws-tab', { hasText: tab }).click();
}

function expenseRow(page, description) {
  return page.locator('table.ledger tbody tr', { hasText: description });
}

async function openAddExpense(page) {
  await page.getByRole('button', { name: /Add expense/ }).click();
}

function expenseSubmitButton(page) {
  return page.locator('.modal.wide .mfoot button.primary');
}

test.describe('core_features', () => {
  test('1.1 seeded_multi_day_stops_visible', async ({ page }) => {
    await gotoApp(page);
    const rows = page.locator('.stop-row');
    await expect(rows).toHaveCount(SEEDED_STOP_COUNT);
    const examples = [
      { title: 'Nice Airport Arrival', day: 'Sun, 7/5', cat: 'Transport' },
      { title: "Prince's Palace of Monaco", day: 'Mon, 7/6', cat: 'Sightseeing' },
      { title: 'Cannes Seafood Lunch', day: 'Tue, 7/7', cat: 'Dining' },
      { title: 'Cap d\'Antibes Walk', day: 'Wed, 7/8', cat: 'Sightseeing' },
      { title: 'Eze Village', day: 'Thu, 7/9', cat: 'Sightseeing' },
    ];
    for (const ex of examples) {
      const row = stopRow(page, ex.title);
      await expect(row).toBeVisible();
      await expect(row.locator('.cat-chip')).toHaveText(ex.cat);
      const section = page.locator('.day-section', { hasText: ex.day });
      await expect(section.locator('.stop-row', { hasText: ex.title })).toBeVisible();
    }
  });

  test('1.2 create_stop_appears_in_plan_list', async ({ page }) => {
    await gotoApp(page);
    await openAddStopForDay(page, 'Sun, 7/5');
    await fillStopForm(page, { title: 'Harbor Lookout', day: '2025-07-05', category: 'sightseeing' });
    await expect(stopSubmitButton(page)).toBeEnabled();
    await stopSubmitButton(page).click();
    const section = page.locator('.day-section', { hasText: 'Sun, 7/5' });
    await expect(section.locator('.stop-row', { hasText: 'Harbor Lookout' })).toBeVisible();
  });

  test('1.3 stop_count_delta_after_three_creates', async ({ page }) => {
    await gotoApp(page);
    const before = await page.locator('.stop-row').count();
    for (let i = 0; i < 3; i++) {
      await openAddStopForDay(page, 'Sun, 7/5');
      await fillStopForm(page, { title: `Delta Stop ${i}`, day: '2025-07-05', category: 'other' });
      await stopSubmitButton(page).click();
      await expect(page.locator('.modal.wide')).toHaveCount(0);
    }
    const after = await page.locator('.stop-row').count();
    expect(after - before).toBe(3);
  });

  test('1.4 detail_panel_shows_selected_stop', async ({ page }) => {
    await gotoApp(page);
    await stopRow(page, 'Eze Village').click();
    const card = page.locator('.detail-card');
    await expect(card).toBeVisible();
    await expect(card).toContainText('Eze Village');
    await expect(card.locator('[role="tab"]', { hasText: 'About' })).toBeVisible();
  });

  test('1.5 edit_stop_name_updates_list', async ({ page }) => {
    await gotoApp(page);
    const row = stopRow(page, 'Castle Hill Sunset');
    await row.getByRole('button', { name: /Edit/ }).click();
    const modal = page.locator('.modal.wide');
    await modal.locator('#sf-title').fill('');
    await modal.locator('#sf-title').fill('Evening Promenade');
    await stopSubmitButton(page).click();
    await expect(page.locator('.stop-row', { hasText: 'Evening Promenade' })).toBeVisible();
    await expect(page.locator('.stop-row', { hasText: 'Castle Hill Sunset' })).toHaveCount(0);
  });

  test('1.6 delete_stop_removes_row', async ({ page }) => {
    await gotoApp(page);
    const row = stopRow(page, 'Menton Old Town');
    await row.getByRole('button', { name: /Delete/ }).click();
    await expect(page.locator('.stop-row', { hasText: 'Menton Old Town' })).toHaveCount(0);
  });

  test('1.7 empty_state_after_last_delete', async ({ page }) => {
    await gotoApp(page);
    // delete every seeded stop
    while (await page.locator('.stop-row').count()) {
      const row = page.locator('.stop-row').first();
      await row.getByRole('button', { name: /Delete/ }).click();
    }
    await expect(page.locator('.stop-row')).toHaveCount(0);
    const empty = page.locator('.workspace > .empty-state');
    await expect(empty).toBeVisible();
    await expect(empty).toContainText('No stops in your plan yet');
    await expect(empty.getByRole('button', { name: /Add your first stop/ })).toBeVisible();
  });

  test('1.8 empty_name_submit_blocked', async ({ page }) => {
    await gotoApp(page);
    const before = await page.locator('.stop-row').count();
    await openAddStopForDay(page, 'Sun, 7/5');
    const modal = page.locator('.modal.wide');
    await modal.locator('#sf-day').selectOption('2025-07-05');
    await modal.locator('#sf-category').selectOption('sightseeing');
    await expect(stopSubmitButton(page)).toBeDisabled();
    await expect(modal.locator('#sf-title-err')).toBeVisible();
    await expect(modal.locator('#sf-title-err')).toContainText('Title is required');
    await page.keyboard.press('Escape');
    await expect(page.locator('.stop-row')).toHaveCount(before);
  });

  test('1.9 day_filter_narrows_list', async ({ page }) => {
    await gotoApp(page);
    await dayNavButton(page, 'Mon 7/6').click();
    const sections = page.locator('.day-section');
    await expect(sections).toHaveCount(1);
    await expect(sections.first()).toHaveAttribute('aria-label', 'Mon, 7/6');
    await page.getByRole('button', { name: 'Show all days' }).click();
    await expect(page.locator('.day-section')).toHaveCount(7);
  });

  test('1.10 plan_map_mode_switch_no_reload', async ({ page }) => {
    await gotoApp(page);
    await page.evaluate(() => { window.__noReloadMarker = 'still-here'; });
    await page.getByRole('button', { name: 'Map', exact: true }).click();
    await expect(page.locator('.mappane')).toBeVisible();
    const marker = await page.evaluate(() => window.__noReloadMarker);
    expect(marker).toBe('still-here');
    await page.getByRole('button', { name: 'Plan List' }).click();
    await expect(page.locator('.day-section').first()).toBeVisible();
    expect(await page.evaluate(() => window.__noReloadMarker)).toBe('still-here');
  });

  test('1.12 hover_feedback_on_rows_and_chrome', async ({ page }) => {
    await gotoApp(page);
    const row = stopRow(page, 'Eze Village');
    const before = await row.evaluate((el) => getComputedStyle(el).backgroundColor);
    await row.hover();
    await expect.poll(() => row.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe(before);
  });

  test('1.16 console_clean_during_session', async ({ page }) => {
    // The canonical page fixture (top of this file) collects every
    // console.error/pageerror during the test and asserts the list is empty
    // at teardown — this test's job is to exercise a real cross-surface
    // session (CRUD, mode switch, budget sub-tabs, notes) so that assertion
    // has something to actually observe.
    await gotoApp(page);
    await stopRow(page, 'Eze Village').click();
    await page.getByRole('button', { name: 'Map', exact: true }).click();
    await page.getByRole('button', { name: 'Budget', exact: true }).click();
    await page.locator('.ws-tab', { hasText: 'Spreadsheet' }).click();
    await page.getByRole('button', { name: 'Notes' }).click();
    // confirm the session is still genuinely functional after that sequence
    await expect(page.locator('.md-split')).toBeVisible();
  });

  test('1.17 crud_updates_derived_counts', async ({ page }) => {
    await gotoApp(page);
    const section = page.locator('.day-section', { hasText: 'Sun, 7/5' });
    const pillBefore = section.locator('.count-pill');
    await expect(pillBefore).toHaveText('4 stops');
    await openAddStopForDay(page, 'Sun, 7/5');
    await fillStopForm(page, { title: 'Derived Count Stop', day: '2025-07-05', category: 'other' });
    await stopSubmitButton(page).click();
    await expect(section.locator('.count-pill')).toHaveText('5 stops');
    await stopRow(page, 'Derived Count Stop').getByRole('button', { name: /Delete/ }).click();
    await expect(section.locator('.count-pill')).toHaveText('4 stops');
  });

  test('1.18 two_modes_switchable', async ({ page }) => {
    await gotoApp(page);
    const list = page.getByRole('button', { name: 'Plan List' });
    const map = page.getByRole('button', { name: 'Map', exact: true });
    await expect(list).toHaveAttribute('aria-pressed', 'true');
    await map.click();
    await expect(map).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.mappane')).toBeVisible();
    await list.click();
    await expect(list).toHaveAttribute('aria-pressed', 'true');
  });

  test('1.19 filters_recompute_from_shared_collection', async ({ page }) => {
    await gotoApp(page);
    await dayNavButton(page, 'Tue 7/7').click();
    const stopsOnTue = ['La Croisette Stroll', 'Cannes Seafood Lunch'];
    await expect(page.locator('.stop-row')).toHaveCount(stopsOnTue.length);
    for (const t of stopsOnTue) await expect(stopRow(page, t)).toBeVisible();
    const navPill = dayNavButton(page, 'Tue 7/7').locator('.meta');
    await expect(navPill).toHaveText(String(stopsOnTue.length));
  });

  test('1.23 sidebar_full_contents', async ({ page }) => {
    await gotoApp(page);
    const sb = page.locator('.sidebar');
    await expect(sb.locator('.ai-pill')).toContainText('AI Assistant');
    await expect(sb.getByRole('button', { name: 'Explore' })).toBeVisible();
    await expect(sb.getByRole('button', { name: 'Notes' })).toBeVisible();
    await expect(sb.getByRole('button', { name: 'Places to visit' })).toBeVisible();
    const days = [['Sun', '7/5'], ['Mon', '7/6'], ['Tue', '7/7'], ['Wed', '7/8'], ['Thu', '7/9'], ['Fri', '7/10'], ['Sat', '7/11']];
    for (const [dow, md] of days) {
      const item = dayNavButton(page, `${dow} ${md}`);
      await expect(item).toBeVisible();
      await expect(item.locator('.dot')).toHaveCount(1);
      const bg = await item.locator('.dot').evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(bg).not.toBe('');
    }
    await expect(sb.getByRole('button', { name: 'Budget', exact: true })).toBeVisible();
    await expect(sb.getByRole('button', { name: 'Support' })).toBeVisible();
    await expect(sb.getByRole('button', { name: 'Hide sidebar' })).toBeVisible();
  });

  test('1.24 plan_hero_full_contents', async ({ page }) => {
    await gotoApp(page);
    const hero = page.locator('.hero');
    await expect(hero.locator('.cover')).toBeVisible();
    const title = hero.locator('#trip-title');
    await expect(title).toHaveValue("Trip to the French Riviera - Cote d'Azur");
    await expect(hero).toContainText('7/5 – 7/11');
    await expect(page.getByRole('button', { name: 'Browse all' })).toBeVisible();
    await expect(page.locator('.cards-row .sugg')).toHaveCount(3);
    await expect(page.locator('.strip .chip-card')).toHaveCount(5); // 1 "Add a place" + 4 suggestions
  });

  test('1.25 detail_tab_row_swaps_panels', async ({ page }) => {
    await gotoApp(page);
    await stopRow(page, 'Eze Village').click();
    const card = page.locator('.detail-card');
    const aboutText = await card.locator('.panel').innerText();
    await card.locator('[role="tab"]', { hasText: 'Reviews' }).click();
    const reviewsText = card.locator('.panel');
    await expect(reviewsText).not.toHaveText(aboutText);
    expect(reviewsText).toContain('reviews');
    expect(page.url()).toBe(BASE + '/');
    await card.locator('[role="tab"]', { hasText: 'Photos' }).click();
    await expect(card.locator('.photo-grid')).toBeVisible();
  });

  test('1.27 stop_lifecycle_cross_surface_chain', async ({ page }) => {
    await gotoApp(page);
    const beforeCount = await page.locator('.stop-row').count();
    await openAddStopForDay(page, 'Sun, 7/5');
    await fillStopForm(page, { title: 'Chain Stop', day: '2025-07-05', category: 'sightseeing' });
    await stopSubmitButton(page).click();
    await expect(page.locator('.modal.wide')).toHaveCount(0);
    await expect(page.locator('.stop-row')).toHaveCount(beforeCount + 1);
    await expect(stopRow(page, 'Chain Stop')).toHaveCount(1);
    // creating a stop does not change the existing map selection, so select
    // it explicitly before checking the map/detail surfaces reflect it
    await stopRow(page, 'Chain Stop').click();

    await page.getByRole('button', { name: 'Map', exact: true }).click();
    await expect(page.locator('.mappane .pin', { hasText: '' })).not.toHaveCount(0);
    await expect(page.locator('.detail-card')).toContainText('Chain Stop');

    const editRow = stopRow(page, 'Chain Stop');
    await page.getByRole('button', { name: 'Plan List' }).click();
    await stopRow(page, 'Chain Stop').getByRole('button', { name: /Edit/ }).click();
    const modal = page.locator('.modal.wide');
    await modal.locator('#sf-title').fill('');
    await modal.locator('#sf-title').fill('Chain Stop Renamed');
    await stopSubmitButton(page).click();
    await expect(stopRow(page, 'Chain Stop Renamed')).toBeVisible();
    await stopRow(page, 'Chain Stop Renamed').click();
    await expect(page.locator('.detail-card')).toContainText('Chain Stop Renamed');
    await page.getByRole('button', { name: 'Map', exact: true }).click();
    await expect(page.locator('.detail-card')).toContainText('Chain Stop Renamed');

    await page.getByRole('button', { name: 'Plan List' }).click();
    await stopRow(page, 'Chain Stop Renamed').getByRole('button', { name: /Delete/ }).click();
    await expect(stopRow(page, 'Chain Stop Renamed')).toHaveCount(0);
    await expect(page.locator('.stop-row')).toHaveCount(beforeCount);
  });

  test('1.28 day_filter_create_clear_chain', async ({ page }) => {
    await gotoApp(page);
    await dayNavButton(page, 'Wed 7/8').click();
    await expect(dayNavButton(page, 'Wed 7/8')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.day-section')).toHaveCount(1);
    await openAddStopForDay(page, 'Wed, 7/8');
    await fillStopForm(page, { title: 'Filtered Add', day: '2025-07-08', category: 'other' });
    await stopSubmitButton(page).click();
    await expect(stopRow(page, 'Filtered Add')).toBeVisible();
    await expect(page.locator('.day-section')).toHaveCount(1);
    await page.getByRole('button', { name: 'Show all days' }).click();
    await expect(page.locator('.day-section')).toHaveCount(7);
    await expect(stopRow(page, 'Filtered Add')).toBeVisible();
  });

  test('1.29 detail_selection_survives_mode_switch', async ({ page }) => {
    await gotoApp(page);
    await stopRow(page, 'Eze Village').click();
    const card = page.locator('.detail-card');
    await card.locator('[role="tab"]', { hasText: 'Reviews' }).click();
    await expect(card.locator('[role="tab"][aria-selected="true"]')).toHaveText('Reviews');
    await card.locator('[role="tab"]', { hasText: 'Photos' }).click();
    await expect(card.locator('[role="tab"][aria-selected="true"]')).toHaveText('Photos');
    await expect(card.locator('.photo-grid')).toBeVisible();
    // switch back to About, where the stop name is actually rendered, to
    // confirm the *same* stop is still the one selected
    await card.locator('[role="tab"]', { hasText: 'About' }).click();
    await expect(card).toContainText('Eze Village');
    await page.getByRole('button', { name: 'Map', exact: true }).click();
    await expect(page.locator('.detail-card')).toContainText('Eze Village');
    await page.getByRole('button', { name: 'Plan List' }).click();
    await expect(page.locator('.stop-row[aria-pressed="true"]')).toContainText('Eze Village');
    await page.locator('.detail-card .close').click().catch(() => {});
  });

  test('1.30 reload_restores_seeded_baseline', async ({ page }) => {
    await gotoApp(page);
    await openAddStopForDay(page, 'Sun, 7/5');
    await fillStopForm(page, { title: 'Pre-reload Stop', day: '2025-07-05', category: 'other' });
    await stopSubmitButton(page).click();
    await dayNavButton(page, 'Sun 7/5').click();
    await page.getByRole('button', { name: 'Map', exact: true }).click();
    await page.reload();
    await expect(page.locator('.stop-row')).toHaveCount(SEEDED_STOP_COUNT);
    await expect(stopRow(page, 'Pre-reload Stop')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Plan List' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.day-section')).toHaveCount(7);
    await expect(page.locator('.detail-card')).toContainText('Musee Picasso');
  });

  test('1.31 double_submit_creates_single_stop', async ({ page }) => {
    await gotoApp(page);
    const before = await page.locator('.stop-row').count();
    await openAddStopForDay(page, 'Sun, 7/5');
    await fillStopForm(page, { title: 'Double Submit Stop', day: '2025-07-05', category: 'other' });
    // Dispatch two click events in the same tick to simulate a real
    // double-activation (double-click / rapid double-tap) rather than two
    // separate, sequential Playwright actions racing a re-render.
    await page.evaluate(() => {
      const btn = document.querySelector('.modal.wide .mfoot button.primary');
      const dispatch = EventTarget.prototype.dispatchEvent;
      dispatch.call(btn, new MouseEvent('click', { bubbles: true }));
      dispatch.call(btn, new MouseEvent('click', { bubbles: true }));
    });
    await expect(page.locator('.modal.wide')).toHaveCount(0);
    const after = await page.locator('.stop-row').count();
    expect(after - before).toBe(1);
    await expect(stopRow(page, 'Double Submit Stop')).toHaveCount(1);
  });

  test('1.32 empty_day_filter_state', async ({ page }) => {
    await gotoApp(page);
    // Wed 7/8 has two seeded stops; delete both, then filter to that day.
    await stopRow(page, 'Musee Picasso').getByRole('button', { name: /Delete/ }).click();
    await stopRow(page, "Cap d'Antibes Walk").getByRole('button', { name: /Delete/ }).click();
    await dayNavButton(page, 'Wed 7/8').click();
    const empty = page.locator('.day-section .empty-state');
    await expect(empty).toBeVisible();
    await expect(empty).toContainText('No stops on Wed, 7/8');
    await expect(empty.getByRole('button', { name: /Add a stop/ })).toBeVisible();
    await expect(empty.getByRole('button', { name: 'Show all days' })).toBeVisible();
  });

  test('1.33 inline_validation_disables_submit', async ({ page }) => {
    await gotoApp(page);
    await stopRow(page, 'Eze Village').getByRole('button', { name: /Edit/ }).click();
    const modal = page.locator('.modal.wide');
    await modal.locator('#sf-title').fill('');
    await expect(modal.locator('#sf-title-err')).toContainText('Title is required');
    await expect(modal.locator('#sf-title-err')).toHaveAttribute('role', 'alert');
    await expect(stopSubmitButton(page)).toBeDisabled();
    await modal.locator('#sf-title').fill('   ');
    await expect(modal.locator('#sf-title-err')).toContainText('Title is required');
    await expect(stopSubmitButton(page)).toBeDisabled();
    await modal.locator('#sf-title').fill('Valid Title Again');
    await expect(modal.locator('#sf-title-err')).toHaveCSS('display', 'none');
    await expect(stopSubmitButton(page)).toBeEnabled();
  });

  test('1.34 seeded_detail_example_initial', async ({ page }) => {
    await gotoApp(page);
    const card = page.locator('.detail-card');
    await expect(card).toBeVisible();
    await expect(card).toContainText('Musee Picasso');
  });

  test('1.35 inert_controls_show_demo_toasts', async ({ page }) => {
    await gotoApp(page);
    await page.getByRole('button', { name: 'Share', exact: true }).click();
    const toast = page.locator('.toast');
    await expect(toast).toContainText('Share trip');
    await expect(page).toHaveURL(BASE + '/');
  });

  test('1.36 planner_direct_entry_no_gate', async ({ page }) => {
    await gotoApp(page);
    await expect(page.locator('.topbar')).toBeVisible();
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.mappane')).toBeVisible();
    await expect(page.locator('#modal-root .scrim')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Sign in|Log in|Sign up|Book now/ })).toHaveCount(0);
  });

  test('1.37 top_plan_chrome_contents', async ({ page }) => {
    await gotoApp(page);
    const topbar = page.locator('.topbar');
    await expect(topbar.locator('.brand')).toContainText('Trip Planner');
    await expect(topbar.locator('.brand')).toContainText('Travel Planner');
    const planBtn = topbar.getByRole('button', { name: 'Trip plan' });
    const journalBtn = topbar.getByRole('button', { name: 'Trip journal' });
    await expect(planBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(journalBtn).toBeVisible();
    await expect(topbar.getByRole('button', { name: 'Undo last change' })).toBeVisible();
    await expect(topbar.getByRole('button', { name: 'Redo change' })).toBeVisible();
    await expect(topbar.getByRole('button', { name: 'Share', exact: true })).toBeVisible();
    await expect(topbar.getByRole('button', { name: 'Export trip files' })).toBeVisible();
    await expect(page).toHaveURL(BASE + '/');
  });

  test('1.38 map_pane_static_snapshot_affordances', async ({ page }) => {
    await gotoApp(page);
    const map = page.locator('.mappane');
    await expect(map.getByRole('button', { name: /Export/ })).toBeVisible();
    await expect(map.getByRole('button', { name: 'Optimize route' })).toBeVisible();
    await expect(map.getByRole('button', { name: 'Map layers' })).toBeVisible();
    await map.getByRole('button', { name: 'Optimize route' }).click();
    await expect(page.locator('.toast')).toContainText('Route optimized');
    await expect(page).toHaveURL(BASE + '/');
    await page.locator('.toast .x').click();
    await expect(page.locator('.toast')).toHaveCount(0);
    await map.getByRole('button', { name: 'Map layers' }).click();
    await expect(page.locator('.toast')).toContainText('Map layers');
  });

  test('1.39 ledger_grid_seeded_multi_currency', async ({ page }) => {
    await gotoApp(page);
    await goBudgetTab(page, 'Ledger');
    const rows = page.locator('table.ledger tbody tr');
    await expect(rows).toHaveCount(SEEDED_EXPENSE_COUNT);
    const rowText = await rows.allInnerTexts();
    const cats = ['Lodging', 'Food', 'Transit', 'Activities'];
    for (const cat of cats) expect(rowText.some((t) => t.includes(cat))).toBe(true);
    for (const cur of ['EUR', 'USD', 'GBP', 'CHF']) {
      const sel = await page.locator('table.ledger tbody select.mini-sel').evaluateAll((sels, cur) =>
        sels.some((s) => s.value === cur), cur);
      expect(sel).toBe(true);
    }
    const first = rows.first();
    await expect(first.locator('td.desc-cell')).not.toBeEmpty();
    await expect(first.locator('td').nth(5)).toBeVisible(); // amount
    await expect(first.locator('select.mini-sel').first()).toBeVisible(); // currency
  });

  test('1.40 fx_table_and_live_eur_conversion', async ({ page }) => {
    await gotoApp(page);
    await goBudgetTab(page, 'Ledger');
    const fx = page.locator('.fx-table');
    await expect(fx).toContainText('1 USD =');
    await expect(fx).toContainText('1 GBP =');
    await expect(fx).toContainText('1 CHF =');
    const row = expenseRow(page, 'Nice airport tram'); // 8 EUR, EUR already
    const eurBefore = await row.locator('td').nth(7).innerText(); // "In EUR" column
    expect(eurBefore.trim()).toBe('8.00 EUR');
    await row.locator('select.mini-sel').first().selectOption('USD');
    const eurAfter = await row.locator('td').nth(7).innerText();
    // toEur() multiplies the stored amount by FX[currency] (units of that
    // currency per 1 EUR per the FX table): 8 * 0.92 = 7.36 EUR.
    const expected = (8 * 0.92).toFixed(2) + ' EUR';
    expect(eurAfter.trim()).toBe(expected);
  });

  test('1.41 split_mode_toggle_changes_balances', async ({ page }) => {
    await gotoApp(page);
    await goBudgetTab(page, 'Ledger');
    // "Old Town lunch" is per-capita, 64 EUR, payer Ava.
    const row = expenseRow(page, 'Old Town lunch');
    await row.locator('.mini-sel').nth(1).selectOption('weighted');
    await expect(row.locator('.weight-inline')).toBeVisible();
    await goBudgetTab(page, 'Settle up');
    // With weighted split and default weights (1 each), balances are unchanged
    // from per-capita until a weight is edited — instead verify a genuinely
    // asymmetric case: set unequal weights, then confirm balances move.
    await goBudgetTab(page, 'Ledger');
    const inputs = row.locator('.weight-inline input');
    await inputs.nth(0).fill('4'); await inputs.nth(0).blur(); // Ava weight much higher
    await inputs.nth(1).fill('1'); await inputs.nth(1).blur();
    await inputs.nth(2).fill('1'); await inputs.nth(2).blur();
    await inputs.nth(3).fill('1'); await inputs.nth(3).blur();
    await goBudgetTab(page, 'Settle up');
    const avaBal = page.locator('.bal-row', { hasText: 'Ava' }).locator('.amt');
    // Ava paid the 64 EUR expense (fronted) but now owes 4/7 of it instead of
    // 1/4 (16 EUR) under per-capita — her net position must differ from a
    // fresh reload's per-capita baseline.
    await page.reload();
    await goBudgetTab(page, 'Settle up');
    const avaBalBaseline = await page.locator('.bal-row', { hasText: 'Ava' }).locator('.amt').innerText();
    await expect(avaBal).not.toHaveText(avaBalBaseline);
  });

  test('1.42 debt_visualizer_minimum_transactions', async ({ page }) => {
    await gotoApp(page);
    await goBudgetTab(page, 'Settle up');
    const pill = page.locator('.phead', { hasText: 'Who owes whom' }).locator('.count-pill');
    const txt = await pill.innerText();
    const m = txt.match(/(\d+)/);
    expect(m).not.toBeNull();
    const txCount = Number(m[1]);
    // 4 travelers means at most 3 minimum transactions ever needed; the naive
    // per-expense pairing would be far larger (12 seeded expenses).
    expect(txCount).toBeLessThanOrEqual(3);
    expect(txCount).toBeGreaterThan(0);
    await expect(page.locator('.settle-item')).toHaveCount(txCount);
  });

  test('1.43 settlement_checklist_updates_balances', async ({ page }) => {
    await gotoApp(page);
    await goBudgetTab(page, 'Settle up');
    const item = page.locator('.settle-item').first();
    const balBefore = await page.locator('.bal-row').first().locator('.amt').innerText();
    const netLabelBefore = await page.locator('.chart-wrap svg[aria-label]').getAttribute('aria-label');
    await item.locator('input[type="checkbox"]').check();
    await expect(item).toHaveClass(/done/);
    const balAfter = page.locator('.bal-row').first().locator('.amt');
    await expect(balAfter).not.toHaveText(balBefore);
    // the debt visualizer excludes the now-settled transaction, so its
    // outstanding-transaction summary changes too (fewer transactions, a
    // different amount, or "all settled up" if that was the only one)
    const netLabelAfter = page.locator('.chart-wrap svg[aria-label]');
    await expect(netLabelAfter).not.toHaveAttribute('aria-label', netLabelBefore);
  });

  test('1.44 burn_rate_chart_ceiling_and_projection', async ({ page }) => {
    await gotoApp(page);
    await goBudgetTab(page, 'Ledger');
    const chart = page.locator('.chart-wrap svg[aria-label*="Burn rate chart"]');
    await expect(chart).toBeVisible();
    const label = await chart.getAttribute('aria-label');
    expect(label).toContain('4500 EUR ceiling');
    await expect(chart.locator('.ceil-line')).toHaveCount(1);
    // Seeded projected end (~3751 EUR) sits under the 4500 ceiling, so no
    // overage region exists yet — the honest, verifiable claim at this point
    // is that it's absent.
    await expect(chart.locator('.overage')).toHaveCount(0);
    // Push the projection over the ceiling with a real added expense and
    // confirm the overage region now renders.
    await openAddExpense(page);
    const modal = page.locator('.modal.wide');
    await modal.locator('#ef-desc').fill('Overage Trigger');
    await modal.locator('#ef-amt').fill('3000');
    await modal.locator('#ef-day').selectOption('2025-07-07'); // mid-trip, so the
    // crossing isn't confined to the very last data point
    await expenseSubmitButton(page).click();
    await expect(page.locator('.modal.wide')).toHaveCount(0);
    const chart2 = page.locator('.chart-wrap svg[aria-label*="Burn rate chart"]');
    await expect(chart2.locator('.overage')).toHaveCount(1);
  });

  test('1.45 category_pie_redraws_on_change', async ({ page }) => {
    await gotoApp(page);
    await goBudgetTab(page, 'Ledger');
    const donut = page.locator('.donut-row svg[aria-label*="Cost allocation"]');
    const before = await donut.getAttribute('aria-label');
    const row = expenseRow(page, 'Menton gelato'); // Food category, 18 EUR
    await row.getByRole('button', { name: /Edit/ }).click();
    const modal = page.locator('.modal.wide');
    await modal.locator('#ef-cat').selectOption('Activities');
    await expenseSubmitButton(page).click();
    await expect(page.locator('.modal.wide')).toHaveCount(0);
    const after = page.locator('.donut-row svg[aria-label*="Cost allocation"]');
    await expect(after).not.toHaveAttribute('aria-label', before);
  });

  test('1.46 paste_parser_highlights_and_drafts', async ({ page }) => {
    await gotoApp(page);
    await goBudgetTab(page, 'Ingest');
    const ta = page.getByLabel('Paste confirmation text to parse');
    await ta.fill('Hotel Azure, ref HZ-48215, 07/08, EUR 240.00');
    const out = page.locator('.parse-out');
    await expect(out.locator('mark')).not.toHaveCount(0);
    await expect(out.locator('mark.code')).toContainText('HZ-48215');
    const draft = page.locator('.draft-item').first();
    await expect(draft).toContainText('240.00');
    const before = await page.locator('table.ledger tbody tr').count().catch(() => 0);
    await draft.getByRole('button', { name: 'Add to ledger' }).click();
    await expect(page.locator('.toast')).toContainText('Added to ledger');
    await goBudgetTab(page, 'Ledger');
    await expect(page.locator('table.ledger tbody tr')).toHaveCount(SEEDED_EXPENSE_COUNT + 1);
  });

  test('1.47 csv_wizard_mapping_and_diagnostics', async ({ page }) => {
    await gotoApp(page);
    await goBudgetTab(page, 'Ingest');
    await page.getByRole('button', { name: /CSV import wizard/ }).click();
    const modal = page.locator('.modal.wide');
    const csv = 'description,amount,currency,day,category,payer\nFerry to Iles de Lerins,16,EUR,2025-07-07,Transit,Chloe\nMuseum audio guide,abc,EUR,2025-07-08,Activities,Dan';
    await modal.locator('textarea').fill(csv);
    await modal.getByRole('button', { name: 'Map columns' }).click();
    await modal.getByRole('button', { name: 'Review rows' }).click();
    const rows = modal.locator('.diag-row');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).not.toHaveClass(/bad/);
    await expect(rows.nth(1)).toHaveClass(/bad/);
    const commitBefore = await modal.getByRole('button', { name: /Commit \d+ row/ }).innerText();
    expect(commitBefore).toContain('Commit 1 row');
    const fixInput = rows.nth(1).locator('.fix input');
    await fixInput.fill('12.50');
    await fixInput.blur();
    await expect(rows.nth(1)).not.toHaveClass(/bad/);
    const commitAfter = await modal.getByRole('button', { name: /Commit \d+ row/ }).innerText();
    expect(commitAfter).toContain('Commit 2 row');
    await modal.getByRole('button', { name: /Commit 2 row/ }).click();
    await expect(page.locator('.modal.wide')).toHaveCount(0);
    await goBudgetTab(page, 'Ledger');
    await expect(page.locator('table.ledger tbody tr')).toHaveCount(SEEDED_EXPENSE_COUNT + 2);
  });

  test('1.48 template_injector_seeds_sample_trip', async ({ page }) => {
    await gotoApp(page);
    await goBudgetTab(page, 'Ingest');
    await page.getByRole('button', { name: /Load a sample trip/ }).click();
    await page.getByRole('button', { name: 'Load sample trip' }).click();
    await expect(page.locator('.toast')).toContainText('Sample trip loaded');
    await goBudgetTab(page, 'Ledger');
    await expect(page.locator('table.ledger tbody tr')).toHaveCount(SEEDED_EXPENSE_COUNT + 2);
    await expect(expenseRow(page, 'Iles de Lerins ferry')).toBeVisible();
    await page.getByRole('button', { name: 'Plan List' }).click();
    await expect(stopRow(page, 'Iles de Lerins Ferry')).toBeVisible();
    await expect(stopRow(page, 'Villa Ephrussi Gardens')).toBeVisible();
  });

  test('1.49 receipt_scanner_draft_expense', async ({ page }) => {
    await gotoApp(page);
    await goBudgetTab(page, 'Ingest');
    await page.getByRole('button', { name: /Receipt scanner/ }).click();
    const modal = page.locator('.modal.wide');
    await modal.getByRole('button', { name: 'Use sample receipt' }).click();
    await expect(modal.locator('.receipt-stage')).toBeVisible();
    await expect(modal.locator('.receipt-stage .bbox')).not.toHaveCount(0);
    await expect(modal.getByLabel('Extracted cost')).toHaveValue('19.00');
    await expect(modal.getByLabel('Extracted date')).toHaveValue('2025-07-10');
    const before = SEEDED_EXPENSE_COUNT;
    await modal.getByRole('button', { name: /Add draft expense/ }).click();
    await expect(page.locator('.toast')).toContainText('Receipt added');
    await goBudgetTab(page, 'Ledger');
    await expect(page.locator('table.ledger tbody tr')).toHaveCount(before + 1);
  });

  test('1.50 spreadsheet_keyboard_matrix_inline_edit', async ({ page }) => {
    await gotoApp(page);
    await goBudgetTab(page, 'Spreadsheet');
    const grid = page.locator('table.ss');
    const cellA = grid.locator('#cell-0-0');
    await cellA.click();
    await expect(cellA).toHaveClass(/active/);
    // Re-focus the now-active cell explicitly before sending arrow keys: a
    // plain click does not leave the DOM focused (the grid fully re-renders
    // on every state change), so this establishes the keyboard-focused
    // starting point a real keyboard user would already be at.
    await grid.locator('#cell-0-0').focus();
    await page.keyboard.press('ArrowRight');
    await expect(grid.locator('#cell-0-1')).toHaveClass(/active/);
    await expect(cellA).not.toHaveClass(/active/);
    await page.keyboard.press('Enter');
    const editor = grid.locator('#cell-0-1 input.cell, #cell-0-1 select.cell');
    await expect(editor).toBeVisible();
    await editor.focus();
    await editor.press('Escape');
    await expect(grid.locator('#cell-0-1.editing')).toHaveCount(0);
    // commit a real edit: description cell of row 1 (col 0)
    await cellA.dblclick();
    const inp = grid.locator('#cell-0-0 input.cell');
    await inp.fill('Renamed Via Spreadsheet');
    await inp.press('Enter');
    await goBudgetTab(page, 'Ledger');
    await expect(page.locator('table.ledger')).toContainText('Renamed Via Spreadsheet');
  });

  test('1.51 formula_bar_sum_and_average', async ({ page }) => {
    await gotoApp(page);
    await goBudgetTab(page, 'Spreadsheet');
    const formula = page.getByLabel('Formula bar');
    await formula.fill('=SUM(E1:E12)');
    const result = page.locator('.result');
    await expect(result).not.toHaveText('');
    const sumText = await result.innerText();
    const sum = Number(sumText);
    expect(Number.isFinite(sum)).toBe(true);
    await formula.fill('');
    await formula.fill('=AVERAGE(E1:E12)');
    const avgText = await result.innerText();
    const avg = Number(avgText);
    expect(Math.abs(avg - sum / 12)).toBeLessThan(0.01);
  });

  test('1.52 pivot_category_by_day_summaries', async ({ page }) => {
    await gotoApp(page);
    await goBudgetTab(page, 'Spreadsheet');
    const pivot = page.locator('.pivot-grid');
    await expect(pivot.locator('thead th')).toContainText(['', 'Sun, 7/5', 'Mon, 7/6', 'Tue, 7/7', 'Wed, 7/8', 'Thu, 7/9', 'Fri, 7/10', 'Sat, 7/11', 'Total']);
    const before = await pivot.locator('tbody tr').first().locator('td').first().innerText();
    await page.locator('.seg', { hasText: 'Day × Category' }).getByRole('button', { name: 'Day × Category' }).click();
    const after = await pivot.locator('thead th').allInnerTexts();
    expect(after.join(',')).toContain('Lodging');
    expect(after.join(',')).toContain('Food');
  });

  test('1.53 display_currency_toggle_non_mutating', async ({ page }) => {
    await gotoApp(page);
    await goBudgetTab(page, 'Ledger');
    const spentKpi = page.locator('.kpi').first().locator('.val');
    const eurValue = await spentKpi.innerText();
    await page.locator('.seg[aria-label*="Display currency"]').getByRole('button', { name: 'USD' }).click();
    await expect(spentKpi).not.toHaveText(eurValue);
    await expect(spentKpi).toContainText('USD');
    await page.locator('.seg[aria-label*="Display currency"]').getByRole('button', { name: 'EUR' }).click();
    await expect(spentKpi).toHaveText(eurValue);
  });

  test('1.54 bulk_mutation_tray_applies_to_selection', async ({ page }) => {
    await gotoApp(page);
    await goBudgetTab(page, 'Ledger');
    const rows = page.locator('table.ledger tbody tr');
    await rows.nth(0).locator('input.rowcheck').check();
    await rows.nth(1).locator('input.rowcheck').check();
    const targetDesc0 = await rows.nth(0).locator('td.desc-cell').innerText();
    const targetDesc1 = await rows.nth(1).locator('td.desc-cell').innerText();
    const untouchedDesc = await rows.nth(2).locator('td.desc-cell').innerText();
    const tray = page.locator('.tray');
    await expect(tray).toHaveClass(/show/);
    await expect(tray.locator('.n')).toHaveText('2 selected');
    await tray.locator('select[aria-label="Recategorize selection"]').selectOption('Transit');
    await tray.getByRole('button', { name: 'Recategorize' }).click();
    await expect(page.locator('table.ledger tbody tr', { hasText: targetDesc0 }).locator('td').nth(3)).toHaveText('Transit');
    await expect(page.locator('table.ledger tbody tr', { hasText: targetDesc1 }).locator('td').nth(3)).toHaveText('Transit');
    const untouchedCat = page.locator('table.ledger tbody tr', { hasText: untouchedDesc }).locator('td').nth(3);
    await expect(untouchedCat).not.toHaveText('');
  });

  test('1.55 threshold_caps_flag_rows', async ({ page }) => {
    await gotoApp(page);
    await goBudgetTab(page, 'Ledger');
    // Food category total from seed is well above 10 EUR.
    const capInput = page.getByLabel('Cap for Food in EUR');
    await capInput.fill('10');
    await capInput.blur();
    const flagged = page.locator('table.ledger tbody tr.flagged');
    await expect(flagged.first()).toBeVisible();
    await expect(flagged.first().locator('.flag')).toContainText('Over cap');
    await expect(flagged.first().locator('.flag svg')).toBeVisible();
  });

  test('1.56 markdown_notes_render_and_toggle', async ({ page }) => {
    await gotoApp(page);
    await page.getByRole('button', { name: 'Notes', exact: true }).first().click();
    const ta = page.getByLabel('Markdown note editor');
    await ta.fill('# Packing\n\n- Sunhat\n- Sunscreen\n- [ ] Passport\n- [x] Tickets\n');
    const preview = page.locator('.md-preview');
    await expect(preview.locator('h1')).toHaveText('Packing');
    await expect(preview.locator('ul:not(.chk-list) li')).toHaveCount(2); // Sunhat, Sunscreen
    await expect(preview.locator('ul.chk-list li')).toHaveCount(2); // Passport, Tickets
    const checkbox = preview.locator('input[data-mdchk]').first(); // "Passport", unchecked
    await expect(checkbox).not.toBeChecked();
    await checkbox.click();
    await expect(checkbox).toBeChecked();
    // the toggle writes back into the markdown source, not just the preview
    await expect(ta).toHaveValue(/\[x\] Passport/);
  });

  test('1.57 packing_list_progress_updates', async ({ page }) => {
    await gotoApp(page);
    await page.getByRole('button', { name: 'Notes', exact: true }).first().click();
    await page.locator('[role="tab"]', { hasText: 'Packing' }).click();
    const cat = page.locator('.pack-cat', { hasText: 'Documents' });
    const progBefore = cat.locator('.prog');
    await expect(progBefore).toHaveText('2/4 packed');
    const barBefore = await cat.locator('.pack-bar i').evaluate((el) => el.style.width);
    await cat.locator('.pack-item', { hasText: 'Driving licence' }).locator('input').check();
    await expect(cat.locator('.prog')).toHaveText('3/4 packed');
    const barAfter = await cat.locator('.pack-bar i').evaluate((el) => el.style.width);
    expect(barAfter).not.toBe(barBefore);
  });

  test('1.58 gallery_drawer_reorder_and_captions', async ({ page }) => {
    await gotoApp(page);
    await stopRow(page, 'Eze Village').click();
    await page.locator('.detail-card').getByRole('button', { name: /Gallery/ }).click();
    const drawer = page.locator('.drawer');
    await expect(drawer).toBeVisible();
    const captions = drawer.locator('.gallery-item .cap input');
    const firstCaptionBefore = await captions.nth(0).inputValue();
    await captions.nth(0).fill('My custom caption');
    await captions.nth(0).blur();
    const items = drawer.locator('.gallery-item');
    const secondCaptionBefore = await items.nth(1).locator('.cap input').inputValue();
    await items.nth(1).locator('button[aria-label="Move image left"]').click();
    // after reordering, position 0's caption should now be what was in position 1
    const firstCaptionAfterReorder = items.nth(0).locator('.cap input');
    await expect(firstCaptionAfterReorder).toHaveValue(secondCaptionBefore);
  });

  test('1.59 link_preview_cards_in_notes', async ({ page }) => {
    await gotoApp(page);
    await page.getByRole('button', { name: 'Notes', exact: true }).first().click();
    const ta = page.getByLabel('Markdown note editor');
    await ta.fill('Check https://www.example.com/harbour for details');
    const preview = page.locator('.md-preview');
    const card = preview.locator('.link-card');
    await expect(card).toBeVisible();
    await expect(card).toContainText('example.com');
    await card.click();
    await expect(page).toHaveURL(BASE + '/');
    await expect(page.locator('.toast')).toContainText('Link preview');
  });

  test('1.60 custom_field_builder_appears_everywhere', async ({ page }) => {
    await gotoApp(page);
    await page.getByRole('button', { name: 'Notes', exact: true }).first().click();
    await page.locator('[role="tab"]', { hasText: 'Custom fields' }).click();
    await page.getByLabel('Custom field name').fill('Priority');
    await page.getByLabel('Custom field type').selectOption('rating');
    await page.getByRole('button', { name: /Add custom field/ }).click();
    await expect(page.locator('.toast')).toContainText('Custom field added');
    await page.getByRole('button', { name: 'Explore', exact: true }).click();
    await expect(page.locator('.stop-row').first().locator('.cf-row')).toContainText('Priority');
    await goBudgetTab(page, 'Ledger');
    await expect(page.locator('table.ledger thead')).toContainText('Priority');
    await goBudgetTab(page, 'Spreadsheet');
    // header is a bare <tr> (no <thead> wrapper); the 7th column letter "G"
    // only appears once the custom field adds a 7th spreadsheet column.
    await expect(page.locator('table.ss tr').first()).toContainText('G');
  });

  test('1.61 undo_redo_structural_changes', async ({ page }) => {
    await gotoApp(page);
    const before = await page.locator('.stop-row').count();
    await openAddStopForDay(page, 'Sun, 7/5');
    await fillStopForm(page, { title: 'Undo Redo Stop', day: '2025-07-05', category: 'other' });
    await stopSubmitButton(page).click();
    await expect(page.locator('.stop-row')).toHaveCount(before + 1);
    await page.getByRole('button', { name: 'Undo last change' }).click();
    await expect(page.locator('.stop-row')).toHaveCount(before);
    await expect(stopRow(page, 'Undo Redo Stop')).toHaveCount(0);
    await page.getByRole('button', { name: 'Redo change' }).click();
    await expect(page.locator('.stop-row')).toHaveCount(before + 1);
    await expect(stopRow(page, 'Undo Redo Stop')).toHaveCount(1);
  });

  test('1.62 factory_reset_confirm_and_cancel', async ({ page }) => {
    await gotoApp(page);
    await openAddStopForDay(page, 'Sun, 7/5');
    await fillStopForm(page, { title: 'Reset Test Stop', day: '2025-07-05', category: 'other' });
    await stopSubmitButton(page).click();
    await expect(page.locator('.stop-row')).toHaveCount(SEEDED_STOP_COUNT + 1);
    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('button', { name: /Factory reset trip/ }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.locator('.stop-row')).toHaveCount(SEEDED_STOP_COUNT + 1);
    await expect(stopRow(page, 'Reset Test Stop')).toHaveCount(1);
    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('button', { name: /Factory reset trip/ }).click();
    await page.getByRole('button', { name: 'Reset trip' }).click();
    await expect(page.locator('.stop-row')).toHaveCount(SEEDED_STOP_COUNT);
    await expect(stopRow(page, 'Reset Test Stop')).toHaveCount(0);
  });

  test('1.63 theme_toggle_restyles_all_panes', async ({ page }) => {
    await gotoApp(page);
    const sidebarBgLight = await page.locator('.sidebar').evaluate((el) => getComputedStyle(el).backgroundColor);
    await page.getByRole('button', { name: 'Switch to dark theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const sidebarBgDark = await page.locator('.sidebar').evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(sidebarBgDark).not.toBe(sidebarBgLight);
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.mappane')).toBeVisible();
    await goBudgetTab(page, 'Ledger');
    const panelBgDark = await page.locator('.panel').first().evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(panelBgDark).not.toBe(sidebarBgLight);
  });

  test('1.64 settlement_report_live_copy', async ({ page }) => {
    await gotoApp(page);
    await goBudgetTab(page, 'Settle up');
    await page.getByRole('button', { name: 'Settlement report' }).click();
    const drawer = page.locator('.drawer');
    const report = drawer.locator('.report');
    for (const p of ['Ava', 'Ben', 'Chloe', 'Dan']) await expect(report).toContainText(p);
    await expect(report).toContainText('Minimum settle-up transactions');
    await drawer.getByRole('button', { name: /Copy settlement report/ }).click();
    await expect(page.locator('.toast')).toContainText('Copied');
  });

  test('1.65 budget_summary_live_copy', async ({ page }) => {
    await gotoApp(page);
    await goBudgetTab(page, 'Reports');
    const panel = page.locator('.panel', { hasText: 'Budget summary' });
    await expect(panel).toContainText('4,500.00 EUR');
    await expect(panel).toContainText('Projected end');
    await panel.getByRole('button', { name: /Copy budget summary/ }).click();
    await expect(page.locator('.toast')).toContainText('Copied');
  });

  test('1.66 stop_field_contract_enforced', async ({ page }) => {
    await gotoApp(page);
    // Branches reachable through the real form UI: endTime <= startTime.
    // (title maxlength="80" and the day/category <select> closed enums make
    // the "over 80 chars" / "outside the enum" branches unreachable by typing
    // into the real form — those are exercised below via the documented
    // webmcp form_validate tool, which runs the same validateStop() the form
    // uses, rather than being skipped or faked through the DOM.)
    await openAddStopForDay(page, 'Sun, 7/5');
    const modal = page.locator('.modal.wide');
    await modal.locator('#sf-title').fill('Valid Title');
    await modal.locator('#sf-start').fill('14:00');
    await modal.locator('#sf-end').fill('13:00');
    await expect(modal.locator('#sf-end-err')).toContainText('strictly after start time');
    await expect(stopSubmitButton(page)).toBeDisabled();
    await modal.locator('#sf-end').fill('15:00');
    await expect(stopSubmitButton(page)).toBeEnabled();
    await page.keyboard.press('Escape');

    const overLong = await invokeTool(page, 'form_validate', { fields: { title: 'x'.repeat(81), day: '2025-07-05', category: 'sightseeing' } });
    expect(overLong.valid).toBe(false);
    expect(overLong.errors.title).toContain('80 characters or fewer');
    const badDay = await invokeTool(page, 'form_validate', { fields: { title: 'Ok', day: '1999-01-01', category: 'sightseeing' } });
    expect(badDay.valid).toBe(false);
    expect(badDay.errors.day).toContain('seven trip dates');
    const badCategory = await invokeTool(page, 'form_validate', { fields: { title: 'Ok', day: '2025-07-05', category: 'nonsense' } });
    expect(badCategory.valid).toBe(false);
    expect(badCategory.errors.category).toContain('Category must be');
  });

  test('1.67 expense_field_contract_enforced', async ({ page }) => {
    await gotoApp(page);
    // Branches reachable through the real form UI: empty description,
    // non-positive amount, and weighted split with invalid weights.
    // (currency/day/category/payer/splitMode are closed <select> enums in
    // the real form — the UI structurally cannot submit an out-of-enum
    // value for them, and there is no documented webmcp validator for
    // expenses, so those specific branches are not claimed as tested here.)
    await goBudgetTab(page, 'Ledger');
    await openAddExpense(page);
    const modal = page.locator('.modal.wide');
    await expect(expenseSubmitButton(page)).toBeDisabled();
    await expect(modal.locator('#ef-desc-err')).toContainText('Description is required');
    await modal.locator('#ef-desc').fill('Test Expense');
    await modal.locator('#ef-amt').fill('0');
    await expect(modal.locator('#ef-amt-err')).toContainText('greater than 0');
    await modal.locator('#ef-amt').fill('25');
    await modal.locator('#ef-split').selectOption('weighted');
    const wInputs = modal.locator('#ef-weights-shell input');
    for (let i = 0; i < 4; i++) { await wInputs.nth(i).fill('0'); await wInputs.nth(i).blur(); }
    // weight edits are validated on submit attempt (rejected, not silently
    // dropped): the click is a no-op and surfaces the named error.
    await expenseSubmitButton(page).click();
    await expect(modal.locator('#ef-weights-err')).toContainText('greater than 0');
    await expect(expenseSubmitButton(page)).toBeDisabled();
    await expect(page.locator('.modal.wide')).toHaveCount(1); // rejected, not submitted
  });

  test('1.68 ics_payload_valid_structure', async ({ page }) => {
    await gotoApp(page);
    await page.getByRole('button', { name: 'Export trip files' }).click();
    const modal = page.locator('.modal.wide');
    await modal.locator('.export-tabs [role="tab"]', { hasText: 'ICS' }).click();
    const text = await modal.locator('.export-pre').innerText();
    expect(text.startsWith('BEGIN:VCALENDAR')).toBe(true);
    expect(text.trim().endsWith('END:VCALENDAR')).toBe(true);
    const veventCount = (text.match(/BEGIN:VEVENT/g) || []).length;
    expect(veventCount).toBe(SEEDED_STOP_COUNT); // every seeded stop has a startTime
    expect((text.match(/DTSTART:/g) || [])).toHaveLength(veventCount);
    expect(text).toContain('SUMMARY:Musee Picasso');
  });

  test('1.69 trip_json_schema_and_live_compile', async ({ page }) => {
    await gotoApp(page);
    await openAddStopForDay(page, 'Sun, 7/5');
    await fillStopForm(page, { title: 'Export Test Stop', day: '2025-07-05', category: 'other' });
    await stopSubmitButton(page).click();
    await goBudgetTab(page, 'Ledger');
    await openAddExpense(page);
    const modal = page.locator('.modal.wide');
    await modal.locator('#ef-desc').fill('Export Test Expense');
    await modal.locator('#ef-amt').fill('42');
    await expenseSubmitButton(page).click();
    await page.getByRole('button', { name: 'Export trip files' }).click();
    const exportModal = page.locator('.modal.wide');
    await exportModal.locator('.export-tabs [role="tab"]', { hasText: 'Trip JSON' }).click();
    const text = await exportModal.locator('.export-pre').innerText();
    const obj = JSON.parse(text);
    expect(obj.schemaVersion).toBe('1');
    expect(obj.trip.dateStart).toBe('2025-07-05');
    expect(obj.trip.dateEnd).toBe('2025-07-11');
    expect(obj.trip.budgetCeilingEur).toBe(4500);
    expect(obj.stops.some((s) => s.title === 'Export Test Stop')).toBe(true);
    expect(obj.expenses.some((x) => x.description === 'Export Test Expense' && x.amount === 42)).toBe(true);
  });

  test('1.70 markdown_export_live_day_headings', async ({ page }) => {
    await gotoApp(page);
    await page.getByRole('button', { name: 'Export trip files' }).click();
    const modal = page.locator('.modal.wide');
    let text = await modal.locator('.export-pre').innerText();
    const headingOrder = [...text.matchAll(/## (\w+), (\d+\/\d+)/g)].map((m) => m[2]);
    expect(headingOrder).toEqual(['7/5', '7/6', '7/7', '7/8', '7/9', '7/10', '7/11']);
    expect(text).toContain('Musee Picasso');
    await modal.locator('.mfoot').getByRole('button', { name: 'Close', exact: true }).click();
    await stopRow(page, 'Eze Village').getByRole('button', { name: /Edit/ }).click();
    const editModal = page.locator('.modal.wide');
    await editModal.locator('#sf-title').fill('');
    await editModal.locator('#sf-title').fill('Eze Village Renamed');
    await stopSubmitButton(page).click();
    await page.getByRole('button', { name: 'Export trip files' }).click();
    text = await page.locator('.modal.wide .export-pre').innerText();
    expect(text).toContain('Eze Village Renamed');
    expect(text).not.toContain('Eze Village\n');
  });

  test('1.71 download_and_copy_trip_artifacts', async ({ page }) => {
    await gotoApp(page);
    await page.getByRole('button', { name: 'Export trip files' }).click();
    const modal = page.locator('.modal.wide');
    const previewText = await modal.locator('.export-pre').innerText();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      modal.getByRole('button', { name: /Download markdown/ }).click(),
    ]);
    expect(download.suggestedFilename()).toBe('riviera-trip.markdown');
    await expect(page.locator('.toast')).toContainText('Downloaded');
    await page.locator('.toast .x').first().click();
    await expect(page.locator('.toast')).toHaveCount(0);
    await modal.getByRole('button', { name: /Copy markdown/ }).click();
    await expect(page.locator('.toast')).toContainText('Copied');
    await page.locator('.toast .x').first().click();
    await expect(page.locator('.toast')).toHaveCount(0);
    await modal.locator('.export-tabs [role="tab"]', { hasText: 'ICS' }).click();
    const [icsDownload] = await Promise.all([
      page.waitForEvent('download'),
      modal.getByRole('button', { name: /Download ics/ }).click(),
    ]);
    expect(icsDownload.suggestedFilename()).toBe('riviera-trip.ics');
  });
});

test.describe('technical', () => {
  test('2.1 shared_state_coherence_across_panes', async ({ page }) => {
    await gotoApp(page);
    await dayNavButton(page, 'Thu 7/9').click();
    await expect(page.locator('.day-section')).toHaveCount(1);
    await stopRow(page, 'Eze Village').click();
    await expect(page.locator('.detail-card')).toContainText('Eze Village');
    await expect(page.locator('.stop-row[aria-pressed="true"]')).toContainText('Eze Village');
    await page.locator('.detail-card [role="tab"]', { hasText: 'Photos' }).click();
    await expect(page.locator('.detail-card [role="tab"][aria-selected="true"]')).toHaveText('Photos');
  });

  test('2.5 hydration_clean_console', async ({ page }) => {
    // As with 1.16, the canonical fixture asserts zero console errors across
    // the whole test at teardown; this test's job is to exercise navigation
    // plus a reload (the classic hydration-mismatch trigger) and confirm the
    // app is still the same coherent workspace afterward.
    await gotoApp(page);
    await page.getByRole('button', { name: 'Budget', exact: true }).click();
    await page.getByRole('button', { name: 'Notes', exact: true }).first().click();
    await page.getByRole('button', { name: 'Explore', exact: true }).click();
    await page.reload();
    await expect(page.locator('.stop-row')).toHaveCount(SEEDED_STOP_COUNT);
    await expect(page.locator('.sidebar')).toBeVisible();
  });

  test('2.6 deep_link_renders_same_workspace', async ({ page }) => {
    await gotoApp(page);
    await expect(page.locator('.stop-row')).toHaveCount(SEEDED_STOP_COUNT);
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.topbar')).toBeVisible();
    const response = await page.goto(BASE);
    expect(response.status()).toBeLessThan(400);
    await expect(page.locator('.stop-row')).toHaveCount(SEEDED_STOP_COUNT);
  });

  test('2.8 interactive_within_two_seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE, { waitUntil: 'commit' });
    const remaining = 2000 - (Date.now() - start);
    expect(remaining, 'navigation committed before the interaction deadline').toBeGreaterThan(0);
    await page.getByRole('button', { name: 'Map', exact: true }).click({ timeout: remaining });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(2000);
    await expect(page.locator('.mappane')).toBeVisible();
  });

  test('2.9 rapid_input_stays_responsive', async ({ page }) => {
    await gotoApp(page);
    for (let i = 0; i < 5; i++) {
      await dayNavButton(page, 'Mon 7/6').click();
      await page.getByRole('button', { name: 'Show all days' }).click();
    }
    await expect(page.locator('.day-section')).toHaveCount(7);
    for (const tab of ['Ledger', 'Spreadsheet', 'Settle up', 'Ingest', 'Reports', 'Ledger']) {
      await goBudgetTab(page, tab);
    }
    await expect(page.locator('table.ledger tbody tr')).toHaveCount(SEEDED_EXPENSE_COUNT);
  });

  test('2.10 keyboard_operable_with_focus_ring', async ({ page }) => {
    await gotoApp(page);
    const hasVisibleRing = async (locator) => {
      const cs = await locator.evaluate((el) => {
        const s = getComputedStyle(el);
        return { outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth, boxShadow: s.boxShadow };
      });
      const outlineSignal = Number(cs.outlineStyle !== 'none') * parseFloat(cs.outlineWidth);
      const shadowSignal = Number(cs.boxShadow !== 'none');
      return outlineSignal + shadowSignal;
    };
    // sidebar item
    const navExplore = page.getByRole('button', { name: 'Explore', exact: true });
    await navExplore.focus();
    await expect(navExplore).toBeFocused();
    expect(await hasVisibleRing(navExplore)).toBeGreaterThan(0);
    // mode switch
    const mapMode = page.getByRole('button', { name: 'Map', exact: true });
    await mapMode.focus();
    await expect(mapMode).toBeFocused();
    expect(await hasVisibleRing(mapMode)).toBeGreaterThan(0);
    await page.keyboard.press('Enter');
    await expect(page.locator('.mappane')).toBeVisible();
    // day filter item, activated purely by keyboard
    const dayItem = dayNavButton(page, 'Mon 7/6');
    await dayItem.focus();
    await page.keyboard.press('Enter');
    await expect(dayItem).toHaveAttribute('aria-pressed', 'true');
    // form field inside the stop create modal
    await page.getByRole('button', { name: 'Show all days' }).click();
    await openAddStopForDay(page, 'Sun, 7/5');
    const titleField = page.locator('#sf-title');
    await expect(titleField).toBeFocused(); // form auto-focuses the first field on open
    expect(await hasVisibleRing(titleField)).toBe(true);
  });

  test('2.11 detail_tabs_keyboard_and_selected_state', async ({ page }) => {
    await gotoApp(page);
    const aboutTab = page.locator('.detail-card [role="tab"]', { hasText: 'About' });
    await aboutTab.focus();
    await expect(aboutTab).toHaveAttribute('aria-selected', 'true');
    await expect(aboutTab).toHaveAttribute('tabindex', '0');
    // reached and activated purely from the keyboard while focused
    await page.keyboard.press('ArrowRight');
    const bookTab = page.locator('.detail-card [role="tab"]', { hasText: 'Book' });
    await expect(bookTab).toHaveAttribute('aria-selected', 'true');
    await expect(aboutTab).toHaveAttribute('aria-selected', 'false');
    // the active tab is programmatically distinguishable via roving tabindex
    await expect(bookTab).toHaveAttribute('tabindex', '0');
    await expect(aboutTab).toHaveAttribute('tabindex', '-1');
    // and the panel content actually swapped to the newly-activated tab
    await expect(page.locator('.detail-card .panel')).toContainText('Live booking is not connected');
  });

  test('2.12 validation_messages_associated_with_fields', async ({ page }) => {
    await gotoApp(page);
    await openAddStopForDay(page, 'Sun, 7/5');
    const modal = page.locator('.modal.wide');
    const title = modal.locator('#sf-title');
    await expect(title).toHaveAttribute('aria-describedby', 'sf-title-err');
    await expect(modal.locator('#sf-title-err')).toHaveAttribute('role', 'alert');
    await expect(title).toHaveAttribute('aria-invalid', 'true');
  });

  test('2.13 toasts_announced_via_live_region', async ({ page }) => {
    await gotoApp(page);
    await page.getByRole('button', { name: 'Share', exact: true }).click();
    const live = page.locator('#sr-live');
    await expect(live).toHaveAttribute('aria-live', 'polite');
    await expect(live).toContainText('Share trip');
  });

  test('2.15 derived_money_surfaces_agree', async ({ page }) => {
    await gotoApp(page);
    await goBudgetTab(page, 'Ledger');
    const ledgerTotal = await page.locator('.phead .count-pill').first().innerText();
    const donutLabel = await page.locator('.donut-row svg').getAttribute('aria-label');
    const donutSum = [...donutLabel.matchAll(/([\d.]+) EUR/g)].reduce((a, m) => a + Number(m[1]), 0);
    const ledgerEur = Number(ledgerTotal.replace(/[^0-9.]/g, ''));
    expect(Math.abs(donutSum - ledgerEur)).toBeLessThan(0.05);
    await goBudgetTab(page, 'Reports');
    const summary = await page.locator('.panel', { hasText: 'Budget summary' }).innerText();
    const spentMatch = summary.match(/Spent to date\s+([\d,.]+) EUR/);
    expect(spentMatch).not.toBeNull();
    const spentVal = Number(spentMatch[1].replace(/,/g, ''));
    expect(Math.abs(spentVal - ledgerEur)).toBeLessThan(0.05);
  });

  test('2.17 ics_structurally_valid', async ({ page }) => {
    await gotoApp(page);
    await page.getByRole('button', { name: 'Export trip files' }).click();
    const modal = page.locator('.modal.wide');
    await modal.locator('.export-tabs [role="tab"]', { hasText: 'ICS' }).click();
    const text = await modal.locator('.export-pre').innerText();
    expect(text.split('\n')[0].trim()).toBe('BEGIN:VCALENDAR');
    expect(text.trim().split('\n').pop().trim()).toBe('END:VCALENDAR');
    const events = text.split('BEGIN:VEVENT').slice(1);
    expect(events).toHaveLength(SEEDED_STOP_COUNT);
    for (const ev of events) {
      expect(ev).toContain('DTSTART:');
      expect(ev).toMatch(/DTSTART:\d{8}T\d{6}/);
      expect(ev).toContain('SUMMARY:');
      expect(ev).toContain('END:VEVENT');
    }
  });

  test('2.18 trip_json_matches_field_contracts', async ({ page }) => {
    await gotoApp(page);
    await page.getByRole('button', { name: 'Export trip files' }).click();
    const modal = page.locator('.modal.wide');
    await modal.locator('.export-tabs [role="tab"]', { hasText: 'Trip JSON' }).click();
    const text = await modal.locator('.export-pre').innerText();
    const obj = JSON.parse(text);
    expect(obj.schemaVersion).toBe('1');
    expect(obj.trip.budgetCeilingEur).toBe(4500);
    const stopCats = ['sightseeing', 'dining', 'lodging', 'transport', 'other'];
    for (const s of obj.stops) {
      expect(typeof s.title).toBe('string');
      expect(stopCats).toContain(s.category);
      expect(['2025-07-05', '2025-07-06', '2025-07-07', '2025-07-08', '2025-07-09', '2025-07-10', '2025-07-11']).toContain(s.day);
    }
    const expCats = ['Lodging', 'Food', 'Transit', 'Activities'];
    const currencies = ['EUR', 'USD', 'GBP', 'CHF'];
    for (const x of obj.expenses) {
      expect(typeof x.description).toBe('string');
      expect(expCats).toContain(x.category);
      expect(currencies).toContain(x.currency);
      expect(['per-capita', 'weighted']).toContain(x.splitMode);
    }
  });
});
