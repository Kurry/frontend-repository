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

test('1.2 criterion_form_focus_trap_and_return', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');

  await expect(page.locator('.rubric-entry').first()).toBeVisible();

  const addOpener = page.getByRole('button', { name: 'Add criterion', exact: true }).first();
  await addOpener.click();
  const addDialog = page.locator('.criterion-form').first();
  await expect(addDialog).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(addDialog).toBeHidden();

  await expect(addOpener).toBeFocused();

  const exportOpener = page.getByRole('button', { name: 'Export', exact: true }).first();
  await exportOpener.click();
  const exportDialog = page.locator('.export-dialog').first();
  await expect(exportDialog).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(exportDialog).toBeHidden();

  await expect(exportOpener).toBeFocused();

  const importOpener = page.getByRole('button', { name: 'Import', exact: true }).first();
  await importOpener.click();
  const importDialog = page.locator('.import-dialog').first();
  await expect(importDialog).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(importDialog).toBeHidden();

  await expect(importOpener).toBeFocused();
});

test('1.6 accordion_and_disclosure_expose_expanded_state', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');

  const header = page.locator('.p-accordionheader').first();
  await expect(header).toHaveAttribute('aria-expanded', 'false');
  await header.click();
  await expect(header).toHaveAttribute('aria-expanded', 'true');

  const rationaleToggle = page.locator('.rationale-toggle').first();
  await expect(rationaleToggle).toHaveAttribute('aria-expanded', 'false');

  const panel = page.locator('.rationale-wrap').first();
  await expect(panel).not.toHaveClass(/open/);

  await rationaleToggle.click();
  await expect(rationaleToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(panel).toHaveClass(/open/);
});

test('4.7 dialog_focus_trap_escape', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');

  await expect(page.locator('.rubric-entry').first()).toBeVisible();

  const addOpener = page.getByRole('button', { name: 'Add criterion', exact: true }).first();
  await addOpener.click();
  const addDialog = page.locator('.criterion-form').first();
  await expect(addDialog).toBeVisible();

  await page.click('body', { position: { x: 10, y: 10 } });
  await page.keyboard.press('Escape');
  await expect(addDialog).toBeHidden();

  await expect(addOpener).toBeFocused();
});

test('1.6 criterion_form_inline_validation', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');

  const addOpener = page.getByRole('button', { name: 'Add criterion', exact: true }).first();
  await addOpener.click();

  const addDialog = page.locator('.criterion-form').first();
  await expect(addDialog).toBeVisible();

  const submit = page.getByRole('button', { name: 'Add criterion', exact: true }).nth(1);

  // form validates on mount: submit stays disabled and per-field inline
  // messages are already populated for the empty required fields
  await expect(submit).toHaveAttribute('data-incomplete', 'true');
  await expect(submit).toBeDisabled();

  const initialCount = await page.locator('.criterion-panel').count();

  const idError = page.locator('#criterion-id-error');
  await expect(idError).not.toBeEmpty();
  const nameError = page.locator('#criterion-name-error');
  await expect(nameError).not.toBeEmpty();

  // disabled submit cannot be actioned; the criterion is not added
  await expect(addDialog).toBeVisible();

  const currentCount = await page.locator('.criterion-panel').count();
  expect(currentCount).toBe(initialCount);

  await page.keyboard.press('Escape');
  await expect(addDialog).toBeHidden();
  await expect(addOpener).toBeFocused();
});

test('1.5 add_criterion_count_delta', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');

  const addOpener = page.getByRole('button', { name: 'Add criterion', exact: true }).first();
  await addOpener.click();

  const addDialog = page.locator('.criterion-form').first();
  await expect(addDialog).toBeVisible();

  await page.fill('#criterion-id', 'test-id');
  await page.fill('#criterion-name', 'Test Name');
  await page.fill('#criterion-description', 'Test description');

  const submit = page.getByRole('button', { name: 'Add criterion', exact: true }).nth(1);
  await expect(submit).not.toHaveAttribute('data-incomplete', 'true');

  const headerRollup = page.locator('.rollup-line').first();
  const initialCountText = await headerRollup.locator('strong').first().innerText();
  const initialCount = parseInt(initialCountText);

  await submit.click();
  await expect(addDialog).toBeHidden();

  const newRow = page.getByRole('button', { name: /test-id/ });
  await expect(newRow.first()).toBeVisible();

  const finalCountText = await headerRollup.locator('strong').first().innerText();
  const finalCount = parseInt(finalCountText);
  expect(finalCount).toBe(initialCount + 1);
});

test('4.4 editor_preview does not mutate other fields', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');

  const skip = page.getByRole('button', { name: 'Skip tour' });
  if (await skip.isVisible()) await skip.click();

  const initialCriteriaCount = await page.locator('.criterion-panel').count();

  const result = await invokeTool(page, 'editor_preview');
  expect(result.ok).toBe(true);

  await expect(page.locator('.preview-view')).toBeVisible();
  await expect(page.locator('text=Sample submission')).toBeVisible();

  await page.getByRole('button', { name: 'Criteria', exact: true }).click();
  await expect(page.locator('.criteria-view')).toBeVisible();
  const currentCriteriaCount = await page.locator('.criterion-panel').count();
  expect(currentCriteriaCount).toBe(initialCriteriaCount);
});

