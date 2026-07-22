import React, { createContext, useContext, useReducer } from 'react';
import { generateId } from './utils';

const INITIAL_RECORDS = [
  { id: '1', name: 'Living Room Sensor', value: 45, status: 'ready', type: 'PM2.5', timestamp: new Date().toISOString(), 'spatial-composerState': 'idle' },
  { id: '2', name: 'Kitchen Sensor', value: 120, status: 'draft', type: 'PM10', timestamp: new Date().toISOString(), 'spatial-composerState': 'idle' },
  { id: '3', name: 'Bedroom Sensor', value: 15, status: 'empty', type: 'CO2', timestamp: new Date().toISOString(), 'spatial-composerState': 'idle' },
  { id: '4', name: 'Basement Sensor', value: -5, status: 'changed', type: 'PM2.5', timestamp: new Date().toISOString(), 'spatial-composerState': 'idle' }, // Invalid/boundary
];

const initialState = {
  schemaVersion: 'v1',
  exportedAt: null,
  records: INITIAL_RECORDS,
  derived: {
    selectedRecordId: null,
    composerState: 'idle', // idle, selected, changed, conflict, resolved
    capacity: 100, // global capacity for the spatial composer
    usedCapacity: INITIAL_RECORDS.reduce((acc, r) => acc + (r.status === 'ready' ? r.value : 0), 0),
    summary: 'Initial state'
  },
  history: [],
};

const StoreContext = createContext(null);

function calculateUsedCapacity(records) {
    return records.reduce((acc, r) => acc + (r.status === 'ready' && r.value > 0 ? r.value : 0), 0);
}

function validateData(data) {
  if (!data || data.schemaVersion !== 'v1') return false;
  if (!Array.isArray(data.records)) return false;
  if (!data.derived || typeof data.derived !== 'object') return false;

  const ids = new Set();
  const validStatuses = new Set(["empty", "draft", "ready", "changed", "archived"]);

  for (const record of data.records) {
    if (!record.id || ids.has(record.id)) return false;
    ids.add(record.id);

    if (!record.name || typeof record.name !== 'string') return false;
    if (typeof record.value !== 'number' || record.value < -500 || record.value > 5000) return false;
    if (!validStatuses.has(record.status)) return false;
  }

  return true;
}

function reducer(state, action) {
  let newState;
  switch (action.type) {
    case 'CREATE_RECORD': {
      const newRecord = { ...action.payload, id: generateId(), timestamp: new Date().toISOString(), 'spatial-composerState': 'idle' };
      newState = {
        ...state,
        records: [...state.records, newRecord],
      };
      break;
    }
    case 'UPDATE_RECORD': {
      const updatedRecords = state.records.map((r) =>
        r.id === action.payload.id ? { ...r, ...action.payload.updates } : r
      );
      newState = {
        ...state,
        records: updatedRecords,
        derived: { ...state.derived, usedCapacity: calculateUsedCapacity(updatedRecords), summary: 'Record updated' }
      };
      break;
    }
    case 'DELETE_RECORD': {
      const filteredRecords = state.records.filter((r) => r.id !== action.payload);
      newState = {
        ...state,
        records: filteredRecords,
        derived: { ...state.derived, usedCapacity: calculateUsedCapacity(filteredRecords), summary: 'Record deleted' }
      };
      break;
    }
    case 'SELECT_RECORD':
      return {
        ...state,
        derived: {
            ...state.derived,
            selectedRecordId: action.payload,
            composerState: action.payload ? 'selected' : 'idle'
        }
      };
    case 'COMPOSER_MUTATE': {
        // Canonical mutation: place a selected record in a spatial composer and rebalance capacity
        const { recordId, newValue } = action.payload;

        // Find record
        const record = state.records.find(r => r.id === recordId);
        if (!record) return state;

        // Validation / conflict check: cannot exceed total capacity
        const otherCapacity = state.records.filter(r => r.id !== recordId).reduce((acc, r) => acc + (r.status === 'ready' && r.value > 0 ? r.value : 0), 0);

        if (otherCapacity + newValue > state.derived.capacity) {
            return {
                ...state,
                derived: {
                    ...state.derived,
                    composerState: 'conflict',
                    summary: 'Mutation conflict'
                }
            };
        }

        const updatedRecords = state.records.map((r) =>
            r.id === recordId ? { ...r, value: newValue, status: 'changed', 'spatial-composerState': 'placed' } : r
        );

        newState = {
            ...state,
            records: updatedRecords,
            derived: {
                ...state.derived,
                composerState: 'resolved',
                usedCapacity: calculateUsedCapacity(updatedRecords),
                summary: 'Capacity rebalanced'
            }
        };
        break;
    }
    case 'IMPORT_DATA': {
        const data = action.payload;
        if (!validateData(data)) return state; // Invalid import is a no-op

        newState = {
            ...data,
            history: [],
            exportedAt: new Date().toISOString()
        };
        // wipe history on import
        return newState;
    }
    case 'CLEAR_STATE':
        return {
            ...initialState,
            records: [],
            derived: { ...initialState.derived, usedCapacity: 0, summary: 'State cleared' }
        };
    case 'UNDO': {
        if (state.history.length === 0) return state;
        const previousState = state.history[state.history.length - 1];
        return {
            ...previousState,
            history: state.history.slice(0, -1)
        };
    }
    default:
      return state;
  }

  // Push to history for undo if it's a mutating action (and not import/clear/undo/select)
  if (['CREATE_RECORD', 'UPDATE_RECORD', 'DELETE_RECORD', 'COMPOSER_MUTATE'].includes(action.type)) {
      // Omit history from the stored snapshot to avoid infinite nesting
      const stateToStore = { ...state, history: [] };
      newState.history = [...state.history, stateToStore];
  }

  return newState;
}

export { validateData };

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Expose state to window for WebMCP
  React.useEffect(() => {
    window.__APP_STATE = state;
    window.__APP_DISPATCH = dispatch;
  }, [state]);

  // Handle Ctrl/Cmd+Z for undo
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        // Only trigger if not in an input/textarea
        if (!['input', 'textarea'].includes(document.activeElement?.tagName.toLowerCase())) {
          e.preventDefault();
          dispatch({ type: 'UNDO' });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
