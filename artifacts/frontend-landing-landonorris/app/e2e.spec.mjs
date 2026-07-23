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
    await page.goto(BASE);
    // Load fully first: animations kicked off during hydration or by
    // late-arriving resources must fall inside the observation window, so the
    // sampling loop only starts once the page is settled.
    await page.waitForLoadState('networkidle');
    // Precondition sanity check: the emulation actually reaches the app.
    const reduced = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
    expect(reduced, 'precondition: app sees prefers-reduced-motion: reduce').toBe(true);
    await page.waitForTimeout(250); // small settle after idle
    // Observe every frame across a 1.5s window and assert on what was seen.
    // Finished, idle, or paused effects and durations <=1ms are allowed; any
    // meaningfully timed RUNNING effect at any sample is a reduced-motion
    // failure. Apps with zero animations pass vacuously (the render/console
    // test still gates them).
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

// Writing-dimension criterion tests. Each asserts a browser-observable string
// or copy behavior mandated by instruction.md (uppercase nav convention,
// specific action labels, newsletter validation/confirmation copy, exact
// mandated chrome strings, fictional-brand terminology, press-kit empty-state
// and import-error phrasing). Uses the canonical `test`/`expect` above, which
// also enforces zero console/page errors during each flow.
test.describe('writing (criterion suite)', () => {
  test.describe.configure({ mode: 'parallel' });

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  });

  test('15.1 nav_menu_uppercase_convention', async ({ page }) => {
    const labels = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-menu-link], [data-store-cta], [data-social-link], .nav-menu-link'))
        .map((el) => el.innerText.trim())
        .filter((t) => t.length > 0));
    expect(labels.length, 'nav/store/social labels present').toBeGreaterThan(0);
    for (const text of labels) expect(text).toBe(text.toUpperCase());
  });

  test('15.2 action_labels_specific', async ({ page }) => {
    const submitBtnText = await page.evaluate(() => {
      const btn = document.querySelector('.newsletter-submit');
      return btn ? btn.innerText.trim() : '';
    });
    expect(submitBtnText).toBe('Subscribe');
  });

  test('15.3 newsletter_errors_name_email_and_fix', async ({ page }) => {
    await page.evaluate(() => {
      const input = document.getElementById('newsletterEmail');
      input.value = 'invalid';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const errorMsg = (await page.locator('#newsletterMsg').innerText()).toLowerCase();
    expect(errorMsg).toContain('email');
    expect(errorMsg).toContain('@');
    expect(errorMsg).toContain('dot');
  });

  test('15.4 exact_mandated_chrome_strings', async ({ page }) => {
    expect(await page.title()).toBe('2025 Apex Grand Prix Driver — Avery Vale');
    const preloaderText = await page.locator('#preloader .transition-label').textContent();
    expect(preloaderText.trim()).toBe('LOAD VALE');
  });

  test('15.6 avery_vale_terminology_consistent', async ({ page }) => {
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).toContain('Avery Vale');
    expect(bodyText).toContain('Nova Racing');
    expect(bodyText).not.toContain('Lando Norris');
  });

  test('15.9 press_kit_empty_state_plain_language', async ({ page }) => {
    await page.click('#pressKitBtn');
    await page.waitForTimeout(500);
    await page.click('[data-tab="markdown"]');
    const preview = (await page.locator('[data-presskit-preview]').textContent()).toLowerCase();
    // Empty selection/shortlist are described in plain language, not jargon or a blank preview.
    expect(preview).toContain('is empty');
  });

  test('15.10 import_errors_are_named_and_specific', async ({ page }) => {
    await page.click('#pressKitBtn');
    await page.waitForTimeout(500);
    await page.fill('[data-import-area]', '{"schemaVersion": 1}');
    await page.click('[data-import-paste]');
    const msg = (await page.locator('[data-import-msg]').textContent()).toLowerCase();
    // A malformed import surfaces a specific, named error rather than failing silently.
    expect(msg).toContain('import error');
  });
});

/* eslint-disable playwright/no-networkidle, playwright/prefer-locator, playwright/prefer-web-first-assertions, playwright/missing-playwright-await, playwright/no-wait-for-timeout, playwright/prefer-to-have-count --
 * These browser probes intentionally mix real controls with in-page state and
 * timing measurements that do not have equivalent locator assertions. */
