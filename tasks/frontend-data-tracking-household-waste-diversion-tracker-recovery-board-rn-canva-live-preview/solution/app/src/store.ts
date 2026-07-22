import { create } from 'zustand';
import type { WasteEvent, WasteEventStatus, HouseholdWasteDiversionTrackerSession } from './types';

// Seed initial records (at least 100)
const seedRecords = (): WasteEvent[] => {
  const records: WasteEvent[] = [];
  const categories = ['Recycling', 'Compost', 'Landfill', 'Hazardous'];
  const statuses: WasteEventStatus[] = ['draft', 'ready', 'changed', 'archived', 'conflict', 'resolved'];

  for (let i = 1; i <= 105; i++) {
    records.push({
      id: `evt-${1000 + i}`,
      name: `Household Waste Collection ${i}`,
      date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString().split('T')[0],
      status: statuses[i % statuses.length],
      weightKg: Math.floor(Math.random() * 50) + 5,
      category: categories[i % categories.length],
      recoveryBoardState: {
        x: Math.floor(Math.random() * 800),
        y: Math.floor(Math.random() * 600),
        selected: false
      }
    });
  }
  return records;
};

interface AppState {
  records: WasteEvent[];
  history: WasteEvent[][];

  // Actions
  addRecord: (record: Omit<WasteEvent, 'id'>) => void;
  updateRecord: (id: string, updates: Partial<WasteEvent>) => void;
  deleteRecord: (id: string) => void;

  // Recovery Board actions
  moveToRecovery: (id: string) => void;
  repairDownstream: (id: string, updates: Partial<WasteEvent>) => void;

  // Undo/Redo
  undo: () => void;

  // Import/Export
  importSession: (session: HouseholdWasteDiversionTrackerSession) => void;

  // Derived state (selectors usually handle this, but for simplicity we compute it)
  getDerivedSummary: () => HouseholdWasteDiversionTrackerSession['derived']['summary'];
}

export const useStore = create<AppState>((set, get) => ({
  records: seedRecords(),
  history: [],

  addRecord: (recordData) => set((state) => {
    const newRecord: WasteEvent = {
      ...recordData,
      id: `evt-${Date.now()}`,
      recoveryBoardState: { x: 100, y: 100, selected: false }
    };
    return {
      history: [...state.history, state.records],
      records: [...state.records, newRecord]
    };
  }),

  updateRecord: (id, updates) => set((state) => ({
    history: [...state.history, state.records],
    records: state.records.map(r => r.id === id ? { ...r, ...updates } : r)
  })),

  deleteRecord: (id) => set((state) => ({
    history: [...state.history, state.records],
    records: state.records.filter(r => r.id !== id)
  })),

  moveToRecovery: (id) => set((state) => ({
    history: [...state.history, state.records],
    records: state.records.map(r => r.id === id ? { ...r, status: 'conflict', recoveryBoardState: { ...r.recoveryBoardState, selected: true, x: r.recoveryBoardState?.x || 100, y: r.recoveryBoardState?.y || 100 } } : r)
  })),

  repairDownstream: (id, updates) => set((state) => ({
    history: [...state.history, state.records],
    records: state.records.map(r => r.id === id ? { ...r, ...updates, status: 'resolved', recoveryBoardState: { ...r.recoveryBoardState, selected: false, x: r.recoveryBoardState?.x || 100, y: r.recoveryBoardState?.y || 100 } } : r)
  })),

  undo: () => set((state) => {
    if (state.history.length === 0) return state;
    const previousRecords = state.history[state.history.length - 1];
    return {
      records: previousRecords,
      history: state.history.slice(0, -1)
    };
  }),

  importSession: (session) => set(() => ({
    records: session.records,
    history: [] // Clear history on import
  })),

  getDerivedSummary: () => {
    const records = get().records;
    return {
      totalEvents: records.length,
      totalWeightKg: records.reduce((sum, r) => sum + r.weightKg, 0),
      readyCount: records.filter(r => r.status === 'ready').length,
      conflictCount: records.filter(r => r.status === 'conflict').length,
      resolvedCount: records.filter(r => r.status === 'resolved').length
    };
  }
}));
