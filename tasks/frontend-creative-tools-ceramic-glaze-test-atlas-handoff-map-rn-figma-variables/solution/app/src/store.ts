import { create } from 'zustand';

export type GlazeStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';
export type OwnerType = 'none' | 'studio-lead' | 'technician' | 'chemist';
export type ReadinessType = 'none' | 'ready' | 'changed';

export interface GlazeTest {
  id: string;
  name: string;
  status: GlazeStatus;
  owner: OwnerType;
  readiness: ReadinessType;
  baseColor: string;
  notes: string;
}

export interface AtlasState {
  records: GlazeTest[];
  history: { records: GlazeTest[]; timestamp: number }[];
  selectedId: string | null;
  schemaVersion: 'v1';
  exportedAt?: string;

  // Actions
  addRecord: (record: Omit<GlazeTest, 'id'>) => void;
  updateRecord: (id: string, updates: Partial<GlazeTest>) => void;
  deleteRecord: (id: string) => void;
  selectRecord: (id: string | null) => void;
  mutateHandoff: (id: string, owner: OwnerType, readiness: ReadinessType) => void;
  undo: () => void;
  importAtlas: (data: any) => void;
  clearAtlas: () => void;
  seed: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const INITIAL_RECORDS: GlazeTest[] = Array.from({ length: 110 }).map((_, i) => {
  let status: GlazeStatus = 'draft';
  let owner: OwnerType = 'none';
  let readiness: ReadinessType = 'none';

  if (i < 10) {
    status = 'ready';
    owner = 'chemist';
    readiness = 'ready';
  } else if (i < 20) {
    status = 'changed';
    owner = 'technician';
    readiness = 'changed';
  } else if (i < 30) {
    status = 'empty';
  } else if (i < 40) {
    status = 'archived';
  }

  return {
    id: `test-${i}`,
    name: `Glaze Test ${i}`,
    status,
    owner,
    readiness,
    baseColor: ['#FCA5A5', '#93C5FD', '#86EFAC', '#FDE047', '#D8B4FE'][i % 5],
    notes: `Notes for test ${i}`,
  };
});

export const useStore = create<AtlasState>((set, get) => ({
  records: INITIAL_RECORDS,
  history: [],
  selectedId: null,
  schemaVersion: 'v1',

  seed: () => {
    set({ records: INITIAL_RECORDS, history: [], selectedId: null });
  },

  addRecord: (record) => {
    set((state) => {
      const newRecords = [...state.records, { ...record, id: generateId() }];
      return {
        records: newRecords,
        history: [...state.history, { records: state.records, timestamp: Date.now() }],
      };
    });
  },

  updateRecord: (id, updates) => {
    set((state) => {
      const newRecords = state.records.map((r) => (r.id === id ? { ...r, ...updates } : r));
      return {
        records: newRecords,
        history: [...state.history, { records: state.records, timestamp: Date.now() }],
      };
    });
  },

  deleteRecord: (id) => {
    set((state) => {
      const newRecords = state.records.filter((r) => r.id !== id);
      return {
        records: newRecords,
        selectedId: state.selectedId === id ? null : state.selectedId,
        history: [...state.history, { records: state.records, timestamp: Date.now() }],
      };
    });
  },

  selectRecord: (id) => {
    set({ selectedId: id });
  },

  mutateHandoff: (id, owner, readiness) => {
    set((state) => {
      let status: GlazeStatus = 'draft';
      if (readiness === 'ready') status = 'ready';
      else if (readiness === 'changed') status = 'changed';

      const newRecords = state.records.map((r) =>
        r.id === id ? { ...r, owner, readiness, status } : r
      );

      return {
        records: newRecords,
        history: [...state.history, { records: state.records, timestamp: Date.now() }],
      };
    });
  },

  undo: () => {
    set((state) => {
      if (state.history.length === 0) return state;
      const prev = state.history[state.history.length - 1];
      return {
        records: prev.records,
        history: state.history.slice(0, -1),
      };
    });
  },

  importAtlas: (data) => {
    if (data?.schemaVersion !== 'v1' || !Array.isArray(data?.records)) return; // Invalid import is a no-op
    set({
      records: data.records,
      history: [],
      selectedId: null,
      schemaVersion: 'v1',
      exportedAt: data.exportedAt,
    });
  },

  clearAtlas: () => {
    set({
      records: [],
      history: [],
      selectedId: null,
    });
  },
}));
