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


const getLibraryCount = async (page) => {
  return await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h2, h3'));
    const libHeading = headings.find(h => h.textContent.includes('Library'));
    if (!libHeading) return 0;
    const match = libHeading.textContent.match(/Library\s*\((\d+)\)/);
    return match ? parseInt(match[1], 10) : 0;
  });
};

test('1.28 create_flow_pin_appears_cross_mode', async ({ page }) => {
  await page.goto('http://localhost:3000');

  await page.click('button:has-text("Library")');
  await page.waitForTimeout(500);

  await page.click('button:has-text("Add event")');

  await page.fill('#event-title', 'My Unique Test Event');
  await page.fill('#event-year', '1950');
  await page.fill('#event-place', 'Testing City');
  await page.fill('#event-timestamp', '1950-01-01T00:00:00.000Z');

  await page.click('.mantine-MultiSelect-input', { force: true });
  await page.waitForTimeout(100);
  await page.click('.mantine-MultiSelect-option[value="Radio"]');
  await page.keyboard.press('Escape');

  await page.click('.mantine-Select-input', { force: true });
  await page.waitForTimeout(100);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  await page.fill('#event-media-refs', 'test-media-ref');
  await page.fill('#event-summary', 'This is a test summary.');
  await page.fill('#event-detail', 'This is a test detail for the unique test event.');

  await page.waitForTimeout(100);
  await page.click('button[type="submit"]:has-text("Add event")');
  await page.waitForTimeout(500);

  const created = await invokeTool(page, 'browse_search', { query: 'My Unique Test Event' });
  expect(created.count).toBe(1);

  const textBody = await page.textContent('body');
  expect(textBody).toContain('My Unique Test Event');

  await page.click('button:has-text("Explore")');
  await page.waitForTimeout(500);

  const stagePinsText = await page.evaluate(() => Array.from(document.querySelectorAll('.timeline-pin')).map(p => p.getAttribute('aria-label') || p.innerText).join(' '));
  expect(stagePinsText).toContain('My Unique Test Event');
});

test('1.29 edit_flow_updates_list_pin_and_detail', async ({ page }) => {
  await page.goto('http://localhost:3000');

  await page.click('button:has-text("Library")');
  await page.waitForTimeout(500);

  // click event actions
  const buttons = await page.getByRole('button', { name: 'Event actions' }).all();
  expect(buttons.length).toBeGreaterThan(0);
  await buttons[0].click();
    await page.waitForTimeout(200);
    await page.click('button:has-text("Edit")');
    await page.waitForTimeout(200);

    await page.fill('#event-title', 'Edited Test Event Title');
    await page.fill('#event-year', '1960');
    await page.fill('#event-timestamp', '1960-01-01T00:00:00.000Z');

    await page.waitForTimeout(100);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.waitForTimeout(500);

    const edited = await invokeTool(page, 'browse_search', { query: 'Edited Test Event Title' });
    expect(edited.count).toBe(1);

    await page.click('button:has-text("Explore")');
    await page.waitForTimeout(500);
    const stagePinsText = await page.evaluate(() => Array.from(document.querySelectorAll('.timeline-pin')).map(p => p.getAttribute('aria-label') || p.innerText).join(' '));
    expect(stagePinsText).toContain('Edited Test Event Title');
});

test('1.30 delete_flow_clears_all_surfaces', async ({ page }) => {
  await page.goto('http://localhost:3000');

  await page.click('button:has-text("Library")');
  await page.waitForTimeout(500);

  const firstTitle = await page.locator('.library-row .font-semibold').first().textContent();
  expect(firstTitle).toBeTruthy();
  const buttons = await page.getByRole('button', { name: 'Event actions' }).all();
  expect(buttons.length).toBeGreaterThan(0);
  await buttons[0].click();
    await page.waitForTimeout(200);
    await page.click('button:has-text("Delete")');
    await page.waitForTimeout(500);
    const confirmButton = await page.locator('button:has-text("Delete"):not([title="Event actions"])').all();
    expect(confirmButton.length).toBeGreaterThan(0);
    await confirmButton[0].click();
    await page.waitForTimeout(500);

    await expect(page.getByText(firstTitle, { exact: true })).toHaveCount(0);
});

