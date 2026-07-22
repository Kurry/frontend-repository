export type DomainStatus = 'draft' | 'ready' | 'changed' | 'archived';
export type AuditState = 'idle' | 'selected' | 'changed' | 'conflict' | 'resolved';

export interface LessonBlock {
  id: string;
  title: string;
  durationMins: number;
  status: DomainStatus;
  auditState: AuditState;
  evidenceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DerivedState {
  summary: {
    totalBlocks: number;
    resolvedDiscrepancies: number;
    totalDurationMins: number;
  };
}

export interface HistoryEvent {
  action: string;
  timestamp: string;
  recordId?: string;
}

export interface ClassroomLessonArcPlannerSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: LessonBlock[];
  derived: DerivedState;
  history: HistoryEvent[];
}
