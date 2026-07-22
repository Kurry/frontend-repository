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

const open = async (page) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Greenroom Forecast Board' })).toBeVisible();
};

const applyExact = async (page, value) => {
  await page.locator('#forecast-exact').fill(String(value));
  await page.getByRole('button', { name: 'Apply forecast' }).click();
};

const previewArtifact = async (page) => {
  await page.getByRole('button', { name: 'Preview artifact' }).last().click();
  return JSON.parse(await page.locator('#export-preview').textContent());
};

test('AC-01 signature_mutation', async ({ page }) => {
  await open(page);
  await expect(page.getByText('No authored events yet')).toBeVisible();
  await applyExact(page, 15);
  await expect(page.locator('[data-projected-window]')).toContainText('10:15');
  await expect(page.locator('.event')).toHaveCount(1);
  const artifact = await previewArtifact(page);
  const maya = artifact.records.find((record) => record.id === 'slot-maya');
  expect(maya.forecastOffsetMinutes).toBe(15);
  expect(artifact.history).toHaveLength(1);
  expect(artifact.history[0]).toMatchObject({ eventId: 'evt-0001', type: 'forecast-adjust', recordId: 'slot-maya' });
});

test('CF-02 collection_issue_fields', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Release 2.4' }).click();
  await expect(page.locator('.slot-row')).toHaveCount(3);
  await page.getByRole('button', { name: 'Clear' }).last().click();
  await expect(page.locator('.slot-row')).toHaveCount(8);
  await page.locator('[data-ribbon-card="slot-maya"]').getByRole('button', { name: 'Earlier' }).click();
  await expect(page.locator('.event')).toHaveCount(1);
  const selected = await page.evaluate(() => window.webmcp_invoke_tool('entity.select', { id: 'slot-maya' }));
  expect(selected.record.issueNumber).toBe(1427);
  expect(selected.record.releaseTag).toBe('v2.4.0');
});

test('AC-02 visual_hierarchy', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await expect(page.locator('.summary-ribbon .metric')).toHaveCount(6);
  await expect(page.locator('.forecast-workbench')).toBeVisible();
  await expect(page.locator('.slots-surface')).toBeVisible();
  await expect(page.locator('.forecast-surface')).toBeVisible();
  await expect(page.locator('.inspector-surface')).toBeVisible();
  const columns = await page.locator('.forecast-workbench').evaluate((el) => getComputedStyle(el).gridTemplateColumns);
  expect(columns.split(' ').length).toBeGreaterThanOrEqual(3);
});

test('VD-02 domain_visual_system', async ({ page }) => {
  await open(page);
  const palette = await page.locator('.topbar').evaluate((el) => ({ bg: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color }));
  expect(palette.bg).toBe('rgb(23, 33, 27)');
  expect(palette.color).not.toBe(palette.bg);
  await expect(page.locator('.release-pill').first()).toContainText('#');
  await expect(page.locator('.status').first()).toHaveText(/draft|ready|changed|archived/);
});

test('AC-03 causal_motion', async ({ page }) => {
  await open(page);
  const duration = await page.locator('.ribbon-card').first().evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(duration).toMatch(/0\.2|0\.22/);
  await page.getByRole('button', { name: '+5 minutes' }).click();
  await expect(page.locator('.event')).toHaveCount(1);
  await expect(page.locator('[data-projected-window]')).toContainText('10:05');
});

test('MO-02 motion_system_reduced', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  const durations = await page.locator('.ribbon-card').first().evaluate((el) => ({ transition: getComputedStyle(el).transitionDuration, animation: getComputedStyle(el).animationDuration }));
  expect(parseFloat(durations.transition)).toBeLessThanOrEqual(0.001);
  expect(parseFloat(durations.animation)).toBeLessThanOrEqual(0.001);
  await page.getByRole('button', { name: '+5 minutes' }).click();
  await expect(page.locator('.event')).toHaveCount(1);
});

