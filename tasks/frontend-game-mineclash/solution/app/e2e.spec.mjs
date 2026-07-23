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

// ----------------------------------------------------------------------------
// Task-specific criterion suite for frontend-game-mineclash.
//
// Board layout is randomized per round (mine placement uses Math.random with
// no seed), so several helpers below search the real, rendered board for a
// tile with a wanted outcome (safe / mine / covered) instead of assuming
// fixed coordinates. `revealFindingOutcome` uses the app's own Undo control to
// back out of a wrong-branch reveal so the search never fabricates state —
// every board mutation goes through the same click handlers a human uses.
// ----------------------------------------------------------------------------

function tile(page, row, col) {
  return page.locator(`button[aria-label^="Tile ${row + 1}, ${col + 1}:"]`);
}

async function startMatch(page, { difficulty = 'easy', name = 'Casey' } = {}) {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.locator('#playerName').fill(name);
  const label = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  await page.getByRole('button', { name: new RegExp(`^${label}`, 'i') }).click();
  await page.getByRole('button', { name: /start match/i }).click();
  await expect(page.locator('.game-grid')).toBeVisible();
}

async function readScores(page) {
  const text = await page.locator('.scoreboard').innerText();
  const you = text.match(/You[\s\S]*?(\d+)\s*\/\s*(\d+)[\s\S]*?Strikes (\d+)\/3/);
  const rival = text.match(/Rival[\s\S]*?(\d+)\s*\/\s*(\d+)[\s\S]*?Strikes (\d+)\/3/);
  if (!you || !rival) throw new Error(`could not parse scoreboard text: ${text}`);
  return {
    you: { score: Number(you[1]), target: Number(you[2]), strikes: Number(you[3]) },
    rival: { score: Number(rival[1]), target: Number(rival[2]), strikes: Number(rival[3]) },
  };
}

async function openHistoryPanel(page) {
  const toggle = page.getByRole('button', { name: /history/i });
  const text = await toggle.textContent();
  if (text && text.includes('▼')) await toggle.click();
}

// Scans the board in row-major order looking for a covered tile whose reveal
// outcome matches `wantMine`. Wrong-branch reveals are immediately reverted
// with the real Undo control (never a store hack) before moving on, so the
// board a caller sees afterward reflects only the one deliberate outcome it
// asked for. Already-resolved tiles (revealed by either side, or flagged) are
// skipped without being clicked.
async function revealFindingOutcome(page, wantMine, rows, cols) {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const loc = tile(page, r, c);
      const before = await loc.getAttribute('aria-label');
      if (!before || /revealed|flagged/.test(before)) continue;
      await loc.click();
      await expect(loc).toHaveAttribute('aria-label', /revealed/, { timeout: 2000 });
      const label = await loc.getAttribute('aria-label');
      const isMine = /revealed mine/.test(label);
      if (isMine === wantMine) return { row: r, col: c, label };
      await page.getByRole('button', { name: /undo/i }).click();
      await expect(loc).not.toHaveAttribute('aria-label', /revealed/, { timeout: 2000 });
    }
  }
  throw new Error(`exhausted the ${rows}x${cols} board without finding a tile matching wantMine=${wantMine}`);
}

async function firstCoveredTile(page, rows, cols, exclude = []) {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (exclude.some((e) => e.row === r && e.col === c)) continue;
      const label = await tile(page, r, c).getAttribute('aria-label');
      if (label && label.endsWith(': covered')) return { row: r, col: c };
    }
  }
  throw new Error('no plain covered tile found');
}

