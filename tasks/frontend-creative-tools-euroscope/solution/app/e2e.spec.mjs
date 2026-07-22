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


test('1.1 four_step_wizard_progress', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('ol[aria-label^="Patching wizard progress"]')).toBeVisible();
  const activeStep = await page.locator('ol li').nth(0);
  await expect(activeStep).toHaveAttribute('aria-current', 'step');
});

test('1.1 wizard_controls_keyboard_accessible', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Just tab multiple times until Continue is focused
  let found = false;
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab');
    const isFocused = await page.evaluate(() => document.activeElement && document.activeElement.textContent === 'Continue');
    if (isFocused) { found = true; break; }
  }
  expect(found).toBe(true);

  await page.keyboard.press('Enter');
  // It should move to step 2 where Base theme is available
  await expect(page.getByRole('combobox', { name: /Base theme/i })).toBeVisible();
});

test('1.2 seeded_upload_continue', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.getByText('EuroScope.exe').first()).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('ol li').nth(1)).toHaveAttribute('aria-current', 'step');
});

test('1.2 select_controls_arrow_key_operable', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.getByRole('button', { name: 'Continue' }).click();
  const baseTheme = page.getByRole('combobox', { name: /Base theme/i });
  const before = await baseTheme.inputValue();
  await baseTheme.focus();
  await page.keyboard.press('ArrowDown');
  await expect(baseTheme).not.toHaveValue(before);
});

test('1.3 five_base_themes_listed', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('combobox', { name: /Base theme/i }).click();

  const options = await page.getByRole('option').allTextContents();
  expect(options.map(s => s.trim())).toEqual(['EuroScope', 'Grey', 'Primer', 'Ayu', 'Solarised']);
});

test('1.4 base_theme_replaces_all_swatches', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.getByRole('button', { name: 'Continue' }).click();

  // Record initial
  const hexInputs = await page.locator('input[type="text"]').all();
  const initValues = [];
  for (const input of hexInputs) {
    initValues.push(await input.inputValue());
  }
  const preview = page.getByTestId('scope-preview');
  const previewBefore = await preview.locator(':scope > div').evaluateAll((panels) => panels.map((panel) => getComputedStyle(panel).backgroundColor));

  await page.getByRole('combobox', { name: /Base theme/i }).selectOption({ label: 'Grey' });

  const hexInputsAfter = await page.locator('input[type="text"]').all();
  const afterValues = [];
  for (const input of hexInputsAfter) {
    afterValues.push(await input.inputValue());
  }

  expect(afterValues).not.toEqual(initValues);
  for (let i = 0; i < afterValues.length; i++) {
    expect(afterValues[i]).not.toEqual(initValues[i]);
  }
  await expect.poll(() => preview.locator(':scope > div').evaluateAll((panels) => panels.map((panel) => getComputedStyle(panel).backgroundColor))).not.toEqual(previewBefore);
});

// At desktop width, the layout matches /reference-screenshots/ overview and segment screenshots within small tolerance: a single centered column roughly 600px wide holding the compact header, progress bar, and active step body — text wins if screenshot and instruction conflict.
// NOT-AUTOMATABLE: 3.1 — visual/subjective/motion

// At desktop width the patcher presents a step-based wizard with colour swatches, icon previews, and progress rather than generic equal-weight dashboard cards
// NOT-AUTOMATABLE: 3.1 — visual/subjective/motion

// The compact header shows a squared EuroScope badge, the title Custom EuroScope, and a theme-and-icon-patcher caption, matching the reference header anatomy.
// NOT-AUTOMATABLE: 3.2 — visual/subjective/motion

// The colour and icon patching is the primary visual focus while secondary metadata (hex values, bitmap dimensions, helper text) stays visually subordinate
// NOT-AUTOMATABLE: 3.2 — visual/subjective/motion

// The progress bar uses numbered circles with the active stage fully labelled, completed stages showing a check mark, and upcoming stages showing a muted number, matching the specified wizard chrome.
// NOT-AUTOMATABLE: 3.3 — visual/subjective/motion

