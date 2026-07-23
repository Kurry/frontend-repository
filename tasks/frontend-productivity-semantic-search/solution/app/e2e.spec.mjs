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

test.describe('task-specific criteria', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  const runQuery = async (page, raw) => {
    await page.getByRole('searchbox', { name: 'Search the knowledge library' }).fill(raw);
    await page.getByRole('button', { name: 'Search library' }).click();
    await page.waitForTimeout(250);
  };

  const openModal = (page) => page.locator('.cds--modal.is-visible');

  test('1.1 seeded_corpus_and_index_stats', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Index' }).click();
    const statValue = (label) => page.locator('.stat', { hasText: label }).locator('strong').innerText();
    await expect.poll(() => statValue('Documents')).toBe('120');
    expect(await statValue('Stale')).toBe('0');
    const distinctTerms = Number(await statValue('Distinct terms'));
    expect(distinctTerms, 'distinct term count reflects a real built index').toBeGreaterThan(50);
    const lastBuild = await statValue('Last build');
    expect(lastBuild.trim().length, 'last build time renders').toBeGreaterThan(0);
    // 120 rows in the document list, spanning realistic titles across topics/types.
    await expect(page.locator('.doc-row')).toHaveCount(120);
    await expect(page.locator('.doc-row-title', { hasText: 'Foundations: React guide' })).toHaveCount(1);
    await expect(page.locator('.doc-row-title', { hasText: 'Foundations: Data engineering study' })).toHaveCount(1);
  });

  test('1.2 ranked_result_card_anatomy', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await runQuery(page, 'react hooks');
    const card = page.locator('.result-card').first();
    await expect(card.locator('.card-title')).not.toBeEmpty();
    // type tag + at least one topic tag
    await expect(card.locator('.meta-row .cds--tag')).not.toHaveCount(0);
    const badgeText = await card.locator('.score-badge').innerText();
    expect(badgeText, 'score badge is a monospace 0.00-1.00 value').toMatch(/^\d\.\d\d$/);
    const score = Number(badgeText);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
    // the excerpt's most relevant passage is highlighted
    await expect(card.locator('.snippet mark').first()).toBeVisible();
  });

  test('1.3 descending_order_and_determinism', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await runQuery(page, 'react');
    const badges1 = (await page.locator('.score-badge').allInnerTexts()).map(Number);
    expect(badges1.length).toBeGreaterThan(1);
    for (let i = 1; i < badges1.length; i++) {
      expect(badges1[i], 'results sorted by score descending').toBeLessThanOrEqual(badges1[i - 1]);
    }
    const ids1 = await page.locator('.result-card').evaluateAll((els) => els.map((e) => e.dataset.resultId));
    // re-run the identical query — same corpus/threshold/feedback must reproduce order
    await page.getByRole('button', { name: 'Search library' }).click();
    await page.waitForTimeout(250);
    const ids2 = await page.locator('.result-card').evaluateAll((els) => els.map((e) => e.dataset.resultId));
    expect(ids2).toEqual(ids1);
  });

  test('1.4 syntax_chips_parse_and_combine', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await runQuery(page, 'react tag:react type:guide');
    const chipTexts = await page.locator('.filter-chip').allInnerTexts();
    expect(chipTexts.map((t) => t.trim())).toEqual(expect.arrayContaining([
      expect.stringContaining('tag:react'),
      expect.stringContaining('type:guide'),
    ]));
    expect(chipTexts.length).toBe(2);
    // combined filters narrow the corpus (React x guide = 15 docs) while the free-text
    // term keeps semantic ranking active (visible count reflects the combination).
    const count = await page.locator('.result-card').count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(120);
    const countLabel = await page.locator('.result-summary strong').first().innerText();
    expect(Number(countLabel)).toBe(count);
  });

  test('1.6 threshold_slider_filters_live', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await runQuery(page, 'quality');
    const before = await page.locator('.result-card').count();
    const slider = page.getByRole('slider', { name: 'Minimum score' });
    await slider.focus();
    // raise the threshold by 3 x 0.05 increments without re-running the query
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(250);
    const sliderValue = await page.locator('.slider-value').innerText();
    expect(sliderValue).toBe('0.35');
    const after = await page.locator('.result-card').count();
    expect(after, 'raising the threshold live-filters the visible cards').toBeLessThan(before);
    const badges = (await page.locator('.score-badge').allInnerTexts()).map(Number);
    for (const score of badges) expect(score).toBeGreaterThanOrEqual(0.35);
  });

  test('1.7 feedback_reranks_persists_and_resets', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await runQuery(page, 'react');
    const idsBefore = await page.locator('.result-card').evaluateAll((els) => els.map((e) => e.dataset.resultId));
    const topId = idsBefore[0];
    // thumbs-down the current top card
    await page.locator('.result-card').first().locator('.icon-control').nth(1).click();
    await page.waitForTimeout(300);
    const idsAfter = await page.locator('.result-card').evaluateAll((els) => els.map((e) => e.dataset.resultId));
    expect(idsAfter[0], 'downvoting the top card demotes it from first place').not.toBe(topId);
    // the demoted card is visibly marked
    const demotedCard = page.locator(`.result-card[data-result-id="${topId}"]`);
    await expect(demotedCard.locator('.feedback-chip')).toHaveText('Feedback: down');
    // re-running the same query reproduces the adjusted ranking
    await page.getByRole('button', { name: 'Search library' }).click();
    await page.waitForTimeout(300);
    const idsRerun = await page.locator('.result-card').evaluateAll((els) => els.map((e) => e.dataset.resultId));
    expect(idsRerun).toEqual(idsAfter);
    // Reset feedback restores the original order
    await page.getByRole('button', { name: 'Reset feedback' }).click();
    await page.waitForTimeout(300);
    const idsReset = await page.locator('.result-card').evaluateAll((els) => els.map((e) => e.dataset.resultId));
    expect(idsReset).toEqual(idsBefore);
  });

  test('1.9 keyword_fallback_labeled', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // "commend" only appears as a substring of "recommended" (never its own token),
    // and pairing it with a term absent from the corpus dilutes every doc's semantic
    // coverage below the 0.2 floor — this deterministically forces the keyword path.
    await runQuery(page, 'commend zzznonexistentword');
    const heading = await page.locator('.result-summary h2').innerText();
    expect(heading).toBe('Keyword results (no semantic matches above threshold)');
    await expect(page.locator('.fallback-label')).toBeVisible();
    const count = await page.locator('.result-card').count();
    expect(count, 'fallback still surfaces matching cards').toBeGreaterThan(0);
    // fallback cards still show the matched words via the highlighted excerpt
    await expect(page.locator('.snippet mark').first()).toBeVisible();
  });

  test('1.11 detail_panel_related_and_breadcrumbs', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await runQuery(page, 'react');
    await page.locator('.card-main').first().click();
    await page.waitForTimeout(250);
    await expect(page.locator('.detail-panel .full-body')).toBeVisible();
    const relatedRows = page.locator('.related-row');
    await expect(relatedRows).toHaveCount(3);
    const relatedScores = await page.locator('.related-score').allInnerTexts();
    expect(new Set(relatedScores).size, 'related documents have differing similarity values').toBeGreaterThan(1);
    const origTitle = await page.locator('.detail-head h2').innerText();
    await relatedRows.first().click();
    await page.waitForTimeout(250);
    const newTitle = await page.locator('.detail-head h2').innerText();
    expect(newTitle).not.toBe(origTitle);
    await expect(page.locator('.breadcrumb')).toHaveCount(1);
    await page.locator('.breadcrumb').first().click();
    await page.waitForTimeout(250);
    const backTitle = await page.locator('.detail-head h2').innerText();
    expect(backTitle).toBe(origTitle);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await expect(page.locator('.detail-panel')).toHaveCount(0);
  });

  test('1.12 command_palette_fuzzy_and_keyboard', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(200);
    await expect(page.locator('.palette')).toBeVisible();
    // fresh load: 4 commands + 0 saved searches + 120 docs, capped at 40 entries
    await expect(page.locator('.palette-item')).toHaveCount(40);
    await expect(page.locator('.palette-item').first()).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.palette-item').nth(2)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.palette-item').first()).toHaveAttribute('aria-selected', 'false');
    // fuzzy matching narrows on every keystroke (a longer needle can only shrink the set)
    const input = page.locator('.palette-input');
    await input.pressSequentially('a');
    await page.waitForTimeout(100);
    const afterA = await page.locator('.palette-item').count();
    expect(afterA).toBeLessThanOrEqual(40);
    await input.fill('add document');
    await page.waitForTimeout(150);
    const finalItems = await page.locator('.palette-item').allInnerTexts();
    expect(finalItems.length).toBeLessThanOrEqual(afterA);
    expect(finalItems.some((t) => t.includes('Add document'))).toBe(true);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(250);
    await expect(page.locator('.palette')).toHaveCount(0);
    await expect(openModal(page).locator('.cds--modal-header__heading')).toHaveText('Add document');
  });

  test('1.15 save_search_validation_and_rerun', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await runQuery(page, 'react');
    await page.getByRole('button', { name: 'Save search' }).click();
    await page.waitForTimeout(200);
    const saveBtn = openModal(page).getByRole('button', { name: 'Save search' });
    await expect(saveBtn, 'Save is disabled while the name is empty').toBeDisabled();
    const nameInput = page.locator('#saved-name');
    await nameInput.fill('regression check');
    await expect(saveBtn).toBeEnabled();
    await nameInput.fill('');
    await page.waitForTimeout(150);
    await expect(saveBtn, 'clearing the name re-disables Save').toBeDisabled();
    await expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    await expect(openModal(page)).toContainText('name is required');
    await nameInput.fill('regression check');
    await saveBtn.click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Saved' }).click();
    await expect(page.locator('.saved-item', { hasText: 'regression check' })).toBeVisible();
    // clicking the saved search re-runs it, restoring its chips/threshold
    await page.locator('.saved-item', { hasText: 'regression check' }).click();
    await page.waitForTimeout(300);
    await expect(page.locator('.result-summary')).toBeVisible();
    // Delete requires confirmation — dismiss it first, entry must remain
    page.once('dialog', (dialog) => dialog.dismiss());
    await page.getByRole('button', { name: 'Saved' }).click();
    await page.locator('.saved-item', { hasText: 'regression check' }).getByRole('button').click();
    await page.waitForTimeout(200);
    await expect(page.locator('.saved-item', { hasText: 'regression check' })).toBeVisible();
    page.once('dialog', (dialog) => dialog.accept());
    await page.locator('.saved-item', { hasText: 'regression check' }).getByRole('button').click();
    await page.waitForTimeout(200);
    await expect(page.locator('.saved-item', { hasText: 'regression check' })).toHaveCount(0);
  });

  test('1.18 add_document_validates_and_marks_stale', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Index' }).click();
    const statValue = (label) => page.locator('.stat', { hasText: label }).locator('strong').innerText();
    const staleBefore = Number(await statValue('Stale'));
    const totalBefore = Number(await statValue('Documents'));
    await page.getByRole('button', { name: 'Add document' }).click();
    await page.waitForTimeout(200);
    const addBtn = openModal(page).getByRole('button', { name: 'Add document' });
    await expect(addBtn, 'Add is disabled until required fields are valid').toBeDisabled();
    await page.locator('#doc-title').fill('Regression coverage test doc');
    await page.locator('#doc-body').fill('short body');
    await page.waitForTimeout(150);
    await expect(addBtn, 'body under 20 characters keeps Add disabled').toBeDisabled();
    await expect(openModal(page)).toContainText(/body/i);
    await page.locator('#doc-body').fill('a sufficiently long body describing regression coverage for validation purposes');
    await page.waitForTimeout(150);
    await expect(addBtn).toBeEnabled();
    await addBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('.doc-row-title', { hasText: 'Regression coverage test doc' })).toBeVisible();
    expect(Number(await statValue('Documents'))).toBe(totalBefore + 1);
    expect(Number(await statValue('Stale')), 'stale count increases by exactly one').toBe(staleBefore + 1);
    // the new document is stale and must not appear in search before a rebuild
    await runQuery(page, 'Regression coverage test doc');
    await expect(page.locator('.card-title', { hasText: 'Regression coverage test doc' })).toHaveCount(0);
  });

  test('1.25 export_report_live_and_copyable', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await runQuery(page, 'react');
    await page.getByRole('button', { name: 'Export' }).click();
    await page.waitForTimeout(200);
    const jsonText = await page.locator('.json-preview').innerText();
    const value = JSON.parse(jsonText);
    expect(value.schemaVersion).toBe(1);
    expect(value.generatedAt.endsWith('Z')).toBe(true);
    expect(value.request).toMatchObject({ query: 'react', filters: [], threshold: 0.2 });
    expect(value.results.length).toBeGreaterThan(0);
    const cardCount = await page.locator('.result-card').count();
    expect(value.results.length).toBe(cardCount);
    for (const hit of value.results) {
      expect(hit).toEqual(expect.objectContaining({
        id: expect.any(String),
        title: expect.any(String),
        type: expect.stringMatching(/^(guide|reference|prompt|checklist|paper|note)$/),
        score: expect.any(Number),
        snippet: expect.any(String),
        highlights: expect.any(Array),
        feedback: expect.stringMatching(/^(up|down|none)$/),
      }));
      expect(Number(hit.score.toFixed(2))).toBe(hit.score);
    }
    const firstBadge = await page.locator('.score-badge').first().innerText();
    expect(value.results[0].score.toFixed(2)).toBe(firstBadge);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download report' }).click(),
    ]);
    expect(download.suggestedFilename()).toBe('semantic-search-report.json');
    await page.getByRole('button', { name: 'Copy report' }).click();
    await page.waitForTimeout(200);
    await expect(page.locator('.cds--toast-notification__title')).toHaveText('Search report copied');
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toBe(jsonText);
  });

  test('10.3 reload_resets_to_seed', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await runQuery(page, 'react');
    const slider = page.getByRole('slider', { name: 'Minimum score' });
    await slider.focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(150);
    await page.locator('.result-card').first().locator('.icon-control').first().click();
    await page.waitForTimeout(200);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('searchbox', { name: 'Search the knowledge library' })).toHaveValue('');
    await expect(page.locator('.result-summary')).toHaveCount(0);
    await page.getByRole('button', { name: 'Index' }).click();
    const statValue = (label) => page.locator('.stat', { hasText: label }).locator('strong').innerText();
    expect(await statValue('Documents')).toBe('120');
    expect(await statValue('Stale')).toBe('0');
    await page.getByRole('button', { name: 'History' }).click();
    await expect(page.locator('.rail-empty')).toBeVisible();
    await page.getByRole('button', { name: 'Saved' }).click();
    await expect(page.locator('.rail-empty')).toBeVisible();
  });
});
