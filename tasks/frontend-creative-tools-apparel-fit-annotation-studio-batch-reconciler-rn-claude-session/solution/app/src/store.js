import { create } from 'zustand';

const initialRecords = [
  { id: '1', name: 'Neckline Trim', status: 'draft' },
  { id: '2', name: 'Sleeve Length', status: 'draft' },
  { id: '3', name: 'Shoulder Seam', status: 'ready' },
  { id: '4', name: 'Waist Band', status: 'draft' },
  { id: '5', name: 'Hem Detail', status: 'empty' },
];

export const useStore = create((set, get) => ({
  records: initialRecords,
  derived: {},
  history: [],
  selectedIds: new Set(),

  toggleSelection: (id) => set((state) => {
    const next = new Set(state.selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return { selectedIds: next };
  }),

  selectAll: () => set((state) => ({
    selectedIds: new Set(state.records.map(r => r.id))
  })),

  clearSelection: () => set({ selectedIds: new Set() }),

  groupAndReconcile: () => set((state) => {
    if (state.selectedIds.size === 0) return state;

    const previousRecords = [...state.records];
    const newRecords = state.records.map(r => {
      if (state.selectedIds.has(r.id)) {
        return { ...r, status: 'ready' };
      }
      return r;
    });

    return {
      history: [...state.history, { type: 'GROUP_BATCH', previousRecords }],
      records: newRecords,
      derived: { summary: `Reconciled ${state.selectedIds.size} records.` },
      selectedIds: new Set()
    };
  }),

  undo: () => set((state) => {
    if (state.history.length === 0) return state;
    const lastState = state.history[state.history.length - 1];
    return {
      records: lastState.previousRecords,
      history: state.history.slice(0, -1),
      derived: { summary: 'Undid last action.' }
    };
  }),

  addRecord: (record) => set((state) => ({
    records: [...state.records, record]
  })),

  updateRecord: (id, updates) => set((state) => ({
    records: state.records.map(r => r.id === id ? { ...r, ...updates } : r)
  })),

  deleteRecord: (id) => set((state) => ({
    records: state.records.filter(r => r.id !== id),
    selectedIds: new Set([...state.selectedIds].filter(sid => sid !== id))
  })),

  importData: (data) => set(() => {
    if (data?.schemaVersion !== 'v1' || !Array.isArray(data.records)) {
      return {};
    }
    return {
      records: data.records,
      derived: data.derived || {},
      history: data.history || [],
      selectedIds: new Set()
    };
  })
}));