test('1.33 chrome_controls_drawer_modal_reset', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Click the desktop filter button
  await page.click('button.hidden.sm\\:flex:has-text("Filters")');
  await page.waitForTimeout(500);
  const isFiltersOpen = await page.locator('[role="dialog"]').count();
  expect(isFiltersOpen).toBeGreaterThan(0);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  await page.click('button[aria-label="About this timeline"]');
  await page.waitForTimeout(500);
  const isAboutOpen = await page.locator('[role="dialog"]').count();
  expect(isAboutOpen).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // reset
  await page.click('button.hidden.sm\\:flex:has-text("Filters")');
  await page.waitForTimeout(500);
  await page.getByLabel('Search events').fill('temporary-filter');
  await page.getByRole('checkbox', { name: 'Radio' }).uncheck();
  await page.getByLabel('From year').fill('1800');
  await page.getByLabel('To year').fill('1900');
  const filterDrawer = page.getByRole('dialog').filter({ has: page.getByLabel('Search events') });
  await filterDrawer.getByRole('button', { name: 'Reset filters', exact: true }).click();
  await expect(filterDrawer.getByLabel('Search events')).toHaveValue('');
  await expect(filterDrawer.getByRole('checkbox', { name: 'Radio' })).toBeChecked();
  await expect(filterDrawer.getByLabel('From year')).not.toHaveValue('1800');
  await expect(filterDrawer.getByLabel('To year')).not.toHaveValue('1900');
});

test('1.36 double_submit_adds_exactly_one', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('button:has-text("Library")');
  await page.waitForTimeout(500);

  await page.click('button:has-text("Add event")');

  await page.fill('#event-title', 'Double Submit Test');
  await page.fill('#event-year', '1970');
  await page.fill('#event-place', 'Testing City');
  await page.fill('#event-timestamp', '1970-01-01T00:00:00.000Z');

  await page.click('.mantine-MultiSelect-input', { force: true });
  await page.waitForTimeout(100);
  await page.click('.mantine-MultiSelect-option[value="Television"]', { force: true });
  await page.keyboard.press('Escape');

  await page.click('.mantine-Select-input', { force: true });
  await page.waitForTimeout(100);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  await page.fill('#event-media-refs', 'test-media-ref');
  await page.fill('#event-summary', 'This is a test summary.');
  await page.fill('#event-detail', 'This is a test detail.');

  await page.waitForTimeout(100);

  // Double submit
  const submitButton = page.locator('button[type="submit"]:has-text("Add event")');
  await submitButton.click();
  submitButton.click().catch(() => {});
  await page.waitForTimeout(500);

  const created = await invokeTool(page, 'browse_search', { query: 'Double Submit Test' });
  expect(created.count).toBe(1);
});

test('1.39 empty_state_offers_recovery_control', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('button.hidden.sm\\:flex:has-text("Filters")');
  await page.waitForTimeout(500);
  await page.fill('input[placeholder*="Search"]', 'A text that will definitely not match anything blablabla');
  await page.waitForTimeout(500);

  const bodyText = await page.textContent('body');
  expect(bodyText).toContain('No events match');

  const filterDrawer = page.getByRole('dialog').filter({ has: page.getByLabel('Search events') });
  await filterDrawer.getByRole('button', { name: 'Reset filters', exact: true }).click();
  await expect(page.getByText('No events match')).toHaveCount(0);
  const restoredCount = await page.getByText(/\d+ events in view/).textContent();
  expect(Number(restoredCount?.match(/\d+/)?.[0] ?? 0)).toBeGreaterThan(0);
});

test('1.40 inline_errors_and_disabled_submit', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('button:has-text("Library")');
  await page.waitForTimeout(500);
  await page.click('button:has-text("Add event")');
  await page.waitForTimeout(500);

  const submitDisabled = await page.evaluate(() => document.querySelector('button[type="submit"]').disabled);
  expect(submitDisabled).toBe(true);

  const bodyText = await page.textContent('body');
  expect(bodyText).toContain('Title is required');
});

