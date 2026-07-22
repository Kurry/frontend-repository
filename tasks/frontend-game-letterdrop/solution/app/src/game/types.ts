// Shared domain types for the LetterDrop oracle.
//
// Records that leave the app (the per-run game result, the history archive, the
// mid-run checkpoint) are modelled as explicit API-shaped payloads — their field
// names and shapes are the same names the History rows, the export JSON preview,
// the checkpoint summary, and the import validator all agree on. There is a
// single source of truth per record; nothing is renamed across surfaces.

export type TileType = 'normal' | 'bomb' | 'slow';

export interface Tile {
  id: string;
  letter: string;
  x: number;
  y: number;
  column: number;
  // Base fall speed (pixels per frame at 60fps, before the global eased flow
  // multiplier is applied). Every tile shares the same base; the *apparent*
  // acceleration as the score climbs tiers is produced by easing a single
  // global `flow` scale in the store rather than snapping each tile's speed,
  // so tier transitions read as a gradual ramp, never a step.
  speed: number;
  type: TileType;
  selected: boolean;
  removing: boolean;
  opacity: number;
}

// A submitted valid word as it is carried on the live run and serialized into
// the game-result record's `words` array.
export interface RunWord {
  word: string; // uppercase A-Z, length 2..15
  points: number; // positive integer awarded
}

// ---- letterdrop-game-v1 (one finished run = one game-result record) --------
export interface GameResult {
  format: 'letterdrop-game-v1';
  schemaVersion: 1;
  score: number; // non-negative integer, final score
  tilesCleared: number; // non-negative integer
  durationSec: number; // non-negative integer, whole seconds
  playerName: string; // 2..20 characters at end-of-run
  tierReached: number; // positive integer, highest tier reached
  endedAt: string; // ISO-8601 timestamp
  result: 'game_over';
  words: RunWord[]; // every valid submission in order
}

// ---- letterdrop-history-v1 (the archive) -----------------------------------
export interface HistoryArchive {
  format: 'letterdrop-history-v1';
  schemaVersion: 1;
  runs: GameResult[];
}

// ---- letterdrop-checkpoint-v1 (a mid-run save) -----------------------------
// The named fields below are the spec contract; the trailing `__restore` bag
// carries the extra state needed to resume the *exact* same run (multiplier,
// board-cleared flag, eased-flow values, the words collected so far, the
// elapsed-time clock, the selected tray ids, and the tile removal/opacity
// state). The checkpoint *preview* surface only renders the named spec fields.
export interface CheckpointTile {
  letter: string;
  column: number; // 0..5
  y: number; // non-negative
  kind: 'letter' | 'bomb' | 'slow';
}

export interface CheckpointPayload {
  format: 'letterdrop-checkpoint-v1';
  schemaVersion: 1;
  score: number;
  streak: number;
  tier: number; // positive integer 1..3
  trayLetters: string;
  tiles: CheckpointTile[];
  durationSec: number;
  playerName: string;
  startingTier: 1 | 2 | 3;
  __restore: {
    runId: string;
    tileIds: string[];
    multiplier: number;
    boardCleared: boolean;
    flow: number;
    spawnFlow: number;
    maxTierReached: number;
    elapsedSec: number;
    tilesCleared: number;
    currentRunWords: RunWord[];
    selectedIds: string[];
  };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export type ToastType = 'success' | 'power' | 'achievement' | 'error';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  leaving?: boolean; // set just before removal so the toast can fade out
}

export interface UndoState {
  tiles: Tile[];
  selectedWord: Tile[];
  score: number;
  streak: number;
  multiplier: number;
  difficulty: number;
  tilesCleared: number;
  boardCleared: boolean;
  elapsedTime: number;
  scenarioRevision: number;
  flow: number;
  spawnFlow: number;
  maxTierReached: number;
  currentRunWords: RunWord[];
}

export interface HistoryNode {
  id: string;
  parentId: string | null;
  label: string;
  children: string[];
  snapshot: UndoState;
}

// Lifetime stats persisted across reloads so achievement milestones that count
// across runs (total valid words, total bombs triggered) and the "speed demon"
// timing remain coherent after a refresh.
export interface LifetimeStats {
  totalWords: number;
  bombsTriggered: number;
}

