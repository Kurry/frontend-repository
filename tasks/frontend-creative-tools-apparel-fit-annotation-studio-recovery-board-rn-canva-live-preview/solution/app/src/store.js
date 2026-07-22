import { create } from 'zustand';

// Domain statuses: empty, draft, ready, changed, archived, conflict, resolved
export const STATUSES = ['empty', 'draft', 'ready', 'changed', 'archived', 'conflict', 'resolved'];

const initialRecords = Array.from({ length: 100 }, (_, i) => ({
  id: `record-${i + 1}`,
  title: `Annotation ${i + 1}`,
  status: i % 10 === 0 ? 'empty' : i % 7 === 0 ? 'conflict' : i % 5 === 0 ? 'ready' : 'draft',
  measurement: Math.floor(Math.random() * 50) + 10,
}));

export const useStore = create((set, get) => ({
  records: initialRecords,
  history: [], // For undo
  derived: {
    summary: '100 records loaded.',
  },

  // State Updates
  updateDerived: () => {
    set((state) => {
      const draftCount = state.records.filter((r) => r.status === 'draft').length;
      const conflictCount = state.records.filter((r) => r.status === 'conflict').length;
      return {
        derived: { summary: `${state.records.length} records. Drafts: ${draftCount}, Conflicts: ${conflictCount}` },
      };
    });
  },

  createRecord: (record) => {
    set((state) => ({
      history: [...state.history, { type: 'create', state: state.records }],
      records: [...state.records, record],
    }));
    get().updateDerived();
  },

  updateRecord: (id, updates) => {
    set((state) => ({
      history: [...state.history, { type: 'update', state: state.records }],
      records: state.records.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
    get().updateDerived();
  },

  deleteRecord: (id) => {
    set((state) => ({
      history: [...state.history, { type: 'delete', state: state.records }],
      records: state.records.filter((r) => r.id !== id),
    }));
    get().updateDerived();
  },

  undo: () => {
    set((state) => {
      if (state.history.length === 0) return state;
      const lastHistory = state.history[state.history.length - 1];
      return {
        records: lastHistory.state,
        history: state.history.slice(0, -1),
      };
    });
    get().updateDerived();
  },

  // Import / Export
  importSession: (session) => {
    set({
      records: session.records,
      history: session.history,
      derived: session.derived,
    });
  },
  clearSession: () => {
    set({
      records: [],
      history: [],
      derived: { summary: '0 records loaded.' },
    });
  },
}));

useStore.getState().updateDerived();
