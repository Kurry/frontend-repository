import { useReducer, useEffect } from 'react';
import type { BookRecord, HomeLibraryLendingLedgerSession, DerivedState, BookStatus } from './types';
import { v4 as uuidv4 } from 'uuid';

export type Action =
  | { type: 'CREATE_BOOK'; payload: { title: string; author: string } }
  | { type: 'UPDATE_BOOK'; payload: { id: string; title: string; author: string } }
  | { type: 'DELETE_BOOK'; payload: string }
  | { type: 'CHANGE_STATUS'; payload: { id: string; status: BookStatus; description: string } }
  | { type: 'QUARANTINE_LINEAGE'; payload: { id: string } }
  | { type: 'IMPORT_STATE'; payload: HomeLibraryLendingLedgerSession }
  | { type: 'UNDO' }
  | { type: 'CLEAR_ALL' };

export const initialState: HomeLibraryLendingLedgerSession = {
  schemaVersion: 'v1',
  exportedAt: new Date().toISOString(),
  records: [],
  derived: {
    summary: { total: 0, draft: 0, ready: 0, changed: 0, archived: 0, quarantined: 0 },
  },
  history: [],
};

function calculateDerived(records: BookRecord[]): DerivedState {
  return {
    summary: {
      total: records.length,
      draft: records.filter(r => r.status === 'draft').length,
      ready: records.filter(r => r.status === 'ready').length,
      changed: records.filter(r => r.status === 'changed').length,
      archived: records.filter(r => r.status === 'archived').length,
      quarantined: records.filter(r => r.status === 'quarantined').length,
    },
  };
}

function reducer(state: HomeLibraryLendingLedgerSession, action: Action): HomeLibraryLendingLedgerSession {
  // Prevent mutation of previous state by creating a deep-ish clone for history before acting
  const prevStateForHistory: Omit<HomeLibraryLendingLedgerSession, 'history'> = {
    schemaVersion: state.schemaVersion,
    exportedAt: state.exportedAt,
    records: JSON.parse(JSON.stringify(state.records)),
    derived: JSON.parse(JSON.stringify(state.derived))
  };

  switch (action.type) {
    case 'CREATE_BOOK': {
      const now = new Date().toISOString();
      const newBook: BookRecord = {
        id: uuidv4(),
        title: action.payload.title,
        author: action.payload.author,
        status: 'draft',
        updatedAt: now,
        history: [{
          id: uuidv4(),
          timestamp: now,
          type: 'created',
          description: 'Book created as draft'
        }]
      };
      const records = [...state.records, newBook];
      return {
        ...state,
        records,
        derived: calculateDerived(records),
        history: [...state.history, prevStateForHistory]
      };
    }
    case 'UPDATE_BOOK': {
      const now = new Date().toISOString();
      let updated = false;
      const records = state.records.map(r => {
        if (r.id === action.payload.id) {
          updated = true;
          return {
            ...r,
            title: action.payload.title,
            author: action.payload.author,
            updatedAt: now,
            history: [...r.history, {
              id: uuidv4(),
              timestamp: now,
              type: 'updated',
              description: 'Book details updated'
            }]
          };
        }
        return r;
      });
      if (!updated) return state;
      return {
        ...state,
        records,
        derived: calculateDerived(records),
        history: [...state.history, prevStateForHistory]
      };
    }
    case 'DELETE_BOOK': {
      const records = state.records.filter(r => r.id !== action.payload);
      return {
        ...state,
        records,
        derived: calculateDerived(records),
        history: [...state.history, prevStateForHistory]
      };
    }
    case 'CHANGE_STATUS': {
      const now = new Date().toISOString();
      let updated = false;
      const records = state.records.map(r => {
        if (r.id === action.payload.id) {
          updated = true;
          return {
            ...r,
            status: action.payload.status,
            updatedAt: now,
            history: [...r.history, {
              id: uuidv4(),
              timestamp: now,
              type: 'status_changed',
              description: action.payload.description
            }]
          };
        }
        return r;
      });
      if (!updated) return state;
      return {
        ...state,
        records,
        derived: calculateDerived(records),
        history: [...state.history, prevStateForHistory]
      };
    }
    case 'QUARANTINE_LINEAGE': {
      const now = new Date().toISOString();
      let updated = false;
      const records = state.records.map(r => {
        if (r.id === action.payload.id) {
          updated = true;
          return {
            ...r,
            status: 'quarantined' as BookStatus,
            updatedAt: now,
            history: [...r.history, {
              id: uuidv4(),
              timestamp: now,
              type: 'quarantined',
              description: 'Lineage quarantined due to provenance atlas interaction'
            }]
          };
        }
        return r;
      });
      if (!updated) return state;
      return {
        ...state,
        records,
        derived: calculateDerived(records),
        history: [...state.history, prevStateForHistory]
      };
    }
    case 'IMPORT_STATE': {
      return {
        ...action.payload,
        history: [...state.history, prevStateForHistory]
      };
    }
    case 'CLEAR_ALL': {
      return {
        ...initialState,
        history: [...state.history, prevStateForHistory]
      };
    }
    case 'UNDO': {
      if (state.history.length === 0) return state;
      const previousState = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);
      return {
        ...state,
        ...previousState,
        history: newHistory
      };
    }
    default:
      return state;
  }
}

export function useAppStore() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Bind undo to ctrl+z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        dispatch({ type: 'UNDO' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { state, dispatch };
}
