import { create } from 'zustand'

const INITIAL_RECORDS = [
  { id: 'blk-1', name: 'Log Cabin', status: 'ready', dimensions: '12x12' },
  { id: 'blk-2', name: 'Flying Geese', status: 'draft', dimensions: '8x8' },
  { id: 'blk-3', name: 'Ohio Star', status: 'conflict', dimensions: '10x10' },
  { id: 'blk-4', name: 'Double Irish Chain', status: 'archived', dimensions: '16x16' }
];

export const useStore = create((set, get) => ({
  records: INITIAL_RECORDS,
  history: [],
  recoveryBoardSelection: null,
  derivedSummary: {
    total: 4,
    ready: 1,
    draft: 1,
    conflict: 1,
    archived: 1,
  },

  _recalculateSummary: (records) => {
    return records.reduce((acc, curr) => {
      acc.total += 1;
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, { total: 0, ready: 0, draft: 0, conflict: 0, archived: 0 });
  },

  _pushHistory: (state) => {
    return {
      history: [...state.history, {
        records: JSON.parse(JSON.stringify(state.records)),
        recoveryBoardSelection: state.recoveryBoardSelection,
        derivedSummary: JSON.parse(JSON.stringify(state.derivedSummary)),
      }]
    };
  },

  createRecord: (record) => set((state) => {
    const newRecords = [...state.records, { ...record, id: `blk-${Date.now()}` }];
    return {
      ...state._pushHistory(state),
      records: newRecords,
      derivedSummary: state._recalculateSummary(newRecords)
    }
  }),

  updateRecord: (id, updates) => set((state) => {
    const newRecords = state.records.map(r => r.id === id ? { ...r, ...updates } : r);
    return {
      ...state._pushHistory(state),
      records: newRecords,
      derivedSummary: state._recalculateSummary(newRecords)
    }
  }),

  deleteRecord: (id) => set((state) => {
    const newRecords = state.records.filter(r => r.id !== id);
    return {
      ...state._pushHistory(state),
      records: newRecords,
      derivedSummary: state._recalculateSummary(newRecords),
      recoveryBoardSelection: state.recoveryBoardSelection === id ? null : state.recoveryBoardSelection
    }
  }),

  selectRecoveryRecord: (id) => set({ recoveryBoardSelection: id }),

  mutateRecoveryRecord: (id, newStatus) => set((state) => {
    const record = state.records.find(r => r.id === id);
    if (!record || record.status !== 'conflict') return state; // Only conflict records can be recovered

    if (!['ready', 'draft', 'changed'].includes(newStatus)) return state; // bounds check

    const newRecords = state.records.map(r => r.id === id ? { ...r, status: newStatus } : r);
    return {
      ...state._pushHistory(state),
      records: newRecords,
      derivedSummary: state._recalculateSummary(newRecords),
      recoveryBoardSelection: null
    }
  }),

  undo: () => set((state) => {
    if (state.history.length === 0) return state;
    const prev = state.history[state.history.length - 1];
    return {
      records: prev.records,
      recoveryBoardSelection: prev.recoveryBoardSelection,
      derivedSummary: prev.derivedSummary,
      history: state.history.slice(0, -1)
    }
  }),

  importState: (newState) => set(() => {
    return {
      records: newState.records,
      derivedSummary: newState.derived,
      history: newState.history,
      recoveryBoardSelection: null
    }
  })
}));
