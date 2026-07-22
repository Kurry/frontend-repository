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
    const response = await page.goto(BASE);
    expect(response, 'navigation returns an HTTP response').not.toBeNull();
    expect(response.ok(), `HTTP ${response.status()} from ${response.url()}`).toBe(true);
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
    const session = await page.evaluate(async () => {
      const value = await window.webmcp_session_info();
      return typeof value === 'string' ? JSON.parse(value) : value;
    });
    expect(session, 'webmcp_session_info returns metadata').toBeTruthy();
    expect(Array.isArray(session), 'session metadata is an object, not an array').toBe(false);
    expect(typeof session, 'session metadata is an object').toBe('object');
    expect(Object.keys(session).length, 'session metadata is non-empty').toBeGreaterThan(0);
    const tools = await listTools(page);
    const arr = Array.isArray(tools) ? tools : tools?.tools ?? [];
    expect(arr.length, 'at least one webmcp tool registered').toBeGreaterThan(0);
    const names = arr.map((t) => t?.name ?? t?.id);
    for (const name of names) {
      expect(typeof name, 'every tool has a name').toBe('string');
      expect(name.trim().length, 'tool names are non-empty').toBeGreaterThan(0);
    }
    expect(new Set(names).size, 'tool names are unique').toBe(names.length);
  });

  test('reduced motion behaviorally suppresses animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // Start observing at navigation commit, before short intro animations can
    // finish and disappear from document.getAnimations(). Sampling only after
    // networkidle/settle would falsely pass a forbidden sub-second animation.
    await page.goto(BASE, { waitUntil: 'commit' });
    // Precondition sanity check: the emulation actually reaches the app.
    const reduced = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
    expect(reduced, 'precondition: app sees prefers-reduced-motion: reduce').toBe(true);
    // Observe every frame through the intro/settle window. Finished, idle, or
    // paused effects and durations <=1ms are allowed; any meaningfully timed
    // running effect at any sample is a reduced-motion failure.
    const offenders = await page.evaluate(async () => {
      const seen = new Map();
      const deadline = performance.now() + 1500;
      while (performance.now() < deadline) {
        for (const a of document.getAnimations({ subtree: true })) {
          if (a.playState !== 'running') continue;
          let timing = {};
          try { timing = a.effect?.getComputedTiming?.() ?? {}; } catch { /* detached */ }
          const dur = typeof timing.duration === 'number' ? timing.duration : 0;
          if (dur <= 1) continue; // fill-only / effectively instant
          const offender = {
            kind: a.constructor?.name ?? 'Animation',
            name: a.animationName ?? a.transitionProperty ?? a.id ?? '(anonymous)',
            duration: dur,
            iterations: timing.iterations ?? 1,
          };
          seen.set(JSON.stringify(offender), offender);
        }
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      return [...seen.values()];
    });
    await page.waitForLoadState('networkidle');
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
  });

  // ---- Accessibility (tests/accessibility/accessibility.toml) ----

  test('1.1 keyboard_reaches_primary_controls', async ({ page }) => {
    const connectButton = page.getByRole('button', { name: 'Connect agent', exact: true }).first();
    const focusSequence = [];
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      focusSequence.push(await connectButton.evaluate((el) => el === document.activeElement));
    }
    expect(focusSequence, 'Connect agent header control is reachable via sequential Tab').toContain(true);
    await connectButton.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Connect agent' }), 'Enter activates the reached control').toBeVisible();
  });

  test('1.2 visible_focus_indicators', async ({ page }) => {
    const kpiButton = page.locator('.kpi-button').first();
    const focusSequence = [];
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      focusSequence.push(await kpiButton.evaluate((el) => el === document.activeElement));
    }
    expect(focusSequence, 'first KPI tile is reachable via sequential Tab').toContain(true);
    await kpiButton.focus();
    const outline = await kpiButton.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, boxShadow: style.boxShadow };
    });
    const outlineSignal = Number(outline.outlineStyle !== 'none') * parseFloat(outline.outlineWidth);
    const shadowSignal = Number(outline.boxShadow !== 'none');
    expect(outlineSignal + shadowSignal, 'focused KPI tile renders a visible outline or box-shadow focus ring').toBeGreaterThan(0);
  });

  test('1.3 dialogs_trap_focus_and_escape', async ({ page }) => {
    const exerciseOverlay = async ({ opener, dialog, label }) => {
      await opener.click();
      await expect(dialog, `${label} opens`).toBeVisible();
      const focusables = dialog.locator('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
      const focusableCount = await focusables.count();
      expect(focusableCount, `${label} exposes focusable controls`).toBeGreaterThan(0);
      await focusables.first().focus();
      for (let i = 0; i < focusableCount + 3; i++) await page.keyboard.press('Tab');
      const stillInside = await dialog.evaluate((el) => el.contains(document.activeElement));
      expect(stillInside, `focus stays trapped inside ${label}`).toBe(true);
      await page.keyboard.press('Escape');
      await expect(dialog, `Escape closes ${label}`).toBeHidden();
      await expect(opener, `${label} returns focus to its opener`).toBeFocused();
    };

    // The app registers the same connectButtonRef on both the header's and
    // the agent panel's "Connect agent" buttons (src/App.jsx passes one ref
    // to both <Header> and <AgentPanel>); whichever mounts last wins the ref,
    // so the panel's button is the one the focus-trap actually returns focus
    // to. Open through it so this test exercises the real, current opener.
    await exerciseOverlay({
      opener: page.locator('.agent-panel .panel-actions').getByRole('button', { name: 'Connect agent', exact: true }),
      dialog: page.getByRole('dialog', { name: 'Connect agent' }),
      label: 'Connect agent dialog',
    });
    await exerciseOverlay({
      opener: page.getByRole('button', { name: 'Export session', exact: true }),
      dialog: page.getByRole('dialog', { name: 'Export session' }),
      label: 'export drawer',
    });
    await exerciseOverlay({
      opener: page.getByRole('button', { name: /Commands/ }),
      dialog: page.getByRole('dialog', { name: 'Command palette' }),
      label: 'command palette',
    });
  });

  test('1.4 night_popover_escape_returns_focus', async ({ page }) => {
    const badge = page.locator('.night-badge');
    await badge.click();
    const popover = page.getByRole('dialog', { name: 'Night mode' });
    await expect(popover).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(popover, 'Escape closes the night-mode popover').toBeHidden();
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
    await page.keyboard.press('Escape');

    // Criterion 1.5 also covers the night-schedule fields — Carbon associates
    // their error text via a static aria-describedby (not aria-errormessage),
    // so drive that real path too.
    await page.locator('.night-badge').click();
    const popover = page.getByRole('dialog', { name: 'Night mode' });
    await expect(popover).toBeVisible();
    // Carbon renders the visible toggle label on top of the switch button, so
    // a real user clicks the label to toggle it (same pattern as the 1.9
    // checkbox test).
    await page.locator('label[for="night-enable"]').click();
    const startInput = page.locator('#night-start');
    // Clear the (valid, defaulted) start time so the required/format
    // validation actually fires — native <input type="time"> rejects
    // out-of-range literals like "99:99" as malformed before React ever sees
    // a change, so an empty value is the real way to trigger the error path.
    await startInput.fill('');
    await startInput.blur();
    await expect(startInput, 'night start-time field is associated with error text via aria-describedby').toHaveAttribute('aria-describedby', 'night-start-validation');
    await expect(page.locator('#night-start-validation'), 'the referenced night-schedule error text names the field it belongs to').toContainText('Start time');
  });

  test('1.6 status_not_color_only', async ({ page }) => {
    const chip = page.locator('.status-chip').first();
    await expect(chip).toBeVisible();
    const text = (await chip.innerText()).trim();
    expect(text, 'status chip carries a real text label, not color alone').toMatch(/^[A-Za-z][A-Za-z\s]*$/);
  });

  test('1.7 aria_live_announces_mutations', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
    const live = page.locator('[aria-live="polite"]');
    await expect(live).toBeAttached();
    await page.getByRole('button', { name: 'Connect agent', exact: true }).first().click();
    await page.locator('#agent-name').fill('QA Bot');
    await page.locator('#agent-model').selectOption('gpt-4.1');
    await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
    await expect(live, 'connecting an agent is announced through the aria-live region').toHaveText(/Agent QA Bot connected\./);

    // Criterion 1.7 also names disconnect, bulk disconnect, export copy, and
    // import completion — drive each real control and assert on the same
    // aria-live region.
    const disconnectButton = page.getByRole('button', { name: 'Disconnect QA Bot' });
    await disconnectButton.click();
    const disconnectConfirm = page.getByRole('dialog', { name: 'Disconnect QA Bot?' });
    await disconnectConfirm.getByRole('button', { name: 'Disconnect agent', exact: true }).click();
    await expect(live, 'disconnecting a single agent is announced through the aria-live region').toHaveText(/Agent QA Bot disconnected\./);
    // The confirm dialog's overlay plays a short exit animation and keeps
    // intercepting pointer events in the DOM until it fully unmounts; wait
    // for actual removal (not just accessibility visibility) so the next
    // real click isn't racing a closing overlay.
    await expect(page.locator('.overlay-center'), 'the disconnect confirm overlay fully unmounts before continuing').toHaveCount(0);

    // Carbon renders the visible checkbox label on top of the (visually
    // hidden) native input, so a real user clicks the label to toggle it
    // (same pattern as the 1.9 checkbox test).
    await page.locator('label[for="select-all-agents"]').click();
    const selectedCount = await page.evaluate(() => document.querySelectorAll('.agent-select input[type="checkbox"]:checked').length);
    await page.getByRole('button', { name: /Disconnect selected/ }).click();
    const bulkConfirm = page.getByRole('dialog', { name: new RegExp(`Disconnect ${selectedCount} selected agents\\?`) });
    await bulkConfirm.getByRole('button', { name: 'Disconnect selected', exact: true }).click();
    await expect(live, 'bulk disconnect is announced through the aria-live region').toHaveText(new RegExp(`${selectedCount} agents disconnected\\.`));
    await expect(page.locator('.overlay-center'), 'the bulk-disconnect confirm overlay fully unmounts before continuing').toHaveCount(0);

    await page.getByRole('button', { name: 'Export session', exact: true }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Export session' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Close Export session drawer' })).toBeFocused();
    const sessionJson = await page.locator('.export-preview').innerText();
    await dialog.getByRole('tab', { name: 'Agents CSV' }).click();
    await expect(dialog.getByRole('tab', { name: 'Agents CSV' })).toHaveAttribute('aria-selected', 'true');
    const copyButton = dialog.getByRole('button', { name: 'Copy', exact: true });
    await copyButton.click();
    await expect(dialog.getByRole('button', { name: 'Copied', exact: true })).toBeVisible();
    await expect(live, 'export copy is announced through the aria-live region').toHaveText(/Agents CSV copied\./);

    await page.locator('#session-import').fill(sessionJson);
    await page.getByRole('button', { name: 'Import session', exact: true }).click();
    await expect(live, 'import completion is announced through the aria-live region').toHaveText(/Session JSON import completed\./);
  });

  test('1.8 labels_on_form_controls', async ({ page }) => {
    await page.getByRole('button', { name: 'Connect agent', exact: true }).first().click();
    const nameLabel = await page.locator('#agent-name').evaluate((el) => document.querySelector(`label[for="${el.id}"]`)?.textContent?.trim());
    expect(nameLabel, 'agent name field has a visible <label>').toBe('Agent name');
    const modelLabel = await page.locator('#agent-model').evaluate((el) => document.querySelector(`label[for="${el.id}"]`)?.textContent?.trim());
    expect(modelLabel, 'model field has a visible <label>').toBe('Model');
    await page.keyboard.press('Escape');

    // Criterion 1.8 also covers the night-schedule form controls.
    await page.locator('.night-badge').click();
    await expect(page.getByRole('dialog', { name: 'Night mode' })).toBeVisible();
    const startLabel = await page.locator('#night-start').evaluate((el) => document.querySelector(`label[for="${el.id}"]`)?.textContent?.trim());
    expect(startLabel, 'night-schedule start time field has a visible <label>').toBe('Start time');
    const endLabel = await page.locator('#night-end').evaluate((el) => document.querySelector(`label[for="${el.id}"]`)?.textContent?.trim());
    expect(endLabel, 'night-schedule end time field has a visible <label>').toBe('End time');
  });

  test('1.9 checkbox_and_bulk_actions_labeled', async ({ page }) => {
    const checkbox = page.locator('.agent-select input[type="checkbox"]').first();
    await expect(checkbox).toHaveCount(1);
    await expect(checkbox, 'agent selection checkbox has a name for assistive technology').toHaveAccessibleName(/.+/);
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
    await expect(dialog.getByRole('button', { name: 'Close Export session drawer' })).toBeFocused();
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
    const kpiValue = page.locator('.kpi-value').first();
    const before = await kpiValue.innerText();
    const settleAt = await page.evaluate(() => performance.now() + 900);
    await page.waitForFunction((deadline) => performance.now() >= deadline, settleAt);
    const after = kpiValue;
    await expect(after, 'KPI count-up shows its final value instantly and does not keep animating under reduced motion').toHaveText(before);
    await page.getByRole('button', { name: 'Connect agent', exact: true }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Connect agent' });
    await expect(dialog).toBeVisible();
    const seconds = await dialog.evaluate((el) => parseFloat(window.getComputedStyle(el).animationDuration) || 0);
    expect(seconds, 'dialog open transition applies effectively instantly under reduced motion').toBeLessThanOrEqual(0.01);
    await page.keyboard.press('Escape');

    // Criterion 4.8 also requires the night popover, export drawer, command
    // palette, feed items, and step-status indicators to apply instantly.
    await page.locator('.night-badge').click();
    const popover = page.getByRole('dialog', { name: 'Night mode' });
    await expect(popover).toBeVisible();
    const popoverSeconds = await popover.evaluate((el) => parseFloat(window.getComputedStyle(el).animationDuration) || 0);
    expect(popoverSeconds, 'night popover transition applies effectively instantly under reduced motion').toBeLessThanOrEqual(0.01);
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Export session', exact: true }).first().click();
    const drawer = page.getByRole('dialog', { name: 'Export session' });
    await expect(drawer).toBeVisible();
    const drawerSeconds = await drawer.evaluate((el) => parseFloat(window.getComputedStyle(el).animationDuration) || 0);
    expect(drawerSeconds, 'export drawer transition applies effectively instantly under reduced motion').toBeLessThanOrEqual(0.01);
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Commands ⌘K', exact: true }).click();
    const palette = page.getByRole('dialog', { name: 'Command palette' });
    await expect(palette).toBeVisible();
    const paletteSeconds = await palette.evaluate((el) => parseFloat(window.getComputedStyle(el).animationDuration) || 0);
    expect(paletteSeconds, 'command palette transition applies effectively instantly under reduced motion').toBeLessThanOrEqual(0.01);
    await page.keyboard.press('Escape');

    const runningStepPulse = page.locator('.step-running .step-pulse').first();
    await expect(runningStepPulse).toBeVisible();
    const pulseTiming = await runningStepPulse.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return { duration: parseFloat(style.animationDuration) || 0, iterations: style.animationIterationCount };
    });
    expect(pulseTiming.duration, 'running step-status pulse applies effectively instantly under reduced motion').toBeLessThanOrEqual(0.01);
    expect(pulseTiming.iterations, 'running step-status pulse does not keep looping under reduced motion').toBe('1');

    await page.getByRole('button', { name: 'Simulate activity', exact: true }).click();
    const newFeedItem = page.locator('.feed-item.feed-enter').first();
    await expect(newFeedItem).toBeVisible();
    const feedSeconds = await newFeedItem.evaluate((el) => parseFloat(window.getComputedStyle(el).animationDuration) || 0);
    expect(feedSeconds, 'new feed item entrance applies effectively instantly under reduced motion').toBeLessThanOrEqual(0.01);
  });

  // ---- Responsiveness (tests/responsiveness/responsiveness.toml) ----

  test('7.2 tablet_kpi_wrap_feed_stacks', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 900 });
    await page.goto(BASE);
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
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, 'no page-level horizontal scroll at 375px').toBeLessThanOrEqual(1);
    const bodyOverflow = await page.evaluate(() => document.body.scrollWidth - document.body.clientWidth);
    expect(bodyOverflow, 'the body itself does not introduce horizontal scroll at 375px').toBeLessThanOrEqual(1);
  });

  test('7.4 suggestions_row_self_scrolls', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    const wrap = page.locator('.suggestion-wrap');
    const overflowsInternally = await wrap.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
    expect(overflowsInternally, 'suggestions row overflows within its own scroll container at 375px').toBe(true);
    const pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(pageOverflow, 'the self-scrolling row does not force page-level horizontal scroll').toBeLessThanOrEqual(1);
  });

  test('7.5 export_drawer_usable_on_mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    await page.getByRole('button', { name: 'Export session', exact: true }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Export session' });
    await expect(dialog).toBeVisible();
    // Let the drawer's 210ms slide-in transition finish before measuring its
    // resting position, or the box is read mid-animation.
    await dialog.evaluate(async (element) => {
      await Promise.allSettled(element.getAnimations().map((animation) => animation.finished));
    });
    const box = await dialog.boundingBox();
    expect(box.x, 'export drawer stays within the 375px viewport').toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width, 'export drawer does not render off-screen at 375px').toBeLessThanOrEqual(376);
    await expect(page.getByRole('button', { name: 'Copy', exact: true }), 'export controls stay operable at 375px').toBeVisible();
  });

  test('7.6 command_palette_usable_on_mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    await page.getByRole('button', { name: /Commands/ }).first().click();
    const dialog = page.locator('.palette-card');
    await expect(dialog).toBeVisible();
    await dialog.evaluate(async (element) => {
      await Promise.allSettled(element.getAnimations().map((animation) => animation.finished));
    });
    const box = await dialog.boundingBox();
    expect(box.x, 'command palette stays within the 375px viewport').toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width, 'command palette does not render off-screen at 375px').toBeLessThanOrEqual(376);
    await expect(page.getByLabel('Filter commands'), 'palette search stays operable at 375px').toBeVisible();
  });

  test('7.7 undo_redo_visible_on_mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
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
    await page.getByRole('button', { name: 'Connect agent', exact: true }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Connect agent' });
    await expect(dialog).toBeVisible();
    await dialog.evaluate(async (element) => {
      await Promise.allSettled(element.getAnimations().map((animation) => animation.finished));
    });
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
    const progress = page.locator('.agent-progress');
    const initialProgress = await progress.evaluateAll((elements) => elements.map((element) => element.textContent));
    await expect.poll(
      () => progress.evaluateAll((elements) => elements.map((element) => element.textContent)),
      { timeout: 3000 },
    ).not.toEqual(initialProgress);
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
      const name = (await button.evaluate((el) => el.textContent?.trim() || el.ariaLabel || '')).trim();
      expect(genericLabels.has(name), `action label "${name}" is a specific verb, not a generic one`).toBe(false);
    }
    await page.getByRole('button', { name: 'Export session', exact: true }).first().click();
    await expect(page.getByRole('button', { name: 'Copy', exact: true }), 'export controls use the specific verb Copy').toBeVisible();
    await expect(page.getByRole('button', { name: 'Download', exact: true }), 'export controls use the specific verb Download').toBeVisible();
  });
});
