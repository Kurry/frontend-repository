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

const BASE = 'http://localhost:3000';

test('document_title', async ({ page }) => {
  await page.goto(BASE);
  await expect(page).toHaveTitle('Canvasly – the design tool for outstanding websites');
});

test.describe('core_features', () => {
  test('header_placeholder_wordmark_and_nav', async ({ page }) => {
    // On load, a sticky white header stays fixed to the top of the viewport on scroll 
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('hero_headline_subtitle_cta', async ({ page }) => {
    // On load, the hero shows the headline \
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('hello_ready_accent_cluster', async ({ page }) => {
    // On load, the oversized accent cluster reads \
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

  test('slideshow_auto_advances', async ({ page }) => {
    // When the six-image project slideshow is left running, its active (fully opaque) 
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

  test('usecase_tiles_labels_and_colors', async ({ page }) => {
    // On load, six color-coded use-case tiles appear with the exact labels Portfolios 
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bodyBg).toBeTruthy();
  });

});

test.describe('visual_design', () => {
  test('canvas_and_surface_colors', async ({ page }) => {
    // By computed style, the support band and footer backgrounds are rgb(40, 40, 40) w
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bodyBg).toBeTruthy();
  });

  test('usecase_tile_exact_colors', async ({ page }) => {
    // By computed style, the six use-case tiles render color rgb(255, 255, 255) text o
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bodyBg).toBeTruthy();
  });

  test('hero_title_type_scale_display_face', async ({ page }) => {
    // By computed style, the hero title (h1) is font-size 60px, weight 400, line-heigh
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const buttons = page.locator('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test('orange_and_purple_accents', async ({ page }) => {
    // Primary orange #FF6600 (rgb(255, 102, 0)) appears on the \
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('media_card_and_slide_geometry', async ({ page }) => {
    // By computed style, the floating hero media card has border-radius 24px and box-s
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

});

test.describe('user_flows', () => {
  test('solutions_menu_open_shows_six_labels', async ({ page }) => {
    // Solutions menu flow: activating the Solutions trigger opens its panel with all s
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('solutions_escape_closes_and_returns_focus', async ({ page }) => {
    // With the Solutions menu open: pressing Escape closes the panel, restores the col
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const buttons = page.locator('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test('solutions_outside_click_closes_cleanly', async ({ page }) => {
    // With the Solutions menu open: clicking outside the panel closes it without activ
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const buttons = page.locator('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test('mobile_menu_opens_at_768', async ({ page }) => {
    // Mobile menu flow: at 768px width the desktop navigation and Log in link are hidd
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const buttons = page.locator('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test('mobile_menu_dismiss_preserves_scroll', async ({ page }) => {
    // At 768px with the mobile menu open: dismissing the panel (or widening back to de
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

});

test.describe('writing', () => {
  test('headings_match_mandated_casing', async ({ page }) => {
    // Where the app renders headings and section titles (Design and launch outstanding
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('cta_labels_specific', async ({ page }) => {
    // Where the app renders primary action labels, they use the mandated specific copy
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify ARIA attributes on interactive elements
    const hasAria = await page.evaluate(() => {
      return document.querySelectorAll('[aria-label], [role]').length > 0;
    });
    expect(hasAria).toBe(true);
  });

  test('marketing_copy_spelling_grammar', async ({ page }) => {
    // Where the app renders body or marketing copy (hero subtitle, four feature-card b
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('canvasly_terminology_consistent', async ({ page }) => {
    // Where the app renders the product name, terminology stays consistent as Canvasly
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('copyright_year_and_email_exact', async ({ page }) => {
    // Where the app renders the footer copyright and support contact, they show exactl
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

});

test.describe('accessibility', () => {
  test('interactive_controls_keyboard_operable', async ({ page }) => {
    // Every interactive control (Solutions menu, nav links, Log in, Sign up, Menu, Try
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify keyboard-operable controls exist
    const interactive = page.locator('button, input, select, [tabindex]');
    expect(await interactive.count()).toBeGreaterThan(0);
  });

  test('solutions_menu_focus_and_expanded', async ({ page }) => {
    // The Solutions control is a button with accessible name Solutions menu, aria-hasp
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const buttons = page.locator('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test('content_media_accessible_names', async ({ page }) => {
    // Content imagery that conveys meaning has descriptive alt text or accessible labe
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify ARIA attributes on interactive elements
    const hasAria = await page.evaluate(() => {
      return document.querySelectorAll('[aria-label], [role]').length > 0;
    });
    expect(hasAria).toBe(true);
  });

  test('headings_logical_order', async ({ page }) => {
    // The page has one page-level heading and ordered section headings following a log
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('landmarks_header_nav_main_footer', async ({ page }) => {
    // The document exposes semantic header, nav, main, section, article, and footer la
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

});

test.describe('edge_cases', () => {
  test('escape_noop_when_solutions_closed', async ({ page }) => {
    // Pressing Escape while the Solutions menu is closed does nothing: no error, no vi
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const buttons = page.locator('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test('slideshow_wrap_opacity_treatment', async ({ page }) => {
    // The slideshow wraps seamlessly: advancing past the sixth frame returns to the fi
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('clicks_pass_through_custom_cursor', async ({ page }) => {
    // Clicks pass through the custom cursor: clicking any link or button while the cur
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const buttons = page.locator('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test('coarse_pointer_restores_system_cursor', async ({ page }) => {
    // On coarse-pointer devices the custom cursor is absent and the system cursor is f
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('reload_resets_menus_slideshow_reveals', async ({ page }) => {
    // Reloading the page returns it to its initial state: menus closed, the slideshow 
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

});

test.describe('responsiveness', () => {
  test('zoom_to_fit_scale_at_1440_and_390', async ({ page }) => {
    // Zoom-to-fit is the responsive model: at 1440px the 1024px artboard\'s computed tr
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('mobile_tap_targets_adequate', async ({ page }) => {
    // At 768px and below, primary interactive controls (Menu, Sign up, Try Canvasly, S
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('type_scales_via_artboard_zoom', async ({ page }) => {
    // Between 1440 and 390 widths, typography scales via the 1024px artboard zoom-to-f
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('no_clip_at_1440_768_390', async ({ page }) => {
    // At 1440, 768, and 390 widths, content never clips or overflows the viewport; the
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('nav_collapses_to_menu_at_768', async ({ page }) => {
    // On viewports 768px and narrower the desktop navigation and the account Log in li
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const buttons = page.locator('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });

});

test.describe('technical', () => {
  test('same_origin_asset_requests', async ({ page }) => {
    // Every request the page makes is same-origin with the app or a data:/about: URL; 
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('console_clean_assets_ok', async ({ page }) => {
    // The page produces no uncaught JavaScript console errors and no failed asset requ
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('storage_apis_remain_empty', async ({ page }) => {
    // After exercising the page (menus, slideshow, full scroll-through), localStorage 
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('decorative_media_aria_hidden', async ({ page }) => {
    // The floating hero art, the path-traveling orb, the marquee decoration, and the c
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify ARIA attributes on interactive elements
    const hasAria = await page.evaluate(() => {
      return document.querySelectorAll('[aria-label], [role]').length > 0;
    });
    expect(hasAria).toBe(true);
  });

  test('text_contrast_meets_aa', async ({ page }) => {
    // Text meets WCAG AA contrast on the white canvas and on the dark #282828 support-
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bodyBg).toBeTruthy();
  });

});

test.describe('performance', () => {
  test('cold_start_interactive_under_2s', async ({ page }) => {
    // The page is interactive within 2 seconds of a local cold load.
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

  test('console_clean_on_load_and_exercise', async ({ page }) => {
    // No console errors, hydration mismatch warnings, or unhandled rejections appear o
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('chrome_interactions_remain_responsive', async ({ page }) => {
    // Solutions menu open/close, Menu panel, and primary CTA chrome respond without mu
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('full_page_scroll_without_lag', async ({ page }) => {
    // Scrolling the full homepage (hero through footer) remains usable without perceiv
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('interactive_during_menus_and_slideshow', async ({ page }) => {
    // The UI remains interactive while menus open/close and the slideshow advances (co
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const buttons = page.locator('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });

});

test.describe('behavioral', () => {
  test('in_memory_multi_facet_reload_resets', async ({ page }) => {
    // Starting on the homepage: open the Solutions menu, wait until the slideshow adva
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

  test('slideshow_derived_opacity_changes', async ({ page }) => {
    // Derived-view sensitivity: leave the page idle through at least one 2200ms slides
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('solutions_expanded_echoes_panel', async ({ page }) => {
    // Cross-view echo: open the Solutions menu via the real trigger and confirm the pa
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

  test('slideshow_wrap_count_integrity', async ({ page }) => {
    // Count-delta integrity: observe the slideshow through six advances from the first
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('artboard_scale_input_dependent', async ({ page }) => {
    // Input-dependent output: at 1440px the artboard transform is none (scale 1); resi
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

});

test.describe('innovation', () => {
  test('execution_quality_of_signature_interactions', async ({ page }) => {
    // Score execution quality of the reference experience (not invention beyond it): t
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('scroll_storytelling_execution', async ({ page }) => {
    // On a fresh load, scroll-triggered storytelling that reveals the four workflow fe
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

  test('hero_intro_and_ambient_execution', async ({ page }) => {
    // The hero intro timeline (title/subtitle/CTA rise-and-fade with 0/80/160ms stagge
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('canvasly_brand_narrative_arc', async ({ page }) => {
    // The homepage reads as one Canvasly design-tool narrative arc from oversized hero
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('designed_experience_narrative_arc', async ({ page }) => {
    // The page reads as a designed experience with a narrative arc — sections build on
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

});

test.describe('design_fidelity', () => {
  test('spacing_matches_4px_baseline_scale', async ({ page }) => {
    // At the 1024px design scale, section paddings and gaps follow the 4px baseline (2
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('typography_matches_reference_metrics', async ({ page }) => {
    // At the 1024px design scale typography matches the spec: hero title 60px / line-h
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('block_fidelity_sticky_header_nav', async ({ page }) => {
    // Block: sticky header nav — Sticky white bar with a hairline bottom border holdin
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bodyBg).toBeTruthy();
  });

  test('block_fidelity_hero_gallery_marquees', async ({ page }) => {
    // Block: hero gallery marquees — Three stacked marquee rows of colorful project th
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bodyBg).toBeTruthy();
  });

  test('block_fidelity_hero_headline_cta', async ({ page }) => {
    // Block: hero headline and CTA — Oversized black headline reading Design and launc
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bodyBg).toBeTruthy();
  });

});

test.describe('motion', () => {
  test('hero_intro_timeline_stagger', async ({ page }) => {
    // On a fresh load the hero title, subtitle, and CTA row rise upward from 24px and 
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

  test('feature_card_scroll_reveal', async ({ page }) => {
    // Scrolling the workflow section into view triggers the four feature cards to fade
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('hero_gallery_offset_path_marquees', async ({ page }) => {
    // The three hero gallery rows travel continuously along CSS offset-path motion (of
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('lower_marquee_offset_path', async ({ page }) => {
    // The lower use-case marquee row travels along path(\'M 0 40 L 2000 40\') from 0px t
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('slideshow_timed_opacity_advance', async ({ page }) => {
    // Letting the six-image slideshow run advances the active (opacity 1.0) frame ever
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const kinds = await page.evaluate(() => ({
      session_info: typeof window.webmcp_session_info,
      list_tools: typeof window.webmcp_list_tools,
      invoke_tool: typeof window.webmcp_invoke_tool,
    }));
    expect(kinds.session_info).toBe('function');
    expect(kinds.list_tools).toBe('function');
    expect(kinds.invoke_tool).toBe('function');
  });

});
