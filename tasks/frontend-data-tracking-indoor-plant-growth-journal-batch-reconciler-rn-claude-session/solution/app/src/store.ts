import { create } from 'zustand';
import { z } from 'zod';

export const PlantObservationSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  status: z.enum(['draft', 'ready', 'changed', 'archived', 'resolved', 'conflict']),
  quantity: z.number().min(1, "Quantity must be at least 1").max(1000, "Quantity must be at most 1000"),
  type: z.enum(['seedling', 'cutting', 'mature']),
  notes: z.string().optional(),
});

export type PlantObservation = z.infer<typeof PlantObservationSchema>;

export const SessionSchema = z.object({
  schemaVersion: z.literal('v1'),
  exportedAt: z.string(),
  records: z.array(PlantObservationSchema),
  derived: z.object({
    summary: z.string()
  }),
  history: z.array(z.any()), // Basic representation for history
});

export type Session = z.infer<typeof SessionSchema>;

interface JournalState {
  records: PlantObservation[];
  history: PlantObservation[][];
  derived: {
    summary: string;
  };
  addRecord: (record: PlantObservation) => void;
  updateRecord: (id: string, record: Partial<PlantObservation>) => void;
  deleteRecord: (id: string) => void;
  batchReconcile: (ids: string[]) => void;
  undo: () => void;
  importSession: (session: Session) => void;
  clearSession: () => void;
}

export const useJournalStore = create<JournalState>((set) => ({
  records: [],
  history: [],
  derived: { summary: "0 records" },

  addRecord: (record) => set((state) => {
    const newRecords = [...state.records, record];
    return {
      records: newRecords,
      history: [...state.history, state.records],
      derived: { summary: `${newRecords.length} records` }
    };
  }),

  updateRecord: (id, recordUpdates) => set((state) => {
    const newRecords = state.records.map(r => r.id === id ? { ...r, ...recordUpdates } : r);
    return {
      records: newRecords,
      history: [...state.history, state.records],
      derived: { summary: `${newRecords.length} records` }
    };
  }),

  deleteRecord: (id) => set((state) => {
    const newRecords = state.records.filter(r => r.id !== id);
    return {
      records: newRecords,
      history: [...state.history, state.records],
      derived: { summary: `${newRecords.length} records` }
    };
  }),

  batchReconcile: (ids) => set((state) => {
    if (ids.length === 0) return state;
    const newRecords = state.records.map(r => {
      if (ids.includes(r.id)) {
         return { ...r, status: 'resolved' as const };
      }
      return r;
    });

    const aggregatedQuantity = state.records.filter(r => ids.includes(r.id)).reduce((sum, r) => sum + r.quantity, 0);

    return {
      records: newRecords,
      history: [...state.history, state.records],
      derived: { summary: `Reconciled ${ids.length} records. Total quantity: ${aggregatedQuantity}` }
    };
  }),

  undo: () => set((state) => {
    if (state.history.length === 0) return state;
    const previousRecords = state.history[state.history.length - 1];
    const newHistory = state.history.slice(0, -1);
    return {
      records: previousRecords,
      history: newHistory,
      derived: { summary: `${previousRecords.length} records` }
    };
  }),

  importSession: (session) => set(() => ({
     records: session.records,
     history: [],
     derived: session.derived
  })),

  clearSession: () => set(() => ({
    records: [],
    history: [],
    derived: { summary: "0 records" }
  }))
}));
