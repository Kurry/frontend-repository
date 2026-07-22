import { useReducer, useEffect, useCallback } from "react";
import { ConferenceSpeakerGreenroomBoardSession, SpeakerSlotRecord, DerivedState } from "./types";

export type Action =
  | { type: "CREATE_RECORD"; payload: SpeakerSlotRecord }
  | { type: "UPDATE_RECORD"; payload: SpeakerSlotRecord }
  | { type: "DELETE_RECORD"; id: string }
  | { type: "MUTATE_SPATIAL"; id: string; payload: Partial<SpeakerSlotRecord['spatialComposerState']> & { status?: SpeakerSlotRecord['status'] } }
  | { type: "UNDO" }
  | { type: "IMPORT"; payload: ConferenceSpeakerGreenroomBoardSession }
  | { type: "CLEAR" };

const initialState: ConferenceSpeakerGreenroomBoardSession = {
  schemaVersion: "v1",
  exportedAt: new Date().toISOString(),
  records: Array.from({ length: 100 }, (_, i) => ({
    id: `speaker-${i}`,
    speakerName: `Speaker ${i}`,
    topic: `Topic ${i}`,
    duration: 30,
    status: i % 5 === 0 ? "ready" : i % 3 === 0 ? "draft" : "empty",
    spatialComposerState: {
      x: (i % 10) * 80,
      y: Math.floor(i / 10) * 80,
      capacity: 50 + (i % 50),
    }
  })),
  derived: {
    summary: {
      totalCapacity: 0,
      readyCount: 0,
    }
  },
  history: []
};

function calculateDerived(records: SpeakerSlotRecord[]): DerivedState {
  return {
    summary: {
      totalCapacity: records.reduce((acc, r) => acc + r.spatialComposerState.capacity, 0),
      readyCount: records.filter(r => r.status === "ready").length,
    }
  };
}

initialState.derived = calculateDerived(initialState.records);

function reducer(state: ConferenceSpeakerGreenroomBoardSession, action: Action): ConferenceSpeakerGreenroomBoardSession {
  switch (action.type) {
    case "CREATE_RECORD": {
      const newRecords = [...state.records, action.payload];
      const newState = {
        ...state,
        records: newRecords,
        derived: calculateDerived(newRecords),
      };
      return {
        ...newState,
        history: [...state.history, { action: "CREATE_RECORD", timestamp: new Date().toISOString(), stateSnapshot: { schemaVersion: state.schemaVersion, exportedAt: state.exportedAt, records: state.records, derived: state.derived } }]
      };
    }
    case "UPDATE_RECORD": {
      const newRecords = state.records.map(r => r.id === action.payload.id ? action.payload : r);
      const newState = {
        ...state,
        records: newRecords,
        derived: calculateDerived(newRecords),
      };
      return {
        ...newState,
        history: [...state.history, { action: "UPDATE_RECORD", timestamp: new Date().toISOString(), stateSnapshot: { schemaVersion: state.schemaVersion, exportedAt: state.exportedAt, records: state.records, derived: state.derived } }]
      };
    }
    case "DELETE_RECORD": {
      const newRecords = state.records.filter(r => r.id !== action.id);
      const newState = {
        ...state,
        records: newRecords,
        derived: calculateDerived(newRecords),
      };
      return {
        ...newState,
        history: [...state.history, { action: "DELETE_RECORD", timestamp: new Date().toISOString(), stateSnapshot: { schemaVersion: state.schemaVersion, exportedAt: state.exportedAt, records: state.records, derived: state.derived } }]
      };
    }
    case "MUTATE_SPATIAL": {
      const newRecords = state.records.map(r => {
        if (r.id === action.id) {
          return {
            ...r,
            status: action.payload.status || r.status,
            spatialComposerState: {
              ...r.spatialComposerState,
              ...action.payload,
            }
          };
        }
        return r;
      });
      const newState = {
        ...state,
        records: newRecords,
        derived: calculateDerived(newRecords),
      };
      return {
        ...newState,
        history: [...state.history, { action: "MUTATE_SPATIAL", timestamp: new Date().toISOString(), stateSnapshot: { schemaVersion: state.schemaVersion, exportedAt: state.exportedAt, records: state.records, derived: state.derived } }]
      };
    }
    case "UNDO": {
      if (state.history.length === 0) return state;
      const lastHistory = state.history[state.history.length - 1];
      return {
        ...lastHistory.stateSnapshot,
        history: state.history.slice(0, -1),
      };
    }
    case "IMPORT": {
      return action.payload;
    }
    case "CLEAR": {
      return {
        schemaVersion: "v1",
        exportedAt: new Date().toISOString(),
        records: [],
        derived: { summary: { totalCapacity: 0, readyCount: 0 } },
        history: []
      };
    }
    default:
      return state;
  }
}

export function useAppStore() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Expose for WebMCP
  useEffect(() => {
    (window as any)._appState = state;
    (window as any)._appDispatch = dispatch;
  }, [state]);

  const undo = useCallback(() => {
    dispatch({ type: "UNDO" });
  }, []);

  return { state, dispatch, undo };
}
