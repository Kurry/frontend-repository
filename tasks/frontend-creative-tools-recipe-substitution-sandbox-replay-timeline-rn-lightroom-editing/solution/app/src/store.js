import { create } from 'zustand';

// Generate short IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

const INITIAL_RECORDS = [
  { id: '1', status: 'ready', timelineState: 'resolved', quantity: '1 cup', substitution: 'Almond Flour', name: 'Flour substitution' },
  { id: '2', status: 'draft', timelineState: 'idle', quantity: '2 tbsp', substitution: 'Coconut Oil', name: 'Butter substitute' },
  { id: '3', status: 'changed', timelineState: 'conflict', quantity: '1/2 cup', substitution: 'Applesauce', name: 'Egg replacer' }
];

export const useStore = create((set, get) => ({
  records: INITIAL_RECORDS,
  history: [], // Stack of { records } states for global undo, or can be per-record? Let's do global for simplicity but the prompt says "scrub a selected record through its timeline and restore a prior checkpoint", which sounds like a per-record history or a global history filtered. "Undo the last mutation" "scrub a selected record through its timeline". Let's do per-record history or a global history.
  // We'll store a global history array where each entry represents a checkpoint of a record mutation.

  selectedRecordId: null,

  // Selection
  selectRecord: (id) => set({ selectedRecordId: id }),

  // CRUD
  addRecord: (record) => set((state) => {
    const newRecord = { ...record, id: generateId(), timelineState: 'idle' };
    return { records: [...state.records, newRecord] };
  }),

  updateRecord: (id, updates) => set((state) => {
    const updatedRecords = state.records.map(r =>
      r.id === id ? { ...r, ...updates } : r
    );
    return { records: updatedRecords };
  }),

  deleteRecord: (id) => set((state) => ({
    records: state.records.filter(r => r.id !== id),
    selectedRecordId: state.selectedRecordId === id ? null : state.selectedRecordId
  })),

  // Replay timeline logic: Mutation with history
  // The signature interaction: scrub a selected record through its timeline and restore a prior checkpoint
  // We need to keep a history of edits for a record.
  recordHistories: {}, // { recordId: [ { timestamp, state: { status, quantity, substitution, timelineState, ... } } ] }

  mutateRecordWithHistory: (id, updates) => set((state) => {
    const record = state.records.find(r => r.id === id);
    if (!record) return state;

    const currentHistory = state.recordHistories[id] || [{ timestamp: Date.now() - 1000, state: { ...record } }];
    const newRecord = { ...record, ...updates };

    return {
      records: state.records.map(r => r.id === id ? newRecord : r),
      recordHistories: {
        ...state.recordHistories,
        [id]: [...currentHistory, { timestamp: Date.now(), state: { ...newRecord } }]
      }
    };
  }),

  restoreCheckpoint: (id, historyIndex) => set((state) => {
    const history = state.recordHistories[id];
    if (!history || !history[historyIndex]) return state;

    const checkpoint = history[historyIndex].state;
    // When restoring, we might want to truncate the future history or keep it. Let's truncate.
    const newHistory = history.slice(0, historyIndex + 1);

    return {
      records: state.records.map(r => r.id === id ? { ...r, ...checkpoint, timelineState: 'resolved' } : r),
      recordHistories: {
        ...state.recordHistories,
        [id]: newHistory
      }
    };
  }),

  globalUndo: () => set((state) => {
    // Basic global undo: find the last mutated record and pop its history.
    // For simplicity, we can just look at the most recent timestamp in all histories.
    let mostRecentRecordId = null;
    let mostRecentTime = 0;

    Object.keys(state.recordHistories).forEach(id => {
      const hist = state.recordHistories[id];
      if (hist && hist.length > 1) {
        const lastEntry = hist[hist.length - 1];
        if (lastEntry.timestamp > mostRecentTime) {
          mostRecentTime = lastEntry.timestamp;
          mostRecentRecordId = id;
        }
      }
    });

    if (mostRecentRecordId) {
      const history = state.recordHistories[mostRecentRecordId];
      const previousState = history[history.length - 2].state;
      return {
        records: state.records.map(r => r.id === mostRecentRecordId ? { ...previousState, timelineState: 'resolved' } : r),
        recordHistories: {
          ...state.recordHistories,
          [mostRecentRecordId]: history.slice(0, history.length - 1)
        }
      };
    }
    return state;
  }),

  // Artifact Transfer
  exportArtifact: () => {
    const state = get();
    const artifact = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: {
        summary: `Total records: ${state.records.length}`
      },
      history: Object.entries(state.recordHistories).map(([id, hist]) => ({ id, entries: hist }))
    };
    return JSON.stringify(artifact, null, 2);
  },

  importArtifact: (jsonString) => set((state) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.schemaVersion !== 'v1' || !Array.isArray(parsed.records)) {
        console.error("Invalid schema version or missing records");
        return state;
      }

      const newHistories = {};
      if (parsed.history && Array.isArray(parsed.history)) {
        parsed.history.forEach(h => {
          if (h.id && h.entries) {
            newHistories[h.id] = h.entries;
          }
        });
      }

      return {
        records: parsed.records,
        recordHistories: newHistories,
        selectedRecordId: null
      };
    } catch (e) {
      console.error("Failed to parse artifact", e);
      return state;
    }
  }),

  clearData: () => set({ records: [], recordHistories: {}, selectedRecordId: null })
}));
