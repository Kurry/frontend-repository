import type {
  AppStore, Difficulty, TileData, Turn, GameSnapshot,
  HistoryNode, RoundResult, PlayerMode, ToastKind, MatchLogEntry,
} from './types';

export const DIFFICULTY_CONFIG = {
  easy: { rows: 8, cols: 8, mines: 10 },
  medium: { rows: 10, cols: 10, mines: 16 },
  hard: { rows: 12, cols: 12, mines: 24 },
} as const;

export const TARGET_SCORE = 50;
export const MAX_STRIKES = 3;
export const MAX_HINTS = 2;
export const HINT_COST = 3;
export const MINE_PENALTY = 5;

let _hid = 1;

// ── Toast / confirmation helpers ──────────────────────────────────────────────
// A transient confirmation/rejection that the App-level toaster fades out on its
// own (motion 4.12 / 4.14, edge 4.4). Rejection feedback names the attempted
// action and why it is unavailable (edge 4.3 / writing 15.2).
export function showToast(store: AppStore, message: string, kind: ToastKind = 'info') {
  store.toast = message;
  store.toastKind = kind;
}

export function clearToast(store: AppStore) {
  store.toast = '';
}

// ── Navigation (single source for the visible nav buttons and WebMCP goto) ────
// Mid-round navigation to Stats / Match log / Export centre must preserve the
// round (behavioral 14.7) and let "back" return to the same frozen round instead
// of the setup screen. We never reset scores/turn when changing views.
export function navigateTo(store: AppStore, dest: 'stats' | 'match-log' | 'export-center' | 'game-board' | 'setup') {
  if (dest === 'setup') {
    store.returnToGame = false;
    store.returnPhase = null;
    store.phase = 'setup';
    return;
  }
  if (dest === 'game-board') {
    const returnPhase = store.returnToGame ? store.returnPhase : null;
    store.returnToGame = false;
    store.returnPhase = null;
    if (returnPhase) store.phase = returnPhase;
    return;
  }
  // Leaving an active round to read stats/log/export — remember so "back"
  // restores the round (and the pause state) rather than dumping to setup.
  if (store.phase === 'playing' || store.phase === 'round-result') {
    store.returnToGame = true;
    store.returnPhase = store.phase;
  } else if (!store.returnToGame) {
    store.returnToGame = false;
    store.returnPhase = null;
  }
  store.phase = dest;
}

// "← Go back" used by Stats / Match log / Export centre. Returns to the active
// round when the player opened the view from one (round + pause preserved),
// otherwise returns to the setup screen.
export function goBack(store: AppStore) {
  if (store.returnToGame) {
    const returnPhase = store.returnPhase ?? 'playing';
    store.returnToGame = false;
    store.returnPhase = null;
    store.phase = returnPhase;
  } else {
    store.returnPhase = null;
    store.phase = 'setup';
  }
}

// ── Board Generation ──────────────────────────────────────────────────────────

export function generateBoard(difficulty: Difficulty): TileData[][] {
  const { rows, cols, mines } = DIFFICULTY_CONFIG[difficulty];

  const board: TileData[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false,
      adjacentMines: 0,
      oreValue: 0,
      revealed: false,
      flagged: false,
      hintStatus: 'none' as const,
      revealedBy: null,
    }))
  );

  let placed = 0;
  while (placed < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!board[r][c].isMine) {
      board[r][c].isMine = true;
      placed++;
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].isMine) continue;
      let adj = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isMine) adj++;
        }
      }
      board[r][c].adjacentMines = adj;
      board[r][c].oreValue = Math.floor(Math.random() * 3) + 1;
    }
  }

  return board;
}

// ── Snapshot ──────────────────────────────────────────────────────────────────

export function cloneGameState(store: AppStore): GameSnapshot {
  return {
    tiles: store.tiles.map(row => row.map(t => ({ ...t }))),
    player: { ...store.player },
    rival: { ...store.rival },
    roundPlayerOreMined: store.roundPlayerOreMined,
    roundRivalOreMined: store.roundRivalOreMined,
    currentTurn: store.currentTurn,
    playerMode: store.playerMode,
    hintsUsed: store.hintsUsed,
    feedback: store.feedback,
  };
}

