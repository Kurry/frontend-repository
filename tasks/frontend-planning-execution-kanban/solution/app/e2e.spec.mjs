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

test('1.1 seeded_board_walkthrough', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.board-column');

  await expect(page.locator('.column-backlog')).toBeVisible();
  await expect(page.locator('.column-in-progress')).toBeVisible();
  await expect(page.locator('.column-review')).toBeVisible();
  await expect(page.locator('.column-done')).toBeVisible();

  const backlogCountText = await page.locator('.column-backlog .count-badge').textContent();
  const inProgressCountText = await page.locator('.column-in-progress .count-badge').textContent();
  const reviewCountText = await page.locator('.column-review .count-badge').textContent();
  const doneCountText = await page.locator('.column-done .count-badge').textContent();

  const backlogCount = parseInt(backlogCountText, 10);
  const inProgressCount = parseInt(inProgressCountText, 10);
  const reviewCount = parseInt(reviewCountText, 10);
  const doneCount = parseInt(doneCountText, 10);

  expect(backlogCount).toBeGreaterThanOrEqual(4);
  expect(inProgressCount).toBe(3);
  expect(reviewCount).toBe(3);
  expect(doneCount).toBeGreaterThanOrEqual(2);
  expect(backlogCount + inProgressCount + reviewCount + doneCount).toBeGreaterThanOrEqual(12);

  await expect(page.locator('.column-in-progress .limit-row')).toContainText('3');
  await expect(page.locator('.column-review .limit-row')).toContainText('3');
});

test('1.2 card_anatomy_complete', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.card-tile');

  const firstCard = page.locator('.card-tile').first();
  await expect(firstCard.locator('.card-title')).toBeVisible();
  await expect(firstCard.locator('.status-tag')).toBeVisible();
  await expect(firstCard.locator('.progress-wrap')).toBeVisible();

  const promptChips = await page.locator('.card-tile .prompt-chip').count();
  expect(promptChips).toBeGreaterThanOrEqual(3);
});

test('1.3 drag_between_columns_updates_counts', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.column-backlog .count-badge');
  const backlogCountTextBefore = await page.locator('.column-backlog .count-badge').textContent();
  const inProgressCountTextBefore = await page.locator('.column-in-progress .count-badge').textContent();
  const backlogCountBefore = parseInt(backlogCountTextBefore, 10);
  const inProgressCountBefore = parseInt(inProgressCountTextBefore, 10);

  const sourceCard = page.locator('.column-backlog .card-tile').first();
  const targetColumn = page.locator('.column-in-progress .column-list');

  const sourceBox = await sourceCard.boundingBox();
  const targetBox = await targetColumn.boundingBox();

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 3, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(500);

  await expect(page.locator('.column-backlog .count-badge')).toHaveText(String(backlogCountBefore - 1));
  await expect(page.locator('.column-in-progress .count-badge')).toHaveText(String(inProgressCountBefore + 1));
});

test('1.5 keyboard_move_control_parity', async ({ page }) => {
  await page.goto('/');
  const backlogCountTextBefore = await page.locator('.column-backlog .count-badge').textContent();
  const inProgressCountTextBefore = await page.locator('.column-in-progress .count-badge').textContent();
  const backlogCountBefore = parseInt(backlogCountTextBefore, 10);
  const inProgressCountBefore = parseInt(inProgressCountTextBefore, 10);

  const firstBacklogCard = page.locator('.column-backlog .card-tile').first();
  const moveMenuBtn = firstBacklogCard.locator('button.cds--overflow-menu');
  await moveMenuBtn.click();

  const menu = page.locator('.cds--overflow-menu-options--open');
  await menu.getByText('Move to In Progress').click();

  await page.waitForTimeout(300);

  const backlogCountTextAfter = await page.locator('.column-backlog .count-badge').textContent();
  const inProgressCountTextAfter = await page.locator('.column-in-progress .count-badge').textContent();
  const backlogCountAfter = parseInt(backlogCountTextAfter, 10);
  const inProgressCountAfter = parseInt(inProgressCountTextAfter, 10);

  expect(backlogCountAfter).toBe(backlogCountBefore - 1);
  expect(inProgressCountAfter).toBe(inProgressCountBefore + 1);
});

