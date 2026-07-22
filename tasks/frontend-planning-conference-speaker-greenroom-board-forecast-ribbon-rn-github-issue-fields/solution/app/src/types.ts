export type RecordStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface Record {
  id: string;
  status: RecordStatus;
  title: string;
  speaker: string;
  time: string;
  forecastScore: number;
}

export interface DerivedState {
  totalRecords: number;
  averageScore: number;
  statusCounts: { [key in RecordStatus]?: number };
}

export interface HistoryEvent {
  action: string;
  timestamp: string;
  recordId?: string;
}

export interface ConferenceSpeakerGreenroomBoardSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: Record[];
  derived: DerivedState;
  history: HistoryEvent[];
}

export interface AppState {
  records: Record[];
  history: HistoryEvent[];
  selectedRecordId: string | null;
  undoStack: Record[][];
}

export type AppAction =
  | { type: 'CREATE_RECORD'; payload: Record }
  | { type: 'UPDATE_RECORD'; payload: Record }
  | { type: 'DELETE_RECORD'; payload: string }
  | { type: 'SELECT_RECORD'; payload: string | null }
  | { type: 'SET_RECORDS'; payload: { records: Record[], history: HistoryEvent[] } }
  | { type: 'UNDO' };