test('AC-04 schema_contract', async ({ page }) => {
  await open(page);
  await applyExact(page, 10);
  const artifact = await previewArtifact(page);
  expect(Object.keys(artifact).sort()).toEqual(['derived', 'exportedAt', 'history', 'records', 'schemaVersion']);
  expect(artifact.schemaVersion).toBe('speaker-greenroom-v1');
  expect(Object.keys(artifact.records[0]).sort()).toEqual(['duplicateOf','durationMinutes','forecastOffsetMinutes','forecastRibbonState','id','issueNumber','provenance','releaseTag','room','sessionTitle','speakerName','startMinute','status','track']);
  expect(artifact.history[0]).toMatchObject({ sequence: 1, eventId: 'evt-0001' });
  expect(artifact.derived.selectedId).toBe('slot-maya');
});

test('TE-02 runtime_integrity', async ({ page }) => {
  await open(page);
  const info = await page.evaluate(() => window.webmcp_session_info());
  expect(info.modules).toEqual(['browse-query-v1', 'entity-collection-v1', 'form-workflow-v1', 'artifact-transfer-v1']);
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
  await applyExact(page, 15);
  await page.reload();
  await expect(page.locator('.metric').filter({ hasText: 'Events' }).locator('strong')).toHaveText('0');
  await expect(page.locator('#forecast-exact')).toHaveValue('0');
});

test('AC-05 complete_user_flow', async ({ page }) => {
  await open(page);
  await applyExact(page, 15);
  const first = await page.evaluate(() => window.webmcp_invoke_tool('entity.select', { id: 'slot-maya' }));
  expect(first.history).toHaveLength(1);
  await page.getByRole('button', { name: /Undo/ }).click();
  await expect(page.locator('.event')).toHaveCount(0);
  await expect(page.locator('#forecast-exact')).toHaveValue('0');
  await applyExact(page, 15);
  const second = await page.evaluate(() => window.webmcp_invoke_tool('entity.select', { id: 'slot-maya' }));
  expect(second.history[0].type).toBe(first.history[0].type);
  expect(second.history[0].recordId).toBe(first.history[0].recordId);
  expect(second.history[0].after.forecastOffsetMinutes).toBe(first.history[0].after.forecastOffsetMinutes);
});

test('UF-02 author_to_artifact_flow', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Add slot' }).first().click();
  await page.locator('#field-speakerName').fill('Tara Singh');
  await page.locator('#field-sessionTitle').fill('Forecasting the accessible hallway');
  await page.locator('#field-issueNumber').fill('1999');
  await page.locator('#field-releaseTag').fill('v3.1.0');
  await page.locator('#slot-form').getByRole('button', { name: 'Add slot' }).click();
  await expect(page.locator('.slot-row')).toHaveCount(9);
  await applyExact(page, -5);
  const artifact = await previewArtifact(page);
  expect(artifact.records.find((record) => record.issueNumber === 1999)?.forecastOffsetMinutes).toBe(-5);
});

test('AC-06 boundaries_recovery', async ({ page }) => {
  await open(page);
  const base = await page.evaluate(() => window.webmcp_invoke_tool('entity.select', { id: 'slot-maya' }));
  const validMin = await page.evaluate((record) => window.webmcp_invoke_tool('form.validate', { form: 'forecast', id: record.id, fields: { forecastOffsetMinutes: -30 } }), base.record);
  const validMax = await page.evaluate((record) => window.webmcp_invoke_tool('form.validate', { form: 'forecast', id: record.id, fields: { forecastOffsetMinutes: 30 } }), base.record);
  const outside = await page.evaluate(() => window.webmcp_invoke_tool('form.validate', { form: 'forecast', id: 'slot-maya', fields: { forecastOffsetMinutes: 35 } }));
  const wrongStep = await page.evaluate(() => window.webmcp_invoke_tool('form.validate', { form: 'forecast', id: 'slot-maya', fields: { forecastOffsetMinutes: 7 } }));
  expect(validMin.ok).toBe(true);
  expect(validMax.ok).toBe(true);
  expect(outside.ok).toBe(false);
  expect(wrongStep.ok).toBe(false);
  await page.getByRole('button', { name: 'Import JSON' }).first().click();
  await page.locator('#import-text').fill(JSON.stringify({ schemaVersion: 'wrong', records: [{ id: 'x' }], derived: {}, history: [], extra: true }));
  await page.getByRole('button', { name: 'Validate and import' }).click();
  await expect(page.locator('#import-report li')).not.toHaveCount(0);
  await expect(page.locator('#import-report')).toContainText('schemaVersion');
});

