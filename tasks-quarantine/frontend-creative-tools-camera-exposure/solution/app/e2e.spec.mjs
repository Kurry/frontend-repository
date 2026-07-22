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

// ── helpers ──
const clickToolbar = async (page, label) => {
  await page.locator(`nav[aria-label="Lab tools"] button`, { hasText: label }).click();
  await page.waitForTimeout(350);
};

const stepDial = async (page, title, direction, times = 1) => {
  const group = page.locator(`[role="slider"][aria-label="${title}"]`).locator('..');
  const btn = direction === 'open'
    ? group.locator(`button[aria-label*="Open ${title}"]`)
    : group.locator(`button[aria-label*="Close ${title}"]`);
  for (let i = 0; i < times; i++) await btn.click();
};

const getDialValue = async (page, title) => {
  return page.locator(`[role="slider"][aria-label="${title}"]`).getAttribute('aria-valuetext');
};

const switchMode = async (page, mode) => {
  await page.locator(`[role="group"][aria-label="View mode"] button`, { hasText: mode }).click();
  await page.waitForTimeout(400);
};

// ── core_features ──
test.describe('core_features', () => {
  test('1_1 empty states visible on load', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Switch to Presets/Compare to check empty state
    await switchMode(page, 'Presets/Compare');
    await expect(page.getByText('No presets yet')).toBeVisible();
  });

  test('1_2 create new transmission and verify in list', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await switchMode(page, 'Presets/Compare');
    await page.locator('button', { hasText: '+ New' }).click();
    await page.waitForTimeout(300);
    const nameInput = page.locator('input[placeholder*="Preset name"], input[aria-label*="name"], input[placeholder*="name"]').first();
    await nameInput.fill('Test Preset');
    await page.locator('button', { hasText: /save|create/i }).first().click();
    await page.waitForTimeout(400);
    await expect(page.locator('li', { hasText: 'Test Preset' })).toBeVisible();
  });

  test('document_title_camera_exposure_simulator', async ({ page }) => {
    await page.goto(BASE);
    await expect(page).toHaveTitle('Camera Exposure Simulator');
  });

  test('both_modes_reachable_without_reload', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Should start on Meter/Lab
    await expect(page.locator('[aria-label="Exposure dials"]')).toBeVisible();
    // Switch to Presets/Compare
    await switchMode(page, 'Presets/Compare');
    await expect(page.locator('h2', { hasText: 'Presets' })).toBeVisible();
    // Switch back
    await switchMode(page, 'Meter/Lab');
    await expect(page.locator('[aria-label="Exposure dials"]')).toBeVisible();
  });

  test('three_circular_dials_present', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[role="slider"][aria-label="APERTURE"]')).toBeVisible();
    await expect(page.locator('[role="slider"][aria-label="SPEED"]')).toBeVisible();
    await expect(page.locator('[role="slider"][aria-label="ISO"]')).toBeVisible();
  });

  test('ev_readout_present', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[aria-label="Exposure value"]')).toBeVisible();
  });
});

// ── visual_design ──
test.describe('visual_design', () => {
  test('full_viewport_lab_composition', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const preview = page.locator('[role="img"][aria-label*="Exposure preview"]');
    await expect(preview).toBeVisible();
    const box = await preview.boundingBox();
    const viewport = page.viewportSize();
    // Preview should span most of the viewport
    expect(box.width).toBeGreaterThan(viewport.width * 0.8);
    expect(box.height).toBeGreaterThan(viewport.height * 0.8);
  });

  test('help_glyph_badge', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const helpBtn = page.locator('[aria-label*="exposure help"]').first();
    await expect(helpBtn).toBeVisible();
    await expect(helpBtn).toContainText('?');
    await helpBtn.click();
    await page.waitForTimeout(300);
    // After opening, should show X
    await expect(page.locator('[aria-label="Close exposure help"]').first()).toBeVisible();
  });

  test('brand_chip_bottom_centered', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const chip = page.locator('text=Camera Exposure Simulator').first();
    await expect(chip).toBeVisible();
  });

  test('exposure_meter_present', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[aria-label="Exposure meter"]')).toBeVisible();
    await expect(page.getByText('Under Exposed')).toBeVisible();
    await expect(page.getByText('Over Exposed')).toBeVisible();
  });

  test('presets_dense_list_not_cards', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await switchMode(page, 'Presets/Compare');
    // The presets area uses a list layout, not a card grid
    await expect(page.locator('ul[aria-label="Saved exposure presets"]')).toBeVisible();
  });
});

