export type DomainStatus = 'draft' | 'ready' | 'changed' | 'archived';

export interface LessonBlock {
  id: string;
  title: string;
  durationMinutes: number;
  status: DomainStatus;
  batchId?: string;
  order: number;
}

export interface BatchReconcilerState {
  batchId: string;
  totalDuration: number;
  recordIds: string[];
}

export interface DerivedState {
  summary: {
    totalBlocks: number;
    totalDuration: number;
    batchedBlocks: number;
  };
}

export interface ActionHistory {
  action: string;
  timestamp: string;
  previousState?: any;
}

export interface ClassroomLessonArcPlannerSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: LessonBlock[];
  derived: DerivedState;
  history: ActionHistory[];
}
