import { create } from 'zustand';
import { z } from 'zod';

// Define Domain schemas
export const RecordStatusSchema = z.enum(['empty', 'draft', 'ready', 'changed', 'archived']);
export type RecordStatus = z.infer<typeof RecordStatusSchema>;

export const HandoffOwnerSchema = z.enum(['unassigned', 'mechanic_a', 'mechanic_b', 'customer']);
export type HandoffOwner = z.infer<typeof HandoffOwnerSchema>;

export const BikeServiceRecordSchema = z.object({
  id: z.string().min(1),
  status: RecordStatusSchema,
  mileage: z.number().min(0).max(1000000), // Bounds validation
  notes: z.string(),
  owner: HandoffOwnerSchema,
  readiness: z.number().min(0).max(100),
});
export type BikeServiceRecord = z.infer<typeof BikeServiceRecordSchema>;

export const SessionSchema = z.object({
  schemaVersion: z.literal('task-specific-v1'),
  exportedAt: z.string().datetime(),
  records: z.array(BikeServiceRecordSchema),
  derived: z.object({
    totalReady: z.number(),
    averageMileage: z.number(),
  }),
  history: z.array(z.string()), // A simple log for artifacts
});
export type Session = z.infer<typeof SessionSchema>;

// Initial state seed
const initialRecords: BikeServiceRecord[] = [
  { id: 'rec_1', status: 'empty', mileage: 0, notes: '', owner: 'unassigned', readiness: 0 }, // empty state
  { id: 'rec_2', status: 'draft', mileage: 1500, notes: 'Needs new chain', owner: 'unassigned', readiness: 20 }, // boundary/valid
  { id: 'rec_3', status: 'ready', mileage: 8000, notes: 'Full tune-up completed', owner: 'mechanic_a', readiness: 100 }, // valid
  { id: 'rec_4', status: 'changed', mileage: 300, notes: 'Flat tire fixed', owner: 'unassigned', readiness: 80 }, // conflict state / intermediate
];

// Zustand Store State & Actions
interface AppState {
  records: BikeServiceRecord[];
  selectedRecordId: string | null;
  filterStatus: RecordStatus | 'all';
  history: BikeServiceRecord[][];
  actionHistory: string[];

  // Actions
  selectRecord: (id: string | null) => void;
  setFilter: (status: RecordStatus | 'all') => void;

  createRecord: (record: Omit<BikeServiceRecord, 'id'>) => void;
  updateRecord: (id: string, record: Partial<BikeServiceRecord>) => void;
  deleteRecord: (id: string) => void;

  // The signature interaction
  connectHandoffOwner: (id: string, owner: HandoffOwner, readiness: number) => void;

  // History
  undo: () => void;
  pushHistory: (actionLog: string) => void;

  // Import
  importSession: (sessionData: unknown) => { success: boolean; error?: string };
}

export const useStore = create<AppState>((set, get) => ({
  records: initialRecords,
  selectedRecordId: null,
  filterStatus: 'all',
  history: [],
  actionHistory: ['Initial load'],

  selectRecord: (id) => set({ selectedRecordId: id }),
  setFilter: (status) => set({ filterStatus: status }),

  pushHistory: (actionLog) => {
    const { records, history, actionHistory } = get();
    set({
      history: [...history, records],
      actionHistory: [...actionHistory, actionLog]
    });
  },

  createRecord: (record) => {
    const id = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newRecord: BikeServiceRecord = { ...record, id };
    get().pushHistory(`Created record ${id}`);
    set((state) => ({ records: [...state.records, newRecord] }));
  },

  updateRecord: (id, updates) => {
    get().pushHistory(`Updated record ${id}`);
    set((state) => ({
      records: state.records.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
  },

  deleteRecord: (id) => {
    get().pushHistory(`Deleted record ${id}`);
    set((state) => ({
      records: state.records.filter((r) => r.id !== id),
      selectedRecordId: state.selectedRecordId === id ? null : state.selectedRecordId,
    }));
  },

  connectHandoffOwner: (id, owner, readiness) => {
    const record = get().records.find((r) => r.id === id);
    if (!record) return;

    if (record.status === 'archived') {
      return;
    }

    get().pushHistory(`Connected record ${id} to owner ${owner} with readiness ${readiness}`);

    let newStatus = record.status;
    if (readiness === 100) newStatus = 'ready';
    else if (readiness > 0 && newStatus !== 'ready') newStatus = 'changed';

    set((state) => ({
      records: state.records.map((r) =>
        r.id === id ? { ...r, owner, readiness, status: newStatus } : r
      ),
    }));
  },

  undo: () => {
    set((state) => {
      if (state.history.length === 0) return state; // nothing to undo
      const previousRecords = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);
      const newActionHistory = state.actionHistory.slice(0, -1);

      const selectedExists = previousRecords.find(r => r.id === state.selectedRecordId);

      return {
        records: previousRecords,
        history: newHistory,
        actionHistory: newActionHistory,
        selectedRecordId: selectedExists ? state.selectedRecordId : null
      };
    });
  },

  importSession: (sessionData) => {
    try {
      const parsed = SessionSchema.parse(sessionData);

      const ids = new Set(parsed.records.map(r => r.id));
      if (ids.size !== parsed.records.length) {
        return { success: false, error: 'Duplicate IDs found in records.' };
      }

      set({
        records: parsed.records,
        history: [],
        actionHistory: parsed.history,
        selectedRecordId: null,
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Invalid session artifact structure or bounds.' };
    }
  },
}));

export const useFilteredRecords = () => {
  const records = useStore((state) => state.records);
  const filter = useStore((state) => state.filterStatus);
  if (filter === 'all') return records;
  return records.filter((r) => r.status === filter);
};

export const useDerivedSummary = () => {
  const records = useStore((state) => state.records);
  const totalReady = records.filter(r => r.status === 'ready').length;
  const averageMileage = records.length > 0 ? Math.round(records.reduce((sum, r) => sum + r.mileage, 0) / records.length) : 0;
  return { totalReady, averageMileage };
};