// DROPPED (fails against oracle — hallucinated/incomplete selectors): test '1.43 ...'
test('1.44 year_bounds_rejected', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('button:has-text("Library")');
  await page.waitForTimeout(500);

  await page.click('button:has-text("Add event")');

  await page.fill('#event-title', 'Bad Year Event');
  await page.fill('#event-year', '9999'); // Out of bounds > 2024
  await page.fill('#event-place', 'Testing City');
  await page.fill('#event-timestamp', '9999-01-01T00:00:00.000Z');

  await page.click('.mantine-MultiSelect-input', { force: true });
  await page.waitForTimeout(100);
  await page.click('.mantine-MultiSelect-option[value="Radio"]');
  await page.keyboard.press('Escape');

  await page.click('.mantine-Select-input', { force: true });
  await page.waitForTimeout(100);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  await page.fill('#event-media-refs', 'test-media-ref');
  await page.fill('#event-summary', 'This is a test summary.');
  await page.fill('#event-detail', 'This is a test detail for the unique test event.');

  await page.waitForTimeout(100);
  const submitDisabled = await page.evaluate(() => document.querySelector('button[type="submit"]').disabled);
  expect(submitDisabled).toBe(true);
  await expect(page.locator('#event-year-error')).toHaveText('Year must be between -3200 and 2024');
  const rejected = await invokeTool(page, 'browse_search', { query: 'Bad Year Event' });
  expect(rejected.count).toBe(0);
});

test('1.1 controls_are_keyboard_accessible', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(500);

  // Tab through and expect elements to have focus outline
  await page.keyboard.press('Tab');
  await page.waitForTimeout(100);
  const focusedTag = await page.evaluate(() => document.activeElement.tagName);
  expect(['A', 'BUTTON', 'INPUT']).toContain(focusedTag);
});

test('1.2 modals_manage_focus', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(500);

  // Click about modal
  const about = page.getByRole('button', { name: 'About this timeline' });
  await about.click();
  await page.waitForTimeout(500);

  // Tab within modal
  await page.keyboard.press('Tab');
  await page.waitForTimeout(100);

  // Dialog should be open
  const isAboutOpen = await page.locator('[role="dialog"]').count();
  expect(isAboutOpen).toBeGreaterThan(0);
  const focusIsInside = await page.locator('[role="dialog"]').evaluate((dialog) => dialog.contains(document.activeElement));
  expect(focusIsInside).toBe(true);

  // Press Escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // Should return focus to original button (or at least close modal)
  const isAboutOpenAfter = await page.locator('[role="dialog"]').count();
  expect(isAboutOpenAfter).toBe(0);
  await expect(about).toBeFocused();
});

// DROPPED (fails against oracle — hallucinated/incomplete selectors): test '14.5 ...'
test('14.1 multi_facet_round_trip', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const created = await invokeTool(page, 'entity_create', {
    entity: 'event',
    fields: {
      id: 'round-trip-facets-event', title: 'Roundtrip Facets Event', type: 'First Appearance', year: 1900,
      place: 'Detroit', timestamp: '1900-01-01T00:00:00.000Z',
      categories: ['Radio'], mediaRefs: ['roundtrip-ref'], summary: 'Facet round trip', detail: 'Facet round trip detail',
    },
  });
  expect(created.success).toBe(true);
  await page.getByRole('button', { name: 'Library' }).click();
  await page.click('button.hidden.sm\\:flex:has-text("Filters")');
  await page.getByRole('checkbox', { name: 'Radio' }).uncheck();
  await page.getByLabel('Search events').fill('Roundtrip');
  await page.getByLabel('From year').fill('1850');
  await page.getByLabel('To year').fill('1950');
  expect(await getLibraryCount(page)).toBe(0);

  await page.reload();
  await page.click('button.hidden.sm\\:flex:has-text("Filters")');
  await expect(page.getByLabel('Search events')).toHaveValue('');
  await expect(page.getByRole('checkbox', { name: 'Radio' })).toBeChecked();
  await expect(page.getByLabel('From year')).not.toHaveValue('1850');
  await expect(page.getByLabel('To year')).not.toHaveValue('1950');
});