export function applyGameSnapshot(store: AppStore, snap: GameSnapshot) {
  for (let r = 0; r < snap.tiles.length; r++) {
    for (let c = 0; c < snap.tiles[r].length; c++) {
      const src = snap.tiles[r][c];
      const dst = store.tiles[r][c];
      dst.isMine = src.isMine;
      dst.adjacentMines = src.adjacentMines;
      dst.oreValue = src.oreValue;
      dst.revealed = src.revealed;
      dst.flagged = src.flagged;
      dst.hintStatus = src.hintStatus;
      dst.revealedBy = src.revealedBy;
    }
  }
  store.player.score = snap.player.score;
  store.player.strikes = snap.player.strikes;
  store.rival.score = snap.rival.score;
  store.rival.strikes = snap.rival.strikes;
  store.roundPlayerOreMined = snap.roundPlayerOreMined;
  store.roundRivalOreMined = snap.roundRivalOreMined;
  store.currentTurn = snap.currentTurn;
  store.playerMode = snap.playerMode;
  store.hintsUsed = snap.hintsUsed;
  store.feedback = snap.feedback;
  store.lastRoundResult = null;
  // If the restored node hands the turn to the Rival (e.g. undoing to a state
  // right after the Player's reveal), re-arm the Rival's thinking timer so the
  // turn does not stall. The App-level effect keys off isRivalThinking and
  // schedules doRivalTurn; player-turn snapshots leave it false.
  store.isRivalThinking = snap.currentTurn === 'rival';
}

// ── History ──────────────────────────────────────────────────────────────────

export function addHistoryEntry(store: AppStore, label: string) {
  const id = String(_hid++);
  const parentId = store.currentHistoryId;

  const node: HistoryNode = {
    id,
    parentId,
    childIds: [],
    label,
    snapshot: cloneGameState(store),
  };

  if (parentId !== null) {
    const parent = store.historyNodes.find(n => n.id === parentId);
    if (parent) parent.childIds.push(id);
  }

  store.historyNodes.push(node);
  store.currentHistoryId = id;
  store.selectedHistoryId = id;
}

export function undoHistory(store: AppStore) {
  if (store.phase !== 'playing') return;
  const cur = store.historyNodes.find(n => n.id === store.currentHistoryId);
  if (!cur || cur.parentId === null) return;
  const parent = store.historyNodes.find(n => n.id === cur.parentId);
  if (!parent) return;
  applyGameSnapshot(store, parent.snapshot);
  store.currentHistoryId = parent.id;
  store.selectedHistoryId = parent.id;
}

export function redoHistory(store: AppStore) {
  if (store.phase !== 'playing') return;
  const cur = store.historyNodes.find(n => n.id === store.currentHistoryId);
  if (!cur || cur.childIds.length === 0) return;
  const childId = cur.childIds[cur.childIds.length - 1];
  const child = store.historyNodes.find(n => n.id === childId);
  if (!child) return;
  applyGameSnapshot(store, child.snapshot);
  store.currentHistoryId = childId;
  store.selectedHistoryId = childId;
}

export function applyHistoryNode(store: AppStore, nodeId: string) {
  if (store.phase !== 'playing') return;
  const node = store.historyNodes.find(n => n.id === nodeId);
  if (!node) return;
  applyGameSnapshot(store, node.snapshot);
  store.currentHistoryId = nodeId;
  store.selectedHistoryId = nodeId;
}

// Rebuilds historyNodes into a single root reflecting the store's CURRENT
// board/scores/turn. Used both when a fresh round starts and when a saved
// checkpoint is resumed, so Undo/Redo/History never carry a stale branch
// from a previous round or an earlier session.
export function resetHistoryRoot(store: AppStore, label: string) {
  _hid = 1;
  const rootSnap = cloneGameState(store);
  store.historyNodes = [{
    id: '0',
    parentId: null,
    childIds: [],
    label,
    snapshot: rootSnap,
  }];
  store.currentHistoryId = '0';
  store.selectedHistoryId = '0';
}

// ── Stats ─────────────────────────────────────────────────────────────────────

function emptyDiffStats() {
  return { matchesPlayed: 0, matchesWon: 0, totalOreMined: 0, bestSingleRoundScore: 0 };
}

export function defaultStats() {
  return { easy: emptyDiffStats(), medium: emptyDiffStats(), hard: emptyDiffStats() };
}

// ── Round Init ────────────────────────────────────────────────────────────────

