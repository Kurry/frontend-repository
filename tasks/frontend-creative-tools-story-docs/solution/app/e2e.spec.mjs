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

test.describe('frontend-creative-tools-story-docs criteria', () => {
  test('1.1 seeded_scene_grid', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const cards = page.locator('article.scene-item');
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThanOrEqual(8);
    // Each card carries a scene number badge, an image, and a title.
    const first = cards.first();
    await expect(first.locator('.scene-position')).toBeVisible();
    await expect(first.locator('img')).toBeVisible();
    await expect(first.locator('h3')).not.toHaveText('');
  });

  test('1.3 count_delta_after_creates', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const before = await page.locator('article.scene-item').count();
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: 'Add Scene' }).first().click();
      await page.getByRole('button', { name: 'Start', exact: true }).click();
      await page.locator('#scene-title').fill(`E2E Scene ${i}`);
      await page.locator('#scene-body').fill(`Body text for e2e scene number ${i}, long enough to pass.`);
      await page.getByRole('button', { name: 'Review Scene' }).click();
      await page.getByRole('button', { name: 'Add Scene', exact: true }).click();
    }
    const after = await page.locator('article.scene-item').count();
    expect(after).toBe(before + 3);
  });

  test('1.4 slide_mode_single_scene', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Slide view' }).click();
    await expect(page.locator('.is-slide article.scene-item')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Previous scene' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next scene' })).toBeVisible();
  });

  test('1.5 edited_text_replaces_old', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const firstCard = page.locator('article.scene-item').first();
    await firstCard.getByRole('button', { name: 'Edit scene description' }).click();
    const textarea = firstCard.locator('textarea[aria-label="Edit scene description"]');
    await textarea.fill('Evening Cutaway description text for this scene, replaced.');
    await textarea.blur();
    await expect(page.getByText('Evening Cutaway description text for this scene, replaced.')).toBeVisible();
    await expect(page.getByText('This text is a', { exact: false })).toHaveCount(0);
  });

  test('1.6 deleted_scene_removed', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const firstCard = page.locator('article.scene-item').first();
    const title = await firstCard.locator('h3').innerText();
    await firstCard.getByRole('button', { name: /options$/ }).click();
    await page.getByRole('menuitem', { name: 'Delete Scene' }).click();
    await expect(page.getByRole('heading', { name: title })).toHaveCount(0);
  });

  test('1.7 empty_state_after_last_delete', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    let cards = page.locator('article.scene-item');
    let count = await cards.count();
    while (count > 0) {
      await cards.first().getByRole('button', { name: /options$/ }).click();
      await page.getByRole('menuitem', { name: 'Delete Scene' }).click();
      await page.waitForTimeout(350); // exit animation settle
      count = await cards.count();
    }
    await expect(page.getByRole('heading', { name: 'No Scenes Left' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Scene' })).toBeVisible();
  });

  test('1.8 invalid_create_blocked', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const before = await page.locator('article.scene-item').count();
    await page.getByRole('button', { name: 'Add Scene' }).first().click();
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    // Leave title empty, fill only body, then attempt to trigger validation.
    await page.locator('#scene-body').fill('This body is long enough to pass validation on its own.');
    await page.locator('#scene-title').focus();
    await page.locator('#scene-body').focus();
    await expect(page.locator('#scene-title-error')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Review Scene' })).toBeDisabled();
    const after = await page.locator('article.scene-item').count();
    expect(after).toBe(before);
  });

  test('1.13 sidebar_rows_and_controls', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: '1. Getting Started' })).toBeVisible();
    await expect(page.getByRole('button', { name: '2. Create Your First Storyboard' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Storyboard' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Help' })).toBeVisible();
  });

  test('1.32 slide_bounds_no_wrap', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Slide view' }).click();
    await expect(page.getByRole('button', { name: 'Previous scene' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Next scene' })).toBeEnabled();
    const next = page.getByRole('button', { name: 'Next scene' });
    let guard = 0;
    while (await next.isEnabled() && guard < 20) {
      await next.click();
      guard += 1;
    }
    await expect(next).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Previous scene' })).toBeEnabled();
  });

  test('1.38 scene_field_contract_enforced', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const before = await page.locator('article.scene-item').count();
    await page.getByRole('button', { name: 'Add Scene' }).first().click();
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.locator('#scene-title').fill('A'); // 1 char, below min of 2
    await page.locator('#scene-body').fill('short'); // below min of 8
    await page.locator('#scene-camera').focus();
    await expect(page.locator('#scene-title-error')).toContainText('Title');
    await expect(page.locator('#scene-body-error')).toContainText('Description');
    await expect(page.getByRole('button', { name: 'Review Scene' })).toBeDisabled();
    const after = await page.locator('article.scene-item').count();
    expect(after).toBe(before);
  });

  test('1.39 status_filter_and_search', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const totalBefore = await page.locator('article.scene-item').count();
    await page.locator('#status-filter').selectOption('ready');
    const readyCount = await page.locator('article.scene-item').count();
    expect(readyCount).toBeGreaterThan(0);
    expect(readyCount).toBeLessThan(totalBefore);
    for (const card of await page.locator('article.scene-item').all()) {
      await expect(card.getByText('ready', { exact: true })).toBeVisible();
    }
    await page.locator('#status-filter').selectOption('all');
    await expect(page.locator('article.scene-item')).toHaveCount(totalBefore);
    await page.locator('#search-scenes').fill('Welcome to Docs');
    await expect(page.locator('article.scene-item')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'Welcome to Docs!' })).toBeVisible();
  });

  test('1.41 undo_redo_restore_board', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const before = await page.locator('article.scene-item').count();
    await page.getByRole('button', { name: 'Add Scene' }).first().click();
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.locator('#scene-title').fill('Undo Redo Scene');
    await page.locator('#scene-body').fill('A scene created purely to exercise undo and redo behavior here.');
    await page.getByRole('button', { name: 'Review Scene' }).click();
    await page.getByRole('button', { name: 'Add Scene', exact: true }).click();
    await expect(page.locator('article.scene-item')).toHaveCount(before + 1);
    await expect(page.getByRole('heading', { name: 'Undo Redo Scene' })).toBeVisible();
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(page.locator('article.scene-item')).toHaveCount(before);
    await expect(page.getByRole('heading', { name: 'Undo Redo Scene' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Redo' }).click();
    await expect(page.locator('article.scene-item')).toHaveCount(before + 1);
    await expect(page.getByRole('heading', { name: 'Undo Redo Scene' })).toBeVisible();
  });

  test('1.42 command_palette_runs_handlers', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog', { name: 'Command palette' });
    await expect(dialog).toBeVisible();
    await page.getByRole('option', { name: /Switch to List/ }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('.scenes-grid.is-list')).toBeVisible();
  });

  test('1.45 status_badge_on_scenes', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const first = page.locator('article.scene-item').first();
    const badge = first.locator('span', { hasText: /^(draft|review|ready)$/ });
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText(/^(draft|review|ready)$/);
  });

  test('1.46 markdown_bodies_render_with_checklists', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Scene 6 ("Checklists") is seeded with a checklist body.
    const card = page.locator('article.scene-item', { has: page.getByRole('heading', { name: 'Checklists' }) });
    await expect(card).toBeVisible();
    const progress = card.locator('span[aria-label^="Checklist progress"]');
    await expect(progress).toBeVisible();
    const before = await progress.innerText();
    const checkbox = card.locator('input.scene-checkbox').first();
    const wasChecked = await checkbox.isChecked();
    await checkbox.click();
    await expect(checkbox).toBeChecked({ checked: !wasChecked });
    const after = await progress.innerText();
    expect(after).not.toBe(before);
  });

  test('2.13 alt_text_and_icon_labels', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const img = page.locator('article.scene-item img').first();
    const alt = await img.getAttribute('alt');
    expect(alt && alt.trim().length).toBeGreaterThan(0);
    await expect(page.getByRole('button', { name: 'Notifications' })).toHaveAttribute('aria-label', 'Notifications');
    await expect(page.getByRole('button', { name: 'Account' })).toHaveAttribute('aria-label', 'Account');
  });
});
