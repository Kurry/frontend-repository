import { useSyncExternalStore } from 'react';

let listeners = [];
let state = {
  records: [],
  filter: 'all',
  selectedRecordId: null,
  spatialGeometry: {},
  history: [],
  undoStack: [],
};

const generateInitialRecords = () => {
  const records = [];
  const statuses = ['empty', 'draft', 'ready', 'changed', 'archived'];
  const types = ['Washer', 'Dryer', 'Refrigerator', 'Oven', 'Dishwasher'];
  for (let i = 1; i <= 100; i++) {
    records.push({
      id: `rec-${i}`,
      name: `Appliance ${i}`,
      type: types[i % types.length],
      status: statuses[i % statuses.length],
      date: new Date(Date.now() - (i % 30) * 86400000).toISOString().split('T')[0],
      capacity: (i % 5) + 1,
    });
  }
  return records;
};

state.records = generateInitialRecords();
state.spatialGeometry = Object.fromEntries(
  state.records.map((r, i) => [r.id, { x: (i % 10) * 120, y: Math.floor(i / 10) * 120 }])
);

const emit = () => {
  listeners.forEach((l) => l());
};

export const store = {
  subscribe: (listener) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
  getSnapshot: () => state,
  dispatch: (action) => {
    const prevState = { ...state };
    let nextState = { ...state };
    let shouldUndo = true;

    switch (action.type) {
      case 'CREATE_RECORD':
        nextState.records = [...state.records, action.payload];
        nextState.spatialGeometry = { ...state.spatialGeometry, [action.payload.id]: { x: 0, y: 0 } };
        break;
      case 'UPDATE_RECORD':
        nextState.records = state.records.map(r => r.id === action.payload.id ? { ...r, ...action.payload } : r);
        break;
      case 'DELETE_RECORD':
        nextState.records = state.records.filter(r => r.id !== action.payload.id);
        if (state.selectedRecordId === action.payload.id) {
          nextState.selectedRecordId = null;
        }
        break;
      case 'SET_FILTER':
        nextState.filter = action.payload;
        shouldUndo = false;
        break;
      case 'SELECT_RECORD':
        nextState.selectedRecordId = action.payload;
        shouldUndo = false;
        break;
      case 'MOVE_RECORD': {
        const { id, x, y } = action.payload;
        nextState.spatialGeometry = { ...state.spatialGeometry, [id]: { x, y } };

        let newRecords = [...state.records];

        // Rebalance capacity logic:
        // If the moved record overlaps with another, exchange a capacity unit between them
        const overlapping = Object.entries(nextState.spatialGeometry).find(
          ([rid, pos]) => rid !== id && Math.abs(pos.x - x) < 60 && Math.abs(pos.y - y) < 60
        );

        if (overlapping) {
           const targetId = overlapping[0];

           // Shift position to resolve physical overlap
           nextState.spatialGeometry = {
               ...nextState.spatialGeometry,
               [targetId]: { x: x + 120, y: y + 120 }
           };

           const movedRec = newRecords.find(r => r.id === id);
           const targetRec = newRecords.find(r => r.id === targetId);

           if (movedRec && targetRec && targetRec.capacity > 1) {
               // Rebalance: move 1 capacity unit from target to moved
               newRecords = newRecords.map(r => {
                   if (r.id === id) return { ...r, capacity: r.capacity + 1, status: 'changed' };
                   if (r.id === targetId) return { ...r, capacity: r.capacity - 1, status: 'changed' };
                   return r;
               });
           } else {
               // Just mark as changed if capacity cannot be rebalanced
               newRecords = newRecords.map(r => {
                   if (r.id === id || r.id === targetId) return { ...r, status: 'changed' };
                   return r;
               });
           }
        } else {
            // No overlap, just mark the moved record as changed
            newRecords = newRecords.map(r => r.id === id ? { ...r, status: 'changed' } : r);
        }

        nextState.records = newRecords;
        break;
      }
      case 'UNDO':
        if (state.undoStack.length > 0) {
           state = state.undoStack[state.undoStack.length - 1];
           emit();
        }
        return;
      case 'IMPORT_STATE':
        nextState = action.payload;
        shouldUndo = false;
        break;
      case 'CLEAR_STATE':
        nextState = {
            records: [],
            filter: 'all',
            selectedRecordId: null,
            spatialGeometry: {},
            history: [],
            undoStack: []
        };
        shouldUndo = false;
        break;
      default:
        break;
    }

    if (shouldUndo) {
        nextState.undoStack = [...state.undoStack, prevState].slice(-50); // keep last 50 states
    }

    state = nextState;
    emit();
  }
};

export const useStore = (selector = s => s) => {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot);
  return selector(state);
};