test('EC-02 atomic_noop_recovery', async ({ page }) => {
  await open(page);
  await applyExact(page, 0);
  await expect(page.locator('.event')).toHaveCount(0);
  await page.locator('#slot-search').fill('no-such-speaker');
  await expect(page.getByText('No slots match')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Clear filters' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add slot' }).first()).toBeVisible();
});

test('AC-07 mobile_mode', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await open(page);
  await page.getByRole('tab', { name: /Forecast/ }).click();
  await page.getByRole('button', { name: '+5 minutes' }).click();
  await expect(page.locator('.event')).toHaveCount(1);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  const sizes = await page.locator('button:visible').evaluateAll((buttons) => buttons.map((b) => ({ w: b.getBoundingClientRect().width, h: b.getBoundingClientRect().height })));
  expect(sizes.every((size) => size.w >= 44 && size.h >= 44)).toBe(true);
});

test('RS-02 responsive_recomposition', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await expect(page.locator('.slots-surface')).toBeVisible();
  await expect(page.locator('.forecast-surface')).toBeVisible();
  await expect(page.locator('.inspector-surface')).toBeVisible();
  await page.setViewportSize({ width: 900, height: 800 });
  await expect(page.locator('.mobile-steps')).toBeVisible();
  await page.getByRole('tab', { name: /Artifact/ }).click();
  await expect(page.locator('.artifact-card')).toBeVisible();
});

test('AC-08 alternate_input', async ({ page }) => {
  await open(page);
  const range = page.locator('#forecast-range');
  await range.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.event')).toHaveCount(1);
  const after = await page.evaluate(() => window.webmcp_invoke_tool('entity.select', { id: 'slot-maya' }));
  expect(after.record.forecastOffsetMinutes).toBe(5);
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z');
  await expect(page.locator('.event')).toHaveCount(0);
});

test('AX-02 dialog_live_semantics', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Add slot' }).first().focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('label')).not.toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Add slot' }).first()).toBeFocused();
});

test('AC-09 large_collection', async ({ page }) => {
  await open(page);
  const start = Date.now();
  await page.getByRole('button', { name: 'Load 104' }).click();
  await expect(page.locator('.metric').filter({ hasText: 'Active' }).locator('strong')).toHaveText('104');
  expect(Date.now() - start).toBeLessThan(2000);
  const direct = await page.evaluate(async () => { const t = performance.now(); await window.webmcp_invoke_tool('entity.select', { id: 'fixture-050' }); return performance.now() - t; });
  expect(direct).toBeLessThan(100);
  const derived = await page.evaluate(() => window.webmcp_invoke_tool('entity.select', { id: 'fixture-050' }));
  expect(derived.derived.activeCount).toBe(104);
});

test('PF-02 rapid_input_stability', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: '+5 minutes' }).click();
  await page.getByRole('button', { name: '+5 minutes' }).click();
  await page.getByRole('button', { name: /Undo/ }).click();
  await page.locator('#slot-search').fill('Maya');
  await expect(page.locator('.slot-row')).toHaveCount(1);
  const result = await page.evaluate(() => window.webmcp_invoke_tool('entity.select', { id: 'slot-maya' }));
  expect(new Set(result.history.map((event) => event.eventId)).size).toBe(result.history.length);
});

test('AC-10 domain_copy', async ({ page }) => {
  await open(page);
  const text = await page.locator('body').innerText();
  for (const phrase of ['Speaker slots', 'Forecast ribbon', 'GitHub issue', 'Portable artifact']) expect(text).toContain(phrase);
  expect(text).not.toMatch(/Lorem|TODO|\bSubmit\b|\bOK\b|judge|rubric/i);
});

