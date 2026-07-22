import { create } from 'zustand';
import { z } from 'zod';

export const RecipeIngredientSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  quantity: z.number().min(0, "Quantity must be non-negative"),
  unit: z.string(),
  status: z.enum(['empty', 'draft', 'ready', 'changed', 'archived', 'conflict', 'resolved']),
  handoffOwner: z.string().optional(),
  lastUpdated: z.string(),
});

export const ArtifactSchema = z.object({
  schemaVersion: z.literal('v1'),
  exportedAt: z.string(),
  records: z.array(RecipeIngredientSchema),
  derived: z.object({
    summary: z.object({
      total: z.number(),
      ready: z.number(),
      draft: z.number(),
      archived: z.number()
    }),
  }),
  history: z.array(z.any()), // keep it simple, storing state snapshots
});

const initialState = {
  records: [
    { id: '1', name: 'Flour', quantity: 500, unit: 'g', status: 'ready', handoffOwner: 'Baker', lastUpdated: new Date().toISOString() },
    { id: '2', name: 'Sugar', quantity: 200, unit: 'g', status: 'draft', lastUpdated: new Date().toISOString() },
    { id: '3', name: 'Salt', quantity: 10, unit: 'g', status: 'empty', lastUpdated: new Date().toISOString() },
  ],
  selectedRecordId: null,
  history: [],
};

export const useStore = create((set, get) => ({
  ...initialState,

  selectRecord: (id) => set({ selectedRecordId: id }),

  addRecord: (record) => set((state) => {
    const newState = {
      records: [...state.records, { ...record, id: Date.now().toString(), lastUpdated: new Date().toISOString() }]
    };
    return { ...newState, history: [...state.history, state] };
  }),

  updateRecord: (id, updates) => set((state) => {
    const newRecords = state.records.map(r => r.id === id ? { ...r, ...updates, lastUpdated: new Date().toISOString() } : r);
    return { records: newRecords, history: [...state.history, state] };
  }),

  deleteRecord: (id) => set((state) => {
    const newRecords = state.records.filter(r => r.id !== id);
    return { records: newRecords, selectedRecordId: state.selectedRecordId === id ? null : state.selectedRecordId, history: [...state.history, state] };
  }),

  archiveRecord: (id) => set((state) => {
    const newRecords = state.records.map(r => r.id === id ? { ...r, status: 'archived', lastUpdated: new Date().toISOString() } : r);
    return { records: newRecords, history: [...state.history, state] };
  }),

  // Canonical mutation: connect a selected record to a handoff owner and update readiness
  assignHandoffOwner: (id, owner) => set((state) => {
    const newRecords = state.records.map(r => {
      if (r.id === id) {
        return {
          ...r,
          handoffOwner: owner,
          status: owner ? 'ready' : 'draft',
          lastUpdated: new Date().toISOString()
        };
      }
      return r;
    });
    return { records: newRecords, history: [...state.history, state] };
  }),

  undo: () => set((state) => {
    if (state.history.length === 0) return state;
    const previousState = state.history[state.history.length - 1];
    return {
      ...previousState,
      history: state.history.slice(0, -1),
    };
  }),

  importData: (data) => {
    try {
      const parsed = ArtifactSchema.parse(data);
      set({
        records: parsed.records,
        history: parsed.history,
        selectedRecordId: null
      });
      return true;
    } catch (e) {
      console.error("Invalid import data", e);
      return false;
    }
  },

  clearData: () => set({ records: [], history: [], selectedRecordId: null }),

  getDerivedState: () => {
    const records = get().records;
    return {
      summary: {
        total: records.length,
        ready: records.filter(r => r.status === 'ready').length,
        draft: records.filter(r => r.status === 'draft').length,
        archived: records.filter(r => r.status === 'archived').length,
      }
    };
  },

  getArtifactData: () => {
    const state = get();
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: state.getDerivedState(),
      history: state.history,
    };
  }
}));
