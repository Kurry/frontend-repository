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

// Dismiss the first-load onboarding overlay (App.jsx OnboardingTour). It is
// modal (role=dialog, aria-modal) and would otherwise intercept every click.
async function dismissOnboarding(page) {
  // The onboarding card sits above its own backdrop and intercepts pointer
  // events there, so target the visible "Skip" button inside the card
  // itself rather than the backdrop's "Skip onboarding" aria-label.
  const skip = page.getByRole('button', { name: 'Skip', exact: true });
  if (await skip.count()) await skip.click();
}

async function openApp(page) {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await dismissOnboarding(page);
}

const ROWS = 'table.library-table tbody tr';

test.describe('frontend-productivity-prompt-library criteria', () => {
  test('1.1 seeded_library_present', async ({ page }) => {
    await openApp(page);
    const rowCount = await page.locator(ROWS).count();
    expect(rowCount, 'at least 15 seeded prompts on load').toBeGreaterThanOrEqual(15);

    const techniqueTexts = await page.locator(`${ROWS} td:nth-child(3)`).allTextContents();
    const distinctTechniques = new Set(techniqueTexts.map((t) => t.trim()));
    expect(distinctTechniques.size, 'at least 5 distinct technique categories').toBeGreaterThanOrEqual(5);

    const badgeCount = await page.locator(`${ROWS} .attachment-badges`).count();
    expect(badgeCount, 'at least 3 seeded rows show attachment badges').toBeGreaterThanOrEqual(3);
  });

  test('1.2 create_prompt_flow', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: 'New Prompt', exact: true }).click();
    const modal = page.locator('.prompt-form-modal');
    await expect(modal).toBeVisible();
    const submitBtn = modal.getByRole('button', { name: 'Create prompt' });
    // The create form must gate the Submit control on validity: empty
    // required fields (title, body, technique) should keep it disabled.
    await expect(submitBtn, 'Submit stays disabled while title/body/technique are incomplete').toBeDisabled();

    await modal.getByLabel('Title').fill('Socratic Debugger Flow');
    await modal.locator('#prompt-body').fill('Ask exactly one clarifying question before proposing any fix.');
    await modal.getByLabel('Technique tag').selectOption('Chain-of-thought');
    await expect(submitBtn, 'Submit enables once title, body, and technique are filled').toBeEnabled();

    const rowsBefore = await page.locator(ROWS).count();
    const countBefore = (await page.locator('.prompt-count').textContent()) || '';
    const totalBefore = Number(countBefore.match(/of (\d+)/)?.[1]);

    await submitBtn.click();
    await expect(modal).toBeHidden();

    const rowsAfter = await page.locator(ROWS).count();
    expect(rowsAfter, 'submitting a valid prompt inserts exactly one row').toBe(rowsBefore + 1);
    const countAfter = (await page.locator('.prompt-count').textContent()) || '';
    const totalAfter = Number(countAfter.match(/of (\d+)/)?.[1]);
    expect(totalAfter, 'toolbar prompt count increases by exactly one').toBe(totalBefore + 1);
  });

  test('1.3 invalid_create_validation', async ({ page }) => {
    await openApp(page);
    const rowsBefore = await page.locator(ROWS).count();
    await page.getByRole('button', { name: 'New Prompt', exact: true }).click();
    const modal = page.locator('.prompt-form-modal');
    // Fill body + technique but leave title empty, then attempt submit.
    await modal.locator('#prompt-body').fill('Body present but title missing.');
    await modal.getByLabel('Technique tag').selectOption('Few-shot');
    await modal.getByRole('button', { name: 'Create prompt' }).click();

    // Modal must stay open and show a validation message naming "Title".
    await expect(modal).toBeVisible();
    const titleError = modal.locator('#prompt-title-error-msg, .cds--form-requirement', { hasText: /Title/i });
    await expect(titleError.first(), 'inline validation message names the title field').toBeVisible();

    const rowsAfter = await page.locator(ROWS).count();
    expect(rowsAfter, 'no row added when title validation fails').toBe(rowsBefore);
  });

  test('1.4 search_narrows_and_restores', async ({ page }) => {
    await openApp(page);
    const totalBefore = await page.locator(ROWS).count();
    const search = page.locator('#prompt-search');
    await search.fill('eighth-grade');
    await expect(page.locator(ROWS)).toHaveCount(1);
    await expect(page.locator(ROWS).first()).toContainText('Rewrite for plain language');
    const narrowedCountText = (await page.locator('.prompt-count').textContent()) || '';
    expect(narrowedCountText).toMatch(new RegExp(`1 of ${totalBefore} prompts`));

    await search.fill('');
    await expect(page.locator(ROWS)).toHaveCount(totalBefore);
  });

  test('1.6 suggestion_chips_apply_exactly', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: 'Support replies' }).click();
    await expect(page.locator('#prompt-search')).toHaveValue('support');
    const searchRows = await page.locator(ROWS).count();
    expect(searchRows, 'search chip narrows the table').toBeGreaterThan(0);
    const visibleTexts = await page.locator(ROWS).allTextContents();
    for (const text of visibleTexts) expect(text.toLowerCase()).toContain('support');

    await page.locator('#prompt-search').fill('');
    await page.getByRole('button', { name: 'Structured output' }).click();
    await expect(page.locator('#technique-filter')).toHaveValue('Structured output');
    const techniqueTexts = await page.locator(`${ROWS} td:nth-child(3)`).allTextContents();
    expect(techniqueTexts.length, 'technique chip narrows the table').toBeGreaterThan(0);
    for (const text of techniqueTexts) expect(text.trim()).toBe('Structured output');
  });

  test('1.7 no_match_empty_state_clear_filters', async ({ page }) => {
    await openApp(page);
    const totalBefore = await page.locator(ROWS).count();
    await page.locator('#prompt-search').fill('zzz-no-such-prompt-zzz');
    await expect(page.locator('.empty-state h2')).toHaveText('No prompts match those filters');
    const clearBtn = page.getByRole('button', { name: 'Clear filters' });
    await expect(clearBtn).toBeVisible();

    await clearBtn.click();
    await expect(page.locator(ROWS)).toHaveCount(totalBefore);
    await expect(page.locator('#prompt-search')).toHaveValue('');
  });

  test('1.8 body_code_block_with_copy', async ({ page }) => {
    await openApp(page);
    await page.locator(ROWS).first().locator('.title-link').click();
    const modal = page.locator('.cds--modal.is-visible');
    await expect(modal.locator('.code-block')).toBeVisible();
    await expect(modal.locator('.format-label')).toHaveText('PLAIN TEXT');
    const bodyText = await modal.locator('.code-block pre').textContent();

    // The button's accessible name flips ("Copy prompt body" -> "Copied")
    // once clicked, so locate it by its stable position in the code block
    // header rather than by role name (which would stop matching itself).
    const copyBtn = modal.locator('.code-block__header button');
    await copyBtn.click();
    // Both flip from the same React state update, so check the fast-clearing
    // button label first (~1.8s window) before reading the proof text.
    const proof = modal.locator('[data-testid="clipboard-body"]');
    await expect(copyBtn, 'button label flips to Copied immediately after Copy').toHaveText('Copied', { timeout: 1000 });
    await expect(proof, 'clipboard proof holds the exact body text after Copy').toHaveText(bodyText || '');

    // Confirmation clears after a moment (store clears copiedKey ~1.8s later).
    await expect(copyBtn).toHaveText('Copy', { timeout: 3000 });
    await expect(proof).toHaveText('', { timeout: 3000 });
  });

  test('1.9 edit_prefilled_updates_row', async ({ page }) => {
    await openApp(page);
    const row = page.locator('tr', { hasText: 'Support reply with examples' });
    const originalBody = await row.locator('.body-preview').textContent();
    await expect(row.locator('.version-button')).toHaveText('v1');

    await row.getByRole('button', { name: 'Edit Support reply with examples' }).click();
    const modal = page.locator('.prompt-form-modal');
    await expect(modal.getByLabel('Title')).toHaveValue('Support reply with examples');
    await expect(modal.getByLabel('Technique tag')).toHaveValue('Few-shot');
    await expect(modal.locator('#prompt-body')).toHaveValue(originalBody || '');

    await modal.locator('#prompt-body').fill(`${originalBody}\n\nAdditional clarifying step.`);
    await modal.getByRole('button', { name: 'Save new version' }).click();
    await expect(modal).toBeHidden();

    await expect(row.locator('.version-button'), 'row version increments after edit, no reload').toHaveText('v2');
  });

  test('1.11 delete_confirm_cancel', async ({ page }) => {
    await openApp(page);
    const row = page.locator('tr', { hasText: 'JSON issue classifier' });
    const rowsBefore = await page.locator(ROWS).count();

    // Cancel path: row survives.
    await row.getByRole('button', { name: 'Delete JSON issue classifier' }).click();
    const deleteModal = page.locator('.cds--modal.is-visible');
    await expect(deleteModal).toContainText('Delete prompt?');
    await deleteModal.getByRole('button', { name: 'Cancel' }).click();
    await expect(deleteModal).toBeHidden();
    await expect(row).toBeVisible();
    expect(await page.locator(ROWS).count()).toBe(rowsBefore);

    // Confirm path: exactly that row is removed.
    await row.getByRole('button', { name: 'Delete JSON issue classifier' }).click();
    await page.locator('.cds--modal.is-visible').getByRole('button', { name: 'Delete prompt' }).click();
    await expect(page.locator('.cds--modal.is-visible')).toBeHidden();
    await expect(row).toHaveCount(0);
    expect(await page.locator(ROWS).count()).toBe(rowsBefore - 1);
  });

  test('1.12 selection_gates_extend_combine', async ({ page }) => {
    await openApp(page);
    const extendBtn = page.getByRole('button', { name: 'Extend' });
    const combineBtn = page.getByRole('button', { name: 'Combine' });
    await expect(extendBtn, 'Extend disabled with 0 selected').toBeDisabled();
    await expect(combineBtn, 'Combine disabled with 0 selected').toBeDisabled();

    // Carbon's Checkbox renders a visually-hidden native input under a
    // clickable <label>; click the label (the real interactive surface)
    // rather than the input itself, which the label intercepts.
    const checkboxLabels = page.locator(`${ROWS} label.cds--checkbox-label`);
    await checkboxLabels.nth(0).click();
    await expect(page.locator(`${ROWS} input[type="checkbox"]`).nth(0)).toBeChecked();
    await expect(extendBtn, 'Extend still disabled with only 1 selected').toBeDisabled();
    await expect(combineBtn, 'Combine still disabled with only 1 selected').toBeDisabled();

    await checkboxLabels.nth(1).click();
    await expect(page.locator(`${ROWS} input[type="checkbox"]`).nth(1)).toBeChecked();
    await expect(extendBtn, 'Extend enabled once 2+ rows selected').toBeEnabled();
    await expect(combineBtn, 'Combine enabled once 2+ rows selected').toBeEnabled();
  });

  test('2.2 no_storage_reload_seeded', async ({ page }) => {
    await openApp(page);
    // Exercise create + search + filter, then check for any storage writes.
    await page.getByRole('button', { name: 'New Prompt', exact: true }).click();
    const modal = page.locator('.prompt-form-modal');
    await modal.getByLabel('Title').fill('Storage Probe Prompt');
    await modal.locator('#prompt-body').fill('Confirms no browser storage is used.');
    await modal.getByLabel('Technique tag').selectOption('Few-shot');
    await modal.getByRole('button', { name: 'Create prompt' }).click();
    await expect(modal).toBeHidden();
    await page.locator('#prompt-search').fill('probe');

    const storageCounts = await page.evaluate(() => ({
      local: window.localStorage.length,
      session: window.sessionStorage.length,
    }));
    expect(storageCounts, 'no localStorage/sessionStorage writes from create/search').toEqual({ local: 0, session: 0 });

    await page.reload();
    await page.waitForLoadState('networkidle');
    await dismissOnboarding(page);
    const rowsAfterReload = await page.locator(ROWS).count();
    expect(rowsAfterReload, 'reload returns to the seeded 16-prompt library').toBe(16);
    await expect(page.locator('#prompt-search'), 'reload clears any active search').toHaveValue('');
    await expect(page.locator('#technique-filter'), 'reload clears any active filter').toHaveValue('all');
  });

  test('2.6 cold_load_interactive_2s', async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE);
    await expect(page.locator('#prompt-search')).toBeEnabled({ timeout: 2000 });
    await expect(page.getByRole('button', { name: 'New Prompt', exact: true })).toBeEnabled({ timeout: 2000 });
    const elapsed = Date.now() - start;
    expect(elapsed, 'search field and New Prompt button respond within 2s of cold load').toBeLessThanOrEqual(2000);
  });

  test('1.28 export_library_json_and_markdown', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: 'New Prompt', exact: true }).click();
    const createModal = page.locator('.prompt-form-modal');
    await createModal.getByLabel('Title').fill('Export Proof Prompt');
    await createModal.locator('#prompt-body').fill('Distinctive body for the export round trip.');
    await createModal.getByLabel('Technique tag').selectOption('Constraint-based');
    await createModal.getByRole('button', { name: 'Create prompt' }).click();
    await expect(createModal).toBeHidden();

    await page.getByRole('button', { name: 'Export library' }).click();
    const exportModal = page.locator('.cds--modal.is-visible');
    await expect(exportModal.locator('.export-loading')).toBeHidden({ timeout: 3000 });

    const jsonText = await exportModal.locator('#export-preview').inputValue();
    const doc = JSON.parse(jsonText);
    expect(doc.schemaVersion).toBe(1);
    expect(doc.product).toBe('Prompt Library');
    expect(doc.generatedAt.endsWith('Z'), 'generatedAt ends in Z').toBe(true);
    const jsonEntry = doc.prompts.find((p) => p.title === 'Export Proof Prompt');
    expect(jsonEntry, 'export JSON includes the newly created prompt').toBeTruthy();
    expect(jsonEntry.technique).toBe('Constraint-based');

    await exportModal.getByRole('button', { name: 'Markdown' }).click();
    const markdownText = await exportModal.locator('#export-preview').inputValue();
    expect(markdownText).toContain('## Export Proof Prompt');
    expect(markdownText).toContain('- Technique: Constraint-based');

    await exportModal.getByRole('button', { name: 'JSON' }).click();
    const downloadPromise = page.waitForEvent('download');
    await exportModal.getByRole('button', { name: 'Download JSON' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('prompt-library.json');
  });

  test('2.9 modal_focus_trap_escape', async ({ page }) => {
    await openApp(page);
    const trigger = page.getByRole('button', { name: 'New Prompt', exact: true });
    await trigger.click();
    const modal = page.locator('.prompt-form-modal');
    await expect(modal).toBeVisible();

    for (let i = 0; i < 15; i += 1) await page.keyboard.press('Tab');
    const focusStayedInModal = await page.evaluate(() => {
      const modalEl = document.querySelector('.cds--modal.is-visible');
      return Boolean(modalEl && modalEl.contains(document.activeElement));
    });
    expect(focusStayedInModal, 'focus stays trapped inside modal after repeated Tab').toBe(true);

    await page.keyboard.press('Escape');
    await expect(modal, 'Escape closes the dialog').toBeHidden();
    await expect(trigger, 'focus returns to the control that opened the dialog').toBeFocused();
  });

  test('14.2 sort_reversal_proves_live_data', async ({ page }) => {
    await openApp(page);
    const titleHeader = page.locator('th button.sortable-header', { hasText: 'Title' });
    await titleHeader.click();
    const ascending = await page.locator(`${ROWS} .title-truncate`).allTextContents();

    await titleHeader.click();
    const descending = await page.locator(`${ROWS} .title-truncate`).allTextContents();

    expect(descending, 'reversing sort direction reverses the row order').toEqual([...ascending].reverse());
  });
});