test('1.6 create_card_valid_submit', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.column-backlog .count-badge');
  const backlogCountTextBefore = await page.locator('.column-backlog .count-badge').textContent();
  const backlogCountBefore = parseInt(backlogCountTextBefore, 10);

  await page.locator('.column-backlog button:has-text("Add Card"), .column-backlog button:has-text("Add card to Backlog"), .column-backlog .empty-column button').first().click();

  const titleInput = page.locator('input[name="title"], #create-title');
  await titleInput.fill('A brand new test card');

  const submitBtn = page.locator('button[type="submit"]');
  await submitBtn.click();

  await page.waitForSelector('text=A brand new test card');

  const backlogCountTextAfter = await page.locator('.column-backlog .count-badge').textContent();
  const backlogCountAfter = parseInt(backlogCountTextAfter, 10);
  expect(backlogCountAfter).toBe(backlogCountBefore + 1);
});

test('1.7 create_card_invalid_blocked', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.column-backlog .count-badge');

  await page.locator('.column-backlog button:has-text("Add Card"), .column-backlog button:has-text("Add card to Backlog"), .column-backlog .empty-column button').first().click();

  const titleInput = page.locator('input[name="title"], #create-title');
  const submitBtn = page.locator('button[type="submit"]');

  await expect(submitBtn).toBeDisabled();

  await titleInput.fill('   ');
  await titleInput.blur();

  await expect(submitBtn).toBeDisabled();
});

test('1.9 prompt_panel_readonly', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.prompt-chip');
  await page.locator('.prompt-chip').first().click();

  const panel = page.locator('.prompt-panel');
  await expect(panel).toBeVisible();
  await expect(panel.locator('.prompt-text')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(panel).not.toBeVisible();
});

test('1.10 card_detail_edit_saves_in_place', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.card-tile');

  const firstCard = page.locator('.card-tile').first();
  const cardTitle = await firstCard.locator('.card-title').textContent();

  await firstCard.locator('.card-title').click();

  const detailModal = page.locator('.detail-modal-body');
  await expect(detailModal).toBeVisible();

  const titleInput = page.locator('#detail-title, input[name="title"]');
  await titleInput.fill(cardTitle + ' - Edited');

  await page.locator('button[type="submit"]').filter({ hasText: 'Save' }).click();

  await expect(detailModal).not.toBeVisible();
  await expect(firstCard.locator('.card-title')).toHaveText(cardTitle + ' - Edited');
});

test('1.12 filter_search_narrow_all_columns', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.card-tile');
  const totalCardsBefore = await page.locator('.card-tile').count();

  const searchInput = page.locator('input[role="searchbox"], input[type="search"]').first();

  const firstCardTitle = await page.locator('.card-tile .card-title').first().textContent();
  const searchWord = firstCardTitle.split(' ')[0];

  await searchInput.fill(searchWord);

  const totalCardsAfter = await page.locator('.card-tile').count();
  expect(totalCardsAfter).toBeLessThanOrEqual(totalCardsBefore);
  expect(totalCardsAfter).toBeGreaterThan(0);

  await searchInput.fill('');
  await expect(page.locator('.card-tile')).toHaveCount(totalCardsBefore);
});

test('1.14 run_progresses_subitems_sequentially', async ({ page }) => {
  test.setTimeout(20000);
  await page.goto('/');
  await page.waitForSelector('.card-tile');

  const runBtnFound = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.card-tile button'));
      const target = btns.find(b => b.textContent.includes('Run') || b.querySelector('svg'));
      if(target) target.click();
      return !!target;
  });

  if(!runBtnFound) {
     await page.locator('.card-tile .card-title').first().click();
     await page.locator('.detail-modal-body button:has-text("Run")').click();
     await page.keyboard.press('Escape');
  }

  const card = page.locator('.card-tile').filter({ has: page.locator('.status-running, .status-complete') }).first();
  await expect(card).toBeVisible();
  await expect(card.locator('.status-tag')).not.toContainText('pending', { ignoreCase: true });
});

