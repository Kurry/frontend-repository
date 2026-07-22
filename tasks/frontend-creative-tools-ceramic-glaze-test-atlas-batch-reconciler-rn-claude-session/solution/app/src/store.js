import { create } from 'zustand';

// Domain statuses: empty, draft, ready, changed, archived
const generateId = () => Math.random().toString(36).substr(2, 9);

const initialState = {
  schemaVersion: 'v1',
  exportedAt: new Date().toISOString(),
  records: [],
  derived: {
    summary: {
      totalTests: 0,
      totalBatches: 0,
      testsInBatches: 0
    }
  },
  history: []
};

export const useStore = create((set, get) => ({
  ...initialState,

  addHistory: (state) => {
    const { records, derived, schemaVersion, exportedAt } = state;
    return {
      history: [...state.history, {
        records: JSON.parse(JSON.stringify(records)),
        derived: JSON.parse(JSON.stringify(derived)),
        schemaVersion,
        exportedAt
      }]
    };
  },

  undo: () => set((state) => {
    if (state.history.length === 0) return {};
    const previousState = state.history[state.history.length - 1];
    return {
      ...previousState,
      history: state.history.slice(0, -1)
    };
  }),

  createRecord: (record) => set((state) => {
    const newRecord = { id: generateId(), status: 'draft', ...record };
    const nextState = { ...state, records: [...state.records, newRecord] };
    return { ...nextState, ...get().addHistory(state) };
  }),

  updateRecord: (id, updates) => set((state) => {
    const nextState = {
      ...state,
      records: state.records.map(r => r.id === id ? { ...r, ...updates, status: 'changed' } : r)
    };
    return { ...nextState, ...get().addHistory(state) };
  }),

  archiveRecord: (id) => set((state) => {
    const nextState = {
      ...state,
      records: state.records.map(r => r.id === id ? { ...r, status: 'archived' } : r)
    };
    return { ...nextState, ...get().addHistory(state) };
  }),

  reconcileBatch: (selectedIds, batchName) => set((state) => {
    const newBatchId = generateId();
    let batchTotal = 0;

    const updatedRecords = state.records.map(r => {
      if (selectedIds.includes(r.id)) {
        batchTotal += (Number(r.amount) || 0);
        return { ...r, batchId: newBatchId, status: 'ready' };
      }
      return r;
    });

    const newDerived = {
      summary: {
        totalTests: updatedRecords.length,
        totalBatches: state.derived.summary.totalBatches + 1,
        testsInBatches: updatedRecords.filter(r => r.batchId).length,
        latestBatchTotal: batchTotal,
        latestBatchName: batchName
      }
    };

    const nextState = {
      ...state,
      records: updatedRecords,
      derived: newDerived
    };

    return { ...nextState, ...get().addHistory(state) };
  }),

  importState: (newState) => set(() => {
    return {
      ...newState,
      exportedAt: new Date().toISOString()
    };
  }),

  clearState: () => set(() => ({ ...initialState }))
}));