// After the colour set is chosen and the patched result is generated, the final step is visibly distinguished from its prior state through a visible selection, status, value, or content change
// NOT-AUTOMATABLE: 3.3 — visual/subjective/motion

// Light neutral surfaces use a single blue accent for the active progress step and primary buttons, plus a soft radial accent wash behind the content, matching the specified palette.
// NOT-AUTOMATABLE: 3.4 — visual/subjective/motion

// The live colour Preview and the bitmap preview grid visibly recolour to reflect the currently selected theme and icon set
// NOT-AUTOMATABLE: 3.4 — visual/subjective/motion

// Control clusters sit in bordered white boxes with hairline borders and a subtle shadow on hover, matching the reference grouping treatment.
// NOT-AUTOMATABLE: 3.5 — visual/subjective/motion

// At mobile width the patcher reorganises the step-based wizard into a coherent stacked composition that preserves the primary-before-secondary hierarchy and keeps controls reachable without horizontal scrolling
// NOT-AUTOMATABLE: 3.5 — visual/subjective/motion

// On the theme-colours step, the colour Preview renders two side-by-side panels labelled Primary and Secondary, tinted from the working swatches, as in the reference.
// NOT-AUTOMATABLE: 3.6 — visual/subjective/motion

// The patcher's guidance uses colour-coded Information, Caution, and Warning alert blocks each with a leading icon and a heading
// NOT-AUTOMATABLE: 3.6 — visual/subjective/motion

// Information, Caution, and Warning alert blocks are colour-coded blue, amber, and red with a leading icon and bold heading, matching the specified guidance chrome.
// NOT-AUTOMATABLE: 3.7 — visual/subjective/motion

// Buttons and form controls show distinct default, hover, focus (visible ring), and disabled treatments matching the specified component states.
// NOT-AUTOMATABLE: 3.8 — visual/subjective/motion

// Each of the six swatch rows shows the role name, a colour picker, and a hex text field in a consistent row anatomy matching the reference theme step.
// NOT-AUTOMATABLE: 3.9 — visual/subjective/motion

// At desktop width the app renders a single centered column roughly 600 pixels wide holding a compact header (a squared EuroScope badge, the title Custom EuroScope, and a theme-and-icon-patcher caption), the progress bar, and the active step body stacked with consistent spacing
// NOT-AUTOMATABLE: 3.9 — visual/subjective/motion

// The embedded-bitmaps step shows a preview grid of at least ten tiles that recolour under Vector and appear as muted placeholders under None, matching the reference grid treatment.
// NOT-AUTOMATABLE: 3.10 — visual/subjective/motion

// The UI uses light neutral surfaces with a single blue accent on the active progress step and primary buttons, a soft radial accent wash behind the content, and bordered white boxes with hairline borders grouping each control cluster
// NOT-AUTOMATABLE: 3.10 — visual/subjective/motion

// Undo/Redo chrome and the step-four export center appear in the wizard composition described by the instruction; where screenshots omit later hardened surfaces, the instruction text wins.
// NOT-AUTOMATABLE: 3.11 — visual/subjective/motion

// The colour Preview renders two side-by-side panels named Primary and Secondary, both tinted live from the working swatch colours
// NOT-AUTOMATABLE: 3.11 — visual/subjective/motion

// On the theme-colours step, the contrast matrix and colour-blindness control sit with the swatch/Preview cluster as specified rather than as a disconnected orphan panel.
// NOT-AUTOMATABLE: 3.12 — visual/subjective/motion

// Icons on the header badge, alert blocks, check marks, and control icons come from one consistent set with the same stroke weight and style throughout the chrome
// NOT-AUTOMATABLE: 3.12 — visual/subjective/motion

// Buttons and form controls show distinct default, hover, focus (visible ring), and disabled treatments rather than a single static appearance
// NOT-AUTOMATABLE: 3.13 — visual/subjective/motion

// At around 375 pixels wide the progress bar keeps its numbered steps visible with the active label truncating rather than overflowing, and the two Preview panels and the bitmap grid reflow to fit the single stacked column
// NOT-AUTOMATABLE: 3.14 — visual/subjective/motion

