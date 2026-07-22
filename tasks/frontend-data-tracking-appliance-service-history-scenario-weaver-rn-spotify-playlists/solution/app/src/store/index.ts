import { create } from 'zustand';

export type RecordStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface ApplianceRecord {
  id: string;
  name: string;
  model: string;
  status: RecordStatus;
  scenarioState?: 'idle' | 'selected' | 'changed' | 'conflict' | 'resolved';
  cost?: number;
}

export interface DerivedState {
  summary: string;
}

export interface ApplianceServiceHistorySession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: ApplianceRecord[];
  derived: DerivedState;
  history: string[]; // Keep history as simple string array for demonstration
}

interface AppState {
  records: ApplianceRecord[];
  history: ApplianceServiceHistorySession[];
  derived: DerivedState;

  // Actions
  setRecords: (records: ApplianceRecord[]) => void;
  addRecord: (record: ApplianceRecord) => void;
  updateRecord: (id: string, updates: Partial<ApplianceRecord>) => void;
  deleteRecord: (id: string) => void;

  branchScenario: (id: string, newCost: number) => void;
  undo: () => void;

  exportData: () => ApplianceServiceHistorySession;
  importData: (data: ApplianceServiceHistorySession) => void;
}

const generateInitialRecords = () => {
  const records: ApplianceRecord[] = [];
  const statuses: RecordStatus[] = ['empty', 'draft', 'ready', 'changed', 'archived'];
  for (let i = 0; i < 100; i++) {
    records.push({
      id: `rec-${i}`,
      name: `Appliance ${i}`,
      model: `Model ${i}`,
      status: statuses[i % statuses.length],
      cost: 100 + i * 10,
    });
  }
  return records;
};

const computeDerived = (records: ApplianceRecord[]): DerivedState => {
  const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);
  return {
    summary: `Total records: ${records.length}. Total cost: $${totalCost}`,
  };
};

const initialRecords = generateInitialRecords();

export const useAppStore = create<AppState>((set, get) => ({
  records: initialRecords,
  derived: computeDerived(initialRecords),
  history: [],

  setRecords: (records) => {
    set({ records, derived: computeDerived(records) });
  },

  addRecord: (record) => {
    const { records, history, derived } = get();
    const currentState = { schemaVersion: 'v1' as const, exportedAt: new Date().toISOString(), records, derived, history: [] };
    const newRecords = [...records, record];
    set({
      records: newRecords,
      derived: computeDerived(newRecords),
      history: [...history, currentState]
    });
  },

  updateRecord: (id, updates) => {
    const { records, history, derived } = get();
    const currentState = { schemaVersion: 'v1' as const, exportedAt: new Date().toISOString(), records, derived, history: [] };
    const newRecords = records.map(r => r.id === id ? { ...r, ...updates } : r);
    set({
      records: newRecords,
      derived: computeDerived(newRecords),
      history: [...history, currentState]
    });
  },

  deleteRecord: (id) => {
    const { records, history, derived } = get();
    const currentState = { schemaVersion: 'v1' as const, exportedAt: new Date().toISOString(), records, derived, history: [] };
    const newRecords = records.filter(r => r.id !== id);
    set({
      records: newRecords,
      derived: computeDerived(newRecords),
      history: [...history, currentState]
    });
  },

  branchScenario: (id, newCost) => {
    const { records, history, derived } = get();
    const currentState = { schemaVersion: 'v1' as const, exportedAt: new Date().toISOString(), records, derived, history: [] };

    const newRecords = records.map(r => {
      if (r.id === id) {
        return { ...r, status: 'changed' as RecordStatus, scenarioState: 'changed' as const, cost: newCost };
      }
      return r;
    });

    set({
      records: newRecords,
      derived: computeDerived(newRecords),
      history: [...history, currentState]
    });
  },

  undo: () => {
    const { history } = get();
    if (history.length === 0) return;

    const previousState = history[history.length - 1];
    set({
      records: previousState.records,
      derived: previousState.derived,
      history: history.slice(0, history.length - 1)
    });
  },

  exportData: () => {
    const { records, derived } = get();
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records,
      derived,
      history: []
    };
  },

  importData: (data) => {
    if (data.schemaVersion === 'v1' && Array.isArray(data.records)) {
      set({
        records: data.records,
        derived: computeDerived(data.records),
        history: [] // Reset history on import
      });
    }
  }
}));
