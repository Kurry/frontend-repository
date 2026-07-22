import { createContext, useContext, useReducer, useMemo } from 'react';

// Domain Enums
export const STATES = ['empty', 'draft', 'ready', 'changed', 'archived'];

// Initial State
const initialState = {
  records: [],
  selectedRecordId: null,
  forecastProjection: null,
  undoStack: [], // Array of previous state snapshots (excluding undoStack)
};

// Reducer Actions
export const ACTIONS = {
  SET_STATE: 'SET_STATE', // for Import/Clear
  CREATE_RECORD: 'CREATE_RECORD',
  UPDATE_RECORD: 'UPDATE_RECORD',
  DELETE_RECORD: 'DELETE_RECORD',
  REORDER_RECORDS: 'REORDER_RECORDS',
  SELECT_RECORD: 'SELECT_RECORD',
  SET_FORECAST_PROJECTION: 'SET_FORECAST_PROJECTION', // For compare mode in ribbon
  APPLY_PROJECTION: 'APPLY_PROJECTION', // Adjust active record on forecast ribbon
  UNDO: 'UNDO',
};

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function calculateDerivedState(records, projection = null, selectedRecordId = null) {
  // Apply projection to selected record for summary calculation
  const workingRecords = records.map(r => {
    if (r.id === selectedRecordId && projection) {
      return { ...r, ...projection };
    }
    return r;
  });

  const totalDuration = workingRecords.filter(r => r.state !== 'archived').reduce((acc, r) => acc + (Number(r.duration) || 0), 0);
  const activeCount = workingRecords.filter(r => r.state === 'ready' || r.state === 'changed').length;

  return {
    totalDuration,
    activeCount,
    totalRecords: workingRecords.length,
    projectionActive: !!projection
  };
}

function reducer(state, action) {
  let newState = { ...state };
  let saveHistory = false;

  switch (action.type) {
    case ACTIONS.SET_STATE:
      newState = { ...action.payload, undoStack: [] };
      break;

    case ACTIONS.CREATE_RECORD:
      newState.records = [...state.records, {
        id: generateId(),
        name: action.payload.name || 'New Layer',
        state: 'empty',
        duration: action.payload.duration || 0,
        volume: action.payload.volume !== undefined ? action.payload.volume : 100,
        ...action.payload
      }];
      saveHistory = true;
      break;

    case ACTIONS.UPDATE_RECORD:
      newState.records = state.records.map(r =>
        r.id === action.payload.id ? { ...r, ...action.payload.updates } : r
      );
      saveHistory = true;
      break;

    case ACTIONS.DELETE_RECORD:
      newState.records = state.records.filter(r => r.id !== action.payload.id);
      if (newState.selectedRecordId === action.payload.id) {
        newState.selectedRecordId = null;
        newState.forecastProjection = null;
      }
      saveHistory = true;
      break;

    case ACTIONS.REORDER_RECORDS:
      // simple move
      const { fromIndex, toIndex } = action.payload;
      const reordered = [...state.records];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);
      newState.records = reordered;
      saveHistory = true;
      break;

    case ACTIONS.SELECT_RECORD:
      newState.selectedRecordId = action.payload.id;
      newState.forecastProjection = null; // reset projection on new selection
      break;

    case ACTIONS.SET_FORECAST_PROJECTION:
      newState.forecastProjection = action.payload; // e.g., { duration: 120, state: 'ready' }
      break;

    case ACTIONS.APPLY_PROJECTION:
      if (state.selectedRecordId && state.forecastProjection) {
        newState.records = state.records.map(r =>
          r.id === state.selectedRecordId ? { ...r, ...state.forecastProjection } : r
        );
        newState.forecastProjection = null;
        saveHistory = true;
      }
      break;

    case ACTIONS.UNDO:
      if (state.undoStack.length > 0) {
        const previousState = state.undoStack[state.undoStack.length - 1];
        newState = {
          ...previousState,
          undoStack: state.undoStack.slice(0, -1)
        };
      }
      break;

    default:
      return state;
  }

  if (saveHistory) {
    const snapshot = {
      records: state.records,
      selectedRecordId: state.selectedRecordId,
      forecastProjection: state.forecastProjection,
    };
    newState.undoStack = [...state.undoStack, snapshot];
  }

  return newState;
}

const StoreContext = createContext();

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const derived = useMemo(() => {
    return calculateDerivedState(state.records, state.forecastProjection, state.selectedRecordId);
  }, [state.records, state.forecastProjection, state.selectedRecordId]);

  const value = { state, dispatch, derived };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}
