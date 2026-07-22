import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ServiceRecord, BikeMaintenanceMileageMapSession, RecordStatus } from './types';

interface StoreState {
  records: ServiceRecord[];
  history: { action: string; timestamp: string; stateSnapshot: ServiceRecord[] }[];
  undoStack: ServiceRecord[][];
  redoStack: ServiceRecord[][];
  filter: RecordStatus | 'all';

  // Actions
  addRecord: (record: Omit<ServiceRecord, 'id' | 'status'>) => void;
  updateRecord: (id: string, updates: Partial<ServiceRecord>) => void;
  deleteRecord: (id: string) => void;
  adjustForecast: (id: string, projectedMileage: number) => void;
  undo: () => void;
  setFilter: (filter: RecordStatus | 'all') => void;
  exportSession: () => string;
  importSession: (jsonString: string) => void;
  clearSession: () => void;
}

const seedRecords: ServiceRecord[] = Array.from({ length: 105 }, (_, i) => ({
  id: `seed-${i}`,
  title: `Service ${i + 1}`,
  mileage: Math.floor(Math.random() * 5000) + 100,
  date: new Date(Date.now() - Math.random() * 10000000000).toISOString().split('T')[0],
  status: i % 10 === 0 ? 'draft' : i % 5 === 0 ? 'archived' : 'ready'
}));

export const useStore = create<StoreState>((set, get) => ({
  records: seedRecords,
  history: [],
  undoStack: [],
  redoStack: [],
  filter: 'all',

  addRecord: (record) => {
    set((state) => {
      const newRecord: ServiceRecord = { ...record, id: uuidv4(), status: 'draft' };
      const newRecords = [newRecord, ...state.records];
      return {
        records: newRecords,
        undoStack: [...state.undoStack, state.records],
        redoStack: [],
        history: [...state.history, { action: 'create', timestamp: new Date().toISOString(), stateSnapshot: newRecords }]
      };
    });
  },

  updateRecord: (id, updates) => {
    set((state) => {
      const newRecords = state.records.map(r => r.id === id ? { ...r, ...updates, status: updates.status || (r.status === 'empty' ? 'draft' : 'changed') } : r);
      return {
        records: newRecords,
        undoStack: [...state.undoStack, state.records],
        redoStack: [],
        history: [...state.history, { action: 'update', timestamp: new Date().toISOString(), stateSnapshot: newRecords }]
      };
    });
  },

  deleteRecord: (id) => {
    set((state) => {
      const newRecords = state.records.filter(r => r.id !== id);
      return {
        records: newRecords,
        undoStack: [...state.undoStack, state.records],
        redoStack: [],
        history: [...state.history, { action: 'delete', timestamp: new Date().toISOString(), stateSnapshot: newRecords }]
      };
    });
  },

  adjustForecast: (id, projectedMileage) => {
    set((state) => {
      const newRecords = state.records.map(r => r.id === id ? { ...r, projectedMileage, status: 'changed' as RecordStatus } : r);
      return {
        records: newRecords,
        undoStack: [...state.undoStack, state.records],
        redoStack: [],
        history: [...state.history, { action: 'forecast', timestamp: new Date().toISOString(), stateSnapshot: newRecords }]
      };
    });
  },

  undo: () => {
    set((state) => {
      if (state.undoStack.length === 0) return state;
      const previousState = state.undoStack[state.undoStack.length - 1];
      const newUndoStack = state.undoStack.slice(0, -1);
      return {
        records: previousState,
        undoStack: newUndoStack,
        redoStack: [state.records, ...state.redoStack],
        history: [...state.history, { action: 'undo', timestamp: new Date().toISOString(), stateSnapshot: previousState }]
      };
    });
  },

  setFilter: (filter) => set({ filter }),

  exportSession: () => {
    const state = get();
    const derived = {
      totalMileage: state.records.reduce((acc, r) => acc + r.mileage, 0),
      projectedTotalMileage: state.records.reduce((acc, r) => acc + (r.projectedMileage ?? r.mileage), 0),
      activeForecasts: state.records.filter(r => r.projectedMileage !== undefined).length
    };

    const session: BikeMaintenanceMileageMapSession = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived,
      history: state.history
    };
    return JSON.stringify(session, null, 2);
  },

  importSession: (jsonString) => {
    try {
      const data = JSON.parse(jsonString) as BikeMaintenanceMileageMapSession;
      if (data.schemaVersion !== 'v1' || !Array.isArray(data.records)) {
        return; // No-op on invalid
      }
      // Regenerate exportedAt via setting state
      set({
        records: data.records,
        history: data.history || [],
        undoStack: [],
        redoStack: []
      });
    } catch (e) {
      // Invalid JSON is a no-op
    }
  },

  clearSession: () => {
    set({
      records: [],
      history: [],
      undoStack: [],
      redoStack: []
    });
  }
}));
