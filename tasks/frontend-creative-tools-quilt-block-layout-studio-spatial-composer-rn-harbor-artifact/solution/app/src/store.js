import { create } from 'zustand'

export const useStore = create((set, get) => ({
  records: [],
  history: [],
  spatialComposerState: {
    selectedId: null,
    capacity: 100,
    placedRecords: [], // array of { id, x, y, width, height, isConflict }
    status: 'idle', // 'idle', 'selected', 'changed', 'conflict', 'resolved'
  },
  derived: {
    summary: {
      totalBlocks: 0,
      usedCapacity: 0,
      remainingCapacity: 100,
      hasConflicts: false,
    }
  },

  // Actions for Quilt Blocks Collection
  addRecord: (record) => set((state) => ({
    records: [...state.records, record],
  })),

  updateRecord: (id, updates) => set((state) => ({
    records: state.records.map(r => r.id === id ? { ...r, ...updates } : r)
  })),

  deleteRecord: (id) => set((state) => {
    const updatedRecords = state.records.filter(r => r.id !== id);
    return { records: updatedRecords };
  }),

  setRecords: (records) => set(() => ({ records })),

  // Actions for Spatial Composer
  selectRecordForPlacement: (id) => set((state) => ({
    spatialComposerState: {
      ...state.spatialComposerState,
      selectedId: id,
      status: 'selected'
    }
  })),

  placeRecord: (id, x, y, width, height) => set((state) => {
    // 1. check for overlaps/conflicts with other placed records
    const newPlacement = { id, x, y, width, height, isConflict: false };
    let hasConflicts = false;
    let newPlacedRecords = state.spatialComposerState.placedRecords.filter(p => p.id !== id);

    // basic collision check
    for (let p of newPlacedRecords) {
       if (x < p.x + p.width && x + width > p.x &&
           y < p.y + p.height && y + height > p.y) {
           newPlacement.isConflict = true;
           hasConflicts = true;
       }
    }

    // 2. boundary check / capacity check
    const area = width * height;
    const currentUsedCapacity = state.derived.summary.usedCapacity;
    const oldPlacement = state.spatialComposerState.placedRecords.find(p => p.id === id);
    const oldArea = oldPlacement ? (oldPlacement.width * oldPlacement.height) : 0;

    if (x < 0 || y < 0 || x + width > 100 || y + height > 100) {
       newPlacement.isConflict = true;
       hasConflicts = true;
    }

    if (currentUsedCapacity - oldArea + area > state.spatialComposerState.capacity) {
        newPlacement.isConflict = true;
        hasConflicts = true;
    }

    if (hasConflicts) {
      // Reject incomplete mutation per requirements
      return {
        spatialComposerState: {
          ...state.spatialComposerState,
          status: 'conflict'
        }
      };
    }

    newPlacedRecords.push(newPlacement);

    // Save state for undo
    const oldStateSnapshot = {
        records: JSON.parse(JSON.stringify(state.records)),
        spatialComposerState: JSON.parse(JSON.stringify(state.spatialComposerState)),
        derived: JSON.parse(JSON.stringify(state.derived))
    };

    // Calculate derived
    const newUsedCapacity = newPlacedRecords.reduce((acc, p) => acc + (p.width * p.height), 0);
    const newDerived = {
        summary: {
            totalBlocks: state.records.length,
            usedCapacity: newUsedCapacity,
            remainingCapacity: state.spatialComposerState.capacity - newUsedCapacity,
            hasConflicts: false
        }
    };

    // Update linked record status
    const updatedRecords = state.records.map(r => r.id === id ? { ...r, status: 'changed' } : r);

    return {
        history: [...state.history, oldStateSnapshot],
        records: updatedRecords,
        spatialComposerState: {
            ...state.spatialComposerState,
            placedRecords: newPlacedRecords,
            status: 'resolved',
            selectedId: null
        },
        derived: newDerived
    };
  }),

  undo: () => set((state) => {
    if (state.history.length === 0) return {};
    const lastState = state.history[state.history.length - 1];
    return {
        records: lastState.records,
        spatialComposerState: lastState.spatialComposerState,
        derived: lastState.derived,
        history: state.history.slice(0, -1)
    };
  }),

  // Artifact handling
  importArtifact: (data) => set(() => {
    // Validate schema
    if (data.schemaVersion !== 'v1') return {};
    if (!data.records || !data.spatialComposerState || !data.derived) return {};
    // Generate new exportedAt on import (actually done during export or validation, but we can update state if needed, though requirements say "regenerates exportedAt" which we handle on export, but if we need it in state...)
    return {
        records: data.records,
        spatialComposerState: data.spatialComposerState,
        derived: data.derived,
        history: data.history || []
    };
  }),

  clearSession: () => set(() => ({
    records: [],
    history: [],
    spatialComposerState: {
        selectedId: null,
        capacity: 100,
        placedRecords: [],
        status: 'idle',
    },
    derived: {
        summary: {
            totalBlocks: 0,
            usedCapacity: 0,
            remainingCapacity: 100,
            hasConflicts: false,
        }
    }
  }))
}));
