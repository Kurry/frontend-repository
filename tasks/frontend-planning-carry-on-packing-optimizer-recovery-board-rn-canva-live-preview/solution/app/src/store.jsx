import React, { createContext, useReducer, useContext } from 'react';

const initialState = {
  records: [
    { id: '1', name: 'Laptop', category: 'electronics', weight: 1.5, status: 'ready' },
    { id: '2', name: 'Shampoo', category: 'toiletries', weight: 0.3, status: 'changed' },
    { id: '3', name: 'Jacket', category: 'clothing', weight: 0.8, status: 'archived' },
    { id: '4', name: 'Unknown item', category: 'other', weight: -0.1, status: 'conflict' }
  ],
  history: [],
  future: [],
  selectedItemId: null,
  recoveryBoardOpen: false,
};

export const StoreContext = createContext();

function reducer(state, action) {
  switch (action.type) {
    case 'CREATE_RECORD': {
      const newRecord = { ...action.payload, id: Math.random().toString(36).substr(2, 9) };
      const newRecords = [...state.records, newRecord];
      return {
        ...state,
        records: newRecords,
        history: [...state.history, { type: 'CREATE_RECORD', state: state.records }],
        future: []
      };
    }
    case 'UPDATE_RECORD': {
      const newRecords = state.records.map(r => r.id === action.payload.id ? { ...r, ...action.payload } : r);
      return {
        ...state,
        records: newRecords,
        history: [...state.history, { type: 'UPDATE_RECORD', state: state.records }],
        future: []
      };
    }
    case 'DELETE_RECORD': {
      const newRecords = state.records.filter(r => r.id !== action.payload);
      return {
        ...state,
        records: newRecords,
        history: [...state.history, { type: 'DELETE_RECORD', state: state.records }],
        future: []
      };
    }
    case 'OPEN_RECOVERY_BOARD': {
      return { ...state, recoveryBoardOpen: true, selectedItemId: action.payload };
    }
    case 'CLOSE_RECOVERY_BOARD': {
      return { ...state, recoveryBoardOpen: false, selectedItemId: null };
    }
    case 'RESOLVE_CONFLICT': {
      const newRecords = state.records.map(r => r.id === action.payload.id ? { ...r, status: 'ready', ...action.payload.updates } : r);
      return {
        ...state,
        records: newRecords,
        history: [...state.history, { type: 'RESOLVE_CONFLICT', state: state.records }],
        future: [],
        recoveryBoardOpen: false,
        selectedItemId: null
      };
    }
    case 'UNDO': {
      if (state.history.length === 0) return state;
      const lastHistory = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);
      return {
        ...state,
        records: lastHistory.state,
        history: newHistory,
        future: [{ type: lastHistory.type, state: state.records }, ...state.future]
      };
    }
    case 'IMPORT_STATE': {
       return { ...state, ...action.payload, history: [], future: [] }
    }
    case 'CLEAR': {
       return { records: [], history: [], future: [], selectedItemId: null, recoveryBoardOpen: false }
    }
    default:
      return state;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
