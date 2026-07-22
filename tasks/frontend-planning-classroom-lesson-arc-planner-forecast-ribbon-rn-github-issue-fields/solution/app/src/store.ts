import { useState, useEffect } from 'react';

export type LessonStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';
export type ForecastState = 'idle' | 'selected' | 'changed' | 'conflict' | 'resolved';

export interface LessonBlock {
  id: string;
  title: string;
  duration: number; // minutes
  status: LessonStatus;
  forecastRibbonState: ForecastState;
  notes?: string;
}

export interface DerivedSummary {
  totalDuration: number;
  readyCount: number;
  draftCount: number;
  archivedCount: number;
}

export interface SessionHistoryEvent {
  timestamp: string;
  action: string;
  recordId?: string;
  details: string;
}

export interface ClassroomSession {
  schemaVersion: 'lesson-arc-v1';
  exportedAt: string;
  records: LessonBlock[];
  derived: DerivedSummary;
  history: SessionHistoryEvent[];
}

// In-memory global state
let state: ClassroomSession = {
  schemaVersion: 'lesson-arc-v1',
  exportedAt: new Date().toISOString(),
  records: [],
  derived: {
    totalDuration: 0,
    readyCount: 0,
    draftCount: 0,
    archivedCount: 0,
  },
  history: [],
};

// Undo stack
let undoStack: ClassroomSession[] = [];

const saveUndoState = () => {
  undoStack.push(JSON.parse(JSON.stringify(state)));
  if (undoStack.length > 50) undoStack.shift();
};

type StateListener = () => void;
const listeners = new Set<StateListener>();

export const store = {
  getState: () => state,
  subscribe: (listener: StateListener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  // Actions
  seedInitialData: () => {
    if (state.records.length === 0) {
        saveUndoState();
        const initialRecords: LessonBlock[] = [
            { id: 'rec-1', title: 'Introduction to Fractions', duration: 45, status: 'ready', forecastRibbonState: 'idle' },
            { id: 'rec-2', title: 'Adding Unlike Denominators', duration: 60, status: 'draft', forecastRibbonState: 'idle' },
            { id: 'rec-3', title: 'Multiplying Fractions', duration: 45, status: 'empty', forecastRibbonState: 'idle' }
        ];
        store.updateRecords(initialRecords, 'Seeded initial data');
    }
  },

  addRecord: (record: LessonBlock) => {
    saveUndoState();
    const newRecords = [...state.records, record];
    store.updateRecords(newRecords, 'Created record: ' + record.title, record.id);
  },

  updateRecord: (id: string, updates: Partial<LessonBlock>) => {
    saveUndoState();
    const record = state.records.find(r => r.id === id);
    if (!record) return;
    const newRecords = state.records.map(r => r.id === id ? { ...r, ...updates } : r);
    store.updateRecords(newRecords, 'Updated record: ' + id, id);
  },

  deleteRecord: (id: string) => {
    saveUndoState();
    const newRecords = state.records.filter(r => r.id !== id);
    store.updateRecords(newRecords, 'Deleted record: ' + id, id);
  },

  undo: () => {
    if (undoStack.length > 0) {
      state = undoStack.pop() as ClassroomSession;
      store.notify();
    }
  },

  importSession: (session: ClassroomSession) => {
    saveUndoState();
    state = session;
    store.notify();
  },

  clearSession: () => {
    saveUndoState();
    state = {
      schemaVersion: 'lesson-arc-v1',
      exportedAt: new Date().toISOString(),
      records: [],
      derived: {
        totalDuration: 0,
        readyCount: 0,
        draftCount: 0,
        archivedCount: 0,
      },
      history: [],
    };
    store.notify();
  },

  // Internal helper to keep derived state in sync
  updateRecords: (newRecords: LessonBlock[], action: string, recordId?: string) => {
    const derived = {
      totalDuration: newRecords.reduce((sum, r) => sum + (r.status !== 'archived' ? r.duration : 0), 0),
      readyCount: newRecords.filter(r => r.status === 'ready').length,
      draftCount: newRecords.filter(r => r.status === 'draft').length,
      archivedCount: newRecords.filter(r => r.status === 'archived').length,
    };

    const newHistoryEvent: SessionHistoryEvent = {
      timestamp: new Date().toISOString(),
      action,
      recordId,
      details: JSON.stringify(derived)
    };

    state = {
      ...state,
      records: newRecords,
      derived,
      history: [...state.history, newHistoryEvent]
    };

    store.notify();
  },

  notify: () => {
    listeners.forEach(l => l());
  }
};

export function useStore<T>(selector: (state: ClassroomSession) => T): T {
  const [value, setValue] = useState(() => selector(store.getState()));

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setValue(selector(store.getState()));
    });
    return unsubscribe;
  }, []);

  return value;
}
