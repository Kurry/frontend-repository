export type RecordStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';
export type ForecastOutcome = 'idle' | 'selected' | 'changed' | 'conflict' | 'resolved';

export interface WorkRecord {
  id: string;
  title: string;
  status: RecordStatus;
  assignedDate: string;
  effort: number;
}

export interface DerivedStats {
  totalEffort: number;
  readyCount: number;
  draftCount: number;
  conflictCount: number;
}

export interface ArtifactSession {
  schemaVersion: 'garden-workday-v1';
  exportedAt: string;
  records: WorkRecord[];
  derived: DerivedStats;
  history: HistoryEvent[];
}

export interface HistoryEvent {
  timestamp: string;
  action: string;
  recordId?: string;
  changes?: Partial<WorkRecord>;
}

export interface AppState {
  records: WorkRecord[];
  history: HistoryEvent[];
  selectedRecordId: string | null;
  ribbonOutcome: ForecastOutcome;
  filterStatus: RecordStatus | 'all';
}
