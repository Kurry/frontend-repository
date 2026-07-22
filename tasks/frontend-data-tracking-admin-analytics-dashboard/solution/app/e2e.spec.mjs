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

test('1.1 controls_are_keyboard_accessible', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const fab = page.getByRole('button', { name: 'Open export drawer' });
  // Reach the FAB via real Tab traversal (not a programmatic .focus() call):
  // this is what an actual keyboard user does, and it is the input modality
  // the browser's :focus-visible heuristic keys off of.
  let reachedByTab = false;
  for (let i = 0; i < 150; i += 1) {
    await page.keyboard.press('Tab');
    // eslint-disable-next-line no-await-in-loop
    if (await fab.evaluate((el) => document.activeElement === el)) {
      reachedByTab = true;
      break;
    }
  }
  expect(reachedByTab, 'the FAB is reachable via sequential keyboard Tab navigation').toBe(true);
  await expect(fab, 'the FAB is reachable via keyboard focus').toBeFocused();
  const hasVisibleFocus = await fab.evaluate((el) => {
    const cs = getComputedStyle(el);
    // Require the browser's own focus-visible heuristic to have applied
    // (real keyboard focus) AND a rendered outline — a stray box-shadow
    // that is present regardless of focus state does not count.
    return el.matches(':focus-visible') && cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
  });
  expect(hasVisibleFocus, 'focused control shows a visible focus indicator').toBe(true);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Export and import session' }), 'Enter activates the focused control').toBeVisible();
});

test('1.2 modals_manage_focus', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const opener = page.getByRole('button', { name: 'Open export drawer' });
  await opener.click();
  const drawer = page.getByRole('dialog', { name: 'Export and import session' });
  await expect(drawer).toBeVisible();
  await page.waitForTimeout(150); // drawer's own 60ms initial-focus timer
  await expect(drawer.evaluate((el) => el.contains(document.activeElement))).resolves.toBe(true);
  for (let i = 0; i < 10; i += 1) {
    await page.keyboard.press('Tab');
    const contained = await drawer.evaluate((el) => el.contains(document.activeElement));
    expect(contained, `focus stays inside the open drawer after Tab #${i + 1}`).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(drawer, 'Escape closes the drawer').toBeHidden();
  await expect(opener, 'focus returns to the control that opened the drawer').toBeFocused();
});

test('1.3 images_and_icons_have_alt_text', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'All Users' }).click();
  const avatarImgs = page.locator('.name-cell .av img');
  const count = await avatarImgs.count();
  expect(count, 'the users table renders avatar images to check').toBeGreaterThan(0);
  for (let i = 0; i < count; i += 1) {
    const alt = await avatarImgs.nth(i).getAttribute('alt');
    expect(alt, `avatar image #${i} has non-empty alt text`).toBeTruthy();
    expect(alt.trim().length).toBeGreaterThan(0);
  }
  const editButtons = page.locator('.row-act button[aria-label^="Edit "]');
  const editCount = await editButtons.count();
  expect(editCount, 'icon-only edit buttons exist to check').toBeGreaterThan(0);
  for (let i = 0; i < editCount; i += 1) {
    const label = await editButtons.nth(i).getAttribute('aria-label');
    expect(label && label.trim().length, `icon-only edit button #${i} has an accessible name`).toBeGreaterThan(0);
  }
});

test('1.4 feedback_uses_live_regions', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Add user' }).click();
  const liveRegion = page.locator('div.sr-only[aria-live="polite"]').first();
  await expect(liveRegion, 'a polite live region exists in the DOM before any validation runs').toHaveCount(1);
  await expect(liveRegion).toHaveText('');
  await page.getByLabel('First name').fill('a');
  await page.getByLabel('First name').fill('');
  await page.getByLabel('Last name').click();
  await expect(liveRegion, 'validation errors are announced via the pre-existing live region').not.toHaveText('');
  await expect(liveRegion).toContainText(/validation/i);
});

test('1.5 forms_have_explicit_labels', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Add user' }).click();
  const fields = [
    ['firstName', 'First name'],
    ['lastName', 'Last name'],
    ['email', 'Email'],
    ['phone', 'Phone'],
    ['notes', 'Notes'],
    ['temporaryPassword', 'Temporary password'],
  ];
  for (const [id, labelText] of fields) {
    const label = page.locator(`label[for="${id}"]`);
    await expect(label, `label[for="${id}"] exists`).toHaveCount(1);
    await expect(label).toContainText(labelText);
    const control = page.locator(`#${id}`);
    await expect(control, `#${id} control exists and is the labelled element`).toHaveCount(1);
    // getByLabel resolves the association the same way assistive tech does.
    // Required fields append a "*" marker to the accessible name, so match
    // the label as a prefix rather than exact/substring (substring would
    // also match "Send invitation email" for the "Email" field).
    await expect(page.getByLabel(new RegExp(`^${labelText}(\\s|$)`))).toHaveCount(1);
  }
});

