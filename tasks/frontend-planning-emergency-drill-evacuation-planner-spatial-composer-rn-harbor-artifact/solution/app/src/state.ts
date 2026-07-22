import { create } from 'zustand';

export type CheckpointStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface DrillCheckpoint {
  id: string;
  name: string;
  capacity: number;
  status: CheckpointStatus;
}

export interface DerivedState {
  totalCapacity: number;
  totalCheckpoints: number;
}

export interface ComposerState {
  selectedRecordId: string | null;
  composerStatus: 'idle' | 'selected' | 'changed' | 'conflict' | 'resolved';
}

export interface AppState {
  records: DrillCheckpoint[];
  composer: ComposerState;
  history: DrillCheckpoint[][];
  addRecord: (record: Omit<DrillCheckpoint, 'id'>) => void;
  updateRecord: (id: string, updates: Partial<DrillCheckpoint>) => void;
  deleteRecord: (id: string) => void;
  selectRecord: (id: string | null) => void;
  mutateCapacity: (newCapacity: number) => void;
  undo: () => void;
  importSession: (session: EmergencyDrillEvacuationPlannerSession) => void;
  reset: () => void;
}

export interface EmergencyDrillEvacuationPlannerSession {
  schemaVersion: 'evacuation-drill-v1';
  exportedAt: string;
  records: DrillCheckpoint[];
  derived: DerivedState;
  history: DrillCheckpoint[][];
}

const initialRecords: DrillCheckpoint[] = [
  { id: '1', name: 'Alpha Point', capacity: 100, status: 'ready' },
  { id: '2', name: 'Beta Check', capacity: 50, status: 'draft' },
  { id: '3', name: 'Gamma Site', capacity: 250, status: 'changed' },
];

export const useAppStore = create<AppState>((set) => ({
  records: initialRecords,
  composer: {
    selectedRecordId: null,
    composerStatus: 'idle',
  },
  history: [],
  addRecord: (record) => set((state) => {
    const newRecord = { ...record, id: Math.random().toString(36).substring(7) };
    return {
      records: [...state.records, newRecord],
      history: [...state.history, state.records],
    };
  }),
  updateRecord: (id, updates) => set((state) => {
    return {
      records: state.records.map((r) => r.id === id ? { ...r, ...updates } : r),
      history: [...state.history, state.records],
    };
  }),
  deleteRecord: (id) => set((state) => {
    return {
      records: state.records.map((r) => r.id === id ? { ...r, status: 'archived' } : r),
      history: [...state.history, state.records],
      composer: state.composer.selectedRecordId === id ? { selectedRecordId: null, composerStatus: 'idle' } : state.composer
    };
  }),
  selectRecord: (id) => set(() => ({
    composer: {
      selectedRecordId: id,
      composerStatus: id ? 'selected' : 'idle',
    }
  })),
  mutateCapacity: (newCapacity) => set((state) => {
    const { selectedRecordId } = state.composer;
    if (!selectedRecordId) return state;

    if (newCapacity < 1 || newCapacity > 1000) {
      return {
        composer: { ...state.composer, composerStatus: 'conflict' }
      };
    }

    const nextRecords = state.records.map((r) =>
      r.id === selectedRecordId ? { ...r, capacity: newCapacity, status: 'changed' as CheckpointStatus } : r
    );

    return {
      records: nextRecords,
      history: [...state.history, state.records],
      composer: { ...state.composer, composerStatus: 'resolved' }
    };
  }),
  undo: () => set((state) => {
    if (state.history.length === 0) return state;
    const prevRecords = state.history[state.history.length - 1];
    const newHistory = state.history.slice(0, -1);

    const selectedRecordExists = prevRecords.find(r => r.id === state.composer.selectedRecordId);

    return {
      records: prevRecords,
      history: newHistory,
      composer: {
        ...state.composer,
        composerStatus: selectedRecordExists ? 'selected' : 'idle',
        selectedRecordId: selectedRecordExists ? state.composer.selectedRecordId : null
      }
    };
  }),
  importSession: (session) => set(() => ({
    records: session.records,
    history: session.history,
    composer: { selectedRecordId: null, composerStatus: 'idle' }
  })),
  reset: () => set(() => ({
    records: initialRecords,
    history: [],
    composer: { selectedRecordId: null, composerStatus: 'idle' }
  }))
}));

export const getDerivedState = (records: DrillCheckpoint[]): DerivedState => {
  return {
    totalCheckpoints: records.filter(r => r.status !== 'archived').length,
    totalCapacity: records.filter(r => r.status !== 'archived').reduce((acc, r) => acc + r.capacity, 0),
  };
};
