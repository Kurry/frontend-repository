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

// Noma Student Homes (frontend-landing-units-gr) — task-specific criterion
// suite. Selectors below were confirmed against the real served DOM (not
// guessed): data-action / data-role / data-tier attributes, aria-labels, and
// stable classes (.nav-overlay, .living-slide-status, .cursor-wrap) found in
// tasks/frontend-landing-units-gr/solution/app/prebuilt/index.html and by
// driving the live app with Playwright.

// The skeleton intro timeline (~0.5s rise + ~1.2s sweep + ~1s stagger) must
// settle before controls are interacted with the way a real visitor would.
// The cookie consent banner is fixed-position and intercepts clicks on
// underlying chrome once it appears, so tests that are not themselves about
// the consent banner dismiss it here (a real visitor would do the same
// before continuing to use the page).
async function gotoSettled(page, path = '/', { dismissConsent = true } = {}) {
  await page.goto(BASE + path);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2800);
  if (dismissConsent) {
    const acceptBtn = page.locator('[data-consent="accept"]');
    try {
      await acceptBtn.waitFor({ state: 'visible', timeout: 3000 });
      await acceptBtn.click();
    } catch {
      // Banner had not appeared within the window; nothing to dismiss.
    }
  }
}

function nextMonthYYYYMM() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function fillValidInquiry(page, { fullName, tier }) {
  await page.locator('#inquiry-form input[name="full_name"]').fill(fullName);
  await page.locator('#inquiry-form input[name="email"]').fill('roundtrip@example.com');
  await page.locator('#inquiry-form input[name="phone"]').fill('6900000000');
  await page.locator('#inquiry-form select[name="studio_tier"]').selectOption(tier);
  await page.locator('#inquiry-form input[name="move_in_month"]').fill(nextMonthYYYYMM());
  await page.locator('#inquiry-form input[name="privacy_consent"]').check();
}