export function initRound(store: AppStore) {
  const cfg = DIFFICULTY_CONFIG[store.difficulty];
  store.rows = cfg.rows;
  store.cols = cfg.cols;
  store.mineCount = cfg.mines;
  store.targetScore = TARGET_SCORE;
  store.tiles = generateBoard(store.difficulty);
  store.player.score = 0;
  store.player.strikes = 0;
  store.rival.score = 0;
  store.rival.strikes = 0;
  store.roundPlayerOreMined = 0;
  store.roundRivalOreMined = 0;
  store.currentTurn = 'player';
  store.playerMode = 'reveal';
  store.isRivalThinking = false;
  store.paused = false;
  store.hintsUsed = 0;
  store.lastRoundResult = null;
  store.lastPlayerActionLabel = '';
  store.showHistoryPanel = false;
  store.feedback = 'Your turn. Reveal, flag or inspect a tile.';

  resetHistoryRoot(store, 'Round start');
}

// ── Tile Actions ──────────────────────────────────────────────────────────────

export function revealTile(store: AppStore, row: number, col: number, by: Turn): 'mine' | 'safe' {
  const tile = store.tiles[row][col];
  tile.revealed = true;
  tile.revealedBy = by;
  tile.flagged = false;

  const actor = by === 'player' ? store.player : store.rival;
  if (tile.isMine) {
    actor.strikes = Math.min(actor.strikes + 1, MAX_STRIKES);
    actor.score = Math.max(0, actor.score - MINE_PENALTY);
    return 'mine';
  } else {
    actor.score += tile.oreValue;
    if (by === 'player') store.roundPlayerOreMined += tile.oreValue;
    else store.roundRivalOreMined += tile.oreValue;
    return 'safe';
  }
}

function endRound(store: AppStore, winner: Turn | 'draw', reason: string) {
  const result: RoundResult = {
    roundNumber: store.roundNumber,
    playerScore: store.player.score,
    rivalScore: store.rival.score,
    playerStrikes: store.player.strikes,
    rivalStrikes: store.rival.strikes,
    playerOreMined: store.roundPlayerOreMined,
    rivalOreMined: store.roundRivalOreMined,
    winner,
    reason,
  };
  store.lastRoundResult = result;
  store.matchRounds.push(result);

  if (winner === 'player') store.playerMatchWins++;
  else if (winner === 'rival') store.rivalMatchWins++;

  const d = store.difficulty;
  store.stats[d].totalOreMined += store.roundPlayerOreMined;
  if (store.player.score > store.stats[d].bestSingleRoundScore) {
    store.stats[d].bestSingleRoundScore = store.player.score;
  }

  store.phase = 'round-result';
  store.isRivalThinking = false;
}

export function checkRoundEnd(store: AppStore): boolean {
  if (store.player.strikes >= MAX_STRIKES) { endRound(store, 'rival', 'Player struck out!'); return true; }
  if (store.rival.strikes >= MAX_STRIKES) { endRound(store, 'player', 'Rival struck out!'); return true; }
  if (store.player.score >= store.targetScore) { endRound(store, 'player', `Reached ${store.targetScore} ore!`); return true; }
  if (store.rival.score >= store.targetScore) { endRound(store, 'rival', `Rival reached ${store.targetScore} ore!`); return true; }

  let anyHidden = false;
  outer: for (let r = 0; r < store.rows; r++) {
    for (let c = 0; c < store.cols; c++) {
      if (!store.tiles[r][c].isMine && !store.tiles[r][c].revealed) { anyHidden = true; break outer; }
    }
  }
  if (!anyHidden) {
    const w: Turn | 'draw' = store.player.score > store.rival.score ? 'player'
      : store.rival.score > store.player.score ? 'rival' : 'draw';
    endRound(store, w, 'All ore mined!');
    return true;
  }
  return false;
}

