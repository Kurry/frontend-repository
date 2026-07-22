import { create } from 'zustand';

// Generate RFC3339 timestamp
const getTimestamp = () => new Date().toISOString();

const generateId = () => Math.random().toString(36).substr(2, 9);

const INITIAL_RECORDS = [
  { id: '1', title: 'Start of the Quest', status: 'ready', description: 'The heroes arrive at the tavern.', weaverState: null },
  { id: '2', title: 'Empty Room', status: 'draft', description: '', weaverState: null },
  { id: '3', title: 'Goblin Ambush', status: 'ready', description: 'A small band of goblins attacks!', weaverState: null },
  { id: '4', title: 'Dragon Encounter (Conflict)', status: 'archived', description: 'They face the dragon immediately.', weaverState: null }
];

export const useStore = create((set, get) => ({
  records: INITIAL_RECORDS,
  weaverState: { status: 'idle', selectedId: null, changes: {} },
  derived: { summary: 'Initial state' },
  history: [],
  undoStack: [],
  filterStatus: 'all',

  setFilterStatus: (status) => set({ filterStatus: status }),

  createRecord: (record) => set((state) => {
    const newRecord = { ...record, id: generateId(), status: 'draft', weaverState: null };
    return { records: [...state.records, newRecord] };
  }),

  editRecord: (id, updates) => set((state) => {
    return {
      records: state.records.map(r => r.id === id ? { ...r, ...updates } : r)
    };
  }),

  deleteRecord: (id) => set((state) => {
    return {
      records: state.records.filter(r => r.id !== id),
      weaverState: state.weaverState.selectedId === id ? { status: 'idle', selectedId: null, changes: {} } : state.weaverState
    };
  }),

  selectForWeaver: (id) => set((state) => {
    const record = state.records.find(r => r.id === id);
    if (!record) return state;
    return {
      weaverState: { status: 'selected', selectedId: id, changes: { ...record } },
      derived: { summary: `Selected: ${record.title}` }
    };
  }),

  updateWeaverChanges: (updates) => set((state) => {
    if (state.weaverState.status === 'idle') return state;
    return {
      weaverState: {
        ...state.weaverState,
        status: 'changed',
        changes: { ...state.weaverState.changes, ...updates }
      }
    };
  }),

  applyWeaverMutation: () => set((state) => {
    if (state.weaverState.status !== 'changed' && state.weaverState.status !== 'selected') return state;

    // Simulate conflict rejection logic based on empty title
    if (!state.weaverState.changes.title || state.weaverState.changes.title.trim() === '') {
       return { weaverState: { ...state.weaverState, status: 'conflict' } };
    }

    const currentState = {
      records: [...state.records],
      weaverState: { ...state.weaverState },
      derived: { ...state.derived },
      history: [...state.history]
    };

    const newRecords = state.records.map(r =>
      r.id === state.weaverState.selectedId ? { ...r, ...state.weaverState.changes, status: 'changed' } : r
    );

    const newHistoryEntry = { action: 'weaver_mutation', timestamp: getTimestamp(), recordId: state.weaverState.selectedId };

    return {
      records: newRecords,
      weaverState: { status: 'resolved', selectedId: state.weaverState.selectedId, changes: {} },
      derived: { summary: `Resolved: ${state.weaverState.changes.title}` },
      history: [...state.history, newHistoryEntry],
      undoStack: [...state.undoStack, currentState]
    };
  }),

  undo: () => set((state) => {
    if (state.undoStack.length === 0) return state;
    const previousState = state.undoStack[state.undoStack.length - 1];
    return {
      ...previousState,
      undoStack: state.undoStack.slice(0, -1)
    };
  }),

  exportSession: () => {
    const state = get();
    return {
      schemaVersion: 'scenario-builder-v1',
      exportedAt: getTimestamp(),
      records: state.records,
      derived: state.derived,
      history: state.history,
      weaverState: state.weaverState
    };
  },

  importSession: (sessionData) => set((state) => {
    try {
      if (sessionData.schemaVersion !== 'scenario-builder-v1') return state;
      // In a real app we'd validate the whole schema here
      return {
        records: sessionData.records || [],
        derived: sessionData.derived || { summary: '' },
        history: sessionData.history || [],
        weaverState: sessionData.weaverState || { status: 'idle', selectedId: null, changes: {} },
        undoStack: []
      };
    } catch (e) {
      return state;
    }
  }),

  clearSession: () => set({
    records: [],
    weaverState: { status: 'idle', selectedId: null, changes: {} },
    derived: { summary: 'Cleared' },
    history: [],
    undoStack: []
  })
}));
