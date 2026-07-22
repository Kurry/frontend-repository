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

// Writing-dimension criterion tests. Each asserts a browser-observable string
// or copy behavior mandated by instruction.md (uppercase nav convention,
// specific action labels, newsletter validation/confirmation copy, exact
// mandated chrome strings, fictional-brand terminology, press-kit empty-state
// and import-error phrasing). Uses the canonical `test`/`expect` above, which
// also enforces zero console/page errors during each flow.
test.describe('writing (criterion suite)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
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
