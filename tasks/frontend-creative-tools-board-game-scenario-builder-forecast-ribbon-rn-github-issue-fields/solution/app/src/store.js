import { create } from 'zustand';

const defaultScenarios = [
  { id: 'sc-1', title: 'Base Deployment', state: 'ready', cost: 10, likelihood: 90, description: 'Standard baseline.' },
  { id: 'sc-2', title: 'Aggressive Expansion', state: 'draft', cost: 45, likelihood: 50, description: 'High risk.' },
  { id: 'sc-3', title: 'Defensive Posture', state: 'changed', cost: 80, likelihood: 20, description: 'Conservative.' },
  { id: 'sc-4', title: 'Outdated Model', state: 'archived', cost: 5, likelihood: 10, description: 'Deprecated.' }
];

const createEmptyState = () => ({
  schemaVersion: 'scenario-builder-v1',
  exportedAt: new Date().toISOString(),
  records: defaultScenarios,
  history: []
});

export const useStore = create((set, get) => ({
  records: defaultScenarios,
  history: [],
  selectedId: null,
  filterState: 'all',

  setSelectedId: (id) => set({ selectedId: id }),
  setFilterState: (state) => set({ filterState: state }),

  addRecord: () => set((state) => {
    const newRecord = {
      id: `sc-${Date.now()}`,
      title: 'New Scenario',
      state: 'draft',
      cost: 0,
      likelihood: 50,
      description: ''
    };
    return { records: [...state.records, newRecord], selectedId: newRecord.id };
  }),

  updateRecord: (id, updates) => set((state) => {
    const isForecastRibbonChange = ('cost' in updates || 'likelihood' in updates);
    const prevRecord = state.records.find(r => r.id === id);

    let newHistory = state.history;
    if (isForecastRibbonChange && prevRecord) {
      newHistory = [
        ...state.history,
        { id, cost: prevRecord.cost, likelihood: prevRecord.likelihood, selection: state.selectedId }
      ];
    }

    return {
      history: newHistory,
      records: state.records.map(r => r.id === id ? { ...r, ...updates } : r)
    };
  }),

  deleteRecord: (id) => set((state) => ({
    records: state.records.filter(r => r.id !== id),
    selectedId: state.selectedId === id ? null : state.selectedId
  })),

  undo: () => set((state) => {
    if (state.history.length === 0) return state;
    const lastChange = state.history[state.history.length - 1];
    return {
      history: state.history.slice(0, -1),
      records: state.records.map(r => r.id === lastChange.id
        ? { ...r, cost: lastChange.cost, likelihood: lastChange.likelihood }
        : r),
      selectedId: lastChange.selection
    };
  }),

  importData: (data) => set(() => {
    return {
      records: data.records,
      history: data.history || [],
      selectedId: null
    };
  }),

  clearData: () => set(() => ({
    records: [],
    history: [],
    selectedId: null
  }))
}));

export const getDerivedSummary = (records) => {
  const activeRecords = records.filter(r => r.state !== 'archived');
  const totalCost = activeRecords.reduce((sum, r) => sum + r.cost, 0);
  const avgLikelihood = activeRecords.length > 0
    ? Math.round(activeRecords.reduce((sum, r) => sum + r.likelihood, 0) / activeRecords.length)
    : 0;
  return { totalCost, avgLikelihood, count: activeRecords.length };
};
