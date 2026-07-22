import { create } from 'zustand';

const initialRecords = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Log Cabin', owner: 'Alice', readiness: 10, status: 'draft' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Nine Patch', owner: 'Bob', readiness: 50, status: 'changed' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Flying Geese', owner: 'Alice', readiness: 100, status: 'ready' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Ohio Star', owner: 'Charlie', readiness: 0, status: 'empty' },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Bear Paw', owner: 'Bob', readiness: 25, status: 'archived' },
];

const computeDerived = (records) => {
  const summary = {};
  records.forEach((r) => {
    summary[r.status] = (summary[r.status] || 0) + 1;
  });
  return { summary };
};

export const useStore = create((set, get) => ({
  records: initialRecords,
  derived: computeDerived(initialRecords),
  history: [],
  selectedId: null,
  undoStack: [],

  selectRecord: (id) => set({ selectedId: id }),

  addRecord: (record) => set((state) => {
    const newRecords = [...state.records, record];
    const newDerived = computeDerived(newRecords);
    const newHistory = [...state.history, { type: 'add', record }];
    return {
      records: newRecords,
      derived: newDerived,
      history: newHistory,
      undoStack: [...state.undoStack, state],
    };
  }),

  updateRecord: (id, updates) => set((state) => {
    const newRecords = state.records.map((r) => (r.id === id ? { ...r, ...updates } : r));
    const newDerived = computeDerived(newRecords);
    const newHistory = [...state.history, { type: 'update', id, updates }];
    return {
      records: newRecords,
      derived: newDerived,
      history: newHistory,
      undoStack: [...state.undoStack, state],
    };
  }),

  deleteRecord: (id) => set((state) => {
    const newRecords = state.records.filter((r) => r.id !== id);
    const newDerived = computeDerived(newRecords);
    const newHistory = [...state.history, { type: 'delete', id }];
    return {
      records: newRecords,
      derived: newDerived,
      history: newHistory,
      selectedId: state.selectedId === id ? null : state.selectedId,
      undoStack: [...state.undoStack, state],
    };
  }),

  undo: () => set((state) => {
    if (state.undoStack.length === 0) return state;
    const previousState = state.undoStack[state.undoStack.length - 1];
    return {
      ...previousState,
      undoStack: state.undoStack.slice(0, -1),
    };
  }),

  setFullState: (newState) => set((state) => ({
    records: newState.records,
    derived: newState.derived,
    history: newState.history,
    selectedId: null,
    undoStack: [...state.undoStack, state],
  })),

  clearAll: () => set((state) => ({
    records: [],
    derived: { summary: {} },
    history: [],
    selectedId: null,
    undoStack: [...state.undoStack, state],
  }))
}));