// Headings, stage names, and button labels use one consistent capitalization convention throughout the app
// NOT-AUTOMATABLE: 3.15 — visual/subjective/motion

// Action labels are specific verbs matching the wizard vocabulary (Continue, Back, Generate, Download) rather than generic labels like Submit or OK
// NOT-AUTOMATABLE: 3.16 — visual/subjective/motion

// The Information, Caution, and Warning alert copy names the situation and what the user should do rather than filler prose
// NOT-AUTOMATABLE: 3.17 — visual/subjective/motion

// The contrast matrix uses compact ratio readouts with clear pass (green-tinted) and fail (amber or red-tinted) marks, and the colour-blindness control shows a segmented choice with a visible active selection.
// NOT-AUTOMATABLE: 3.19 — visual/subjective/motion

// The export center presents a monospaced preview block with visible tab labels for Patch recipe JSON, Theme CSS, and Summary.
// NOT-AUTOMATABLE: 3.20 — visual/subjective/motion

// The command palette is a centered overlay with a search field, kind labels (Stage or Theme) on result rows, and a highlighted keyboard selection.
// NOT-AUTOMATABLE: 3.21 — visual/subjective/motion

// Empty Undo/Redo and disabled export actions read as non-interactive while their labels stay legible.
// NOT-AUTOMATABLE: 3.22 — visual/subjective/motion

// Hovering and pressing the wizard's actual buttons eases their border, shadow, and scale, and the press feedback appears immediately on pointer-down
// NOT-AUTOMATABLE: 4.1 — visual/subjective/motion

// Swatch rows and per-bitmap rows take a full-width hover wash when the pointer moves over them
// NOT-AUTOMATABLE: 4.2 — visual/subjective/motion

// Tabbing through the interactive controls shows a clearly visible keyboard focus ring distinct from the hover state
// NOT-AUTOMATABLE: 4.3 — visual/subjective/motion

// Advancing or returning between steps using the visible Continue, Generate, and Back buttons swaps the active step body in place without a full page reload and updates the progress bar to the current step
// NOT-AUTOMATABLE: 4.4 — visual/subjective/motion

// When a step becomes active or complete via the visible Continue or Back buttons, the progress circles transition their fill colour smoothly rather than snapping instantly
// NOT-AUTOMATABLE: 4.7 — visual/subjective/motion

// Clicking Continue or Back swaps the active step body with a brief eased transition of roughly 200 to 300 milliseconds rather than an instant cut
// NOT-AUTOMATABLE: 4.8 — visual/subjective/motion

// Revealing the advanced per-bitmap options via its visible control expands the list in place with an animated height change rather than an instant jump
// NOT-AUTOMATABLE: 4.9 — visual/subjective/motion

// When the patched result is generated by clicking the visible Generate button, the Patched result generated confirmation enters with a short fade-and-rise transition
// NOT-AUTOMATABLE: 4.10 — visual/subjective/motion

// With prefers-reduced-motion enabled, transitions are removed and state changes apply instantly while the wizard remains fully usable
// NOT-AUTOMATABLE: 4.11 — visual/subjective/motion

// Editing a swatch or changing the icon set recolours the live colour Preview and the bitmap tiles immediately, with no page reload and no perceptible delay
// NOT-AUTOMATABLE: 4.12 — visual/subjective/motion

// Opening the command palette via the visible Ctrl+K / Cmd+K path enters the overlay with a brief opacity/scale transition rather than an instant hard cut (verified through the real keyboard path on a fresh interaction).
// NOT-AUTOMATABLE: 4.13 — visual/subjective/motion

// Activating Copy export via the visible control shows a short confirmation that appears and then resets, rather than snapping with no feedback.
// NOT-AUTOMATABLE: 4.14 — visual/subjective/motion

// Where the app renders headings, stage names, and button labels in the patching wizard, they use one consistent capitalization convention throughout.
// NOT-AUTOMATABLE: 15.1 — writing style

// Where the app renders primary action labels, they use specific wizard verbs (Continue, Back, Generate, Download) rather than generic Submit or OK when a specific label is possible.
// NOT-AUTOMATABLE: 15.2 — writing style

