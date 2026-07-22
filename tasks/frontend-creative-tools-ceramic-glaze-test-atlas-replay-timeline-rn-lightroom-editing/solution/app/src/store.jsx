import React, { createContext, useContext, useReducer, useEffect } from 'react';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const initialState = {
  records: [
    { id: generateId(), name: "Oxblood Red Test 1", status: "draft", history: [{ timestamp: new Date().toISOString(), status: "draft" }] },
    { id: generateId(), name: "Celadon Wash", status: "ready", history: [{ timestamp: new Date(Date.now() - 86400000).toISOString(), status: "draft" }, { timestamp: new Date().toISOString(), status: "ready" }] },
    { id: generateId(), name: "Matte Black Variation", status: "changed", history: [{ timestamp: new Date().toISOString(), status: "changed" }] },
    { id: generateId(), name: "Clear Gloss Failed", status: "archived", history: [{ timestamp: new Date().toISOString(), status: "archived" }] },
    { id: generateId(), name: "Tenmoku Cone 10", status: "ready", history: [{ timestamp: new Date().toISOString(), status: "ready" }] },
  ],
  selectedId: null,
  undoStack: [],
};

function calculateDerived(records) {
  const readyTests = records.filter(r => r.status === "ready").length;
  let latestChangedAt = null;
  records.forEach(r => {
    r.history.forEach(h => {
      if (!latestChangedAt || new Date(h.timestamp) > new Date(latestChangedAt)) {
        latestChangedAt = h.timestamp;
      }
    });
  });
  return {
    totalTests: records.length,
    readyTests,
    latestChangedAt,
  };
}

const StoreContext = createContext();

export function reducer(state, action) {
  let newState;
  switch (action.type) {
    case 'SET_STATE':
      newState = { ...state, ...action.payload };
      break;
    case 'CREATE_RECORD':
      newState = {
        ...state,
        records: [...state.records, action.payload],
      };
      break;
    case 'UPDATE_RECORD':
      newState = {
        ...state,
        records: state.records.map(r => r.id === action.payload.id ? action.payload : r),
      };
      break;
    case 'DELETE_RECORD':
      newState = {
        ...state,
        records: state.records.filter(r => r.id !== action.payload.id),
        selectedId: state.selectedId === action.payload.id ? null : state.selectedId,
      };
      break;
    case 'SELECT_RECORD':
      newState = {
        ...state,
        selectedId: action.payload,
      };
      break;
    case 'RESTORE_CHECKPOINT': {
      const { id, timestamp } = action.payload;
      const record = state.records.find(r => r.id === id);
      if (!record) return state;

      const checkpointIndex = record.history.findIndex(h => h.timestamp === timestamp);
      if (checkpointIndex === -1) return state;

      const restoredStatus = record.history[checkpointIndex].status;

      newState = {
        ...state,
        records: state.records.map(r => {
          if (r.id === id) {
            return {
              ...r,
              status: restoredStatus,
              history: [...r.history, { timestamp: new Date().toISOString(), status: restoredStatus, note: "Restored checkpoint" }]
            };
          }
          return r;
        }),
      };
      break;
    }
    case 'UNDO':
      if (state.undoStack.length === 0) return state;
      const previousState = state.undoStack[state.undoStack.length - 1];
      return {
        ...previousState,
        undoStack: state.undoStack.slice(0, -1),
      };
    default:
      return state;
  }

  // Push to undo stack for mutative actions
  if (['CREATE_RECORD', 'UPDATE_RECORD', 'DELETE_RECORD', 'RESTORE_CHECKPOINT'].includes(action.type)) {
    newState.undoStack = [...state.undoStack, { records: state.records, selectedId: state.selectedId }];
  }

  return newState;
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Expose for WebMCP
  useEffect(() => {
    window.__appState = state;
    window.__appDispatch = dispatch;
  }, [state]);

  const derived = calculateDerived(state.records);

  return (
    <StoreContext.Provider value={{ state, dispatch, derived }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