test('4.10 end_state_export_is_portable_persistence', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');

  const addOpener = page.getByRole('button', { name: 'Add criterion', exact: true }).first();
  await addOpener.click();

  await page.fill('#criterion-id', 'test-export-id');
  await page.fill('#criterion-name', 'Test Export Name');
  await page.fill('#criterion-description', 'Test Export description');

  const submit = page.getByRole('button', { name: 'Add criterion', exact: true }).nth(1);
  await submit.click();

  await page.getByRole('button', { name: 'Export', exact: true }).first().click();

  await page.getByRole('tab', { name: 'Package JSON' }).click();

  const previewContent = await page.locator('.export-preview').innerText();
  const jsonContent = JSON.parse(previewContent);
  expect(jsonContent.schemaVersion).toBe('rubric-package-v1');
  expect(jsonContent.library).toBe('Rubric Studio');

  const hasNewId = jsonContent.rubrics.some(r => r.criteria.some(c => c.id === 'test-export-id'));
  expect(hasNewId).toBe(true);
});

test('1.18 import_package_round_trip', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');

  const testPackage = {
    schemaVersion: 'rubric-package-v1',
    library: 'Rubric Studio',
    rubrics: [
      {
        schemaVersion: 'rubric-document-v1',
        name: 'Test Import Rubric',
        version: '1.0.0',
        arbiterModel: 'quartz-arbiter-2',
        aggregationMode: 'weighted-mean',
        criteria: [
          {
            id: 'test-import-id',
            name: 'Test Import Name',
            description: 'Test Import Description',
            type: 'binary',
            likertMin: null,
            likertMax: null,
            weight: 1,
            importance: 'must-have'
          }
        ]
      }
    ],
    generatedAt: new Date().toISOString()
  };

  const importStr = JSON.stringify(testPackage);

  const importOpener = page.getByRole('button', { name: 'Import', exact: true }).first();
  await importOpener.click();

  await page.fill('textarea[placeholder="Paste the exported package JSON here"]', importStr);
  await page.getByRole('button', { name: 'Import package', exact: true }).click();

  const newRow = page.getByRole('button', { name: /test-import-id/ });
  await expect(newRow.first()).toBeVisible();

  await page.getByRole('button', { name: 'Export', exact: true }).first().click();
  await page.getByRole('tab', { name: 'Package JSON' }).click();

  const previewContent = await page.locator('.export-preview').innerText();
  const jsonContent = JSON.parse(previewContent);
  expect(jsonContent.rubrics[0].name).toBe('Test Import Rubric');
});

test('4.6 keyboard_operability_focus', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');

  const addOpener = page.getByRole('button', { name: 'Add criterion', exact: true }).first();
  await addOpener.focus();
  await expect(addOpener).toBeFocused();

  const header = page.locator('.p-accordionheader').first();
  await header.focus();
  await expect(header).toBeFocused();
});

test('1.10 reduced_motion_respected', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');

  const addOpener = page.getByRole('button', { name: 'Add criterion', exact: true }).first();
  await addOpener.click();

  const addDialog = page.locator('.criterion-form').first();
  await expect(addDialog).toBeVisible();

  const transition = await addDialog.evaluate(el => window.getComputedStyle(el).transitionDuration);
  expect(parseFloat(transition)).toBeLessThanOrEqual(0.001);

  await page.fill('#criterion-id', 'test-rm');
  await page.fill('#criterion-name', 'Test RM');
  await page.fill('#criterion-description', 'Test RM Desc');

  const submit = page.getByRole('button', { name: 'Add criterion', exact: true }).nth(1);
  await submit.click();

  const newRow = page.getByRole('button', { name: /test-rm/ });
  await expect(newRow.first()).toBeVisible();
});

test('1.8 text_and_controls_have_contrast', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');

  const getLuminance = (r, g, b) => {
      const a = [r, g, b].map(v => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };

  const getContrast = (rgb1, rgb2) => {
      const l1 = getLuminance(...rgb1);
      const l2 = getLuminance(...rgb2);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };

  const parseRGB = (str) => {
      const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return m ? [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])] : [255, 255, 255];
  };

  const header = page.locator('.p-accordionheader').first();
  const colorStr = await header.evaluate(el => window.getComputedStyle(el).color);
  const bgColorStr = await header.evaluate(el => window.getComputedStyle(el).backgroundColor);

  const fg = parseRGB(colorStr);
  const bg = parseRGB(bgColorStr !== 'rgba(0, 0, 0, 0)' ? bgColorStr : 'rgb(255, 255, 255)');

  const ratio = getContrast(fg, bg);
  expect(ratio).toBeGreaterThan(4.5);
});

test('1.4 load_bearing_accent_on_heavy_weights', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');

  const heavyRow = page.locator('.criterion-panel.load-bearing').first();
  await expect(heavyRow).toBeVisible();

  const lightRow = page.locator('.criterion-panel:not(.load-bearing)').first();
  await expect(lightRow).toBeVisible();

  const addOpener = page.getByRole('button', { name: 'Add criterion', exact: true }).first();
  await addOpener.click();

  await page.fill('#criterion-id', 'test-heavy');
  await page.fill('#criterion-name', 'Test Heavy');
  await page.fill('#criterion-description', 'Test Heavy Desc');

  await page.fill('#criterion-weight', '3.5');
  await page.evaluate(() => {
    const input = document.getElementById('criterion-weight');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.blur();
  });

  const submit = page.getByRole('button', { name: 'Add criterion', exact: true }).nth(1);
  await submit.click();

  const newRow = page.locator('.criterion-panel', { hasText: 'test-heavy' }).first();
  await expect(newRow).toBeVisible();

  const classStr = await newRow.evaluate(node => node.className);
  expect(classStr).toMatch(/load-bearing/);
});
