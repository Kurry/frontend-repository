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


test('6.1 create_flow_updates_all_surfaces', async ({ page }) => {
  await page.goto('/')

  const initialVersionsCount = await page.locator('.release-entry').count()

  await page.getByRole('button', { name: /Cut release/ }).click()
  await page.locator('#version-name').fill('3.0.0'); await page.locator('#version-name').blur(); await page.waitForTimeout(100);
  await page.locator('#release-notes').fill('Test notes'); await page.locator('#release-notes').blur(); await page.waitForTimeout(100);
  await page.locator('.cut-dialog button[type="submit"]').click({ force: true }); await page.waitForTimeout(500);

  await expect(page.locator('.release-entry')).toHaveCount(initialVersionsCount + 1, { timeout: 10000 })
  await expect(page.locator('.release-entry').first()).toContainText('3.0.0')

  await page.locator('.pack-group button', { hasText: 'Export' }).click()
  const jsonText = await page.getByLabel('Release pack JSON preview').textContent()
  const pack = JSON.parse(jsonText)
  expect(pack.versions[0].name).toBe('3.0.0')
  expect(pack.versions[0].notes).toBe('Test notes')
})

test('6.2 invalid_create_shows_inline_validation', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Cut release/ }).click()

  await page.locator('.cut-dialog button[type="submit"]').click({ force: true }); await page.waitForTimeout(500);
  await expect(page.getByText('String must contain at least 1 character(s)')).toBeVisible()

  await page.locator('#version-name').fill('not-a-semver'); await page.locator('#version-name').blur(); await page.waitForTimeout(100);
  await page.locator('.cut-dialog button[type="submit"]').click({ force: true }); await page.waitForTimeout(500);
  await expect(page.getByText('Must be a semantic version')).toBeVisible()
})

test('6.3 edit_flow_updates_related_displays', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('tab', { name: 'Diff' }).click()

  await page.locator('select').first().selectOption('1.0.0')
  await page.locator('select').nth(1).selectOption('2.0.0')

  await page.getByRole('button', { name: /Unchanged/ }).click()

  const initialAdded = await page.locator('.summary-cell.added strong').textContent()

  await page.locator('select').nth(1).selectOption('1.1.0')
  const newAdded = await page.locator('.summary-cell.added strong').textContent()
  expect(initialAdded).not.toEqual(newAdded)
})

test('6.4 delete_flow_updates_all_surfaces', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('tab', { name: 'Rotation' }).click()

  const initialCycleText = await page.locator('text=/Cycle \\d+/').first().textContent()
  const match = initialCycleText.match(/Cycle (\d+)/)
  const initialCycle = match ? parseInt(match[1]) : 0

  await page.getByRole('button', { name: /Advance rotation/ }).click()

  await expect(page.locator(`text=Cycle ${initialCycle + 1}`).first()).toBeVisible()

  await page.locator('.pack-group button', { hasText: 'Export' }).click()
  const jsonText = await page.getByLabel('Release pack JSON preview').textContent()
  const pack = JSON.parse(jsonText)
  expect(pack.rotation.cycle).toBe(initialCycle + 1)
})

test('6.5 view_switch_retains_state', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('tab', { name: 'Diff' }).click()
  await page.locator('select').first().selectOption('1.0.0')
  await page.locator('select').nth(1).selectOption('2.0.0')

  await page.getByRole('tab', { name: 'Manifest' }).click()
  await page.getByRole('tab', { name: 'Diff' }).click()

  expect(await page.locator('select').first().inputValue()).toBe('1.0.0')
  expect(await page.locator('select').nth(1).inputValue()).toBe('2.0.0')
})

test('6.6 diff_or_timeline_empty_state', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('tab', { name: 'Diff' }).click()
  await page.locator('select').first().selectOption('1.0.0')
  await page.locator('select').nth(1).selectOption('1.0.0')

  await expect(page.locator('.summary-cell.added strong')).toHaveText('0')
})

test('6.7 splits_view_and_diff_summary_coherence', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('tab', { name: 'Splits' }).click()
  const auricText = await page.locator('.fill-bar, .target-label, .category-row, tr', { hasText: 'auric' }).first().textContent()
  expect(auricText).not.toBeNull()
})

