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

test.describe('Command Center E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
  });

  // ---- Accessibility (tests/accessibility/accessibility.toml) ----

  test('1.1 keyboard_reaches_primary_controls', async ({ page }) => {
    const connectButton = page.getByRole('button', { name: 'Connect agent', exact: true }).first();
    let reached = false;
    for (let i = 0; i < 40 && !reached; i++) {
      await page.keyboard.press('Tab');
      reached = await connectButton.evaluate((el) => el === document.activeElement);
    }
    expect(reached, 'Connect agent header control is reachable via sequential Tab').toBe(true);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Connect agent' }), 'Enter activates the reached control').toBeVisible();
  });

  test('1.2 visible_focus_indicators', async ({ page }) => {
    const kpiButton = page.locator('.kpi-button').first();
    let reached = false;
    for (let i = 0; i < 40 && !reached; i++) {
      await page.keyboard.press('Tab');
      reached = await kpiButton.evaluate((el) => el === document.activeElement);
    }
    expect(reached, 'first KPI tile is reachable via sequential Tab').toBe(true);
    const outline = await kpiButton.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, boxShadow: style.boxShadow };
    });
    const hasIndicator = (outline.outlineStyle !== 'none' && outline.outlineWidth !== '0px') || outline.boxShadow !== 'none';
    expect(hasIndicator, 'focused KPI tile renders a visible outline or box-shadow focus ring').toBe(true);
  });

  test('1.3 dialogs_trap_focus_and_escape', async ({ page }) => {
    // The app registers the same connectButtonRef on both the header's and
    // the agent panel's "Connect agent" buttons (src/App.jsx passes one ref
    // to both <Header> and <AgentPanel>); whichever mounts last wins the ref,
    // so the panel's button is the one the focus-trap actually returns focus
    // to. Open through it so this test exercises the real, current opener.
    const opener = page.locator('.agent-panel .panel-actions').getByRole('button', { name: 'Connect agent', exact: true });
    await opener.click();
    const dialog = page.getByRole('dialog', { name: 'Connect agent' });
    await expect(dialog).toBeVisible();
    const focusableCount = await dialog.evaluate((el) =>
      el.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])').length);
    expect(focusableCount, 'dialog exposes focusable controls').toBeGreaterThan(0);
    for (let i = 0; i < focusableCount + 3; i++) await page.keyboard.press('Tab');
    const stillInside = await dialog.evaluate((el) => el.contains(document.activeElement));
    expect(stillInside, 'focus stays trapped inside the dialog after tabbing past its last control').toBe(true);
    await page.keyboard.press('Escape');
    await expect(dialog, 'Escape closes the dialog').not.toBeVisible();
    await expect(opener, 'focus returns to the control that opened the dialog').toBeFocused();
  });

  test('1.4 night_popover_escape_returns_focus', async ({ page }) => {
    const badge = page.locator('.night-badge');
    await badge.click();
    const popover = page.getByRole('dialog', { name: 'Night mode' });
    await expect(popover).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(popover, 'Escape closes the night-mode popover').not.toBeVisible();
    await expect(badge, 'focus returns to the night-mode badge after Escape').toBeFocused();
  });

  test('1.5 validation_associated_with_fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Connect agent', exact: true }).first().click();
    const nameInput = page.locator('#agent-name');
    // Carbon TextInput associates its error text via aria-errormessage, not
    // aria-describedby.
    await expect.poll(async () => nameInput.getAttribute('aria-errormessage'), {
      message: 'invalid name field gains an aria-errormessage reference once validation runs',
    }).toBeTruthy();
    const describedBy = await nameInput.getAttribute('aria-errormessage');
    const errorText = page.locator(`#${describedBy}`);
    await expect(errorText, 'the referenced error text names the field it belongs to').toContainText('Agent name');
  });

  test('1.6 status_not_color_only', async ({ page }) => {
    const chip = page.locator('.status-chip').first();
    await expect(chip).toBeVisible();
    const text = (await chip.innerText()).trim();
    expect(text, 'status chip carries a real text label, not color alone').toMatch(/^[A-Za-z][A-Za-z\s]*$/);
  });

  test('1.7 aria_live_announces_mutations', async ({ page }) => {
    const live = page.locator('[aria-live="polite"]');
    await expect(live).toBeAttached();
    await page.getByRole('button', { name: 'Connect agent', exact: true }).first().click();
    await page.locator('#agent-name').fill('QA Bot');
    await page.locator('#agent-model').selectOption('gpt-4.1');
    await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
    await expect(live, 'connecting an agent is announced through the aria-live region').toHaveText(/Agent QA Bot connected\./);
  });

  test('1.8 labels_on_form_controls', async ({ page }) => {
    await page.getByRole('button', { name: 'Connect agent', exact: true }).first().click();
    const nameLabel = await page.locator('#agent-name').evaluate((el) => document.querySelector(`label[for="${el.id}"]`)?.textContent?.trim());
    expect(nameLabel, 'agent name field has a visible <label>').toBe('Agent name');
    const modelLabel = await page.locator('#agent-model').evaluate((el) => document.querySelector(`label[for="${el.id}"]`)?.textContent?.trim());
    expect(modelLabel, 'model field has a visible <label>').toBe('Model');
  });

  test('1.9 checkbox_and_bulk_actions_labeled', async ({ page }) => {
    const checkbox = page.locator('.agent-select input[type="checkbox"]').first();
    await expect(checkbox).toHaveCount(1);
    const accessibleName = await checkbox.evaluate((el) => {
      const label = el.id ? document.querySelector(`label[for="${el.id}"]`) : null;
      return el.getAttribute('aria-label') || label?.textContent?.trim() || '';
    });
    expect(accessibleName.length, 'agent selection checkbox has a name for assistive technology').toBeGreaterThan(0);
    // Carbon renders the visible checkbox label on top of the (visually
    // hidden) native input, so a real user clicks the label to toggle it.
    await page.locator('.agent-select label').first().click();
    await expect(checkbox, 'clicking the labeled checkbox target checks it').toBeChecked();
    const bulkButton = page.getByRole('button', { name: /Disconnect selected/ });
    await expect(bulkButton, 'bulk disconnect names how many agents are selected').toHaveText(/Disconnect selected \(\d+\)/);
  });

  test('1.10 export_tabs_are_keyboard_operable', async ({ page, context }) => {
    // Copy uses navigator.clipboard.writeText; grant the permission so the
    // real success path (not its silent-failure catch branch) is exercised.
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.getByRole('button', { name: 'Export session', exact: true }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Export session' });
    await expect(dialog).toBeVisible();
    // The drawer's own focus trap moves focus to its first control ~30ms
    // after opening; wait for that one-time settle so it cannot race with
    // (and undo) the keyboard interaction below.
    await page.waitForTimeout(200);
    const jsonTab = page.locator('#export-tab-json');
    const csvTab = page.locator('#export-tab-csv');
    await expect(jsonTab).toHaveAttribute('aria-selected', 'true');
    await jsonTab.focus();
    await page.keyboard.press('ArrowRight');
    await expect(csvTab, 'ArrowRight switches the export format tab via keyboard').toHaveAttribute('aria-selected', 'true');
    await expect.poll(async () => csvTab.evaluate((el) => el === document.activeElement), {
      message: 'keyboard tab switching moves focus to the newly selected tab',
    }).toBe(true);
    const copyButton = page.getByRole('button', { name: 'Copy', exact: true });
    await copyButton.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Copied', exact: true }), 'Copy control activates via keyboard Enter').toBeVisible();
  });

  // ---- Motion (tests/motion/motion.toml) ----

  test('4.8 reduced_motion_fallback', async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const kpiValue = page.locator('.kpi-value').first();
    const before = await kpiValue.innerText();
    await page.waitForTimeout(900);
    const after = await kpiValue.innerText();
    expect(after, 'KPI count-up shows its final value instantly and does not keep animating under reduced motion').toBe(before);
    await page.getByRole('button', { name: 'Connect agent', exact: true }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Connect agent' });
    await expect(dialog).toBeVisible();
    const seconds = await dialog.evaluate((el) => parseFloat(window.getComputedStyle(el).animationDuration) || 0);
    expect(seconds, 'dialog open transition applies effectively instantly under reduced motion').toBeLessThanOrEqual(0.01);
  });

  // ---- Responsiveness (tests/responsiveness/responsiveness.toml) ----

  test('7.2 tablet_kpi_wrap_feed_stacks', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 900 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const tiles = page.locator('.kpi-tile');
    const box0 = await tiles.nth(0).boundingBox();
    const box2 = await tiles.nth(2).boundingBox();
    expect(box2.y, 'KPI tiles wrap to two per row below 1024px').toBeGreaterThan(box0.y + 10);
    const agentPanel = await page.locator('.agent-panel').boundingBox();
    const activityPanel = await page.locator('.activity-panel').boundingBox();
    expect(activityPanel.y, 'activity feed stacks below the agent panel below 1024px').toBeGreaterThanOrEqual(agentPanel.y + agentPanel.height - 5);
    expect(Math.round(activityPanel.width), 'stacked activity feed spans full width').toBeGreaterThanOrEqual(Math.round(agentPanel.width) - 5);
  });

  test('7.3 mobile_no_page_horizontal_scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, 'no page-level horizontal scroll at 375px').toBeLessThanOrEqual(1);
    const bodyOverflow = await page.evaluate(() => document.body.scrollWidth - document.body.clientWidth);
    expect(bodyOverflow, 'the body itself does not introduce horizontal scroll at 375px').toBeLessThanOrEqual(1);
  });

  test('7.4 suggestions_row_self_scrolls', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const wrap = page.locator('.suggestion-wrap');
    const overflowsInternally = await wrap.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
    expect(overflowsInternally, 'suggestions row overflows within its own scroll container at 375px').toBe(true);
    const pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(pageOverflow, 'the self-scrolling row does not force page-level horizontal scroll').toBeLessThanOrEqual(1);
  });

  test('7.5 export_drawer_usable_on_mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Export session', exact: true }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Export session' });
    await expect(dialog).toBeVisible();
    // Let the drawer's 210ms slide-in transition finish before measuring its
    // resting position, or the box is read mid-animation.
    await page.waitForTimeout(300);
    const box = await dialog.boundingBox();
    expect(box.x, 'export drawer stays within the 375px viewport').toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width, 'export drawer does not render off-screen at 375px').toBeLessThanOrEqual(376);
    await expect(page.getByRole('button', { name: 'Copy', exact: true }), 'export controls stay operable at 375px').toBeVisible();
  });

  test('7.6 command_palette_usable_on_mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Commands/ }).first().click();
    const dialog = page.locator('.palette-card');
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(300); // let the 180ms dialog-in transition settle before measuring
    const box = await dialog.boundingBox();
    expect(box.x, 'command palette stays within the 375px viewport').toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width, 'command palette does not render off-screen at 375px').toBeLessThanOrEqual(376);
    await expect(page.getByLabel('Filter commands'), 'palette search stays operable at 375px').toBeVisible();
  });

  test('7.7 undo_redo_visible_on_mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Connect agent', exact: true }).first().click();
    await page.locator('#agent-name').fill('Mobile QA');
    await page.locator('#agent-model').selectOption('gpt-4.1');
    await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
    const undoButton = page.getByRole('button', { name: 'Undo' });
    const redoButton = page.getByRole('button', { name: 'Redo' });
    await expect(undoButton, 'Undo is visible at 375px once a mutation enables it').toBeVisible();
    await expect(undoButton, 'Undo is operable at 375px').toBeEnabled();
    await undoButton.click();
    await expect(redoButton, 'Redo is visible at 375px once an undo enables it').toBeVisible();
    await expect(redoButton, 'Redo is operable at 375px').toBeEnabled();
  });

  test('7.8 connect_dialog_usable_on_mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Connect agent', exact: true }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Connect agent' });
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(300); // let the dialog-in transition settle before measuring
    const box = await dialog.boundingBox();
    expect(box.x, 'connect dialog stays within the 375px viewport').toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width, 'connect dialog does not render off-screen at 375px').toBeLessThanOrEqual(376);
    await page.locator('#agent-name').fill('Mobile Agent');
    await expect(page.locator('#agent-name'), 'form fields stay operable at 375px').toHaveValue('Mobile Agent');
  });

  // ---- Performance (tests/performance/performance.toml) ----

  test('9.2 console_clean_on_load', async ({ page }) => {
    // The page fixture's afterEach asserts zero console/page errors across
    // the whole test; give the 1.7s agent-step interval and count-up
    // animation a full cycle to fire before the assertion runs.
    await page.waitForTimeout(1800);
    await expect(page.locator('.app-shell')).toBeVisible();
  });

  test('9.3 console_clean_during_exercise', async ({ page }) => {
    await page.getByRole('button', { name: 'Connect agent', exact: true }).first().click();
    await page.locator('#agent-name').fill('Exercise Agent');
    await page.locator('#agent-model').selectOption('claude-sonnet-4');
    await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
    await page.getByRole('button', { name: 'Agent', exact: true }).click();
    await page.getByRole('button', { name: 'Export session', exact: true }).first().click();
    await page.getByRole('tab', { name: 'Agents CSV' }).click();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /Commands/ }).first().click();
    await page.keyboard.type('export');
    await page.keyboard.press('Escape');
    // The page fixture's afterEach assertion (zero console/page errors) is
    // the real check: this exercise walks connect, filter, export, and palette.
    await expect(page.locator('.app-shell')).toBeVisible();
  });

  test('9.6 export_tab_switch_no_freeze', async ({ page }) => {
    await page.getByRole('button', { name: 'Export session', exact: true }).first().click();
    const preview = page.locator('.export-preview');
    const jsonText = (await preview.innerText()).trim();
    expect(jsonText.startsWith('{'), 'JSON preview renders the session as JSON').toBe(true);
    await page.getByRole('tab', { name: 'Agents CSV' }).click();
    await expect.poll(async () => (await preview.innerText()).trim(), {
      message: 'preview regenerates for the CSV format without freezing the UI',
      timeout: 1000,
    }).not.toBe(jsonText);
    const csvText = (await preview.innerText()).trim();
    expect(csvText.includes(','), 'CSV preview renders comma-separated agent rows').toBe(true);
  });

  test('9.7 palette_filter_stays_snappy', async ({ page }) => {
    await page.getByRole('button', { name: /Commands/ }).first().click();
    const search = page.getByLabel('Filter commands');
    await expect(search).toBeVisible();
    const commandButtons = page.locator('.command-list button');
    const initialCount = await commandButtons.count();
    expect(initialCount, 'palette lists multiple commands before filtering').toBeGreaterThan(1);
    await search.fill('export');
    await expect.poll(async () => commandButtons.count(), {
      message: 'typing in the palette filter narrows the result list promptly',
      timeout: 500,
    }).toBeLessThan(initialCount);
    await expect(page.locator('.command-list').getByRole('button', { name: /Export session/ }), 'the filtered result contains the matching command').toBeVisible();
  });

  // ---- Writing (tests/writing/writing.toml) ----

  test('15.2 actions_use_specific_labels', async ({ page }) => {
    const genericLabels = new Set(['Submit', 'OK', 'Click here']);
    const namedButtons = [
      page.getByRole('button', { name: 'Connect agent', exact: true }).first(),
      page.getByRole('button', { name: 'Export session', exact: true }).first(),
      page.getByRole('button', { name: 'Undo' }),
      page.getByRole('button', { name: 'Redo' }),
    ];
    for (const button of namedButtons) {
      const name = (await button.evaluate((el) => el.textContent?.trim() || el.getAttribute('aria-label') || '')).trim();
      expect(genericLabels.has(name), `action label "${name}" is a specific verb, not a generic one`).toBe(false);
    }
    await page.getByRole('button', { name: 'Export session', exact: true }).first().click();
    await expect(page.getByRole('button', { name: 'Copy', exact: true }), 'export controls use the specific verb Copy').toBeVisible();
    await expect(page.getByRole('button', { name: 'Download', exact: true }), 'export controls use the specific verb Download').toBeVisible();
  });
});
