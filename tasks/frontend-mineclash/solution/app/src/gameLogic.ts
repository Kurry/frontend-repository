import type {
  AppStore, Difficulty, TileData, Turn, GameSnapshot,
  HistoryNode, RoundResult, PlayerMode
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
  store.currentTurn = snap.currentTurn;
  store.playerMode = snap.playerMode;
  store.hintsUsed = snap.hintsUsed;
  store.feedback = snap.feedback;
  store.isRivalThinking = false;
  store.lastRoundResult = null;
}

// ── History ───────────────────────────────────────────────────────────────────

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
  if (store.phase !== 'playing' || store.isRivalThinking) return;
  const cur = store.historyNodes.find(n => n.id === store.currentHistoryId);
  if (!cur || cur.parentId === null) return;
  const parent = store.historyNodes.find(n => n.id === cur.parentId);
  if (!parent) return;
  applyGameSnapshot(store, parent.snapshot);
  store.currentHistoryId = parent.id;
  store.selectedHistoryId = parent.id;
}

export function redoHistory(store: AppStore) {
  if (store.phase !== 'playing' || store.isRivalThinking) return;
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
  if (store.phase !== 'playing' || store.isRivalThinking) return;
  const node = store.historyNodes.find(n => n.id === nodeId);
  if (!node) return;
  applyGameSnapshot(store, node.snapshot);
  store.currentHistoryId = nodeId;
  store.selectedHistoryId = nodeId;
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
  store.currentTurn = 'player';
  store.playerMode = 'reveal';
  store.isRivalThinking = false;
  store.paused = false;
  store.hintsUsed = 0;
  store.lastRoundResult = null;
  store.lastPlayerActionLabel = '';
  store.showHistoryPanel = false;
  store.feedback = 'Your turn. Reveal, flag or inspect a tile.';

  _hid = 1;
  const rootSnap = cloneGameState(store);
  store.historyNodes = [{
    id: '0',
    parentId: null,
    childIds: [],
    label: 'Round start',
    snapshot: rootSnap,
  }];
  store.currentHistoryId = '0';
  store.selectedHistoryId = '0';
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
    return 'safe';
  }
}

function endRound(store: AppStore, winner: Turn | 'draw', reason: string) {
  const result: RoundResult = {
    playerScore: store.player.score,
    rivalScore: store.rival.score,
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
    store.feedback = 'This tile already has a hint. Choose another covered tile.';
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
  if (store.phase !== 'playing') { store.isRivalThinking = false; return; }

  const [row, col] = chooseRivalTile(store.tiles, store.rows, store.cols);
  if (row === -1) { store.isRivalThinking = false; store.currentTurn = 'player'; return; }

  revealTile(store, row, col, 'rival');
  const ended = checkRoundEnd(store);

  if (!ended) {
    store.currentTurn = 'player';
    store.isRivalThinking = false;
    store.feedback = 'Your turn. Choose a covered tile.';
    const label = `${store.lastPlayerActionLabel}→Rival(${row},${col})`;
    addHistoryEntry(store, label);
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
  initRound(store);
  store.phase = 'playing';
}

export function initNewMatch(store: AppStore) {
  if (store.phase !== 'setup' && store.phase !== 'match-complete') return;
  resetMatch(store);
}
