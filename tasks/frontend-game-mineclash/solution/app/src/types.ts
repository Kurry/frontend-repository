export type Difficulty = 'easy' | 'medium' | 'hard';
export type Phase = 'setup' | 'playing' | 'round-result' | 'match-complete' | 'stats' | 'match-log' | 'export-center';
export type Turn = 'player' | 'rival';
export type HintStatus = 'none' | 'safe' | 'mine';
export type PlayerMode = 'reveal' | 'flag' | 'hint';

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
  winner: Turn | 'draw';
  reason: string;
  outcomeReason?: string;
}

export interface MatchResult {
  playerName: string;
  difficulty: Difficulty;
  playerRoundWins: number;
  rivalRoundWins: number;
  playerTotalOre: number;
  rivalTotalOre: number;
  winner: Turn | 'draw';
  rounds: RoundResult[];
  endedAt: string;
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

export interface AppStore {
  phase: Phase;
  playerName: string;
  difficulty: Difficulty;
  soundEnabled: boolean;

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
  currentTurn: Turn;

  roundNumber: number;
  matchRounds: RoundResult[];
  playerMatchWins: number;
  rivalMatchWins: number;
  lastRoundResult: RoundResult | null;
  matchLog: MatchResult[];

  historyNodes: HistoryNode[];
  currentHistoryId: string | null;
  selectedHistoryId: string | null;

  stats: StatsData;

  showHistoryPanel: boolean;
  lastPlayerActionLabel: string;
  feedback: string;
}
