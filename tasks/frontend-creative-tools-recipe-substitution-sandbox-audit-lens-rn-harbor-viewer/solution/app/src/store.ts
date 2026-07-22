import { create } from 'zustand';
import { IngredientRecord, Status, Session, DerivedState } from './types';

interface StoreState {
  records: IngredientRecord[];
  history: IngredientRecord[][];
  activeSelectionId: string | null;
  filterStatus: Status | 'all';

  // Actions
  addRecord: (record: Omit<IngredientRecord, 'id' | 'order' | 'status'>) => void;
  updateRecord: (id: string, updates: Partial<IngredientRecord>) => void;
  deleteRecord: (id: string) => void;
  reorderRecord: (id: string, newIndex: number) => void;
  setFilterStatus: (status: Status | 'all') => void;

  // Audit Lens Actions
  setActiveSelection: (id: string | null) => void;
  attachEvidenceAndResolve: (id: string, evidence: string) => void;

  // Artifact Actions
  importSession: (session: Session) => void;
  undo: () => void;

  // Getters
  getDerivedState: () => DerivedState;
  getSession: () => Session;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

// Generate 100 seeded records for performance testing
const initialRecords: IngredientRecord[] = Array.from({ length: 100 }, (_, i) => ({
  id: `seed-${i}`,
  name: `Ingredient ${i}`,
  quantity: i + 1,
  unit: 'g',
  status: i === 1 ? 'changed' : (i % 10 === 0 ? 'empty' : i % 5 === 0 ? 'changed' : i % 3 === 0 ? 'draft' : 'ready'),
  discrepancy: i === 1 ? 'Needs evidence' : undefined,
  order: i
}));

export const useStore = create<StoreState>((set, get) => ({
  records: initialRecords,
  history: [],
  activeSelectionId: null,
  filterStatus: 'all',

  addRecord: (record) => set((state) => {
    const newRecord: IngredientRecord = {
      ...record,
      id: generateId(),
      status: 'draft',
      order: state.records.length
    };
    return {
      history: [...state.history, state.records],
      records: [...state.records, newRecord]
    };
  }),

  updateRecord: (id, updates) => set((state) => {
    const newRecords = state.records.map(r =>
      r.id === id ? { ...r, ...updates, status: updates.status || 'changed' } : r
    );
    return {
      history: [...state.history, state.records],
      records: newRecords
    };
  }),

  deleteRecord: (id) => set((state) => ({
    history: [...state.history, state.records],
    records: state.records.filter(r => r.id !== id),
    activeSelectionId: state.activeSelectionId === id ? null : state.activeSelectionId
  })),

  reorderRecord: (id, newIndex) => set((state) => {
    const records = [...state.records].sort((a, b) => a.order - b.order);
    const oldIndex = records.findIndex(r => r.id === id);
    if (oldIndex === -1) return state;

    const [moved] = records.splice(oldIndex, 1);
    records.splice(newIndex, 0, moved);

    const newRecords = records.map((r, i) => ({ ...r, order: i }));
    return {
      history: [...state.history, state.records],
      records: newRecords
    };
  }),

  setFilterStatus: (status) => set({ filterStatus: status }),

  setActiveSelection: (id) => set({ activeSelectionId: id }),

  attachEvidenceAndResolve: (id, evidence) => set((state) => {
    const record = state.records.find(r => r.id === id);
    if (!record || record.status === 'archived') return state; // Invalid state

    const newRecords = state.records.map(r =>
      r.id === id ? {
        ...r,
        evidence,
        discrepancy: undefined,
        status: 'ready' as Status
      } : r
    );

    return {
      history: [...state.history, state.records],
      records: newRecords
    };
  }),

  importSession: (session) => set(() => ({
    records: session.records,
    history: [],
    activeSelectionId: null
  })),

  undo: () => set((state) => {
    if (state.history.length === 0) return state;
    const previous = state.history[state.history.length - 1];
    const newHistory = state.history.slice(0, -1);
    return {
      records: previous,
      history: newHistory,
      activeSelectionId: null // Reset selection on undo for simplicity
    };
  }),

  getDerivedState: () => {
    const { records } = get();
    const totalQuantity = records.reduce((sum, r) => sum + r.quantity, 0);
    const readyCount = records.filter(r => r.status === 'ready').length;
    const conflictCount = records.filter(r => r.discrepancy).length;

    return {
      totalQuantity,
      readyCount,
      conflictCount,
      summary: `Total: ${totalQuantity}, Ready: ${readyCount}, Conflicts: ${conflictCount}`
    };
  },

  getSession: () => {
    const { records, history, getDerivedState } = get();
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records,
      derived: getDerivedState(),
      history: history.map((_, i) => ({
        action: 'Mutation',
        timestamp: new Date().toISOString()
      }))
    };
  }
}));

// Keyboard listener for undo
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      e.preventDefault();
      useStore.getState().undo();
    }
  });
}
