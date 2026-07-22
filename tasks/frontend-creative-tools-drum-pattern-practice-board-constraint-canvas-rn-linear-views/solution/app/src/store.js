import { useReducer, useEffect, useCallback } from 'react';

const initialState = {
  records: [],
  history: [],
  undoStack: [],
  selectedRecordId: null,
};

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function calculateDerived(records) {
  const lanes = {
    Unconstrained: 0,
    Timing: 0,
    Velocity: 0,
    Polyphony: 0
  };
  const statuses = {
    empty: 0,
    draft: 0,
    ready: 0,
    changed: 0,
    archived: 0
  };

  records.forEach(r => {
    lanes[r.lane]++;
    statuses[r.status]++;
  });

  return { lanes, statuses };
}

function reducer(state, action) {
  const addToUndo = (newState) => {
      // Don't add to undo stack if the only difference is selectedRecordId
      return {
          ...newState,
          undoStack: [...state.undoStack, { records: state.records, history: state.history }]
      }
  }

  switch (action.type) {
    case 'CREATE_RECORD': {
      const newRecord = {
        id: generateId(),
        name: action.payload.name,
        status: action.payload.status,
        lane: 'Unconstrained',
        conflict: false,
      };
      const newHistoryEvent = { type: 'create', recordId: newRecord.id, timestamp: new Date().toISOString() };
      return addToUndo({
        ...state,
        records: [...state.records, newRecord],
        history: [...state.history, newHistoryEvent]
      });
    }
    case 'UPDATE_RECORD': {
      const updatedRecords = state.records.map(r =>
        r.id === action.payload.id ? { ...r, ...action.payload.updates } : r
      );
      const newHistoryEvent = { type: 'update', recordId: action.payload.id, timestamp: new Date().toISOString() };
      return addToUndo({
        ...state,
        records: updatedRecords,
        history: [...state.history, newHistoryEvent]
      });
    }
    case 'DELETE_RECORD': {
      const newHistoryEvent = { type: 'delete', recordId: action.payload, timestamp: new Date().toISOString() };
      return addToUndo({
        ...state,
        records: state.records.filter(r => r.id !== action.payload),
        history: [...state.history, newHistoryEvent],
        selectedRecordId: state.selectedRecordId === action.payload ? null : state.selectedRecordId
      });
    }
    case 'SELECT_RECORD':
      return {
        ...state,
        selectedRecordId: action.payload
      };
    case 'MOVE_RECORD': {
      const { id, lane, requiresResolution } = action.payload;
      const updatedRecords = state.records.map(r =>
        r.id === id ? { ...r, lane, conflict: requiresResolution } : r
      );
      const newHistoryEvent = { type: 'move', recordId: id, lane, timestamp: new Date().toISOString() };
      return addToUndo({
        ...state,
        records: updatedRecords,
        history: [...state.history, newHistoryEvent]
      });
    }
    case 'RESOLVE_CONFLICT': {
      const updatedRecords = state.records.map(r =>
        r.id === action.payload ? { ...r, conflict: false } : r
      );
      const newHistoryEvent = { type: 'resolve', recordId: action.payload, timestamp: new Date().toISOString() };
      return addToUndo({
        ...state,
        records: updatedRecords,
        history: [...state.history, newHistoryEvent]
      });
    }
    case 'UNDO': {
      if (state.undoStack.length === 0) return state;
      const previousState = state.undoStack[state.undoStack.length - 1];
      return {
        ...state,
        records: previousState.records,
        history: previousState.history,
        undoStack: state.undoStack.slice(0, -1),
      };
    }
    case 'CLEAR':
      return {
        records: [],
        history: [],
        undoStack: [],
        selectedRecordId: null
      };
    case 'IMPORT':
      return {
        ...state,
        records: action.payload.records.map(r => ({
            id: r.id,
            name: r.name,
            status: r.status,
            lane: r['constraint-canvasState']?.lane || 'Unconstrained',
            conflict: r['constraint-canvasState']?.conflict || false
        })),
        history: action.payload.history,
        undoStack: [],
        selectedRecordId: null
      };
    default:
      return state;
  }
}

let storeInstance = null;

export function useStore() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const exportSession = useCallback(() => {
    return {
      schemaVersion: 'drum-pattern-v1',
      exportedAt: new Date().toISOString(),
      records: state.records.map(r => ({
        id: r.id,
        name: r.name,
        status: r.status,
        'constraint-canvasState': {
          lane: r.lane,
          conflict: r.conflict
        }
      })),
      derived: calculateDerived(state.records),
      history: state.history
    };
  }, [state]);

  const importSession = useCallback((data) => {
    if (!data || data.schemaVersion !== 'drum-pattern-v1' || !Array.isArray(data.records) || !Array.isArray(data.history)) {
      return false; // Invalid schema
    }

    // Check for duplicate IDs
    const ids = new Set();
    for (const r of data.records) {
        if (ids.has(r.id)) return false;
        ids.add(r.id);

        // validate status
        if (!['empty', 'draft', 'ready', 'changed', 'archived'].includes(r.status)) return false;
        if (r.name?.length > 50) return false;
    }

    dispatch({ type: 'IMPORT', payload: data });
    return true;
  }, []);

  const store = {
    state,
    derived: calculateDerived(state.records),
    dispatch,
    exportSession,
    importSession
  };

  useEffect(() => {
      window._store = store;
  }, [store]);

  return store;
}
