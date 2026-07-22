import { create } from 'zustand';

// Domain models
export const STATUSES = ['empty', 'draft', 'ready', 'changed', 'archived'];

export const createInitialRecord = () => ({
  id: crypto.randomUUID(),
  title: '',
  caption: '',
  date: new Date().toISOString().split('T')[0],
  status: 'empty',
  forecastRibbonState: 0, // offset or delta
});

const validateRecord = (record) => {
  if (!record.id) return false;
  if (!STATUSES.includes(record.status)) return false;
  // numeric/date bounds validation could go here
  if (record.forecastRibbonState < -100 || record.forecastRibbonState > 100) return false;
  return true;
};

// Seed 100+ items as required
const generateSeed = () => {
  const records = [];
  for (let i = 0; i < 110; i++) {
    records.push({
      id: crypto.randomUUID(),
      title: `Sequence Item ${i + 1}`,
      caption: `Caption for item ${i + 1}`,
      date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      status: i % 5 === 0 ? 'draft' : i % 5 === 1 ? 'ready' : i % 5 === 2 ? 'changed' : i % 5 === 3 ? 'archived' : 'empty',
      forecastRibbonState: 0,
    });
  }
  return records;
};

const defaultRecords = generateSeed();

export const useStore = create((set, get) => ({
  records: defaultRecords,
  history: [], // For undo
  historyPointer: -1,

  // Derived state summary
  getSummary: () => {
    const records = get().records;
    const stats = {
      total: records.length,
      empty: 0, draft: 0, ready: 0, changed: 0, archived: 0,
      totalForecastDelta: 0
    };
    records.forEach(r => {
      if (stats[r.status] !== undefined) stats[r.status]++;
      stats.totalForecastDelta += r.forecastRibbonState;
    });
    return stats;
  },

  addRecord: () => {
    set((state) => {
      const newRecords = [createInitialRecord(), ...state.records];
      return {
        records: newRecords,
        history: [...state.history.slice(0, state.historyPointer + 1), state.records],
        historyPointer: state.historyPointer + 1
      };
    });
  },

  updateRecord: (id, updates) => {
    let validationError = null;
    set((state) => {
      const newRecords = state.records.map(r => {
        if (r.id === id) {
          const updated = { ...r, ...updates };
          if (validateRecord(updated)) {
            return updated;
          } else {
            validationError = "Invalid record boundaries or values. Please ensure status is valid and forecast ribbon state is between -100 and 100. Restoring prior valid state.";
            return r;
          }
        }
        return r;
      });
      return {
        records: newRecords,
        validationError,
        history: [...state.history.slice(0, state.historyPointer + 1), state.records],
        historyPointer: state.historyPointer + 1
      };
    });
    return { error: validationError };
  },

  clearValidationError: () => set({ validationError: null }),

  deleteRecord: (id) => {
    set((state) => {
      const newRecords = state.records.filter(r => r.id !== id);
      return {
        records: newRecords,
        history: [...state.history.slice(0, state.historyPointer + 1), state.records],
        historyPointer: state.historyPointer + 1
      };
    });
  },

  undo: () => {
    set((state) => {
      if (state.historyPointer >= 0) {
        return {
          records: state.history[state.historyPointer],
          historyPointer: state.historyPointer - 1
        };
      }
      return state;
    });
  },

  exportArtifact: () => {
    const state = get();
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: state.getSummary(),
      history: state.history
    };
  },

  importArtifact: (data) => {
    try {
      if (data.schemaVersion !== 'v1') throw new Error("Invalid schema version");

      const uniqueIds = new Set();
      const validRecords = [];

      for (const r of data.records) {
        if (!validateRecord(r)) throw new Error("Invalid record found");
        if (uniqueIds.has(r.id)) throw new Error("Duplicate ID found");
        uniqueIds.add(r.id);
        validRecords.push(r);
      }

      set({
        records: validRecords,
        history: [],
        historyPointer: -1
      });
      return true;
    } catch (e) {
      console.error("Import failed:", e);
      return false; // Invalid import is a no-op
    }
  },

  clear: () => set({ records: [], history: [], historyPointer: -1 })
}));
