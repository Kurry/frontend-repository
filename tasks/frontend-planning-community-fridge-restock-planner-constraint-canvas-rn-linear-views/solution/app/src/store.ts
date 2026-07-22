import { create } from 'zustand';
import { DomainState, RestockTask, CanvasHistoryEvent, CommunityFridgeRestockPlannerSession } from './types';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
  records: RestockTask[];
  history: CanvasHistoryEvent[];
  selectedRecordId: string | null;
  undoHistory: RestockTask[][]; // Stack of previous record states for undo

  // Actions
  addRecord: (record: Omit<RestockTask, 'id' | 'status'> & { status?: DomainState }) => string;
  updateRecord: (id: string, updates: Partial<RestockTask>) => void;
  deleteRecord: (id: string) => void;
  moveRecord: (id: string, newStatus: DomainState) => void;
  undo: () => void;
  clearSession: () => void;
  importSession: (session: CommunityFridgeRestockPlannerSession) => void;
  selectRecord: (id: string | null) => void;
}

const initialRecords: RestockTask[] = [
  { id: uuidv4(), title: 'Apples', description: 'Fresh honeycrisp', quantity: 20, status: 'empty' },
  { id: uuidv4(), title: 'Milk', description: 'Whole milk gallons', quantity: 5, status: 'draft' },
  { id: uuidv4(), title: 'Carrots', description: 'Bag of carrots', quantity: 10, status: 'ready' },
  { id: uuidv4(), title: 'Bread', description: 'Whole wheat loaves', quantity: 15, status: 'changed' },
  { id: uuidv4(), title: 'Water', description: 'Bottled water cases', quantity: 0, status: 'draft' }, // Seeded conflict state for testing
];

export const useStore = create<AppState>((set, get) => ({
  records: initialRecords,
  history: [],
  selectedRecordId: null,
  undoHistory: [],

  addRecord: (record) => {
    const id = uuidv4();
    const newRecord: RestockTask = {
      ...record,
      id,
      status: record.status || 'draft',
    };
    set((state) => {
      const newHistory: CanvasHistoryEvent = {
        action: 'create',
        recordId: id,
        timestamp: new Date().toISOString(),
      };
      return {
        records: [...state.records, newRecord],
        history: [...state.history, newHistory],
        undoHistory: [...state.undoHistory, state.records],
      };
    });
    return id;
  },

  updateRecord: (id, updates) => {
    set((state) => {
      const existing = state.records.find((r) => r.id === id);
      if (!existing) return state;
      const newHistory: CanvasHistoryEvent = {
        action: 'update',
        recordId: id,
        timestamp: new Date().toISOString(),
      };
      return {
        records: state.records.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        history: [...state.history, newHistory],
        undoHistory: [...state.undoHistory, state.records],
      };
    });
  },

  deleteRecord: (id) => {
    set((state) => {
      const existing = state.records.find((r) => r.id === id);
      if (!existing) return state;
      const newHistory: CanvasHistoryEvent = {
        action: 'delete',
        recordId: id,
        timestamp: new Date().toISOString(),
        previousRecord: existing,
      };
      return {
        records: state.records.filter((r) => r.id !== id),
        history: [...state.history, newHistory],
        undoHistory: [...state.undoHistory, state.records],
        selectedRecordId: state.selectedRecordId === id ? null : state.selectedRecordId,
      };
    });
  },

  moveRecord: (id, newStatus) => {
    set((state) => {
      const record = state.records.find((r) => r.id === id);
      if (!record || record.status === newStatus) return state;

      const newHistory: CanvasHistoryEvent = {
        action: 'move',
        recordId: id,
        previousStatus: record.status,
        newStatus,
        timestamp: new Date().toISOString(),
      };

      return {
        records: state.records.map((r) => (r.id === id ? { ...r, status: newStatus } : r)),
        history: [...state.history, newHistory],
        undoHistory: [...state.undoHistory, state.records],
      };
    });
  },

  undo: () => {
    set((state) => {
      if (state.undoHistory.length === 0) return state;
      const previousRecords = state.undoHistory[state.undoHistory.length - 1];
      const newUndoHistory = state.undoHistory.slice(0, -1);
      return {
        records: previousRecords,
        undoHistory: newUndoHistory,
        // Reset selection if the selected record doesn't exist anymore
        selectedRecordId: previousRecords.find(r => r.id === state.selectedRecordId) ? state.selectedRecordId : null
      };
    });
  },

  clearSession: () => {
    set({
      records: [],
      history: [],
      selectedRecordId: null,
      undoHistory: [],
    });
  },

  importSession: (session) => {
    set({
      records: session.records,
      history: session.history,
      selectedRecordId: null,
      undoHistory: [],
    });
  },

  selectRecord: (id) => {
    set({ selectedRecordId: id });
  },
}));
