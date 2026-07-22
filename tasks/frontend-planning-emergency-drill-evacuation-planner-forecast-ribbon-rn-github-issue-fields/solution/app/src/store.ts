import { useSyncExternalStore } from 'react';
import { Checkpoint, DerivedSummary, EvacuationSession } from './types';

// In-memory application state
type State = {
  checkpoints: Checkpoint[];
  selectedId: string | null;
  history: Checkpoint[][]; // Stack of past checkpoints arrays for undo
};

let state: State = {
  checkpoints: [
    {
      id: "cp-1",
      name: "North Wing Exit",
      status: "ready",
      predicted_time: 3,
      target_time: 5,
      headcount: 120
    },
    {
      id: "cp-2",
      name: "Cafeteria Routes",
      status: "draft",
      predicted_time: 7,
      target_time: 6,
      headcount: 250
    },
    {
      id: "cp-3",
      name: "Basement Stairwell",
      status: "archived",
      predicted_time: 12,
      target_time: 10,
      headcount: 15
    }
  ],
  selectedId: null,
  history: []
};

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function pushHistory() {
  state.history.push(JSON.parse(JSON.stringify(state.checkpoints)));
  if (state.history.length > 50) {
    state.history.shift(); // Keep history bounded
  }
}

export const store = {
  getState: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  // Drill Checkpoints Collection Actions
  addCheckpoint: (cp: Checkpoint) => {
    pushHistory();
    state = { ...state, checkpoints: [...state.checkpoints, cp] };
    emitChange();
  },
  updateCheckpoint: (id: string, updates: Partial<Checkpoint>) => {
    pushHistory();
    state = {
      ...state,
      checkpoints: state.checkpoints.map(cp => cp.id === id ? { ...cp, ...updates } : cp)
    };
    emitChange();
  },
  deleteCheckpoint: (id: string) => {
    pushHistory();
    state = {
      ...state,
      checkpoints: state.checkpoints.filter(cp => cp.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId
    };
    emitChange();
  },

  // Forecast Ribbon Actions
  selectCheckpoint: (id: string | null) => {
    state = { ...state, selectedId: id };
    emitChange();
  },
  undo: () => {
    if (state.history.length > 0) {
      const previousCheckpoints = state.history.pop()!;
      state = { ...state, checkpoints: previousCheckpoints };
      // Optional: adjust selectedId if it was deleted in history
      if (state.selectedId && !state.checkpoints.find(c => c.id === state.selectedId)) {
        state.selectedId = null;
      }
      emitChange();
    }
  },

  // Artifact Transfer Actions
  clear: () => {
    pushHistory();
    state = { checkpoints: [], selectedId: null, history: [] };
    emitChange();
  },
  importData: (session: EvacuationSession) => {
    pushHistory();
    state = {
      checkpoints: session.records,
      selectedId: null,
      history: [] // Reset history on import
    };
    emitChange();
  }
};

export function useAppStore() {
  return useSyncExternalStore(store.subscribe, store.getState);
}

// Hook for Derived Summary
export function useDerivedSummary(): DerivedSummary {
  const { checkpoints } = useAppStore();

  const total_checkpoints = checkpoints.length;
  const total_headcount = checkpoints.reduce((sum, cp) => sum + cp.headcount, 0);
  const max_predicted_time = checkpoints.reduce((max, cp) => Math.max(max, cp.predicted_time), 0);
  const avg_target_time = total_checkpoints > 0
    ? checkpoints.reduce((sum, cp) => sum + cp.target_time, 0) / total_checkpoints
    : 0;
  const ready_count = checkpoints.filter(cp => cp.status === 'ready').length;

  return {
    total_checkpoints,
    total_headcount,
    max_predicted_time,
    avg_target_time,
    ready_count
  };
}

// Expose globally for WebMCP tools to manipulate state directly
if (typeof window !== 'undefined') {
  window._appStore = store;
}
