import { create } from 'zustand';

// Generate a random ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Initial state builder
const buildInitialState = () => ({
  records: Array.from({ length: 110 }).map((_, i) => ({
    id: `seed-${i}`,
    name: `Ingredient ${i}`,
    amount: (i % 10) + 1,
    unit: 'g',
    status: i % 4 === 0 ? 'draft' : i % 4 === 1 ? 'ready' : i % 4 === 2 ? 'changed' : 'archived',
    spatialComposerState: {
      placed: false,
      x: 0,
      y: 0
    }
  })),
  history: [], // Past states
  future: [], // Future states for redo (optional, but good for robust undo)
  derived: { summary: "110 items (0 placed)" },
  exportError: null,
  importError: null
});

export const useStore = create((set, get) => ({
  ...buildInitialState(),

  // Save the current state to history before a mutation
  _saveHistory: () => {
    set((state) => {
      const currentState = {
        records: JSON.parse(JSON.stringify(state.records)),
        derived: JSON.parse(JSON.stringify(state.derived))
      };
      return {
        history: [...state.history, currentState],
        future: [] // Clear redo path
      };
    });
  },

  addRecord: (record) => {
    get()._saveHistory();
    set((state) => {
      const newRecords = [...state.records, { ...record, id: generateId(), spatialComposerState: { placed: false, x: 0, y: 0 } }];
      return { records: newRecords, derived: { summary: generateSummary(newRecords) } };
    });
  },

  updateRecord: (id, updates) => {
    get()._saveHistory();
    set((state) => {
      const newRecords = state.records.map(r => r.id === id ? { ...r, ...updates } : r);
      return { records: newRecords, derived: { summary: generateSummary(newRecords) } };
    });
  },

  deleteRecord: (id) => {
    get()._saveHistory();
    set((state) => {
      const newRecords = state.records.filter(r => r.id !== id);
      return { records: newRecords, derived: { summary: generateSummary(newRecords) } };
    });
  },

  // Canonical mutation: place a selected record in a spatial composer and rebalance capacity
  placeInSpatialComposer: (id, x, y) => {
    const state = get();
    const record = state.records.find(r => r.id === id);
    if (!record) return;

    get()._saveHistory();

    set((state) => {
      const newRecords = state.records.map(r => {
        if (r.id === id) {
          return {
            ...r,
            status: 'changed',
            spatialComposerState: { placed: true, x, y }
          };
        }
        return r;
      });
      return { records: newRecords, derived: { summary: generateSummary(newRecords) } };
    });
  },

  undo: () => {
    set((state) => {
      if (state.history.length === 0) return state;
      const previousState = state.history[state.history.length - 1];
      const currentState = {
        records: JSON.parse(JSON.stringify(state.records)),
        derived: JSON.parse(JSON.stringify(state.derived))
      };

      return {
        records: previousState.records,
        derived: previousState.derived,
        history: state.history.slice(0, -1),
        future: [currentState, ...state.future]
      };
    });
  },

  clearSession: () => {
    get()._saveHistory();
    set({
      records: [],
      derived: { summary: "0 items (0 placed)" }
    });
  },

  importSession: (sessionData) => {
    get()._saveHistory();
    set({
      records: sessionData.records,
      derived: sessionData.derived,
      history: sessionData.history,
      importError: null
    });
  },

  setImportError: (error) => {
    set({ importError: error });
  },

  // Get current state for export
  getExportData: () => {
    const state = get();
    return {
      schemaVersion: "recipe-substitution-v1",
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: state.derived,
      history: state.history
    };
  }
}));

function generateSummary(records) {
  const placedCount = records.filter(r => r.spatialComposerState?.placed).length;
  return `${records.length} items (${placedCount} placed)`;
}