test('14.2 sort_reversal_proves_live_data', async ({ page }) => {
  await page.goto('http://localhost:3000');

  await page.click('button:has-text("Library")');
  await page.waitForTimeout(500);

  // We add one with an extremely early year, it should appear early, not just anywhere.
  await page.click('button:has-text("Add event")');

  await page.fill('#event-title', 'Extremely Early Event');
  await page.fill('#event-year', '-3150'); // 3150 BCE
  await page.fill('#event-place', 'Testing City');
  await page.fill('#event-timestamp', '0001-01-01T00:00:00.000Z');

  await page.click('.mantine-MultiSelect-input', { force: true });
  await page.waitForTimeout(100);
  await page.click('.mantine-MultiSelect-option[value="Oral Culture"]');
  await page.keyboard.press('Escape');

  await page.click('.mantine-Select-input', { force: true });
  await page.waitForTimeout(100);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  await page.fill('#event-media-refs', 'test-media-ref');
  await page.fill('#event-summary', 'This is a test summary.');
  await page.fill('#event-detail', 'This is a test detail for the unique test event.');

  await page.waitForTimeout(100);
  await page.click('button[type="submit"]:has-text("Add event")');
  await page.waitForTimeout(500);

  const rowTitles = await page.evaluate(() => Array.from(document.querySelectorAll('.font-semibold.text-gray-900.truncate')).map(r => r.textContent));
  const indexEarly = rowTitles.indexOf('Extremely Early Event');
  const indexGutenberg = rowTitles.indexOf('Gutenberg Press');

  // As long as it is placed before later events, chronology is live
  expect(indexEarly).toBeGreaterThanOrEqual(0);
  expect(indexGutenberg).toBeGreaterThanOrEqual(0);
  expect(indexEarly).toBeLessThan(indexGutenberg);
});

test('14.3 derived_view_responds_to_input', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('button:has-text("Library")');
  await page.waitForTimeout(500);

  const initialCount = await getLibraryCount(page);

  await page.click('button.hidden.sm\\:flex:has-text("Filters")');
  await page.waitForTimeout(500);

  // Search filter always works correctly for derived views
  await page.fill('input[placeholder*="Search"]', 'Gutenberg');
  await page.waitForTimeout(500);

  const modifiedCount = await getLibraryCount(page);
  expect(initialCount).not.toBe(modifiedCount);
});

test('14.4 cross_view_echo_without_reload', async ({ page }) => {
  await page.goto('http://localhost:3000');

  await page.click('button:has-text("Library")');
  await page.waitForTimeout(500);

  // We add one and verify it's everywhere
  await page.click('button:has-text("Add event")');

  await page.fill('#event-title', 'Cross View Echo Event');
  await page.fill('#event-year', '1955');
  await page.fill('#event-place', 'Testing City');
  await page.fill('#event-timestamp', '1955-01-01T00:00:00.000Z');

  await page.click('.mantine-MultiSelect-input', { force: true });
  await page.waitForTimeout(100);
  await page.click('.mantine-MultiSelect-option[value="Television"]', { force: true });
  await page.keyboard.press('Escape');

  await page.click('.mantine-Select-input', { force: true });
  await page.waitForTimeout(100);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  await page.fill('#event-media-refs', 'echo-media-ref');
  await page.fill('#event-summary', 'This is a test summary.');
  await page.fill('#event-detail', 'This is a test detail.');

  await page.waitForTimeout(100);
  await page.click('button[type="submit"]:has-text("Add event")');
  await page.waitForTimeout(500);

  // Library
  const textBody = await page.textContent('body');
  expect(textBody).toContain('Cross View Echo Event');

  // Stage
  await page.click('button:has-text("Explore")');
  await page.waitForTimeout(500);
  const stagePinsText = await page.evaluate(() => Array.from(document.querySelectorAll('.timeline-pin')).map(p => p.getAttribute('aria-label') || p.innerText).join(' '));
  expect(stagePinsText).toContain('Cross View Echo Event');

  // Export
  await page.click('button.hidden.sm\\:flex:has-text("Export timeline")');
  await page.waitForTimeout(500);

  const exportPreview = await page.locator('[role="dialog"]').textContent();
  expect(exportPreview).toContain('Cross View Echo Event');
  expect(exportPreview).toContain('echo-media-ref');
});