test('1.6 headings_follow_logical_order', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const readLevels = () => page.evaluate(() =>
    Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      .filter((el) => el.offsetParent !== null && el.closest('[aria-hidden="true"]') === null)
      .map((el) => Number(el.tagName[1])));
  const assertNoSkips = (levels, where) => {
    expect(levels.length, `${where} has at least one heading`).toBeGreaterThan(0);
    for (let i = 1; i < levels.length; i += 1) {
      expect(levels[i] - levels[i - 1], `${where}: heading level jump at position ${i} (from h${levels[i - 1]} to h${levels[i]})`).toBeLessThanOrEqual(1);
    }
  };
  assertNoSkips(await readLevels(), 'Operations Overview');
  await page.getByRole('button', { name: 'All Users' }).click();
  await page.waitForLoadState('networkidle');
  assertNoSkips(await readLevels(), 'All Users');
});

test('1.7 landmark_navigation_is_present', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('complementary', { name: 'Primary navigation' }), 'sidebar exposes a labelled landmark region').toHaveCount(1);
  await expect(page.getByRole('navigation', { name: 'Administration sections' }), 'the section list uses a semantic nav landmark').toHaveCount(1);
  await expect(page.locator('main.main-canvas'), 'the app canvas uses a semantic <main> landmark').toHaveCount(1);
  const mainIsLandmark = await page.evaluate(() => document.querySelector('main.main-canvas')?.tagName === 'MAIN');
  expect(mainIsLandmark).toBe(true);
});

test('1.8 text_and_controls_have_contrast', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const relLuminance = (r, g, b) => {
    const chan = (c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
  };
  const ratio = (rgb1, rgb2) => {
    const l1 = relLuminance(...rgb1); const l2 = relLuminance(...rgb2);
    const [lighter, darker] = l1 >= l2 ? [l1, l2] : [l2, l1];
    return (lighter + 0.05) / (darker + 0.05);
  };
  const parseRgb = (str) => (str.match(/[\d.]+/g) || ['0', '0', '0']).slice(0, 3).map(Number);

  const measure = async () => page.evaluate(() => {
    const btn = document.querySelector('.btn.btn-primary');
    const cs = getComputedStyle(btn);
    let bg = cs.backgroundColor;
    let node = btn;
    while (bg === 'rgba(0, 0, 0, 0)' && node.parentElement) { node = node.parentElement; bg = getComputedStyle(node).backgroundColor; }
    return { fg: cs.color, bg };
  });

  for (const theme of ['dark', 'light']) {
    if (theme === 'light') {
      // The checkbox is visually replaced by a styled label icon; check it via
      // its label (the real user interaction path) rather than a direct
      // pointer-intercepted click on the sr-only input.
      await page.getByLabel('Toggle light and dark theme').check({ force: true });
      await page.waitForTimeout(250); // theme transition settle
    }
    const { fg, bg } = await measure();
    const r = ratio(parseRgb(fg), parseRgb(bg));
    expect(r, `primary button text-vs-background contrast in ${theme} theme (fg ${fg} on bg ${bg}) meets WCAG AA (>=4.5:1)`).toBeGreaterThanOrEqual(4.5);
  }
});

test('1.9 semantic_html_roles_are_used', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const tags = await page.evaluate(() => ({
    nav: document.querySelectorAll('nav').length,
    main: document.querySelectorAll('main').length,
  }));
  expect(tags.nav, 'semantic <nav> elements are used for chrome').toBeGreaterThan(0);
  expect(tags.main, 'a semantic <main> element is used for the canvas').toBeGreaterThan(0);
  const actionTagNames = await page.evaluate(() => {
    const names = new Set();
    document.querySelectorAll('.row-act *, .toolbar *, .ctxbar button, .export-foot *').forEach((el) => {
      if (el.children.length === 0 && (el.getAttribute('onclick') || el.className?.toString().includes('btn'))) names.add(el.tagName);
    });
    return [...names];
  });
  expect(actionTagNames.every((t) => t === 'BUTTON' || t === 'SVG' || t === 'PATH'), `interactive action elements use <button>, found: ${actionTagNames.join(', ')}`).toBe(true);
});

test('1.10 status_role_not_color_only', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'All Users' }).click();
  // Scope to the Status column's badges specifically (badge-success/-warning/
  // -error), not the Role column's badge-ghost badges, which carry a
  // different kind of value.
  const badges = page.locator('table.tbl tbody td .badge.badge-success, table.tbl tbody td .badge.badge-warning, table.tbl tbody td .badge.badge-error');
  const count = await badges.count();
  expect(count, 'status badges are rendered in the users table').toBeGreaterThan(0);
  const knownStatuses = ['Active', 'Invited', 'Suspended'];
  let matched = 0;
  for (let i = 0; i < count; i += 1) {
    const text = (await badges.nth(i).innerText()).trim();
    if (knownStatuses.includes(text)) matched += 1;
  }
  expect(matched, 'every status badge carries its status as visible text, not color alone').toBe(count);
});
