export type Difficulty = 'easy' | 'medium' | 'hard';
export type Phase = 'setup' | 'playing' | 'round-result' | 'match-complete' | 'stats' | 'match-log' | 'export-center';
export type Turn = 'player' | 'rival';
export type HintStatus = 'none' | 'safe' | 'mine';
export type PlayerMode = 'reveal' | 'flag' | 'hint';
export type ToastKind = 'info' | 'success' | 'reject';

export interface ExportArtifact {
  title: string;
  json: string;
}

export interface TileData {
  isMine: boolean;
  adjacentMines: number;
  oreValue: number;
  revealed: boolean;
  flagged: boolean;
  hintStatus: HintStatus;
  revealedBy: Turn | null;
}

export interface PlayerState {
  score: number;
  strikes: number;
}

export interface RoundResult {
  roundNumber: number;
  playerScore: number;
  rivalScore: number;
  playerStrikes: number;
  rivalStrikes: number;
  playerOreMined: number;
  rivalOreMined: number;
  winner: Turn | 'draw';
  reason: string;
}

export interface MatchRoundSummary {
  roundNumber: number;
  playerScore: number;
  rivalScore: number;
  playerStrikes: number;
  rivalStrikes: number;
  outcomeReason: string;
}

export interface DifficultyStats {
  matchesPlayed: number;
  matchesWon: number;
  totalOreMined: number;
  bestSingleRoundScore: number;
}

export interface StatsData {
  easy: DifficultyStats;
  medium: DifficultyStats;
  hard: DifficultyStats;
}

export interface GameSnapshot {
  tiles: TileData[][];
  player: PlayerState;
  rival: PlayerState;
  roundPlayerOreMined: number;
  roundRivalOreMined: number;
  currentTurn: Turn;
  playerMode: PlayerMode;
  hintsUsed: number;
  feedback: string;
}

export interface HistoryNode {
  id: string;
  parentId: string | null;
  childIds: string[];
  label: string;
  snapshot: GameSnapshot;
}

export interface MatchCheckpoint {
  phase: 'playing' | 'round-result';
  playerName: string;
  difficulty: Difficulty;
  roundNumber: number;
  playerScore: number;
  rivalScore: number;
  playerStrikes: number;
  rivalStrikes: number;
  sideToMove: Turn;
  hintsRemaining: number;
  playerRoundWins: number;
  rivalRoundWins: number;
  board: TileData[][];
  targetScore: number;
  mineCount: number;
  paused: boolean;
  roundPlayerOreMined: number;
  roundRivalOreMined: number;
  matchRounds: MatchRoundSummary[];
  lastRoundResult: RoundResult | null;
}

export interface MatchLogEntry {
  playerName: string;
  difficulty: Difficulty;
  playerRoundWins: number;
  rivalRoundWins: number;
  playerTotalOre: number;
  rivalTotalOre: number;
  winner: Turn | 'draw';
  rounds: MatchRoundSummary[];
  endedAt: string;
}

export interface AppStore {
  phase: Phase;
  difficulty: Difficulty;
  soundEnabled: boolean;
  playerName: string;

  playerMode: PlayerMode;
  isRivalThinking: boolean;
  paused: boolean;
  hintsUsed: number;

  tiles: TileData[][];
  rows: number;
  cols: number;
  mineCount: number;
  targetScore: number;

  player: PlayerState;
  rival: PlayerState;
  roundPlayerOreMined: number;
  roundRivalOreMined: number;
  currentTurn: Turn;

  roundNumber: number;
  matchRounds: RoundResult[];
  playerMatchWins: number;
  rivalMatchWins: number;
  lastRoundResult: RoundResult | null;

  historyNodes: HistoryNode[];
  currentHistoryId: string | null;
  selectedHistoryId: string | null;

  stats: StatsData;

  showHistoryPanel: boolean;
  lastPlayerActionLabel: string;
  feedback: string;

  savedCheckpoint: MatchCheckpoint | null;
  matchLog: MatchLogEntry[];

  // Transient UI state (not persisted): a fading confirmation/rejection toast,
  // an inline export artifact the player can read/copy, the import textarea
  // contents + its last validation message, and a flag that lets the "back"
  // control return to an in-progress round instead of the setup screen.
  toast: string;
  toastKind: ToastKind;
  exportArtifact: ExportArtifact | null;
  importText: string;
  importMessage: string;
  importOk: boolean;
  returnToGame: boolean;
  returnPhase: 'playing' | 'round-result' | null;
}