test.describe('frontend-landing-units-gr criteria', () => {
  test('1.2 root_title_and_canvas_color', async ({ page }) => {
    await gotoSettled(page);
    await expect(page).toHaveTitle('Αρχική - Noma');
    expect(await page.evaluate(() => document.documentElement.lang)).toBe('el');
    const colors = await page.evaluate(() => {
      const cs = getComputedStyle(document.body);
      return { bg: cs.backgroundColor, color: cs.color };
    });
    expect(colors.bg, 'body background must be exactly rgb(244, 233, 225)').toBe('rgb(244, 233, 225)');
    expect(colors.color, 'body text must be exactly rgb(0, 0, 0)').toBe('rgb(0, 0, 0)');
  });

  test('1.1 hero_settled_headline_and_cta', async ({ page }) => {
    await gotoSettled(page);
    await expect(page.locator('h1.title')).toHaveText('Home of the uniquely awesome.');
    await expect(page.locator('.hero .cta[data-action="open-inquiry"] span').first()).toHaveText('Book your Studio');
    const skeletonDisplay = await page.evaluate(() => {
      const el = document.querySelector('.skeleton-container');
      return el ? getComputedStyle(el).display : 'absent';
    });
    expect(skeletonDisplay, 'skeleton intro loader must not remain on screen after settle').toBe('none');
  });

  test('1.26 menu_flow_scroll_position_round_trip', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoSettled(page);
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(150);
    const scrollBefore = await page.evaluate(() => window.scrollY);
    expect(scrollBefore, 'test setup must actually scroll before opening the menu').toBeGreaterThan(200);

    await page.locator('.hamburger').click();
    await expect(page.locator('body')).toHaveClass(/menu-open/);
    await expect(page.locator('html')).toHaveClass(/menu-locked/);
    for (const label of ['01 Student Homes', '02 Our way of living', '03 Community', '04 Επικοινωνία']) {
      await expect(page.getByRole('link', { name: label })).toBeVisible();
    }

    await page.locator('[data-action="close-menu"]').click();
    await expect(page.locator('body')).not.toHaveClass(/menu-open/);
    await expect(page.locator('html')).not.toHaveClass(/menu-locked/);
    const scrollAfter = await page.evaluate(() => window.scrollY);
    expect(scrollAfter, 'scroll position must be exactly restored after closing the menu').toBe(scrollBefore);
  });

  test('1.27 carousel_flow_reload_resets_to_first_slide', async ({ page }) => {
    await gotoSettled(page);
    const status = page.locator('.living-slide-status');
    await expect(status).toHaveText('1 / 4 · Community living spaces');

    await page.locator('.swiper-living .button-next').click();
    await expect(status).toHaveText('2 / 4 · Ασφάλεια');

    await page.locator('.swiper-living .button-prev').click();
    await expect(status).toHaveText('1 / 4 · Community living spaces');

    await page.locator('.swiper-living .button-next').click();
    await expect(status).toHaveText('2 / 4 · Ασφάλεια');
    await gotoSettled(page);
    await expect(status).toHaveText(
      '1 / 4 · Community living spaces',
      { timeout: 5000 },
    );
  });

  test('1.28 consent_flow_seeded_baseline_on_reload', async ({ page }) => {
    await gotoSettled(page, '/', { dismissConsent: false });
    const banner = page.locator('#cky-consent-container');
    await expect(banner).toHaveClass(/is-visible/);
    await expect(banner.locator('span', { hasText: 'Χρησιμοποιούμε cookies' })).toBeVisible();

    await page.locator('[data-consent="accept"]').click();
    await expect(banner).not.toHaveClass(/is-visible/);

    await gotoSettled(page, '/', { dismissConsent: false });
    await expect(page.locator('#cky-consent-container')).toHaveClass(/is-visible/);
  });

  test('1.36 studio_shortlist_toggle_and_estimate', async ({ page }) => {
    await gotoSettled(page);
    await page.locator('.add-to-shortlist-btn[data-tier="Kick"]').click();
    await page.locator('.add-to-shortlist-btn[data-tier="Boost"]').click();
    await expect(page.locator('[data-role="badge"]')).toHaveText('2');
    await expect(page.locator('[data-role="estimate"]')).toHaveText('1330€');

    await page.locator('[data-action="open-drawer"]').click();
    const rows = await page.locator('[data-role="rows"]').innerText();
    expect(rows).toContain('Kick Studio');
    expect(rows).toContain('640€/μήνα');
    expect(rows).toContain('Boost Studio');
    expect(rows).toContain('690€/μήνα');
  });

  test('1.37 shortlist_undo_redo_round_trip', async ({ page }) => {
    await gotoSettled(page);
    await page.locator('.add-to-shortlist-btn[data-tier="Kick"]').click();
    await page.locator('.add-to-shortlist-btn[data-tier="Boost"]').click();
    await expect(page.locator('[data-role="badge"]')).toHaveText('2');

    // Undo/Redo controls live inside the shortlist drawer.
    await page.locator('[data-action="open-drawer"]').click();
    await page.locator('[data-action="undo"]').click();
    await expect(page.locator('[data-role="badge"]')).toHaveText('1');
    await expect(page.locator('[data-role="estimate"]')).toHaveText('640€');

    await page.locator('[data-action="redo"]').click();
    await expect(page.locator('[data-role="badge"]')).toHaveText('2');
    await expect(page.locator('[data-role="estimate"]')).toHaveText('1330€');
  });

  test('1.38 booking_inquiry_opens_from_book_cta', async ({ page }) => {
    await gotoSettled(page);
    await page.locator('.hero .cta[data-action="open-inquiry"]').click();
    const dialog = page.locator('#booking-inquiry-overlay');
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate((d) => d.open)).toBe(true);
    await expect(dialog.locator('h2')).toHaveText('Book your Studio');
    await expect(page.locator('#inquiry-form input[name="full_name"]')).toBeVisible();
    await expect(page.locator('#inquiry-form input[name="email"]')).toBeVisible();
    await expect(page.locator('#inquiry-form input[name="phone"]')).toBeVisible();
    await expect(page.locator('#inquiry-form select[name="studio_tier"]')).toBeVisible();
    await expect(page.locator('#inquiry-form input[name="move_in_month"]')).toBeVisible();
    await expect(page.locator('#inquiry-form textarea[name="message"]')).toBeVisible();
    await expect(
      page.locator('#inquiry-form label.inq-check', { hasText: 'Συμφωνώ με την Πολιτική Απορρήτου' }),
    ).toBeVisible();
  });

  test('1.43 inquiry_field_contract_rejects_invalid', async ({ page }) => {
    await gotoSettled(page);
    await page.locator('[data-action="open-inquiry"]').first().click();
    await page.locator('#inquiry-form input[name="email"]').fill('not-an-email');
    await page.locator('#inquiry-form input[name="phone"]').fill('123');
    await page.locator('#inquiry-form button[type="submit"]').click();

    const dialog = page.locator('#booking-inquiry-overlay');
    await expect(dialog).toBeVisible();
    await expect(page.locator('.inq-err[data-err="email"]')).not.toHaveText('');
    await expect(page.locator('.inq-err[data-err="phone"]')).not.toHaveText('');
    await expect(page.locator('[data-role="ready"]')).toBeHidden();
    await expect(page.locator('[data-role="export-actions"]')).toBeHidden();
  });

  test('1.40 export_packet_reflects_session_mutations', async ({ page }) => {
    await gotoSettled(page);
    await page.locator('.add-to-shortlist-btn[data-tier="Flex"]').click();
    await page.locator('[data-action="open-inquiry"]').first().click();
    await fillValidInquiry(page, { fullName: 'Playwright E2E Tester', tier: 'Flex' });
    await page.locator('#inquiry-form button[type="submit"]').click();

    await expect(page.locator('[data-role="ready"]')).toBeVisible();
    await expect(page.locator('[data-role="export-actions"]')).toBeVisible();

    await page.locator('[data-action="export-json"]').click();
    const preview = await page.locator('[data-role="preview"]').innerText();
    const packet = JSON.parse(preview);

    expect(packet.inquiry.full_name).toBe('Playwright E2E Tester');
    expect(packet.inquiry.studio_tier).toBe('Flex');
    expect(packet.inquiry.privacy_consent).toBe(true);
    const flexEntry = packet.shortlist.find((s) => s.tier === 'Flex');
    expect(flexEntry, 'shortlisted Flex tier must appear in the exported packet').toBeTruthy();
    expect(flexEntry.monthly_rent_eur).toBe(740);
    const sum = packet.shortlist.reduce((acc, s) => acc + s.monthly_rent_eur, 0);
    expect(packet.monthly_estimate_eur).toBe(sum);
  });

  test('1.41 faq_three_seeded_accordions', async ({ page }) => {
    await gotoSettled(page);
    const items = page.locator('.faq-item');
    await expect(items).toHaveCount(3);
    const questions = ['Τι περιλαμβάνει το ενοίκιο;', 'Πότε μπορώ να κλείσω studio;', 'Πώς επικοινωνώ με τη Noma;'];
    for (const q of questions) {
      await expect(page.locator('.faq-q', { hasText: q })).toBeVisible();
    }

    const first = page.locator('.faq-q').nth(0);
    const second = page.locator('.faq-q').nth(1);
    await first.click();
    await expect(first).toHaveAttribute('aria-expanded', 'true');

    await second.click();
    await expect(second).toHaveAttribute('aria-expanded', 'true');
    await expect(first).toHaveAttribute('aria-expanded', 'false');
  });

  test('1.42 command_palette_opens_and_navigates', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoSettled(page);
    await page.keyboard.press('Control+k');
    const palette = page.locator('#cmd-palette');
    await expect(palette).toBeVisible();
    const inputFocused = await page.evaluate(() => document.activeElement === document.getElementById('cmd-input'));
    expect(inputFocused, 'the search input must be focused when the palette opens').toBe(true);
    await expect(page.locator('#cmd-list .cmd-item', { hasText: 'Student Homes' })).toBeVisible();

    await page.keyboard.press('Enter');
    await expect(palette).toBeHidden();
    // Smooth-scroll (Lenis) takes a beat to settle before the section is in view.
    await page.waitForTimeout(1200);
    const typicalStudioInView = await page.evaluate(() => {
      const r = document.getElementById('typical-studio').getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    });
    expect(typicalStudioInView, 'choosing typical-unit must scroll the typical-studio section into view').toBe(true);

    await page.keyboard.press('Control+k');
    await expect(palette).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(palette).toBeHidden();
    expect(new URL(page.url()).pathname).toBe('/');
  });

  test('1.10 custom_cursor_desktop_only', async ({ page }) => {
    // The `.block-cursor` container is what the max-width:1023px media query
    // toggles; its child `.cursor-wrap` always computes display:block on its
    // own CSS, so the effective on/off state must be read from the
    // ancestor. Each width is a fresh navigation, matching how the
    // reference is graded (separate loads at 1440/768/390), since the
    // container's mount-time layout is not guaranteed to react to an
    // in-place resize.
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoSettled(page);
    expect(await page.locator('.block-cursor').evaluate((el) => getComputedStyle(el).display)).toBe('block');

    await page.setViewportSize({ width: 390, height: 844 });
    await gotoSettled(page);
    expect(await page.locator('.block-cursor').evaluate((el) => getComputedStyle(el).display)).toBe('none');
  });

  test('7.1 breakpoint_1024_sidebar_vs_mobile_bar', async ({ page }) => {
    await page.setViewportSize({ width: 1023, height: 900 });
    await gotoSettled(page);
    await expect(page.locator('.hamburger')).toBeVisible();
    await expect(page.getByRole('link', { name: '01 Student Homes' })).toBeHidden();
    const mainLeftMobile = await page.evaluate(() => document.querySelector('main').getBoundingClientRect().left);
    expect(mainLeftMobile, 'main content left margin must collapse to 0 below 1024px').toBe(0);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(200);
    await expect(page.locator('.hamburger')).toBeHidden();
    await expect(page.getByRole('link', { name: '01 Student Homes' })).toBeVisible();
  });

  test('6.14 import_round_trip_restores_session', async ({ page }) => {
    await gotoSettled(page);
    await page.locator('.add-to-shortlist-btn[data-tier="Kick"]').click();
    await page.locator('[data-action="open-inquiry"]').first().click();
    await fillValidInquiry(page, { fullName: 'Import Roundtrip Tester', tier: 'Kick' });
    await page.locator('#inquiry-form button[type="submit"]').click();
    await expect(page.locator('[data-role="ready"]')).toBeVisible();

    await page.locator('[data-action="export-json"]').click();
    const exported = await page.locator('[data-role="preview"]').innerText();

    // The inquiry overlay is a native modal <dialog>, so the shortlist toggle
    // behind it is not reachable while it is open — close it first, exactly
    // as a real visitor would have to.
    await page.locator('[data-action="close-inquiry"]').click();
    await expect(page.locator('#booking-inquiry-overlay')).toBeHidden();

    // Clear the session: remove the shortlisted tier, then reopen the
    // overlay and reset the form.
    await page.locator('.add-to-shortlist-btn[data-tier="Kick"]').click();
    await expect(page.locator('[data-role="badge"]')).toHaveText('0');

    await page.locator('[data-action="open-inquiry"]').first().click();
    await page.locator('[data-action="reset-inquiry"]').click();
    await expect(page.locator('#inquiry-form input[name="full_name"]')).toHaveValue('');

    // Reveal the paste panel, paste the exported packet, and commit the import.
    await page.locator('[data-action="import-open"]').click();
    await page.locator('#import-paste').fill(exported);
    await page.locator('[data-action="import-open"]').click();

    await expect(page.locator('[data-role="import-err"]')).toHaveText('');
    await expect(page.locator('[data-role="badge"]')).toHaveText('1');
    await expect(page.locator('[data-role="estimate"]')).toHaveText('640€');
    await expect(page.locator('#inquiry-form input[name="full_name"]')).toHaveValue('Import Roundtrip Tester');
    await expect(page.locator('#inquiry-form select[name="studio_tier"]')).toHaveValue('Kick');
  });
});
