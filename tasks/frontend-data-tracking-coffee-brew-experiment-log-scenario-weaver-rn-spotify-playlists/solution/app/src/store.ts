import { create } from 'zustand';
import { BrewExperiment, CoffeeBrewExperimentLogSession, ScenarioState } from './types';
import { formatISO } from 'date-fns';

interface AppState {
  records: BrewExperiment[];
  selection: string[];
  historyStack: BrewExperiment[][]; // Simplified undo history storing snapshots of records

  // Actions
  createRecord: (record: Partial<BrewExperiment>) => void;
  updateRecord: (id: string, updates: Partial<BrewExperiment>) => void;
  deleteRecord: (id: string) => void;
  archiveSelected: () => void;
  deleteSelected: () => void;
  setSelection: (ids: string[]) => void;

  // Scenario Weaver
  branchScenario: (id: string) => void;
  resolveScenario: (id: string) => void;
  undoLastMutation: () => void;

  // Artifact
  exportArtifact: () => CoffeeBrewExperimentLogSession;
  importArtifact: (data: CoffeeBrewExperimentLogSession) => void;
  clearSession: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const defaultRecord: Omit<BrewExperiment, 'id'> = {
  title: 'New Experiment',
  status: 'empty',
  scenarioState: 'idle',
  bean: '',
  roastDate: formatISO(new Date(), { representation: 'date' }),
  grindSetting: '',
  waterTemp: 93,
  dose: 18,
  yield: 36,
  time: 30,
  notes: '',
  derived: {
    ratio: '1:2.0',
    extractionEstimate: 'Standard',
  }
};

const calculateDerived = (record: Partial<BrewExperiment>): { ratio: string, extractionEstimate: string } => {
  const dose = record.dose || 18;
  const yieldAmount = record.yield || 36;
  const ratio = `1:${(yieldAmount / dose).toFixed(1)}`;

  let extractionEstimate = 'Standard';
  const time = record.time || 30;
  if (time < 25) extractionEstimate = 'Under-extracted (Sour)';
  if (time > 35) extractionEstimate = 'Over-extracted (Bitter)';

  return { ratio, extractionEstimate };
};

export const useStore = create<AppState>((set, get) => ({
  records: [],
  selection: [],
  historyStack: [],

  createRecord: (record) => set((state) => {
    const newRecord: BrewExperiment = {
      ...defaultRecord,
      ...record,
      id: generateId(),
      status: 'draft',
    };
    newRecord.derived = calculateDerived(newRecord);
    return {
      records: [...state.records, newRecord],
      historyStack: [...state.historyStack, state.records],
    };
  }),

  updateRecord: (id, updates) => set((state) => {
    const newRecords = state.records.map(r => {
      if (r.id === id) {
        const updated = { ...r, ...updates };
        updated.derived = calculateDerived(updated);
        // Automatically move status to 'changed' if it was 'draft' or 'ready' and we edited it
        if (updates.status === undefined && r.status !== 'empty') {
            updated.status = 'changed';
        }
        return updated;
      }
      return r;
    });
    return {
      records: newRecords,
      historyStack: [...state.historyStack, state.records],
    };
  }),

  deleteRecord: (id) => set((state) => ({
    records: state.records.filter(r => r.id !== id),
    historyStack: [...state.historyStack, state.records],
    selection: state.selection.filter(selectedId => selectedId !== id)
  })),

  archiveSelected: () => set((state) => ({
    records: state.records.map(r => state.selection.includes(r.id) ? { ...r, status: 'archived' } : r),
    historyStack: [...state.historyStack, state.records],
    selection: []
  })),

  deleteSelected: () => set((state) => ({
    records: state.records.filter(r => !state.selection.includes(r.id)),
    historyStack: [...state.historyStack, state.records],
    selection: []
  })),

  setSelection: (ids) => set({ selection: ids }),

  branchScenario: (id) => set((state) => {
    const record = state.records.find(r => r.id === id);
    if (!record) return state;

    // Create a new branch
    const branched: BrewExperiment = {
      ...record,
      id: generateId(),
      title: `${record.title} (Scenario)`,
      status: 'changed',
      scenarioState: 'selected',
    };

    // Mark original as conflict if needed, or just changed
    const newRecords = state.records.map(r =>
      r.id === id ? { ...r, scenarioState: 'changed' as ScenarioState } : r
    );

    return {
      records: [...newRecords, branched],
      historyStack: [...state.historyStack, state.records],
      selection: [branched.id]
    };
  }),

  resolveScenario: (id) => set((state) => {
    const record = state.records.find(r => r.id === id);
    if (!record) return state;

    const newRecords = state.records.map(r =>
      r.id === id ? { ...r, scenarioState: 'resolved' as ScenarioState } : r
    );

    return {
      records: newRecords,
      historyStack: [...state.historyStack, state.records],
      selection: state.selection.filter(s => s !== id)
    };
  }),

  undoLastMutation: () => set((state) => {
    if (state.historyStack.length === 0) return state;
    const newHistory = [...state.historyStack];
    const previousRecords = newHistory.pop()!;
    return {
      records: previousRecords,
      historyStack: newHistory,
      selection: state.selection.filter(id => previousRecords.some(r => r.id === id))
    };
  }),

  exportArtifact: () => {
    const state = get();
    return {
      schemaVersion: 'v1',
      exportedAt: formatISO(new Date()),
      records: state.records,
      derived: {
        summary: `Exported ${state.records.length} experiments`,
        totalExperiments: state.records.length,
        scenarioChanges: state.records.filter(r => r.scenarioState !== 'idle').length
      },
      history: []
    };
  },

  importArtifact: (data) => set(() => {
    return {
      records: data.records.map(r => ({ ...r })),
      historyStack: [],
      selection: []
    };
  }),

  clearSession: () => set(() => ({
    records: [],
    historyStack: [],
    selection: []
  }))
}));
