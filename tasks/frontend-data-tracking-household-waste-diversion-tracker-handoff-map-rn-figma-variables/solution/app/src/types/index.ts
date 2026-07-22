export type Status = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface Owner {
  id: string;
  name: string;
  type: string;
}

export interface WasteEventRecord {
  id: string;
  name: string;
  status: Status;
  weight: number;
  type: string;
  ownerId?: string | null;
  notes: string;
}

export interface DerivedState {
  summary: {
    totalEvents: number;
    totalWeight: number;
    readyCount: number;
  };
}

export interface HistoryEntry {
  timestamp: string;
  action: string;
  previousState: WasteEventRecord[];
}

export interface HouseholdWasteDiversionTrackerSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: WasteEventRecord[];
  derived: DerivedState;
  history: HistoryEntry[];
}
