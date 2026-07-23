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

// Every fresh load opens the "Getting started" onboarding tour (App renders
// <Onboarding /> with onboardingStep: 0 by default) which sits in an overlay
// that intercepts pointer events on the whole app; every criterion test must
// dismiss it before interacting with the workspace underneath.
async function boot(page) {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Skip tour' }).click();
}

// Moves the safety-01 seeded item through a full valid annotation: thumbs up,
// all three rubric sliders touched (moving off the untouched "3" via one
// ArrowRight keypress lands each on 4 and flips draft.touchedScores true).
async function fillValidAnnotation(page) {
  await page.getByRole('button', { name: 'Up', exact: true }).click();
  for (const key of ['Accuracy', 'Clarity', 'Relevance']) {
    const thumb = page.locator(`#safety-01-${key}`);
    await thumb.focus();
    await page.keyboard.press('ArrowRight');
  }
}

test.describe('creative-tools-annotation-studio criteria', () => {
  test('1.1 seeded_queue_groups_and_badges', async ({ page }) => {
    await boot(page);
    const suiteRows = page.locator('.suite-row');
    await expect(suiteRows).toHaveCount(3);
    const names = await page.locator('.suite-row strong').allTextContents();
    expect(names).toEqual(['Safety & Policy', 'Reasoning Quality', 'Visual Grounding']);
    // Every suite has 12 seeded items with 2 pre-labeled, so the remaining
    // badge (unlabeled count) must read a positive number on every suite.
    const badges = await page.locator('.suite-row .badge-pulse').allTextContents();
    expect(badges).toHaveLength(3);
    for (const badge of badges) expect(Number(badge)).toBeGreaterThan(0);
  });

  test('1.4 select_all_and_bulk_bar_count', async ({ page }) => {
    await boot(page);
    await expect(page.locator('.bulk-bar')).toHaveCount(0);
    await page.locator('label[for="select-safety-01"]').click();
    await expect(page.locator('.bulk-bar strong')).toHaveText('1 selected');
    await page.locator('label[for="select-all-safety"]').click();
    const remaining = await page.locator('.suite-row.active .badge-pulse').innerText();
    await expect(page.locator('.bulk-bar strong')).toHaveText(`${remaining} selected`);
    // Unchecking select-all clears every checkbox and the bar disappears.
    await page.locator('label[for="select-all-safety"]').click();
    await expect(page.locator('.bulk-bar')).toHaveCount(0);
  });

  test('1.5 bulk_skip_moves_all_selected', async ({ page }) => {
    await boot(page);
    const badgeBefore = Number(await page.locator('.suite-row.active .badge-pulse').innerText());
    await page.locator('label[for="select-safety-01"]').click();
    await page.locator('label[for="select-safety-02"]').click();
    await expect(page.locator('.bulk-bar strong')).toHaveText('2 selected');
    await page.getByRole('button', { name: 'Skip selected' }).click();
    // Skip never removes items from the unlabeled queue, so the remaining
    // badge is unchanged, but a skipped-count marker appears on the suite.
    await expect(page.locator('.suite-row.active .badge-pulse')).toHaveText(String(badgeBefore));
    await expect(page.locator('.suite-row.active em')).toHaveText('2 skipped');
    // The selection is cleared and the bar hidden after the bulk action.
    await expect(page.locator('.bulk-bar')).toHaveCount(0);
    // The two skipped items no longer sit at the front of the queue.
    const firstTwoTitles = await page.locator('.queue-item strong').allTextContents();
    expect(firstTwoTitles.slice(0, 2)).not.toContain('SAF evaluation 01');
  });

  test('1.8 binary_rating_highlight', async ({ page }) => {
    await boot(page);
    const up = page.getByRole('button', { name: 'Up', exact: true });
    const down = page.getByRole('button', { name: 'Down', exact: true });
    await expect(up).toHaveAttribute('aria-pressed', 'false');
    await expect(down).toHaveAttribute('aria-pressed', 'false');
    await up.click();
    await expect(up).toHaveAttribute('aria-pressed', 'true');
    await expect(up).toHaveClass(/selected/);
    await expect(down).toHaveAttribute('aria-pressed', 'false');
    await expect(down).not.toHaveClass(/selected/);
    // Switching moves the highlight rather than allowing both selected.
    await down.click();
    await expect(down).toHaveAttribute('aria-pressed', 'true');
    await expect(down).toHaveClass(/selected/);
    await expect(up).toHaveAttribute('aria-pressed', 'false');
    await expect(up).not.toHaveClass(/selected/);
  });

  test('1.9 rubric_sliders_with_live_values', async ({ page }) => {
    await boot(page);
    const thumb = page.locator('#safety-01-Accuracy');
    const output = page.locator('output[aria-label="Accuracy score"]');
    await expect(thumb).toHaveAttribute('aria-valuenow', '3');
    await expect(output).toHaveText('3');
    await thumb.focus();
    await page.keyboard.press('ArrowRight');
    await expect(thumb).toHaveAttribute('aria-valuenow', '4');
    await expect(output).toHaveText('4');
    await page.keyboard.press('ArrowRight');
    await expect(thumb).toHaveAttribute('aria-valuenow', '5');
    await expect(output).toHaveText('5');
  });

  test('1.10 comments_counter_and_500_cap', async ({ page }) => {
    await boot(page);
    const textarea = page.locator('#safety-01-comment');
    const counter = page.locator('.char-counter');
    await expect(counter).toHaveText('500 remaining');
    await textarea.fill('a'.repeat(120));
    await expect(counter).toHaveText('380 remaining');
    // The field's real maxlength=500 constraint means the app-level slice(0,500)
    // guard is exercised by filling well past the cap.
    await textarea.fill('b'.repeat(600));
    await expect(counter).toHaveText('0 remaining');
    await expect(textarea).toHaveValue('b'.repeat(500));
  });

  test('1.12 submit_gated_on_full_interaction', async ({ page }) => {
    await boot(page);
    const submit = page.getByRole('button', { name: 'Submit & Next' });
    await expect(submit).toBeDisabled();
    await page.getByRole('button', { name: 'Up', exact: true }).click();
    await expect(submit).toBeDisabled();
    await page.locator('#safety-01-Accuracy').focus();
    await page.keyboard.press('ArrowRight');
    await expect(submit).toBeDisabled();
    await page.locator('#safety-01-Clarity').focus();
    await page.keyboard.press('ArrowRight');
    await expect(submit).toBeDisabled();
    await page.locator('#safety-01-Relevance').focus();
    await page.keyboard.press('ArrowRight');
    await expect(submit).toBeEnabled();
  });

  test('1.13 submit_saves_and_advances', async ({ page }) => {
    await boot(page);
    const badgeBefore = Number(await page.locator('.suite-row.active .badge-pulse').innerText());
    await expect(page.locator('.card-header h1')).toHaveText('SAF evaluation 01');
    await fillValidAnnotation(page);
    await page.getByRole('button', { name: 'Submit & Next' }).click();
    await expect(page.locator('.suite-row.active .badge-pulse')).toHaveText(String(badgeBefore - 1));
    // The submitted item leaves the unannotated queue entirely.
    await expect(page.locator('.queue-item', { hasText: 'SAF evaluation 01' })).toHaveCount(0);
    // The card advances to the next unlabeled item without a reload.
    await expect(page.locator('.card-header h1')).toHaveText('SAF evaluation 02');
  });

  test('1.16 command_palette_opens_and_filters', async ({ page }) => {
    await boot(page);
    await expect(page.locator('.command-palette')).toHaveCount(0);
    await page.keyboard.press('Control+k');
    await expect(page.locator('.command-palette')).toBeVisible();
    const search = page.locator('.palette-search input');
    await expect(search).toBeFocused();
    const allOptions = page.locator('.palette-results [role="option"]');
    const initialCount = await allOptions.count();
    await search.fill('Reasoning Quality');
    await page.waitForTimeout(50);
    const filteredCount = await allOptions.count();
    expect(filteredCount).toBeLessThan(initialCount);
    expect(filteredCount).toBeGreaterThan(0);
    const texts = await allOptions.allTextContents();
    expect(texts.every((text) => text.toLowerCase().includes('reasoning'))).toBe(true);
  });

  test('1.21 duplicate_shortcut_validation', async ({ page }) => {
    await boot(page);
    await page.getByRole('button', { name: 'Taxonomy', exact: false }).click();
    await page.getByRole('button', { name: 'New class' }).click();
    await page.locator('#class-name').fill('Overlap Class');
    // Shortcut "1" is already the seeded Person class's shortcut.
    await page.locator('#class-shortcut').fill('1');
    await page.waitForTimeout(150);
    await expect(page.locator('#class-shortcut-error-msg')).toHaveText('Shortcut 1 is already used by Person');
    await expect(page.getByRole('button', { name: 'Save class' })).toBeDisabled();
  });

  test('1.34 review_state_transitions', async ({ page }) => {
    await boot(page);
    await fillValidAnnotation(page);
    await page.getByRole('button', { name: 'Submit & Next' }).click();
    await page.getByRole('button', { name: 'Review queue', exact: true }).click();
    await expect(page.locator('.review-item', { hasText: 'SAF evaluation 01' }).locator('.state-chip')).toHaveText('Labeled');
    await page.locator('.review-item', { hasText: 'SAF evaluation 01' }).getByRole('button', { name: 'Mark reviewed' }).click();
    await expect(page.locator('.review-item', { hasText: 'SAF evaluation 01' }).locator('.state-chip')).toHaveText('Reviewed');
    await page.locator('.review-item', { hasText: 'SAF evaluation 01' }).getByRole('button', { name: 'Dispute', exact: true }).click();
    await page.locator('#dispute-reason').fill('Needs a second pass');
    await page.locator('button[form="dispute-form"]').click();
    await expect(page.locator('.review-item', { hasText: 'SAF evaluation 01' }).locator('.state-chip')).toHaveText('Disputed');
  });

  test('1.48 undo_redo_controls_and_shortcuts', async ({ page }) => {
    await boot(page);
    const undo = page.getByRole('button', { name: 'Undo' });
    const redo = page.getByRole('button', { name: 'Redo' });
    await expect(undo).toBeDisabled();
    await expect(redo).toBeDisabled();
    await fillValidAnnotation(page);
    await page.getByRole('button', { name: 'Submit & Next' }).click();
    await expect(undo).toBeEnabled();
    await expect(redo).toBeDisabled();
    const badgeAfterSubmit = await page.locator('.suite-row', { hasText: 'Safety & Policy' }).locator('.badge-pulse').innerText();
    await page.keyboard.press('Control+z');
    await expect(redo).toBeEnabled();
    // Undo restores the item to the unlabeled queue, so the badge count
    // goes back up by one and Redo becomes available.
    const badgeAfterUndo = Number(await page.locator('.suite-row', { hasText: 'Safety & Policy' }).locator('.badge-pulse').innerText());
    expect(badgeAfterUndo).toBe(Number(badgeAfterSubmit) + 1);
    await expect(page.locator('.queue-item', { hasText: 'SAF evaluation 01' })).toHaveCount(1);
  });

  test('1.54 export_view_labels_package_shape', async ({ page }) => {
    await boot(page);
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    const previewBefore = await page.locator('.export-preview').innerText();
    const parsedBefore = JSON.parse(previewBefore);
    expect(parsedBefore.schemaVersion).toBe('annotation-studio-labels-v1');
    expect(Array.isArray(parsedBefore.taxonomy)).toBe(true);
    expect(Array.isArray(parsedBefore.metadataFields)).toBe(true);
    expect(Array.isArray(parsedBefore.items)).toBe(true);
    expect(parsedBefore.taxonomy[0]).toEqual(expect.objectContaining({ id: expect.any(String), name: expect.any(String), color: expect.any(String), icon: expect.any(String), shortcut: expect.any(String) }));
    const beforeAnnotated = parsedBefore.items.filter((item) => item.annotation !== null).length;
    // Submitting an annotation changes the preview text live, without a reload.
    await page.getByRole('button', { name: 'Annotate', exact: true }).click();
    await fillValidAnnotation(page);
    await page.getByRole('button', { name: 'Submit & Next' }).click();
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    const previewAfter = await page.locator('.export-preview').innerText();
    const parsedAfter = JSON.parse(previewAfter);
    const afterAnnotated = parsedAfter.items.filter((item) => item.annotation !== null).length;
    expect(afterAnnotated).toBe(beforeAnnotated + 1);
  });

  test('1.60 import_rejects_nonconforming_package', async ({ page }) => {
    await boot(page);
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    const taxonomyCountBefore = JSON.parse(await page.locator('.export-preview').innerText()).taxonomy.length;
    await page.getByRole('button', { name: 'Import' }).click();
    await page.locator('#labels-json-import').fill(JSON.stringify({ schemaVersion: 'not-the-right-version', taxonomy: [], metadataFields: [], items: [] }));
    await page.getByRole('button', { name: 'Import Labels JSON' }).click();
    await expect(page.locator('.cds--inline-notification')).toContainText('schemaVersion');
    // The rejected import leaves the taxonomy untouched.
    await page.locator('#labels-json-import').fill('');
    await page.keyboard.press('Escape');
    const preview = JSON.parse(await page.locator('.export-preview').innerText());
    expect(preview.taxonomy.length).toBe(taxonomyCountBefore);
  });

  test('4.3 empty_stacks_disable_undo_redo', async ({ page }) => {
    await boot(page);
    const undo = page.getByRole('button', { name: 'Undo' });
    const redo = page.getByRole('button', { name: 'Redo' });
    await expect(undo).toBeDisabled();
    await expect(redo).toBeDisabled();
    const badgeBefore = await page.locator('.suite-row.active .badge-pulse').innerText();
    // Firing the keyboard shortcuts against empty stacks must not mutate
    // anything or throw (the page fixture asserts zero console errors).
    await page.keyboard.press('Control+z');
    await page.keyboard.press('Control+Shift+z');
    await expect(page.locator('.suite-row.active .badge-pulse')).toHaveText(badgeBefore);
    await expect(undo).toBeDisabled();
    await expect(redo).toBeDisabled();
  });
});
