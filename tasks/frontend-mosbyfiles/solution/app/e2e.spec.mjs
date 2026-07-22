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

test('1.4 category_cover_exact_fills', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');

  const expected = {
    organic: 'rgb(30, 75, 215)',
    expressive: 'rgb(12, 120, 102)',
    monumental: 'rgb(88, 30, 112)',
    place: 'rgb(215, 30, 30)',
  };
  for (const [category, color] of Object.entries(expected)) {
    const cover = page.locator(`.stack-group[data-cat="${category}"] .stack-cover`);
    await expect(cover).toBeVisible();
    await expect.poll(() => cover.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(color);
  }
});

test('1.6 folder_cover_3d_reveals_sheet', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.locator('[data-tag="ada-mercer"]').click();

  const cover = page.locator('.case-folder-cover');
  await expect(cover).toBeVisible();
  await expect.poll(() => cover.evaluate((element) => getComputedStyle(element).transform)).toMatch(/^matrix3d\(/);
  await expect(page.locator('.case-folder-sheet__meta')).toContainText(/^Born \d{4}/);
  await expect(page.locator('.case-folder-sheet__bio')).not.toBeEmpty();
});

test('1.12 scrapbook_drag_stays_released', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.locator('[data-tag="ada-mercer"]').click();

  const note = page.locator('.scrapbook-item[data-item-id="note-0"]');
  await expect(note).toBeVisible();
  const before = await note.boundingBox();
  expect(before).not.toBeNull();

  const start = { x: before.x + before.width / 2, y: before.y + before.height / 2 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 90, start.y + 70, { steps: 8 });
  await page.mouse.up();

  const released = await note.boundingBox();
  expect(released).not.toBeNull();
  expect(Math.abs(released.x - before.x)).toBeGreaterThan(40);
  expect(Math.abs(released.y - before.y)).toBeGreaterThan(30);
  const releasedPosition = await note.evaluate((element) => ({ left: element.style.left, top: element.style.top }));
  expect(releasedPosition.left).toMatch(/%$/);
  expect(releasedPosition.top).toMatch(/%$/);

  await page.waitForTimeout(250);
  const settled = await note.boundingBox();
  expect(settled).not.toBeNull();
  expect(Math.abs(settled.x - released.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(settled.y - released.y)).toBeLessThanOrEqual(1);
});

test('1.13 offline_assets_and_empty_storage', async ({ page }) => {
  const externalRequests = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol !== 'data:' && url.origin !== new URL(BASE).origin) externalRequests.push(request.url());
  });

  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.locator('[data-tag="ada-mercer"]').click();
  await expect(page.locator('#caseTitle')).toHaveAttribute('aria-label', 'Ada Mercer');
  await page.locator('.the-sub-header__back').click();
  await page.locator('[data-nav="about"]').click();
  await expect(page.locator('.page-about__title')).toBeVisible();
  await page.locator('.page-about__close').click();
  await page.locator('[data-tag="mara-voss"]').click();
  await page.locator('.content-video .content-play').click();
  await expect(page.locator('#popup')).toHaveAttribute('aria-hidden', 'false');
  await page.locator('.popup__close').click();
  await expect(page.locator('#popup')).toHaveAttribute('aria-hidden', 'true');

  expect(externalRequests).toEqual([]);
  await expect.poll(() => page.locator('html').evaluate(() => ({
    local: localStorage.length,
    session: sessionStorage.length,
  }))).toEqual({ local: 0, session: 0 });
});

test('4.19 reduced_motion_collapses_timelines', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');

  const heroChar = page.locator('#heroTitle .char').first();
  await expect(heroChar).toBeVisible();
  await expect.poll(() => heroChar.evaluate((element) => ({
    opacity: getComputedStyle(element).opacity,
    translateY: new DOMMatrix(getComputedStyle(element).transform).m42,
  }))).toEqual({ opacity: '1', translateY: 0 });

  await page.locator('[data-tag="ada-mercer"]').click();
  const cover = page.locator('.case-folder-cover');
  await expect.poll(() => cover.evaluate((element) => ({
    duration: getComputedStyle(element).transitionDuration,
    transform: getComputedStyle(element).transform,
  }))).toEqual(expect.objectContaining({ duration: '0.001s' }));
  await expect.poll(() => cover.evaluate((element) => getComputedStyle(element).transform)).toMatch(/^matrix3d\(/);
  await expect(page.locator('#caseTitle')).toHaveAttribute('aria-label', 'Ada Mercer');
  await expect(page.locator('#caseTitle .char').first()).toBeVisible();
});
