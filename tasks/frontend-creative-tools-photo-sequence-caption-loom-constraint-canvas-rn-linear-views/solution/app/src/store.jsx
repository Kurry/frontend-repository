import { createContext, useContext, useReducer } from 'react';
import { photoSequenceCaptionLoomSessionSchema } from './schemas';

const initialState = {
  records: [
    { id: '1', title: 'Mountain Sunset', status: 'draft', canvasState: 'idle' },
    { id: '2', title: 'City Lights', status: 'ready', canvasState: 'idle' },
    { id: '3', title: 'Empty Slot', status: 'empty', canvasState: 'idle' },
  ],
  history: [],
  undoStack: [],
};

export const StateContext = createContext();

export function stateReducer(state, action) {
  switch (action.type) {
    case 'CREATE_RECORD': {
      const newRecord = { ...action.payload, canvasState: 'idle' };
      const nextRecords = [...state.records, newRecord];
      return {
        ...state,
        records: nextRecords,
        undoStack: [...state.undoStack, state.records],
        history: [...state.history, { action: 'CREATE_RECORD', timestamp: new Date().toISOString(), details: { id: newRecord.id } }],
      };
    }
    case 'UPDATE_RECORD': {
      const nextRecords = state.records.map((r) =>
        r.id === action.payload.id ? { ...r, ...action.payload.updates } : r
      );
      return {
        ...state,
        records: nextRecords,
        undoStack: [...state.undoStack, state.records],
        history: [...state.history, { action: 'UPDATE_RECORD', timestamp: new Date().toISOString(), details: { id: action.payload.id } }],
      };
    }
    case 'DELETE_RECORD': {
      const nextRecords = state.records.filter((r) => r.id !== action.payload.id);
      return {
        ...state,
        records: nextRecords,
        undoStack: [...state.undoStack, state.records],
        history: [...state.history, { action: 'DELETE_RECORD', timestamp: new Date().toISOString(), details: { id: action.payload.id } }],
      };
    }
    case 'RESOLVE_CONSTRAINT': {
      // payload: { id, targetLane, originalLane }
      if (action.payload.targetLane === 'conflict') return state; // handled at UI level usually, but just in case
      const nextRecords = state.records.map((r) => {
         if (r.id === action.payload.id) {
           let nextStatus = r.status;
           if (action.payload.targetLane === 'resolved') {
              nextStatus = 'ready';
           } else if (action.payload.targetLane === 'changed') {
              nextStatus = 'changed';
           }
           return { ...r, canvasState: action.payload.targetLane, status: nextStatus };
         }
         return r;
      });
      return {
        ...state,
        records: nextRecords,
        undoStack: [...state.undoStack, state.records],
        history: [...state.history, { action: 'RESOLVE_CONSTRAINT', timestamp: new Date().toISOString(), details: action.payload }],
      };
    }
    case 'UNDO': {
      if (state.undoStack.length === 0) return state;
      const previousRecords = state.undoStack[state.undoStack.length - 1];
      return {
        ...state,
        records: previousRecords,
        undoStack: state.undoStack.slice(0, -1),
        history: [...state.history, { action: 'UNDO', timestamp: new Date().toISOString(), details: null }],
      };
    }
    case 'IMPORT': {
      return {
        ...state,
        records: action.payload.records,
        history: action.payload.history || [],
        undoStack: [],
      };
    }
    case 'CLEAR': {
      return {
        records: [],
        history: [],
        undoStack: [],
      };
    }
    default:
      return state;
  }
}

export function StateProvider({ children }) {
  const [state, dispatch] = useReducer(stateReducer, initialState);
  return (
    <StateContext.Provider value={{ state, dispatch }}>
      {children}
    </StateContext.Provider>
  );
}

export function useAppState() {
  return useContext(StateContext);
}
