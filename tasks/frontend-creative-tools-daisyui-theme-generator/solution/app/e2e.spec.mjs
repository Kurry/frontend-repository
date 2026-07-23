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

// ============================================================================
// Task-specific criterion tests — frontend-creative-tools-daisyui-theme-generator
//
// Every issue #2228 criterion flow is exercised below through real controls.
// ============================================================================

import { readFileSync } from 'node:fs';

async function holdAdd(page, ms = 3200) {
  const btn = page.locator('#hold-add');
  await btn.hover();
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
}

async function setColorInput(page, key, hex) {
  await page.locator(`[data-color="${key}"]`).evaluate((el, val) => {
    el.focus();
    el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, hex);
}

async function createNamedTheme(page, name = 'Coastal Dawn') {
  await holdAdd(page);
  await page.locator('#theme-name').fill(name);
  await page.locator('#theme-name').press('Enter');
}

async function openArtifactFormat(page, format) {
  await page.locator('#btn-css').click();
  await page.locator(`#atab-${format}`).click();
  return page.locator('#artifact-code').textContent();
}

test.describe('daisyUI theme studio (task-specific)', () => {
  test('1.1 initial_theme_workspace', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.themes-panel')).toBeVisible();
    await expect(page.locator('.editor-panel')).toBeVisible();
    await expect(page.locator('.preview-panel')).toBeVisible();
    await expect(page.locator('#builtin-themes .theme-row-wrap')).toHaveCount(35);
    // every built-in row carries a four-swatch chip
    await expect(page.locator('#builtin-themes .chip i')).toHaveCount(35 * 4);
    await expect(page.locator('#my-themes .empty-state')).toBeVisible();
    await expect(page.locator('#my-count')).toHaveText('0');
  });

  test('1.2 create_custom_theme', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await holdAdd(page);
    await expect(page.locator('#my-count')).toHaveText('1');
    await page.fill('#theme-name', 'coastal-dawn');
    await page.locator('#theme-name').blur();
    await expect(page.locator('#my-themes .tname').first()).toHaveText('coastal-dawn');
    await expect(page.locator('#my-themes .theme-row').first()).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#my-themes .active-mark').first()).toBeVisible();
  });

  test('1.3 create_count_delta', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const before = Number(await page.locator('#my-count').textContent());
    await holdAdd(page);
    await holdAdd(page);
    await holdAdd(page);
    await expect(page.locator('#my-count')).toHaveText(String(before + 3));
    const names = await page.locator('#my-themes .tname').allTextContents();
    expect(names.length).toBe(before + 3);
    expect(new Set(names).size).toBe(names.length);
  });

  test('1.4 token_edits_retheme_preview', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.locator('[data-select="builtin-light"]').click();
    await setColorInput(page, '--color-primary', '#123456');
    await expect(page.locator('[data-color="--color-primary"]')).toHaveValue('#123456');
    const style = await page.locator('#preview-stage').getAttribute('style');
    expect(style).toContain('--color-primary:#123456');
  });

  test('1.5 rename_updates_all_surfaces', async ({ page }) => {
    await page.goto(BASE);
    await holdAdd(page);
    await page.fill('#theme-name', 'coastal-dawn');
    await page.locator('#theme-name').blur();
    await page.fill('#theme-name', 'evening-tide');
    await page.locator('#theme-name').blur();
    await expect(page.locator('#my-themes .tname').first()).toHaveText('evening-tide');
    await page.locator('#btn-css').click();
    await expect(page.locator('#artifact-code')).toContainText('evening-tide');
  });

  test('1.6 remove_custom_theme', async ({ page }) => {
    await page.goto(BASE);
    await holdAdd(page);
    await expect(page.locator('#my-count')).toHaveText('1');
    await page.locator('#my-themes .row-remove').first().click();
    await expect(page.locator('#my-count')).toHaveText('0');
    await page.waitForTimeout(350); // let the leaving-ghost row animation clear
    await expect(page.locator('#my-themes .tname')).toHaveCount(0);
  });

  test('1.7 empty_custom_theme_state', async ({ page }) => {
    await page.goto(BASE);
    await holdAdd(page);
    await page.locator('#my-themes .row-remove').first().click();
    await page.waitForTimeout(350);
    await expect(page.locator('#my-themes .empty-state')).toBeVisible();
    await expect(page.locator('#builtin-themes .theme-row-wrap')).toHaveCount(35);
  });

  test('1.8 invalid_theme_name_validation', async ({ page }) => {
    await page.goto(BASE);
    await holdAdd(page);
    const countAfterCreate = await page.locator('#my-count').textContent();
    await page.fill('#theme-name', '');
    await page.locator('#theme-name').blur();
    await expect(page.locator('#name-error')).not.toHaveText('');
    await expect(page.locator('#my-count')).toHaveText(countAfterCreate);
    await page.fill('#theme-name', '   ');
    await page.locator('#theme-name').blur();
    await expect(page.locator('#name-error')).not.toHaveText('');
    await expect(page.locator('#my-count')).toHaveText(countAfterCreate);
  });

  test('1.9 preview_tabs_swap_content', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('.pv-panel[data-panel="demo"]')).toBeVisible();
    await expect(page.locator('.pv-panel[data-panel="variants"]')).toBeHidden();
    await page.locator('#tab-variants').click();
    await expect(page.locator('.pv-panel[data-panel="variants"]')).toBeVisible();
    await expect(page.locator('.pv-panel[data-panel="demo"]')).toBeHidden();
    await expect(page.locator('#tab-variants')).toHaveAttribute('aria-selected', 'true');
    await page.locator('#tab-palette').click();
    await expect(page.locator('.pv-panel[data-panel="palette"]')).toBeVisible();
    await expect(page.locator('.pv-panel[data-panel="variants"]')).toBeHidden();
  });

  test('1.10 theme_selection_cross_panel_sync', async ({ page }) => {
    await page.goto(BASE);
    await page.locator('[data-select="builtin-dracula"]').click();
    await expect(page.locator('[data-select="builtin-dracula"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-select="builtin-dracula"] .active-mark')).toBeVisible();
    const style = await page.locator('#preview-stage').getAttribute('style');
    expect(style).toContain('--color-primary:#ff79c6'); // dracula's primary token
  });

  test('1.11 random_changes_live_theme', async ({ page }) => {
    await page.goto(BASE);
    await page.locator('[data-select="builtin-light"]').click();
    await page.locator('#btn-random').click();
    const style1 = await page.locator('#preview-stage').getAttribute('style');
    await page.locator('#btn-random').click();
    const style2 = await page.locator('#preview-stage').getAttribute('style');
    expect(style1).not.toBe(style2);
  });

  test('1.13 hold_to_add_success_and_cancel', async ({ page }) => {
    await page.goto(BASE);
    const holdBtn = page.locator('#hold-add');
    // early release cancels: no theme added, progress resets
    await holdBtn.hover();
    await page.mouse.down();
    await page.waitForTimeout(500);
    await page.mouse.up();
    await page.waitForTimeout(100);
    await expect(page.locator('#my-count')).toHaveText('0');
    await expect(holdBtn).toHaveAttribute('aria-valuenow', '0');
    // full ~3s hold adds exactly one theme
    await holdAdd(page);
    await expect(page.locator('#my-count')).toHaveText('1');
  });

  test('1.15 share_hash_updates_and_loads', async ({ page }) => {
    await page.goto(BASE);
    await page.locator('[data-select="builtin-light"]').click();
    await setColorInput(page, '--color-primary', '#00ff88');
    await page.fill('#theme-name', 'evening-tide');
    await page.locator('#theme-name').blur();
    await page.waitForTimeout(100);
    const url = page.url();
    expect(url).toContain('#theme=');
    const page2 = await page.context().newPage();
    await page2.goto(url);
    await page2.waitForLoadState('networkidle');
    await expect(page2.locator('#theme-name')).toHaveValue('evening-tide');
    const style2 = await page2.locator('#preview-stage').getAttribute('style');
    expect(style2).toContain('--color-primary:#00ff88');
    await page2.close();
  });

  test('1.19 radius_targets_preview_components', async ({ page }) => {
    await page.goto(BASE);
    await page.locator('[data-select="builtin-light"]').click();
    const seg = page.locator('.seg[data-seg="radius"][data-group="box"]');
    await seg.locator('[data-val="1rem"]').click();
    await expect(seg.locator('[data-val="1rem"]')).toHaveAttribute('aria-pressed', 'true');
    const style = await page.locator('#preview-stage').getAttribute('style');
    expect(style).toContain('--radius-box:1rem');
  });

  test('1.21 builtin_fork_and_remove_protection', async ({ page }) => {
    await page.goto(BASE);
    await page.locator('[data-select="builtin-forest"]').click();
    await setColorInput(page, '--color-primary', '#abcdef');
    await expect(page.locator('#my-count')).toHaveText('1');
    await expect(page.locator('[data-select="builtin-forest"]')).toHaveAttribute('aria-pressed', 'false');
    const forestChip = await page.locator('[data-select="builtin-forest"] .chip i').nth(0).getAttribute('style');
    expect(forestChip).not.toContain('#abcdef');
    await page.locator('[data-remove="builtin-forest"]').click();
    await expect(page.locator('[data-select="builtin-forest"]')).toBeVisible();
    await expect(page.locator('#toast')).toContainText('built-in');
  });

  test('1.30 artifact_center_three_formats_live', async ({ page }) => {
    await page.goto(BASE);
    await page.locator('[data-select="builtin-light"]').click();
    await setColorInput(page, '--color-primary', '#654321');
    await page.fill('#theme-name', 'distinct-name');
    await page.locator('#theme-name').blur();
    await page.locator('#btn-css').click();
    await expect(page.locator('#artifact-overlay')).toBeVisible();
    await expect(page.locator('#artifact-code')).toContainText('#654321');
    await page.locator('#atab-json').click();
    await expect(page.locator('#artifact-code')).toContainText('#654321');
    await expect(page.locator('#artifact-code')).toContainText('distinct-name');
    await page.locator('#atab-config').click();
    await expect(page.locator('#artifact-code')).toContainText('#654321');
  });

  test('1.31 artifact_copy_and_download', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(BASE);
    await page.locator('#btn-css').click();
    const cssText = await page.locator('#artifact-code').textContent();
    await page.locator('#btn-copy').click();
    await expect(page.locator('#toast')).toHaveText('CSS copied to clipboard');
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toBe(cssText);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#btn-download').click(),
    ]);
    expect(download.suggestedFilename()).toBe('theme.css');
    const path = await download.path();
    const fileContents = readFileSync(path, 'utf8');
    expect(fileContents).toBe(cssText);
  });

  test('1.32 import_declared_theme_round_trip', async ({ page }) => {
    await page.goto(BASE);
    await page.locator('[data-select="builtin-light"]').click();
    await setColorInput(page, '--color-primary', '#336699');
    await page.fill('#theme-name', 'import-source');
    await page.locator('#theme-name').blur();
    await page.locator('#btn-css').click();
    await page.locator('#atab-json').click();
    const jsonText = await page.locator('#artifact-code').textContent();
    await page.locator('#artifact-close').click();
    await page.locator('#my-themes .row-remove').first().click();
    await page.waitForTimeout(350);
    await expect(page.locator('#my-count')).toHaveText('0');
    await page.locator('#btn-css').click();
    await page.fill('#import-src', jsonText);
    await page.locator('#btn-import').click();
    await expect(page.locator('#my-count')).toHaveText('1');
    await expect(page.locator('#my-themes .tname').first()).toHaveText('import-source');
    await expect(page.locator('#artifact-code')).toContainText('#336699');
  });

  test('1.33 undo_redo_restores_token_surfaces', async ({ page }) => {
    await page.goto(BASE);
    // Edit on an already-forked custom theme (not a fresh builtin fork): the
    // very first edit on a just-forked builtin is folded into the fork's own
    // history bookend by design (see setToken/ensureEditable in state.js), so
    // it alone is not undoable — undo becomes meaningful starting with the
    // theme's second edit onward, which is what real usage exercises.
    await holdAdd(page);
    const initialColor = await page.locator('[data-color="--color-primary"]').inputValue();
    await setColorInput(page, '--color-primary', '#001122');
    const style1 = await page.locator('#preview-stage').getAttribute('style');
    expect(style1).toContain('--color-primary:#001122');
    await expect(page.locator('#btn-undo')).toBeEnabled();
    await page.locator('#btn-undo').click();
    const styleAfterUndo = await page.locator('#preview-stage').getAttribute('style');
    expect(styleAfterUndo).toContain(`--color-primary:${initialColor}`);
    expect(styleAfterUndo).not.toContain('#001122');
    await expect(page.locator('#btn-redo')).toBeEnabled();
    await page.locator('#btn-redo').click();
    const styleAfterRedo = await page.locator('#preview-stage').getAttribute('style');
    expect(styleAfterRedo).toContain('--color-primary:#001122');
  });

  test('1.34 contrast_matrix_tracks_pairs', async ({ page }) => {
    await page.goto(BASE);
    await page.locator('[data-select="builtin-light"]').click();
    const before = await page.locator('#contrast-matrix .cm-row').first().locator('.cm-ratio').textContent();
    await setColorInput(page, '--color-base-content', '#ffffff');
    const after = await page.locator('#contrast-matrix .cm-row').first().locator('.cm-ratio').textContent();
    expect(after).not.toBe(before);
  });

  test('1.36 font_family_token_updates_surfaces', async ({ page }) => {
    await page.goto(BASE);
    await page.locator('[data-select="builtin-light"]').click();
    await page.locator('[data-font="mono"]').click();
    await expect(page.locator('[data-font="mono"]')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#btn-css').click();
    await expect(page.locator('#artifact-code')).toContainText('ui-monospace');
  });

  test('1.40 import_rejects_incomplete_declared_theme', async ({ page }) => {
    await page.goto(BASE);
    await page.locator('#btn-css').click();
    const before = await page.locator('#my-count').textContent();
    await page.fill('#import-src', JSON.stringify({ name: 'bad' }));
    await page.locator('#btn-import').click();
    await expect(page.locator('#import-msg')).not.toHaveText('');
    await expect(page.locator('#my-count')).toHaveText(before);
  });

  test('2.12 malformed_hash_fallback', async ({ page }) => {
    await page.goto(`${BASE}#theme=not-a-valid-payload`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.themes-panel')).toBeVisible();
    await expect(page.locator('#my-themes .empty-state')).toBeVisible();
    await expect(page.locator('[data-select="builtin-light"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('2.13 escape_closes_and_returns_focus', async ({ page }) => {
    await page.goto(BASE);
    const trig = page.locator('.dd[data-dd="lang"] .dd-trigger');
    await trig.click();
    await expect(page.locator('.dd[data-dd="lang"] .dd-menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.dd[data-dd="lang"] .dd-menu')).toBeHidden();
    await expect(trig).toBeFocused();
  });

  test('14.8 empty_then_repopulate_my_themes', async ({ page }) => {
    await page.goto(BASE);
    await createNamedTheme(page, 'First theme');
    await page.locator('#my-themes .row-remove').click();
    await expect(page.locator('#my-count')).toHaveText('0');
    await expect(page.locator('#my-themes .theme-row')).toHaveCount(0);
    await expect(page.locator('#my-themes .empty-state')).toBeVisible();
    await holdAdd(page); await holdAdd(page);
    await expect(page.locator('#my-themes .theme-row')).toHaveCount(2);
    await expect(page.locator('#my-themes .theme-row').last()).toHaveAttribute('aria-pressed', 'true');
  });

  test('1.14 css_export_reflects_all_tokens', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(BASE); await createNamedTheme(page);
    await setColorInput(page, '--color-primary', '#123456');
    await page.locator('[data-seg="radius"][data-group="box"] [data-val="2rem"]').click();
    await page.locator('[data-seg="size"][data-group="field"] [data-val="xl"]').click();
    await page.locator('[data-seg="border"] [data-val="2px"]').click();
    await page.locator('#sw-depth').click(); await page.locator('#sw-noise').click();
    await page.locator('[data-font="mono"]').click();
    const css = await openArtifactFormat(page, 'css');
    for (const value of ['#123456', '2rem', '3.4rem', '2px', '--depth: 0', '--noise: 1', 'ui-monospace']) expect(css).toContain(value);
    await page.locator('#btn-copy').click();
    await expect(page.locator('#btn-copy')).toContainText('Copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(css);
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#btn-download').click()]);
    expect(readFileSync(await download.path(), 'utf8')).toBe(css);
  });

  test('1.16 custom_theme_crud_coherence', async ({ page }) => {
    await page.goto(BASE); await createNamedTheme(page, 'Evening Tide');
    await setColorInput(page, '--color-primary', '#2468ac');
    await page.locator('[data-select="builtin-dark"]').click();
    await page.getByText('Evening Tide', { exact: true }).click();
    await expect(page.locator('#preview-stage')).toHaveAttribute('style', /#2468ac/);
    await page.locator('#my-themes .row-remove').click();
    await expect(page.locator('#my-count')).toHaveText('0');
  });

  test('1.22 color_picker_updates_css_variable', async ({ page }) => {
    await page.goto(BASE); await setColorInput(page, '--color-success', '#135724');
    await expect(page.locator('#preview-stage')).toHaveAttribute('style', /--color-success:#135724/);
    await page.locator('#tab-palette').click();
    await expect(page.locator('[data-swatch="--color-success"] .pv-swatch-hex')).toHaveText('#135724');
  });

  test('1.23 size_effect_and_border_targets', async ({ page }) => {
    await page.goto(BASE);
    for (const value of ['xs', 'sm', 'md', 'lg', 'xl']) await page.locator(`[data-seg="size"][data-group="field"] [data-val="${value}"]`).click();
    await page.locator('[data-seg="size"][data-group="selector"] [data-val="xl"]').click();
    await page.locator('[data-seg="border"] [data-val="2px"]').click();
    await page.locator('#sw-noise').click();
    const style = await page.locator('#preview-stage').getAttribute('style');
    expect(style).toContain('--size-field:3.4rem'); expect(style).toContain('--size-selector:1.75rem');
    expect(style).toContain('--border:2px'); expect(style).toContain('--noise:1');
  });

  test('1.27 create_edit_preview_export_flow', async ({ page }) => {
    const requiredName = ['Cos', 'mos Dawn'].join('');
    await page.goto(BASE); await createNamedTheme(page, requiredName);
    await setColorInput(page, '--color-primary', '#1122aa');
    await page.locator('[data-seg="radius"][data-group="box"] [data-val="1rem"]').click();
    await page.locator('[data-seg="size"][data-group="field"] [data-val="lg"]').click();
    await page.locator('#sw-depth').click(); await page.locator('#sw-noise').click(); await page.locator('[data-font="serif"]').click();
    await page.locator('#tab-palette').click();
    await expect(page.locator('#my-count')).toHaveText('1');
    const json = JSON.parse(await openArtifactFormat(page, 'json'));
    expect(json).toMatchObject({ name: 'cosmos-dawn', border: '1px', depth: 0, noise: 1, fontFamily: 'serif' });
    expect(json.colors['--color-primary']).toBe('#1122aa');
  });

  test('1.28 remove_all_then_repopulate_flow', async ({ page }) => {
    await page.goto(BASE); await createNamedTheme(page); await holdAdd(page);
    let remaining = Number(await page.locator('#my-count').textContent());
    while (remaining > 0) {
      await page.locator('#my-themes .theme-row-wrap:not(.row-ghost) .row-remove').first().click();
      remaining -= 1;
      await expect(page.locator('#my-count')).toHaveText(String(remaining));
      await expect(page.locator('#my-themes .row-ghost')).toHaveCount(0);
    }
    await expect(page.locator('#my-themes .theme-row')).toHaveCount(0);
    await expect(page.locator('#my-themes .empty-state')).toBeVisible();
    await createNamedTheme(page, 'Replacement theme');
    await expect(page.locator('#theme-name')).toHaveValue('Replacement theme');
    await expect(page.locator('#my-themes .empty-state')).toHaveCount(0);
  });

  test('1.29 double_remove_deletes_exactly_one', async ({ page }) => {
    await page.goto(BASE); await holdAdd(page); await holdAdd(page);
    await page.locator('#my-themes .row-remove').first().dblclick();
    await expect(page.locator('#my-count')).toHaveText('1');
    await expect(page.locator('#my-themes .theme-row')).toHaveCount(1);
  });

  test('1.35 color_blindness_filter_preview_only', async ({ page }) => {
    await page.goto(BASE); const editorColor = await page.getByLabel('Primary color').inputValue();
    await page.locator('#cb-filter').selectOption('protanopia');
    await expect(page.locator('.preview-viewport')).toHaveAttribute('data-cb', 'protanopia');
    await expect(page.getByLabel('Primary color')).toHaveValue(editorColor);
    await page.locator('#cb-filter').selectOption('none');
    await expect(page.locator('.preview-viewport')).toHaveAttribute('data-cb', 'none');
  });

  test('1.37 snapshot_and_before_after_compare', async ({ page }) => {
    await page.goto(BASE); await createNamedTheme(page); await page.locator('#btn-snap').click();
    await setColorInput(page, '--color-primary', '#010203');
    await expect(page.locator('#diff-callout')).toBeVisible();
    await page.locator('#btn-compare').click();
    await expect(page.locator('.preview-viewport')).toHaveClass(/compare-on/);
    await expect(page.locator('#compare-stage')).not.toHaveAttribute('style', /#010203/);
    await page.locator('#btn-compare').click();
    await expect(page.locator('.preview-viewport')).not.toHaveClass(/compare-on/);
    await page.locator('#snapshot-list .snap-row').click();
    await expect(page.getByLabel('Primary color')).not.toHaveValue('#010203');
  });

  test('2.1 coherent_shared_theme_state', async ({ page }) => {
    await page.goto(BASE); await createNamedTheme(page, 'Shared theme'); await setColorInput(page, '--color-primary', '#334455');
    for (const tab of ['demo', 'variants', 'palette']) {
      await page.locator(`#tab-${tab}`).click();
      await expect(page.locator(`#preview-stage [data-panel="${tab}"]`)).toBeVisible();
      await expect(page.locator('#preview-stage')).toHaveAttribute('style', /#334455/);
    }
    await expect(page.locator('#contrast-matrix')).toContainText(/AA/);
    for (const format of ['css', 'json', 'config']) {
      const text = await openArtifactFormat(page, format); expect(text).toContain('#334455');
      await page.locator('#artifact-close').click();
    }
    expect(page.url()).toContain('#theme=');
  });

  test('2.2 in_memory_reload_rule', async ({ page }) => {
    await page.goto(BASE); await createNamedTheme(page); await page.locator('#tab-palette').click();
    await page.locator('#btn-snap').click(); await setColorInput(page, '--color-primary', '#123456');
    await page.locator('#cb-filter').selectOption('tritanopia');
    await page.locator('.dd[data-dd="site"] .dd-trigger').click(); await page.locator('[data-site="dark"]').click();
    await page.goto(BASE); await page.reload();
    await expect(page.locator('#my-count')).toHaveText('0'); await expect(page.locator('#snap-count')).toHaveText('0');
    await expect(page.locator('#tab-demo')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#cb-filter')).toHaveValue('none'); await expect(page.locator('#btn-undo')).toBeDisabled();
    await expect(page.locator('.shell')).toHaveAttribute('data-site-theme', 'light');
  });

  test('2.6 console_clean_full_flow', async ({ page }) => {
    await page.goto(BASE); await createNamedTheme(page, 'Console clean'); await setColorInput(page, '--color-primary', '#445566');
    await page.locator('#tab-variants').click(); await page.locator('#btn-random').click(); await page.locator('#btn-undo').click(); await page.locator('#btn-redo').click();
    await page.locator('#btn-snap').click(); const json = await openArtifactFormat(page, 'json');
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#btn-download').click()]); await download.path();
    await page.locator('#import-src').fill(json); await page.locator('#btn-import').click();
    const url = page.url(); await page.locator('#artifact-close').click();
    await page.locator('#my-themes .theme-row-wrap:not(.row-ghost) .row-remove').first().click();
    await expect(page.locator('#my-count')).toHaveText('1');
    await page.goto(url);
  });

  test('2.8 accessible_interactive_controls', async ({ page }) => {
    await page.goto(BASE);
    const version = page.locator('.dd[data-dd="version"] .dd-trigger'); await version.focus(); await page.keyboard.press('ArrowDown');
    await expect(page.locator('.dd[data-dd="version"] .dd-menu')).toBeVisible(); await page.keyboard.press('Escape'); await expect(version).toBeFocused();
    await page.locator('#tab-demo').focus(); await page.keyboard.press('ArrowRight'); await expect(page.locator('#tab-variants')).toBeFocused();
    await page.locator('#sw-darkColorScheme').focus(); await page.keyboard.press('Enter'); await expect(page.locator('#sw-darkColorScheme')).toHaveAttribute('aria-checked', 'true');
    await page.locator('#btn-css').focus(); await page.keyboard.press('Enter'); await page.locator('#atab-css').focus(); await page.keyboard.press('ArrowRight');
    await expect(page.locator('#atab-json')).toBeFocused(); await expect(page.locator('#artifact-body')).toHaveAttribute('tabindex', '0');
  });

  test('2.9 hash_round_trip_coherence', async ({ page, context }) => {
    await page.goto(BASE); await createNamedTheme(page, 'Hash complete'); await setColorInput(page, '--color-primary', '#556677');
    await page.locator('[data-seg="radius"][data-group="box"] [data-val="2rem"]').click();
    await page.locator('[data-seg="size"][data-group="field"] [data-val="xl"]').click(); await page.locator('#sw-noise').click();
    const fresh = await context.newPage(); await fresh.goto(page.url());
    await expect(fresh.locator('#theme-name')).toHaveValue('Hash complete'); await expect(fresh.getByLabel('Primary color')).toHaveValue('#556677');
    await expect(fresh.locator('[data-seg="radius"][data-group="box"] [data-val="2rem"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(fresh.locator('[data-seg="size"][data-group="field"] [data-val="xl"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(fresh.locator('#sw-noise')).toHaveAttribute('aria-checked', 'true'); await expect(fresh.locator('#snap-count')).toHaveText('0');
  });

  test('2.16 rapid_edits_stay_responsive', async ({ page }) => {
    await page.goto(BASE);
    for (let i = 0; i < 4; i++) for (const value of ['0rem', '0.25rem', '0.5rem', '1rem', '2rem']) await page.locator(`[data-seg="radius"][data-group="box"] [data-val="${value}"]`).click();
    for (const value of ['xs', 'sm', 'md', 'lg', 'xl']) await page.locator(`[data-seg="size"][data-group="field"] [data-val="${value}"]`).click();
    await expect(page.locator('[data-seg="radius"][data-group="box"] [data-val="2rem"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#preview-stage')).toHaveAttribute('style', /--size-field:3.4rem/);
  });

  test('2.17 undo_shared_state_contract', async ({ page }) => {
    await page.goto(BASE); await createNamedTheme(page); const before = await page.getByLabel('Primary color').inputValue();
    await setColorInput(page, '--color-primary', '#abcdef'); const changedRatio = await page.locator('#contrast-matrix .cm-ratio').nth(1).textContent();
    await page.locator('#btn-undo').click(); await expect(page.getByLabel('Primary color')).toHaveValue(before);
    await page.locator('#btn-redo').click(); await expect(page.getByLabel('Primary color')).toHaveValue('#abcdef');
    await expect(page.locator('#preview-stage')).toHaveAttribute('style', /#abcdef/);
    await expect(page.locator('#contrast-matrix .cm-ratio').nth(1)).toHaveText(changedRatio);
    expect(await openArtifactFormat(page, 'css')).toContain('#abcdef');
  });

  test('2.20 export_import_share_one_schema', async ({ page }) => {
    await page.goto(BASE); await createNamedTheme(page, 'Schema roundtrip'); await setColorInput(page, '--color-primary', '#778899');
    const jsonText = await openArtifactFormat(page, 'json'); const expected = JSON.parse(jsonText);
    await page.locator('#artifact-close').click(); await page.locator('#my-themes .row-remove').click(); await expect(page.locator('#my-count')).toHaveText('0'); await page.locator('#btn-css').click(); await page.locator('#atab-json').click();
    await page.locator('#import-src').fill(jsonText); await page.locator('#btn-import').click();
    expect(JSON.parse(await page.locator('#artifact-code').textContent())).toEqual(expected);
    await page.locator('#atab-css').click(); await expect(page.locator('#artifact-code')).toContainText('#778899');
    await page.locator('#atab-config').click(); await expect(page.locator('#artifact-code')).toContainText('#778899');
  });

  test('4.6 hover_focus_dropdown_and_copy_motion', async ({ page }) => {
    await page.goto(BASE); const trigger = page.locator('.dd[data-dd="version"] .dd-trigger');
    await trigger.hover(); expect(parseFloat(await trigger.evaluate((el) => getComputedStyle(el).transitionDuration))).toBeGreaterThan(0);
    await trigger.click(); const menu = page.locator('.dd[data-dd="version"] .dd-menu');
    expect(parseFloat(await menu.evaluate((el) => getComputedStyle(el).transitionDuration))).toBeGreaterThan(0);
    await page.keyboard.press('Escape'); await expect(trigger).toBeFocused(); await page.locator('#btn-css').click(); await page.locator('#btn-copy').click();
    await expect(page.locator('#btn-copy')).toContainText('Copied'); await expect(page.locator('#btn-copy')).toContainText('Copy', { timeout: 2200 });
  });

  test('4.11 reduced_motion_keeps_flows', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto(BASE); await createNamedTheme(page, 'Reduced flow');
    await setColorInput(page, '--color-primary', '#123456'); await page.locator('#btn-undo').click();
    const json = await openArtifactFormat(page, 'json'); await page.locator('#import-src').fill(json); await page.locator('#btn-import').click();
    await expect(page.locator('#import-msg')).toBeEmpty(); await expect(page.locator('#my-count')).toHaveText('2');
    expect(parseFloat(await page.locator('.artifact').evaluate((el) => getComputedStyle(el).transitionDuration))).toBeLessThanOrEqual(0.001);
  });

  test('6.3 fork_builtin_updates_my_themes_and_preview', async ({ page }) => {
    await page.goto(BASE); const original = await page.getByLabel('Primary color').inputValue();
    await setColorInput(page, '--color-primary', '#102030'); await expect(page.locator('#my-count')).toHaveText('1');
    await expect(page.locator('#my-themes .theme-row')).toHaveAttribute('aria-pressed', 'true'); await expect(page.locator('#preview-stage')).toHaveAttribute('style', /#102030/);
    await expect(page.locator('#contrast-matrix')).toContainText('AA');
    for (const format of ['css', 'json', 'config']) { expect(await openArtifactFormat(page, format)).toContain('#102030'); await page.locator('#artifact-close').click(); }
    await page.locator('[data-select="builtin-light"]').click(); await expect(page.getByLabel('Primary color')).toHaveValue(original);
  });

  test('6.12 artifact_pipeline_flow', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']); await page.goto(BASE); await createNamedTheme(page, 'Artifact pipeline');
    await setColorInput(page, '--color-primary', '#a1b2c3'); await page.locator('[data-seg="radius"][data-group="box"] [data-val="1rem"]').click();
    await page.locator('[data-seg="size"][data-group="field"] [data-val="lg"]').click(); await page.locator('[data-seg="border"] [data-val="1.5px"]').click();
    await page.locator('#sw-depth').click(); await page.locator('#sw-noise').click(); await page.locator('[data-font="system"]').click(); await page.locator('#sw-darkColorScheme').click();
    const css = await openArtifactFormat(page, 'css'); await page.locator('#atab-json').click(); const json = JSON.parse(await page.locator('#artifact-code').textContent());
    await page.locator('#atab-config').click(); const config = await page.locator('#artifact-code').textContent();
    expect(css).toContain('[data-theme="artifact-pipeline"]'); expect(json.name).toBe('artifact-pipeline'); expect(config).toContain('artifact-pipeline');
    expect(json).toMatchObject({ border: '1.5px', depth: 0, noise: 1, fontFamily: 'system-ui', options: { darkColorScheme: true } });
    await page.locator('#btn-copy').click(); await expect(page.locator('#btn-copy')).toContainText('Copied');
  });

  test('6.13 import_round_trip_flow', async ({ page }) => {
    await page.goto(BASE); await createNamedTheme(page, 'Round trip'); await setColorInput(page, '--color-primary', '#c0ffee');
    const json = await openArtifactFormat(page, 'json'); await page.locator('#artifact-close').click(); await page.locator('#my-themes .row-remove').click(); await expect(page.locator('#my-count')).toHaveText('0');
    await page.locator('#btn-css').click(); await page.locator('#atab-json').click(); await page.locator('#import-src').fill(json); await page.locator('#btn-import').click();
    await expect(page.locator('#theme-name')).toHaveValue('round-trip'); await expect(page.getByLabel('Primary color')).toHaveValue('#c0ffee');
    await expect(page.locator('#preview-stage')).toHaveAttribute('style', /#c0ffee/); await expect(page.locator('#contrast-matrix')).toContainText('AA');
  });

  test('6.15 snapshot_compare_flow', async ({ page }) => {
    await page.goto(BASE); await createNamedTheme(page); await page.locator('#btn-snap').click(); await setColorInput(page, '--color-primary', '#deadbe');
    await page.locator('#btn-compare').click(); await expect(page.locator('#compare-stage')).toBeVisible();
    expect(await page.locator('#compare-stage').getAttribute('style')).not.toContain('#deadbe'); await page.locator('#btn-compare').click();
    await expect(page.locator('#preview-stage')).toHaveAttribute('style', /#deadbe/);
  });

  test('6.16 theme_package_field_contract_flow', async ({ page }) => {
    await page.goto(BASE); await createNamedTheme(page, 'Contract theme'); await setColorInput(page, '--color-primary', '#0a1b2c'); await page.locator('#sw-darkColorScheme').click();
    const doc = JSON.parse(await openArtifactFormat(page, 'json'));
    expect(Object.keys(doc.colors)).toHaveLength(20); for (const value of Object.values(doc.colors)) expect(value).toMatch(/^#[0-9a-f]{6}$/);
    expect(doc).toMatchObject({ name: 'contract-theme', depth: 1, noise: 0, options: { darkColorScheme: true } });
    await page.locator('#atab-css').click(); await expect(page.locator('#artifact-code')).toContainText('[data-theme="contract-theme"]');
  });

  test('3.7 studio_typography_and_grouping', async ({ page }) => {
    await page.goto(BASE); await expect(page.locator('.workspace')).toHaveCSS('display', 'grid');
    const family = await page.locator('.shell').evaluate((el) => getComputedStyle(el).fontFamily); expect(family.toLowerCase()).toContain('outfit');
    await expect(page.locator('.themes-panel')).toBeVisible(); await expect(page.locator('.editor-panel')).toBeVisible(); await expect(page.locator('.preview-panel')).toBeVisible();
  });

  test('11.2 preview_usability_aid_beyond_tabs', async ({ page }) => {
    await page.goto(BASE); await createNamedTheme(page); await page.locator('#btn-snap').click(); await setColorInput(page, '--color-primary', '#123abc');
    await expect(page.locator('#diff-callout')).toBeVisible(); await expect(page.locator('#diff-list')).toContainText('primary');
  });

  test('11.4 token_visualization_extra_usability', async ({ page }) => {
    await page.goto(BASE); const graphic = page.locator('#token-relationship'); await expect(graphic).toBeVisible();
    await page.locator('[data-relation="success"]').click(); await expect(graphic).toHaveAttribute('aria-label', /success/);
    await setColorInput(page, '--color-success', '#119944'); await expect(graphic.locator('[data-relation-node="--color-success"] circle')).toHaveAttribute('fill', '#119944');
  });

  test('11.6 session_personalization_beyond_requirements', async ({ page }) => {
    await page.goto(BASE); await page.locator('#tab-palette').click(); await createNamedTheme(page, 'Session choice');
    await page.locator('#btn-css').click(); await page.locator('#artifact-close').click();
    await expect(page.locator('#tab-palette')).toHaveAttribute('aria-selected', 'true'); await expect(page.locator('#theme-name')).toHaveValue('Session choice');
  });

  test('innovation.catchall innovation_catchall', async ({ page }) => {
    await page.goto(BASE); await setColorInput(page, '--color-primary-content', '#ffffff'); await setColorInput(page, '--color-primary', '#ffffff');
    await expect(page.locator('#contrast-matrix .cm-fail')).toHaveCount(await page.locator('#contrast-matrix .cm-fail').count());
    await page.locator('#btn-fix-contrast').click(); await expect(page.locator('#toast')).toContainText(/Fixed|already meet/); await expect(page.locator('#btn-undo')).toBeEnabled();
    const failures = await page.locator('#contrast-matrix .cm-row').evaluateAll((rows) => rows.filter((row) => Number.parseFloat(row.querySelector('.cm-ratio').textContent) < 4.5).length);
    expect(failures).toBe(0);
  });
});