// Where the app renders validation or error messages on swatch hex fields, they name the swatch and the problem (for example that Backdrop darkest is not a valid colour), not only a bare Invalid rejection.
// NOT-AUTOMATABLE: 15.3 — writing style

// Where the app renders Information, Caution, and Warning alert copy, it names the situation and what the user should do.
// NOT-AUTOMATABLE: 15.4 — writing style

// Where the app renders body copy, stage labels, captions, or alert text, rate how free it is of spelling and grammatical errors.
// NOT-AUTOMATABLE: 15.5 — writing style

// Where the app renders labels for base theme, swatch roles, icon set, and patched result across steps and the final summary, terminology stays consistent rather than mixing synonyms for the same concept.
// NOT-AUTOMATABLE: 15.6 — writing style

// Where the app renders hex colour values and replaced-count status (for example 10 of 10), formatting is consistent across swatch rows and the status line.
// NOT-AUTOMATABLE: 15.7 — writing style

// Where the app renders the Patched result generated confirmation or Download feedback, it states what happened, not a vague affirmation only.
// NOT-AUTOMATABLE: 15.8 — writing style

// Where the app renders action labels for undo, snapshots, and export, they use specific verbs (Undo, Redo, Save snapshot, Copy export, Import recipe) rather than generic Submit or OK.
// NOT-AUTOMATABLE: 15.9 — writing style

// Where the app renders the command palette empty state, it explains that no stage or theme matched the query.
// NOT-AUTOMATABLE: 15.10 — writing style

// Where the app renders import or snapshot validation errors, they name the field or problem rather than a bare Invalid rejection.
// NOT-AUTOMATABLE: 15.11 — writing style

// 3.1 wizard_not_dashboard_cards
// NOT-AUTOMATABLE: 3.1 — visual/subjective/motion

// 3.1 centered_column_matches_reference
// NOT-AUTOMATABLE: 3.1 — visual/subjective/motion

// 3.2 patching_primary_visual_focus
// NOT-AUTOMATABLE: 3.2 — visual/subjective/motion

// 3.2 header_badge_title_caption
// NOT-AUTOMATABLE: 3.2 — visual/subjective/motion

// 3.3 final_step_visibly_complete
// NOT-AUTOMATABLE: 3.3 — visual/subjective/motion

// 3.3 progress_circles_match_spec
// NOT-AUTOMATABLE: 3.3 — visual/subjective/motion

// 3.4 light_neutral_blue_accent_wash
// NOT-AUTOMATABLE: 3.4 — visual/subjective/motion

// 3.4 preview_and_grid_recolour
// NOT-AUTOMATABLE: 3.4 — visual/subjective/motion

// 3.5 mobile_stacked_hierarchy
// NOT-AUTOMATABLE: 3.5 — visual/subjective/motion

// 3.5 bordered_control_clusters
// NOT-AUTOMATABLE: 3.5 — visual/subjective/motion

// 3.6 colour_coded_alert_blocks
// NOT-AUTOMATABLE: 3.6 — visual/subjective/motion

// 3.6 preview_panels_side_by_side
// NOT-AUTOMATABLE: 3.6 — visual/subjective/motion

// 3.7 alert_blocks_colour_coded
// NOT-AUTOMATABLE: 3.7 — visual/subjective/motion

// 3.8 component_states_match_spec
// NOT-AUTOMATABLE: 3.8 — visual/subjective/motion

// 3.9 centered_column_header_composition
// NOT-AUTOMATABLE: 3.9 — visual/subjective/motion

// 3.9 swatch_row_anatomy_matches
// NOT-AUTOMATABLE: 3.9 — visual/subjective/motion

// 3.10 light_surfaces_blue_accent_grouping
// NOT-AUTOMATABLE: 3.10 — visual/subjective/motion

// 3.10 bitmap_grid_matches_reference
// NOT-AUTOMATABLE: 3.10 — visual/subjective/motion

// 3.11 preview_dual_named_panels
// NOT-AUTOMATABLE: 3.11 — visual/subjective/motion

// 3.11 undo_export_chrome_matches_spec
// NOT-AUTOMATABLE: 3.11 — visual/subjective/motion

