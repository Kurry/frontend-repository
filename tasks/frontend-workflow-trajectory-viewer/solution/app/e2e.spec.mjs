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
    page.on('console', async (m) => { if (await m.type() === 'error') errors.push(`console.error: ${m.text()}`); });
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

const normalizeTools = (tools) => Array.isArray(tools) ? tools : tools?.tools ?? [];

test.describe('workspace contract (canonical)', () => {
  test('serves non-empty app with zero console errors', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len, 'body renders visible content').toBeGreaterThan(0);
  });

  test('webmcp surface is registered and well-formed', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    const kinds = await page.evaluate(() => ({
      session_info: typeof window.webmcp_session_info,
      list_tools: typeof window.webmcp_list_tools,
      invoke_tool: typeof window.webmcp_invoke_tool,
    }));
    expect(kinds).toEqual({ session_info: 'function', list_tools: 'function', invoke_tool: 'function' });
    const tools = await listTools(page);
    const arr = normalizeTools(tools);
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
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    // Precondition sanity check: the emulation actually reaches the app.
    const reduced = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
    expect(reduced, 'precondition: app sees prefers-reduced-motion: reduce').toBe(true);
    // Observe every frame for another 1.5s after load settles and assert on
    // everything seen since the document started.
    // Finished, idle, or paused effects and durations <=1ms are allowed; any
    // meaningfully timed RUNNING effect at any sample is a reduced-motion
    // failure. Apps with zero animations pass vacuously (the render/console
    // test still gates them).
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 1500)));
    const offenders = await page.evaluate(() => window.__reducedMotionOffenders ?? []);
    expect(offenders, 'no running animation/transition with meaningful duration under reduced motion').toEqual([]);
  });

  test('no horizontal overflow at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, 'no horizontal page scroll at 375px').toBeLessThanOrEqual(1);
  });
});

// ==== END CANONICAL REGION — add task-specific criterion tests below. ====

async function openTaskPage(page, taskName = 'Config recovery') {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.locator('button', { has: page.locator('h2', { hasText: taskName }) }).click();
  await page.waitForLoadState('networkidle');
}

async function openTrialViewer(page, { taskName = 'Config recovery', trialId } = {}) {
  await openTaskPage(page, taskName);
  const row = trialId
    ? page.locator('tbody tr', { hasText: trialId })
    : page.locator('tbody tr').first();
  await row.click();
  await page.locator('#btn-export').waitFor({ state: 'visible', timeout: 15000 });
}