test.describe('frontend-game-mineclash criteria', () => {
  test('1.1 setup_screen_direct_entry', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'MineClash' })).toBeVisible();
    await expect(page.locator('#playerName')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Easy/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Medium/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Hard/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /start match/i })).toBeVisible();
    // No login/admin gate and no routing shell before Start match.
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('1.15 setup_form_validates_player_and_difficulty', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const startBtn = page.getByRole('button', { name: /start match/i });
    const nameInput = page.locator('#playerName');

    // A one-character playerName is invalid: inline message names the field
    // and the 2-to-20 rule, and Start match stays disabled.
    await nameInput.fill('A');
    await expect(page.locator('#playerName-error')).toContainText('playerName');
    await expect(page.locator('#playerName-error')).toContainText('2 to 20');
    await expect(startBtn).toBeDisabled();

    // A valid name (difficulty already has a selection) clears the error and
    // enables Start match, which actually starts the match.
    await nameInput.fill('Avery');
    await expect(page.locator('#playerName-error')).toHaveCount(0);
    await expect(startBtn).toBeEnabled();
    await startBtn.click();
    await expect(page.getByLabel('8 by 8 minefield')).toBeVisible();
  });

  test('1.2 medium_start_builds_fresh_board', async ({ page }) => {
    await startMatch(page, { difficulty: 'medium', name: 'Quinn' });
    await expect(page.getByLabel('10 by 10 minefield')).toBeVisible();
    await expect(page.locator('button[aria-label^="Tile "]')).toHaveCount(100);
    const scores = await readScores(page);
    expect(scores.you).toEqual({ score: 0, target: 50, strikes: 0 });
    expect(scores.rival).toEqual({ score: 0, target: 50, strikes: 0 });
  });

  test('1.25 difficulty_sets_grid_and_mines', async ({ page }) => {
    await startMatch(page, { difficulty: 'hard', name: 'Drew' });
    await expect(page.getByLabel('12 by 12 minefield')).toBeVisible();
    await expect(page.locator('button[aria-label^="Tile "]')).toHaveCount(144);
    await expect(page.getByText(/Mines:\s*24/)).toBeVisible();
  });

  test('1.3 safe_reveal_adds_ore_and_adjacency', async ({ page }) => {
    await startMatch(page, { difficulty: 'easy', name: 'Sky' });
    await openHistoryPanel(page);
    const before = await readScores(page);
    expect(before.you.score).toBe(0);

    const safe = await revealFindingOutcome(page, false, 8, 8);
    const oreMatch = safe.label.match(/(\d+) ore/);
    expect(oreMatch, `expected an ore value in label "${safe.label}"`).not.toBeNull();
    const oreValue = Number(oreMatch[1]);
    expect(oreValue).toBeGreaterThanOrEqual(1);
    expect(oreValue).toBeLessThanOrEqual(3);

    const after = await readScores(page);
    expect(after.you.score).toBe(before.you.score + oreValue);

    // Turn hands off to the Rival, without a reload.
    await expect(page.getByText(/rival is thinking/i)).toBeVisible({ timeout: 2000 });

    // The history panel records the reveal with the updated score and the
    // Rival as the side to move.
    const historyText = await page.locator('.panel').filter({ hasText: 'History state' }).innerText();
    expect(historyText).toMatch(new RegExp(`You[\\s\\S]*${after.you.score} pts`));
    expect(historyText).toMatch(/Turn:\s*Rival's/);
  });

  test('1.5 mine_hit_penalty_and_persistent_mine', async ({ page }) => {
    await startMatch(page, { difficulty: 'easy', name: 'Robin' });
    // The history panel must be open before the board search below, since it
    // relies on the real Undo control to back out of wrong-branch reveals.
    await openHistoryPanel(page);
    // Build a small non-zero score first via a safe reveal so the -5 mine
    // penalty is observable as a real subtraction, not just the floored-at-0
    // corner case, then wait for the Rival's automatic turn to finish so it's
    // the Player's turn again.
    await revealFindingOutcome(page, false, 8, 8);
    await expect(page.getByRole('button', { name: /flag (mode|on)/i })).toBeEnabled({ timeout: 4000 });
    const before = await readScores(page);
    expect(before.you.score).toBeGreaterThan(0);

    const mine = await revealFindingOutcome(page, true, 8, 8);
    const after = await readScores(page);
    expect(after.you.score).toBe(Math.max(0, before.you.score - 5));
    expect(after.you.strikes).toBe(before.you.strikes + 1);

    const mineLoc = tile(page, mine.row, mine.col);
    await expect(mineLoc).toHaveAttribute('aria-label', /revealed mine/);
    // Stays revealed for the rest of the round.
    await page.waitForTimeout(300);
    await expect(mineLoc).toHaveAttribute('aria-label', /revealed mine/);
  });

  test('1.6 flag_mode_blocks_reveal', async ({ page }) => {
    await startMatch(page, { difficulty: 'easy', name: 'Ivy' });
    const flagBtn = page.getByRole('button', { name: /flag (mode|on)/i });
    await expect(flagBtn).toHaveAttribute('aria-pressed', 'false');
    await flagBtn.click();
    await expect(flagBtn).toHaveAttribute('aria-pressed', 'true');

    const t = tile(page, 0, 0);
    await t.click();
    await expect(t).toHaveAttribute('aria-label', /flagged/);

    // Leave flag mode; a normal reveal click on the still-flagged tile is
    // rejected rather than revealing it.
    await flagBtn.click();
    await expect(flagBtn).toHaveAttribute('aria-pressed', 'false');
    await t.click();
    await expect(page.locator('.mc-toast')).toContainText(/flagged/i);
    await expect(t).toHaveAttribute('aria-label', /flagged/);
  });

  test('1.16 right_click_toggles_flag', async ({ page }) => {
    await startMatch(page, { difficulty: 'easy', name: 'Nico' });
    const t = tile(page, 1, 1);
    await t.click({ button: 'right' });
    await expect(t).toHaveAttribute('aria-label', /flagged/);

    await t.click({ button: 'right' });
    await expect(t).toHaveAttribute('aria-label', /: covered$/);

    // Once unflagged, a normal reveal click works again.
    await t.click();
    await expect(t).toHaveAttribute('aria-label', /revealed/);
  });

  test('1.7 hint_costs_and_marks_without_reveal', async ({ page }) => {
    await startMatch(page, { difficulty: 'easy', name: 'Sasha' });
    await openHistoryPanel(page);
    // Build a small score so the -3 hint cost is a real observable debit.
    await revealFindingOutcome(page, false, 8, 8);
    await expect(page.getByRole('button', { name: /flag (mode|on)/i })).toBeEnabled({ timeout: 4000 });
    const before = await readScores(page);
    expect(before.you.score).toBeGreaterThan(0);

    const hintBtn = page.locator('button:has-text("Hint (")');
    await expect(hintBtn).toContainText('2/2');

    // Entering hint mode is itself a Qwik-resumable click; wait for the
    // pressed state before acting on a tile so the tile click lands in hint
    // mode rather than racing ahead of it.
    await hintBtn.click();
    await expect(hintBtn).toHaveAttribute('aria-pressed', 'true');
    const covered1 = await firstCoveredTile(page, 8, 8);
    const loc1 = tile(page, covered1.row, covered1.col);
    await loc1.click();
    await expect(loc1).toHaveAttribute('aria-label', /covered, hint says (safe|mine)/);
    await expect(hintBtn).toContainText('1/2');
    const afterHint1 = await readScores(page);
    expect(afterHint1.you.score).toBe(Math.max(0, before.you.score - 3));

    await hintBtn.click();
    await expect(hintBtn).toHaveAttribute('aria-pressed', 'true');
    const covered2 = await firstCoveredTile(page, 8, 8, [covered1]);
    const loc2 = tile(page, covered2.row, covered2.col);
    await loc2.click();
    await expect(loc2).toHaveAttribute('aria-label', /covered, hint says (safe|mine)/);
    await expect(hintBtn).toContainText('0/2');
    const afterHint2 = await readScores(page);
    expect(afterHint2.you.score).toBe(Math.max(0, afterHint1.you.score - 3));

    // Two hints spent this round — the control is now disabled.
    await expect(hintBtn).toBeDisabled();
  });

  test('1.10 pause_resume_freezes_board', async ({ page }) => {
    await startMatch(page, { difficulty: 'easy', name: 'Pat' });
    const toggleBtn = page.getByRole('button', { name: /pause|resume/i });
    await expect(toggleBtn).toHaveText(/pause/i);
    await toggleBtn.click();
    await expect(toggleBtn).toHaveText(/resume/i);
    await expect(page.getByText('⏸ Match paused')).toBeVisible();

    const t = tile(page, 2, 2);
    await t.click();
    await expect(t).toHaveAttribute('aria-label', /: covered$/);
    await expect(page.locator('.mc-toast')).toContainText(/paused/i);

    await toggleBtn.click();
    await expect(toggleBtn).toHaveText(/pause/i);
    await expect(page.getByText('⏸ Match paused')).toHaveCount(0);
    await t.click();
    await expect(t).toHaveAttribute('aria-label', /revealed/);
  });

  test('1.11 undo_creates_history_branch', async ({ page }) => {
    await startMatch(page, { difficulty: 'easy', name: 'Blair' });
    await openHistoryPanel(page);

    await tile(page, 0, 0).click({ button: 'right' });
    await expect(tile(page, 0, 0)).toHaveAttribute('aria-label', /flagged/);
    await expect(page.locator('.history-node')).toHaveCount(2); // root + this flag

    await page.getByRole('button', { name: /undo/i }).click();
    await expect(tile(page, 0, 0)).toHaveAttribute('aria-label', /: covered$/);

    // A different move after the undo creates a new selectable branch rather
    // than replacing the old one.
    await tile(page, 0, 1).click({ button: 'right' });
    await expect(tile(page, 0, 1)).toHaveAttribute('aria-label', /flagged/);
    await expect(page.locator('.history-node')).toHaveCount(3); // root + both flags
    const historyListText = await page.locator('.panel').filter({ hasText: 'Move history' }).innerText();
    expect(historyListText).toContain('⤷');

    // Selecting the earlier branch and applying it restores that exact board.
    await page.locator('.history-node').nth(1).click();
    await page.getByRole('button', { name: /apply scenario change/i }).click();
    await expect(tile(page, 0, 0)).toHaveAttribute('aria-label', /flagged/);
    await expect(tile(page, 0, 1)).toHaveAttribute('aria-label', /: covered$/);
  });

  test('1.12 history_state_snapshot_region', async ({ page }) => {
    await startMatch(page, { difficulty: 'easy', name: 'Casey' });
    await openHistoryPanel(page);

    const applyBtn = page.getByRole('button', { name: /apply scenario change/i });
    const stateRegion = () => page.locator('.panel').filter({ hasText: 'History state' });

    await expect(stateRegion()).toContainText('You');
    await expect(stateRegion()).toContainText('0 pts, 0 strikes');
    await expect(stateRegion()).toContainText(/Turn:\s*Yours/);
    // Selected node is already current — Apply is disabled.
    await expect(applyBtn).toBeDisabled();

    const safe = await revealFindingOutcome(page, false, 8, 8);
    const oreValue = Number(safe.label.match(/(\d+) ore/)[1]);
    await expect(stateRegion()).toContainText(`You`);
    await expect(stateRegion()).toContainText(`${oreValue} pts, 0 strikes`);
    await expect(stateRegion()).toContainText(/Turn:\s*Rival's/);
    await expect(applyBtn).toBeDisabled();

    // Selecting the root (a different, non-current node) enables Apply.
    await page.locator('.history-node').first().click();
    await expect(stateRegion()).toContainText('0 pts, 0 strikes');
    await expect(applyBtn).toBeEnabled();
    await applyBtn.click();
    // Apply's own click handler is resumable; wait for the observable result
    // (selected === current again, so Apply goes back to disabled) before
    // reading the scoreboard, so the read isn't racing the store update.
    await expect(applyBtn).toBeDisabled();
    const restored = await readScores(page);
    expect(restored.you.score).toBe(0);
  });

  test('1.29 history_invalid_transitions_disabled', async ({ page }) => {
    await startMatch(page, { difficulty: 'easy', name: 'Sage' });
    await openHistoryPanel(page);
    const undoBtn = page.getByRole('button', { name: /undo/i });
    const redoBtn = page.getByRole('button', { name: /redo/i });

    // At the freshly-started root, Undo and Redo are both disabled.
    await expect(undoBtn).toBeDisabled();
    await expect(redoBtn).toBeDisabled();

    await tile(page, 0, 0).click({ button: 'right' }); // flag(0,0): a real move
    await expect(undoBtn).toBeEnabled();
    await expect(redoBtn).toBeDisabled(); // current node has no child yet

    await undoBtn.click();
    await expect(undoBtn).toBeDisabled(); // back at root
    await expect(redoBtn).toBeEnabled(); // a child now exists to redo into
  });

  test('1.39 save_progress_checkpoint_resume', async ({ page }) => {
    await startMatch(page, { difficulty: 'easy', name: 'Riley' });
    await tile(page, 0, 0).click();
    await expect(tile(page, 0, 0)).toHaveAttribute('aria-label', /revealed/);
    const before = await readScores(page);

    const saveBtn = page.getByRole('button', { name: /save progress/i });
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();
    await expect(page.locator('.mc-toast')).toContainText(/saved/i);

    await page.reload();
    await page.waitForLoadState('networkidle');
    // A fresh load always opens on the setup screen; live board state outside
    // an explicit checkpoint does not itself survive a reload.
    await expect(page.getByRole('heading', { name: 'MineClash' })).toBeVisible();
    const resumeBtn = page.getByRole('button', { name: /resume saved match/i });
    await expect(resumeBtn).toBeEnabled();
    await resumeBtn.click();

    await expect(tile(page, 0, 0)).toHaveAttribute('aria-label', /revealed/);
    const after = await readScores(page);
    expect(after).toEqual(before);
  });

  test('1.40 import_match_json_appends_log', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const nav = await invokeTool(page, 'browse.open', { destination: 'export-center' });
    expect(nav.ok).toBe(true);

    const record = {
      playerName: 'ImportBot', difficulty: 'medium',
      playerRoundWins: 2, rivalRoundWins: 1,
      playerTotalOre: 42, rivalTotalOre: 30,
      winner: 'player',
      rounds: [
        { roundNumber: 1, playerScore: 50, rivalScore: 12, playerStrikes: 0, rivalStrikes: 1, outcomeReason: 'Reached 50 ore!' },
        { roundNumber: 2, playerScore: 10, rivalScore: 50, playerStrikes: 2, rivalStrikes: 3, outcomeReason: 'Rival struck out!' },
        { roundNumber: 3, playerScore: 50, rivalScore: 20, playerStrikes: 1, rivalStrikes: 0, outcomeReason: 'Reached 50 ore!' },
      ],
      endedAt: new Date().toISOString(),
    };
    await page.getByLabel('Import JSON').fill(JSON.stringify(record));
    await page.getByRole('button', { name: /Import/i }).click();
    await expect(page.locator('#mc-import-msg')).toContainText(/Imported 1 match record/i);

    await invokeTool(page, 'browse.open', { destination: 'match-log' });
    const firstEntry = page.locator('.panel').first();
    await expect(firstEntry).toContainText('ImportBot');
    await expect(firstEntry).toContainText('Medium');
    await expect(firstEntry).toContainText('You won');
    await expect(firstEntry).toContainText('2 – 1');
  });

  test('2.19 import_rejects_invalid_payload', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await invokeTool(page, 'browse.open', { destination: 'export-center' });
    await page.getByLabel('Import JSON').fill('{ this is not valid json');
    await page.getByRole('button', { name: /Import/i }).click();
    await expect(page.locator('#mc-import-msg')).toContainText(/invalid/i);

    await invokeTool(page, 'browse.open', { destination: 'match-log' });
    await expect(page.getByText('No matches played yet')).toBeVisible();
  });

  test('4.1 stats_empty_before_first_match', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await invokeTool(page, 'browse.open', { destination: 'stats' });
    await expect(page.getByRole('heading', { name: 'No matches played yet' })).toBeVisible();
    await expect(page.getByText(/start a match to begin tracking/i)).toBeVisible();
  });
});
