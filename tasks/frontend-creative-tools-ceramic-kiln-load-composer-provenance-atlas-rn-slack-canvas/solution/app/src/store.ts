import { create } from 'zustand';

export type RecordStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';
export type RecordLineage = 'good' | 'bad';

export interface KilnRecord {
  id: string;
  name: string;
  status: RecordStatus;
  lineage: RecordLineage;
  temperature: number;
  notes: string;
}

export interface ProvenanceState {
  selectedRecordId: string | null;
  geometry: string;
}

export interface HistoryEvent {
  timestamp: string;
  action: string;
  recordId: string;
}

export interface StoreState {
  records: KilnRecord[];
  provenance: ProvenanceState;
  history: HistoryEvent[];
  schemaVersion: string;
  exportedAt: string | null;

  // Actions
  addRecord: (record: Omit<KilnRecord, 'id'>) => void;
  updateRecord: (id: string, record: Partial<KilnRecord>) => void;
  deleteRecord: (id: string) => void;

  selectRecord: (id: string | null) => void;
  traceAndQuarantine: (id: string) => void;
  undo: () => void; // simplistic undo for traceAndQuarantine

  exportSession: () => any;
  importSession: (sessionData: any) => boolean;
  clearSession: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const initialState = {
  records: [
    { id: '1', name: 'Bowl 1', status: 'draft' as RecordStatus, lineage: 'good' as RecordLineage, temperature: 1000, notes: '' },
    { id: '2', name: 'Vase 1', status: 'ready' as RecordStatus, lineage: 'good' as RecordLineage, temperature: 1200, notes: '' },
    { id: '3', name: 'Plate 1', status: 'changed' as RecordStatus, lineage: 'good' as RecordLineage, temperature: 1100, notes: '' },
    { id: '4', name: 'Mug 1', status: 'empty' as RecordStatus, lineage: 'good' as RecordLineage, temperature: 0, notes: '' },
    { id: '5', name: 'Mug 2', status: 'archived' as RecordStatus, lineage: 'bad' as RecordLineage, temperature: 900, notes: '' },
  ],
  provenance: {
    selectedRecordId: null,
    geometry: 'default',
  },
  history: [],
  schemaVersion: 'v1',
  exportedAt: null,
};

// We need an undo stack just for the mutation "trace a selected record to source evidence and quarantine a bad lineage"
let previousStateSnapshot: any = null;

export const useStore = create<StoreState>((set, get) => ({
  ...initialState,

  addRecord: (record) => set((state) => ({
    records: [...state.records, { ...record, id: generateId() }]
  })),

  updateRecord: (id, updates) => set((state) => ({
    records: state.records.map(r => r.id === id ? { ...r, ...updates } : r)
  })),

  deleteRecord: (id) => set((state) => ({
    records: state.records.filter(r => r.id !== id),
    provenance: state.provenance.selectedRecordId === id ? { ...state.provenance, selectedRecordId: null } : state.provenance
  })),

  selectRecord: (id) => set((state) => ({
    provenance: { ...state.provenance, selectedRecordId: id }
  })),

  traceAndQuarantine: (id) => set((state) => {
    // save snapshot for undo
    previousStateSnapshot = {
      records: [...state.records.map(r => ({...r}))],
      provenance: { ...state.provenance },
      history: [...state.history]
    };

    return {
      records: state.records.map(r => r.id === id ? { ...r, status: 'archived', lineage: 'bad' } : r),
      provenance: { selectedRecordId: id, geometry: 'quarantined' },
      history: [...state.history, { timestamp: new Date().toISOString(), action: 'traceAndQuarantine', recordId: id }]
    };
  }),

  undo: () => set((state) => {
    if (previousStateSnapshot) {
      const snap = previousStateSnapshot;
      previousStateSnapshot = null;
      return snap;
    }
    return state;
  }),

  exportSession: () => {
    const state = get();
    return {
      schemaVersion: state.schemaVersion,
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: { summary: `Total records: ${state.records.length}` },
      history: state.history,
      provenance: state.provenance
    };
  },

  importSession: (data) => {
    if (data?.schemaVersion === 'v1' && Array.isArray(data.records)) {
       set({
         records: data.records,
         history: data.history || [],
         provenance: data.provenance || { selectedRecordId: null, geometry: 'default' },
         exportedAt: data.exportedAt
       });
       return true;
    }
    return false;
  },

  clearSession: () => set({ ...initialState, records: [], history: [], provenance: { selectedRecordId: null, geometry: 'default' } })
}));
