export type RecordStatus = 'draft' | 'ready' | 'changed' | 'archived';

export interface SpeakerRecord {
  id: string;
  name: string;
  topic: string;
  status: RecordStatus;
  owner: string | null;
  readiness: number;
}

export interface DerivedState {
  summary: {
    total: number;
    ready: number;
    draft: number;
    archived: number;
  };
}

export interface HistoryEvent {
  action: string;
  timestamp: string;
  recordId?: string;
  details?: any;
}

export interface ConferenceSpeakerGreenroomBoardSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: SpeakerRecord[];
  derived: DerivedState;
  history: HistoryEvent[];
}