// 3.12 consistent_icon_set_throughout
// NOT-AUTOMATABLE: 3.12 — visual/subjective/motion

// 3.12 contrast_matrix_placement_matches_spec
// NOT-AUTOMATABLE: 3.12 — visual/subjective/motion

// 3.13 distinct_component_state_treatments
// NOT-AUTOMATABLE: 3.13 — visual/subjective/motion

// 3.14 progress_bar_truncates_at_mobile
// NOT-AUTOMATABLE: 3.14 — visual/subjective/motion

// 3.15 consistent_capitalization_convention
// NOT-AUTOMATABLE: 3.15 — visual/subjective/motion

// 3.16 specific_wizard_action_verbs
// NOT-AUTOMATABLE: 3.16 — visual/subjective/motion

// 3.17 alert_copy_names_situation_and_action
// NOT-AUTOMATABLE: 3.17 — visual/subjective/motion

// 3.19 contrast_matrix_visual_treatment
// NOT-AUTOMATABLE: 3.19 — visual/subjective/motion

// 3.20 export_center_monospace_tabs
// NOT-AUTOMATABLE: 3.20 — visual/subjective/motion

// 3.21 command_palette_overlay_craft
// NOT-AUTOMATABLE: 3.21 — visual/subjective/motion

// 3.22 undo_redo_disabled_legible
// NOT-AUTOMATABLE: 3.22 — visual/subjective/motion

// 4.1 button_hover_press_ease
// NOT-AUTOMATABLE: 4.1 — visual/subjective/motion

// 4.2 row_full_width_hover_wash
// NOT-AUTOMATABLE: 4.2 — visual/subjective/motion

// 4.3 visible_keyboard_focus_ring
// NOT-AUTOMATABLE: 4.3 — visual/subjective/motion

// 4.4 step_swap_in_place
// NOT-AUTOMATABLE: 4.4 — visual/subjective/motion

// 4.7 progress_circles_fill_transition
// NOT-AUTOMATABLE: 4.7 — visual/subjective/motion

// 4.8 step_swap_brief_eased_transition
// NOT-AUTOMATABLE: 4.8 — visual/subjective/motion

// 4.9 bitmap_options_animated_expand
// NOT-AUTOMATABLE: 4.9 — visual/subjective/motion

// 4.10 patched_confirmation_fade_rise
// NOT-AUTOMATABLE: 4.10 — visual/subjective/motion

// 4.11 reduced_motion_applies_instantly
// NOT-AUTOMATABLE: 4.11 — visual/subjective/motion

// 4.12 live_recolour_without_reload
// NOT-AUTOMATABLE: 4.12 — visual/subjective/motion

// 4.13 command_palette_enter_transition
// NOT-AUTOMATABLE: 4.13 — visual/subjective/motion

// 4.14 copy_export_confirmation_motion
// NOT-AUTOMATABLE: 4.14 — visual/subjective/motion

// 15.1 consistent_capitalization
// NOT-AUTOMATABLE: 15.1 — writing style

// 15.2 specific_wizard_action_verbs
// NOT-AUTOMATABLE: 15.2 — writing style

// 15.3 validation_names_swatch_and_fix
// NOT-AUTOMATABLE: 15.3 — writing style

// 15.4 alert_copy_names_situation
// NOT-AUTOMATABLE: 15.4 — writing style

// 15.5 body_copy_quality
// NOT-AUTOMATABLE: 15.5 — writing style

// 15.6 theme_terminology_consistent
// NOT-AUTOMATABLE: 15.6 — writing style

// 15.7 hex_and_count_formatting_consistent
// NOT-AUTOMATABLE: 15.7 — writing style

// 15.8 confirmation_states_what_happened
// NOT-AUTOMATABLE: 15.8 — writing style

// 15.9 hardened_action_verbs
// NOT-AUTOMATABLE: 15.9 — writing style

// 15.10 palette_empty_state_copy
// NOT-AUTOMATABLE: 15.10 — writing style

// 15.11 import_error_names_problem
// NOT-AUTOMATABLE: 15.11 — writing style
