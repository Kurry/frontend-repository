export type LessonStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface LessonBlock {
  id: string;
  title: string;
  status: LessonStatus;
  duration: number; // in minutes
}

export interface DerivedState {
  summary: string;
  totalDuration: number;
}

export interface AppHistoryEvent {
  type: 'MUTATE_RECORD' | 'UNDO';
  recordId?: string;
  timestamp: string;
  previousState?: Partial<LessonBlock>;
  newState?: Partial<LessonBlock>;
}

export interface ClassroomLessonArcPlannerSession {
  schemaVersion: 'lesson-arc-v1';
  exportedAt: string;
  records: LessonBlock[];
  derived: DerivedState;
  history: AppHistoryEvent[];
}

// Ensure schema version matches instructions
