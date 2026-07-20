import { create } from 'zustand';
import {
  GameState,
  Tile,
  MatchRecord,
  Achievement,
  Toast,
  UndoState,
  HistoryNode,
  COLUMN_COUNT,
  TILE_SIZE,
  DIFFICULTY_TIERS,
  DANGER_LINE_Y,
  defaultAchievements,
} from '../game/types';
import { isValidWord } from '../game/dictionary';
import confetti from 'canvas-confetti';

// Safe localStorage helpers
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const item = localStorage.getItem(key);
    if (item) return JSON.parse(item);
  } catch {}
  return fallback;
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const LETTER_FREQ = 'AAAAABBCCDDEEEEEEEFFGGGHHIIIIJKLLMMNNNNNOOOOPQRSSTTTTTUUVWWXYYZ';

function randomLetter(): string {
  return LETTER_FREQ[Math.floor(Math.random() * LETTER_FREQ.length)];
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
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

// Load persisted data
const persistedBestScore = loadFromStorage<number>('letterdrop_bestScore', 0);
const persistedHistory = loadFromStorage<MatchRecord[]>('letterdrop_history', []);
const persistedAchievementsData = loadFromStorage<Achievement[] | null>('letterdrop_achievements', null);
const persistedAchievements = persistedAchievementsData || defaultAchievements;

// Ensure all default achievements are present
const achievementMap = new Map(persistedAchievements.map(a => [a.id, a]));
const initializedAchievements = defaultAchievements.map(defaultAch =>
  achievementMap.get(defaultAch.id) || { ...defaultAch }
);

const maxUndoHistory = 20;

interface GameActions {
  startGame: () => void;
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
  addToast: (message: string, type: Toast['type']) => void;
  setView: (view: GameState['currentView']) => void;
  applyScenarioChange: () => void;
  selectHistoryNode: (nodeId: string) => void;
  undoAction: () => void;
  redoAction: () => void;
  resetGame: () => void;
  setPlayerName: (name: string) => void;
  setStartingTier: (tier: 1 | 2 | 3) => void;
  saveCheckpoint: () => boolean;
  resumeCheckpoint: () => void;
  importHistory: (runs: MatchRecord[]) => void;
  checkAchievements: () => void;
}

type GameStore = GameState & GameActions;

function captureUndoState(state: GameState): UndoState {
  return {
    tiles: state.tiles.map(tile => ({ ...tile })),
    selectedWord: state.selectedWord.map(tile => ({ ...tile })),
    score: state.score,
    streak: state.streak,
    multiplier: state.multiplier,
    difficulty: state.difficulty,
    tilesCleared: state.tilesCleared,
    boardCleared: state.boardCleared,
    elapsedTime: state.elapsedTime,
    scenarioRevision: state.scenarioRevision,
  };
}

function restoreUndoState(snapshot: UndoState): Partial<GameState> {
  return {
    tiles: snapshot.tiles.map(tile => ({ ...tile })),
    selectedWord: snapshot.selectedWord.map(tile => ({ ...tile })),
    score: snapshot.score,
    streak: snapshot.streak,
    multiplier: snapshot.multiplier,
    difficulty: snapshot.difficulty,
    tilesCleared: snapshot.tilesCleared,
    boardCleared: snapshot.boardCleared,
    elapsedTime: snapshot.elapsedTime,
    scenarioRevision: snapshot.scenarioRevision,
  };
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
    matchHistory: persistedHistory,
    achievements: initializedAchievements,
    toasts: [],
    currentView: 'game',
    gameMode: 'solo',
    undoHistory: [],
    redoStack: [],
    historyNodes: [],
    currentHistoryNodeId: null,
    scenarioRevision: 0,

    startGame: () => {
      const rootId = generateId();
      const rootSnapshot: UndoState = {
        tiles: [],
        selectedWord: [],
        score: 0,
        streak: 0,
        multiplier: 1,
        difficulty: 0,
        tilesCleared: 0,
        boardCleared: false,
        elapsedTime: 0,
        scenarioRevision: 0,
      };
      set({
        tiles: [],
        selectedWord: [],
        score: 0,
        streak: 0,
        multiplier: 1,
        difficulty: 0,
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
        undoHistory: [],
        redoStack: [],
        toasts: [],
        historyNodes: [{
          id: rootId,
          parentId: null,
          label: 'Run started',
          children: [],
          snapshot: rootSnapshot,
        }],
        currentHistoryNodeId: rootId,
        scenarioRevision: 0,
      });
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
      if (!state.gameStarted || state.isGameOver) return;
      set({ isPaused: true });
      get().addToast('Game paused', 'success');
    },

    resumeGame: () => {
      const state = get();
      if (!state.isPaused) return;
      set({ isPaused: false });
    },

    endGame: () => {
      const state = get();
      if (state.isGameOver) return; // Prevent double end

      const duration = state.elapsedTime;

      const record: MatchRecord = {
        score: state.score,
        tilesCleared: state.tilesCleared,
        duration: Math.round(duration),
        date: new Date().toISOString(),
      };

      const newHistory = [record, ...state.matchHistory].slice(0, 50);
      const newBestScore = Math.max(state.score, state.bestScore);

      set({
        isGameOver: true,
        gameStarted: false,
        isPaused: false,
        endTime: Date.now(),
        matchHistory: newHistory,
        bestScore: newBestScore,
        selectedWord: [],
        tiles: state.tiles.map(t => ({ ...t, selected: false })),
      });

      saveToStorage('letterdrop_bestScore', newBestScore);
      saveToStorage('letterdrop_history', newHistory);

      // Check achievements after a short delay to avoid state issues
      setTimeout(() => get().checkAchievements(), 100);
    },

    spawnTile: (boardWidth: number) => {
      const state = get();
      if (state.isGameOver || state.isPaused || !state.gameStarted) return;

      const colWidth = boardWidth / COLUMN_COUNT;
      const column = Math.floor(Math.random() * COLUMN_COUNT);
      const x = column * colWidth + colWidth / 2;

      let type: Tile['type'] = 'normal';
      const rand = Math.random();
      if (rand < 0.06) type = 'bomb';
      else if (rand < 0.12) type = 'slow';

      const tier = DIFFICULTY_TIERS[state.difficulty];
      const tile: Tile = {
        id: generateId(),
        letter: randomLetter(),
        x,
        y: -TILE_SIZE,
        column,
        speed: tier.fallSpeed * (state.gameMode === 'challenge' ? 1.3 : 1),
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
      const speedMult = (state.slowActive && now < state.slowEndTime) ? 0.4 : 1;

      const updatedTiles: Tile[] = [];
      let shouldEnd = false;

      for (const tile of state.tiles) {
        const newY = tile.y + tile.speed * speedMult * dt * 60;
        // Check if tile crossed danger line (bottom edge of tile passes danger line)
        if (newY + TILE_SIZE / 2 > DANGER_LINE_Y && !tile.removing) {
          shouldEnd = true;
        }
        updatedTiles.push({
          ...tile,
          y: newY,
        });
      }

      // Check if slow effect expired
      const slowActive = state.slowActive && now < state.slowEndTime;

      set({
        tiles: updatedTiles,
        slowActive,
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

      const tile = state.tiles.find(t => t.id === tileId);
      if (!tile || tile.selected || tile.removing) return;

      // Save undo snapshot before selection
      const snapshot = captureUndoState(state);

      const updatedTiles = state.tiles.map(t =>
        t.id === tileId ? { ...t, selected: true } : t
      );

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

      const updatedTiles = state.tiles.map(t =>
        t.id === tileId ? { ...t, selected: false } : t
      );
      const updatedWord = state.selectedWord.filter(t => t.id !== tileId);

      set({ tiles: updatedTiles, selectedWord: updatedWord });
    },

    submitWord: (): boolean => {
      const state = get();
      if (state.isPaused || state.isGameOver || !state.gameStarted) return false;
      if (state.selectedWord.length < 2) return false;

      const word = state.selectedWord.map(t => t.letter).join('');

      if (!isValidWord(word)) {
        get().addToast(`"${word}" — not a word, try a different combination`, 'error');
        set({
          streak: 0,
          multiplier: 1,
          selectedWord: [],
          tiles: state.tiles.map(t =>
            state.selectedWord.some(st => st.id === t.id)
              ? { ...t, selected: false }
              : t
          ),
        });
        return false;
      }

      // Word is valid!
      const wordLength = state.selectedWord.length;
      const basePoints = wordLength <= 3 ? wordLength * 5 : wordLength * 10;
      const streakBonus = state.multiplier;
      const boardBonus = state.boardCleared ? 2 : 1;
      const points = Math.round(basePoints * streakBonus * boardBonus);

      // Check power tiles
      const hasBomb = state.selectedWord.some(t => t.type === 'bomb');
      const hasSlow = state.selectedWord.some(t => t.type === 'slow');

      const selectedIds = new Set(state.selectedWord.map(t => t.id));

      let updatedTiles = state.tiles.filter(t => !selectedIds.has(t.id));

      // Bomb effect: clear the whole column
      if (hasBomb) {
        const bombCols = new Set(
          state.selectedWord.filter(t => t.type === 'bomb').map(t => t.column)
        );
        updatedTiles = updatedTiles.filter(t => !bombCols.has(t.column));
        get().addToast('💣 Bomb! Column cleared!', 'power');
      }

      // Slow effect
      if (hasSlow) {
        set({ slowActive: true, slowEndTime: Date.now() + 5000 });
        get().addToast('🐌 Slow! Speed reduced for 5s', 'power');
      }

      const newScore = state.score + points;
      const newStreak = state.streak + 1;
      let newMultiplier = 1;
      if (newStreak >= 8) newMultiplier = 3;
      else if (newStreak >= 5) newMultiplier = 2;
      else if (newStreak >= 3) newMultiplier = 1.5;

      const newDifficulty = getDifficultyTier(newScore);

      const tilesClearedThisSubmit = state.selectedWord.length;
      const newTilesCleared = state.tilesCleared + tilesClearedThisSubmit;

      // Board cleared bonus: if no tiles remain on board after this submission
      const boardJustCleared = updatedTiles.length === 0 && state.tiles.length > 0;
      const newBoardCleared = boardJustCleared;
      if (boardJustCleared) {
        get().addToast('🎉 Board Cleared! 2x bonus on next word!', 'success');
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      set({
        tiles: updatedTiles,
        selectedWord: [],
        score: newScore,
        streak: newStreak,
        multiplier: newMultiplier,
        difficulty: newDifficulty,
        tilesCleared: newTilesCleared,
        boardCleared: newBoardCleared,
        redoStack: [],
      });

      get().addToast(`+${points} for "${word.toUpperCase()}"!`, 'success');
      get().checkAchievements();

      return true;
    },

    undoLastTile: () => {
      const state = get();
      if (state.isPaused || state.isGameOver || !state.gameStarted) return;
      if (state.selectedWord.length === 0) return;

      const lastTile = state.selectedWord[state.selectedWord.length - 1];
      const updatedTiles = state.tiles.map(t =>
        t.id === lastTile.id ? { ...t, selected: false } : t
      );
      const updatedWord = state.selectedWord.slice(0, -1);

      set({ tiles: updatedTiles, selectedWord: updatedWord });
    },

    undoAction: () => {
      const state = get();
      const currentNode = state.historyNodes.find(node => node.id === state.currentHistoryNodeId);
      if (!currentNode?.parentId) return;
      const parent = state.historyNodes.find(node => node.id === currentNode.parentId);
      if (!parent) return;
      set({
        ...restoreUndoState(parent.snapshot),
        currentHistoryNodeId: parent.id,
      });
    },

    redoAction: () => {
      const state = get();
      const currentNode = state.historyNodes.find(node => node.id === state.currentHistoryNodeId);
      const childId = currentNode?.children[0];
      if (!childId) return;
      const child = state.historyNodes.find(node => node.id === childId);
      if (!child) return;
      set({
        ...restoreUndoState(child.snapshot),
        currentHistoryNodeId: child.id,
      });
    },

    selectHistoryNode: (nodeId: string) => {
      const state = get();
      const node = state.historyNodes.find(candidate => candidate.id === nodeId);
      if (!node) return;
      set({
        ...restoreUndoState(node.snapshot),
        currentHistoryNodeId: node.id,
      });
    },

    clearToast: (id: string) => {
      set({ toasts: get().toasts.filter(t => t.id !== id) });
    },

    addToast: (message: string, type: Toast['type']) => {
      const id = generateId();
      const state = get();
      // Limit toasts
      const newToasts = [...state.toasts.slice(-4), { id, message, type }];
      set({ toasts: newToasts });

      // Long enough to be reliably noticed (and screenshotted) before it
      // clears itself, while still reading as a transient confirmation.
      setTimeout(() => {
        get().clearToast(id);
      }, 5000);
    },

    setView: (view: GameState['currentView']) => {
      set({ currentView: view });
    },

    applyScenarioChange: () => {
      const state = get();
      if (!state.gameStarted || state.isPaused || state.isGameOver) {
        get().addToast('Start an active run before applying a scenario change', 'error');
        return;
      }

      const parent = state.historyNodes.find(node => node.id === state.currentHistoryNodeId);
      if (!parent) return;

      const revision = state.scenarioRevision + 1;
      // `historyNodes` only ever grows (undo/redo/branch-select never remove
      // or rewind it), so its length is a monotonic generation counter that
      // is never reused — even after undoing back to an earlier node. Using
      // it (rather than the restorable `revision`) to derive the new tile's
      // content guarantees that undoing and then applying a different change
      // produces a genuinely distinct sibling branch instead of replaying
      // the exact same deterministic tile/letter/type.
      const seed = state.historyNodes.length;
      const tier = DIFFICULTY_TIERS[state.difficulty];
      const column = seed % COLUMN_COUNT;
      const boardWidth = 340;
      const colWidth = boardWidth / COLUMN_COUNT;
      const scenarioLetters = 'CATDOGWORDPLAYFISHBIRDMOON';
      const scenarioTile: Tile = {
        id: generateId(),
        letter: scenarioLetters[seed % scenarioLetters.length],
        x: column * colWidth + colWidth / 2,
        y: Math.max(-TILE_SIZE, 24 + seed * 8),
        column,
        speed: tier.fallSpeed * (state.gameMode === 'challenge' ? 1.3 : 1),
        type: seed % 5 === 0 ? 'slow' : seed % 3 === 0 ? 'bomb' : 'normal',
        selected: false,
        removing: false,
        opacity: 1,
      };

      const nextState: GameState = {
        ...state,
        tiles: [...state.tiles, scenarioTile],
        scenarioRevision: revision,
      };
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
          .map(existing => existing.id === parent.id
            ? { ...existing, children: [...existing.children, nodeId] }
            : existing)
          .concat(node),
        currentHistoryNodeId: nodeId,
      });
      get().addToast(`Applied scenario change ${revision}`, 'success');
    },

    resetGame: () => {
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
        undoHistory: [],
        redoStack: [],
        toasts: [],
        currentView: 'game',
        historyNodes: [],
        currentHistoryNodeId: null,
        scenarioRevision: 0,
      });
    },

    setPlayerName: (name: string) => {
      set({ playerName: name });
      saveToStorage('letterdrop_playerName', name);
    },

    setStartingTier: (tier: 1 | 2 | 3) => {
      set({ startingTier: tier });
      saveToStorage('letterdrop_startingTier', tier);
    },

    saveCheckpoint: () => {
      const state = get();
      if (!state.gameStarted || state.isGameOver || state.score === 0 && state.tilesCleared === 0) {
        return false;
      }
      const snap = captureUndoState(state);
      set({ checkpoint: snap });
      saveToStorage('letterdrop_checkpoint', snap);
      get().addToast('Progress saved', 'success');
      return true;
    },

    resumeCheckpoint: () => {
      const state = get();
      if (state.checkpoint) {
        set({
          ...restoreUndoState(state.checkpoint),
          isGameOver: false,
          gameStarted: true,
          isPaused: true,
          currentRunWords: [],
        });
        get().addToast('Progress restored', 'success');
      }
    },

    importHistory: (runs: MatchRecord[]) => {
      const state = get();
      const newHistory = [...runs, ...state.matchHistory].slice(0, 50);
      let newBestScore = state.bestScore;
      runs.forEach(run => {
        if (run.score > newBestScore) {
           newBestScore = run.score;
        }
      });
      set({ matchHistory: newHistory, bestScore: newBestScore });
      saveToStorage('letterdrop_history', newHistory);
      saveToStorage('letterdrop_bestScore', newBestScore);
    },

    checkAchievements: () => {
      const state = get();
      const achievements = [...state.achievements];
      let changed = false;

      const duration = state.elapsedTime;

      const checkAndUnlock = (id: string): boolean => {
        const ach = achievements.find(a => a.id === id);
        if (ach && !ach.unlocked) {
          ach.unlocked = true;
          ach.unlockedAt = new Date().toISOString();
          changed = true;
          get().addToast(`🏆 Achievement unlocked: ${ach.name}!`, 'achievement');
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.5 },
            colors: ['#007AFF', '#FFD60A', '#34C759', '#AF52DE']
          });
          return true;
        }
        return false;
      };

      // Clean Sweep - cleared the entire board
      if (state.boardCleared && checkAndUnlock('clean_sweep')) {}

      // Marathon - 3+ minute run
      if (duration >= 180 && checkAndUnlock('marathon')) {}

      // Combo Master - 8+ streak
      if (state.streak >= 8 && checkAndUnlock('combo_master')) {}

      // First Word - submitted first valid word
      if (state.tilesCleared > 0 && checkAndUnlock('first_word')) {}

      // Century - scored 100+ points
      if (state.score >= 100 && checkAndUnlock('century')) {}

      // Wordsmith - 25+ valid words
      if (state.tilesCleared >= 75 && checkAndUnlock('wordsmith')) {}

      // Bomb Specialist - trigger bombs (approximated by high tile count)
      if (state.tilesCleared >= 50 && checkAndUnlock('bomb_specialist')) {}

      if (changed) {
        set({ achievements: [...achievements] });
        saveToStorage('letterdrop_achievements', achievements);
      }
    },
  })
);
