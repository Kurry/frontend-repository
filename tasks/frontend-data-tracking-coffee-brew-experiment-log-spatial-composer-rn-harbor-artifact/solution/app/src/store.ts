import { create } from 'zustand';

export type ExperimentStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface BrewRecord {
  id: string;
  name: string;
  status: ExperimentStatus;
  coffee: string;
  roastDate: string;
  grindSize: number; // e.g., 1-100
  doseWeight: number; // e.g., in grams
  yieldWeight: number; // e.g., in grams
  timeSeconds: number;
  spatialPosition?: { x: number; y: number };
}

export interface DerivedState {
  totalCount: number;
  byStatus: Record<ExperimentStatus, number>;
  averageYieldRatio: number;
}

export interface HistoryEntry {
  records: BrewRecord[];
  timestamp: string;
  description: string;
}

export interface StoreState {
  records: BrewRecord[];
  history: HistoryEntry[];
  derived: DerivedState;
  selectedRecordId: string | null;
  schemaVersion: 'v1';
  exportedAt: string | null;

  // Actions
  createRecord: (record: Omit<BrewRecord, 'id' | 'status'>) => void;
  updateRecord: (id: string, updates: Partial<BrewRecord>) => void;
  deleteRecord: (id: string) => void;
  archiveRecord: (id: string) => void;
  selectRecord: (id: string | null) => void;
  placeInSpatialComposer: (id: string, x: number, y: number) => void;
  rebalanceCapacity: () => void;
  undo: () => void;
  importArtifact: (jsonString: string) => boolean;
  exportArtifact: () => string;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const calculateDerived = (records: BrewRecord[]): DerivedState => {
  const byStatus: Record<ExperimentStatus, number> = {
    empty: 0, draft: 0, ready: 0, changed: 0, archived: 0
  };
  let totalYield = 0;
  let totalDose = 0;

  records.forEach(r => {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    if (r.doseWeight > 0 && r.yieldWeight > 0) {
      totalDose += r.doseWeight;
      totalYield += r.yieldWeight;
    }
  });

  return {
    totalCount: records.length,
    byStatus,
    averageYieldRatio: totalDose > 0 ? (totalYield / totalDose) : 0,
  };
};

const pushHistory = (state: StoreState, description: string) => {
  const newEntry: HistoryEntry = {
    records: JSON.parse(JSON.stringify(state.records)),
    timestamp: new Date().toISOString(),
    description
  };
  return { history: [...state.history, newEntry] };
};

// Seed initial data
const initialRecords: BrewRecord[] = Array.from({ length: 120 }, (_, i) => ({
  id: `seed-${i}`,
  name: `Experiment ${i + 1}`,
  status: i % 10 === 0 ? 'archived' : (i % 5 === 0 ? 'draft' : 'ready'),
  coffee: `Coffee ${Math.floor(i / 10)}`,
  roastDate: '2024-01-01',
  grindSize: 15 + (i % 10),
  doseWeight: 15 + (i % 5),
  yieldWeight: 30 + (i % 10),
  timeSeconds: 25 + (i % 5),
  ...(i < 10 ? { spatialPosition: { x: (i % 3) * 150, y: Math.floor(i / 3) * 150 } } : {})
}));

export const useStore = create<StoreState>((set, get) => ({
  records: initialRecords,
  history: [],
  derived: calculateDerived(initialRecords),
  selectedRecordId: null,
  schemaVersion: 'v1',
  exportedAt: null,

  createRecord: (recordData) => {
    set((state) => {
      const newRecord: BrewRecord = {
        ...recordData,
        id: generateId(),
        status: 'draft'
      };
      const newRecords = [...state.records, newRecord];
      return {
        ...pushHistory(state, 'Created record'),
        records: newRecords,
        derived: calculateDerived(newRecords)
      };
    });
  },

  updateRecord: (id, updates) => {
    set((state) => {
      const newRecords = state.records.map(r => r.id === id ? { ...r, ...updates, status: 'changed' as ExperimentStatus } : r);
      return {
        ...pushHistory(state, 'Updated record'),
        records: newRecords,
        derived: calculateDerived(newRecords)
      };
    });
  },

  deleteRecord: (id) => {
    set((state) => {
      const newRecords = state.records.filter(r => r.id !== id);
      return {
        ...pushHistory(state, 'Deleted record'),
        records: newRecords,
        derived: calculateDerived(newRecords),
        selectedRecordId: state.selectedRecordId === id ? null : state.selectedRecordId
      };
    });
  },

  archiveRecord: (id) => {
    set((state) => {
      const newRecords = state.records.map(r => r.id === id ? { ...r, status: 'archived' as ExperimentStatus } : r);
      return {
        ...pushHistory(state, 'Archived record'),
        records: newRecords,
        derived: calculateDerived(newRecords),
      };
    });
  },

  selectRecord: (id) => set({ selectedRecordId: id }),

  placeInSpatialComposer: (id, x, y) => {
    set((state) => {
      const newRecords = state.records.map(r => {
        if (r.id === id) {
          // If placed in composer, update status and coords
          return { ...r, spatialPosition: { x, y }, status: 'changed' as ExperimentStatus };
        }
        return r;
      });
      return {
        ...pushHistory(state, `Placed ${id} in spatial composer`),
        records: newRecords,
        derived: calculateDerived(newRecords)
      };
    });
  },

  rebalanceCapacity: () => {
    set((state) => {
      // Example logic for rebalancing capacity: space out spatial records
      const spatialRecords = state.records.filter(r => r.spatialPosition);
      if (spatialRecords.length === 0) return state;

      const newRecords = [...state.records];
      let i = 0;
      for (const r of newRecords) {
        if (r.spatialPosition) {
          r.spatialPosition = { x: (i % 4) * 200 + 50, y: Math.floor(i / 4) * 200 + 50 };
          r.status = 'ready'; // after rebalance, ready
          i++;
        }
      }

      return {
        ...pushHistory(state, 'Rebalanced capacity'),
        records: newRecords,
        derived: calculateDerived(newRecords)
      };
    });
  },

  undo: () => {
    set((state) => {
      if (state.history.length === 0) return state;
      const prevEntry = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);
      return {
        records: prevEntry.records,
        derived: calculateDerived(prevEntry.records),
        history: newHistory,
        // Optional: restore selection or keep it
      };
    });
  },

  exportArtifact: () => {
    const state = get();
    const artifact = {
      schemaVersion: state.schemaVersion,
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: state.derived,
      history: state.history
    };
    return JSON.stringify(artifact, null, 2);
  },

  importArtifact: (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.schemaVersion !== 'v1') return false;
      if (!Array.isArray(data.records)) return false;

      // Additional simple validation
      const hasInvalid = data.records.some((r: any) => !r.id || !r.status);
      if (hasInvalid) return false;

      // Duplicate ID check
      const ids = new Set();
      for (const r of data.records) {
        if (ids.has(r.id)) return false;
        ids.add(r.id);
      }

      set({
        records: data.records,
        derived: calculateDerived(data.records),
        history: Array.isArray(data.history) ? data.history : [],
        exportedAt: new Date().toISOString(),
        selectedRecordId: null
      });
      return true;
    } catch (e) {
      return false;
    }
  }
}));
