export type BookStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived' | 'recovery';

export interface BookRecord {
  id: string;
  title: string;
  author: string;
  isbn: string;
  pageCount: number;
  status: BookStatus;
  condition: string;
  recoveryReason?: string;
  recoveryNote?: string;
}

export interface SessionArtifact {
  schemaVersion: 'v1';
  exportedAt: string;
  records: BookRecord[];
  derived: {
    totalCount: number;
    recoveryCount: number;
    readyCount: number;
  };
  history: string[];
}

export interface AppState {
  records: BookRecord[];
  selectedRecordId: string | null;
  history: {
    past: AppState[];
    present: AppState | null;
  };
}

export type Action =
  | { type: 'CREATE_RECORD'; payload: BookRecord }
  | { type: 'UPDATE_RECORD'; payload: BookRecord }
  | { type: 'DELETE_RECORD'; payload: string }
  | { type: 'MOVE_TO_RECOVERY'; payload: { id: string; reason: string } }
  | { type: 'RESOLVE_RECOVERY'; payload: BookRecord }
  | { type: 'SELECT_RECORD'; payload: string | null }
  | { type: 'IMPORT_ARTIFACT'; payload: SessionArtifact }
  | { type: 'UNDO' };

export const initialState: AppState = {
  records: [],
  selectedRecordId: null,
  history: { past: [], present: null },
};
