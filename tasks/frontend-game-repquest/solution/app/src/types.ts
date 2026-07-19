// ====== Types ======

export interface RepSet {
  id: string;
  reps: number;
  timestamp: number; // epoch ms
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

export interface ChallengeRun {
  status: 'idle' | 'active' | 'paused' | 'cleared' | 'failed';
  bossWaypointId: number;
  repsLogged: number;
  startedAt: number;
}

export interface ScenarioPreset {
  id: number;
  label: string;
  dailyGoalDelta: number;
  bonusQp: number;
}
