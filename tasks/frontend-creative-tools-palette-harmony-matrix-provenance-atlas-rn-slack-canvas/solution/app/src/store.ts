import { create } from 'zustand';
import { z } from 'zod';

// --- Domain Schema ---
export const ColorRecordSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  status: z.enum(['empty', 'draft', 'ready', 'changed', 'archived']),
  colorValue: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  evidence: z.string(),
  lineage: z.enum(['good', 'bad']),
});

export type ColorRecord = z.infer<typeof ColorRecordSchema>;

export const SessionSchema = z.object({
  schemaVersion: z.literal('palette-harmony-v1'),
  exportedAt: z.string(),
  records: z.array(ColorRecordSchema),
  derived: z.object({
    total: z.number(),
    readyCount: z.number(),
    badLineageCount: z.number(),
  }),
  history: z.array(
    z.object({
      action: z.string(),
      records: z.array(ColorRecordSchema),
    })
  ),
});

export type Session = z.infer<typeof SessionSchema>;

// --- Seed Data ---
const generateSeedData = (): ColorRecord[] => {
  const records: ColorRecord[] = [];
  const statuses: ColorRecord['status'][] = ['empty', 'draft', 'ready', 'changed', 'archived'];
  const lineages: ColorRecord['lineage'][] = ['good', 'bad'];

  for (let i = 1; i <= 120; i++) {
    records.push({
      id: `color-${i}`,
      name: `Color ${i}`,
      status: statuses[i % statuses.length],
      colorValue: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
      evidence: `Source artifact evidence for color ${i}`,
      lineage: lineages[i % lineages.length],
    });
  }
  return records;
};

const initialRecords = generateSeedData();

// --- Store Types ---
export interface AppState {
  records: ColorRecord[];
  history: { action: string; records: ColorRecord[] }[];
  selectedRecordId: string | null;
  filterStatus: ColorRecord['status'] | 'all';

  // Computed Derived State
  derived: Session['derived'];

  // Actions
  createRecord: (record: Omit<ColorRecord, 'id'>) => void;
  updateRecord: (id: string, updates: Partial<ColorRecord>) => void;
  deleteRecord: (id: string) => void;
  selectRecord: (id: string | null) => void;
  setFilterStatus: (status: ColorRecord['status'] | 'all') => void;

  // Signature Interaction
  quarantineLineage: (id: string) => void;
  undo: () => void;

  // Artifact Transfer
  importSession: (session: Session) => void;
  exportSession: () => Session;
}

// Helper to compute derived state
const computeDerived = (records: ColorRecord[]) => ({
  total: records.length,
  readyCount: records.filter(r => r.status === 'ready').length,
  badLineageCount: records.filter(r => r.lineage === 'bad').length,
});

export const useStore = create<AppState>((set, get) => ({
  records: initialRecords,
  history: [],
  selectedRecordId: null,
  filterStatus: 'all',
  derived: computeDerived(initialRecords),

  createRecord: (recordData) => {
    set((state) => {
      const newRecord: ColorRecord = { ...recordData, id: `color-${Date.now()}` };
      const newRecords = [...state.records, newRecord];
      return {
        records: newRecords,
        derived: computeDerived(newRecords),
        history: [...state.history, { action: 'create', records: state.records }],
      };
    });
  },

  updateRecord: (id, updates) => {
    set((state) => {
      const newRecords = state.records.map(r => r.id === id ? { ...r, ...updates } : r);
      return {
        records: newRecords,
        derived: computeDerived(newRecords),
        history: [...state.history, { action: 'update', records: state.records }],
      };
    });
  },

  deleteRecord: (id) => {
    set((state) => {
      const newRecords = state.records.filter(r => r.id !== id);
      return {
        records: newRecords,
        derived: computeDerived(newRecords),
        history: [...state.history, { action: 'delete', records: state.records }],
        selectedRecordId: state.selectedRecordId === id ? null : state.selectedRecordId
      };
    });
  },

  selectRecord: (id) => set({ selectedRecordId: id }),
  setFilterStatus: (status) => set({ filterStatus: status }),

  quarantineLineage: (id) => {
    set((state) => {
      const newRecords = state.records.map(r => {
        if (r.id === id) {
          // Signature mutation: update lineage to 'bad' and status to 'changed'
          return { ...r, lineage: 'bad' as const, status: 'changed' as const };
        }
        return r;
      });
      return {
        records: newRecords,
        derived: computeDerived(newRecords),
        history: [...state.history, { action: 'quarantine', records: state.records }],
      };
    });
  },

  undo: () => {
    set((state) => {
      if (state.history.length === 0) return state;
      const lastState = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);
      return {
        records: lastState.records,
        derived: computeDerived(lastState.records),
        history: newHistory,
        // Optional: Keep selection intact if possible, else clear
      };
    });
  },

  importSession: (session) => {
    set({
      records: session.records,
      history: session.history,
      derived: computeDerived(session.records),
      selectedRecordId: null,
      filterStatus: 'all'
    });
  },

  exportSession: () => {
    const state = get();
    return {
      schemaVersion: 'palette-harmony-v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: state.derived,
      history: state.history
    };
  }
}));