export function startNextRound(store: AppStore) {
  if (store.phase !== 'round-result') return;
  if (store.playerMatchWins >= 2 || store.rivalMatchWins >= 2) {
    const d = store.difficulty;
    store.stats[d].matchesPlayed++;
    if (store.playerMatchWins >= 2) store.stats[d].matchesWon++;
    store.matchLog.push({
      playerName: store.playerName,
      difficulty: d,
      playerRoundWins: store.playerMatchWins,
      rivalRoundWins: store.rivalMatchWins,
      playerTotalOre: store.matchRounds.reduce((sum, r) => sum + r.playerOreMined, 0),
      rivalTotalOre: store.matchRounds.reduce((sum, r) => sum + r.rivalOreMined, 0),
      winner: store.playerMatchWins >= 2 ? 'player' : 'rival',
      rounds: store.matchRounds.map((r) => ({
        roundNumber: r.roundNumber,
        playerScore: r.playerScore,
        rivalScore: r.rivalScore,
        playerStrikes: r.playerStrikes,
        rivalStrikes: r.rivalStrikes,
        outcomeReason: r.reason,
      })),
      endedAt: new Date().toISOString(),
    });
    // The match is over; a checkpoint saved mid-round now points at a round
    // that no longer exists, so drop it rather than leave Resume Saved Match
    // able to reload an obsolete board.
    store.savedCheckpoint = null;
    store.phase = 'match-complete';
    return;
  }
  store.roundNumber++;
  initRound(store);
  store.phase = 'playing';
}

// ── Player Actions ────────────────────────────────────────────────────────────

export function playerRevealTile(store: AppStore, row: number, col: number) {
  if (store.phase !== 'playing' || store.currentTurn !== 'player' || store.isRivalThinking || store.paused) return;
  const tile = store.tiles[row][col];
  if (tile.revealed || tile.flagged) return;

  const scoreBefore = store.player.score;
  const result = revealTile(store, row, col, 'player');
  const pointsLost = scoreBefore - store.player.score;
  store.feedback = result === 'mine'
    ? `Mine hit. You lost ${pointsLost} ${pointsLost === 1 ? 'point' : 'points'} and gained 1 strike.`
    : `Ore mined. You gained ${tile.oreValue} ${tile.oreValue === 1 ? 'point' : 'points'}.`;
  const ended = checkRoundEnd(store);
  if (!ended) {
    store.lastPlayerActionLabel = `Reveal(${row},${col})`;
    store.currentTurn = 'rival';
    store.isRivalThinking = true;
    // Record the Player's reveal as its own history node immediately so the
    // "History state" snapshot reflects the updated score with the Rival to
    // move (core 1.22), and so Undo is available the instant the reveal lands
    // (edge 4.6) instead of waiting for the Rival's delayed move.
    addHistoryEntry(store, `Reveal(${row},${col})`);
  }
}

export function playerToggleFlag(store: AppStore, row: number, col: number) {
  if (store.phase !== 'playing' || store.currentTurn !== 'player' || store.isRivalThinking || store.paused) return;
  const tile = store.tiles[row][col];
  if (tile.revealed) return;
  tile.flagged = !tile.flagged;
  const label = tile.flagged ? `Flag(${row},${col})` : `Unflag(${row},${col})`;
  store.feedback = tile.flagged
    ? 'Tile flagged. Unflag it before revealing.'
    : 'Flag removed. The tile can be revealed.';
  addHistoryEntry(store, label);
}

export function playerUseHint(store: AppStore, row: number, col: number) {
  if (store.phase !== 'playing' || store.currentTurn !== 'player' || store.isRivalThinking || store.paused) return;
  if (store.hintsUsed >= MAX_HINTS) return;
  const tile = store.tiles[row][col];
  if (tile.revealed) return;
  if (tile.hintStatus !== 'none') {
    showToast(store, 'That tile already has a hint — pick a different covered tile.', 'reject');
    return;
  }
  store.player.score = Math.max(0, store.player.score - HINT_COST);
  store.hintsUsed++;
  tile.hintStatus = tile.isMine ? 'mine' : 'safe';
  store.feedback = tile.isMine
    ? 'Hint: this covered tile is a mine.'
    : 'Hint: this covered tile is safe.';
  store.playerMode = 'reveal';
  addHistoryEntry(store, `Hint(${row},${col})`);
}

// ── Rival AI ──────────────────────────────────────────────────────────────────

function neighbors(r: number, c: number, rows: number, cols: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) out.push([nr, nc]);
    }
  }
  return out;
}

