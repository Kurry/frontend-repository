import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export const initialRecords = Array.from({ length: 110 }).map((_, i) => ({
  id: uuidv4(),
  hex: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
  status: 'empty',
  capacity: 0,
  position: { x: 0, y: 0 }
}));

// Pre-seed some with valid values for testing
initialRecords[0] = { ...initialRecords[0], hex: '#ff0000', status: 'ready', capacity: 100, position: { x: 10, y: 10 } };
initialRecords[1] = { ...initialRecords[1], hex: '#00ff00', status: 'ready', capacity: 50, position: { x: 50, y: 50 } };
initialRecords[2] = { ...initialRecords[2], hex: '#0000ff', status: 'ready', capacity: 25, position: { x: 100, y: 10 } };
initialRecords[3] = { ...initialRecords[3], hex: '#ffff00', status: 'draft', capacity: 10, position: { x: 0, y: 0 } };

const initialState = {
  records: initialRecords,
  derived: {
    totalCapacity: 175,
    selectedId: null,
  },
  history: [],
};

export const useStore = create((set, get) => ({
  ...initialState,

  createRecord: (hex) => set((state) => {
    const newRecord = { id: uuidv4(), hex, status: 'draft', capacity: 0, position: { x: 0, y: 0 } };
    return {
      records: [...state.records, newRecord],
      history: [...state.history, { type: 'create', record: newRecord, timestamp: new Date().toISOString() }]
    };
  }),

  updateRecord: (id, updates) => set((state) => {
    const prevRecord = state.records.find(r => r.id === id);
    if (!prevRecord) return state;

    const newRecords = state.records.map(r => r.id === id ? { ...r, ...updates, status: updates.status || 'changed' } : r);
    return {
      records: newRecords,
      history: [...state.history, { type: 'update', previous: prevRecord, next: { ...prevRecord, ...updates }, timestamp: new Date().toISOString() }]
    };
  }),

  deleteRecord: (id) => set((state) => {
    const record = state.records.find(r => r.id === id);
    if (!record) return state;

    return {
      records: state.records.filter(r => r.id !== id),
      derived: {
        ...state.derived,
        totalCapacity: state.derived.totalCapacity - record.capacity,
        selectedId: state.derived.selectedId === id ? null : state.derived.selectedId
      },
      history: [...state.history, { type: 'delete', record, timestamp: new Date().toISOString() }]
    };
  }),

  selectRecord: (id) => set((state) => ({
    derived: { ...state.derived, selectedId: id }
  })),

  // AC-01: Canonical mutation - place a selected record in a spatial composer and rebalance capacity
  mutateInComposer: (id, position, capacity) => set((state) => {
    const recordIndex = state.records.findIndex(r => r.id === id);
    if (recordIndex === -1) return state;

    const oldRecord = state.records[recordIndex];
    const newRecords = [...state.records];
    newRecords[recordIndex] = {
      ...oldRecord,
      position,
      capacity,
      status: 'ready'
    };

    // Rebalance capacity: ensure total doesn't exceed 1000
    const currentTotal = newRecords.reduce((sum, r) => sum + r.capacity, 0);
    if (currentTotal > 1000) {
      // Revert if invalid (boundary conflict)
      return state;
    }

    const previousState = {
      records: [...state.records],
      derived: { ...state.derived }
    };

    return {
      records: newRecords,
      derived: {
        ...state.derived,
        totalCapacity: currentTotal,
        selectedId: id,
      },
      history: [...state.history, { type: 'composer_mutation', previous: previousState, timestamp: new Date().toISOString() }]
    };
  }),

  undo: () => set((state) => {
    const lastMutationIndex = [...state.history].reverse().findIndex(h => h.type === 'composer_mutation');
    if (lastMutationIndex === -1) return state;

    const actualIndex = state.history.length - 1 - lastMutationIndex;
    const lastMutation = state.history[actualIndex];

    const newHistory = [...state.history];
    newHistory.splice(actualIndex, 1);

    return {
      records: lastMutation.previous.records,
      derived: lastMutation.previous.derived,
      history: newHistory
    };
  }),

  importArtifact: (data) => set(() => {
    if (data?.schemaVersion !== 'v1' || !Array.isArray(data.records)) {
      return {}; // No-op for invalid
    }

    // Basic validation
    const isValid = data.records.every(r => r.id && r.hex && r.status && typeof r.capacity === 'number' && r.position);
    if (!isValid) return {};

    return {
      records: data.records,
      derived: data.derived || { totalCapacity: 0, selectedId: null },
      history: data.history || []
    };
  }),

  clear: () => set(() => ({
    records: [],
    derived: { totalCapacity: 0, selectedId: null },
    history: []
  }))
}));
