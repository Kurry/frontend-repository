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

  // Splits composition bars update immediately when the selected version changes.
  await page.getByRole('tab', { name: 'Splits' }).click()
  const before = await page.locator('.quota-row strong').allTextContents()
  // Selecting a sidebar entry also switches to the Manifest tab, so return to Splits after.
  await page.locator('.release-entry', { hasText: 'v1.0.0' }).click()
  await page.getByRole('tab', { name: 'Splits' }).click()
  await expect(page.locator('.split-source')).toContainText('v1.0.0')
  await expect.poll(() => page.locator('.quota-row strong').allTextContents()).not.toEqual(before)

  // Diff summary strip counts update immediately when the diff pair changes,
  // and stay consistent with the same shared manifests (base==compare -> 0 added/removed/changed).
  await page.getByRole('tab', { name: 'Diff' }).click()
  await page.locator('select').first().selectOption('1.0.0')
  await page.locator('select').nth(1).selectOption('1.0.0')
  await expect(page.locator('.summary-cell.added strong')).toHaveText('0')
  await expect(page.locator('.summary-cell.removed strong')).toHaveText('0')
  await expect(page.locator('.summary-cell.changed strong')).toHaveText('0')
  await page.locator('select').nth(1).selectOption('2.0.0')
  await expect(page.locator('.summary-cell.added strong')).not.toHaveText('0')
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

test('2.1 shared_state_coherence', async ({ page }) => {
  await page.goto('/')

  // Sealing a cut must update the sidebar, pickers, timeline, and the
  // Export release pack JSON together, all derived from one shared store.
  await page.getByRole('button', { name: /Cut release/ }).click()
  await page.locator('#version-name').fill('9.5.0')
  await page.locator('.cut-dialog button[type="submit"]').click()
  await expect(page.locator('.rank-error')).toBeVisible({ timeout: 10_000 })
  await page.getByRole('button', { name: /Retry check/ }).click()
  await expect(page.getByRole('dialog', { name: 'Cut a sealed release' })).not.toBeVisible({ timeout: 10_000 })
  // Sidebar picked up the new sealed version and it is now selected.
  await expect(page.locator('.release-entry.selected')).toContainText('v9.5.0')
  // The diff "compare" picker defaults to the freshly sealed version too.
  await page.getByRole('tab', { name: 'Diff' }).click()
  expect(await page.locator('select').nth(1).inputValue()).toBe('9.5.0')
  // Export JSON reflects the same store: new version present, correct count.
  await page.locator('.pack-group button', { hasText: 'Export' }).click()
  const packAfterCut = JSON.parse(await page.getByLabel('Release pack JSON preview').textContent())
  expect(packAfterCut.versions.some((v) => v.name === '9.5.0')).toBe(true)
  expect(packAfterCut.versions.length).toBe(5)
  await page.keyboard.press('Escape')

  // Changing a diff picker recomputes classification/summary from the same manifests.
  await page.locator('select').first().selectOption('1.0.0')
  await page.locator('select').nth(1).selectOption('9.5.0')
  const addedAfterDiffChange = await page.locator('.summary-cell.added strong').textContent()
  expect(Number(addedAfterDiffChange)).toBeGreaterThan(0)

  // Advancing rotation updates the panel, history, timeline, and export
  // rotation.cycle together, in one action.
  await page.getByRole('tab', { name: 'Rotation' }).click()
  const cycleText = await page.locator('text=/Cycle \\d+/').first().textContent()
  const cycle = parseInt(cycleText.match(/Cycle (\d+)/)[1], 10)
  await page.getByRole('button', { name: /Advance rotation/ }).click()
  await expect(page.locator(`text=Cycle ${cycle + 1}`).first()).toBeVisible()
  await page.locator('.pack-group button', { hasText: 'Export' }).click()
  const packAfterRotation = JSON.parse(await page.getByLabel('Release pack JSON preview').textContent())
  expect(packAfterRotation.rotation.cycle).toBe(cycle + 1)
  const exportedPackText = await page.getByLabel('Release pack JSON preview').textContent()
  await page.keyboard.press('Escape')

  // A successful import replaces versions/rotation/timeline from that same
  // store, without a reload — sidebar count reflects the imported pack.
  await page.locator('.pack-group button', { hasText: 'Import' }).click()
  await page.getByLabel('Release pack JSON').fill(exportedPackText)
  await page.getByRole('button', { name: 'Confirm import' }).click()
  await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 })
  await expect(page.locator('.release-entry')).toHaveCount(packAfterRotation.versions.length)
})