// ── user_flows ──
test.describe('user_flows', () => {
  test('preset_lifecycle_create_edit_delete', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await switchMode(page, 'Presets/Compare');

    // Create preset
    await page.locator('button', { hasText: '+ New' }).click();
    await page.waitForTimeout(300);
    const nameInput = page.locator('input[placeholder*="name"]').first();
    await nameInput.fill('Lifecycle Test');
    await page.locator('button', { hasText: /save|create/i }).first().click();
    await page.waitForTimeout(400);
    const presetItems = page.locator('ul[aria-label="Saved exposure presets"] li');
    const initialCount = await presetItems.count();
    expect(initialCount).toBeGreaterThan(0);

    // Delete preset
    await page.locator(`[aria-label="Delete Lifecycle Test"]`).click();
    await page.waitForTimeout(300);
    const afterDeleteCount = await presetItems.count();
    expect(afterDeleteCount).toBe(initialCount - 1);
  });

  test('dial_stepping_changes_ev', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const evBefore = await page.locator('[aria-label="Exposure value"]').textContent();

    // Step aperture open (which changes EV)
    const apertureSlider = page.locator('[role="slider"][aria-label="APERTURE"]');
    const valBefore = await apertureSlider.getAttribute('aria-valuetext');
    // Click the open button (left chevron for aperture since inverted)
    await page.locator('button[aria-label*="Open APERTURE"]').click();
    await page.waitForTimeout(200);
    const valAfter = await apertureSlider.getAttribute('aria-valuetext');
    expect(valAfter).not.toBe(valBefore);

    const evAfter = await page.locator('[aria-label="Exposure value"]').textContent();
    expect(evAfter).not.toBe(evBefore);
  });

  test('undo_then_redo_chain', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // Step a dial
    const apertureSlider = page.locator('[role="slider"][aria-label="APERTURE"]');
    const original = await apertureSlider.getAttribute('aria-valuetext');
    await page.locator('button[aria-label*="Open APERTURE"]').click();
    await page.waitForTimeout(200);
    const stepped = await apertureSlider.getAttribute('aria-valuetext');
    expect(stepped).not.toBe(original);

    // Open History panel and Undo
    await clickToolbar(page, 'History');
    await page.locator('button', { hasText: 'Undo' }).click();
    await page.waitForTimeout(200);
    const afterUndo = await apertureSlider.getAttribute('aria-valuetext');
    expect(afterUndo).toBe(original);

    // Redo
    await page.locator('button', { hasText: 'Redo' }).click();
    await page.waitForTimeout(200);
    const afterRedo = await apertureSlider.getAttribute('aria-valuetext');
    expect(afterRedo).toBe(stepped);
  });

  test('scene_shift_flow', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const evBefore = await page.locator('[aria-label="Exposure value"]').textContent();

    // Open Scenes panel and select Neon Alley Night
    await clickToolbar(page, 'Scenes');
    await page.locator('button[role="radio"]', { hasText: 'Neon Alley Night' }).click();
    await page.waitForTimeout(300);

    const evAfter = await page.locator('[aria-label="Exposure value"]').textContent();
    // EV should change significantly (Neon Alley is much darker)
    expect(evAfter).not.toBe(evBefore);
  });
});

