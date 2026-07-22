import { createContext, useContext, useReducer, useCallback, useMemo } from 'react';

const INITIAL_RECORDS = [
  { id: 'rec-1', title: 'Chain Replacement', status: 'draft', date: '2023-10-01', mileage: 1500, notes: '', evidenceAttached: false, auditDiscrepancy: false },
  { id: 'rec-2', title: 'Brake Bleed', status: 'ready', date: '2023-10-15', mileage: 1600, notes: 'Rear brake felt spongy', evidenceAttached: true, auditDiscrepancy: false },
  { id: 'rec-3', title: 'Suspension Service', status: 'changed', date: '2023-11-05', mileage: 1800, notes: 'Lower leg service', evidenceAttached: false, auditDiscrepancy: true },
];

const INITIAL_STATE = {
  records: INITIAL_RECORDS,
  history: [], // Stack of previous states for undo
  auditLensState: {
    selectedRecordId: null,
    isResolving: false,
  },
  exportedAt: null
};

// Actions
const SET_STATE = 'SET_STATE';
const ADD_RECORD = 'ADD_RECORD';
const UPDATE_RECORD = 'UPDATE_RECORD';
const DELETE_RECORD = 'DELETE_RECORD';
const SELECT_RECORD = 'SELECT_RECORD';
const RESOLVE_AUDIT = 'RESOLVE_AUDIT';
const UNDO = 'UNDO';

function reducer(state, action) {
  switch (action.type) {
    case SET_STATE:
      return {
        ...action.payload,
        history: [{ ...state, history: [] }, ...state.history]
      };

    case ADD_RECORD: {
      const newState = { ...state, records: [...state.records, action.payload] };
      return { ...newState, history: [{ ...state, history: [] }, ...state.history] };
    }

    case UPDATE_RECORD: {
      const updatedRecords = state.records.map(r => r.id === action.payload.id ? { ...r, ...action.payload } : r);
      const newState = { ...state, records: updatedRecords };
      return { ...newState, history: [{ ...state, history: [] }, ...state.history] };
    }

    case DELETE_RECORD: {
      const filteredRecords = state.records.filter(r => r.id !== action.payload);
      const newAuditState = state.auditLensState.selectedRecordId === action.payload
        ? { ...state.auditLensState, selectedRecordId: null }
        : state.auditLensState;
      const newState = { ...state, records: filteredRecords, auditLensState: newAuditState };
      return { ...newState, history: [{ ...state, history: [] }, ...state.history] };
    }

    case SELECT_RECORD:
      return { ...state, auditLensState: { ...state.auditLensState, selectedRecordId: action.payload } };

    case RESOLVE_AUDIT: {
      // Signature mutation: attach evidence, resolve discrepancy, update status
      const { id, evidence, status } = action.payload;
      const updatedRecords = state.records.map(r => {
        if (r.id === id) {
          return {
             ...r,
             evidenceAttached: evidence,
             auditDiscrepancy: false,
             status: status || 'ready'
          };
        }
        return r;
      });
      const newState = { ...state, records: updatedRecords, auditLensState: { ...state.auditLensState, isResolving: false } };
      return { ...newState, history: [{ ...state, history: [] }, ...state.history] };
    }

    case UNDO: {
      if (state.history.length === 0) return state;
      const previousState = state.history[0];
      const remainingHistory = state.history.slice(1);
      return { ...previousState, history: remainingHistory };
    }

    default:
      return state;
  }
}

export const StoreContext = createContext();

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const derivedState = useMemo(() => {
    return {
      totalRecords: state.records.length,
      discrepanciesCount: state.records.filter(r => r.auditDiscrepancy).length,
      readyCount: state.records.filter(r => r.status === 'ready').length,
      totalMileage: state.records.reduce((sum, r) => sum + (Number(r.mileage) || 0), 0)
    };
  }, [state.records]);

  const value = {
    state,
    derivedState,
    dispatch,
    addRecord: (record) => dispatch({ type: ADD_RECORD, payload: record }),
    updateRecord: (record) => dispatch({ type: UPDATE_RECORD, payload: record }),
    deleteRecord: (id) => dispatch({ type: DELETE_RECORD, payload: id }),
    selectRecord: (id) => dispatch({ type: SELECT_RECORD, payload: id }),
    resolveAudit: (payload) => dispatch({ type: RESOLVE_AUDIT, payload }),
    undo: () => dispatch({ type: UNDO }),
    importState: (newState) => dispatch({ type: SET_STATE, payload: newState })
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}