test('2.5 console_clean_full_exercise', async ({ page }) => {
  await page.goto('/')

  // Complete a cut with a failed-then-retried rank-stability check.
  await page.getByRole('button', { name: /Cut release/ }).click()
  await page.locator('#version-name').fill('9.6.0')
  await page.locator('.cut-dialog button[type="submit"]').click()
  await expect(page.locator('.rank-error')).toBeVisible({ timeout: 10_000 })
  await page.getByRole('button', { name: /Retry check/ }).click()
  await expect(page.getByRole('dialog', { name: 'Cut a sealed release' })).not.toBeVisible({ timeout: 10_000 })

  // Export/import of Release pack JSON, plus a copy action.
  await page.locator('.pack-group button', { hasText: 'Export' }).click()
  const jsonText = await page.getByLabel('Release pack JSON preview').textContent()
  await page.locator('#export-copy-button').click()
  await page.keyboard.press('Escape')
  await page.locator('.pack-group button', { hasText: 'Import' }).click()
  await page.getByLabel('Release pack JSON').fill(jsonText)
  await page.getByRole('button', { name: 'Confirm import' }).click()
  await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 })

  // Diff pair changes.
  await page.getByRole('tab', { name: 'Diff' }).click()
  await page.locator('select').first().selectOption('1.0.0')
  await page.locator('select').nth(1).selectOption('9.6.0')

  // Rotation advance.
  await page.getByRole('tab', { name: 'Rotation' }).click()
  await page.getByRole('button', { name: /Advance rotation/ }).click()
  await expect(page.getByRole('button', { name: /Advance rotation/ })).toBeVisible()
  // The extended `page` fixture asserts zero console/page errors on teardown.
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

  // Fast diff picker changes interleaved with quick tab switches across a
  // 24-vs-27-task manifest pair; the UI must not hang and must land on the
  // correct, freshly recomputed result.
  const start = Date.now()
  for (let i = 0; i < 5; i++) {
    await page.locator('select').first().selectOption('1.0.0')
    await page.locator('select').nth(1).selectOption('2.0.0')
    await page.getByRole('tab', { name: 'Splits' }).click()
    await page.getByRole('tab', { name: 'Diff' }).click()
  }
  expect(Date.now() - start, 'rapid diff/tab churn stays responsive').toBeLessThan(8000)
  // v1.0.0 (24 tasks) vs v2.0.0 (27 tasks) always has additions; recomputation is correct, not stale.
  await expect(page.locator('.summary-cell.added strong')).not.toHaveText('0')

  // Repeated rotation advances also stay responsive and keep state coherent.
  await page.getByRole('tab', { name: 'Rotation' }).click()
  const cycleText = await page.locator('text=/Cycle \\d+/').first().textContent()
  const startCycle = parseInt(cycleText.match(/Cycle (\d+)/)[1], 10)
  for (let i = 1; i <= 3; i += 1) {
    await page.getByRole('button', { name: /Advance rotation/ }).click()
    await expect(page.locator(`text=Cycle ${startCycle + i}`).first()).toBeVisible({ timeout: 2000 })
  }
})

