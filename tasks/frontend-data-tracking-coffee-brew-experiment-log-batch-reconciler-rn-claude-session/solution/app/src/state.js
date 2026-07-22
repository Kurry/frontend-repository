import { useState, useCallback, useMemo } from 'react';

const generateId = () => Math.random().toString(36).substring(2, 9);

const initialRecords = [
  { id: '1', name: 'Morning Brew 1', status: 'ready', beans: 20, water: 300, yield: 260, batch: null },
  { id: '2', name: 'Afternoon Espresso', status: 'draft', beans: 18, water: 36, yield: 36, batch: null },
  { id: '3', name: 'V60 Test', status: 'changed', beans: 15, water: 250, yield: 220, batch: 'batch-1' },
  { id: '4', name: 'Cold Brew Batch', status: 'archived', beans: 100, water: 1000, yield: 800, batch: null },
];

let globalState = {
  records: initialRecords,
  history: [],
  schemaVersion: 'v1',
  exportedAt: null
};

// Calculate derived state
globalState.derived = {
  summary: globalState.records.reduce((acc, r) => acc + (Number(r.beans) || 0), 0)
};

let listeners = [];
const subscribe = (listener) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
};

const notify = () => {
  listeners.forEach(l => l());
};

export const getState = () => globalState;

export const dispatch = (action) => {
  let nextRecords = [...globalState.records];
  let nextHistory = [...globalState.history];

  switch(action.type) {
    case 'CREATE_RECORD':
      nextHistory.push(JSON.parse(JSON.stringify(globalState.records)));
      nextRecords.push({ id: generateId(), status: 'empty', batch: null, beans: 0, water: 0, yield: 0, ...action.payload });
      break;
    case 'UPDATE_RECORD':
      nextHistory.push(JSON.parse(JSON.stringify(globalState.records)));
      nextRecords = nextRecords.map(r => r.id === action.payload.id ? { ...r, ...action.payload } : r);
      break;
    case 'DELETE_RECORD':
      nextHistory.push(JSON.parse(JSON.stringify(globalState.records)));
      nextRecords = nextRecords.filter(r => r.id !== action.payload.id);
      break;
    case 'BATCH_RECONCILE':
      const { ids, batchId } = action.payload;
      const recordsToUpdate = nextRecords.filter(r => ids.includes(r.id));
      if (recordsToUpdate.length !== ids.length) return; // Conflict/incomplete

      nextHistory.push(JSON.parse(JSON.stringify(globalState.records)));

      nextRecords = nextRecords.map(r =>
        ids.includes(r.id) ? { ...r, batch: batchId, status: 'ready' } : r
      );
      break;
    case 'UNDO':
      if (nextHistory.length > 0) {
        nextRecords = nextHistory.pop();
      }
      break;
    case 'IMPORT':
      if (action.payload.schemaVersion !== 'v1' || !Array.isArray(action.payload.records)) {
        return; // Malformed schema
      }

      // Validate all records to ensure they meet constraints
      let isValid = true;
      const idSet = new Set();

      for (const r of action.payload.records) {
        // Unique IDs
        if (idSet.has(r.id)) { isValid = false; break; }
        idSet.add(r.id);

        // Boundaries
        const beans = Number(r.beans);
        const water = Number(r.water);
        const y = Number(r.yield);

        if (isNaN(beans) || beans < 1 || beans > 200) isValid = false;
        if (isNaN(water) || water < 1 || water > 2000) isValid = false;
        if (isNaN(y) || y < 0 || y > 2000) isValid = false;

        const validStatuses = ['empty', 'draft', 'ready', 'changed', 'archived'];
        if (!validStatuses.includes(r.status)) isValid = false;
      }

      if (isValid) {
        globalState = {
          ...action.payload,
          history: [] // Reset history on import
        };
        // Recompute derived just in case
        globalState.derived = {
          summary: globalState.records.reduce((acc, r) => acc + (Number(r.beans) || 0), 0)
        };
        notify();
      }
      return;
    case 'CLEAR':
      nextRecords = [];
      nextHistory = [];
      break;
  }

  globalState = {
    ...globalState,
    records: nextRecords,
    history: nextHistory,
    derived: {
      summary: nextRecords.reduce((acc, r) => acc + (Number(r.beans) || 0), 0)
    }
  };
  notify();
};

export const useAppState = () => {
  const [state, setState] = useState(globalState);

  React.useEffect(() => {
    return subscribe(() => setState(globalState));
  }, []);

  return state;
};
