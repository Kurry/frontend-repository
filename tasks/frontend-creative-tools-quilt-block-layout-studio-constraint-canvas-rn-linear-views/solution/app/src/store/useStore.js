import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { QuiltBlockSchema, SessionSchema } from '../utils/schema';
import { formatRFC3339 } from 'date-fns';

const generateSeedData = () => {
  const data = [];
  const statuses = ['draft', 'ready', 'changed', 'conflict', 'resolved', 'archived'];
  for (let i = 0; i < 120; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    data.push({
      id: `seed-block-${i}`,
      status,
      blockName: `Quilt Block ${i}`,
      size: Math.floor(Math.random() * 50) + 10,
      conflict: status === 'conflict',
    });
  }
  return data;
};

const calculateDerived = (records) => {
  return {
    summary: `Total blocks: ${records.length}`,
    totalDrafts: records.filter((r) => r.status === 'draft').length,
    totalReady: records.filter((r) => r.status === 'ready').length,
    totalChanged: records.filter((r) => r.status === 'changed').length,
    totalConflicts: records.filter((r) => r.status === 'conflict').length,
    totalResolved: records.filter((r) => r.status === 'resolved').length,
    totalArchived: records.filter((r) => r.status === 'archived').length,
  };
};

export const useStore = create((set, get) => ({
  records: generateSeedData(),
  history: [],
  selectedRecordId: null,
  activeFilter: null,

  createRecord: (record) => {
    set((state) => {
      const newRecord = { ...record, id: record.id || uuidv4() };
      const newRecords = [...state.records, newRecord];
      return {
        records: newRecords,
        history: [...state.history, state.records],
      };
    });
  },

  updateRecord: (id, updates) => {
    set((state) => {
      const newRecords = state.records.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      );
      return {
        records: newRecords,
        history: [...state.history, state.records],
      };
    });
  },

  deleteRecord: (id) => {
    set((state) => {
      const newRecords = state.records.filter((r) => r.id !== id);
      return {
        records: newRecords,
        history: [...state.history, state.records],
        selectedRecordId: state.selectedRecordId === id ? null : state.selectedRecordId,
      };
    });
  },

  setFilter: (status) => set({ activeFilter: status }),

  setSelectedRecord: (id) => set({ selectedRecordId: id }),

  undo: () => {
    set((state) => {
      if (state.history.length === 0) return state;
      const prevRecords = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);
      return {
        records: prevRecords,
        history: newHistory,
      };
    });
  },

  clearState: () => {
    set({
      records: [],
      history: [],
      selectedRecordId: null,
      activeFilter: null,
    });
  },

  importSession: (sessionData) => {
    try {
      const parsed = SessionSchema.parse(sessionData);
      set({
        records: parsed.records,
        history: [], // History reset on import as per requirements
        selectedRecordId: null,
      });
      return true;
    } catch (e) {
      console.error('Import validation failed', e);
      return false;
    }
  },

  exportSession: () => {
    const state = get();
    return {
      schemaVersion: 'quilt-layout-v1',
      exportedAt: formatRFC3339(new Date()),
      records: state.records,
      derived: calculateDerived(state.records),
      history: [], // Omitting full history in export for brevity unless specifically required to be full objects
    };
  },

  getDerivedState: () => calculateDerived(get().records),
}));
