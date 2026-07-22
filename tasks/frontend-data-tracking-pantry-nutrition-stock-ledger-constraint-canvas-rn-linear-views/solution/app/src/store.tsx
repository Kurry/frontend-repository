import React, { createContext, useReducer, useContext } from "react";
import type { ReactNode } from "react";
import type { IngredientRecord, DomainStatus, HistoryEvent } from "./types";

export interface AppState {
  records: IngredientRecord[];
  history: HistoryEvent[];
  undoStack: AppState[];
  selectedRecordId: string | null;
}

type Action =
  | { type: "CREATE_RECORD"; payload: IngredientRecord }
  | { type: "UPDATE_RECORD"; payload: IngredientRecord }
  | { type: "DELETE_RECORD"; payload: string }
  | { type: "SELECT_RECORD"; payload: string | null }
  | { type: "UPDATE_STATUS"; payload: { id: string; status: DomainStatus } }
  | { type: "UNDO" }
  | { type: "IMPORT_STATE"; payload: AppState }
  | { type: "CLEAR_STATE" };

const initialState: AppState = {
  records: [],
  history: [],
  undoStack: [],
  selectedRecordId: null,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "CREATE_RECORD": {
      const newState = {
        ...state,
        records: [...state.records, action.payload],
        history: [
          ...state.history,
          { action: "create", timestamp: new Date().toISOString(), recordId: action.payload.id },
        ],
        undoStack: [...state.undoStack, state],
      };
      return newState;
    }
    case "UPDATE_RECORD": {
      const newState = {
        ...state,
        records: state.records.map((r) => (r.id === action.payload.id ? action.payload : r)),
        history: [
          ...state.history,
          { action: "update", timestamp: new Date().toISOString(), recordId: action.payload.id },
        ],
        undoStack: [...state.undoStack, state],
      };
      return newState;
    }
    case "DELETE_RECORD": {
      const newState = {
        ...state,
        records: state.records.filter((r) => r.id !== action.payload),
        history: [
          ...state.history,
          { action: "delete", timestamp: new Date().toISOString(), recordId: action.payload },
        ],
        selectedRecordId: state.selectedRecordId === action.payload ? null : state.selectedRecordId,
        undoStack: [...state.undoStack, state],
      };
      return newState;
    }
    case "SELECT_RECORD":
      return { ...state, selectedRecordId: action.payload };
    case "UPDATE_STATUS": {
      const newState = {
        ...state,
        records: state.records.map((r) =>
          r.id === action.payload.id ? { ...r, status: action.payload.status } : r
        ),
        history: [
          ...state.history,
          {
            action: "update_status",
            timestamp: new Date().toISOString(),
            recordId: action.payload.id,
            details: { newStatus: action.payload.status },
          },
        ],
        undoStack: [...state.undoStack, state],
      };
      return newState;
    }
    case "UNDO": {
      if (state.undoStack.length === 0) return state;
      const previousState = state.undoStack[state.undoStack.length - 1];
      return {
        ...previousState,
        undoStack: state.undoStack.slice(0, -1),
      };
    }
    case "IMPORT_STATE":
      return action.payload;
    case "CLEAR_STATE":
      return initialState;
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Setup global handle for webmcp to access store
  React.useEffect(() => {
      if (typeof window !== "undefined") {
          (window as any).__store = {
              getState: () => state,
              dispatch,
          };
      }
  }, [state]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppStore must be used within AppProvider");
  return context;
};
