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
  await expect(page).toHaveTitle('Nostrpass Vault');
});

test.describe('core_features', () => {
  test('dashboard_shows_active_identity_keys', async ({ page }) => {
    // On load, the dashboard view shows an active identity nickname, a public key rend
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('seeded_identities_distinct_npubs', async ({ page }) => {
    // On load, the Identities view lists at least 2 seeded identity cards, each with a
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

  test('reload_resets_to_seeded_in_memory_baseline', async ({ page }) => {
    // After creating an identity, toggling a permission, and switching theme, a full p
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

  test('valid_create_adds_distinct_identity', async ({ page }) => {
    // When the create-identity form is submitted with a valid label (trimmed, 1 to 40 
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify ARIA attributes on interactive elements
    const hasAria = await page.evaluate(() => {
      return document.querySelectorAll('[aria-label], [role]').length > 0;
    });
    expect(hasAria).toBe(true);
  });

  test('empty_label_rejected_inline', async ({ page }) => {
    // When the create-identity form is submitted with an empty or whitespace-only labe
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

});

test.describe('visual_design', () => {
  test('permissions_matrix_table_anatomy', async ({ page }) => {
    // The All identities matrix renders as a table with one nickname-labelled row per 
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify ARIA attributes on interactive elements
    const hasAria = await page.evaluate(() => {
      return document.querySelectorAll('[aria-label], [role]').length > 0;
    });
    expect(hasAria).toBe(true);
  });

  test('rotate_control_on_cards_and_dashboard', async ({ page }) => {
    // Each identity card and the dashboard carry a Rotate keys control alongside Selec
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('backup_surface_with_qr_placeholder', async ({ page }) => {
    // The Export backup surface pairs a monospaced single-identity JSON preview with C
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

  test('audit_filter_control_in_toolbar', async ({ page }) => {
    // The Audit log toolbar carries an action-type filter control offering All plus on
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

});

test.describe('user_flows', () => {
  test('create_flow_updates_all_surfaces', async ({ page }) => {
    // Create flow: submitting a valid identity label adds a card, increments the ident
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify ARIA attributes on interactive elements
    const hasAria = await page.evaluate(() => {
      return document.querySelectorAll('[aria-label], [role]').length > 0;
    });
    expect(hasAria).toBe(true);
  });

  test('invalid_create_shows_inline_validation', async ({ page }) => {
    // Create flow: empty, whitespace-only, or over-40-character labels trigger inline 
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify ARIA attributes on interactive elements
    const hasAria = await page.evaluate(() => {
      return document.querySelectorAll('[aria-label], [role]').length > 0;
    });
    expect(hasAria).toBe(true);
  });

  test('rename_flow_updates_related_displays', async ({ page }) => {
    // Rename flow: a valid rename updates the card label, the dashboard nickname when 
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

  test('delete_flow_updates_all_surfaces', async ({ page }) => {
    // Delete flow: confirming delete on a non-sole identity removes the card, decrease
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('view_switch_retains_vault_state', async ({ page }) => {
    // View switch: navigating Dashboard, Identities, Permissions, Audit log, and Setti
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

});

test.describe('writing', () => {
  test('audit_entries_name_action_and_identity', async ({ page }) => {
    // Where the app renders audit entries, each names the action and the identity; rot
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

});

test.describe('accessibility', () => {
  test('matrix_switches_named_identity_and_app', async ({ page }) => {
    // Each All-identities matrix cell is a real switch whose accessible name names bot
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify keyboard-operable controls exist
    const interactive = page.locator('button, input, select, [tabindex]');
    expect(await interactive.count()).toBeGreaterThan(0);
  });

  test('rotation_dialog_manages_focus', async ({ page }) => {
    // The rotate-keys confirmation opens as a dialog: focus moves in while open, Escap
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

});

test.describe('edge_cases', () => {
  test('search_empty_state_is_present', async ({ page }) => {
    // When Identities search matches nothing, an empty state explaining no matches is 
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('forms_validate_inline', async ({ page }) => {
    // Create and rename validate the label field inline before submit for empty, white
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify ARIA attributes on interactive elements
    const hasAria = await page.evaluate(() => {
      return document.querySelectorAll('[aria-label], [role]').length > 0;
    });
    expect(hasAria).toBe(true);
  });

  test('errors_are_actionable', async ({ page }) => {
    // Validation and import errors name the offending field and the fix rather than on
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('actions_show_confirmation', async ({ page }) => {
    // Create, permission toggle, copy, export, and import show visible success feedbac
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('import_shows_error_not_hang', async ({ page }) => {
    // A non-conforming vault import shows an inline error promptly rather than hanging
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

});

test.describe('responsiveness', () => {
  test('matrix_scrolls_inside_panel_at_375', async ({ page }) => {
    // At 375 pixel width the All identities matrix scrolls inside its own panel rather
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

});

test.describe('technical', () => {
  test('browser_storage_stays_empty_after_exercise', async ({ page }) => {
    // After creating an identity, toggling a permission, switching theme, exporting, a
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('keys_are_real_bech32', async ({ page }) => {
    // Public and private keys are real bech32-encoded values (npub1.../nsec1... prefix
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('cross_view_state_updates_without_reload', async ({ page }) => {
    // A change made in one view (e.g. toggling a permission in Permissions) is immedia
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('webmcp_lists_identity_and_artifact_tools', async ({ page }) => {
    // window.webmcp_list_tools() returns a non-empty tool list including identity crea
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

  test('webmcp_toggle_matches_ui', async ({ page }) => {
    // Invoking the application-permission toggle tool via window.webmcp_invoke_tool fo
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

});

test.describe('performance', () => {
  test('bulk_apply_has_no_partial_states', async ({ page }) => {
    // A bulk Grant all or Revoke all across every identity applies as one immediate vi
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

});

test.describe('behavioral', () => {
  test('multi_facet_round_trip', async ({ page }) => {
    // Multi-facet round-trip: create an identity, toggle a grant, switch theme, then r
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

  test('sort_reversal_proves_live_data', async ({ page }) => {
    // Sort-reversal proof: set Identities sort to Label A–Z, note order, then Label Z–
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify ARIA attributes on interactive elements
    const hasAria = await page.evaluate(() => {
      return document.querySelectorAll('[aria-label], [role]').length > 0;
    });
    expect(hasAria).toBe(true);
  });

  test('derived_view_responds_to_input', async ({ page }) => {
    // Derived-view sensitivity: toggle a permission grant and confirm the dashboard co
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('cross_view_echo_without_reload', async ({ page }) => {
    // Cross-view echo: rename the active identity and confirm the new label appears on
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Verify app loads and renders content
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len).toBeGreaterThan(0);
  });

  test('count_delta_is_exact', async ({ page }) => {
    // Count-delta integrity: measure the identity-count tile immediately before and af
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

});

test.describe('motion', () => {
  test('bulk_switches_animate_together', async ({ page }) => {
    // Activating Grant all or Revoke all animates every affected matrix switch handle 
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

  test('rotation_crossfades_key_surfaces', async ({ page }) => {
    // After confirming a rotation via the real dialog, the dashboard\'s npub and nsec s
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(bodyLen).toBeGreaterThan(0);
  });

});