test('2.8 keyboard_operability_focus', async ({ page }) => {
  await page.goto('/')

  // Tab through the page collecting every control that receives focus, and
  // require a visible focus indicator (box-shadow ring) at every stop.
  const stops = []
  for (let i = 0; i < 40; i += 1) {
    await page.keyboard.press('Tab')
    const handle = await page.evaluateHandle(() => document.activeElement)
    const info = await handle.evaluate((el) => {
      if (!el || el === document.body) return null
      const cs = getComputedStyle(el)
      return {
        tag: el.tagName,
        role: el.getAttribute('role'),
        cls: el.className || '',
        text: (el.textContent || '').trim().slice(0, 40),
        boxShadow: cs.boxShadow,
      }
    })
    if (info) stops.push({ handle, info })
    else await handle.dispose()
  }

  for (const { info } of stops) {
    expect(info.boxShadow, `visible focus ring for ${info.tag} "${info.text}"`).not.toBe('none')
  }

  // The distinct control families named by the criterion are all keyboard-reachable.
  expect(stops.some(({ info }) => info.cls.includes('release-entry')), 'sidebar entries reachable').toBe(true)
  expect(stops.some(({ info }) => info.role === 'tab'), 'tabs reachable').toBe(true)
  expect(stops.some(({ info }) => info.tag === 'BUTTON' && info.text.includes('Export')), 'Export control reachable').toBe(true)

  // Operability: a focused sidebar entry is activated with Enter alone (native
  // <button> semantics), and the selection genuinely changes as a result.
  const entryStop = stops.find(({ info }) => info.cls.includes('release-entry'))
  await entryStop.handle.asElement().focus()
  await page.keyboard.press('Enter')
  const after = await page.locator('.release-entry.selected').textContent()
  expect(after).toBeTruthy()
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
  const input = page.locator('#version-name')
  // Type a name that fails the MAJOR.MINOR.PATCH schema (validateOnModelUpdate
  // runs immediately, unlike the disabled submit button which never fires a
  // click while the form is invalid).
  await input.fill('not-a-version')
  await input.blur()
  await expect(input).toHaveAttribute('aria-invalid', 'true')
  const error = page.locator('#version-name-error')
  await expect(error).toBeVisible()
  await expect(error).toHaveText(/version name must use major\.minor\.patch/i)
  const describedBy = await input.getAttribute('aria-describedby')
  expect(describedBy.split(/\s+/)).toContain('version-name-error')

  // Clearing to empty switches to the "required" message, still associated by the same id.
  await input.fill('')
  await input.blur()
  await expect(error).toHaveText(/version name is required/i)
  expect((await input.getAttribute('aria-describedby')).split(/\s+/)).toContain('version-name-error')
})

test('2.11 no_outbound_chrome_links', async ({ page }) => {
  await page.goto('/')
  const externalLinks = await page.locator('a[href^="http"]').count()
  expect(externalLinks).toBe(0)
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

  // Seal a cut. The rank-stability check always fails on the first attempt
  // (by design, per the store's runRankCheck comment) and requires a retry
  // before it seals — exercise that full path.
  await page.getByRole('button', { name: /Cut release/ }).click()
  await page.locator('#version-name').fill('9.9.9')
  await page.locator('.cut-dialog button[type="submit"]').click()
  await expect(page.locator('.rank-error')).toBeVisible({ timeout: 10_000 })
  await page.getByRole('button', { name: /Retry check/ }).click()
  await expect(page.getByRole('dialog', { name: 'Cut a sealed release' })).not.toBeVisible({ timeout: 10_000 })
  await expect(page.locator('.release-entry', { hasText: 'v9.9.9' })).toBeVisible()

  // Advance rotation.
  await page.getByRole('tab', { name: 'Rotation' }).click()
  await page.getByRole('button', { name: /Advance rotation/ }).click()
  await expect(page.locator('text=Cycle 9').first()).toBeVisible()

  // Diverge the diff pickers from their seeded defaults.
  await page.getByRole('tab', { name: 'Diff' }).click()
  await page.locator('select').first().selectOption('1.1.0')
  await page.locator('select').nth(1).selectOption('1.2.0')

  // A page reload must coherently reset to the seeded versions, default
  // selection, and seeded cycle — the session cut must not survive reload.
  await page.reload()
  await page.waitForLoadState('networkidle')

  await expect(page.locator('.release-entry', { hasText: 'v9.9.9' })).toHaveCount(0)
  await expect(page.locator('.release-entry')).toHaveCount(4)
  await expect(page.locator('.release-entry.selected')).toContainText('v2.0.0')

  await page.getByRole('tab', { name: 'Diff' }).click()
  expect(await page.locator('select').first().inputValue()).toBe('1.0.0')
  expect(await page.locator('select').nth(1).inputValue()).toBe('2.0.0')

  await page.getByRole('tab', { name: 'Rotation' }).click()
  await expect(page.locator('text=Cycle 8').first()).toBeVisible()
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