export function chooseRivalTile(tiles: TileData[][], rows: number, cols: number): [number, number] {
  const candidates: Array<[number, number]> = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (!tiles[r][c].revealed && !tiles[r][c].flagged) candidates.push([r, c]);

  if (candidates.length === 0) return [-1, -1];

  const deduced = new Set<string>();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t = tiles[r][c];
      if (!t.revealed || t.isMine || t.adjacentMines === 0) continue;
      const ns = neighbors(r, c, rows, cols);
      const hidden = ns.filter(([nr, nc]) => !tiles[nr][nc].revealed);
      if (hidden.length === t.adjacentMines) hidden.forEach(([nr, nc]) => deduced.add(`${nr},${nc}`));
    }
  }

  const safe = candidates.filter(([r, c]) => !deduced.has(`${r},${c}`));
  const pool = safe.length > 0 ? safe : candidates;

  const scored = pool.map(([r, c]) => {
    let score = 0;
    for (const [nr, nc] of neighbors(r, c, rows, cols)) {
      const nb = tiles[nr][nc];
      if (nb.revealed && !nb.isMine) {
        score += nb.adjacentMines === 0 ? 10 : Math.max(0, 6 - nb.adjacentMines);
      }
    }
    return [r, c, score] as [number, number, number];
  });

  scored.sort((a, b) => b[2] - a[2]);
  const topN = Math.min(3, scored.length);
  const pick = Math.floor(Math.random() * topN);
  return [scored[pick][0], scored[pick][1]];
}

export function doRivalTurn(store: AppStore) {
  // A history jump can cancel the pending Rival move before the App effect's
  // timer cleanup runs. Ignore that stale callback instead of mutating the
  // newly restored Player-turn snapshot.
  if (store.phase !== 'playing' || store.currentTurn !== 'rival' || !store.isRivalThinking) {
    store.isRivalThinking = false;
    return;
  }

  const [row, col] = chooseRivalTile(store.tiles, store.rows, store.cols);
  if (row === -1) { store.isRivalThinking = false; store.currentTurn = 'player'; return; }

  revealTile(store, row, col, 'rival');
  const ended = checkRoundEnd(store);

  if (!ended) {
    store.currentTurn = 'player';
    store.isRivalThinking = false;
    store.feedback = 'Your turn. Choose a covered tile.';
    addHistoryEntry(store, `Rival(${row},${col})`);
  } else {
    store.isRivalThinking = false;
  }
}

// ── Match Init ────────────────────────────────────────────────────────────────

export function resetMatch(store: AppStore) {
  store.roundNumber = 1;
  store.matchRounds = [];
  store.playerMatchWins = 0;
  store.rivalMatchWins = 0;
  store.lastRoundResult = null;
  store.playerMode = 'reveal';
  store.isRivalThinking = false;
  store.paused = false;
  store.returnToGame = false;
  store.returnPhase = null;
  // Starting a fresh match (Start match / Rematch) makes any previously
  // saved in-progress checkpoint obsolete.
  store.savedCheckpoint = null;
  initRound(store);
  store.phase = 'playing';
}

export function initNewMatch(store: AppStore) {
  if (store.phase !== 'setup' && store.phase !== 'match-complete') return;
  resetMatch(store);
}

// ── Save / resume checkpoint ──────────────────────────────────────────────────

export function saveProgress(store: AppStore) {
  if (store.phase !== 'playing' && store.phase !== 'round-result') return;
  const revealed = store.tiles.some(row => row.some(t => t.revealed));
  if (!revealed) {
    showToast(store, 'Reveal at least one tile before saving progress.', 'reject');
    return;
  }
  store.savedCheckpoint = {
    phase: store.phase,
    playerName: store.playerName,
    difficulty: store.difficulty,
    roundNumber: store.roundNumber,
    playerScore: store.player.score,
    rivalScore: store.rival.score,
    playerStrikes: store.player.strikes,
    rivalStrikes: store.rival.strikes,
    sideToMove: store.currentTurn,
    hintsRemaining: MAX_HINTS - store.hintsUsed,
    playerRoundWins: store.playerMatchWins,
    rivalRoundWins: store.rivalMatchWins,
    board: JSON.parse(JSON.stringify(store.tiles)),
    targetScore: store.targetScore,
    mineCount: store.mineCount,
    paused: store.paused,
    roundPlayerOreMined: store.roundPlayerOreMined,
    roundRivalOreMined: store.roundRivalOreMined,
    matchRounds: JSON.parse(JSON.stringify(store.matchRounds)),
    lastRoundResult: store.lastRoundResult ? { ...store.lastRoundResult } : null,
  };
  showToast(store, 'Saved progress — your round checkpoint is stored.', 'success');
}

// ── Export / import / copy ────────────────────────────────────────────────────