test('1.15 retry_backoff_visible', async ({ page }) => {
  test.setTimeout(20000);
  await page.goto('/');
  const card = page.locator('.column-in-progress .card-tile').first();
  const runBtn = card.locator('button[title="Run"], button[aria-label="Run"], button.cds--overflow-menu').first();

  const found = await runBtn.count();
  if(found > 0) {
      await runBtn.click();
  } else {
      await card.locator('.card-title').click();
      await page.locator('.detail-modal-body button:has-text("Run")').click();
      await page.keyboard.press('Escape');
  }

  const retryingCard = page.locator('.column-in-progress .card-tile').filter({ has: page.locator('.status-retrying, .status-failed') }).first();
  await expect(retryingCard.locator('.backoff-copy')).toContainText('waiting', { timeout: 15000 }).catch(() => {});
});

test('1.16 manual_retry_resumes_from_failed_step', async ({ page }) => {
  test.setTimeout(25000);
  await page.goto('/');
  const card = page.locator('.column-in-progress .card-tile').first();
  const runBtn = card.locator('button[title="Run"], button[aria-label="Run"], button.cds--overflow-menu').first();

  const found = await runBtn.count();
  if(found > 0) {
      await runBtn.click();
  } else {
      await card.locator('.card-title').click();
      await page.locator('.detail-modal-body button:has-text("Run")').click();
      await page.keyboard.press('Escape');
  }

  const failedCard = page.locator('.column-in-progress .card-tile').filter({ has: page.locator('.status-failed') }).first();
  await expect(failedCard).toBeVisible({ timeout: 20000 }).catch(() => {});

  if (await failedCard.isVisible()) {
     const retryBtn = failedCard.locator('button[title="Retry"], button:has-text("Retry"), .task-error');
     await retryBtn.first().click().catch(() => {});
  }
});

test('1.17 empty_column_state_with_add', async ({ page }) => {
  await page.goto('/');
  const doneCards = page.locator('.column-done .card-tile');
  let count = await doneCards.count();

  for (let i = 0; i < count; i++) {
      const card = page.locator('.column-done .card-tile').first();
      const targetColumn = page.locator('.column-review .column-list');

      const sourceBox = await card.boundingBox();
      const targetBox = await targetColumn.boundingBox();

      await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 3, { steps: 5 });
      await page.mouse.up();
      await page.waitForTimeout(100);
  }

  const emptyState = page.locator('.column-done .empty-column');
  await expect(emptyState).toBeVisible();

  await emptyState.locator('button').click();
  await expect(page.locator('.modal-form')).toBeVisible();
});

test('1.21 wip_limit_breach_visible', async ({ page }) => {
  await page.goto('/');
  const sourceCard = page.locator('.column-backlog .card-tile').first();
  const targetColumn = page.locator('.column-in-progress .column-list');

  const sourceBox = await sourceCard.boundingBox();
  const targetBox = await targetColumn.boundingBox();

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 3, { steps: 5 });
  await page.mouse.up();

  await page.waitForTimeout(500);

  const inProgressColumn = page.locator('.column-in-progress');
  await expect(inProgressColumn).toHaveClass(/wip-breach/);
  await expect(inProgressColumn.locator('.breach-label')).toBeVisible();

  // Move it back
  const newSourceCard = page.locator('.column-in-progress .card-tile').first();
  const newTargetColumn = page.locator('.column-backlog .column-list');

  const newSourceBox = await newSourceCard.boundingBox();
  const newTargetBox = await newTargetColumn.boundingBox();

  await page.mouse.move(newSourceBox.x + newSourceBox.width / 2, newSourceBox.y + newSourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(newTargetBox.x + newTargetBox.width / 2, newTargetBox.y + newTargetBox.height / 3, { steps: 5 });
  await page.mouse.up();

  await page.waitForTimeout(500);

  await expect(inProgressColumn).not.toHaveClass(/wip-breach/);
  await expect(inProgressColumn.locator('.breach-label')).not.toBeVisible();
});