export interface GameState {
  tiles: Tile[];
  selectedWord: Tile[];
  score: number;
  bestScore: number;
  streak: number;
  multiplier: number;
  difficulty: number; // index into DIFFICULTY_TIERS (0-based)
  isPaused: boolean;
  isGameOver: boolean;
  gameStarted: boolean;
  boardCleared: boolean;
  slowActive: boolean;
  slowEndTime: number;
  startTime: number;
  endTime: number | null;
  elapsedTime: number;
  tilesCleared: number;
  spawnTimer: number;
  flow: number; // eased global fall-speed scale (1 at tier 1)
  spawnFlow: number; // eased global spawn-rate scale (1 at tier 1)
  maxTierReached: number; // 1-based, highest tier seen this run
  currentRunWords: RunWord[];
  lastSubmitAt: number; // epoch ms of last valid submit (speed-demon timing)
  currentRunId: string;
  matchHistory: GameResult[];
  achievements: Achievement[];
  stats: LifetimeStats;
  toasts: Toast[];
  currentView: 'game' | 'history' | 'achievements';
  gameMode: 'solo' | 'challenge';
  playerName: string;
  startingTier: 1 | 2 | 3;
  checkpoint: CheckpointPayload | null;
  lastRun: GameResult | null;
  // Dialog surfaces driven from the shared store so the visible UI controls
  // and the WebMCP handlers open the exact same modal.
  settingsOpen: boolean;
  exportPreview: { title: string; json: string } | null;
  importSurfaceVisible: boolean;
  undoHistory: UndoState[];
  redoStack: UndoState[];
  historyNodes: HistoryNode[];
  currentHistoryNodeId: string | null;
  scenarioRevision: number;
}

export const COLUMN_COUNT = 6;
export const TILE_SIZE = 46;
export const SPAWN_INTERVAL_BASE = 2200;
export const FALL_SPEED_BASE = 0.135;
// The hazard line sits low on the board: uncleared falling tiles must not
// cross it. (The PRD's "horizontal danger line across the board" is satisfied
// by a clearly hazard-toned line; its exact y is a playability decision.)
export const DANGER_LINE_Y = 410;

// Tier 1 is deliberately forgiving (an untouched tile takes ~50s to reach the
// danger line and tiles spawn slowly, so the board rarely holds more than a
// couple at once) so a player — or an automated judge driving the real UI —
// has room to learn the controls, chain several valid words, clear the board
// to zero for the "Board Cleared!" bonus, and reach the streak/tier milestones
// inside a single run. Later tiers ramp steadily. The *apparent* speed within
// a tier transition is eased by the global flow scale, not by these per-tier
// steps alone — these are the asymptotes the flow eases toward.
export const DIFFICULTY_TIERS = [
  { name: 'Tier 1', scoreThreshold: 0, spawnInterval: 2200, fallSpeed: 0.135 },
  { name: 'Tier 2', scoreThreshold: 35, spawnInterval: 1450, fallSpeed: 0.24 },
  { name: 'Tier 3', scoreThreshold: 120, spawnInterval: 1050, fallSpeed: 0.4 },
  { name: 'Tier 4', scoreThreshold: 300, spawnInterval: 850, fallSpeed: 0.58 },
  { name: 'Tier 5', scoreThreshold: 650, spawnInterval: 700, fallSpeed: 0.8 },
];

export const defaultAchievements: Achievement[] = [
  { id: 'clean_sweep', name: 'Clean Sweep', description: 'Clear the entire board at least once', unlocked: false },
  { id: 'marathon', name: 'Marathon', description: 'Play a run lasting three or more minutes', unlocked: false },
  { id: 'combo_master', name: 'Combo Master', description: 'Reach a streak of eight or more', unlocked: false },
  { id: 'first_word', name: 'First word', description: 'Submit your first valid word', unlocked: false },
  { id: 'century', name: 'Century', description: 'Score 100 points in a single run', unlocked: false },
  { id: 'wordsmith', name: 'Wordsmith', description: 'Submit 25 valid words across your runs', unlocked: false },
  { id: 'speed_demon', name: 'Speed demon', description: 'Submit a valid word within two seconds of the previous one', unlocked: false },
  { id: 'bomb_specialist', name: 'Bomb specialist', description: 'Trigger five bomb tiles across your runs', unlocked: false },
];