test.describe('trajectory viewer (task-specific)', () => {
  test('1.1 seeded_catalog_and_task_page', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const cards = page.locator('main button', { has: page.locator('h2') });
    await expect(cards).toHaveCount(3);
    for (const name of ['Config recovery', 'Ledger audit', 'Cache eviction']) {
      const card = page.locator('button', { has: page.locator('h2', { hasText: name }) });
      await expect(card).toContainText('3 trials');
      await expect(card).toContainText('BEST');
    }
    await openTaskPage(page, 'Config recovery');
    await expect(page.locator('.rich h3').first(), 'instruction rendered as rich text').toBeVisible();
    await expect(page.locator('section, aside', { hasText: 'Configuration' }).locator('dl')).toBeVisible();
    await expect(page.locator('section', { hasText: 'Environment Files' })).toBeVisible();
    const testCount = await page.locator('section', { hasText: 'Evaluator Tests' }).locator('span.min-w-0.break-words').count();
    expect(testCount).toBeGreaterThanOrEqual(3);
  });

  test('1.2 trial_table_columns_complete', async ({ page }) => {
    await openTaskPage(page, 'Config recovery');
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      const cells = rows.nth(i).locator('td');
      const rewardText = await cells.nth(1).innerText();
      expect(rewardText.trim()).toMatch(/^\d\.\d\d$/);
      const outcomeText = await cells.nth(2).innerText();
      expect(outcomeText.toLowerCase()).toMatch(/pass|fail/);
      const durationText = await cells.nth(3).innerText();
      expect(durationText).toMatch(/\d+m \d+s/);
      const stepCountText = await cells.nth(4).innerText();
      expect(Number(stepCountText.trim())).toBeGreaterThan(0);
    }
  });

  test('1.3 reward_sort_reversal', async ({ page }) => {
    await openTaskPage(page, 'Config recovery');
    const rewardHeaderButton = page.locator('thead button', { hasText: 'Reward' });
    const readRewards = async () => {
      const values = await page.locator('tbody tr td:nth-child(2)').allInnerTexts();
      return values.map((v) => Number(v.trim()));
    };
    const first = await readRewards();
    await rewardHeaderButton.click();
    const second = await readRewards();
    expect(second).toEqual([...first].reverse());
    await rewardHeaderButton.click();
    const third = await readRewards();
    expect(third).toEqual(first);
  });

  test('1.4 filesystem_toggle_swaps_tree', async ({ page }) => {
    await openTaskPage(page, 'Config recovery');
    const section = page.locator('section', { hasText: 'Environment Files' });
    const referenceText = await section.innerText();
    const referenceRadio = section.getByRole('radio', { name: 'Reference' });
    const trialRadio = section.getByRole('radio', { name: 'Trial final' });
    await expect(referenceRadio).toBeChecked();
    await trialRadio.click();
    await expect(trialRadio).toBeChecked();
    await expect(referenceRadio).not.toBeChecked();
    const trialText = await section.innerText();
    expect(trialText).not.toBe(referenceText);
  });

  test('1.6 timeline_mixed_step_types', async ({ page }) => {
    await openTrialViewer(page, { taskName: 'Config recovery', trialId: 'trial-3' });
    const entries = page.locator('[aria-label="Timeline entries"] button');
    await expect(entries).toHaveCount(14);
    const text = (await page.locator('[aria-label="Timeline entries"]').innerText()).toLowerCase();
    for (const label of ['Reasoning', 'Tool call', 'Observation', 'Terminal', 'Screenshot']) {
      expect(text).toContain(label.toLowerCase());
    }
    // trial-3 is the seeded failed trial: step 9 shows error status.
    const failedEntry = entries.nth(8);
    await expect(failedEntry.locator('.bg-red-500')).toBeVisible();
    await failedEntry.click();
    await expect((await page.locator('[aria-label="Step details"]').innerText()).toLowerCase()).toContain('terminal');
  });

  test('1.7 click_step_syncs_all_panes', async ({ page }) => {
    await openTrialViewer(page);
    const fifthEntry = page.locator('[aria-label="Timeline entries"] button').nth(4);
    await expect(fifthEntry).toContainText('Run the focused regression test');
    await fifthEntry.click();
    await expect(page.locator('[aria-label="File workspace"]')).toContainText('State after step 5');
    await expect(page.locator('[aria-label="Step details"] h2').first()).toHaveText('Run the focused regression test');
  });

  test('1.8 keyboard_and_scrubber_navigation', async ({ page }) => {
    await openTrialViewer(page);
    const timeline = page.locator('[aria-label="Timeline entries"]');
    await timeline.focus();
    await timeline.press('ArrowDown');
    await expect(page.locator('[aria-current="step"]')).toContainText('02');
    await timeline.press('ArrowDown');
    await expect(page.locator('[aria-current="step"]')).toContainText('03');
    await timeline.press('ArrowUp');
    await expect(page.locator('[aria-current="step"]')).toContainText('02');
    const scrubber = page.getByLabel('Scrub trial steps');
    await scrubber.fill('9');
    await expect(page.locator('[aria-current="step"]')).toContainText('09');
    await expect(page.locator('[aria-label="File workspace"]')).toContainText('State after step 9');
  });

  test('1.13 forms_inline_validation', async ({ page }) => {
    await openTrialViewer(page);
    await page.locator('#btn-annotate').click();
    await page.getByLabel('Note text').fill('');
    await page.getByRole('button', { name: 'Add note' }).click();
    await expect(page.locator('#note-text-error')).toContainText('note_text');
    await expect(page.locator('h2', { hasText: /^Annotations/ })).toHaveText('Annotations · 0');
  });

  test('1.14 classification_report_links_jump', async ({ page }) => {
    await openTrialViewer(page);
    await page.locator('[aria-current="step"]').first(); // ensure step 1 active
    await page.getByRole('combobox', { name: 'Stage' }).click();
    await page.getByRole('option', { name: 'Planning' }).click();
    await page.getByRole('combobox', { name: 'Root cause' }).click();
    await page.getByRole('option', { name: 'Wrong Tool' }).click();
    await page.getByRole('combobox', { name: 'Behavior' }).click();
    await page.getByRole('option', { name: 'Loops' }).click();
    await page.getByRole('combobox', { name: 'Impact' }).click();
    await page.getByRole('option', { name: 'Score Zero' }).click();
    await page.getByLabel('Evidence').fill('The agent repeated the same tool call without new evidence.');
    await page.locator('[role="group"][aria-labelledby="label-implicated"] label', { hasText: /^3$/ }).locator('input[type=checkbox]').check();
    await page.getByRole('button', { name: /Classify failure/ }).click();
    const card = page.locator('.report-enter');
    await expect(card).toContainText('Planning');
    await expect(card).toContainText('Wrong Tool');
    await expect(card).toContainText('Loops');
    await expect(card).toContainText('Score Zero');
    await card.locator('a', { hasText: 'Step 3' }).click();
    await expect(page.locator('[aria-current="step"]')).toContainText('03');
  });

  test('1.19 step_type_filter_narrows_timeline', async ({ page }) => {
    await openTrialViewer(page);
    await page.getByRole('radio', { name: 'tool-call', exact: true }).click();
    const entries = page.locator('[aria-label="Timeline entries"] button');
    const count = await entries.count();
    expect(count).toBeGreaterThan(0);
    const text = (await page.locator('[aria-label="Timeline entries"]').innerText()).toLowerCase();
    expect(text).toContain('tool call');
    expect(text).not.toContain('reasoning');
    await page.getByRole('radio', { name: 'all', exact: true }).click();
    await expect(entries).toHaveCount(14);
  });

  test('1.20 command_palette_jumps_to_step', async ({ page }) => {
    await openTrialViewer(page);
    await page.keyboard.press('Control+k');
    const paletteInput = page.locator('input[placeholder="Search steps or choose an action…"]');
    await expect(paletteInput).toBeFocused();
    await paletteInput.fill('regression test');
    await page.waitForTimeout(50);
    const resultsText = await page.locator('.dialog-enter').innerText();
    expect(resultsText).toContain('regression test');
    const resultButton = page.locator('.dialog-enter button', { hasText: /regression test/i }).first();
    await resultButton.click();
    await expect(page.locator('.dialog-enter')).toHaveCount(0);
    await expect(page.locator('[aria-label="File workspace"]')).toContainText('State after step 5');
  });

  test('1.21 undo_redo_review_edits', async ({ page }) => {
    await openTrialViewer(page);
    await page.locator('#btn-annotate').click();
    await page.getByLabel('Note text').fill('Evidence note for undo/redo coverage.');
    await page.getByRole('button', { name: 'Add note' }).click();
    await expect(page.locator('h2', { hasText: /^Annotations/ })).toHaveText('Annotations · 1');
    const undoButton = page.locator('button[title="Undo (Ctrl+Z)"]');
    const redoButton = page.locator('button[title="Redo (Ctrl+Shift+Z)"]');
    await expect(undoButton).toBeEnabled();
    await undoButton.click();
    await expect(page.locator('h2', { hasText: /^Annotations/ })).toHaveText('Annotations · 0');
    await expect(redoButton).toBeEnabled();
    await redoButton.click();
    await expect(page.locator('h2', { hasText: /^Annotations/ })).toHaveText('Annotations · 1');
  });

  test('1.22 review_package_export_reflects_session', async ({ page }) => {
    await openTrialViewer(page);
    await page.locator('#btn-annotate').click();
    await page.getByLabel('Note text').fill('Concrete evidence tied to this step.');
    await page.getByRole('button', { name: 'Add note' }).click();
    await page.locator('#btn-export').click();
    const preview = await page.locator('pre').first().innerText();
    const pkg = JSON.parse(preview);
    expect(pkg.schemaVersion).toBe('trajectory-viewer.review-package.v1');
    expect(pkg.annotations.some((a) => a.note_text === 'Concrete evidence tied to this step.')).toBe(true);
    expect(Object.keys(pkg)).toEqual(expect.arrayContaining([
      'schemaVersion', 'exportedAt', 'trial_id', 'task_id', 'model', 'reward',
      'outcome', 'duration', 'step_count', 'annotations', 'failure_report',
    ]));
  });

  test('1.24 annotation_edit_updates_in_place', async ({ page }) => {
    await openTrialViewer(page);
    await page.locator('#btn-annotate').click();
    await page.getByLabel('Note text').fill('Original note text for edit test.');
    await page.getByRole('button', { name: 'Add note' }).click();
    await page.getByRole('button', { name: /Edit/ }).first().click();
    const editField = page.locator('textarea#edit-note-0');
    await editField.fill('Updated note text after edit.');
    await page.getByRole('button', { name: 'Save note' }).click();
    const annotationsSection = page.locator('section', { hasText: 'Annotations' }).first();
    await expect(annotationsSection).toContainText('Updated note text after edit.');
    await expect(annotationsSection).not.toContainText('Original note text for edit test.');
  });
});

test('6.10 invalid_create_shows_inline_validation', async ({ page }) => {
  await page.goto(BASE);
  await page.getByRole('button', { name: /Config recovery/i }).click();
  await page.getByRole('button', { name: /Larkspur-9 task-config-recovery/i }).click();
  await expect(page.getByRole('heading', { name: 'Trial Viewer' })).toBeAttached();

  await page.getByRole('button', { name: 'Annotate' }).click();
  await page.getByLabel('Note text').fill('Out-of-range step regression');
  await page.getByLabel('Step index').fill('99');
  await page.getByRole('button', { name: 'Add note' }).click();

  await expect(page.getByText(/step_index: step_index must exist on the active trial/)).toBeVisible();
  await expect(page.getByText('Annotations · 0')).toBeVisible();
});
