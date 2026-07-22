export type DomainStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived' | 'failed' | 'conflict' | 'resolved';

export interface LayoverActivity {
  id: string;
  title: string;
  status: DomainStatus;
  durationMinutes: number;
  location: string;
  notes?: string;
  recoveryPathId?: string | null;
  downstreamImpact?: string | null;
}

export interface DerivedSummary {
  totalDuration: number;
  readyCount: number;
  failedCount: number;
  resolvedCount: number;
}

export interface AppState {
  records: LayoverActivity[];
  selectedId: string | null;
  history: LayoverActivity[][];
  historyIndex: number;
}
