import { create } from 'zustand';
import {
  GameState,
  Tile,
  GameResult,
  RunWord,
  Achievement,
  Toast,
  ToastType,
  UndoState,
  HistoryNode,
  CheckpointPayload,
  LifetimeStats,
  COLUMN_COUNT,
  TILE_SIZE,
  DIFFICULTY_TIERS,
  DANGER_LINE_Y,
  FALL_SPEED_BASE,
  SPAWN_INTERVAL_BASE,
  defaultAchievements,
} from '../game/types';
import { buildGameResult, buildHistoryArchive, copyToClipboard, projectTilesForDebug, validateGameResult } from '../game/io';
import { isValidWord } from '../game/dictionary';
import confetti from 'canvas-confetti';

// ---- safe localStorage -----------------------------------------------------
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const item = localStorage.getItem(key);
    if (item === null) return fallback;
    return JSON.parse(item) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — persistence degrades silently, never crashes */
  }
}

function clearStorage(key: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}

const LETTER_FREQ = 'AAAAABBCCDDEEEEEEEFFGGGHHIIIIJKLLMMNNNNNOOOOPQRSSTTTTTUUVWWXYYZ';
function randomLetter(): string {
  return LETTER_FREQ[Math.floor(Math.random() * LETTER_FREQ.length)];
}

// Curated short, duplicate-free, dictionary-valid words. The spawn stream
// regularly injects the letters of one of these (staggered one per spawn tick
// so they coexist on the board at different heights and stay clickable), which
// guarantees an attentive player — human or vision-driven — can almost always
// find and clear a real word. This is what makes the game winnable in practice;
// purely random tiles rarely contain a spellable word.
const PLAN_WORDS = [
  'CAT', 'DOG', 'SUN', 'HAT', 'RED', 'BIG', 'FUN', 'RUN', 'TOP', 'POT',
  'NET', 'PEN', 'BED', 'CUP', 'MAP', 'BUS', 'JAM', 'FOX', 'OWL', 'SKY',
  'FLY', 'CRY', 'DRY', 'TRY', 'WIN', 'HIT', 'SIT', 'BIT', 'FIT', 'LIT',
  'HUG', 'MUG', 'RUG', 'BUG', 'LOG', 'HOG', 'FOG', 'DIG', 'FIG', 'PIG',
  'BAG', 'RAG', 'TAG', 'WAG', 'FAN', 'PAN', 'CAN', 'BAN', 'MAN', 'RAN',
  'TAN', 'VAN', 'STAR', 'FROG', 'BOAT', 'DRUM', 'FISH', 'BIRD', 'WORD', 'PLAY',
];
// Module-level spawn plan (not React state — it would just churn renders). A
// queue of {letter, column} to emit on upcoming spawn ticks, plus tick
// bookkeeping so a fresh word is planned often enough that the board stays
// solvable. Planned letters are spread across DISTINCT columns so a word reads
// left-to-right and its tiles don't visually stack, which also makes ordered
// clicking (human or vision-driven) reliable.
let planQueue: { letter: string; column: number }[] = [];
let ticksSincePlan = 99;
function clearSpawnPlan() {
  planQueue = [];
  ticksSincePlan = 99;
}
function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const DEFAULT_PLAYER_NAME = 'Player';

function sanitizePlayerName(raw: unknown): string {
  if (typeof raw !== 'string') return DEFAULT_PLAYER_NAME;
  const trimmed = raw.trim();
  if (trimmed.length < 2 || trimmed.length > 20) return DEFAULT_PLAYER_NAME;
  return trimmed;
}
function sanitizeStartingTier(raw: unknown): 1 | 2 | 3 {
  if (raw === 1 || raw === 2 || raw === 3) return raw;
  return 1;
}
function sanitizeStats(raw: unknown): LifetimeStats {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const totalWords = typeof r.totalWords === 'number' && r.totalWords >= 0 ? Math.floor(r.totalWords) : 0;
  const bombsTriggered = typeof r.bombsTriggered === 'number' && r.bombsTriggered >= 0 ? Math.floor(r.bombsTriggered) : 0;
  return { totalWords, bombsTriggered };
}

function getDifficultyTier(score: number): number {
  let tier = 0;
  for (let i = DIFFICULTY_TIERS.length - 1; i >= 0; i--) {
    if (score >= DIFFICULTY_TIERS[i].scoreThreshold) {
      tier = i;
      break;
    }
  }
  return tier;
}

// ---- persisted boot state --------------------------------------------------
const persistedBestScore = Math.max(0, Math.round(loadFromStorage<number>('letterdrop_bestScore', 0) || 0));
const persistedHistoryRaw = loadFromStorage<unknown>('letterdrop_history', []);
const persistedHistory: GameResult[] = Array.isArray(persistedHistoryRaw)
  ? persistedHistoryRaw.flatMap((raw) => {
      if (!raw || typeof raw !== 'object') return [];
      // Saves produced before per-run words were added are still useful. Add
      // the empty collection they implied, then retain only records that meet
      // the current browser-visible/export contract.
      const candidate = {
        ...(raw as Record<string, unknown>),
        words: Array.isArray((raw as Record<string, unknown>).words)
          ? (raw as Record<string, unknown>).words
          : [],
      };
      return validateGameResult(candidate) === null ? [candidate as unknown as GameResult] : [];
    })
  : [];