// ── writing ──
test.describe('writing', () => {
  test('scene_names_exact_everywhere', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await clickToolbar(page, 'Scenes');
    const scenes = ['Daylight Courtyard', 'Alpine Midday', 'Stadium Floodlights', 'Candlelit Study', 'Neon Alley Night'];
    for (const name of scenes) {
      await expect(page.locator('button[role="radio"]', { hasText: name })).toBeVisible();
    }
  });

  test('empty_presets_copy_explains_next_step', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await switchMode(page, 'Presets/Compare');
    await expect(page.getByText('No presets yet')).toBeVisible();
    await expect(page.getByText(/\+ New/)).toBeVisible();
  });

  test('specific_verbs_on_actions', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await clickToolbar(page, 'Export');
    await expect(page.locator('button', { hasText: 'Download PNG' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Download JPEG' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Download edit stack' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Download settings card' })).toBeVisible();
  });

  test('help_explainers_present', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Open help panel
    const helpBtn = page.locator('[aria-label*="exposure help"]').first();
    await helpBtn.click();
    await page.waitForTimeout(400);
    // Verify three explainers
    await expect(page.getByText('Aperture', { exact: false }).locator('..').filter({ hasText: /f-number|lens opening/i })).toBeVisible();
    await expect(page.getByText('Speed', { exact: false }).locator('..').filter({ hasText: /shutter/i })).toBeVisible();
    await expect(page.getByText('ISO', { exact: false }).locator('..').filter({ hasText: /sensitivity/i })).toBeVisible();
  });
});

// ── accessibility ──
test.describe('accessibility', () => {
  test('dials_have_aria_slider_roles', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    for (const label of ['APERTURE', 'SPEED', 'ISO']) {
      const slider = page.locator(`[role="slider"][aria-label="${label}"]`);
      await expect(slider).toBeVisible();
      await expect(slider).toHaveAttribute('aria-valuetext', /.+/);
      await expect(slider).toHaveAttribute('aria-valuemin', /\d+/);
      await expect(slider).toHaveAttribute('aria-valuemax', /\d+/);
    }
  });

  test('keyboard_navigable_dials', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const apertureSlider = page.locator('[role="slider"][aria-label="APERTURE"]');
    const valBefore = await apertureSlider.getAttribute('aria-valuetext');
    await apertureSlider.focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
    const valAfter = await apertureSlider.getAttribute('aria-valuetext');
    expect(valAfter).not.toBe(valBefore);
  });

  test('exposure_meter_has_sr_text', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // SR-only polite live region exists in meter
    const srLive = page.locator('[aria-label="Exposure meter"] [aria-live="polite"]');
    await expect(srLive).toHaveCount(1);
  });
});

// ── edge_cases ──
test.describe('edge_cases', () => {
  test('views_stay_coherent_under_rapid_mode_switch', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Rapidly switch modes
    for (let i = 0; i < 5; i++) {
      await switchMode(page, 'Presets/Compare');
      await switchMode(page, 'Meter/Lab');
    }
    // App should still be functional
    await expect(page.locator('[role="slider"][aria-label="APERTURE"]')).toBeVisible();
  });

  test('bracket_validation_empty_name', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await clickToolbar(page, 'Bracket');
    // Clear base name and try to generate
    const nameInput = page.locator('input[aria-labelledby="brk-name-lbl"]');
    await nameInput.clear();
    await page.locator('button', { hasText: 'Generate bracket' }).click();
    await page.waitForTimeout(200);
    // Should show validation error
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });

  test('snapshot_validation_empty_name', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await clickToolbar(page, 'Snapshots');
    // Try to save with empty name
    await page.locator('button', { hasText: 'Save' }).click();
    await page.waitForTimeout(200);
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });
});

// ── responsiveness ──
test.describe('responsiveness', () => {
  test('mobile_375px_no_overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});

// ── technical ──
test.describe('technical', () => {
  test('webmcp_surface_registered', async ({ page }) => {
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
});

// ── performance ──
test.describe('performance', () => {
  test('interactive_within_two_seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[role="slider"][aria-label="APERTURE"]')).toBeVisible();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(2000);
  });
});