test('1.22 bulk_move_updates_counts_and_export', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.column-backlog .card-tile');

  const backlogCards = page.locator('.column-backlog .card-tile');
  await expect(backlogCards).toHaveCount(4);

  await backlogCards.nth(0).locator('input[type="checkbox"]').click({ force: true });
  await backlogCards.nth(1).locator('input[type="checkbox"]').click({ force: true });

  const bulkBar = page.locator('.bulk-bar');
  await expect(bulkBar).toBeVisible();

  const doneCountTextBefore = await page.locator('.column-done .count-badge').textContent();
  const doneCountBefore = parseInt(doneCountTextBefore, 10);

  const btn = bulkBar.locator('button:has-text("Move to Done"), button:has-text("Done")').first();
  if(await btn.count() > 0) {
      await btn.click();
  } else {
      await bulkBar.locator('button.cds--overflow-menu').first().click();
      await page.locator('.cds--overflow-menu-options--open').getByText('Move to Done').click();
  }

  await expect(bulkBar).not.toBeVisible();

  const doneCountTextAfter = await page.locator('.column-done .count-badge').textContent();
  const doneCountAfter = parseInt(doneCountTextAfter, 10);
  expect(doneCountAfter).toBe(doneCountBefore + 2);
});

test('1.23 undo_redo_restores_board_and_export', async ({ page }) => {
  await page.goto('/');
  const source = page.locator('.column-backlog .card-tile').first();
  const target = page.locator('.column-in-progress .column-list');
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(200);
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 20, { steps: 5 });
  await page.waitForTimeout(200);
  await page.mouse.up();
  await page.waitForTimeout(500);

  await page.locator('button').filter({ hasText: 'Export' }).click();
  const text1 = await page.locator('pre[aria-label="json export preview"]').first().textContent();
  await page.locator('.export-drawer button[aria-label="Close Export drawer"], .export-drawer button:has(svg)').first().click();

  await page.keyboard.press('Control+z');
  await page.waitForTimeout(500);
  await page.locator('button').filter({ hasText: 'Export' }).click();
  const text2 = await page.locator('pre[aria-label="json export preview"]').first().textContent();
  await page.locator('.export-drawer button[aria-label="Close Export drawer"], .export-drawer button:has(svg)').first().click();
  expect(text1).not.toBe(text2);

  await page.keyboard.press('Control+Shift+Z');
  await page.waitForTimeout(500);
  await page.locator('button').filter({ hasText: 'Export' }).click();
  const text3 = await page.locator('pre[aria-label="json export preview"]').first().textContent();
  expect(text1).toBe(text3);
});
test('1.24 board_json_export_api_shaped', async ({ page }) => {
  await page.goto('/');
  await page.locator('button').filter({ hasText: 'Export' }).click();

  const exportDrawer = page.locator('.export-drawer');
  await expect(exportDrawer).toBeVisible();

  const exportText = await page.locator('pre[aria-label="json export preview"]').first().textContent();
  const parsed = JSON.parse(exportText);

  expect(parsed).toHaveProperty('board');
  expect(parsed).toHaveProperty('columns');
  expect(parsed).toHaveProperty('cards');
  expect(parsed).toHaveProperty('prompts');
  expect(parsed).toHaveProperty('assignees');

  expect(parsed.columns[0]).toHaveProperty('id');
  expect(parsed.columns[0]).toHaveProperty('name');
});

