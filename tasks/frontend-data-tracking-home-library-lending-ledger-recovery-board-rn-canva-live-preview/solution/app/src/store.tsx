import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { AppState, Action, BookRecord, initialState, SessionArtifact } from './types';

// Omit history from the state being pushed to past to prevent deep nesting
const getStateSnapshot = (state: AppState): AppState => ({
  records: state.records.map(r => ({ ...r })),
  selectedRecordId: state.selectedRecordId,
  history: { past: [], present: null } // We don't save history within history
});

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'CREATE_RECORD': {
      const newState = {
        ...state,
        records: [...state.records, action.payload],
        history: {
          past: [...state.history.past, getStateSnapshot(state)],
          present: null
        }
      };
      return newState;
    }
    case 'UPDATE_RECORD': {
      const newState = {
        ...state,
        records: state.records.map((r) =>
          r.id === action.payload.id ? action.payload : r
        ),
        history: {
          past: [...state.history.past, getStateSnapshot(state)],
          present: null
        }
      };
      return newState;
    }
    case 'DELETE_RECORD': {
      const newState = {
        ...state,
        records: state.records.filter((r) => r.id !== action.payload),
        selectedRecordId: state.selectedRecordId === action.payload ? null : state.selectedRecordId,
        history: {
          past: [...state.history.past, getStateSnapshot(state)],
          present: null
        }
      };
      return newState;
    }
    case 'MOVE_TO_RECOVERY': {
      const newState = {
        ...state,
        records: state.records.map((r) =>
          r.id === action.payload.id
            ? { ...r, status: 'recovery' as const, recoveryReason: action.payload.reason }
            : r
        ),
        selectedRecordId: action.payload.id,
        history: {
          past: [...state.history.past, getStateSnapshot(state)],
          present: null
        }
      };
      return newState;
    }
    case 'RESOLVE_RECOVERY': {
      const newState = {
        ...state,
        records: state.records.map((r) =>
          r.id === action.payload.id
            ? { ...action.payload, status: 'ready' as const, recoveryReason: undefined, recoveryNote: undefined }
            : r
        ),
        selectedRecordId: null, // Clear selection after resolving
        history: {
          past: [...state.history.past, getStateSnapshot(state)],
          present: null
        }
      };
      return newState;
    }
    case 'SELECT_RECORD':
      return { ...state, selectedRecordId: action.payload };
    case 'IMPORT_ARTIFACT':
      // Overwrite completely, including history
      return {
        records: action.payload.records,
        selectedRecordId: null,
        history: { past: [], present: null } // Wipe history on import to match artifact state if needed, or could load history if serialized. We keep it simple.
      };
    case 'UNDO': {
      if (state.history.past.length === 0) return state;
      const previous = state.history.past[state.history.past.length - 1];
      const newPast = state.history.past.slice(0, -1);
      return {
        ...previous,
        history: {
          past: newPast,
          present: null
        }
      };
    }
    default:
      return state;
  }
}

const StoreContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
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
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