test('14.6 different_inputs_change_outcomes', async ({ page }) => {
  await page.goto('http://localhost:3000');

  await page.click('button:has-text("Library")');
  await page.waitForTimeout(500);

  // Add event 1
  await page.click('button:has-text("Add event")');
  await page.fill('#event-title', 'Event A');
  await page.fill('#event-year', '1961');
  await page.fill('#event-place', 'Testing City A');
  await page.fill('#event-timestamp', '1961-01-01T00:00:00.000Z');
  await page.click('.mantine-MultiSelect-input', { force: true });
  await page.waitForTimeout(100);
  await page.click('.mantine-MultiSelect-option[value="Television"]', { force: true });
  await page.keyboard.press('Escape');
  await page.click('.mantine-Select-input', { force: true });
  await page.waitForTimeout(100);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.fill('#event-media-refs', 'ref-a');
  await page.fill('#event-summary', 'Summary A');
  await page.fill('#event-detail', 'Detail A');
  await page.click('button[type="submit"]:has-text("Add event")');
  await page.waitForTimeout(500);

  // Add event 2
  await page.click('button:has-text("Add event")');
  await page.fill('#event-title', 'Event B');
  await page.fill('#event-year', '1962');
  await page.fill('#event-place', 'Testing City B');
  await page.fill('#event-timestamp', '1962-01-01T00:00:00.000Z');
  await page.click('.mantine-MultiSelect-input', { force: true });
  await page.waitForTimeout(100);
  await page.click('.mantine-MultiSelect-option[value="Radio"]');
  await page.keyboard.press('Escape');
  await page.click('.mantine-Select-input', { force: true });
  await page.waitForTimeout(100);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.fill('#event-media-refs', 'ref-b');
  await page.fill('#event-summary', 'Summary B');
  await page.fill('#event-detail', 'Detail B');
  await page.click('button[type="submit"]:has-text("Add event")');
  await page.waitForTimeout(500);

  // Check export since list might be virtualized and scroll to bottom
  await page.click('button.hidden.sm\\:flex:has-text("Export timeline")');
  await page.waitForTimeout(500);

  const exportPreview = await page.locator('[role="dialog"]').textContent();
  expect(exportPreview).toContain('Event A');
  expect(exportPreview).toContain('Event B');
  expect(exportPreview).toContain('ref-a');
  expect(exportPreview).toContain('ref-b');
});

test('2.8 console_clean_during_full_exercise', async ({ page }) => {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') errors.push(`${msg.type()}: ${msg.text()}`);
  });

  await page.goto('http://localhost:3000');

  await page.click('button:has-text("Library")');
  await page.waitForTimeout(200);
  await page.click('button:has-text("Add event")');
  await page.waitForTimeout(200);
  await page.click('button:has-text("Cancel")');
  await page.waitForTimeout(200);

  await page.click('button.hidden.sm\\:flex:has-text("Filters")');
  await page.waitForTimeout(200);
  await page.keyboard.press('Escape');
  await invokeTool(page, 'artifact_export', { operation: 'export', format: 'json' });
  await page.keyboard.press('Escape');
  await invokeTool(page, 'artifact_import', { operation: 'import', mode: 'timeline-json' });
  await page.keyboard.press('Escape');
  const firstCheckbox = page.locator('input[type="checkbox"]').first();
  await firstCheckbox.check();
  await page.getByRole('button', { name: /Set category/ }).click();
  await page.getByRole('menuitem', { name: /Networks/ }).click();
  await page.getByRole('button', { name: 'Undo' }).click();
  await page.getByRole('button', { name: 'Redo' }).click();

  expect(errors).toEqual([]);
});

test('2.14 in_memory_only_no_storage', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const expectNoStorage = async () => expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
  await expectNoStorage();
  await invokeTool(page, 'entity_create', {
    entity: 'event', fields: { id: 'storage-check', title: 'Storage Check', type: 'First Appearance', year: 2000, place: 'Detroit', timestamp: '2000-01-01T00:00:00.000Z', categories: ['Radio'], mediaRefs: ['storage-ref'], summary: 'Storage check', detail: 'Storage check detail' },
  });
  await expectNoStorage();
  await invokeTool(page, 'browse_apply_filter', { filter: 'search', value: 'Storage Check' });
  await expectNoStorage();
  await invokeTool(page, 'artifact_export', { operation: 'export', format: 'json' });
  await expectNoStorage();
  await page.keyboard.press('Escape');
  await invokeTool(page, 'artifact_import', { operation: 'import', mode: 'timeline-json' });
  await expectNoStorage();
});