const persistedAchievementsData = loadFromStorage<Achievement[] | null>('letterdrop_achievements', null);
const persistedAchievements = persistedAchievementsData || defaultAchievements;
// Make sure every shipped achievement is present (older saves may lack newer
// milestone badges); never drop a user's unlock state.
const achievementMap = new Map(persistedAchievements.map((a) => [a.id, a]));
const initializedAchievements = defaultAchievements.map(
  (def) => achievementMap.get(def.id) || { ...def },
);
const persistedPlayerName = sanitizePlayerName(loadFromStorage<unknown>('letterdrop_playerName', DEFAULT_PLAYER_NAME));
const persistedStartingTier = sanitizeStartingTier(loadFromStorage<unknown>('letterdrop_startingTier', 1));
const persistedStats = sanitizeStats(loadFromStorage<unknown>('letterdrop_stats', { totalWords: 0, bombsTriggered: 0 }));
const persistedCheckpointRaw = loadFromStorage<CheckpointPayload | null>('letterdrop_checkpoint', null);
const persistedCheckpoint: CheckpointPayload | null =
  persistedCheckpointRaw &&
  persistedCheckpointRaw.format === 'letterdrop-checkpoint-v1' &&
  persistedCheckpointRaw.schemaVersion === 1
    ? persistedCheckpointRaw
    : null;

const maxUndoHistory = 20;

interface GameActions {
  startGame: () => void;
  restartGame: () => void;
  setGameMode: (mode: GameState['gameMode']) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  spawnTile: (boardWidth: number) => void;
  updateTiles: (dt: number) => boolean;
  selectTile: (tileId: string) => void;
  deselectTile: (tileId: string) => void;
  submitWord: () => boolean;
  undoLastTile: () => void;
  clearToast: (id: string) => void;
  addToast: (message: string, type: ToastType) => void;
  registerIllegalCanvasAction: (reason: string) => void;
  setView: (view: GameState['currentView']) => void;
  applyScenarioChange: () => void;
  selectHistoryNode: (nodeId: string) => void;
  undoAction: () => void;
  redoAction: () => void;
  resetGame: () => void;
  // Settings
  openSettings: () => void;
  closeSettings: () => void;
  saveSettings: (name: string, tier: 1 | 2 | 3) => boolean;
  // Checkpoint
  saveCheckpoint: () => boolean;
  resumeCheckpoint: (boardWidth?: number) => void;
  // Export / import
  openExportRun: (run?: GameResult | null) => boolean;
  openExportHistory: () => boolean;
  closeExport: () => void;
  copyExport: () => Promise<boolean>;
  importRuns: (runs: GameResult[], mode: 'run' | 'history') => void;
  checkAchievements: () => void;
}

type GameStore = GameState & GameActions;

function captureUndoState(state: GameState): UndoState {
  return {
    tiles: state.tiles.map((tile) => ({ ...tile })),
    selectedWord: state.selectedWord.map((tile) => ({ ...tile })),
    score: state.score,
    streak: state.streak,
    multiplier: state.multiplier,
    difficulty: state.difficulty,
    tilesCleared: state.tilesCleared,
    boardCleared: state.boardCleared,
    elapsedTime: state.elapsedTime,
    scenarioRevision: state.scenarioRevision,
    flow: state.flow,
    spawnFlow: state.spawnFlow,
    maxTierReached: state.maxTierReached,
    currentRunWords: state.currentRunWords.map((w) => ({ ...w })),
  };
}

function restoreUndoState(snapshot: UndoState): Partial<GameState> {
  return {
    tiles: snapshot.tiles.map((tile) => ({ ...tile })),
    selectedWord: snapshot.selectedWord.map((tile) => ({ ...tile })),
    score: snapshot.score,
    streak: snapshot.streak,
    multiplier: snapshot.multiplier,
    difficulty: snapshot.difficulty,
    tilesCleared: snapshot.tilesCleared,
    boardCleared: snapshot.boardCleared,
    elapsedTime: snapshot.elapsedTime,
    scenarioRevision: snapshot.scenarioRevision,
    flow: snapshot.flow,
    spawnFlow: snapshot.spawnFlow,
    maxTierReached: snapshot.maxTierReached,
    currentRunWords: snapshot.currentRunWords.map((w) => ({ ...w })),
  };
}

function fireConfetti() {
  try {
    confetti({ particleCount: 110, spread: 72, origin: { y: 0.6 } });
  } catch {
    /* confetti is decorative; never let it break a run */
  }
}
function fireCelebration() {
  try {
    confetti({
      particleCount: 160,
      spread: 95,
      origin: { y: 0.5 },
      colors: ['#0066CC', '#FFD60A', '#34C759', '#AF52DE'],
    });
  } catch {
    /* noop */
  }
}

