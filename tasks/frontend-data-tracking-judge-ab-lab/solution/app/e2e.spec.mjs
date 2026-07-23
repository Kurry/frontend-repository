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

// Fresh loads always show the guided onboarding tour overlay (store's
// `onboarded` flag defaults to false); every task-specific test must clear
// it before interacting with the app underneath.
async function skipTour(page) {
  await page.getByRole('button', { name: 'Skip tour' }).click();
}

// The default Compare pair (Baseline vs Rubric v2) has a designed zero-flip
// trial (the seed deliberately clones Baseline's criteria onto Rubric v2 for
// the last trial). Walk the paired rows until one that actually opens with
// verdict flips is found so drill-down tests have real fixture data instead
// of assuming a specific row index.
async function openTrialWithFlips(page) {
  const rows = page.locator('.paired-card .lab-row');
  const count = await rows.count();
  for (let i = 0; i < count; i += 1) {
    await rows.nth(i).click();
    const hasFlips = await page.locator('.diff-groups').count();
    if (hasFlips > 0) return;
    await page.keyboard.press('Escape');
  }
  throw new Error('no paired trial with verdict flips found under the default Baseline/Rubric v2 pair');
}

test.describe('rescore A/B lab (task-specific)', () => {
  test('1.1 seeded_dataset_present', async ({ page }) => {
    await page.goto('/');
    await skipTour(page);
    const rows = page.locator('.table-card .lab-row');
    await expect(rows, 'exactly 12 seeded trial rows').toHaveCount(12);
    const taskNames = new Set();
    for (let i = 0; i < 12; i += 1) {
      taskNames.add(await rows.nth(i).locator('.trial-cell span').innerText());
    }
    expect(taskNames.size, 'exactly 4 distinct benchmark tasks').toBe(4);
    const picker = page.locator('[aria-label="Choose visible label columns"]');
    await picker.click();
    await expect(page.getByRole('option'), 'label picker offers exactly 4 labels').toHaveCount(4);
  });

  test('1.3 label_column_switch_no_reload', async ({ page }) => {
    await page.addInitScript(() => { window.__noReloadMarker = 'still-here'; });
    await page.goto('/');
    await skipTour(page);
    const headers = page.locator('.table-card thead th');
    await expect(headers, 'Harness r8 is not a default shown column').not.toContainText(['Harness r8']);
    const picker = page.locator('[aria-label="Choose visible label columns"]');
    await picker.click();
    await page.getByRole('option', { name: 'Harness r8' }).click();
    await page.keyboard.press('Escape');
    await expect(headers, 'newly picked label column appears').toContainText(['Harness r8']);
    const marker = await page.evaluate(() => window.__noReloadMarker);
    expect(marker, 'window state survived — no full page reload occurred').toBe('still-here');
  });

  test('1.4 sort_and_filter_recompute_rows', async ({ page }) => {
    await page.goto('/');
    await skipTour(page);
    const rows = page.locator('.table-card .lab-row');
    await expect(rows).toHaveCount(12);
    const chip = page.getByRole('button', { name: 'canvas-paint-studio' });
    await chip.click();
    await expect(chip, 'active chip is visibly marked').toHaveAttribute('aria-pressed', 'true');
    await expect(rows, 'per-task chip narrows to exactly that task\'s 3 trials').toHaveCount(3);
    for (let i = 0; i < 3; i += 1) {
      await expect(rows.nth(i).locator('.trial-cell span')).toHaveText('canvas-paint-studio');
    }
    await page.getByRole('button', { name: 'Clear all filters' }).click();
    await expect(rows, 'clearing filters restores exactly 12 rows').toHaveCount(12);
    await expect(chip).toHaveAttribute('aria-pressed', 'false');
    const firstAsc = await rows.first().locator('.trial-cell strong').innerText();
    await page.getByRole('button', { name: /Trial and task/ }).click();
    const firstDesc = await rows.first().locator('.trial-cell strong').innerText();
    expect(firstDesc, 'sorting the other direction reverses row order').not.toBe(firstAsc);
  });

  test('1.6 compare_paired_delta_table', async ({ page }) => {
    await page.goto('/');
    await skipTour(page);
    await page.getByRole('button', { name: 'Compare', exact: true }).click();
    const rows = page.locator('.paired-card .lab-row');
    await expect(rows, 'every trial with results under both A and B labels').toHaveCount(12);
    const delta = rows.first().locator('.delta');
    await expect(delta).toBeVisible();
    const cls = await delta.getAttribute('class');
    expect(cls, 'delta carries a direction class').toMatch(/positive|negative|neutral/);
    const glyph = await delta.locator('span').first().innerText();
    expect(['▲', '▼', '→'], 'delta carries a direction glyph, not color alone').toContain(glyph);
  });

  test('1.9 criterion_diff_groups_by_dimension', async ({ page }) => {
    await page.goto('/');
    await skipTour(page);
    await page.getByRole('button', { name: 'Compare', exact: true }).click();
    await openTrialWithFlips(page);
    const groupTitles = page.locator('.diff-group .diff-group-title h3');
    await expect(groupTitles, 'three visibly distinct diff groups').toHaveCount(3);
    const titles = await groupTitles.allInnerTexts();
    expect(titles.some((t) => /Failing only under/.test(t))).toBe(true);
    expect(titles.some((t) => /Agreements/.test(t))).toBe(true);
    const dimHeaders = await page.locator('.dimension-block h4').allInnerTexts();
    expect(dimHeaders.length, 'criteria are grouped under dimension sub-headings').toBeGreaterThan(0);
    for (const heading of dimHeaders) {
      expect(['correctness', 'visual', 'motion', 'technical']).toContain(heading);
    }
  });

  test('1.10 flip_reasoning_side_by_side', async ({ page }) => {
    await page.goto('/');
    await skipTour(page);
    await page.getByRole('button', { name: 'Compare', exact: true }).click();
    await openTrialWithFlips(page);
    const flip = page.locator('.flip-row').first();
    const expander = flip.locator('.flip-expander');
    await expect(expander).toHaveAttribute('aria-expanded', 'false');
    const panels = flip.locator('.reasoning-inner > div');
    await expander.click();
    await expect(expander, 'activating the flip row expands it').toHaveAttribute('aria-expanded', 'true');
    await expect(panels, 'both labels reasoning shown side by side').toHaveCount(2);
    const panelLabels = await panels.locator('span').allInnerTexts();
    expect(panelLabels.map((label) => label.toLowerCase())).toEqual(['baseline', 'rubric v2']);
    const reasoningA = await panels.nth(0).locator('p').innerText();
    const reasoningB = await panels.nth(1).locator('p').innerText();
    expect(reasoningA.length, 'A reasoning snippet is real text').toBeGreaterThan(10);
    expect(reasoningB.length, 'B reasoning snippet is real text').toBeGreaterThan(10);
    await expander.click();
    await expect(expander, 'activating again collapses it').toHaveAttribute('aria-expanded', 'false');
  });

  test('1.11 attribution_form_validates_and_tags', async ({ page }) => {
    await page.goto('/');
    await skipTour(page);
    await page.getByRole('button', { name: 'Compare', exact: true }).click();
    await openTrialWithFlips(page);
    const flip = page.locator('.flip-row').first();
    await flip.getByRole('button', { name: 'Attribute' }).click();
    const drawer = page.getByRole('dialog', { name: 'Attribute verdict flip' });
    await expect(drawer).toBeVisible();
    await drawer.getByRole('button', { name: 'Save attribution' }).click();
    await expect(drawer.getByText(/cause: choose/i), 'inline message names the cause field').toBeVisible();
    await expect(flip.locator('.badge-cause'), 'nothing saved with no cause').toHaveCount(0);
    await drawer.getByLabel('Cause').click();
    await page.getByRole('option', { name: 'Rubric change effect' }).click();
    await drawer.getByRole('button', { name: 'Save attribution' }).click();
    await expect(drawer, 'drawer closes after a valid save').toBeHidden();
    await expect(flip.locator('.badge-cause'), 'flip row visibly tagged').toHaveText('Rubric change effect');
    const rubricCount = page.locator('.rollup-counts div', { hasText: 'rubric' }).locator('strong');
    await expect(rubricCount, 'per-cause rollup count increments by exactly one').toHaveText('1');
    // reopen and change the cause
    await flip.getByRole('button', { name: 'Edit attribution' }).click();
    await drawer.getByLabel('Cause').click();
    await page.getByRole('option', { name: 'Scorer noise' }).click();
    await drawer.getByRole('button', { name: 'Save attribution' }).click();
    await expect(flip.locator('.badge-cause'), 'cause can be changed by reopening the form').toHaveText('Scorer noise');
  });

  test('1.13 rescore_form_unique_label_validation', async ({ page }) => {
    await page.goto('/');
    await skipTour(page);
    await page.getByRole('button', { name: 'Rescore with new label' }).click();
    const modal = page.getByRole('dialog');
    await modal.getByLabel('Label name').fill('baseline');
    await modal.getByLabel('Scorer model').click();
    await page.getByRole('option', { name: 'Sable 4' }).click();
    await modal.getByRole('button', { name: 'Start rescore' }).click();
    await expect(modal.getByText(/labelName: must be unique/i), 'inline message names the label field').toBeVisible();
    await expect(page.getByText('Live rescore'), 'no run started for a duplicate name').toHaveCount(0);
    await modal.getByLabel('Scorer model').click();
    const options = page.getByRole('option');
    await expect(options, 'scorer model select offers exactly the three fictional models').toHaveCount(3);
    const names = await options.allInnerTexts();
    expect(names.sort()).toEqual(['Onyx Pro', 'Quartz Mini', 'Sable 4']);
  });

  test('1.19 self_compare_blocked_and_designed_states', async ({ page }) => {
    await page.goto('/');
    await skipTour(page);
    await page.getByRole('button', { name: 'Compare', exact: true }).click();
    const bSelect = page.getByLabel('Select label B');
    await expect(bSelect).toHaveValue('Rubric v2');
    await bSelect.click();
    await page.getByRole('option', { name: 'Baseline' }).click();
    await expect(page.locator('.pair-error'), 'self-comparison is rejected with a visible message').toContainText(/already selected on the other side/i);
    await expect(bSelect, 'the rejected selection does not apply — B keeps its prior label').toHaveValue('Rubric v2');
    await expect(page.locator('.paired-card'), 'no self-comparison table ever renders').toHaveCount(1);
    // designed no-flips agreement state (trial-012 is the deliberately zero-flip seeded trial)
    const zeroFlipRow = page.locator('.paired-card .lab-row', { hasText: 'trial-012' });
    await zeroFlipRow.click();
    await expect(page.getByText('These two labels fully agree on this trial')).toBeVisible();
    await expect(page.locator('.diff-groups')).toHaveCount(0);
  });

  test('1.20 lab_results_api_shaped_field_contract', async ({ page }) => {
    await page.goto('/');
    await skipTour(page);
    await page.getByRole('button', { name: 'Export lab results' }).click();
    const pre = page.getByLabel('Live lab results JSON preview');
    const doc = JSON.parse(await pre.innerText());
    expect(doc.schemaVersion).toBe('rescore-ab-lab-v1');
    expect(doc.labels.length).toBe(4);
    expect(doc.trials.length).toBe(12);
    expect(Array.isArray(doc.attributions)).toBe(true);
    expect(Array.isArray(doc.savedPairs)).toBe(true);
    expect(() => new Date(doc.generatedAt).toISOString()).not.toThrow();
    const label0 = doc.labels[0];
    expect(label0).toHaveProperty('scorerModel');
    expect(label0).toHaveProperty('meanReward');
    expect(label0).toHaveProperty('totalCost');
    const trial0 = doc.trials[0];
    expect(trial0).toHaveProperty('taskName');
    const res = trial0.results[label0.name];
    expect(res).toHaveProperty('totalReward');
    expect(res).toHaveProperty('pass');
    expect(res.criteria.length, 'exactly 16 per-criterion verdicts').toBe(16);
  });

  test('1.12 undo_redo_and_command_palette', async ({ page }) => {
    await page.goto('/');
    await skipTour(page);
    await page.getByRole('button', { name: 'Compare', exact: true }).click();
    await openTrialWithFlips(page);
    const flip = page.locator('.flip-row').first();
    const dialog = page.getByRole('dialog').filter({ hasText: 'Criterion verdict diff' });
    const undoBtn = dialog.getByRole('button', { name: 'Undo attribution save' });
    const redoBtn = dialog.getByRole('button', { name: 'Redo attribution save' });
    await expect(undoBtn, 'undo starts disabled with nothing to undo').toBeDisabled();
    await flip.getByRole('button', { name: 'Attribute' }).click();
    const drawer = page.getByRole('dialog', { name: 'Attribute verdict flip' });
    await drawer.getByLabel('Cause').click();
    await page.getByRole('option', { name: 'Scorer noise' }).click();
    await drawer.getByRole('button', { name: 'Save attribution' }).click();
    await expect(flip.locator('.badge-cause')).toBeVisible();
    await expect(undoBtn).toBeEnabled();
    await undoBtn.click();
    await expect(flip.locator('.badge-cause'), 'undo removes the tag').toHaveCount(0);
    await expect(redoBtn).toBeEnabled();
    await redoBtn.click();
    await expect(flip.locator('.badge-cause'), 'redo restores the tag').toBeVisible();
    await page.keyboard.press('Escape');

    await page.keyboard.press('Control+k');
    const search = page.getByPlaceholder(/Type a view/);
    await expect(search, 'Control-K opens the command palette').toBeVisible();
    await search.fill('cost');
    await page.getByRole('option', { name: /Go to Cost/ }).click();
    await expect(page.getByRole('heading', { name: 'Cost', exact: true }), 'choosing Cost switches views').toBeVisible();
    await expect(search, 'choosing a destination closes the palette').toHaveCount(0);
  });

  test('4.2 rescore_and_attribution_inline_validation', async ({ page }) => {
    await page.goto('/');
    await skipTour(page);
    await page.getByRole('button', { name: 'Compare', exact: true }).click();
    await openTrialWithFlips(page);
    const flip = page.locator('.flip-row').first();
    await flip.getByRole('button', { name: 'Attribute' }).click();
    const drawer = page.getByRole('dialog', { name: 'Attribute verdict flip' });
    await drawer.getByLabel('Cause').click();
    await page.getByRole('option', { name: 'Scorer noise' }).click();
    await drawer.getByLabel('Note').fill('x'.repeat(201));
    await drawer.getByRole('button', { name: 'Save attribution' }).click();
    await expect(drawer.getByText(/note: use 200 characters or fewer/i), 'inline message names the note field').toBeVisible();
    await expect(drawer, 'form stays open — nothing saved').toBeVisible();
    await expect(flip.locator('.badge-cause'), 'overlong note saves nothing').toHaveCount(0);
  });

  test('1.18 config_block_copy_confirmation', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await skipTour(page);
    await page.getByRole('button', { name: 'Cost', exact: true }).click();
    const card = page.locator('.config-card').first();
    await card.getByRole('button', { name: 'Copy config' }).click();
    await expect(card.getByRole('button', { name: 'Copied the exact block' }), 'visible copy confirmation').toBeVisible();
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    const blockText = await card.locator('pre').innerText();
    expect(clipboardText, 'clipboard holds exactly the block text').toBe(blockText);
  });
});
