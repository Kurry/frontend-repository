export type BookStatus = 'draft' | 'ready' | 'changed' | 'archived' | 'quarantined';

export interface BookEvent {
  id: string;
  timestamp: string;
  type: string; // e.g., 'created', 'status_changed', 'quarantined'
  description: string;
}

export interface BookRecord {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  history: BookEvent[];
  updatedAt: string;
}

export interface DerivedState {
  summary: {
    total: number;
    draft: number;
    ready: number;
    changed: number;
    archived: number;
    quarantined: number;
  };
}

export interface HomeLibraryLendingLedgerSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: BookRecord[];
  derived: DerivedState;
  history: any[]; // App-level history for undo functionality
}