test.describe('oracle-fix interaction contracts', () => {
  test.describe.configure({ mode: 'parallel' });

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.locator('#preloader').waitFor({ state: 'hidden' });
  });

  test('1.35 1.39 1.40 1.44 menu flows settle and preserve one document', async ({ page }) => {
    await page.evaluate(() => scrollTo(0, 420));
    const before = await page.evaluate(() => scrollY);
    await page.click('#navHam');
    await expect(page.locator('#navMenu')).toHaveAttribute('aria-hidden', 'false');
    await page.click('#navClose');
    await expect(page.locator('#navMenu')).toHaveAttribute('aria-hidden', 'true');
    expect(await page.evaluate(() => scrollY)).toBe(before);
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => scrollY)).toBe(before);
    for (const destination of ['hero', 'horizontal-media', 'social-stream', 'race-calendar']) {
      await page.click('#navHam');
      await page.click(`[data-menu-link][data-dest="${destination}"]`);
      await expect(page.locator('#navMenu')).toHaveAttribute('aria-hidden', 'true');
      expect(new URL(page.url()).pathname).toBe('/');
    }
    for (let i = 0; i < 4; i += 1) {
      await page.click('#navHam');
      await expect(page.locator('#navMenu')).toHaveAttribute('aria-hidden', 'false');
      await page.click('#navHam');
      await expect(page.locator('#navMenu')).toHaveAttribute('aria-hidden', 'true');
    }
  });

  test('1.37 video hover remains reversible across three cycles', async ({ page }) => {
    const wrap = page.locator('[data-video-stream-wrap]');
    await wrap.scrollIntoViewIfNeeded();
    for (let i = 0; i < 3; i += 1) {
      await wrap.hover();
      await expect(wrap).toHaveClass(/is-playing/);
      await expect(page.locator('[data-video-stream-placeholder]')).toHaveCSS('opacity', '0');
      await page.mouse.move(0, 0);
      await expect(wrap).not.toHaveClass(/is-playing/);
      await expect(page.locator('[data-video-stream-placeholder]')).toHaveCSS('opacity', '1');
      expect(await page.locator('#socialVideo').evaluate((v) => v.paused)).toBe(true);
    }
  });

  test('1.49 1.54 1.59 shortlist kinds and twenty-step history stay coherent', async ({ page }) => {
    await page.locator('.h-card .shortlist-btn').first().click();
    await page.locator('.helmet-card .shortlist-btn').first().click();
    await page.click('[data-race-id="r1"] [data-race-toggle]');
    await expect(page.locator('[data-shortlist-count]')).toHaveText('2');
    await expect(page.locator('[data-selected-count]')).toHaveText('1');
    await page.click('#pressKitBtn');
    const doc = JSON.parse(await page.locator('[data-presskit-preview]').textContent());
    expect(doc.shortlist.map((entry) => entry.kind).sort()).toEqual(['editorial', 'helmet']);
    expect(doc.shortlist.every((entry) => entry.label.length > 0 && entry.label.length <= 60 && Number.isInteger(entry.index) && entry.index >= 1)).toBe(true);
    await page.click('[data-presskit-close]');
    for (let i = 0; i < 20; i += 1) await page.locator('.h-card .shortlist-btn').nth(i % 6).click();
    await page.locator('[data-undo]').focus();
    for (let i = 0; i < 20; i += 1) await page.keyboard.press('Enter');
    await page.locator('[data-redo]').focus();
    for (let i = 0; i < 20; i += 1) await page.keyboard.press('Enter');
    await expect(page.locator('[data-redo]')).toBeDisabled();
  });

  test('14.12 1.51 1.58 copy stages a valid round-trip import', async ({ page }) => {
    await page.click('[data-race-id="r1"] [data-race-toggle]');
    await page.click('[data-race-id="r2"] [data-race-toggle]');
    await page.locator('.helmet-card .shortlist-btn').first().click();
    await page.click('#pressKitBtn');
    await page.click('[data-presskit-copy]');
    await expect(page.locator('[data-presskit-confirm]')).toContainText('JSON ready to import');
    const staged = await page.locator('[data-import-area]').inputValue();
    expect(JSON.parse(staged).races.map((race) => race.circuit)).toEqual(['Alpine GP', 'Bayfront Circuit']);
    await page.click('[data-presskit-close]');
    await page.click('[data-undo]');
    await page.click('[data-undo]');
    await page.click('[data-undo]');
    await page.click('#pressKitBtn');
    await page.click('[data-import-paste]');
    await expect(page.locator('[data-import-msg]')).toContainText('Imported 2 selected race(s) and 1 shortlist item(s)');
    await expect(page.locator('[data-selected-count]')).toHaveText('2');
    await expect(page.locator('[data-shortlist-count]')).toHaveText('1');
    await page.click('[data-tab="ics"]');
    expect((await page.locator('[data-presskit-preview]').textContent()).match(/BEGIN:VEVENT/g)).toHaveLength(2);
  });

  test('1.41 1.42 newsletter blocks empty and confirms once', async ({ page }) => {
    await page.locator('#newsletterEmail').press('Enter');
    await expect(page.locator('#newsletterMsg')).toContainText('Email is missing');
    await page.fill('#newsletterEmail', 'fan@averyvale.example');
    await page.locator('#newsletterSubmit').dblclick();
    await expect(page.locator('#newsletterMsg')).toHaveText('Signup succeeded — welcome to the Nova Racing dispatch.');
  });

  test('1.56 2.26 status editor validates enum and returns focus', async ({ page }) => {
    const row = page.locator('[data-race-id="r1"]');
    await row.locator('[data-race-edit]').click();
    await row.locator('[data-status-select]').selectOption('Postponed');
    await row.locator('.race-edit-form').evaluate((form) => form.requestSubmit());
    await expect(row.locator('[data-edit-error]')).toContainText('status must be Upcoming or Completed');
    await expect(row.locator('[data-race-status]')).toHaveText('Upcoming');
    await row.locator('[data-status-select]').selectOption('Completed');
    await row.locator('.race-edit-form').evaluate((form) => form.requestSubmit());
    await expect(row.locator('[data-race-status]')).toHaveText('Completed');
    await expect(row.locator('[data-race-edit]')).toBeFocused();
  });

  test('4.21 malformed import leaves shared state intact with inline error', async ({ page }) => {
    await page.click('[data-race-id="r1"] [data-race-toggle]');
    await page.locator('.helmet-card .shortlist-btn').first().click();
    await page.click('#pressKitBtn');
    const before = await page.locator('[data-presskit-preview]').textContent();
    await page.fill('[data-import-area]', '{bad');
    await page.click('[data-import-paste]');
    await expect(page.locator('[data-import-msg]')).toContainText('Import error: malformed JSON');
    expect(await page.locator('[data-presskit-preview]').textContent()).toBe(before);
  });

  test('2.7 2.24 authored GL and vector asset families load same-origin', async ({ page }) => {
    const urls = await page.evaluate(() => performance.getEntriesByType('resource').map((entry) => entry.name));
    for (const path of ['/gl/avery-sculpture.glb', '/gl/basecolor.png', '/gl/roughness.png', '/gl/metallic.png', '/gl/studio.hdr', '/rive/avery-apex.riv']) {
      expect(urls.some((url) => url.endsWith(path)), `${path} requested`).toBe(true);
      const response = await page.request.get(`${BASE}${path}`);
      expect(response.ok(), `${path} loads`).toBe(true);
    }
  });

  test('2.13 2.14 every enabled button has a name and visible focus', async ({ page }) => {
    const unnamed = await page.locator('button:not([disabled])').evaluateAll((buttons) => buttons.filter((button) => {
      const name = button.getAttribute('aria-label') || button.textContent.trim();
      return !name;
    }).length);
    expect(unnamed).toBe(0);
    await page.locator('#navHam').focus();
    expect(await page.locator('#navHam').evaluate((button) => getComputedStyle(button).outlineStyle)).not.toBe('none');
  });

  test('3.4 3.8 3.10 4.25 required transition timings are authored', async ({ page }) => {
    await page.click('#navHam');
    expect(await page.locator('#navMenu').evaluate((el) => getComputedStyle(el).transitionDuration)).toContain('0.75s');
    await page.click('#navHam');
    await page.locator('.helmet-card').first().hover();
    expect(await page.locator('.helmet-card-reveal').first().evaluate((el) => getComputedStyle(el).transitionDuration)).toContain('0.75s');
    await page.click('#pressKitBtn');
    const transition = await page.locator('#pressKitDrawer').evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(transition).toContain('0.3s');
    await page.click('[data-presskit-close]');
    await expect(page.locator('#pressKitDrawer')).toHaveAttribute('aria-hidden', 'true');
  });

  test('1.8 2.19 horizontal travel and full-page scrolling remain stable', async ({ page }) => {
    const section = page.locator('#horizontal-media');
    await section.scrollIntoViewIfNeeded();
    const start = await page.locator('#horizontalTrack').evaluate((el) => getComputedStyle(el).transform);
    const box = await section.boundingBox();
    await page.evaluate((delta) => scrollBy(0, delta), Math.max(500, box.height * 0.45));
    await page.waitForTimeout(150);
    const end = await page.locator('#horizontalTrack').evaluate((el) => getComputedStyle(el).transform);
    expect(end).not.toBe(start);
    const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    const step = Math.max(240, Math.floor(page.viewportSize().height * 0.75));
    for (let y = 0; y <= max; y += step) {
      await page.evaluate((nextY) => scrollTo(0, nextY), y);
      await page.waitForTimeout(20);
    }
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(max * 0.8);
  });

  test('1.43 9.a5 WebGL denial leaves a complete static hero', async ({ page }) => {
    await expect(page.locator('[data-hero-canvas]')).toHaveClass(/is-live/);
    await page.locator('[data-hero-canvas]').evaluate((canvas) => {
      canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    });
    await expect(page.locator('[data-hero-canvas]')).toHaveClass(/is-fallback/);
    await expect(page.locator('.home-hero-figure')).toBeVisible();
    await expect(page.locator('#navHam')).toBeVisible();
    await expect(page.locator('#pressKitBtn')).toBeVisible();
    await expect(page.locator('#race-calendar')).toBeAttached();
  });

  test('3.12-3.19 reference blocks and authored material scene are present', async ({ page }) => {
    for (const selector of ['#siteNav', '#hero', '#horizontal-media', '.text-impact', '#helmet-grid', '#collabs', '#social-stream', '#footer']) {
      await expect(page.locator(selector)).toBeAttached();
    }
    expect(await page.locator('.h-card').count()).toBeGreaterThanOrEqual(6);
    expect(await page.locator('.helmet-card').count()).toBe(3);
    expect(await page.locator('#collabList img').count()).toBeGreaterThanOrEqual(5);
    await expect(page.locator('[data-hero-canvas]')).toHaveClass(/is-live/);
    const rect = await page.locator('[data-hero-canvas]').boundingBox();
    expect(rect.width).toBeGreaterThan(0);
    expect(rect.height).toBeGreaterThan(0);
  });

  test('1.1 interactive_controls_keyboard_operable reproduces every named control family', async ({ page }) => {
    const families = [
      '#storeBtn', '#pressKitBtn', '#navHam',
      '[data-race-toggle]', '.filter-btn', '.shortlist-btn',
      '#newsletterEmail',
    ];
    for (const selector of families) {
      const control = page.locator(selector).first();
      await control.scrollIntoViewIfNeeded();
      await control.focus();
      await expect(control).toBeFocused();
    }
    await page.locator('.shortlist-btn').first().click();
    await page.locator('[data-undo]').focus();
    await expect(page.locator('[data-undo]')).toBeFocused();
    await page.keyboard.press('Enter');
    await page.locator('[data-redo]').focus();
    await expect(page.locator('[data-redo]')).toBeFocused();
    await page.keyboard.press('Enter');
    await page.locator('#navHam').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#navMenu')).toHaveAttribute('aria-hidden', 'false');
    for (const control of await page.locator('[data-menu-link], [data-social], [data-legal], [data-contact]').all()) {
      await control.focus();
      await expect(control).toBeFocused();
    }
    await page.keyboard.press('Escape');
    await page.keyboard.press('Control+K');
    await page.fill('#paletteInput', 'calendar');
    const result = page.locator('.palette-item').first();
    await result.focus();
    await expect(result).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#commandPalette')).toHaveAttribute('aria-hidden', 'true');
  });

  test('1.8 contrast_cream_and_dark_sections reproduces measured menu and STORE contrast', async ({ page }) => {
    await page.click('#navHam');
    await expect(page.locator('#navMenu')).toHaveAttribute('aria-hidden', 'false');
    const contrast = await page.locator('[data-menu-item] .nav-menu-link-btn').evaluate((el) => {
      const rgb = (value) => value.match(/\d+(?:\.\d+)?/g).slice(0, 3).map(Number);
      const luminance = (value) => {
        const channels = rgb(value).map((channel) => {
          const n = channel / 255;
          return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
      };
      const fg = luminance(getComputedStyle(el).color);
      const bg = luminance(getComputedStyle(el.closest('#navMenu')).backgroundColor);
      return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
    });
    expect(contrast).toBeGreaterThanOrEqual(4.5);
    await page.keyboard.press('Escape');
    const storeContrast = await page.locator('#storeBtn').evaluate((el) => {
      const values = [getComputedStyle(el).color, getComputedStyle(el).backgroundColor]
        .map((value) => value.match(/\d+/g).slice(0, 3).map(Number))
        .map((channels) => channels.map((channel) => {
          const n = channel / 255;
          return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
        }))
        .map((channels) => 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]);
      return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
    });
    expect(storeContrast).toBeGreaterThanOrEqual(4.5);
  });

  test('1.35 menu_flow_probe preserves scroll, stroke, destination, and fixed nav', async ({ page }) => {
    await page.evaluate(() => scrollTo(0, 480));
    const before = await page.evaluate(() => scrollY);
    await page.click('#navHam');
    await expect(page.locator('#navMenu')).toHaveAttribute('aria-hidden', 'false');
    const stroke = await page.locator('.nav-menu-link-current-svg path').evaluate((el) => getComputedStyle(el).stroke);
    expect(stroke).toBe('rgb(210, 255, 0)');
    await page.click('#navClose');
    expect(await page.evaluate(() => scrollY)).toBe(before);
    await page.click('#navHam');
    await page.click('[data-menu-link][data-dest="horizontal-media"]');
    await expect(page.locator('#navMenu')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('#siteNav')).toHaveCSS('position', 'fixed');
    expect(new URL(page.url()).pathname).toBe('/');
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before);
  });

  test('1.39 rapid_menu_toggle_settles alternates hamburger and X without inert state', async ({ page }) => {
    for (let i = 0; i < 4; i += 1) {
      await page.click('#navHam');
      await expect(page.locator('#navMenu')).toHaveAttribute('aria-hidden', 'false');
      await page.click('#navClose');
      await expect(page.locator('#navMenu')).toHaveAttribute('aria-hidden', 'true');
      await expect(page.locator('#navHam')).toBeEnabled();
    }
    await expect(page.locator('body')).not.toHaveClass(/is-menu-open/);
  });

  test('3.4 3.8 3.10 real controls expose every recorded motion and component state', async ({ page }) => {
    const preloader = page.locator('#preloader');
    await expect(preloader).toHaveAttribute('aria-hidden', 'true');
    await page.click('#navHam');
    await expect(page.locator('#navMenu')).toHaveCSS('transition-duration', /0.75s/);
    await expect(page.locator('[data-menu-item] .nav-menu-link-btn')).toHaveCSS('color', 'rgb(180, 184, 165)');
    await page.keyboard.press('Escape');
    await page.locator('#storeBtn').hover();
    await expect(page.locator('#storeBtn .btn-split-a')).toHaveCSS('transition-duration', /0.4s/);
    const helmet = page.locator('.helmet-card').first();
    await helmet.hover();
    await expect(helmet.locator('.helmet-card-reveal')).toHaveCSS('transition-duration', /0.75s/);
    await expect(helmet.locator('.helmet-index')).toHaveCSS('color', 'rgb(210, 255, 0)');
    await expect(page.locator('#newsletterSubmit')).toBeDisabled();
    await page.fill('#newsletterEmail', 'fan@averyvale.example');
    await expect(page.locator('#newsletterSubmit')).toBeEnabled();
    const video = page.locator('[data-video-stream-wrap]');
    await video.hover();
    await expect(page.locator('[data-video-stream-placeholder]')).toHaveCSS('transition-duration', /0.3s/);
    await expect(page.locator('[data-video-stream-placeholder]')).toHaveCSS('opacity', '0');
  });

  test('2.13 keyboard_operable_with_focus_ring proves every named family has visible focus', async ({ page }) => {
    const selectors = ['#storeBtn', '#pressKitBtn', '#navHam', '.filter-btn', '[data-race-toggle]', '[data-race-edit]', '.shortlist-btn', '#newsletterEmail'];
    for (const selector of selectors) {
      const control = page.locator(selector).first();
      await control.scrollIntoViewIfNeeded();
      await control.focus();
      const outline = await control.evaluate((el) => {
        const style = getComputedStyle(el);
        return { width: parseFloat(style.outlineWidth), style: style.outlineStyle };
      });
      expect(outline.style).not.toBe('none');
      expect(outline.width).toBeGreaterThan(0);
    }
  });

  test('remaining FAIL and BLOCKED observations reproduce in one browser session', async ({ page }) => {
    await test.step('3.12 block_fidelity_fixed_nav_bar', async () => {
    const nav = page.locator('#siteNav');
    await expect(nav).toHaveCSS('position', 'fixed');
    await expect(page.locator('.wordmark-avery').first()).toHaveText('AVERY');
    await expect(page.locator('.wordmark-vale').first()).toHaveText('VALE');
    await expect(page.locator('.nav-monogram')).toBeVisible();
    await expect(page.locator('#storeBtn')).toHaveCSS('background-color', 'rgb(210, 255, 0)');
    const hamburger = await page.locator('#navHam').boundingBox();
    expect(Math.abs(hamburger.width - hamburger.height)).toBeLessThanOrEqual(1);
    await page.locator('#social-stream').scrollIntoViewIfNeeded();
    await expect(nav).toBeVisible();
    await expect(nav).toHaveCSS('top', '0px');
    });

    await test.step('3.13 block_fidelity_hero_next_race_widget', async () => {
    await expect(page.locator('#hero')).toHaveCSS('background-color', 'rgb(239, 239, 229)');
    await expect(page.locator('.home-hero-topo')).toBeVisible();
    await expect(page.locator('.home-hero-figure')).toBeVisible();
    const widget = page.locator('[data-next-race]');
    await expect(widget).toBeVisible();
    await expect(widget).toContainText('NEXT RACE');
    await expect(widget).toContainText('ALPINE GP');
    await expect(widget).toContainText('NOVA RACING');
    await expect(widget.locator('.home-hero-next-race-circuit svg')).toBeVisible();
    await expect(widget.locator('.home-hero-next-race-laurel svg')).toBeVisible();
    });

    await test.step('3.14 block_fidelity_horizontal_media_strip', async () => {
    const labels = await page.locator('.h-card-cap').allTextContents();
    expect(labels).toEqual(['ON TRACK', 'SPEED', 'OFF TRACK', 'FOCUS', 'GARAGE', 'PODIUM']);
    const section = page.locator('#horizontal-media');
    await section.scrollIntoViewIfNeeded();
    const before = await page.locator('#horizontalTrack').evaluate((el) => getComputedStyle(el).transform);
    await page.mouse.wheel(0, 900);
    await expect.poll(() => page.locator('#horizontalTrack').evaluate((el) => getComputedStyle(el).transform)).not.toBe(before);
    await expect(page.locator('.h-card').first()).toHaveCSS('border-radius', /\d+px/);
    });

    await test.step('3.16 block_fidelity_helmet_grid', async () => {
    await expect(page.locator('#helmet-grid .section-eyebrow')).toHaveText('THE HELMET');
    await expect(page.locator('.helmet-card')).toHaveCount(3);
    expect(await page.locator('.helmet-index').allTextContents()).toEqual(['01', '02', '03']);
    const columns = await page.locator('.helmet-grid').evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(3);
    for (const image of await page.locator('.helmet-card-base').all()) await expect(image).toBeVisible();
    });

    await test.step('3.17 block_fidelity_collaborators_marquee', async () => {
    await page.locator('#collabs').scrollIntoViewIfNeeded();
    await expect(page.locator('#collabs .section-eyebrow')).toHaveText('COLLABS');
    const marks = page.locator('#collabList img');
    await expect(marks).toHaveCount(5);
    for (const mark of await marks.all()) {
      await expect(mark).toBeVisible();
      expect((await mark.boundingBox()).width).toBeGreaterThan(0);
    }
    const mask = await page.locator('#collabs .marquee').evaluate((el) => getComputedStyle(el).maskImage || getComputedStyle(el).webkitMaskImage);
    expect(mask).toContain('linear-gradient');
    });

    await test.step('3.18 block_fidelity_social_video_card', async () => {
    await page.locator('#social-stream').scrollIntoViewIfNeeded();
    await expect(page.locator('#social-stream .section-eyebrow')).toHaveText('SOCIAL');
    await expect(page.locator('[data-video-stream-placeholder]')).toBeVisible();
    await expect(page.locator('[data-video-hint]')).toHaveText('HOVER TO PLAY');
    await expect(page.locator('[data-video-stream-wrap]')).toHaveCSS('border-radius', /\d+px/);
    await page.locator('[data-video-stream-wrap]').hover();
    await expect(page.locator('[data-video-stream-wrap]')).toHaveClass(/is-playing/);
    });

    await test.step('3.19 block_fidelity_footer_statement_newsletter', async () => {
    await page.locator('#footer').scrollIntoViewIfNeeded();
    await expect(page.locator('.footer-statement')).toHaveAttribute('aria-label', 'DRIVEN BY THE FANS. BUILT FOR THE FUTURE.');
    await expect(page.locator('#footerMarquee img')).toHaveCount(5);
    await expect(page.locator('#newsletterForm')).toBeVisible();
    await expect(page.locator('.footer-brand')).toContainText('AVERYVALE');
    await expect(page.locator('.footer-legal')).toContainText('Privacy Policy');
    await expect(page.locator('.footer-copy')).toContainText('2025 Avery Vale');
    });

    await test.step('innovation.catchall', async () => {
    await page.evaluate(() => scrollTo(0, 360));
    const before = await page.evaluate(() => scrollY);
    await page.click('#navHam');
    const contact = page.locator('[data-contact]');
    await contact.click();
    await expect(contact).toContainText(/COPIED|COPY BLOCKED/);
    expect(await page.evaluate(() => scrollY)).toBe(before);
    expect(new URL(page.url()).pathname).toBe('/');
    });

    await test.step('2.19 smooth_full_page_scroll', async () => {
    const health = await page.evaluate(async () => {
      const longTasks = [];
      const observer = 'PerformanceObserver' in window
        ? new PerformanceObserver((list) => longTasks.push(...list.getEntries().map((entry) => entry.duration)))
        : null;
      try { observer?.observe({ type: 'longtask', buffered: true }); } catch { /* unsupported */ }
      const frames = [];
      let previous = performance.now();
      const bottom = document.documentElement.scrollHeight - innerHeight;
      for (let step = 0; step <= 48; step += 1) {
        scrollTo(0, bottom * (step / 48));
        await new Promise((resolve) => requestAnimationFrame((now) => {
          frames.push(now - previous); previous = now; resolve();
        }));
      }
      observer?.disconnect();
      frames.sort((a, b) => a - b);
      return { p95: frames[Math.floor(frames.length * 0.95)], maxLongTask: Math.max(0, ...longTasks) };
    });
    expect(health.p95).toBeLessThan(80);
    expect(health.maxLongTask).toBeLessThan(250);
    });

    await test.step('3.28 physical_3d_and_crisp_vector_assets', async () => {
    const canvas = page.locator('[data-hero-canvas]');
    await expect(canvas).toHaveClass(/is-live/);
    await canvas.scrollIntoViewIfNeeded();
    const materialColors = async () => canvas.evaluate((el) => {
      const gl = el.getContext('webgl2') || el.getContext('webgl');
      const width = el.width, height = el.height;
      const points = [];
      for (let y = 0.2; y <= 0.8; y += 0.1) for (let x = 0.2; x <= 0.8; x += 0.1) {
        const pixel = new Uint8Array(4);
        gl.readPixels(Math.floor(width * x), Math.floor(height * y), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        if (pixel[3] > 0) points.push(Array.from(pixel));
      }
      return new Set(points.map((sample) => sample.slice(0, 3).join(','))).size;
    });
    await expect.poll(materialColors).toBeGreaterThanOrEqual(3);
    await expect(page.locator('[data-rive-motif] canvas')).toBeVisible();
    const motif = await page.locator('[data-rive-motif] canvas').evaluate((el) => ({ width: el.width, clientWidth: el.clientWidth }));
    expect(motif.width).toBeGreaterThanOrEqual(motif.clientWidth);
    });
  });
});
/* eslint-enable playwright/no-networkidle, playwright/prefer-locator, playwright/prefer-web-first-assertions, playwright/missing-playwright-await, playwright/no-wait-for-timeout, playwright/prefer-to-have-count */
