import { create } from 'zustand';
import type { AppState, ComponentStatus, DerivedSummary, FlavorComponent, RecipeFlavorBalanceStudioSession } from './types';

interface StoreState extends AppState {
  history: AppState[];
  selectedIds: Set<string>;

  // Actions
  addRecord: (record: Omit<FlavorComponent, 'id'>) => void;
  updateRecord: (id: string, updates: Partial<FlavorComponent>) => void;
  deleteRecord: (id: string) => void;
  selectRecord: (id: string, selected: boolean) => void;

  // Batch Reconciler Actions
  reconcileBatch: () => void;
  resolveConflict: (resolution: 'accept' | 'reject') => void;

  // Session Actions
  undo: () => void;
  importSession: (session: RecipeFlavorBalanceStudioSession) => void;
  clearSession: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const calculateDerived = (records: FlavorComponent[], batchIds: string[]): DerivedSummary => {
  const batchRecords = records.filter(r => batchIds.includes(r.id));
  const totalIntensity = batchRecords.reduce((sum, r) => sum + r.intensity, 0);
  return {
    totalIntensity,
    count: batchRecords.length,
    readyCount: batchRecords.filter(r => r.status === 'ready').length,
    batchIds
  };
};

const getInitialState = (): AppState => {
  const initialRecords: FlavorComponent[] = Array.from({ length: 100 }, (_, i) => ({
    id: `comp-${i}`,
    name: `Component ${i}`,
    intensity: Math.floor(Math.random() * 10) + 1,
    notes: i % 2 === 0 ? 'Needs more salt' : '',
    status: i % 5 === 0 ? 'empty' : (i % 3 === 0 ? 'ready' : 'draft'),
  }));

  return {
    records: initialRecords,
    batchReconcilerState: 'idle',
    derived: calculateDerived(initialRecords, []),
  };
};

export const useAppStore = create<StoreState>((set) => ({
  ...getInitialState(),
  history: [],
  selectedIds: new Set(),

  addRecord: (record) => {
    set((state) => {
      const newRecord = { ...record, id: generateId() };
      const newRecords = [newRecord, ...state.records];
      const newDerived = calculateDerived(newRecords, state.derived.batchIds);
      return {
        records: newRecords,
        derived: newDerived,
        history: [...state.history, { records: state.records, batchReconcilerState: state.batchReconcilerState, derived: state.derived }]
      };
    });
  },

  updateRecord: (id, updates) => {
    set((state) => {
      const newRecords = state.records.map((r) => (r.id === id ? { ...r, ...updates, status: 'changed' as ComponentStatus } : r));
      const newDerived = calculateDerived(newRecords, state.derived.batchIds);
      return {
        records: newRecords,
        derived: newDerived,
        history: [...state.history, { records: state.records, batchReconcilerState: state.batchReconcilerState, derived: state.derived }]
      };
    });
  },

  deleteRecord: (id) => {
    set((state) => {
      const newRecords = state.records.filter((r) => r.id !== id);
      const newSelectedIds = new Set(state.selectedIds);
      newSelectedIds.delete(id);
      const newBatchIds = state.derived.batchIds.filter(bId => bId !== id);
      const newDerived = calculateDerived(newRecords, newBatchIds);

      return {
        records: newRecords,
        selectedIds: newSelectedIds,
        derived: newDerived,
        batchReconcilerState: newSelectedIds.size > 0 ? state.batchReconcilerState : 'idle',
        history: [...state.history, { records: state.records, batchReconcilerState: state.batchReconcilerState, derived: state.derived }]
      };
    });
  },

  selectRecord: (id, selected) => {
    set((state) => {
      const newSelectedIds = new Set(state.selectedIds);
      if (selected) {
        newSelectedIds.add(id);
      } else {
        newSelectedIds.delete(id);
      }
      return {
        selectedIds: newSelectedIds,
        batchReconcilerState: newSelectedIds.size > 0 ? 'selected' : 'idle'
      };
    });
  },

  reconcileBatch: () => {
    set((state) => {
      if (state.selectedIds.size === 0) return state;

      // Group selected into a batch
      const batchIds = Array.from(state.selectedIds);

      // Validation: checking for empty notes as a dummy conflict condition for now
      const selectedRecords = state.records.filter(r => batchIds.includes(r.id));
      const hasConflict = selectedRecords.some(r => r.status === 'empty');

      if (hasConflict) {
        return { batchReconcilerState: 'conflict' };
      }

      // Reconcile
      const newRecords = state.records.map(r => {
        if (batchIds.includes(r.id)) {
          return { ...r, status: 'ready' as ComponentStatus };
        }
        return r;
      });

      const newDerived = calculateDerived(newRecords, batchIds);

      return {
        records: newRecords,
        derived: newDerived,
        batchReconcilerState: 'resolved',
        selectedIds: new Set(),
        history: [...state.history, { records: state.records, batchReconcilerState: state.batchReconcilerState, derived: state.derived }]
      };
    });
  },

  resolveConflict: (resolution) => {
    set((state) => {
      if (state.batchReconcilerState !== 'conflict') return state;

      if (resolution === 'reject') {
        return { batchReconcilerState: 'selected' }; // go back
      } else {
        // Force reconcile
        const batchIds = Array.from(state.selectedIds);
        const newRecords = state.records.map(r => {
          if (batchIds.includes(r.id)) {
            return { ...r, status: 'ready' as ComponentStatus };
          }
          return r;
        });

        const newDerived = calculateDerived(newRecords, batchIds);
        return {
          records: newRecords,
          derived: newDerived,
          batchReconcilerState: 'resolved',
          selectedIds: new Set(),
          history: [...state.history, { records: state.records, batchReconcilerState: state.batchReconcilerState, derived: state.derived }]
        };
      }
    });
  },

  undo: () => {
    set((state) => {
      if (state.history.length === 0) return state;
      const previousState = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);
      return {
        ...previousState,
        history: newHistory,
        selectedIds: new Set()
      };
    });
  },

  importSession: (session) => {
    if (!session || typeof session !== 'object' || session.schemaVersion !== 'v1') return;

    // validate required structure and boundaries
    if (!Array.isArray(session.records) || !session.derived || typeof session.derived.totalIntensity !== 'number') return;

    const validRecords = [];
    const ids = new Set();

    for (const r of session.records) {
      if (ids.has(r.id) || !r.id || !r.name || typeof r.intensity !== 'number' || r.intensity < 1 || r.intensity > 10) return;
      ids.add(r.id);
      validRecords.push(r);
    }

    // Regenerate exportedAt for a new session
    const regeneratedSession = {
      ...session,
      exportedAt: new Date().toISOString()
    };

    set({
      records: validRecords,
      derived: regeneratedSession.derived,
      history: Array.isArray(regeneratedSession.history) ? regeneratedSession.history : [],
      batchReconcilerState: 'idle',
      selectedIds: new Set()
    });
  },

  clearSession: () => {
    set({
      records: [],
      derived: { totalIntensity: 0, count: 0, readyCount: 0, batchIds: [] },
      history: [],
      batchReconcilerState: 'idle',
      selectedIds: new Set()
    });
  }

}));
