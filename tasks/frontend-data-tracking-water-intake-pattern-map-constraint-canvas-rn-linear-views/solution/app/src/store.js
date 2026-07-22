import { useState, useCallback, useMemo } from 'react';

// Seed initial records (100+)
const initialRecords = Array.from({ length: 120 }, (_, i) => {
  const statuses = ['draft', 'ready', 'changed', 'archived'];
  return {
    id: `record-${i}`,
    amount: 100 + (i % 10) * 50,
    time: new Date(Date.now() - i * 3600000).toISOString(),
    status: statuses[i % statuses.length],
  };
});

let sessionState = {
  schemaVersion: 'v1',
  exportedAt: new Date().toISOString(),
  records: initialRecords,
  derived: {
    summary: 'Initial state'
  },
  history: [] // the undo stack
};

// Observers for global state subscription
const listeners = new Set();

export const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getSessionState = () => sessionState;

export const updateState = (newState, pushHistory = true) => {
  if (pushHistory) {
    sessionState = {
      ...newState,
      history: [...sessionState.history, sessionState], // basic undo stack
    };
  } else {
    sessionState = newState;
  }

  // Recompute derived state
  sessionState.derived = {
    summary: `Total records: ${sessionState.records.length}`
  };

  listeners.forEach(l => l(sessionState));
};

export const undo = () => {
  if (sessionState.history.length === 0) return;
  const history = [...sessionState.history];
  const prevState = history.pop();
  sessionState = {
    ...prevState,
    history
  };
  listeners.forEach(l => l(sessionState));
};

export const importSession = (parsedSession) => {
  sessionState = {
    ...parsedSession,
    schemaVersion: 'v1',
    exportedAt: new Date().toISOString(),
    history: []
  };
  listeners.forEach(l => l(sessionState));
};

// Helper hook
export function useStore() {
  const [state, setState] = useState(getSessionState());

  useMemo(() => {
    const unsub = subscribe(setState);
    return unsub;
  }, []);

  return state;
}

export function updateRecord(id, updates) {
  const state = getSessionState();
  const records = state.records.map(r => r.id === id ? { ...r, ...updates } : r);
  updateState({ ...state, records });
}

export function addRecord(record) {
  const state = getSessionState();
  updateState({ ...state, records: [record, ...state.records] });
}

export function deleteRecord(id) {
  const state = getSessionState();
  updateState({ ...state, records: state.records.filter(r => r.id !== id) });
}