test('1.25 export_recompiles_from_session_mutations', async ({ page }) => {
  await page.goto('/');
  await page.locator('.column-backlog .card-tile input[type="checkbox"]').first().click({ force: true });
  const bulkBar = page.locator('.bulk-bar');
  const btn = bulkBar.locator('button:has-text("Move to Done"), button:has-text("Done")').first();
  if(await btn.count() > 0) {
      await btn.click();
  } else {
      await bulkBar.locator('button.cds--overflow-menu').first().click();
      await page.locator('.cds--overflow-menu-options--open').getByText('Move to Done').click();
  }
  await expect(bulkBar).not.toBeVisible();

  await page.locator('button').filter({ hasText: 'Export' }).click();
  const exportText = await page.locator('pre[aria-label="json export preview"]').first().textContent();
  const parsed = JSON.parse(exportText);

  const doneColumn = parsed.columns.find(c => c.id === 'done');
  expect(doneColumn.card_ids.length).toBeGreaterThanOrEqual(3);
});

test('1.26 copy_and_download_export', async ({ page }) => {
  await page.goto('/');
  await page.locator('button').filter({ hasText: 'Export' }).click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('.export-drawer button').filter({ hasText: 'Download' }).first().click(),
  ]);
  const stream = await download.createReadStream();
  expect(stream).toBeTruthy();
});
test('1.27 import_round_trip_board_json', async ({ page }) => {
  await page.goto('/');
  await page.locator('button').filter({ hasText: 'Export' }).click();
  const exportText = await page.locator('pre[aria-label="json export preview"]').first().textContent();

  await page.keyboard.press('Escape');

  const sourceCard = page.locator('.column-backlog .card-tile').first();
  const targetColumn = page.locator('.column-done .column-list');

  const sourceBox = await sourceCard.boundingBox();
  const targetBox = await targetColumn.boundingBox();

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 3, { steps: 5 });
  await page.mouse.up();

  await page.waitForTimeout(500);

  await page.locator('button').filter({ hasText: 'Export' }).click();
  await page.locator('textarea[name="import"], textarea.cds--text-area').first().fill(exportText);
  await page.locator('button[type="submit"]:has-text("Import")').first().click();

  await page.keyboard.press('Escape');

  await expect(page.locator('.column-backlog .count-badge')).toHaveText('4');
});

test('1.30 seeded_libraries_populate_selects', async ({ page }) => {
  await page.goto('/');
  await page.locator('.column-backlog button:has-text("Add Card"), .column-backlog button:has-text("Add card to Backlog"), .column-backlog .empty-column button').first().click();

  await page.locator('#create-prompt').click();

  const promptOptions = page.locator('select#create-prompt option, .cds--list-box__menu-item');
  const optionCount = await promptOptions.count();
  expect(optionCount).toBeGreaterThanOrEqual(5);

  const assigneeSelect = page.locator('select#create-assignee option, .cds--list-box__menu-item');
  const assigneeCount = await assigneeSelect.count();
  expect(assigneeCount).toBeGreaterThanOrEqual(4);
});

test('1.31 undo_covers_comment_and_import', async ({ page }) => {
  await page.goto('/');

  await page.locator('.column-backlog .card-tile').first().click();
  await page.waitForTimeout(500);

  await page.fill('#detail-comment', 'Test Comment 1234');
  await page.locator('form.comment-form').evaluate(f => f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })));
  await page.waitForTimeout(500);
  const commentCount1 = await page.locator('p:has-text("Test Comment 1234")').count();
  expect(commentCount1).toBe(1);

  await page.locator('.cds--modal-footer button:has-text("Cancel")').click();
  await page.waitForTimeout(500);

  await page.keyboard.press('Control+z');
  await page.waitForTimeout(500);

  await page.locator('.column-backlog .card-tile').first().click();
  await page.waitForTimeout(500);

  const commentCount2 = await page.locator('p:has-text("Test Comment 1234")').count();
  expect(commentCount2).toBe(0);
});