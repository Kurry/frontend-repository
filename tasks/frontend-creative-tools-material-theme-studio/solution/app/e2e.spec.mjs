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

test.describe('material-theme-studio criteria', () => {
  test('1.1 seeded_themes_visible', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: 'Saved Themes' }).click();
    await expect(page.locator('[data-theme-card]')).toHaveCount(3);
    await expect(page.getByText('Default Theme', { exact: true })).toBeVisible();
    await expect(page.getByText('Dark Starter', { exact: true })).toBeVisible();
    await expect(page.getByText('Forest', { exact: true })).toBeVisible();
  });

  test('1.2 create_named_theme_visible', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: 'Saved Themes' }).click();
    await page.locator('#btn-new-theme').click();
    await page.getByLabel('Theme name').fill('Custom Indigo');
    await page.getByRole('button', { name: 'Create Theme' }).click();
    await expect(page.getByText('Custom Indigo', { exact: true })).toBeVisible();
  });

  test('1.3 create_three_count_delta', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: 'Saved Themes' }).click();
    const cards = page.locator('[data-theme-card]');
    const initial = await cards.count();
    const dialog = page.getByRole('dialog', { name: 'New Theme' });
    for (const name of ['Delta One', 'Delta Two', 'Delta Three']) {
      await page.locator('#btn-new-theme').click();
      await expect(dialog).toBeVisible();
      const nameInput = page.getByLabel('Theme name');
      // The panel autofocuses its name field once mounted — wait for that real
      // focus transition (a keyboard user would too) before typing, otherwise
      // the field's own mount-time reset can race a same-tick fill.
      await expect(nameInput).toBeFocused();
      await nameInput.fill(name);
      await page.getByRole('button', { name: 'Create Theme' }).click();
      await expect(dialog).toBeHidden();
      await expect(page.getByText(name, { exact: true })).toBeVisible();
    }
    await expect(cards).toHaveCount(initial + 3);
  });

  test('1.5 rename_theme_updates_name', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: 'Saved Themes' }).click();
    await page.locator('[data-rename="green"]').click();
    const nameInput = page.getByLabel('Theme name');
    await nameInput.fill('');
    await nameInput.fill('Evening Paper');
    await page.getByRole('button', { name: 'Rename Theme' }).click();
    await expect(page.getByText('Evening Paper', { exact: true })).toBeVisible();
    await expect(page.getByText('Forest', { exact: true })).toHaveCount(0);
  });

  test('1.6 delete_theme_removes_name', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: 'Saved Themes' }).click();
    await page.locator('[data-delete="dark-starter"]').click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByText('Dark Starter', { exact: true })).toHaveCount(0);
  });

  test('1.7 empty_state_after_last_delete', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: 'Saved Themes' }).click();
    for (const id of ['default', 'dark-starter', 'green']) {
      await page.locator(`[data-delete="${id}"]`).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
      await expect(page.locator(`[data-theme-card="${id}"]`)).toHaveCount(0);
    }
    await expect(page.getByText('No saved themes yet', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'New Theme' }).first()).toBeVisible();
  });

  test('1.8 empty_name_create_rejected', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: 'Saved Themes' }).click();
    const cards = page.locator('[data-theme-card]');
    const initial = await cards.count();
    await page.locator('#btn-new-theme').click();
    const nameInput = page.getByLabel('Theme name');
    await nameInput.fill('x');
    await nameInput.fill('');
    await expect(page.getByRole('dialog').getByText('Theme name is required — enter a name for the theme')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Theme' })).toBeDisabled();
    await page.getByRole('button', { name: 'Create Theme' }).click({ force: true });
    await expect(cards).toHaveCount(initial);
  });

  test('1.9 light_dark_toggle_recolors', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const before = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--preview-bg').trim().toLowerCase());
    expect(before).toBe('#fafafa');
    await page.evaluate(() => { window.__noReloadMarker = true; });
    await page.getByRole('radio', { name: 'Dark' }).click();
    await expect.poll(async () =>
      (await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--preview-bg').trim().toLowerCase()))
    ).toBe('#121212');
    const marker = await page.evaluate(() => window.__noReloadMarker);
    expect(marker, 'palette type toggled without a full page navigation').toBe(true);
  });

  test('1.19 saved_theme_search_filter', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: 'Saved Themes' }).click();
    const search = page.getByLabel('Search saved themes');
    await search.fill('Forest');
    await expect(page.locator('[data-theme-card]')).toHaveCount(1);
    await expect(page.getByText('Forest', { exact: true })).toBeVisible();
    await search.fill('zzz-no-match');
    await expect(page.locator('[data-theme-card]')).toHaveCount(0);
    await expect(page.getByText('No themes match', { exact: false })).toBeVisible();
    await search.fill('');
    await expect(page.locator('[data-theme-card]')).toHaveCount(3);
  });

  test('1.25 fonts_add_remove_roboto_protected', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: 'Fonts', exact: true }).click();
    await expect(page.getByLabel('Roboto is protected from removal')).toBeVisible();
    const fontInput = page.getByLabel('Font family name');
    await fontInput.fill('Open Sans');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.locator('li', { hasText: 'Open Sans' })).toHaveCount(1);
    // Duplicate (case-insensitive) is rejected with visible feedback and no new list entry.
    await fontInput.fill('open sans');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.locator('p[role="alert"]')).toContainText('is already loaded — duplicates are not added');
    await expect(page.locator('li', { hasText: 'Open Sans' })).toHaveCount(1);
    await page.getByRole('button', { name: 'Remove Open Sans' }).click();
    await expect(page.locator('li', { hasText: 'Open Sans' })).toHaveCount(0);
  });

  test('1.32 typography_font_size_bounded', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: 'Typography', exact: true }).click();
    const fontSizeInput = page.locator('#font-size-input');
    await fontSizeInput.fill('30');
    await expect(page.locator('#font-size-error')).toContainText('typography.fontSize must be an integer from 8 through 24');
    const preSize = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--preview-font-size').trim());
    expect(preSize, 'out-of-range fontSize is not applied to the live preview').not.toBe('30px');
    await fontSizeInput.fill('18');
    await expect(page.locator('#font-size-error')).toHaveCount(0);
    await expect.poll(() =>
      page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--preview-font-size').trim())
    ).toBe('18px');

    const radiusInput = page.locator('#border-radius-input');
    await radiusInput.fill('30');
    await expect(page.locator('#border-radius-error')).toContainText('shape.borderRadius must be a number from 0 through 24');
    await radiusInput.fill('12');
    await expect(page.locator('#border-radius-error')).toHaveCount(0);
    await expect.poll(() =>
      page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--preview-radius').trim())
    ).toBe('12px');
  });

  test('1.43 wcag_contrast_readout_live', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const summary = page.getByRole('button', { name: 'primary palette row' });
    await summary.click();
    const readout = page.locator('span[title="WCAG contrast of main versus contrastText"]').first();
    await expect(readout).toContainText(/Pass AA|Pass AAA/);
    const contrastInput = page.getByLabel('primary.contrastText hex value — use ArrowUp and ArrowDown to nudge');
    // Set contrastText equal to primary main so the pair has a 1:1 ratio — a
    // real WCAG failure, not an unreachable branch.
    await contrastInput.fill('#1976D2');
    await expect(readout).toContainText('Fail');
  });

  test('1.49 theme_name_uniqueness_enforced', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: 'Saved Themes' }).click();
    const cards = page.locator('[data-theme-card]');
    const initial = await cards.count();
    await page.locator('#btn-new-theme').click();
    await page.getByLabel('Theme name').fill('Forest');
    await expect(page.getByRole('dialog').getByText('Theme name must be unique — choose a different name')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Theme' })).toBeDisabled();
    await page.getByRole('button', { name: 'Create Theme' }).click({ force: true });
    await expect(cards).toHaveCount(initial);
  });

  test('2.6 modal_dialog_semantics', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const trigger = page.locator('#btn-tutorial');
    await trigger.focus();
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Studio tour' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(350);
    await expect(page.getByRole('dialog', { name: 'Studio tour' })).toHaveCount(0);
    const isFocused = await trigger.evaluate((el) => el === document.activeElement);
    expect(isFocused, 'focus returns to the control that opened the dialog').toBe(true);
  });

  test('2.11 document_title_matches', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle('Material UI Theme Creator');
  });
});
