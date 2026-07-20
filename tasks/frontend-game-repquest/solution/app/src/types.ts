// ====== Types ======

export interface RepSet {
  id: string;
  setId: string;
  reps: number;
  note?: string;
  timestamp: number; // epoch ms
  loggedAt: string;
  date: string;      // YYYY-MM-DD local
}

export interface Zone {
  id: string;
  name: string;
  startReps: number;
  endReps: number;
  bgColors: { sky: string; ground: string; accent: string };
}

export interface Waypoint {
  id: number;
  repsRequired: number;
  zoneId: string;
  isBoss: boolean;
  bossMinReps?: number;
  bossBonusQP?: number;
  bossDefeated: boolean;
}

export interface GearItem {
  id: string;
  name: string;
  cost: number;
  unlocked: boolean;
  equipped: boolean;
  color: string;
  hatColor?: string;
  bodyColor?: string;
  description: string;
}

export interface QuestState {
  lifetimeReps: number;
  todayReps: number;
  dailyGoal: number;
  currentStreak: number;
  questPoints: number;
  repHistory: RepSet[];
  waypoints: Waypoint[];
  zones: Zone[];
  unlockedZoneIds: string[];
  gear: GearItem[];
  equippedGearId: string;
  dailyReminder: boolean;
  reminderHour: number;
  lastGoalMetDate: string;
  zoneUnlockMessages: string[]; // zone IDs that have shown unlock message
  nextSetId: number;
  challengeCheckpoint: ChallengeCheckpoint | null;
}

export interface Snapshot {
  state: QuestState;
  action: string;
  timestamp: number;
}

export interface HistoryBranch {
  id: string;
  label: string;
  snapshots: Snapshot[];
  currentIndex: number;
}

export type GameMode = 'quest' | 'challenge';

export type Difficulty = 'Easy' | 'Normal' | 'Hard';
export type ChallengeResult = 'Victory' | 'Defeat' | null;

export interface ChallengeRun {
  status: 'idle' | 'active' | 'paused' | 'ended';
  bossWaypointId: number;
  difficulty: Difficulty;
  repsLogged: number;
  targetReps: number;
  startedAt: number;
  result: ChallengeResult;
}

export interface ChallengeCheckpoint {
  runStatus: 'active' | 'paused';
  bossWaypointId: number;
  difficulty: Difficulty;
  repsLogged: number;
  targetReps: number;
  savedAt: string;
}

export interface ScenarioPreset {
  id: number;
  label: string;
  dailyGoalDelta: number;
  bonusQp: number;
}
