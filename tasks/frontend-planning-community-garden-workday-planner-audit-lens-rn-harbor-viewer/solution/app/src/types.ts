export type RecordStatus = 'draft' | 'ready' | 'changed' | 'archived';
export type AuditLensState = 'idle' | 'selected' | 'changed' | 'conflict' | 'resolved';

export interface WorkRecord {
  id: string;
  title: string;
  description: string;
  status: RecordStatus;
  auditLensState: AuditLensState;
  evidence: string | null;
  order: number;
}

export interface DerivedSummary {
  totalTasks: number;
  resolvedDiscrepancies: number;
}

export interface HistoryEvent {
  action: string;
  timestamp: string;
  recordId: string;
}

export interface CommunityGardenWorkdayPlannerSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: WorkRecord[];
  derived: DerivedSummary;
  history: HistoryEvent[];
}
