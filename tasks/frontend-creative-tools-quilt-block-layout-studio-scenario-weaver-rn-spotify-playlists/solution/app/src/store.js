import { create } from 'zustand';

export const useStore = create((set, get) => ({
  records: [],
  history: [],
  scenarioMode: false,
  selectedId: null,
  derived: {},
  error: null,

  init: (seededRecords) => set({
    records: seededRecords,
    history: [],
    scenarioMode: false,
    selectedId: null,
    error: null
  }),

  setError: (error) => set({ error }),

  createRecord: (record) => set((state) => {
    const newRecord = { ...record, id: crypto.randomUUID() };
    const newRecords = [...state.records, newRecord];
    return {
      records: newRecords,
      history: [...state.history, { type: 'create', record: newRecord }],
      error: null
    };
  }),

  updateRecord: (id, updates) => set((state) => {
    const recordToUpdate = state.records.find(r => r.id === id);
    if (!recordToUpdate) return state;

    const updatedRecord = { ...recordToUpdate, ...updates };
    const newRecords = state.records.map(r => r.id === id ? updatedRecord : r);
    return {
      records: newRecords,
      history: [...state.history, { type: 'update', id, prev: recordToUpdate, next: updatedRecord }],
      error: null
    };
  }),

  deleteRecord: (id) => set((state) => {
    const recordToDelete = state.records.find(r => r.id === id);
    if (!recordToDelete) return state;
    return {
      records: state.records.filter(r => r.id !== id),
      history: [...state.history, { type: 'delete', record: recordToDelete }],
      selectedId: state.selectedId === id ? null : state.selectedId,
      scenarioMode: state.selectedId === id ? false : state.scenarioMode,
      error: null
    };
  }),

  selectRecord: (id) => set({ selectedId: id, error: null }),

  setScenarioMode: (mode) => set({ scenarioMode: mode, error: null }),

  branchScenario: (id, updates) => set((state) => {
    const recordToBranch = state.records.find(r => r.id === id);
    if (!recordToBranch) return state;

    const branchedRecord = { ...recordToBranch, ...updates, scenarioWeaverState: 'changed' };
    const newRecords = state.records.map(r => r.id === id ? branchedRecord : r);

    return {
      records: newRecords,
      history: [...state.history, { type: 'branch', id, prev: recordToBranch, next: branchedRecord }],
      error: null
    };
  }),

  undo: () => set((state) => {
    if (state.history.length === 0) return state;

    const lastAction = state.history[state.history.length - 1];
    const newHistory = state.history.slice(0, -1);

    let newRecords = [...state.records];
    if (lastAction.type === 'create') {
      newRecords = newRecords.filter(r => r.id !== lastAction.record.id);
    } else if (lastAction.type === 'update' || lastAction.type === 'branch') {
      newRecords = newRecords.map(r => r.id === lastAction.id ? lastAction.prev : r);
    } else if (lastAction.type === 'delete') {
      newRecords.push(lastAction.record);
    }

    return {
      records: newRecords,
      history: newHistory,
      error: null
    };
  }),

  importData: (data) => {
    try {
      if (data.schemaVersion !== 'quilt-layout-v1') {
        throw new Error('Invalid schema version');
      }

      const ids = new Set();
      data.records.forEach(r => {
        if (ids.has(r.id)) throw new Error('Duplicate ID');
        if (!['empty', 'draft', 'ready', 'changed', 'archived'].includes(r.status)) {
           throw new Error(`Invalid status: ${r.status}`);
        }
        ids.add(r.id);
      });

      set({
        records: data.records,
        history: data.history || [],
        selectedId: null,
        scenarioMode: false,
        error: null
      });
    } catch (e) {
      set({ error: e.message });
    }
  }
}));
