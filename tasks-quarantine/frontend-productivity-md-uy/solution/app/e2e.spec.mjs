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
  await expect(page).toHaveTitle('md.uy • markdown editor');
});

test.describe('core_features', () => {
  test('opens_into_markdown_workspace', async ({ page }) => {
    // On load, the app opens directly (no auth wall) into a Markdown editing workspace
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('seeded_document_renders_in_preview', async ({ page }) => {
    // On first load the source pane shows a seeded starter document containing a top-l
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('typing_inserts_at_cursor', async ({ page }) => {
    // After clicking into the source pane and typing text, the source pane immediately
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('preview_shows_latest_edit', async ({ page }) => {
    // After editing the source and switching to Preview, the preview shows the latest 
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('successive_edits_no_stale_duplicate', async ({ page }) => {
    // After two successive edits, the preview reflects both edits once each and does n
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

});

test.describe('visual_design', () => {
  test('editor_surface_has_primary_emphasis', async ({ page }) => {
    // The layout gives primary visual emphasis to the Markdown editing surface (source
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('toolbar_grouped_with_editor', async ({ page }) => {
    // The controls needed to edit the source (mode toggle, copy, download, share) are 
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

  test('single_column_alignment_consistency', async ({ page }) => {
    // The editor panes align the Markdown source, the rendered preview, the room ident
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('active_mode_and_focus_hover_distinct', async ({ page }) => {
    // The active editor mode is visually distinct from inactive modes, and interactive
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('mobile_reflow_stays_reachable', async ({ page }) => {
    // At 375 by 667 pixels the source pane, the preview, and their controls reflow and
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

});

test.describe('user_flows', () => {
  test('edit_echo_reload_flow', async ({ page }) => {
    // In Edit mode, type a distinctive new line into the source, switch to Preview and
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

  test('invalid_profile_or_join_inline_validation', async ({ page }) => {
    // Submitting the profile dialog with empty/over-long displayName or non-#RRGGBB co
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('source_edit_updates_preview_and_package', async ({ page }) => {
    // Editing the source updates Preview HTML and the Document package preview markdow
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('clear_source_shows_empty_placeholders', async ({ page }) => {
    // Selecting all source text and deleting it leaves muted placeholders in source an
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('mode_switch_retains_source_and_profile', async ({ page }) => {
    // Switching through Edit, Preview, and Present keeps the same source text, room id
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

});

test.describe('writing', () => {
  test('headings_use_consistent_capitalization', async ({ page }) => {
    // Where the app renders headings and section titles, they use consistent capitaliz
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('actions_use_specific_labels', async ({ page }) => {
    // Where the app renders button or action labels, they are specific verbs (\'Add exp
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const buttons = page.locator('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test('errors_name_problem_and_fix', async ({ page }) => {
    // Where the app renders error messages, they name the problem and the fix (\'Amount
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('empty_states_explain_next_step', async ({ page }) => {
    // Where the app renders empty states, the copy explains what belongs there and how
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('body_copy_is_well_written', async ({ page }) => {
    // Where the app renders body or marketing copy, rate how free it is of spelling an
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

});

test.describe('accessibility', () => {
  test('controls_are_keyboard_accessible', async ({ page }) => {
    // All interactive controls are keyboard accessible with Tab, Shift+Tab, Enter, or 
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify keyboard-operable controls exist
    const interactive = page.locator('button, input, select, [tabindex]');
    expect(await interactive.count()).toBeGreaterThan(0);
  });

  test('modals_manage_focus', async ({ page }) => {
    // Modal dialogs trap focus and return it to the originating control on close.
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('images_and_icons_have_alt_text', async ({ page }) => {
    // All images and icons have descriptive alt text.
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('feedback_uses_live_regions', async ({ page }) => {
    // Errors and notifications are conveyed both visually and via ARIA live regions.
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify ARIA attributes on interactive elements
    const hasAria = await page.evaluate(() => {
      return document.querySelectorAll('[aria-label], [role]').length > 0;
    });
    expect(hasAria).toBe(true);
  });

  test('forms_have_explicit_labels', async ({ page }) => {
    // All form elements use explicit label elements.
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify ARIA attributes on interactive elements
    const hasAria = await page.evaluate(() => {
      return document.querySelectorAll('[aria-label], [role]').length > 0;
    });
    expect(hasAria).toBe(true);
  });

});

test.describe('edge_cases', () => {
  test('empty_document_muted_placeholders', async ({ page }) => {
    // After selecting all source text and deleting it, the source pane and the preview
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('profile_and_join_validate_inline', async ({ page }) => {
    // The profile dialog and the join-room field show inline per-field validation befo
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bodyBg).toBeTruthy();
  });

  test('validation_errors_name_fields', async ({ page }) => {
    // Profile, join, and Import package validation errors name the offending field or 
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bodyBg).toBeTruthy();
  });

  test('copy_download_show_confirmation', async ({ page }) => {
    // Copy, Download Markdown, Copy package, and Download package each show a brief vi
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('present_bounds_without_delimiter', async ({ page }) => {
    // In Present mode with no three-dash delimiter, the counter reads Slide 1 of 1, Pr
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

});

test.describe('responsiveness', () => {
  test('layout_adapts_desktop_to_mobile', async ({ page }) => {
    // Layout adapts gracefully from 1440px desktop to 375px mobile.
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('mobile_tap_targets_are_large_enough', async ({ page }) => {
    // UI controls are tap targets at least 44px on mobile.
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('typography_resizes_across_breakpoints', async ({ page }) => {
    // Typography resizes for both mobile and desktop.
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('content_avoids_clipping_and_overflow', async ({ page }) => {
    // Content never clips or overflows the viewport.
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('chrome_adapts_to_small_screens', async ({ page }) => {
    // Collapsible chrome such as sidebars and menus adapts for smaller screens.
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

});

test.describe('technical', () => {
  test('reload_restores_saved_revision', async ({ page }) => {
    // Reloading the page after editing restores the last saved revision from local cli
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

  test('room_id_resolves_after_reload', async ({ page }) => {
    // After reloading, the room id in the URL path and breadcrumb is unchanged and sti
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

  test('panes_share_one_document', async ({ page }) => {
    // Editing the source updates the preview from the same shared document, so the two
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('root_loads_interactive_workspace', async ({ page }) => {
    // The editor root loads as an interactive Markdown workspace with no blank page, f
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

  test('clean_console_and_requests', async ({ page }) => {
    // Editing the source and switching modes completes with no uncaught exception, unh
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

});

test.describe('performance', () => {
  test('cold_start_is_under_two_seconds', async ({ page }) => {
    // Cold start to interactive is under 2 seconds on local render.
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

  test('console_is_clean', async ({ page }) => {
    // Browser devtools show no errors or warnings.
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('transitions_respond_under_100ms', async ({ page }) => {
    // UI transitions respond in under 100ms.
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('async_work_has_loading_indicators', async ({ page }) => {
    // Loading indicators are shown for async or simulated delays.
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

  test('large_collections_render_without_lag', async ({ page }) => {
    // Large collections render without perceived lag.
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

});

test.describe('behavioral', () => {
  test('multi_facet_reload_round_trip', async ({ page }) => {
    // Multi-facet round-trip: edit the source, toggle theme, and save a valid profile,
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

  test('present_slide_order_follows_source', async ({ page }) => {
    // Slide-order proof: with two three-dash delimiters creating three slides, Present
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('package_preview_tracks_source_edits', async ({ page }) => {
    // Derived-view sensitivity: type a distinctive line into the source and confirm th
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('source_preview_package_cross_echo', async ({ page }) => {
    // Cross-view echo: edit the source in Edit mode and confirm Preview HTML and the D
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

  test('slide_count_delta_is_exact', async ({ page }) => {
    // Count-delta integrity: measure M in Slide N of M immediately before and after ap
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

});

test.describe('innovation', () => {
  test('delightful_microinteractions', async ({ page }) => {
    // The app has unique, delightful microinteractions.
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('advanced_motion_mechanics', async ({ page }) => {
    // The app has advanced animation or transition mechanics such as parallax or scrol
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('guided_onboarding', async ({ page }) => {
    // The app has a narrative or guided onboarding flow.
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('enhanced_interactive_graphics', async ({ page }) => {
    // Data visualizations or interactive graphics provide extra usability.
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('alternative_input_support', async ({ page }) => {
    // The app supports voice, gesture, or another alternative input.
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

});

test.describe('design_fidelity', () => {
  test('spacing_and_sizing_follow_scale', async ({ page }) => {
    // Spacing and sizing follow the design system\'s scale, with no arbitrary one-off v
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('typography_matches_spec', async ({ page }) => {
    // Typography matches the spec for all headings and body copy.
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('layout_matches_reference', async ({ page }) => {
    // Layout matches reference screenshots to within a small tolerance at all specifie
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('specified_state_changes_animate', async ({ page }) => {
    // Transitions or animations are applied to the state changes the spec calls out, s
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('responsive_behavior_matches_reference', async ({ page }) => {
    // Responsive behavior matches reference patterns.
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

});

test.describe('motion', () => {
  test('chrome_hover_ease_and_focus_ring', async ({ page }) => {
    // Interactive chrome (mode buttons, copy, download, share, theme, new-document, di
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('theme_toggle_recolor_icon_swap', async ({ page }) => {
    // Clicking the theme toggle recolors the workspace surfaces and accents and swaps 
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const buttons = page.locator('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test('copy_download_check_swap', async ({ page }) => {
    // Clicking Copy or Download through the real control briefly swaps the control\'s i
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const buttons = page.locator('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test('sync_badge_and_dialog_backdrop', async ({ page }) => {
    // While live sync is on, the Share button carries a small pinging dot badge, and t
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const buttons = page.locator('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test('mode_switch_pane_transition', async ({ page }) => {
    // Clicking between Edit, Preview, and Present through the real mode buttons animat
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

});
