import { create } from 'zustand'

export type RecordStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface ServiceRecord {
  id: string;
  title: string;
  date: string;
  mileage: number;
  status: RecordStatus;
  lineageQuarantined?: boolean;
}

export interface ProvenanceAtlasState {
  selectedId: string | null;
  geometry: string;
}

export interface DerivedSummary {
  totalMileage: number;
  quarantinedCount: number;
}

export interface HistoryEvent {
  action: string;
  timestamp: string;
  details: any;
}

export interface SessionState {
  schemaVersion: 'bike-maintenance-v1';
  exportedAt: string;
  records: ServiceRecord[];
  provenanceAtlasState: ProvenanceAtlasState;
  derived: DerivedSummary;
  history: HistoryEvent[];
}

export interface AppState extends SessionState {
  past: SessionState[];
  filter: string;
  setFilter: (status: string) => void;
  createRecord: (record: Omit<ServiceRecord, 'id' | 'status'>) => void;
  updateRecord: (id: string, record: Partial<ServiceRecord>) => void;
  deleteRecord: (id: string) => void;
  selectRecord: (id: string | null) => void;
  traceAndQuarantine: () => void;
  undo: () => void;
  importSession: (session: SessionState) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const calculateDerived = (records: ServiceRecord[]): DerivedSummary => {
  return {
    totalMileage: records.reduce((acc, r) => acc + (r.mileage || 0), 0),
    quarantinedCount: records.filter((r) => r.lineageQuarantined).length,
  };
};

const getSeedRecords = (): ServiceRecord[] => {
  const records: ServiceRecord[] = [];

  // Explicitly seed different boundary and state types
  records.push({ id: 'seed-empty', title: 'Empty State Record', date: '2023-01-01', mileage: 0, status: 'empty' });
  records.push({ id: 'seed-draft', title: 'Draft Record', date: '2023-01-02', mileage: 10, status: 'draft' });
  records.push({ id: 'seed-ready', title: 'Ready Record', date: '2023-01-03', mileage: 100, status: 'ready' });
  records.push({ id: 'seed-changed', title: 'Changed Record', date: '2023-01-04', mileage: 200, status: 'changed' });
  records.push({ id: 'seed-conflict', title: 'Conflict Record', date: '2023-01-05', mileage: 500, status: 'changed', lineageQuarantined: true });

  for (let i = 6; i <= 100; i++) {
    records.push({
      id: `seed-${i}`,
      title: `Service #${i}`,
      date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      mileage: 100 * i,
      status: i % 5 === 0 ? 'archived' : i % 3 === 0 ? 'draft' : 'ready',
    });
  }
  return records;
};

const initialState: SessionState = {
  schemaVersion: 'bike-maintenance-v1',
  exportedAt: new Date().toISOString(),
  records: getSeedRecords(),
  provenanceAtlasState: {
    selectedId: null,
    geometry: 'split',
  },
  derived: calculateDerived(getSeedRecords()),
  history: [],
};

export const useStore = create<AppState>((set) => ({
  ...initialState,
  past: [],
  filter: 'all',

  setFilter: (status) => set({ filter: status }),

  createRecord: (record) => {
    set((state) => {
      const newRecord: ServiceRecord = { ...record, id: generateId(), status: 'draft' };
      const newRecords = [newRecord, ...state.records];
      const newState: SessionState = {
        ...state,
        records: newRecords,
        derived: calculateDerived(newRecords),
        history: [...state.history, { action: 'create', timestamp: new Date().toISOString(), details: { id: newRecord.id } }]
      };
      return { ...newState, past: [...state.past, { ...state, past: undefined } as any] };
    });
  },

  updateRecord: (id, updates) => {
    set((state) => {
      const newRecords = state.records.map((r) => (r.id === id ? { ...r, ...updates, status: 'changed' as RecordStatus } : r));
      const newState: SessionState = {
        ...state,
        records: newRecords,
        derived: calculateDerived(newRecords),
        history: [...state.history, { action: 'update', timestamp: new Date().toISOString(), details: { id, updates } }]
      };
      return { ...newState, past: [...state.past, { ...state, past: undefined } as any] };
    });
  },

  deleteRecord: (id) => {
    set((state) => {
      const newRecords = state.records.filter((r) => r.id !== id);
      const newState: SessionState = {
        ...state,
        records: newRecords,
        derived: calculateDerived(newRecords),
        history: [...state.history, { action: 'delete', timestamp: new Date().toISOString(), details: { id } }]
      };
      return { ...newState, past: [...state.past, { ...state, past: undefined } as any] };
    });
  },

  selectRecord: (id) => {
    set((state) => {
      return {
        provenanceAtlasState: { ...state.provenanceAtlasState, selectedId: id },
      };
    });
  },

  traceAndQuarantine: () => {
    set((state) => {
      const { selectedId } = state.provenanceAtlasState;
      if (!selectedId) return state;

      const recordToQuarantine = state.records.find((r) => r.id === selectedId);
      if (!recordToQuarantine) return state;

      if (recordToQuarantine.lineageQuarantined) return state;

      const newRecords = state.records.map((r) =>
        r.id === selectedId ? { ...r, lineageQuarantined: true, status: 'changed' as RecordStatus } : r
      );

      const newState: SessionState = {
        ...state,
        records: newRecords,
        provenanceAtlasState: { ...state.provenanceAtlasState, geometry: 'focused' },
        derived: calculateDerived(newRecords),
        history: [...state.history, { action: 'traceAndQuarantine', timestamp: new Date().toISOString(), details: { id: selectedId } }]
      };
      return { ...newState, past: [...state.past, { ...state, past: undefined } as any] };
    });
  },

  undo: () => {
    set((state) => {
      if (state.past.length === 0) return state;
      const previousState = state.past[state.past.length - 1];
      return {
        ...previousState,
        past: state.past.slice(0, -1),
      };
    });
  },

  importSession: (session) => {
    set({
      ...session,
      past: [],
    });
  }
}));