test('WR-02 actionable_recovery_copy', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Add slot' }).first().click();
  await page.locator('#field-speakerName').fill('A');
  await page.locator('#slot-form').getByRole('button', { name: 'Add slot' }).click();
  await expect(page.locator('#speakerName-error')).toContainText('2 through 80');
  await page.getByRole('button', { name: 'Close slot dialog' }).click();
  await page.locator('#slot-search').fill('missing');
  await expect(page.getByText('Clear filters, add a slot, or import JSON.')).toBeVisible();
});

test('AC-11 linked_utility', async ({ page }) => {
  await open(page);
  await expect(page.locator('.comparison-grid')).toContainText('Baseline window');
  await expect(page.locator('.comparison-grid')).toContainText('Release lineage');
  await expect(page.getByRole('button', { name: 'Release 2.4' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Merge into selected' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Preview artifact' }).last()).toBeVisible();
});

test('IN-02 forecast_workbench_differentiation', async ({ page }) => {
  await open(page);
  await expect(page.locator('.forecast-editor')).toBeVisible();
  await expect(page.locator('.ribbon-track .ribbon-card')).toHaveCount(8);
  await applyExact(page, 15);
  await expect(page.locator('.event')).toContainText('forecast-adjust');
  await expect(page.locator('.event')).toContainText('slot-maya');
});

test('innovation.catchall innovation_catchall', async ({ page }) => {
  await open(page);
  await expect(page.locator('.saved-queries .chip')).toHaveCount(3);
  await expect(page.locator('.detail-list')).toContainText('GitHub issue');
  await expect(page.getByRole('heading', { name: 'Duplicate merge' })).toBeVisible();
});

test('AC-12 source_fidelity', async ({ page }) => {
  await open(page);
  const text = await page.locator('body').innerText();
  const lower = text.toLowerCase();
  for (const phrase of ['active', 'typed github issue fields', 'baseline window', 'projected window', 'canonical event history', 'portable artifact']) expect(lower).toContain(phrase);
  expect(text).not.toMatch(/Recovery Board|Move to recovery|Apply repair|react\.svg|vite\.svg/i);
});

test('DF-02 state_fidelity', async ({ page }) => {
  await open(page);
  await expect(page.locator('.slot-row.selected')).toContainText('Selected');
  await page.getByRole('button', { name: '+5 minutes' }).click();
  await expect(page.locator('.ribbon-state')).toHaveText(/changed|conflict/);
  await expect(page.locator('.status.changed').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Undo/ })).toBeEnabled();
});

test('AC-13 artifact_round_trip', async ({ page }) => {
  await open(page);
  await applyExact(page, 15);
  const before = await previewArtifact(page);
  const text = await page.locator('#export-preview').textContent();
  await page.getByRole('button', { name: 'Close artifact preview' }).click();
  await page.getByRole('button', { name: 'Clear' }).first().click();
  await page.getByRole('button', { name: 'Clear session' }).click();
  await expect(page.locator('.metric').filter({ hasText: 'Active' }).locator('strong')).toHaveText('0');
  await page.getByRole('button', { name: 'Import JSON' }).first().click();
  await page.locator('#import-text').fill(text);
  await page.getByRole('button', { name: 'Validate and import' }).click();
  const after = await previewArtifact(page);
  delete before.exportedAt;
  delete after.exportedAt;
  expect(after).toEqual(before);
});

test('BH-02 canonical_path_parity', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: '+5 minutes' }).click();
  const visible = await page.evaluate(() => window.webmcp_invoke_tool('entity.select', { id: 'slot-maya' }));
  expect(visible.history).toHaveLength(1);
  await page.reload();
  const webmcp = await page.evaluate(() => window.webmcp_invoke_tool('entity.update', { id: 'slot-maya', action: 'forecast', fields: { forecastOffsetMinutes: 5 } }));
  expect(webmcp.ok).toBe(true);
  const canonical = await page.evaluate(() => window.webmcp_invoke_tool('entity.select', { id: 'slot-maya' }));
  expect(canonical.history[0]).toMatchObject({ sequence: visible.history[0].sequence, eventId: visible.history[0].eventId, type: visible.history[0].type, recordId: visible.history[0].recordId });
  expect(canonical.history[0].after.forecastOffsetMinutes).toBe(visible.history[0].after.forecastOffsetMinutes);
});