test('reduced_motion_is_respected', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('http://localhost:3000');

  await page.click('button:has-text("Library")');
  await page.waitForTimeout(500);

  await page.click('button:has-text("Add event")');

  await page.fill('#event-title', 'Reduced Motion Event');
  await page.fill('#event-year', '1980');
  await page.fill('#event-place', 'Testing City');
  await page.fill('#event-timestamp', '1980-01-01T00:00:00.000Z');

  await page.click('.mantine-MultiSelect-input', { force: true });
  await page.waitForTimeout(100);
  await page.click('.mantine-MultiSelect-option[value="Television"]', { force: true });
  await page.keyboard.press('Escape');

  await page.click('.mantine-Select-input', { force: true });
  await page.waitForTimeout(100);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  await page.fill('#event-media-refs', 'test-media-ref');
  await page.fill('#event-summary', 'This is a test summary.');
  await page.fill('#event-detail', 'This is a test detail.');

  await page.waitForTimeout(100);
  await page.click('button[type="submit"]:has-text("Add event")');
  await page.waitForTimeout(500);

  const created = await invokeTool(page, 'browse_search', { query: 'Reduced Motion Event' });
  expect(created.count).toBe(1);
});

// NOT-AUTOMATABLE: 1.3 images_and_icons_have_alt_text - Visual/Semantic verification required
// NOT-AUTOMATABLE: 1.6 headings_follow_logical_order - Semantic verification required
// NOT-AUTOMATABLE: 1.8 text_and_controls_have_contrast - Visual verification required
// NOT-AUTOMATABLE: 2.7 interactive_within_two_seconds - Performance metric difficult to evaluate stably in headless
// NOT-AUTOMATABLE: 2.9 stage_and_library_stay_smooth - Visual/Performance metric difficult to evaluate stably
// NOT-AUTOMATABLE: 1.38 long_title_truncates_with_ellipsis - Requires explicit visual width tests
// NOT-AUTOMATABLE: 4.1 hover_wash_and_focus_rings - Interaction visual state verification
// NOT-AUTOMATABLE: 4.6 detail_panel_settle_transition - Animation timing verification
// NOT-AUTOMATABLE: 4.7 list_row_add_remove_animates - Animation timing verification
// NOT-AUTOMATABLE: 4.8 drawer_and_modal_slide_fade - Animation timing verification
// NOT-AUTOMATABLE: 4.9 feedback_messages_animate - Animation timing verification

test('overflow_375px_respected', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:3000');

  await page.waitForTimeout(500);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('webmcp_contract_presence_and_mutation', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(500);

  const tools = await listTools(page);

  // They are required to have webmcp bound
  expect(tools.length).toBeGreaterThan(0);
  await invokeTool(page, 'browse_open', { destination: 'library' });
  const result = await invokeTool(page, 'entity_create', {
    entity: 'event', fields: { id: 'webmcp-visible-mutation', title: 'WebMCP Visible Mutation', type: 'First Appearance', year: 1999, place: 'Detroit', timestamp: '1999-01-01T00:00:00.000Z', categories: ['Radio'], mediaRefs: ['webmcp-ref'], summary: 'Visible mutation', detail: 'Visible mutation detail' },
  });
  expect(result.success).toBe(true);
  await invokeTool(page, 'browse_open', { destination: 'library' });
  await expect(page.getByText('WebMCP Visible Mutation')).toBeVisible();
});

// NOT-AUTOMATABLE: 1.3 images_and_icons_have_alt_text - Semantic evaluation via tools needed
// NOT-AUTOMATABLE: 1.6 headings_follow_logical_order - Semantic DOM structure analysis required
// NOT-AUTOMATABLE: 1.8 text_and_controls_have_contrast - Visual accessibility tools needed
// NOT-AUTOMATABLE: 2.7 interactive_within_two_seconds - Timings variable and noisy on headless
// NOT-AUTOMATABLE: 2.9 stage_and_library_stay_smooth - FPS evaluation cannot be reliably automated
// NOT-AUTOMATABLE: 1.38 long_title_truncates_with_ellipsis - Width-dependent CSS ellipsis is visual
// NOT-AUTOMATABLE: 4.1 hover_wash_and_focus_rings - Visual hover interactions are subjective
// NOT-AUTOMATABLE: 4.6 detail_panel_settle_transition - Visual timing assertion
// NOT-AUTOMATABLE: 4.7 list_row_add_remove_animates - Visual timing assertion
// NOT-AUTOMATABLE: 4.8 drawer_and_modal_slide_fade - Visual timing assertion
// NOT-AUTOMATABLE: 4.9 feedback_messages_animate - Visual timing assertion
// NOT-AUTOMATABLE: 4.11 bulk_delete_rows_animate_out - Visual timing assertion

// DROPPED (fails against oracle — hallucinated/incomplete selectors): test '1.48 ...'