test('6.8 sidebar_and_export_panel_continuity', async ({ page }) => {
  await page.goto('/')
  await page.locator('.pack-group button', { hasText: 'Export' }).click()
  await expect(page.locator('.release-sidebar')).toBeVisible()

  const selectedText = await page.locator('.release-entry.selected').textContent()
  await page.keyboard.press('Escape')
  const newSelectedText = await page.locator('.release-entry.selected').textContent()
  expect(selectedText).toEqual(newSelectedText)
})

test('6.9 overlays_support_expected_flows', async ({ page }) => {
  await page.goto('/')
  await page.locator('.pack-group button', { hasText: 'Import' }).click()
  await expect(page.getByRole('dialog', { name: 'Import release pack' })).toBeVisible()
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByRole('dialog', { name: 'Import release pack' })).not.toBeVisible()
})

test('6.10 flow_recovers_without_reload', async ({ page }) => {
  await page.goto('/')
  await page.locator('.pack-group button', { hasText: 'Import' }).click()
  await page.getByLabel('Release pack JSON').fill('not json'); await page.getByRole('button', { name: 'Confirm import' }).click({ force: true })
  await expect(page.locator('text=/error|invalid|schema/i').first()).toBeVisible()
  await page.getByRole('button', { name: 'Cancel' }).click()
  await page.locator('.tab-trigger', { hasText: 'Rotation' }).click()
  await expect(page.getByRole('button', { name: /Advance rotation/ })).toBeVisible()
})

test('6.11 export_import_round_trip_flow', async ({ page }) => {
  await page.goto('/')
  await page.locator('.pack-group button', { hasText: 'Export' }).click()
  const jsonText = await page.getByLabel('Release pack JSON preview').textContent()
  const expectedCycle = JSON.parse(jsonText).rotation.cycle
  await page.keyboard.press('Escape')
  await page.locator('.tab-trigger', { hasText: 'Rotation' }).click()
  await page.getByRole('button', { name: /Advance rotation/ }).click()
  await page.locator('.pack-group button', { hasText: 'Import' }).click()
  await page.getByLabel('Release pack JSON').fill(jsonText)
  await page.getByRole('button', { name: 'Confirm import' }).click(); await expect(page.locator('.import-dialog, [role="dialog"]')).not.toBeVisible({ timeout: 5000 });
  await page.locator('.tab-trigger', { hasText: 'Rotation' }).click()
  await expect(page.getByText(new RegExp(`Cycle ${expectedCycle}\\b`)).first()).toBeVisible()
})

test('2.1 console_clean_full_exercise', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('tab', { name: 'Diff' }).click()
  await page.locator('select').first().selectOption('1.0.0')
  await page.getByRole('tab', { name: 'Rotation' }).click()
  await page.getByRole('button', { name: /Advance rotation/ }).click()
  await expect(page.getByRole('button', { name: /Advance rotation/ })).toBeVisible()
})

test('2.6 cold_load_interactive_2s', async ({ page }) => {
  const start = Date.now()
  await page.goto('/')
  await expect(page.locator('.release-entry').first()).toBeVisible()
  const duration = Date.now() - start
  expect(duration).toBeLessThan(2000)
})

test('2.7 rapid_input_stability', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('tab', { name: 'Diff' }).click()
  for(let i=0; i<5; i++) {
    await page.locator('select').first().selectOption('1.0.0')
    await page.locator('select').first().selectOption('2.0.0')
  }
  await expect(page.getByRole('tab', { name: 'Diff' })).toBeVisible()
})

test('2.8 keyboard_operability_focus', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  const isFocused = await page.evaluate(() => document.activeElement !== document.body)
  expect(isFocused).toBeTruthy()
})

