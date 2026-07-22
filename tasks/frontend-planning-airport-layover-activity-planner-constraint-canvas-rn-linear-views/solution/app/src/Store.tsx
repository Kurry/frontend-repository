import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';

export type Status = 'draft' | 'ready' | 'changed' | 'archived';

export interface Activity {
  id: string;
  title: string;
  status: Status;
  lane: string;
  duration: number; // in minutes
}

export interface DerivedState {
  conflictCount: number;
  readyCount: number;
}

export interface SessionState {
  schemaVersion: 'v1';
  exportedAt: string;
  records: Activity[];
  history: Activity[][];
  derived: DerivedState;
}

const initialRecords: Activity[] = [
  { id: '1', title: 'Security check', status: 'ready', lane: 'Hour 1', duration: 30 },
  { id: '2', title: 'Lounge access', status: 'draft', lane: 'Hour 2', duration: 45 },
  { id: '3', title: 'Gate walk', status: 'draft', lane: 'Hour 3', duration: 15 },
  { id: '4', title: 'Duty free', status: 'archived', lane: 'Hour 2', duration: 30 }
];

function calculateDerived(records: Activity[]): DerivedState {
  const activeRecords = records.filter(r => r.status !== 'archived');
  const laneCounts = activeRecords.reduce((acc, r) => {
    acc[r.lane] = (acc[r.lane] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const conflictCount = Object.values(laneCounts).filter(count => count > 1).length;
  const readyCount = records.filter(r => r.status === 'ready' || r.status === 'changed').length;

  return { conflictCount, readyCount };
}

export type Action =
  | { type: 'CREATE'; payload: Activity }
  | { type: 'UPDATE'; payload: Activity }
  | { type: 'DELETE'; payload: string }
  | { type: 'UNDO' }
  | { type: 'IMPORT'; payload: SessionState }
  | { type: 'CLEAR_HISTORY' };

const initialState: SessionState = {
  schemaVersion: 'v1',
  exportedAt: new Date().toISOString(),
  records: initialRecords,
  history: [],
  derived: calculateDerived(initialRecords),
};

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'CREATE': {
      const newRecords = [...state.records, action.payload];
      return {
        ...state,
        records: newRecords,
        history: [...state.history, state.records],
        derived: calculateDerived(newRecords)
      };
    }
    case 'UPDATE': {
      const newRecords = state.records.map(r => r.id === action.payload.id ? action.payload : r);
      return {
        ...state,
        records: newRecords,
        history: [...state.history, state.records],
        derived: calculateDerived(newRecords)
      };
    }
    case 'DELETE': {
      const newRecords = state.records.filter(r => r.id !== action.payload);
      return {
        ...state,
        records: newRecords,
        history: [...state.history, state.records],
        derived: calculateDerived(newRecords)
      };
    }
    case 'UNDO': {
      if (state.history.length === 0) return state;
      const prevRecords = state.history[state.history.length - 1];
      return {
        ...state,
        records: prevRecords,
        history: state.history.slice(0, -1),
        derived: calculateDerived(prevRecords)
      };
    }
    case 'IMPORT': {
      return {
        ...action.payload,
        history: []
      };
    }
    case 'CLEAR_HISTORY': {
      return {
        ...state,
        history: []
      };
    }
    default:
      return state;
  }
}

export const StoreContext = createContext<{
  state: SessionState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    (window as any).webmcp_session_info = async () => ({
      task_id: "eval-intelligence/frontend-planning-airport-layover-activity-planner-constraint-canvas-rn-linear-views",
      version: "1.0.0"
    });

    (window as any).webmcp_list_tools = async () => [
      {
        name: "entity_create_record",
        description: "Create a new activity",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            lane: { type: "string" },
            duration: { type: "number" },
            status: { type: "string", enum: ['draft', 'ready', 'changed', 'archived'] }
          },
          required: ["title", "lane", "duration", "status"]
        }
      },
      {
        name: "entity_update_record",
        description: "Update an activity property",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            property: { type: "string" },
            value: { type: "string" }
          },
          required: ["id", "property", "value"]
        }
      },
      {
        name: "entity_delete_record",
        description: "Delete (archive) an activity",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            confirm: { type: "boolean" }
          },
          required: ["id", "confirm"]
        }
      },
      {
        name: "artifact_export_session_json",
        description: "Export the session",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "artifact_import_session_json",
        description: "Import a session",
        inputSchema: {
          type: "object",
          properties: {
            payload: { type: "object" }
          },
          required: ["payload"]
        }
      }
    ];
  }, []);

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      <WebMCPBridge state={state} dispatch={dispatch} />
      {children}
    </StoreContext.Provider>
  );
}

function WebMCPBridge({ state, dispatch }: { state: SessionState, dispatch: React.Dispatch<Action> }) {
  useEffect(() => {
    (window as any).webmcp_invoke_tool = async (tool: string, args: any) => {
      if (tool === "entity_create_record") {
        const newRecord: Activity = {
          id: Math.random().toString(36).substr(2, 9),
          title: args.title,
          lane: args.lane,
          duration: args.duration,
          status: args.status
        };
        dispatch({ type: 'CREATE', payload: newRecord });
        return { result: "created" };
      }
      if (tool === "entity_update_record") {
        const record = state.records.find(r => r.id === args.id);
        if (record) {
          const updated = { ...record, [args.property]: args.value };
          dispatch({ type: 'UPDATE', payload: updated });
          return { result: "updated" };
        }
        return { error: "not found" };
      }
      if (tool === "entity_delete_record") {
        if (args.confirm) {
          dispatch({ type: 'DELETE', payload: args.id });
          return { result: "deleted" };
        }
        return { error: "confirm required" };
      }
      if (tool === "artifact_export_session_json") {
        const exportData = {
          ...state,
          exportedAt: new Date().toISOString()
        };
        return { data: exportData };
      }
      if (tool === "artifact_import_session_json") {
        if (args.payload && args.payload.schemaVersion === 'v1' && Array.isArray(args.payload.records)) {
          dispatch({ type: 'IMPORT', payload: args.payload });
          return { result: "imported" };
        }
        return { error: "invalid payload" };
      }
      throw new Error(`Unknown tool: ${tool}`);
    };
  }, [state, dispatch]);

  return null;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
