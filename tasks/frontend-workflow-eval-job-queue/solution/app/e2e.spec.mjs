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

const SEEDED_JOB_COUNT = 36;

test.describe('frontend-workflow-eval-job-queue criteria', () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  test('1.1 seeded_jobs_table_complete', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const rows = page.locator('.jobs-table tbody tr');
    await expect(rows).toHaveCount(SEEDED_JOB_COUNT);

    const statusTexts = await page.locator('.jobs-table .status-badge').allTextContents();
    const counts = statusTexts.reduce((acc, text) => {
      const key = text.trim().toLowerCase();
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts.running ?? 0, 'at least two running jobs').toBeGreaterThanOrEqual(2);
    expect(counts.completed ?? 0, 'at least two completed jobs').toBeGreaterThanOrEqual(2);
    expect(counts.failed ?? 0, 'at least one failed job').toBeGreaterThanOrEqual(1);
    expect(counts.queued ?? 0, 'at least one queued job').toBeGreaterThanOrEqual(1);
    expect(counts.cancelled ?? 0, 'at least one cancelled job').toBeGreaterThanOrEqual(1);

    const firstRow = rows.first();
    await expect(firstRow.locator('.job-id span')).not.toBeEmpty();
    await expect(firstRow.locator('.config-cell strong')).not.toBeEmpty();
    await expect(firstRow.locator('.progress-cell')).toContainText(/of \d+ trials/);
    await expect(firstRow.locator('.submitted-time')).not.toBeEmpty();
  });

  test('1.2 filters_combine_and_clear', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const rows = page.locator('.jobs-table tbody tr');
    const initialCount = await rows.count();
    expect(initialCount).toBe(SEEDED_JOB_COUNT);

    await page.getByLabel('Filter by status').selectOption('running');
    await page.getByLabel('Filter by model').selectOption('cobalt-4');
    // Only evq-309 (orchard-qa/scouthand/cobalt-4/running) satisfies both filters.
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('evq-309');

    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(rows).toHaveCount(SEEDED_JOB_COUNT);
    await expect(page.getByLabel('Filter by status')).toHaveValue('');
    await expect(page.getByLabel('Filter by model')).toHaveValue('');
  });

  test('1.4 job_detail_trial_grid', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const urlBefore = page.url();
    await page.getByRole('button', { name: 'Open evq-309 details' }).click();
    await expect(page.locator('#job-detail-title')).toContainText('evq-309');
    expect(page.url(), 'detail opens without a page reload').toBe(urlBefore);

    const cards = page.locator('.job-detail .trial-card');
    await expect(cards).toHaveCount(8); // evq-309 has trialCount 8
    const first = cards.first();
    await expect(first.locator('.trial-top code')).toHaveText('t01');
    await expect(first.locator('.status-badge')).toBeVisible();
    await expect(first.locator('dl')).toContainText('Reward');
    await expect(first.locator('dl')).toContainText('Duration');
    await expect(first.locator('dl')).toContainText(/\d \/ 3/);
    // A completed trial (index 0..4) must show a numeric reward, not the em dash placeholder.
    const rewardText = await first.locator('dl div').first().locator('dd').textContent();
    expect(rewardText.trim()).toMatch(/^\d\.\d{2}$/);
    // Status classes distinguish trial state with a matching text label.
    const statusClass = await first.locator('.status-badge').getAttribute('class');
    expect(statusClass).toContain('status-completed');
  });

  test('1.5 failed_trial_backoff_retry', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Open evq-308 details' }).click();
    const cards = page.locator('.job-detail .trial-card');
    const cardCount = await cards.count();
    let failedIndex = -1;
    for (let i = 0; i < cardCount; i += 1) {
      const cls = await cards.nth(i).getAttribute('class');
      if (cls?.includes('trial-failed')) { failedIndex = i; break; }
    }
    expect(failedIndex, 'evq-308 has a failed trial in backoff').toBeGreaterThanOrEqual(0);
    // Locate by stable position (nth), not by the failing class, since that
    // class disappears once the countdown completes and the trial flips.
    const card = cards.nth(failedIndex);
    await expect(card.locator('.error-chip')).toBeVisible();
    const backoffIndicator = card.locator('.backoff-indicator');
    await expect(backoffIndicator).toBeVisible();

    const readBackoff = async () => {
      const text = await backoffIndicator.locator('strong').textContent();
      return Number(text.replace('s', '').trim());
    };
    const first = await readBackoff();
    expect(first).toBeGreaterThan(0);
    await page.waitForTimeout(2200);
    const second = await readBackoff();
    expect(second, 'backoff countdown visibly counts down').toBeLessThan(first);

    // Wait for the countdown to reach zero and the trial to flip back to running.
    await expect(card.locator('.status-badge')).toContainText('Running', { timeout: 15_000 });
    await expect(card.locator('.backoff-indicator')).toHaveCount(0);
  });

  test('1.6 manual_retry_single_trial', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Open evq-298 details' }).click();
    const cards = page.locator('.job-detail .trial-card');
    await expect(cards).toHaveCount(4);

    const completedCard = cards.nth(0);
    const failedCard = cards.nth(1);
    const untouchedA = cards.nth(2);
    const untouchedB = cards.nth(3);

    await expect(failedCard.locator('.status-badge')).toContainText('Failed');
    await expect(failedCard.locator('dl')).toContainText('3 / 3');
    const untouchedABefore = await untouchedA.innerText();
    const untouchedBBefore = await untouchedB.innerText();
    const completedBefore = await completedCard.innerText();

    await failedCard.getByRole('button', { name: 'Retry trial' }).click();

    await expect(failedCard.locator('.status-badge')).toContainText('Running');
    expect(await untouchedA.innerText(), 'unrelated trial A is unchanged').toBe(untouchedABefore);
    expect(await untouchedB.innerText(), 'unrelated trial B is unchanged').toBe(untouchedBBefore);
    expect(await completedCard.innerText(), 'completed trial result is unchanged').toBe(completedBefore);
  });

  test('1.9 pause_resume_checkpoint', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const laneCard = page.locator('.lane-card', { hasText: 'Bluefjord Cloud' });
    await laneCard.getByRole('button', { name: 'Pause Bluefjord Cloud' }).click();
    await expect(page.getByRole('dialog', { name: /Pause Bluefjord Cloud\?/ })).toBeVisible();
    await page.getByRole('button', { name: 'Pause lane' }).click();
    await expect(laneCard.locator('.rate-badge')).toContainText('paused');

    await page.getByRole('button', { name: 'Open evq-308 details' }).click();
    const backoffCard = page.locator('.job-detail .trial-card').filter({ has: page.locator('.backoff-indicator') });
    await expect(backoffCard, 'the live retry checkpoint is visible').toHaveCount(1);
    const snapshotBefore = await backoffCard.innerText();
    await page.waitForTimeout(3000);
    const snapshotAfter = await backoffCard.innerText();
    expect(snapshotAfter, 'paused lane retry countdown freezes at its checkpoint').toBe(snapshotBefore);

    await page.getByRole('button', { name: 'Close job detail' }).click();
    await laneCard.getByRole('button', { name: 'Resume Bluefjord Cloud' }).click();
    await expect(laneCard.locator('.rate-badge')).not.toContainText('paused');
  });

  test('1.10 submit_form_field_contract', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Submit job', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Submit job' });
    await expect(dialog).toBeVisible();
    const submitButton = dialog.getByRole('button', { name: 'Submit job', exact: true });
    await expect(submitButton, 'submit disabled until valid').toBeDisabled();

    const trialCountInput = dialog.getByLabel(/Trial count/);
    await trialCountInput.fill('0');
    await expect(dialog.locator('#trialCount-error')).toContainText('trialCount must be at least 1');
    await expect(submitButton).toBeDisabled();

    await trialCountInput.fill('11');
    await expect(dialog.locator('#trialCount-error')).toContainText('trialCount must be at most 10');

    await trialCountInput.fill('3');
    await dialog.getByLabel(/^Dataset/).selectOption('orchard-qa');
    await dialog.getByLabel(/^Agent/).selectOption('scouthand');
    await dialog.getByLabel(/^Primary model/).selectOption('cobalt-4');
    await dialog.getByLabel(/^Sweep model/).selectOption('cobalt-4');
    await expect(dialog.locator('#sweepModel-error')).toContainText('sweepModel must differ from model');
    await expect(submitButton).toBeDisabled();

    await dialog.getByLabel(/^Sweep model/).selectOption('');
    await expect(submitButton, 'valid contract enables submit').toBeEnabled();
  });

  test('1.11 valid_submit_enqueues_job', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const rows = page.locator('.jobs-table tbody tr');
    await expect(rows).toHaveCount(SEEDED_JOB_COUNT);
    // Freeze the destination lane so the scheduler cannot immediately consume
    // the queued job before its depth delta is observed.
    await invokeTool(page, 'session_pause', { providerId: 'skylark-systems' });
    const laneCard = page.locator('.lane-card', { hasText: 'Skylark Systems' });
    const queueDepth = laneCard.locator('.lane-stats div').first().locator('strong');
    const depthBefore = Number(await queueDepth.innerText());

    await page.getByRole('button', { name: 'Submit job', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Submit job' });
    await dialog.getByLabel(/^Dataset/).selectOption('ledgerline-suite');
    await dialog.getByLabel(/^Agent/).selectOption('forgeline');
    await dialog.getByLabel(/^Primary model/).selectOption('willow-mini');
    await dialog.getByLabel(/Trial count/).fill('5');
    const submitButton = dialog.getByRole('button', { name: 'Submit job', exact: true });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    await expect(dialog).not.toBeVisible();
    await expect(rows).toHaveCount(SEEDED_JOB_COUNT + 1);
    const newRow = rows.first();
    await expect(newRow.locator('.status-badge')).toContainText('Queued');
    await expect(newRow.locator('.config-cell')).toContainText('ledgerline-suite');

    // Skylark Systems runs willow-mini; the new job's queue depth should reflect the addition.
    await expect.poll(async () => Number(await queueDepth.innerText())).toBe(depthBefore + 1);
  });

  test('1.12 sweep_creates_job_per_model', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const rows = page.locator('.jobs-table tbody tr');
    await expect(rows).toHaveCount(SEEDED_JOB_COUNT);

    await page.getByRole('button', { name: 'Submit job', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Submit job' });
    await dialog.getByLabel(/^Dataset/).selectOption('orchard-qa');
    await dialog.getByLabel(/^Agent/).selectOption('scouthand');
    await dialog.getByLabel(/^Primary model/).selectOption('cobalt-4');
    await dialog.getByLabel(/Trial count/).fill('2');
    await dialog.getByLabel(/^Sweep model/).selectOption('meridian-xl');
    const submitButton = dialog.getByRole('button', { name: 'Submit job', exact: true });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    await expect(dialog).not.toBeVisible();
    // Two models selected (cobalt-4 + meridian-xl sweep) => exactly two new jobs.
    await expect(rows).toHaveCount(SEEDED_JOB_COUNT + 2);
    const configTexts = await rows.locator('.config-cell').allTextContents();
    const matching = configTexts.filter((text) => text.includes('cobalt-4') || text.includes('meridian-xl'));
    expect(matching.length).toBeGreaterThanOrEqual(2);
  });

  test('1.13 config_preview_derives_live', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Submit job', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Submit job' });
    const preview = dialog.locator('pre[aria-label="Configuration preview"]');
    await expect(preview).toContainText('dataset: not-set');

    await dialog.getByLabel(/^Dataset/).selectOption('orchard-qa');
    await dialog.getByLabel(/^Agent/).selectOption('forgeline');
    await dialog.getByLabel(/^Primary model/).selectOption('willow-mini');
    await dialog.getByLabel(/Trial count/).fill('6');
    await expect(preview).toContainText('dataset: orchard-qa');
    await expect(preview).toContainText('agent: forgeline');
    await expect(preview).toContainText('model: willow-mini');
    await expect(preview).toContainText('trialCount: 6');

    const previewText = await preview.textContent();
    await dialog.locator('.preview-heading button').click();
    await expect(dialog.locator('.preview-heading button')).toContainText('Copied to clipboard');
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(previewText);
  });

  test('1.17 cancel_confirm_keeps_results', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const row = page.locator('.jobs-table tbody tr', { hasText: 'evq-309' });

    // Decline first: job must remain unchanged.
    await row.getByRole('button', { name: 'Cancel' }).click();
    const confirmDialog = page.getByRole('dialog', { name: /Cancel evq-309\?/ });
    await expect(confirmDialog).toBeVisible();
    await page.getByRole('button', { name: 'Keep job' }).click();
    await expect(confirmDialog).not.toBeVisible();
    await expect(row.locator('.status-badge')).toContainText('Running');

    await page.getByRole('button', { name: 'Open evq-309 details' }).click();
    const completedRewardBefore = await page.locator('.job-detail .trial-card').first().locator('dl div').first().locator('dd').textContent();
    await page.getByRole('button', { name: 'Close job detail' }).click();
    await expect(page.locator('.job-detail')).toHaveCount(0);

    // Confirm cancel this time.
    await row.getByRole('button', { name: 'Cancel' }).click();
    await expect(confirmDialog).toBeVisible();
    await page.getByRole('button', { name: 'Cancel job' }).click();
    await expect(confirmDialog).not.toBeVisible();
    await expect(row.locator('.status-badge')).toContainText('Cancelled');

    await page.getByRole('button', { name: 'Open evq-309 details' }).click();
    const completedRewardAfter = await page.locator('.job-detail .trial-card').first().locator('dl div').first().locator('dd').textContent();
    expect(completedRewardAfter, 'already-completed trial keeps its reward after cancel').toBe(completedRewardBefore);
    expect(completedRewardAfter.trim()).toMatch(/^\d\.\d{2}$/);
  });

  test('1.21 queue_snapshot_export_field_contract', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Export queue' }).click();
    const dialog = page.getByRole('dialog', { name: 'Export queue' });
    const text = await dialog.locator('pre[aria-label="Queue snapshot JSON preview"]').textContent();
    const snapshot = JSON.parse(text);

    expect(snapshot.schemaVersion).toBe('eval-queue-v1');
    expect(() => new Date(snapshot.exportedAt).toISOString()).not.toThrow();
    expect(new Date(snapshot.exportedAt).toISOString()).toBe(snapshot.exportedAt);
    for (const key of ['jobs', 'providers', 'aggregates', 'timeline']) {
      expect(snapshot, `snapshot has required key ${key}`).toHaveProperty(key);
    }
    expect(snapshot.jobs.length).toBeGreaterThan(0);
    const job = snapshot.jobs[0];
    for (const key of ['dataset', 'agent', 'model', 'trialCount', 'id', 'status', 'progressComplete', 'progressTotal', 'submittedAt', 'trials']) {
      expect(job, `job entry has required key ${key}`).toHaveProperty(key);
    }
    await expect(dialog.getByRole('button', { name: 'Copy' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Download' })).toBeVisible();
  });

  test('1.23 queue_snapshot_import_round_trip', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Export queue' }).click();
    const exportDialog = page.getByRole('dialog', { name: 'Export queue' });
    const exportedText = await exportDialog.locator('pre[aria-label="Queue snapshot JSON preview"]').textContent();
    const exportedJobCount = JSON.parse(exportedText).jobs.length;
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Import queue' }).click();
    const importDialog = page.getByRole('dialog', { name: 'Import queue' });
    await importDialog.getByLabel(/Queue Snapshot JSON/).fill(exportedText);
    await importDialog.getByRole('button', { name: 'Import queue', exact: true }).click();
    await expect(importDialog).not.toBeVisible();
    await expect(page.locator('.jobs-table tbody tr')).toHaveCount(exportedJobCount);

    // Malformed JSON must show an inline error and leave the queue unchanged.
    await page.getByRole('button', { name: 'Import queue' }).click();
    await importDialog.getByLabel(/Queue Snapshot JSON/).fill('{ not valid json');
    await importDialog.getByRole('button', { name: 'Import queue', exact: true }).click();
    await expect(importDialog.locator('#import-error')).toContainText('malformed JSON');
    await expect(importDialog, 'malformed import keeps the dialog open').toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.jobs-table tbody tr')).toHaveCount(exportedJobCount);
  });

  test('2.2 no_storage_reload_seeded', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    await page.getByLabel('Filter by status').selectOption('queued');
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await page.getByRole('button', { name: 'Submit job', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Submit job' });
    await dialog.getByLabel(/^Dataset/).selectOption('orchard-qa');
    await dialog.getByLabel(/^Agent/).selectOption('scouthand');
    await dialog.getByLabel(/^Primary model/).selectOption('cobalt-4');
    await dialog.getByLabel(/Trial count/).fill('2');
    await dialog.getByRole('button', { name: 'Submit job', exact: true }).click();
    await expect(dialog).not.toBeVisible();

    const storageSizes = await page.evaluate(() => ({
      local: window.localStorage.length,
      session: window.sessionStorage.length,
    }));
    expect(storageSizes).toEqual({ local: 0, session: 0 });

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.jobs-table tbody tr')).toHaveCount(SEEDED_JOB_COUNT);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('tab', { name: /Jobs/ })).toHaveAttribute('aria-selected', 'true');
  });
});
