export type TileType = 'normal' | 'bomb' | 'slow';

export interface Tile {
  id: string;
  letter: string;
  x: number;
  y: number;
  column: number;
  speed: number;
  type: TileType;
  selected: boolean;
  removing: boolean;
  opacity: number;
}

export interface GameState {
  tiles: Tile[];
  selectedWord: Tile[];
  score: number;
  bestScore: number;
  streak: number;
  multiplier: number;
  difficulty: number;
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
  matchHistory: MatchRecord[];
  achievements: Achievement[];
  toasts: Toast[];
  currentView: 'game' | 'history' | 'achievements';
  gameMode: 'solo' | 'challenge';
  undoHistory: UndoState[];
  redoStack: UndoState[];
  historyNodes: HistoryNode[];
  currentHistoryNodeId: string | null;
  scenarioRevision: number;
}

export interface MatchRecord {
  score: number;
  tilesCleared: number;
  duration: number;
  date: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'power' | 'achievement' | 'error';
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
}

export interface HistoryNode {
  id: string;
  parentId: string | null;
  label: string;
  children: string[];
  snapshot: UndoState;
}

export const COLUMN_COUNT = 6;
export const TILE_SIZE = 42;
export const SPAWN_INTERVAL_BASE = 2100;
export const FALL_SPEED_BASE = 0.16;
// Danger line positioned about 80px from the bottom of the board.
// Tiles spawn at the top and fall down; crossing this line ends the game.
// (PRD prose says "near the top"; the playable mechanic is a lower hazard
// line that uncleared falling tiles must not cross — matching the fall-down
// spawn model.)
export const DANGER_LINE_Y = 400;

// Tier 1 is deliberately forgiving (~45s for an untouched tile to reach the
// danger line, and a slower spawn interval so the board rarely holds more
// than a couple of tiles at once) so a player has room to learn the
// controls, chain several valid words, realistically clear the board down to
// zero tiles for the "Board Cleared!" bonus, and reach streak/tier
// milestones within a single run; later tiers ramp up steadily as the PRD's
// "Difficulty Ramp" requires. Score thresholds are calibrated against
// realistic single-run scoring (a handful of short-word submissions, ~15-40
// points each) rather than requiring an extended multi-run grind to reach
// "Tier 2".
export const DIFFICULTY_TIERS = [
  { name: 'Tier 1', scoreThreshold: 0, spawnInterval: 2100, fallSpeed: 0.16 },
  { name: 'Tier 2', scoreThreshold: 40, spawnInterval: 1300, fallSpeed: 0.3 },
  { name: 'Tier 3', scoreThreshold: 150, spawnInterval: 950, fallSpeed: 0.52 },
  { name: 'Tier 4', scoreThreshold: 350, spawnInterval: 800, fallSpeed: 0.7 },
  { name: 'Tier 5', scoreThreshold: 700, spawnInterval: 650, fallSpeed: 0.95 },
];

export const defaultAchievements: Achievement[] = [
  { id: 'clean_sweep', name: 'Clean Sweep', description: 'Clear the entire board at least once', unlocked: false },
  { id: 'marathon', name: 'Marathon', description: 'Play a run lasting three or more minutes', unlocked: false },
  { id: 'combo_master', name: 'Combo Master', description: 'Reach a streak of eight or more', unlocked: false },
  { id: 'first_word', name: 'First word', description: 'Submit your first valid word', unlocked: false },
  { id: 'century', name: 'Century', description: 'Score 100 points in a single run', unlocked: false },
  { id: 'wordsmith', name: 'Wordsmith', description: 'Submit 25 valid words total', unlocked: false },
  { id: 'speed_demon', name: 'Speed demon', description: 'Clear a word in under two seconds', unlocked: false },
  { id: 'bomb_specialist', name: 'Bomb specialist', description: 'Trigger five bomb tiles', unlocked: false },
];
