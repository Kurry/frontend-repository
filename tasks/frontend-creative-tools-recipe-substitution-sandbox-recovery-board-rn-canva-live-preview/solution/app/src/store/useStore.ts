import { create } from 'zustand';

export type RecordStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface IngredientRecord {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  status: RecordStatus;
  recoveryBoardState?: {
    resolved: boolean;
    reason: string;
  };
  createdAt: string;
}

export interface DerivedSummary {
  total: number;
  readyCount: number;
  draftCount: number;
  changedCount: number;
  archivedCount: number;
}

export interface AppState {
  records: IngredientRecord[];
  history: IngredientRecord[][];
  derivedSummary: DerivedSummary;

  // Actions
  addRecord: (record: Omit<IngredientRecord, 'id' | 'status' | 'createdAt'>) => void;
  updateRecord: (id: string, updates: Partial<IngredientRecord>) => void;
  deleteRecord: (id: string) => void;
  archiveRecord: (id: string) => void;
  reorderRecords: (startIndex: number, endIndex: number) => void;

  // Signature mutation
  recoverRecord: (id: string, reason: string) => void;

  // History
  undo: () => void;

  // Artifact
  importArtifact: (data: any) => boolean;
  exportArtifact: () => any;
  clearAll: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const calculateSummary = (records: IngredientRecord[]): DerivedSummary => {
  return {
    total: records.length,
    readyCount: records.filter(r => r.status === 'ready').length,
    draftCount: records.filter(r => r.status === 'draft').length,
    changedCount: records.filter(r => r.status === 'changed').length,
    archivedCount: records.filter(r => r.status === 'archived').length,
  };
};

// Seed 100+ records to meet performance requirements and ensure a robust initial state
const seedRecords: IngredientRecord[] = Array.from({ length: 110 }, (_, i) => {
  let status: RecordStatus = 'ready';
  if (i < 10) status = 'draft';
  else if (i < 20) status = 'changed';
  else if (i < 30) status = 'archived';
  else if (i < 40) status = 'empty';

  // Create a known conflict record for recovery
  if (i === 40) {
    return {
      id: `conflict-1`,
      name: `Expired Yeast`,
      quantity: 2,
      unit: 'packets',
      status: 'empty', // failed record state
      createdAt: new Date().toISOString(),
    }
  }

  return {
    id: `seed-${i}`,
    name: `Ingredient ${i}`,
    quantity: (i % 10) + 1,
    unit: 'cups',
    status,
    createdAt: new Date().toISOString(),
  };
});

export const useStore = create<AppState>((set, get) => ({
  records: seedRecords,
  history: [],
  derivedSummary: calculateSummary(seedRecords),

  addRecord: (record) => {
    set((state) => {
      const newRecord: IngredientRecord = {
        ...record,
        id: generateId(),
        status: 'draft',
        createdAt: new Date().toISOString(),
      };
      const newRecords = [newRecord, ...state.records];
      return {
        records: newRecords,
        history: [...state.history, state.records],
        derivedSummary: calculateSummary(newRecords),
      };
    });
  },

  updateRecord: (id, updates) => {
    set((state) => {
      const newRecords = state.records.map(r => r.id === id ? { ...r, ...updates } : r);
      return {
        records: newRecords,
        history: [...state.history, state.records],
        derivedSummary: calculateSummary(newRecords),
      };
    });
  },

  deleteRecord: (id) => {
    set((state) => {
      const newRecords = state.records.filter(r => r.id !== id);
      return {
        records: newRecords,
        history: [...state.history, state.records],
        derivedSummary: calculateSummary(newRecords),
      };
    });
  },

  archiveRecord: (id) => {
    set((state) => {
      const newRecords = state.records.map(r => r.id === id ? { ...r, status: 'archived' as RecordStatus } : r);
      return {
        records: newRecords,
        history: [...state.history, state.records],
        derivedSummary: calculateSummary(newRecords),
      };
    });
  },

  reorderRecords: (startIndex, endIndex) => {
    set((state) => {
      const newRecords = Array.from(state.records);
      const [removed] = newRecords.splice(startIndex, 1);
      newRecords.splice(endIndex, 0, removed);

      return {
        records: newRecords,
        history: [...state.history, state.records],
        derivedSummary: calculateSummary(newRecords),
      };
    });
  },

  recoverRecord: (id, reason) => {
    set((state) => {
      const target = state.records.find(r => r.id === id);
      if (!target || !reason) return state; // Conflicting or incomplete mutation rejected

      const newRecords = state.records.map(r =>
        r.id === id
          ? {
              ...r,
              status: 'changed' as RecordStatus,
              recoveryBoardState: { resolved: true, reason }
            }
          : r
      );
      return {
        records: newRecords,
        history: [...state.history, state.records],
        derivedSummary: calculateSummary(newRecords),
      };
    });
  },

  undo: () => {
    set((state) => {
      if (state.history.length === 0) return state;
      const previousRecords = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);
      return {
        records: previousRecords,
        history: newHistory,
        derivedSummary: calculateSummary(previousRecords),
      };
    });
  },

  importArtifact: (data: any) => {
    try {
      if (data.schemaVersion !== 'v1') return false;
      if (!Array.isArray(data.records)) return false;

      // Basic validation on required fields
      const isValid = data.records.every((r: any) =>
        r.id && r.name && typeof r.quantity === 'number' && r.unit && r.status
      );

      if (!isValid) return false;

      const records = data.records;
      set({
        records,
        history: Array.isArray(data.history) ? data.history : [],
        derivedSummary: calculateSummary(records),
      });
      return true;
    } catch (e) {
      return false;
    }
  },

  exportArtifact: () => {
    const state = get();
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: state.derivedSummary,
      history: state.history,
    };
  },

  clearAll: () => {
    set({
      records: [],
      history: [],
      derivedSummary: calculateSummary([]),
    });
  }
}));
