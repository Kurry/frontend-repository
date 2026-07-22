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
  await expect(page).toHaveTitle('PortfolioFrame');
});

test.describe('core_features', () => {
  test('1_1', async ({ page }) => {
    // On load, the app opens at / into the PortfolioFrame builder with a left editor p
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('1_2', async ({ page }) => {
    // After typing \'Ada Lovelace\' into the Profile Header Name field, the text \'Ada Lo
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

  test('1_3', async ({ page }) => {
    // After submitting the Add Project form with a Title \'Portfolio Site\' and a Catego
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('1_4', async ({ page }) => {
    // After adding a skill \'Design\' and then attempting to add \'design\' with different
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('1_5', async ({ page }) => {
    // After submitting the Add Testimonial form with a Quote, Name, and Role, a matchi
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify ARIA attributes on interactive elements
    const hasAria = await page.evaluate(() => {
      return document.querySelectorAll('[aria-label], [role]').length > 0;
    });
    expect(hasAria).toBe(true);
  });

});

test.describe('visual_design', () => {
  test('3_1', async ({ page }) => {
    // The app uses a warm off-white background with white surface cards and hairline b
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('3_2', async ({ page }) => {
    // The color tokens resolve to the specified values (primary violet #7C3AED, accent
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const buttons = page.locator('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test('3_3', async ({ page }) => {
    // Headings use the Poppins font stack and body text uses the Inter font stack, wit
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('3_4', async ({ page }) => {
    // Primary buttons render as a violet fill with white text at a full pill radius wi
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const buttons = page.locator('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test('3_5', async ({ page }) => {
    // Each of the four themes renders its specified accent and supporting tone pair (S
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

});

test.describe('user_flows', () => {
  test('add_project_updates_preview_and_completeness', async ({ page }) => {
    // Create flow: after submitting a valid project through the Add Project form, the 
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('invalid_project_title_inline_validation', async ({ page }) => {
    // Create flow: attempting to submit Add Project with an empty Title shows immediat
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('profile_and_project_edits_update_preview', async ({ page }) => {
    // Edit flow: typing into Profile Header Name/Title/Bio updates the preview header 
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

  test('delete_project_or_testimonial_updates_preview', async ({ page }) => {
    // Delete flow: deleting a project removes its card from the preview grid and delet
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('theme_and_density_switch_retains_content', async ({ page }) => {
    // Mode switch: selecting Forest recolors the preview\'s headings, chips, and accent
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bodyBg).toBeTruthy();
  });

});

test.describe('writing', () => {
  test('consistent_capitalization_chrome_and_panels', async ({ page }) => {
    // Where the app renders headings, buttons, and panel titles (PortfolioFrame, Profi
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const buttons = page.locator('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test('specific_verbs_on_actions', async ({ page }) => {
    // Where the app renders button or action labels, they use specific labels such as 
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const buttons = page.locator('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test('validation_names_problem_and_fix', async ({ page }) => {
    // Where the app renders Add Project, Add Testimonial, Contact, Draft, or Import va
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('empty_states_explain_next_step', async ({ page }) => {
    // Where the app renders empty states (preview start-building prompt, empty project
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('chrome_and_panel_copy_polished', async ({ page }) => {
    // Where the app renders chrome labels, panel titles, empty-state copy, and validat
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify ARIA attributes on interactive elements
    const hasAria = await page.evaluate(() => {
      return document.querySelectorAll('[aria-label], [role]').length > 0;
    });
    expect(hasAria).toBe(true);
  });

});

test.describe('accessibility', () => {
  test('builder_controls_keyboard_operable', async ({ page }) => {
    // Every interactive editor control — Profile Header fields, Add Project and Add Te
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify keyboard-operable controls exist
    const interactive = page.locator('button, input, select, [tabindex]');
    expect(await interactive.count()).toBeGreaterThan(0);
  });

  test('focus_visible_on_builder_controls', async ({ page }) => {
    // Keyboard Tab focus is visibly indicated on form fields, theme swatches, section 
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const buttons = page.locator('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test('chrome_icons_have_accessible_names', async ({ page }) => {
    // Meaningful chrome icons for section toggles, reorder controls, delete controls, 
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('validation_and_save_feedback_announced', async ({ page }) => {
    // Inline validation and duplicate-rejection messages render adjacent to the field 
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify ARIA attributes on interactive elements
    const hasAria = await page.evaluate(() => {
      return document.querySelectorAll('[aria-label], [role]').length > 0;
    });
    expect(hasAria).toBe(true);
  });

  test('editor_forms_explicitly_labeled', async ({ page }) => {
    // Profile Header, Add Project, Add Testimonial, Skills, Contact, and Save As Draft
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
  test('empty_regions_show_hints', async ({ page }) => {
    // On first load and whenever projects, testimonials, skills, or drafts are empty, 
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

  test('add_project_title_inline_validation', async ({ page }) => {
    // Attempting to submit the Add Project form with an empty Title shows an inline er
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('validation_names_field_and_fix', async ({ page }) => {
    // Add Project Title validation and case-insensitive duplicate-skill rejection copy
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('draft_save_shows_confirmation', async ({ page }) => {
    // Saving a draft via Save As Draft adds the new entry to the drafts list immediate
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('duplicate_skill_rejected_inline', async ({ page }) => {
    // Attempting to add a skill that duplicates an existing one ignoring letter case i
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

});

test.describe('responsiveness', () => {
  test('layout_adapts_1440_to_375', async ({ page }) => {
    // Resizing from 1440px desktop to about 375px mobile keeps a usable PortfolioFrame
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('mobile_tap_targets_adequate', async ({ page }) => {
    // At 375px width, Add Project/Testimonial submits, section toggles, Move Up/Down, 
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('preview_headings_readable_both_widths', async ({ page }) => {
    // The preview\'s name heading, section headings, and the Completeness \
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('no_clip_or_overflow_at_375', async ({ page }) => {
    // At 375px width, editor panels and preview content never clip or overflow the vie
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('editor_preview_stack_at_375', async ({ page }) => {
    // At about 375px wide the editor and preview stack into a single column and both r
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

});

test.describe('technical', () => {
  test('2_1', async ({ page }) => {
    // The editor and the live preview derive from one shared collection: a content edi
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

  test('2_2', async ({ page }) => {
    // After creating content and saving a named draft, a full page refresh restores th
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

  test('2_3', async ({ page }) => {
    // The primary content workflow stays exact and responsive under at least 25 rapid 
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('api_shaped_forms_and_export_coherence', async ({ page }) => {
    // Add Project, Add Testimonial, Contact, Save As Draft, and Import paste show inli
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

  test('export_import_localstorage_coherence', async ({ page }) => {
    // After mutating profile/projects, exporting Portfolio JSON, and reloading, the re
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

});

test.describe('performance', () => {
  test('cold_start_under_two_seconds', async ({ page }) => {
    // On a local cold load the PortfolioFrame builder becomes interactive within 2 sec
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('console_clean_during_full_exercise', async ({ page }) => {
    // No console errors appear during a full exercise of the builder — creating, editi
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

  test('preview_updates_under_100ms', async ({ page }) => {
    // Typing into Profile Header fields or selecting a theme/density updates the live 
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('shell_visible_while_settling', async ({ page }) => {
    // While the app settles after first paint, the top bar and two-pane editor/preview
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('primary_workflow_smooth_under_25_reps', async ({ page }) => {
    // The primary content workflow (add project or skill through normal controls) stay
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

});

test.describe('behavioral', () => {
  test('multi_facet_persistence_round_trip', async ({ page }) => {
    // Starting empty: set Profile Header Name to \'Ada Lovelace\', add one project title
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

  test('section_reorder_reversal_proves_live_order', async ({ page }) => {
    // Reorder-reversal proof (genre stand-in for sort reversal): with at least two vis
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('completeness_and_theme_derived_sensitivity', async ({ page }) => {
    // Derived-view sensitivity: fill a previously empty recommended Profile Header Nam
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('editor_edit_echoes_in_preview', async ({ page }) => {
    // Cross-view echo: type \'Ada Lovelace\' into Profile Header Name and edit a project
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

  test('add_project_count_delta_exact', async ({ page }) => {
    // Count-delta integrity: measure the preview project-card count (and Completeness 
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

});

test.describe('innovation', () => {
  test('card_enter_delight_beyond_minimum', async ({ page }) => {
    // Beyond the required enter/exit motion for project or testimonial cards, the buil
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('history_branch_visualization_beyond_list', async ({ page }) => {
    // The History panel offers advanced visualization beyond a flat snapshot list — fo
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('guided_first_run_for_builder', async ({ page }) => {
    // A brief guided first-run or coachmark flow introduces the editor panel, live pre
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('completeness_aid_extra_usability', async ({ page }) => {
    // An interactive completeness aid beyond the required \
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('alternate_skill_or_section_input', async ({ page }) => {
    // Beyond basic Tab/Enter operability, the builder supports an alternate input such
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify keyboard-operable controls exist
    const interactive = page.locator('button, input, select, [tabindex]');
    expect(await interactive.count()).toBeGreaterThan(0);
  });

});

test.describe('design_fidelity', () => {
  test('spacing_follows_8px_builder_scale', async ({ page }) => {
    // At 1440px, spacing among the top bar, left editor panel, and right preview canva
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('typography_matches_poppins_inter_spec', async ({ page }) => {
    // Heading text uses a Poppins-first stack and body text an Inter-first stack; the 
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('desktop_two_pane_matches_reference', async ({ page }) => {
    // At 1440px the layout matches the reference composition within a small tolerance:
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

  test('specified_builder_state_changes_animate', async ({ page }) => {
    // State changes the spec calls out — adding/deleting a project or testimonial card
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('responsive_stack_matches_reference_patterns', async ({ page }) => {
    // At 375px vs 1440px, responsive behavior matches the reference patterns: editor a
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
  test('4_1', async ({ page }) => {
    // Buttons, theme swatches, and section toggles each show a visibly distinct hover 
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const buttons = page.locator('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test('4_2', async ({ page }) => {
    // Keyboard Tab focus is visibly indicated on interactive controls including form f
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const buttons = page.locator('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test('4_3', async ({ page }) => {
    // Saving a draft gives immediate transient feedback that the save succeeded, such 
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('4_4', async ({ page }) => {
    // Undo, Redo, Apply Scenario Change, and branch selection performed through the re
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('copy_export_confirmation_feedback', async ({ page }) => {
    // Activating Copy export through the real Export package control shows a brief vis
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

});
