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

async function createPrompt(page, title, technique = 'Few-shot') {
  await page.getByRole('button', { name: 'New Prompt', exact: true }).click();
  const modal = page.locator('.prompt-form-modal');
  await modal.getByLabel('Title').fill(title);
  await modal.locator('#prompt-body').fill(`Reusable body for ${title}.`);
  await modal.getByLabel('Technique tag').selectOption(technique);
  await modal.getByRole('button', { name: 'Create prompt' }).click();
  await expect(modal).toBeHidden();
}

async function selectFirstTwo(page) {
  const labels = page.locator(`${ROWS} label.cds--checkbox-label`);
  await labels.nth(0).click();
  await labels.nth(1).click();
}

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
    // Fill body + technique but leave title empty. The all-mode form should
    // expose the named validation error while keeping submission gated.
    await modal.locator('#prompt-body').fill('Body present but title missing.');
    await modal.getByLabel('Technique tag').selectOption('Few-shot');
    await expect(modal.getByRole('button', { name: 'Create prompt' })).toBeDisabled();

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

  test('1.8 text_and_controls_have_contrast', async ({ page }) => {
    await openApp(page);
    const ratios = await page.locator('.cds--tag').evaluateAll((tags) => {
      const luminance = (rgb) => {
        const values = rgb.match(/[\d.]+/g).slice(0, 3).map((value) => Number(value) / 255)
          .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
        return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
      };
      return tags.map((tag) => {
        const style = getComputedStyle(tag);
        const a = luminance(style.color);
        const b = luminance(style.backgroundColor);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      });
    });
    expect(Math.min(...ratios)).toBeGreaterThanOrEqual(4.5);
  });

  test('14.7 interleaved_flows_preserve_state', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: 'New Prompt', exact: true }).click();
    await page.locator('#prompt-title').fill('Preserved draft A');
    await page.locator('#prompt-body').fill('Draft A body');
    await page.locator('#prompt-technique').selectOption('Few-shot');
    await page.getByRole('button', { name: 'Cancel' }).click();
    await page.getByRole('button', { name: 'Export library' }).click();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'New Prompt', exact: true }).click();
    await expect(page.locator('#prompt-title')).toHaveValue('Preserved draft A');
    await page.locator('#prompt-title').fill('Finished prompt B');
    await page.getByRole('button', { name: 'Create prompt' }).click();
    await expect(page.locator(ROWS, { hasText: 'Finished prompt B' })).toHaveCount(1);
  });

  test('14.8 empty_to_repopulated_round_trip', async ({ page }) => {
    await openApp(page);
    const ids = await page.locator(ROWS).evaluateAll((rows) => rows.map((row) => row.dataset.id));
    for (const id of ids) await invokeTool(page, 'entity_delete', { id, confirm: true });
    await expect(page.getByRole('heading', { name: 'Your library is empty' })).toBeVisible();
    await invokeTool(page, 'entity_create', { title: 'Repopulated live', body: 'Live body', technique: 'Few-shot', description: '' });
    await expect(page.locator(ROWS, { hasText: 'Repopulated live' })).toHaveCount(1);
    await expect(page.locator('.prompt-count')).toContainText('1 of 1 prompts');
  });

  test('1.16 attachment_badges_and_rows', async ({ page }) => {
    await openApp(page);
    const badge = page.locator('.attachment-badge').first();
    await badge.hover();
    await expect(badge.locator('xpath=..').locator('.attachment-preview')).toBeVisible();
    await badge.click();
    await expect(page.locator('.detail-attachments .attachment-row').first()).toBeVisible();
    await expect(page.locator('.detail-attachments .attachment-row__meta').first()).toContainText(/image|text|document|audio/i);
  });

  test('1.18 remove_attachment_with_feedback', async ({ page }) => {
    await openApp(page);
    const row = page.locator(ROWS, { hasText: 'Landing page under strict limits' });
    await row.getByRole('button', { name: /Edit Landing page/ }).click();
    const modal = page.locator('.prompt-form-modal');
    const before = await modal.locator('.attachment-row').count();
    await modal.getByRole('button', { name: /Remove attachment/ }).first().click();
    await expect(modal.locator('.attachment-row')).toHaveCount(before - 1);
    await expect(page.locator('.toast-region')).toContainText('Attachment removed');
    await modal.getByRole('button', { name: 'Save new version' }).click();
    await expect(row.locator('.attachment-badge')).toHaveCount(before - 1);
  });

  test('1.21 double_submit_creates_one', async ({ page }) => {
    await openApp(page);
    const before = await page.locator(ROWS).count();
    await page.getByRole('button', { name: 'New Prompt', exact: true }).click();
    const modal = page.locator('.prompt-form-modal');
    await modal.getByLabel('Title').fill('Double lock proof');
    await modal.locator('#prompt-body').fill('One record only.');
    await modal.getByLabel('Technique tag').selectOption('Few-shot');
    await modal.getByRole('button', { name: 'Create prompt' }).dblclick({ delay: 10 });
    await expect(page.locator(ROWS)).toHaveCount(before + 1);
    await expect(page.locator(ROWS, { hasText: 'Double lock proof' })).toHaveCount(1);
  });

  test('1.22 cancel_leaves_collection_unchanged', async ({ page }) => {
    await openApp(page);
    const before = await page.locator(ROWS).count();
    await page.getByRole('button', { name: 'New Prompt', exact: true }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await selectFirstTwo(page);
    for (const name of ['Extend', 'Combine']) {
      await page.getByRole('button', { name, exact: true }).click();
      await page.getByRole('button', { name: 'Cancel' }).click();
    }
    await expect(page.locator(ROWS)).toHaveCount(before);
  });

  test('1.24 delete_all_empty_state', async ({ page }) => {
    await openApp(page);
    const ids = await page.locator(ROWS).evaluateAll((rows) => rows.map((row) => row.dataset.id));
    for (const id of ids) await invokeTool(page, 'entity_delete', { id, confirm: true });
    await expect(page.getByRole('heading', { name: 'Your library is empty' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'New prompt', exact: true })).toBeVisible();
    await expect(page.getByAltText('Illustrated empty prompt library grid')).toBeVisible();
  });

  test('1.27 prompt_request_body_field_contract', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: 'New Prompt', exact: true }).click();
    const modal = page.locator('.prompt-form-modal');
    await expect(modal.getByLabel('Title')).toHaveAttribute('maxlength', '60');
    const invalidTitle = await invokeTool(page, 'form_validate', {
      workflow: 'create', title: 'x'.repeat(61), body: 'Body', technique: 'Few-shot', description: '',
    });
    const invalidBody = await invokeTool(page, 'form_validate', {
      workflow: 'create', title: 'Valid', body: 'x'.repeat(8001), technique: 'Few-shot', description: '',
    });
    const invalidDescription = await invokeTool(page, 'form_validate', {
      workflow: 'create', title: 'Valid', body: 'Body', technique: 'Few-shot', description: 'x'.repeat(281),
    });
    expect([invalidTitle.valid, invalidBody.valid, invalidDescription.valid]).toEqual([false, false, false]);
  });

  test('1.29 import_library_round_trip', async ({ page }) => {
    await openApp(page);
    await createPrompt(page, 'Round trip proof', 'Structured output');
    await page.getByRole('button', { name: 'Export library' }).click();
    const payload = await page.locator('#export-preview').inputValue();
    await page.keyboard.press('Escape');
    const target = page.locator(ROWS, { hasText: 'Round trip proof' });
    await target.getByRole('button', { name: /Delete Round trip proof/ }).click();
    await page.getByRole('button', { name: 'Delete prompt' }).click();
    await expect(page.locator('.cds--modal.is-visible')).toHaveCount(0);
    await expect(page.locator('.cds--modal.overlay-exit')).toHaveCount(0);
    await page.getByRole('button', { name: 'Import', exact: true }).click();
    await page.locator('#import-payload').fill('{bad');
    await expect(page.locator('.cds--form-requirement')).toContainText(/malformed/i);
    await page.locator('#import-payload').fill(payload);
    await page.getByRole('button', { name: 'Import and replace' }).click();
    await expect(page.locator(ROWS, { hasText: 'Round trip proof' })).toHaveCount(1);
  });

  test('1.31 export_prompts_carry_full_record_shape', async ({ page }) => {
    await openApp(page);
    await selectFirstTwo(page);
    await page.getByRole('button', { name: 'Combine' }).click();
    await page.getByRole('button', { name: 'Create combined prompt' }).click();
    await page.getByRole('button', { name: 'Export library' }).click();
    const document = JSON.parse(await page.locator('#export-preview').inputValue());
    const entry = document.prompts.find((prompt) => prompt.title === 'Combined prompt');
    expect(Object.keys(entry)).toEqual(expect.arrayContaining(['title', 'body', 'technique', 'description', 'id', 'version', 'sources', 'attachments']));
    expect(entry.sources).toHaveLength(2);
  });

  test('3.3 layout_matches_reference', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openApp(page);
    const metrics = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: innerWidth }));
    expect(metrics.page).toBeLessThanOrEqual(metrics.viewport + 1);
    await expect(page.locator('.library-table-container')).toBeVisible();
  });

  test('3.4 specified_state_changes_animate', async ({ page }) => {
    await openApp(page);
    await invokeTool(page, 'entity_create', { title: 'Animated row proof', body: 'Animated body', technique: 'Few-shot', description: '' });
    const animations = await page.locator(ROWS, { hasText: 'Animated row proof' }).evaluate((row) => row.getAnimations().map((item) => item.animationName));
    expect(animations).toContain('row-enter');
  });

  test('3.5 responsive_behavior_matches_reference', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openApp(page);
    await expect(page.locator('.mobile-overflow')).toBeVisible();
    await expect(page.locator('.suggestions')).toHaveCSS('overflow-x', 'auto');
    await expect(page.locator('.library-table-container')).toHaveCSS('overflow-x', 'auto');
  });

  test('4.5 async_work_shows_loading_state', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: 'New Prompt', exact: true }).click();
    const modal = page.locator('.prompt-form-modal');
    await modal.getByLabel('Title').fill('Loading proof');
    await modal.locator('#prompt-body').fill('Loading body');
    await modal.getByLabel('Technique tag').selectOption('Few-shot');
    await modal.getByRole('button', { name: 'Create prompt' }).click({ noWaitAfter: true });
    await expect(modal.getByRole('status')).toContainText('Saving prompt');
  });

  test('4.10 long_flows_show_progress', async ({ page }) => {
    await page.goto(BASE);
    const progress = page.getByRole('progressbar', { name: 'Onboarding progress' });
    await expect(progress).toHaveAttribute('aria-valuenow', '1');
    await page.getByRole('button', { name: 'Continue tour' }).click();
    await expect(progress).toHaveAttribute('aria-valuenow', '2');
    await expect(page.getByText('Step 2 of 3')).toBeVisible();
  });

  test('11.2 advanced_motion_mechanics', async ({ page }) => {
    await openApp(page);
    await page.evaluate(() => scrollTo(0, 120));
    const transform = await page.locator('.page-intro--parallax').evaluate((node) => getComputedStyle(node).transform);
    expect(transform).not.toBe('none');
  });

  test('11.9 genre_appropriate_platform_features', async ({ page }) => {
    await openApp(page);
    expect((await page.request.get(`${BASE}/manifest.json`)).ok()).toBe(true);
    expect((await page.request.get(`${BASE}/sw.js`)).ok()).toBe(true);
    await expect(page.getByText('Offline-ready workspace')).toBeVisible();
  });

  test('11.10 competition_level_innovation', async ({ page }) => {
    await openApp(page);
    const diagnostic = page.getByRole('region', { name: 'Library health diagnostic' });
    await expect(diagnostic).toContainText(/Library health.*described.*context.*evolved/s);
    await expect(diagnostic.getByRole('meter')).toHaveAttribute('aria-valuenow', /\d+/);
  });

  test('innovation.catchall innovation_catchall', async ({ page }) => {
    await openApp(page);
    const diagnostic = page.getByRole('region', { name: 'Library health diagnostic' });
    await expect(diagnostic.getByRole('meter', { name: 'Library health score' })).toBeVisible();
    await expect(diagnostic).toContainText('Offline-ready workspace');
  });

  test('4.2 deleted_row_collapse', async ({ page }) => {
    await openApp(page);
    const row = page.locator(ROWS).first();
    await row.getByRole('button', { name: /Delete / }).click();
    await page.getByRole('button', { name: 'Delete prompt' }).click({ noWaitAfter: true });
    await expect(row).toHaveClass(/row-deleting/);
    expect(await row.evaluate((node) => getComputedStyle(node).animationName)).toContain('row-collapse');
  });

  test('4.4 modal_and_panel_transitions', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: 'New Prompt', exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(page.locator('.cds--modal')).toHaveClass(/overlay-exit/);
    await expect(page.locator('.cds--modal.overlay-exit')).toHaveCount(0);
    await page.locator('.version-button').first().click();
    await page.getByRole('dialog').getByLabel('Close version history').click();
    await expect(page.locator('.panel-layer')).toHaveClass(/panel-layer--exit/);
  });

  test('4.6 toasts_slide_autodismiss', async ({ page }) => {
    await openApp(page);
    await createPrompt(page, 'Toast lifecycle proof');
    const toast = page.locator('.toast-region');
    await expect(toast).toContainText('Prompt created');
    expect(await toast.evaluate((node) => getComputedStyle(node).animationName)).toContain('toast-enter');
    await expect(toast).toHaveCount(0, { timeout: 5000 });
  });

  test('9.3 transitions_respond_under_100ms', async ({ page }) => {
    await openApp(page);
    const durations = await page.getByRole('button', { name: /Switch to dark theme/ }).evaluate((button) => {
      const style = getComputedStyle(button);
      return style.transitionDuration.split(',').map((value) => Number.parseFloat(value) * (value.includes('ms') ? 1 : 1000));
    });
    expect(Math.max(...durations)).toBeLessThanOrEqual(100);
  });

  test('9.4 async_work_has_loading_indicators', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: 'Export library' }).click();
    await expect(page.locator('.export-loading')).toContainText('Compiling export');
    await expect(page.locator('.export-loading')).toBeHidden({ timeout: 2000 });
  });

  test('9.5 large_collections_render_without_lag', async ({ page }) => {
    await openApp(page);
    const start = Date.now();
    await page.getByRole('button', { name: 'Load 60 sample prompts' }).click();
    await expect(page.locator('.prompt-count')).toContainText('76 prompts');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(500);
    await expect(page.locator(ROWS)).toHaveCount(76);
  });

  test('2.1 shared_state_coherence', async ({ page }) => {
    await openApp(page);
    await invokeTool(page, 'entity_create', { title: 'Shared state proof', body: 'Coherent body', technique: 'Few-shot', description: '' });
    await expect(page.locator(ROWS, { hasText: 'Shared state proof' })).toHaveCount(1);
    await expect(page.locator('.prompt-count')).toContainText('17 of 17 prompts');
    await invokeTool(page, 'browse_search', { query: 'Shared state proof' });
    await expect(page.locator(ROWS)).toHaveCount(1);
  });

  test('2.7 rapid_input_stability', async ({ page }) => {
    await openApp(page);
    const search = page.locator('#prompt-search');
    await search.pressSequentially('support', { delay: 5 });
    await page.locator('#technique-filter').selectOption('Few-shot');
    await page.locator(`${ROWS} label.cds--checkbox-label`).first().click();
    await expect(search).toHaveValue('support');
    await expect(page.locator(ROWS)).toHaveCount(1);
  });

  test('2.8 keyboard_operability_focus', async ({ page }) => {
    await openApp(page);
    await page.locator('#prompt-search').focus();
    for (let index = 0; index < 12; index += 1) {
      expect(await page.evaluate(() => document.activeElement?.matches(':focus-visible'))).toBe(true);
      await page.keyboard.press('Tab');
    }
    await page.locator('.suggestion-chip').first().focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#prompt-search')).not.toHaveValue('');
  });

  test('2.11 labels_and_error_association', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: 'New Prompt', exact: true }).click();
    for (const id of ['prompt-title', 'prompt-technique', 'prompt-description', 'prompt-body']) {
      await expect(page.locator(`label[for="${id}"]`)).toBeVisible();
    }
    await expect(page.locator('#prompt-title')).toHaveAttribute('aria-errormessage', /prompt-title-error-msg/);
  });

  test('6.6 last_delete_shows_empty_with_cta', async ({ page }) => {
    await openApp(page);
    const ids = await page.locator(ROWS).evaluateAll((rows) => rows.map((row) => row.dataset.id));
    for (const id of ids) await invokeTool(page, 'entity_delete', { id, confirm: true });
    await expect(page.locator('.empty-state').getByText('Build once. Prompt consistently.')).toBeVisible();
    await page.getByRole('button', { name: 'New prompt', exact: true }).click();
    await expect(page.locator('.prompt-form-modal')).toBeVisible();
  });

  test('6.9 create_edit_delete_extend_combine_modals', async ({ page }) => {
    await openApp(page);
    await selectFirstTwo(page);
    await page.getByRole('button', { name: 'Extend' }).click();
    await page.locator('#extension-text').fill('Extension proof');
    await page.getByRole('button', { name: 'Create extension' }).click();
    await selectFirstTwo(page);
    await page.getByRole('button', { name: 'Combine' }).click();
    await page.getByRole('button', { name: 'Create combined prompt' }).click();
    await expect(page.locator(ROWS, { hasText: 'Combined prompt' })).toHaveCount(1);
  });

  test('6.10 export_import_recover_without_reload', async ({ page }) => {
    await openApp(page);
    await createPrompt(page, 'Recovery flow proof');
    await page.getByRole('button', { name: 'Export library' }).click();
    const payload = await page.locator('#export-preview').inputValue();
    await page.keyboard.press('Escape');
    const row = page.locator(ROWS, { hasText: 'Recovery flow proof' });
    await row.getByRole('button', { name: /Delete Recovery flow proof/ }).click();
    await page.getByRole('button', { name: 'Delete prompt' }).click();
    await expect(page.locator('.cds--modal.is-visible')).toHaveCount(0);
    await expect(page.locator('.cds--modal.overlay-exit')).toHaveCount(0);
    await page.getByRole('button', { name: 'Import', exact: true }).click();
    await page.locator('#import-payload').fill(payload);
    await page.getByRole('button', { name: 'Import and replace' }).click();
    await expect(page.locator(ROWS, { hasText: 'Recovery flow proof' })).toHaveCount(1);
  });

  test('6.11 export_library_includes_created_prompt', async ({ page }) => {
    await openApp(page);
    await createPrompt(page, 'Artifact lifecycle proof', 'Role prompting');
    await page.getByRole('button', { name: 'Export library' }).click();
    await expect(page.locator('#export-preview')).toContainText('Artifact lifecycle proof');
    await page.getByRole('button', { name: 'Markdown', exact: true }).click();
    await expect(page.locator('#export-preview')).toContainText('Role prompting');
    await page.keyboard.press('Escape');
    const row = page.locator(ROWS, { hasText: 'Artifact lifecycle proof' });
    await row.getByRole('button', { name: /Delete Artifact lifecycle proof/ }).click();
    await page.getByRole('button', { name: 'Delete prompt' }).click();
    await expect(row).toHaveCount(0);
    await expect(page.locator('.cds--modal.is-visible')).toHaveCount(0);
    await expect(page.locator('.cds--modal.overlay-exit')).toHaveCount(0);
    await page.getByRole('button', { name: 'Export library' }).click();
    await expect(page.locator('#export-preview')).toBeVisible();
    await expect(page.locator('#export-preview')).not.toContainText('Artifact lifecycle proof');
  });

  test('6.12 import_library_round_trip_flow', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: 'Export library' }).click();
    const payload = await page.locator('#export-preview').inputValue();
    const expected = JSON.parse(payload).prompts.length;
    await page.keyboard.press('Escape');
    await invokeTool(page, 'entity_delete', { id: await page.locator(ROWS).first().getAttribute('data-id'), confirm: true });
    await page.getByRole('button', { name: 'Import', exact: true }).click();
    await page.locator('#import-payload').fill(payload);
    await page.getByRole('button', { name: 'Import and replace' }).click();
    await expect(page.locator(ROWS)).toHaveCount(expected);
  });

  test('3.7 component_states_and_icons', async ({ page }) => {
    await openApp(page);
    const button = page.locator('.suggestion-chip').first();
    const defaultColor = await button.evaluate((node) => getComputedStyle(node).backgroundColor);
    await button.hover();
    await expect(button).not.toHaveCSS('background-color', defaultColor);
    await button.focus();
    await expect(button).toBeFocused();
    await expect(page.locator('.toolbar-actions svg').first()).toBeVisible();
  });
});
