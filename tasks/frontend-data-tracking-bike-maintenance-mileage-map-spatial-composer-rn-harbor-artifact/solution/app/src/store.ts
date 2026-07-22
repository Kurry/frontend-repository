import { create } from 'zustand';
import { BikeRecord, SpatialState, SessionArtifactSchema } from './types';

interface StoreState {
  records: BikeRecord[];
  spatialState: SpatialState[];
  history: { records: BikeRecord[]; spatialState: SpatialState[] }[];

  addRecord: (record: BikeRecord) => void;
  updateRecord: (id: string, updates: Partial<BikeRecord>) => void;
  deleteRecord: (id: string) => void;

  mutateSpatialComposer: (record_id: string, x: number, y: number) => void;
  undo: () => void;

  exportArtifact: () => string;
  importArtifact: (payload: string) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  records: [],
  spatialState: [],
  history: [],

  addRecord: (record) => set((state) => ({
    history: [...state.history, { records: state.records, spatialState: state.spatialState }],
    records: [...state.records, record],
  })),

  updateRecord: (id, updates) => set((state) => ({
    history: [...state.history, { records: state.records, spatialState: state.spatialState }],
    records: state.records.map((r) => r.id === id ? { ...r, ...updates } : r),
  })),

  deleteRecord: (id) => set((state) => ({
    history: [...state.history, { records: state.records, spatialState: state.spatialState }],
    records: state.records.filter((r) => r.id !== id),
    spatialState: state.spatialState.filter(s => s.record_id !== id)
  })),

  mutateSpatialComposer: (record_id, x, y) => set((state) => {
    const existingSpatial = state.spatialState.find(s => s.record_id === record_id);
    let newSpatialState = [...state.spatialState];
    if (existingSpatial) {
      newSpatialState = newSpatialState.map(s => s.record_id === record_id ? { ...s, x, y } : s);
    } else {
      newSpatialState.push({ record_id, x, y });
    }

    const newRecords = state.records.map(r => r.id === record_id ? { ...r, status: 'ready' as const } : r);

    return {
      history: [...state.history, { records: state.records, spatialState: state.spatialState }],
      records: newRecords,
      spatialState: newSpatialState
    };
  }),

  undo: () => set((state) => {
    if (state.history.length === 0) return state;
    const previous = state.history[state.history.length - 1];
    return {
      records: previous.records,
      spatialState: previous.spatialState,
      history: state.history.slice(0, -1),
    };
  }),

  exportArtifact: () => {
    const { records, spatialState, history } = get();
    const capacity_used = spatialState.length;
    const capacity_total = 10; // arbitrary max
    const payload = {
      schemaVersion: 'v1' as const,
      exportedAt: new Date().toISOString(),
      records,
      spatialState,
      derived: { capacity_used, capacity_total },
      history,
    };
    return JSON.stringify(payload, null, 2);
  },

  importArtifact: (payload: string) => {
    try {
      const parsed = JSON.parse(payload);
      const validated = SessionArtifactSchema.parse(parsed);
      set({
        records: validated.records,
        spatialState: validated.spatialState,
        history: validated.history,
      });
    } catch (e) {
      console.error("Invalid import artifact", e);
      // No-op on invalid import
    }
  }
}));
