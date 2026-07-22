export type IntakeStatus = 'draft' | 'ready' | 'changed' | 'archived';

export interface WaterIntakeEvent {
  id: string;
  timestamp: string;
  amountMl: number;
  source: string;
  status: IntakeStatus;
  forecastRibbonState?: 'idle' | 'selected' | 'changed' | 'conflict' | 'resolved';
}

export interface DerivedState {
  summary: {
    totalMl: number;
    projectedMl: number;
    dailyGoalMl: number;
  };
}

export interface HistoryEntry {
  timestamp: string;
  action: string;
  recordId?: string;
}

export interface WaterIntakePatternMapSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: WaterIntakeEvent[];
  derived: DerivedState;
  history: HistoryEntry[];
}
