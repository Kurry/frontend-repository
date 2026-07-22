import { create } from 'zustand';

export type BrewStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface BrewExperiment {
  id: string;
  title: string;
  date: string;
  coffee: string;
  roaster: string;
  brewMethod: string;
  dose: number;
  yield: number;
  time: string;
  grindSetting: string;
  waterTemp: number;
  notes: string;
  status: BrewStatus;
  forecastRibbonState?: {
    projectedYield: number;
    projectedTds: number;
    projectedExt: number;
    adjustedDose: number;
    adjustedRatio: number;
    status: 'idle' | 'selected' | 'changed' | 'conflict' | 'resolved';
  };
}

export interface CoffeeBrewExperimentLogSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: BrewExperiment[];
  derived: {
    totalExperiments: number;
    averageYield: number;
    averageDose: number;
  };
  history: { action: string; timestamp: string }[];
}

interface State {
  records: BrewExperiment[];
  activeForecastId: string | null;
  history: BrewExperiment[][]; // Array of previous records states for undo
  undoLastMutation: () => void;
  addRecord: (record: Omit<BrewExperiment, 'id'>) => void;
  updateRecord: (id: string, updates: Partial<BrewExperiment>) => void;
  deleteRecord: (id: string) => void;
  setForecastRibbonState: (id: string, state: BrewExperiment['forecastRibbonState']) => void;
  exportSession: () => CoffeeBrewExperimentLogSession;
  importSession: (session: any) => void;
  clearSession: () => void;
  derived: CoffeeBrewExperimentLogSession['derived'];
}

function calculateDerived(records: BrewExperiment[]) {
  const validRecords = records.filter(r => r.status !== 'empty');
  return {
    totalExperiments: validRecords.length,
    averageDose: validRecords.length ? validRecords.reduce((acc, r) => acc + (r.dose || 0), 0) / validRecords.length : 0,
    averageYield: validRecords.length ? validRecords.reduce((acc, r) => acc + (r.yield || 0), 0) / validRecords.length : 0,
  };
}

const initialRecords: BrewExperiment[] = [
  {
    id: '1',
    title: 'Morning V60',
    date: '2023-10-01',
    coffee: 'Ethiopia Yirgacheffe',
    roaster: 'Onyx',
    brewMethod: 'V60',
    dose: 15,
    yield: 250,
    time: '2:30',
    grindSetting: 'Medium-Fine',
    waterTemp: 98,
    notes: 'Floral, bright.',
    status: 'ready'
  },
  {
    id: '2',
    title: 'Afternoon AeroPress',
    date: '2023-10-02',
    coffee: 'Colombia Supremo',
    roaster: 'Verve',
    brewMethod: 'AeroPress',
    dose: 18,
    yield: 200,
    time: '1:45',
    grindSetting: 'Medium',
    waterTemp: 90,
    notes: 'Chocolatey, full body.',
    status: 'draft'
  }
];

export const useStore = create<State>((set, get) => ({
  records: initialRecords,
  activeForecastId: null,
  history: [],
  derived: calculateDerived(initialRecords),

  undoLastMutation: () => set((state) => {
    if (state.history.length === 0) return state;
    const previousRecords = state.history[state.history.length - 1];
    return {
      records: previousRecords,
      history: state.history.slice(0, -1),
      derived: calculateDerived(previousRecords),
    };
  }),

  addRecord: (record) => set((state) => {
    const newRecords = [...state.records, { ...record, id: crypto.randomUUID() }];
    return {
      records: newRecords,
      history: [...state.history, state.records],
      derived: calculateDerived(newRecords),
    };
  }),

  updateRecord: (id, updates) => set((state) => {
    const newRecords = state.records.map(r => r.id === id ? { ...r, ...updates } : r);
    return {
      records: newRecords,
      history: [...state.history, state.records],
      derived: calculateDerived(newRecords),
    };
  }),

  deleteRecord: (id) => set((state) => {
    const newRecords = state.records.filter(r => r.id !== id);
    return {
      records: newRecords,
      history: [...state.history, state.records],
      derived: calculateDerived(newRecords),
    };
  }),

  setForecastRibbonState: (id, forecastRibbonState) => set((state) => {
    const newRecords = state.records.map(r => r.id === id ? { ...r, forecastRibbonState } : r);
    return {
      records: newRecords,
      history: [...state.history, state.records],
      derived: calculateDerived(newRecords),
      activeForecastId: id,
    };
  }),

  exportSession: () => {
    const state = get();
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: state.derived,
      history: [],
    };
  },

  importSession: (session) => {
    try {
      if (session.schemaVersion !== 'v1') throw new Error('Invalid schema version');
      if (!Array.isArray(session.records)) throw new Error('Invalid records array');

      const ids = new Set();
      for (const r of session.records) {
        if (ids.has(r.id)) throw new Error('Duplicate ID');
        ids.add(r.id);

        if (typeof r.dose !== 'number' || r.dose <= 0 || r.dose > 100) throw new Error('Invalid bounds');
        if (typeof r.yield !== 'number' || r.yield <= 0 || r.yield > 1000) throw new Error('Invalid bounds');
      }

      const newRecords = session.records.map((r: any) => ({
         ...r,
         status: r.status || 'draft'
      }));

      set({
        records: newRecords,
        derived: calculateDerived(newRecords),
        history: [], // clear history on import
        activeForecastId: null
      });
    } catch (e) {
      console.error("Failed to import session", e);
    }
  },

  clearSession: () => set({
    records: [],
    derived: calculateDerived([]),
    history: [],
    activeForecastId: null
  }),
}));