test('2.9 dialog_focus_trap_escape', async ({ page }) => {
  await page.goto('/')
  const exportButton = page.locator('.pack-group button', { hasText: 'Export' })
  await exportButton.click()
  await expect(page.getByRole('dialog', { name: 'Export release pack' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(exportButton).toBeFocused()
})

test('2.10 aria_states_and_error_association', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Cut release/ }).click()
  await page.locator('.cut-dialog button[type="submit"]').click({ force: true }); await page.waitForTimeout(500);
  const error = page.locator('p, span', { hasText: /invalid|required|must/i }).first()
  await expect(error).toBeVisible()
  const id = await error.getAttribute('id')
  if (id) {
    const input = page.locator(`[aria-errormessage="${id}"]`)
    await expect(input).toBeVisible()
  }
})

test('2.11 no_outbound_chrome_links', async ({ page }) => {
  await page.goto('/')
  const externalLinks = await page.locator('a[href^="http"]').count()
  expect(externalLinks).toBe(0)
})

test('2.12 cut_and_import_zod_field_contracts', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Cut release/ }).click()
  await page.locator('#version-name').fill('invalid_semver'); await page.locator('#version-name').blur(); await page.waitForTimeout(100);
  await page.locator('.cut-dialog button[type="submit"]').click({ force: true }); await page.waitForTimeout(500);
  await expect(page.getByText('Must be a semantic version')).toBeVisible()
})

test('3.8 responsive_sidebar_and_mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 760 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Open releases' }).click()
  await page.getByRole('button', { name: 'Close releases' }).click()
  await expect(page.getByRole('button', { name: 'Open releases' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(375)
  await expect.poll(() => page.locator('.manifest-table').evaluate((node) => Math.ceil(node.getBoundingClientRect().right))).toBeLessThanOrEqual(375)
})

test('14.1 multi_facet_round_trip', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('tab', { name: 'Diff' }).click()
  await page.locator('select').first().selectOption('1.0.0')
  const val = await page.locator('select').first().inputValue()
  expect(val).toBe('1.0.0')
})

test('14.2 sort_reversal_proves_live_data', async ({ page }) => {
  await page.goto('/')
  const initialFirstVersion = await page.locator('.release-entry strong, .release-entry .version-label').first().textContent()
  await page.getByRole('button', { name: /Cut release/ }).click()
  await page.locator('#version-name').fill('9.9.9'); await page.locator('#version-name').blur(); await page.waitForTimeout(100);
  await page.locator('.cut-dialog button[type="submit"]').click({ force: true })
  await page.waitForTimeout(500)
  const newFirstVersion = await page.locator('.release-entry strong, .release-entry .version-label').first().textContent()
  expect(initialFirstVersion).not.toEqual(newFirstVersion)
})



























































// NOT-AUTOMATABLE: 3.1 spacing_and_sizing_follow_scale — subjective design criteria.
// NOT-AUTOMATABLE: 3.2 typography_matches_spec — subjective design criteria.
// NOT-AUTOMATABLE: 3.3 layout_matches_reference — subjective design criteria.
// NOT-AUTOMATABLE: 3.4 specified_state_changes_animate — subjective design criteria.
// NOT-AUTOMATABLE: 3.5 responsive_behavior_matches_reference — subjective design criteria.
// NOT-AUTOMATABLE: 3.6 control_styling_matches_spec — subjective design criteria.
// NOT-AUTOMATABLE: 3.7 typography_has_clear_hierarchy — subjective design criteria.






































































































// NOT-AUTOMATABLE: 15.1 headings_use_consistent_capitalization — subjective design criteria.
// NOT-AUTOMATABLE: 15.2 actions_use_specific_labels — subjective design criteria.
// NOT-AUTOMATABLE: 15.3 errors_name_problem_and_fix — subjective design criteria.
// NOT-AUTOMATABLE: 15.4 empty_states_explain_next_step — subjective design criteria.
// NOT-AUTOMATABLE: 15.5 body_copy_is_well_written — subjective design criteria.
// NOT-AUTOMATABLE: 15.6 terminology_is_consistent — subjective design criteria.
// NOT-AUTOMATABLE: 15.7 numbers_dates_and_units_are_consistent — subjective design criteria.
// NOT-AUTOMATABLE: 15.8 success_messages_are_specific — subjective design criteria.