import { create } from 'zustand';
import type { ScenarioCard, BoardGameScenarioBuilderSession } from './types';
import { BoardGameScenarioBuilderSessionSchema } from './types';

interface StoreState {
  records: ScenarioCard[];
  derived: Record<string, any>;
  history: {
    records: ScenarioCard[];
    derived: Record<string, any>;
  }[];

  // Actions
  addRecord: (record: Omit<ScenarioCard, 'id'>) => void;
  updateRecord: (id: string, record: Omit<ScenarioCard, 'id'>) => void;
  deleteRecord: (id: string) => void;

  // Batch Reconciler
  batchReconcile: (ids: string[], newStatus: ScenarioCard['status']) => void;
  undoLastMutation: () => void;

  // Artifact
  importArtifact: (jsonStr: string) => { success: boolean; error?: string };
  exportArtifact: () => string;
  clearSession: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useStore = create<StoreState>((set, get) => ({
  records: [],
  derived: {},
  history: [],

  addRecord: (record) => set((state) => {
    const newRecords = [...state.records, { ...record, id: generateId() }];
    return {
      records: newRecords,
      history: [...state.history, { records: state.records, derived: state.derived }]
    };
  }),

  updateRecord: (id, record) => set((state) => {
    const newRecords = state.records.map(r => r.id === id ? { ...record, id } : r);
    return {
      records: newRecords,
      history: [...state.history, { records: state.records, derived: state.derived }]
    };
  }),

  deleteRecord: (id) => set((state) => {
    const newRecords = state.records.filter(r => r.id !== id);
    return {
      records: newRecords,
      history: [...state.history, { records: state.records, derived: state.derived }]
    };
  }),

  batchReconcile: (ids, newStatus) => set((state) => {
    if (ids.length === 0) return state; // conflicting or incomplete mutation is rejected

    // Group selected records and update status
    const newRecords = state.records.map(r =>
      ids.includes(r.id) ? { ...r, status: newStatus } : r
    );

    // Calculate aggregate totals
    const reconciledCards = newRecords.filter(r => ids.includes(r.id));
    const totalDifficulty = reconciledCards.reduce((sum, r) => sum + r.difficulty, 0);
    const avgDifficulty = reconciledCards.length > 0 ? (totalDifficulty / reconciledCards.length).toFixed(1) : 0;

    const newDerived = {
      ...state.derived,
      lastBatchSize: reconciledCards.length,
      lastBatchAvgDifficulty: avgDifficulty,
      lastBatchTime: new Date().toISOString()
    };

    return {
      records: newRecords,
      derived: newDerived,
      history: [...state.history, { records: state.records, derived: state.derived }]
    };
  }),

  undoLastMutation: () => set((state) => {
    if (state.history.length === 0) return state;

    const lastHistory = state.history[state.history.length - 1];
    return {
      records: lastHistory.records,
      derived: lastHistory.derived,
      history: state.history.slice(0, -1)
    };
  }),

  importArtifact: (jsonStr) => {
    try {
      const data = JSON.parse(jsonStr);
      const parsed = BoardGameScenarioBuilderSessionSchema.safeParse(data);

      if (!parsed.success) {
        return { success: false, error: 'Malformed schema or invalid bounds' };
      }

      // Additional checks like duplicate IDs can go here
      const uniqueIds = new Set(parsed.data.records.map(r => r.id));
      if (uniqueIds.size !== parsed.data.records.length) {
         return { success: false, error: 'Duplicate IDs found' };
      }

      set({
        records: parsed.data.records,
        derived: parsed.data.derived,
        history: parsed.data.history
      });
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Invalid JSON' };
    }
  },

  exportArtifact: () => {
    const { records, derived, history } = get();
    const artifact: BoardGameScenarioBuilderSession = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records,
      derived,
      history
    };
    return JSON.stringify(artifact, null, 2);
  },

  clearSession: () => set({ records: [], derived: {}, history: [] })
}));