export const useGameStore = create<GameStore>()(
  (set, get) => ({
    // Initial state
    tiles: [],
    selectedWord: [],
    score: 0,
    bestScore: persistedBestScore,
    streak: 0,
    multiplier: 1,
    difficulty: 0,
    isPaused: false,
    isGameOver: false,
    gameStarted: false,
    boardCleared: false,
    slowActive: false,
    slowEndTime: 0,
    startTime: 0,
    endTime: null,
    elapsedTime: 0,
    tilesCleared: 0,
    spawnTimer: 0,
    flow: 1,
    spawnFlow: 1,
    maxTierReached: 1,
    currentRunWords: [],
    lastSubmitAt: 0,
    currentRunId: '',
    matchHistory: persistedHistory,
    achievements: initializedAchievements,
    stats: persistedStats,
    toasts: [],
    currentView: 'game',
    gameMode: 'solo',
    playerName: persistedPlayerName,
    startingTier: persistedStartingTier,
    checkpoint: persistedCheckpoint,
    lastRun: null,
    settingsOpen: false,
    exportPreview: null,
    importSurfaceVisible: false,
    undoHistory: [],
    redoStack: [],
    historyNodes: [],
    currentHistoryNodeId: null,
    scenarioRevision: 0,

    startGame: () => {
      const { startingTier } = get();
      const baseDifficulty = Math.max(0, startingTier - 1);
      const currentRunId = generateId();
      clearSpawnPlan();
      const rootId = generateId();
      const rootSnapshot: UndoState = {
        tiles: [],
        selectedWord: [],
        score: 0,
        streak: 0,
        multiplier: 1,
        difficulty: baseDifficulty,
        tilesCleared: 0,
        boardCleared: false,
        elapsedTime: 0,
        scenarioRevision: 0,
        flow: 1,
        spawnFlow: 1,
        maxTierReached: startingTier,
        currentRunWords: [],
      };
      set({
        tiles: [],
        selectedWord: [],
        score: 0,
        streak: 0,
        multiplier: 1,
        difficulty: baseDifficulty,
        isPaused: false,
        isGameOver: false,
        gameStarted: true,
        boardCleared: false,
        slowActive: false,
        slowEndTime: 0,
        startTime: Date.now(),
        endTime: null,
        elapsedTime: 0,
        tilesCleared: 0,
        spawnTimer: 0,
        flow: 1,
        spawnFlow: 1,
        maxTierReached: startingTier,
        currentRunWords: [],
        lastSubmitAt: 0,
        currentRunId,
        lastRun: null,
        undoHistory: [],
        redoStack: [],
        toasts: [],
        exportPreview: null,
        settingsOpen: false,
        historyNodes: [
          {
            id: rootId,
            parentId: null,
            label: 'Run started',
            children: [],
            snapshot: rootSnapshot,
          },
        ],
        currentHistoryNodeId: rootId,
        scenarioRevision: 0,
      });
    },

    restartGame: () => {
      // Atomic clean restart: the exact path the visible "Play again" and the
      // WebMCP session "restart" operation share. Doing it in one store action
      // guarantees rapid repeated activation can never interleave a reset and a
      // start into two runs.
      get().startGame();
    },

    setGameMode: (mode) => {
      const state = get();
      if (state.gameStarted && !state.isGameOver) {
        get().addToast('Finish or pause this run before changing mode', 'error');
        return;
      }
      set({
        gameMode: mode,
        tiles: [],
        selectedWord: [],
        score: 0,
        streak: 0,
        multiplier: 1,
        difficulty: 0,
        isPaused: false,
        isGameOver: false,
        gameStarted: false,
        boardCleared: false,
        slowActive: false,
        slowEndTime: 0,
        startTime: 0,
        endTime: null,
        elapsedTime: 0,
        tilesCleared: 0,
        flow: 1,
        spawnFlow: 1,
        maxTierReached: 1,
        currentRunWords: [],
        undoHistory: [],
        redoStack: [],
        historyNodes: [],
        currentHistoryNodeId: null,
        scenarioRevision: 0,
      });
      get().addToast(
        mode === 'challenge' ? 'Challenge mode: faster drops' : 'Solo mode: standard pace',
        'success',
      );
    },

    pauseGame: () => {
      const state = get();
      if (!state.gameStarted || state.isGameOver || state.isPaused) return;
      set({ isPaused: true });
      get().addToast('Game paused', 'success');
    },

    resumeGame: () => {
      const state = get();
      if (!state.isPaused || !state.gameStarted || state.isGameOver) return;
      set({ isPaused: false });
      get().addToast('Resumed', 'success');
    },

    endGame: () => {
      const state = get();
      if (state.isGameOver) return; // guard against double-end

      const endedAt = new Date().toISOString();
      const record = buildGameResult(state, endedAt);

      const newHistory = [record, ...state.matchHistory].slice(0, 50);
      const newBestScore = Math.max(state.score, state.bestScore);
      const checkpointBelongsToRun = state.checkpoint?.__restore?.runId === state.currentRunId;

      set({
        isGameOver: true,
        gameStarted: false,
        isPaused: false,
        endTime: Date.now(),
        matchHistory: newHistory,
        bestScore: newBestScore,
        lastRun: record,
        selectedWord: [],
        tiles: state.tiles.map((t) => ({ ...t, selected: false })),
        // Only a checkpoint owned by this finished run is stale. A checkpoint
        // from an earlier run remains resumable if the player chose Start game
        // instead of consuming Resume Saved Run.
        checkpoint: checkpointBelongsToRun ? null : state.checkpoint,
      });

      saveToStorage('letterdrop_bestScore', newBestScore);
      saveToStorage('letterdrop_history', newHistory);
      if (checkpointBelongsToRun) clearStorage('letterdrop_checkpoint');

      // Achievement check is deferred one tick so the committed record/state
      // settles before any unlock toast + celebration fires.
      setTimeout(() => get().checkAchievements(), 60);
    },

    spawnTile: (boardWidth: number) => {
      const state = get();
      if (state.isGameOver || state.isPaused || !state.gameStarted) return;

      const colWidth = boardWidth / COLUMN_COUNT;
      const modeFactor = state.gameMode === 'challenge' ? 1.25 : 1;

      // Plan a fresh solvable word often enough that the board always holds
      // something clearable, but not so often that it floods (cap the board and
      // skip planning while a previous plan is still draining).
      ticksSincePlan += 1;
      if (planQueue.length === 0 && ticksSincePlan >= 2 && state.tiles.length < 12 && Math.random() < 0.85) {
        const word = PLAN_WORDS[Math.floor(Math.random() * PLAN_WORDS.length)];
        // Distinct columns, shuffled, so the word spreads across the board.
        const cols = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5).slice(0, word.length);
        planQueue = word.split('').map((letter, i) => ({ letter, column: cols[i] }));
        ticksSincePlan = 0;
      }

      let letter: string;
      let column: number;
      let type: Tile['type'] = 'normal';
      if (planQueue.length > 0) {
        const item = planQueue.shift() as { letter: string; column: number };
        letter = item.letter;
        column = item.column;
      } else {
        letter = randomLetter();
        // Avoid stacking a fresh random tile on top of one that just spawned in
        // the same column (keeps the board readable and every tile clickable).
        const crowded = new Set(
          state.tiles.filter((t) => t.y < TILE_SIZE * 1.5).map((t) => t.column),
        );
        const free = [0, 1, 2, 3, 4, 5].filter((c) => !crowded.has(c));
        const pool = free.length ? free : [0, 1, 2, 3, 4, 5];
        column = pool[Math.floor(Math.random() * pool.length)];
        const rand = Math.random();
        if (rand < 0.06) type = 'bomb';
        else if (rand < 0.12) type = 'slow';
      }

      const x = column * colWidth + colWidth / 2;
      const tile: Tile = {
        id: generateId(),
        letter,
        x,
        y: -TILE_SIZE,
        column,
        speed: FALL_SPEED_BASE * modeFactor,
        type,
        selected: false,
        removing: false,
        opacity: 1,
      };

      set({ tiles: [...state.tiles, tile] });
    },

    updateTiles: (dt: number): boolean => {
      const state = get();
      if (state.isPaused || state.isGameOver || !state.gameStarted) return true;

      const now = Date.now();
      const slowOn = state.slowActive && now < state.slowEndTime;
      const slowFactor = slowOn ? 0.4 : 1;

      // Ease the global flow scales toward the current tier's asymptotes so a
      // tier change reads as a gradual ramp rather than a snap.
      const tier = DIFFICULTY_TIERS[state.difficulty] || DIFFICULTY_TIERS[0];
      const targetFlow = tier.fallSpeed / FALL_SPEED_BASE;
      const targetSpawn = SPAWN_INTERVAL_BASE / tier.spawnInterval;
      const k = Math.min(1, dt * 1.6);
      const flow = state.flow + (targetFlow - state.flow) * k;
      const spawnFlow = state.spawnFlow + (targetSpawn - state.spawnFlow) * k;

      const updatedTiles: Tile[] = [];
      let shouldEnd = false;
      for (const tile of state.tiles) {
        const newY = tile.y + tile.speed * flow * slowFactor * dt * 60;
        if (newY + TILE_SIZE / 2 > DANGER_LINE_Y && !tile.removing) {
          shouldEnd = true;
        }
        updatedTiles.push({ ...tile, y: newY });
      }

      set({
        tiles: updatedTiles,
        flow,
        spawnFlow,
        slowActive: slowOn,
        elapsedTime: state.elapsedTime + dt,
      });

      if (shouldEnd) {
        get().endGame();
        return false;
      }
      return true;
    },

    selectTile: (tileId: string) => {
      const state = get();
      if (state.isPaused || state.isGameOver || !state.gameStarted) return;
      const tile = state.tiles.find((t) => t.id === tileId);
      if (!tile || tile.selected || tile.removing) return;

      const snapshot = captureUndoState(state);
      const updatedTiles = state.tiles.map((t) => (t.id === tileId ? { ...t, selected: true } : t));
      set({
        tiles: updatedTiles,
        selectedWord: [...state.selectedWord, { ...tile, selected: true }],
        undoHistory: [...state.undoHistory.slice(-(maxUndoHistory - 1)), snapshot],
        redoStack: [],
      });
    },

    deselectTile: (tileId: string) => {
      const state = get();
      if (state.isPaused || state.isGameOver || !state.gameStarted) return;
      const updatedTiles = state.tiles.map((t) => (t.id === tileId ? { ...t, selected: false } : t));
      const updatedWord = state.selectedWord.filter((t) => t.id !== tileId);
      set({ tiles: updatedTiles, selectedWord: updatedWord });
    },

    submitWord: (): boolean => {
      const state = get();
      if (state.isPaused || state.isGameOver || !state.gameStarted) return false;
      if (state.selectedWord.length < 2) return false;

      const word = state.selectedWord.map((t) => t.letter).join('').toUpperCase();

      if (!isValidWord(word)) {
        get().addToast(`“${word}” is not a word — streak reset`, 'error');
        set({
          streak: 0,
          multiplier: 1,
          selectedWord: [],
          tiles: state.tiles.map((t) =>
            state.selectedWord.some((st) => st.id === t.id) ? { ...t, selected: false } : t,
          ),
        });
        return false;
      }

      const wordLength = state.selectedWord.length;
      const basePoints = wordLength <= 3 ? wordLength * 10 : wordLength * 10 + (wordLength - 3) * 5;
      const streakBonus = state.multiplier;
      const boardBonus = state.boardCleared ? 2 : 1;
      const points = Math.max(1, Math.round(basePoints * streakBonus * boardBonus));

      const hasBomb = state.selectedWord.some((t) => t.type === 'bomb');
      const hasSlow = state.selectedWord.some((t) => t.type === 'slow');
      const selectedIds = new Set(state.selectedWord.map((t) => t.id));

      let updatedTiles = state.tiles.filter((t) => !selectedIds.has(t.id));
      if (hasBomb) {
        const bombCols = new Set(
          state.selectedWord.filter((t) => t.type === 'bomb').map((t) => t.column),
        );
        updatedTiles = updatedTiles.filter((t) => !bombCols.has(t.column));
        get().addToast('Bomb! Column cleared', 'power');
      }
      if (hasSlow) {
        set({ slowActive: true, slowEndTime: Date.now() + 3000 });
        get().addToast('Slow! Speed reduced for 3s', 'power');
      }

      const newScore = state.score + points;
      const newStreak = state.streak + 1;
      let newMultiplier = 1;
      if (newStreak >= 8) newMultiplier = 3;
      else if (newStreak >= 5) newMultiplier = 2;
      else if (newStreak >= 3) newMultiplier = 1.5;

      const newDifficulty = Math.max(getDifficultyTier(newScore), state.startingTier - 1);
      const newMaxTier = Math.max(state.maxTierReached, newDifficulty + 1);
      // Count every tile the submission actually removes, including the extra
      // tiles cleared from Bomb columns, so exported run totals match play.
      const newTilesCleared = state.tilesCleared + (state.tiles.length - updatedTiles.length);

      // Board-cleared bonus: the board was non-empty and is now empty.
      const boardJustCleared = updatedTiles.length === 0 && state.tiles.length > 0;
      if (boardJustCleared) {
        get().addToast('Board Cleared! 2x bonus on next word', 'success');
        fireConfetti();
      }

      // Speed-demon timing: a valid word within two seconds of the prior one.
      const now = Date.now();
      const speedDemon = state.lastSubmitAt > 0 && now - state.lastSubmitAt <= 2000;

      const stats: LifetimeStats = {
        totalWords: state.stats.totalWords + 1,
        bombsTriggered: state.stats.bombsTriggered + (hasBomb ? 1 : 0),
      };

      const nextRunWord: RunWord = { word, points };

      set({
        tiles: updatedTiles,
        selectedWord: [],
        score: newScore,
        streak: newStreak,
        multiplier: newMultiplier,
        difficulty: newDifficulty,
        maxTierReached: newMaxTier,
        tilesCleared: newTilesCleared,
        boardCleared: boardJustCleared,
        currentRunWords: [...state.currentRunWords, nextRunWord],
        lastSubmitAt: now,
        stats,
        redoStack: [],
      });

      saveToStorage('letterdrop_stats', stats);

      get().addToast(`+${points} for “${word}”!`, 'success');

      // Achievements that depend on this exact submit are evaluated now (the
      // periodic timer covers the time-based ones during play).
      const a = get();
      const achievements = [...a.achievements];
      let changed = false;
      const unlock = (id: string) => {
        const ach = achievements.find((x) => x.id === id);
        if (ach && !ach.unlocked) {
          ach.unlocked = true;
          ach.unlockedAt = new Date().toISOString();
          changed = true;
          get().addToast(`Achievement unlocked: ${ach.name}!`, 'achievement');
          fireCelebration();
        }
      };
      if (boardJustCleared) unlock('clean_sweep');
      if (newStreak >= 8) unlock('combo_master');
      if (newTilesCleared > 0) unlock('first_word');
      if (newScore >= 100) unlock('century');
      if (stats.totalWords >= 25) unlock('wordsmith');
      if (stats.bombsTriggered >= 5) unlock('bomb_specialist');
      if (speedDemon) unlock('speed_demon');
      if (changed) {
        set({ achievements: [...achievements] });
        saveToStorage('letterdrop_achievements', achievements);
      }

      return true;
    },

    undoLastTile: () => {
      const state = get();
      if (state.isPaused || state.isGameOver || !state.gameStarted) return;
      if (state.selectedWord.length === 0) return;
      const lastTile = state.selectedWord[state.selectedWord.length - 1];
      const updatedTiles = state.tiles.map((t) =>
        t.id === lastTile.id ? { ...t, selected: false } : t,
      );
      const updatedWord = state.selectedWord.slice(0, -1);
      set({ tiles: updatedTiles, selectedWord: updatedWord });
    },

    undoAction: () => {
      const state = get();
      const currentNode = state.historyNodes.find((n) => n.id === state.currentHistoryNodeId);
      if (!currentNode?.parentId) return;
      const parent = state.historyNodes.find((n) => n.id === currentNode.parentId);
      if (!parent) return;
      set({ ...restoreUndoState(parent.snapshot), currentHistoryNodeId: parent.id });
    },

    redoAction: () => {
      const state = get();
      const currentNode = state.historyNodes.find((n) => n.id === state.currentHistoryNodeId);
      const childId = currentNode?.children[0];
      if (!childId) return;
      const child = state.historyNodes.find((n) => n.id === childId);
      if (!child) return;
      set({ ...restoreUndoState(child.snapshot), currentHistoryNodeId: child.id });
    },

    selectHistoryNode: (nodeId: string) => {
      const state = get();
      const node = state.historyNodes.find((n) => n.id === nodeId);
      if (!node) return;
      set({ ...restoreUndoState(node.snapshot), currentHistoryNodeId: node.id });
    },

    applyScenarioChange: () => {
      const state = get();
      if (!state.gameStarted || state.isPaused || state.isGameOver) {
        get().addToast('Start an active run before applying a scenario change', 'error');
        return;
      }
      const parent = state.historyNodes.find((n) => n.id === state.currentHistoryNodeId);
      if (!parent) return;

      const revision = state.scenarioRevision + 1;
      const seed = state.historyNodes.length;
      const boardWidth = 340;
      const colWidth = boardWidth / COLUMN_COUNT;
      const column = seed % COLUMN_COUNT;
      const scenarioLetters = 'CATDOGWORDPLAYFISHBIRDMOON';
      const scenarioTile: Tile = {
        id: generateId(),
        letter: scenarioLetters[seed % scenarioLetters.length],
        x: column * colWidth + colWidth / 2,
        y: Math.max(-TILE_SIZE, 24 + seed * 8),
        column,
        speed: FALL_SPEED_BASE,
        type: seed % 5 === 0 ? 'slow' : seed % 3 === 0 ? 'bomb' : 'normal',
        selected: false,
        removing: false,
        opacity: 1,
      };
      const nextState: GameState = { ...state, tiles: [...state.tiles, scenarioTile], scenarioRevision: revision };
      const nodeId = generateId();
      const node: HistoryNode = {
        id: nodeId,
        parentId: parent.id,
        label: `Scenario ${revision} (branch ${seed}): ${scenarioTile.letter} tile added`,
        children: [],
        snapshot: captureUndoState(nextState),
      };
      set({
        tiles: nextState.tiles,
        scenarioRevision: revision,
        historyNodes: state.historyNodes
          .map((existing) =>
            existing.id === parent.id ? { ...existing, children: [...existing.children, nodeId] } : existing,
          )
          .concat(node),
        currentHistoryNodeId: nodeId,
      });
      get().addToast(`Applied scenario change ${revision}`, 'success');
    },

    resetGame: () => {
      clearSpawnPlan();
      set({
        tiles: [],
        selectedWord: [],
        score: 0,
        streak: 0,
        multiplier: 1,
        difficulty: 0,
        isPaused: false,
        isGameOver: false,
        gameStarted: false,
        boardCleared: false,
        slowActive: false,
        slowEndTime: 0,
        startTime: 0,
        endTime: null,
        elapsedTime: 0,
        tilesCleared: 0,
        spawnTimer: 0,
        flow: 1,
        spawnFlow: 1,
        maxTierReached: 1,
        currentRunWords: [],
        lastSubmitAt: 0,
        currentRunId: '',
        toasts: [],
        currentView: 'game',
        exportPreview: null,
        settingsOpen: false,
        historyNodes: [],
        currentHistoryNodeId: null,
        scenarioRevision: 0,
      });
    },

    // ---- settings ----------------------------------------------------------
    openSettings: () => {
      const state = get();
      if (state.gameStarted && !state.isGameOver && !state.isPaused) {
        state.pauseGame();
      }
      set({ settingsOpen: true });
    },
    closeSettings: () => set({ settingsOpen: false }),
    saveSettings: (name, tier) => {
      const clean = typeof name === 'string' ? name.trim() : '';
      if (clean.length < 2 || clean.length > 20) {
        get().addToast('playerName must be 2-20 characters', 'error');
        return false;
      }
      if (tier !== 1 && tier !== 2 && tier !== 3) {
        get().addToast('startingTier must be 1, 2, or 3', 'error');
        return false;
      }
      set({ playerName: clean, startingTier: tier, settingsOpen: false, currentView: 'game' });
      saveToStorage('letterdrop_playerName', clean);
      saveToStorage('letterdrop_startingTier', tier);
      get().addToast('Settings saved', 'success');
      return true;
    },

    // ---- checkpoint --------------------------------------------------------
    saveCheckpoint: () => {
      const state = get();
      if (!state.gameStarted || state.isGameOver) return false;
      if (state.score <= 0 && state.tilesCleared <= 0) return false;
      const trayLetters = state.selectedWord.map((t) => t.letter).join('').toUpperCase();
      const checkpoint: CheckpointPayload = {
        format: 'letterdrop-checkpoint-v1',
        schemaVersion: 1,
        score: Math.max(0, Math.round(state.score)),
        streak: Math.max(0, Math.round(state.streak)),
        tier: Math.max(1, state.difficulty + 1) as 1 | 2 | 3,
        trayLetters,
        tiles: state.tiles.map((t) => ({
          letter: t.letter.toUpperCase(),
          column: t.column,
          y: Math.max(0, Math.round(t.y)),
          kind: t.type === 'bomb' ? 'bomb' : t.type === 'slow' ? 'slow' : 'letter',
        })),
        durationSec: Math.max(0, Math.round(state.elapsedTime)),
        playerName: state.playerName,
        startingTier: state.startingTier,
        __restore: {
          runId: state.currentRunId,
          tileIds: state.tiles.map((t) => t.id),
          multiplier: state.multiplier,
          boardCleared: state.boardCleared,
          flow: state.flow,
          spawnFlow: state.spawnFlow,
          maxTierReached: state.maxTierReached,
          elapsedSec: state.elapsedTime,
          tilesCleared: state.tilesCleared,
          currentRunWords: state.currentRunWords.map((w) => ({ ...w })),
          selectedIds: state.selectedWord.map((t) => t.id),
        },
      };
      set({ checkpoint });
      saveToStorage('letterdrop_checkpoint', checkpoint);
      get().addToast('Saved', 'success');
      return true;
    },

    resumeCheckpoint: (requestedBoardWidth) => {
      const state = get();
      if (state.gameStarted || state.isGameOver || !state.checkpoint) return;
      const cp = state.checkpoint;
      const boardWidth = Math.max(220, Math.min(340, requestedBoardWidth ?? 340));
      const colWidth = boardWidth / COLUMN_COUNT;
      const restore = (cp as unknown as { __restore?: Partial<CheckpointPayload['__restore']> }).__restore ?? {};
      const savedTileIds = Array.isArray(restore.tileIds) ? restore.tileIds : [];
      const selectedIdsInOrder = Array.isArray(restore.selectedIds) ? restore.selectedIds : [];
      const selectedIds = new Set(selectedIdsInOrder);
      const tiles: Tile[] = cp.tiles.map((ct, i) => ({
        id: savedTileIds[i] || `${generateId()}-${i}`,
        letter: ct.letter,
        column: Math.max(0, Math.min(COLUMN_COUNT - 1, ct.column)),
        x: Math.max(0, Math.min(COLUMN_COUNT - 1, ct.column)) * colWidth + colWidth / 2,
        y: Math.max(-TILE_SIZE, ct.y),
        speed: FALL_SPEED_BASE,
        type: ct.kind === 'bomb' ? 'bomb' : ct.kind === 'slow' ? 'slow' : 'normal',
        selected: false,
        removing: false,
        opacity: 1,
      }));
      // Re-mark the tray from the saved trayLetters against the reconstructed
      // tiles, matching by letter in order so the visible tray is restored
      // exactly as it was at save time.
      const trayLetters = (cp.trayLetters || '').toUpperCase();
      let chosen = selectedIdsInOrder
        .map((id) => tiles.find((t) => t.id === id))
        .filter((t): t is Tile => Boolean(t));
      // Backward-compatible fallback for checkpoints written before tileIds
      // were persisted: match the visible tray letters in their saved order.
      if (chosen.length !== selectedIdsInOrder.length || chosen.length !== trayLetters.length) {
        chosen = [];
        selectedIds.clear();
        for (const ch of trayLetters) {
          const match = tiles.find((t) => !selectedIds.has(t.id) && t.letter.toUpperCase() === ch);
          if (match) {
            selectedIds.add(match.id);
            chosen.push(match);
          }
        }
      }
      const tilesMarked = tiles.map((t) => (selectedIds.has(t.id) ? { ...t, selected: true } : t));
      chosen = chosen.map((t) => ({ ...t, selected: true }));

      set({
        tiles: tilesMarked,
        selectedWord: chosen,
        score: cp.score,
        streak: cp.streak,
        multiplier: typeof restore.multiplier === 'number' ? restore.multiplier : 1,
        difficulty: Math.max(0, Math.min(DIFFICULTY_TIERS.length - 1, cp.tier - 1)),
        tilesCleared: typeof restore.tilesCleared === 'number' ? restore.tilesCleared : 0,
        boardCleared: restore.boardCleared === true,
        elapsedTime: typeof restore.elapsedSec === 'number' ? restore.elapsedSec : cp.durationSec,
        flow: typeof restore.flow === 'number' ? restore.flow : 1,
        spawnFlow: typeof restore.spawnFlow === 'number' ? restore.spawnFlow : 1,
        maxTierReached: typeof restore.maxTierReached === 'number' ? restore.maxTierReached : cp.tier,
        currentRunWords: Array.isArray(restore.currentRunWords) ? restore.currentRunWords : [],
        lastSubmitAt: 0,
        currentRunId: typeof restore.runId === 'string' && restore.runId ? restore.runId : generateId(),
        isGameOver: false,
        gameStarted: true,
        isPaused: true, // frozen exactly as saved; Resume to continue
        slowActive: false,
        slowEndTime: 0,
        startTime: Date.now() - (typeof restore.elapsedSec === 'number' ? restore.elapsedSec : cp.durationSec) * 1000,
        endTime: null,
        checkpoint: null, // consume the checkpoint on resume
      });
      clearStorage('letterdrop_checkpoint');
      get().addToast('Progress restored', 'success');
    },

    // ---- export / import ---------------------------------------------------
    openExportRun: (run) => {
      const target = run ?? get().lastRun ?? get().matchHistory[0] ?? null;
      if (!target) return false;
      set({
        exportPreview: { title: 'Export Run', json: JSON.stringify(target, null, 2) },
        importSurfaceVisible: false,
      });
      return true;
    },
    openExportHistory: () => {
      const archive = buildHistoryArchive(get().matchHistory);
      set({
        exportPreview: { title: 'Export History', json: JSON.stringify(archive, null, 2) },
        importSurfaceVisible: false,
      });
      return true;
    },
    closeExport: () => set({ exportPreview: null }),
    copyExport: async () => {
      const preview = get().exportPreview;
      if (!preview) return false;
      const copied = await copyToClipboard(preview.json);
      get().addToast(copied ? 'Copied' : 'Copy failed — use Download instead', copied ? 'success' : 'error');
      return copied;
    },
    importRuns: (runs, _mode) => {
      const state = get();
      // Both accepted modes append conforming records; importing an archive
      // must never erase History entries already committed in this browser.
      const next = [...runs, ...state.matchHistory].slice(0, 50);
      let best = state.bestScore;
      for (const r of next) if (r.score > best) best = r.score;
      set({ matchHistory: next, bestScore: best });
      saveToStorage('letterdrop_history', next);
      saveToStorage('letterdrop_bestScore', best);
    },

    // ---- toasts ------------------------------------------------------------
    addToast: (message, type) => {
      const id = generateId();
      set({ toasts: [...get().toasts.slice(-4), { id, message, type }] });
      setTimeout(() => {
        // Mark leaving so the toast can fade out, then remove it. The toast
        // never steals focus; it only animates its own opacity.
        set({ toasts: get().toasts.map((t) => (t.id === id ? { ...t, leaving: true } : t)) });
        setTimeout(() => set({ toasts: get().toasts.filter((t) => t.id !== id) }), 320);
      }, 2600);
    },
    clearToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
    registerIllegalCanvasAction: (reason) => {
      // Throttle: an illegal canvas click (paused / before a run) should give
      // concrete visible feedback, but a held pointer shouldn't spam toasts.
      const toasts = get().toasts;
      if (toasts.some((t) => t.type === 'error' && t.message === reason)) return;
      get().addToast(reason, 'error');
    },

    setView: (view) => set({ currentView: view }),

    checkAchievements: () => {
      const state = get();
      const achievements = [...state.achievements];
      let changed = false;
      const unlock = (id: string) => {
        const ach = achievements.find((x) => x.id === id);
        if (ach && !ach.unlocked) {
          ach.unlocked = true;
          ach.unlockedAt = new Date().toISOString();
          changed = true;
          get().addToast(`Achievement unlocked: ${ach.name}!`, 'achievement');
          fireCelebration();
        }
      };
      if (state.boardCleared) unlock('clean_sweep');
      if (state.elapsedTime >= 180) unlock('marathon');
      if (state.streak >= 8) unlock('combo_master');
      if (state.tilesCleared > 0) unlock('first_word');
      if (state.score >= 100) unlock('century');
      if (state.stats.totalWords >= 25) unlock('wordsmith');
      if (state.stats.bombsTriggered >= 5) unlock('bomb_specialist');
      if (changed) {
        set({ achievements: [...achievements] });
        saveToStorage('letterdrop_achievements', achievements);
      }
    },
  }),
);

// Read-only debug projection: lets a test harness read live tile positions so
// it can aim REAL pointer clicks at falling tiles. No mutations, no success
// path of its own — purely observational.
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__letterdrop_debug_state = () => {
    const s = useGameStore.getState();
    return {
      phase: s.isGameOver ? 'gameover' : s.isPaused ? 'paused' : s.gameStarted ? 'running' : 'idle',
      score: s.score,
      streak: s.streak,
      multiplier: s.multiplier,
      difficulty: s.difficulty,
      tierName: `Tier ${s.difficulty + 1}`,
      gameStarted: s.gameStarted,
      isPaused: s.isPaused,
      isGameOver: s.isGameOver,
      currentView: s.currentView,
      selectedWord: s.selectedWord.map((t) => t.letter),
      tiles: projectTilesForDebug(s.tiles),
    };
  };
}
