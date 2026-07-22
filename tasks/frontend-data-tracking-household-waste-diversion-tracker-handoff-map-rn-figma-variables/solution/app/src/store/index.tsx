import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { WasteEventRecord, DerivedState, HistoryEntry } from '../types';

interface AppState {
  records: WasteEventRecord[];
  history: HistoryEntry[];
}

export type Action =
  | { type: 'SET_STATE'; payload: AppState }
  | { type: 'CREATE_RECORD'; payload: Omit<WasteEventRecord, 'id'> }
  | { type: 'UPDATE_RECORD'; payload: WasteEventRecord }
  | { type: 'DELETE_RECORD'; payload: string }
  | { type: 'CONNECT_OWNER'; payload: { recordId: string; ownerId: string; readiness: 'ready' | 'changed' | 'draft' | 'archived' | 'empty' } }
  | { type: 'UNDO' }
  | { type: 'CLEAR' };

export const generateId = () => Math.random().toString(36).substring(2, 9);

export const initialState: AppState = {
  records: [
    { id: '1', name: 'Plastic Bottles', status: 'draft', weight: 5, type: 'Plastic', notes: '1 bag', ownerId: null },
    { id: '2', name: 'Cardboard Boxes', status: 'ready', weight: 12, type: 'Paper', notes: 'Flattened', ownerId: 'owner-1' },
    { id: '3', name: 'Glass Jars', status: 'archived', weight: 8, type: 'Glass', notes: '', ownerId: null },
    { id: '4', name: 'Empty Event', status: 'empty', weight: 0, type: '', notes: '', ownerId: null },
  ],
  history: [],
};

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_STATE':
      return action.payload;
    case 'CREATE_RECORD': {
      const newRecord = { ...action.payload, id: generateId() };
      return {
        records: [...state.records, newRecord],
        history: [{ timestamp: new Date().toISOString(), action: 'CREATE_RECORD', previousState: state.records }, ...state.history].slice(0, 50),
      };
    }
    case 'UPDATE_RECORD': {
      const updatedRecords = state.records.map((r) => (r.id === action.payload.id ? action.payload : r));
      return {
        records: updatedRecords,
        history: [{ timestamp: new Date().toISOString(), action: 'UPDATE_RECORD', previousState: state.records }, ...state.history].slice(0, 50),
      };
    }
    case 'DELETE_RECORD': {
      const remainingRecords = state.records.filter((r) => r.id !== action.payload);
      return {
        records: remainingRecords,
        history: [{ timestamp: new Date().toISOString(), action: 'DELETE_RECORD', previousState: state.records }, ...state.history].slice(0, 50),
      };
    }
    case 'CONNECT_OWNER': {
      const updatedRecords = state.records.map((r) => {
        if (r.id === action.payload.recordId) {
          return { ...r, ownerId: action.payload.ownerId, status: action.payload.readiness };
        }
        return r;
      });
      return {
        records: updatedRecords,
        history: [{ timestamp: new Date().toISOString(), action: 'CONNECT_OWNER', previousState: state.records }, ...state.history].slice(0, 50),
      };
    }
    case 'UNDO': {
      if (state.history.length === 0) return state;
      const [lastAction, ...remainingHistory] = state.history;
      return {
        records: lastAction.previousState,
        history: remainingHistory,
      };
    }
    case 'CLEAR':
      return {
        records: [],
        history: [],
      };
    default:
      return state;
  }
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  derived: DerivedState;
} | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const derived: DerivedState = {
    summary: {
      totalEvents: state.records.length,
      totalWeight: state.records.reduce((sum, r) => sum + r.weight, 0),
      readyCount: state.records.filter((r) => r.status === 'ready').length,
    },
  };

  return (
    <AppContext.Provider value={{ state, dispatch, derived }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
};