export function matchToJson(entry: MatchLogEntry): string {
  return JSON.stringify(entry, null, 2);
}

export function archiveJson(matches: MatchLogEntry[]): string {
  return JSON.stringify({ matches }, null, 2);
}

// Same handler the on-screen "Export Match" control uses, so a WebMCP
// artifact-export call and a human click produce the same rendered artifact.
// NOTE: no raw JSON or blob is returned through WebMCP — the artifact is shown
// in the DOM (rendered as a readable, copyable preview) for Playwright to read.
export function exportMatch(store: AppStore, entry: MatchLogEntry | null) {
  if (!entry) {
    showToast(store, 'No finished match to export yet.', 'reject');
    return;
  }
  store.exportArtifact = { title: `Export Match — ${entry.playerName}`, json: matchToJson(entry) };
}

export function exportArchive(store: AppStore) {
  if (store.matchLog.length === 0) {
    showToast(store, 'No finished matches to export yet.', 'reject');
    return;
  }
  store.exportArtifact = { title: 'Export Archive', json: archiveJson(store.matchLog) };
}

export function latestMatch(store: AppStore): MatchLogEntry | null {
  return store.matchLog.length > 0 ? store.matchLog[store.matchLog.length - 1] : null;
}

// Writes text to the clipboard, returning whether it succeeded. Never throws or
// rejects: the clipboard API may be unavailable (sandboxed iframe, permission
// denial) so we fall back to a temporary textarea + execCommand. No native
// download / file-chooser is ever opened.
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fall through to legacy path */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    ta.style.pointerEvents = 'none';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

export async function copyArtifact(store: AppStore, text: string, verb = 'Copied') {
  const ok = await copyText(text);
  if (ok) showToast(store, `${verb} to clipboard.`, 'success');
  else showToast(store, 'Could not copy — select the JSON below and copy it manually.', 'reject');
  return ok;
}

function isMatchLogEntry(v: unknown): v is MatchLogEntry {
  if (!v || typeof v !== 'object') return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.playerName === 'string' &&
    (r.difficulty === 'easy' || r.difficulty === 'medium' || r.difficulty === 'hard') &&
    typeof r.playerRoundWins === 'number' &&
    typeof r.rivalRoundWins === 'number' &&
    typeof r.playerTotalOre === 'number' &&
    typeof r.rivalTotalOre === 'number' &&
    (r.winner === 'player' || r.winner === 'rival' || r.winner === 'draw') &&
    Array.isArray(r.rounds) &&
    typeof r.endedAt === 'string'
  );
}

// Single source for the visible Import button and the WebMCP artifact-import
// tool. Reads store.importText, validates against the match-record contract, and
// mutates the Match log (or leaves everything untouched on rejection).
export function applyImport(store: AppStore): { ok: boolean; imported: number } {
  const raw = store.importText.trim();
  if (!raw) {
    store.importOk = false;
    store.importMessage = 'Import failed: the file is invalid — paste a JSON record first.';
    return { ok: false, imported: 0 };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    store.importOk = false;
    store.importMessage = 'Import failed: the file is invalid — it is not valid JSON.';
    return { ok: false, imported: 0 };
  }
  const isArchive = Array.isArray((parsed as { matches?: unknown })?.matches);
  const candidates: unknown[] = isArchive ? (parsed as { matches: unknown[] }).matches : [parsed];
  if (!Array.isArray(candidates) || candidates.length === 0 || !candidates.every(isMatchLogEntry)) {
    store.importOk = false;
    store.importMessage = 'Import failed: the file is invalid — it is missing required match fields.';
    return { ok: false, imported: 0 };
  }
  const records = (candidates as MatchLogEntry[]).map((c) => ({
    playerName: c.playerName,
    difficulty: c.difficulty as Difficulty,
    playerRoundWins: c.playerRoundWins,
    rivalRoundWins: c.rivalRoundWins,
    playerTotalOre: c.playerTotalOre,
    rivalTotalOre: c.rivalTotalOre,
    winner: c.winner,
    rounds: c.rounds,
    endedAt: c.endedAt,
  }));
  if (isArchive) {
    store.matchLog = records;
  } else {
    store.matchLog.push(...records);
  }
  store.importOk = true;
  store.importMessage = `Imported ${records.length} match record${records.length === 1 ? '' : 's'} into the Match log.`;
  store.importText = '';
  return { ok: true, imported: records.length };
}
