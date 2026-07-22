import { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { WorkshopStation, CommunityWorkshopToolboardSession, StationStatus } from './types';
import { calculateDerived, createEmptySession } from './utils';

type Action =
  | { type: 'ADD_RECORD'; payload: Omit<WorkshopStation, 'id'> & { id?: string } }
  | { type: 'UPDATE_RECORD'; payload: { id: string; status?: StationStatus; forecastValue?: number; title?: string } }
  | { type: 'ARCHIVE_RECORD'; payload: string }
  | { type: 'UNDO' }
  | { type: 'IMPORT_SESSION'; payload: CommunityWorkshopToolboardSession };

type Dispatch = (action: Action) => void;

const AppContext = createContext<{ state: CommunityWorkshopToolboardSession; dispatch: Dispatch } | undefined>(undefined);

const initialState = createEmptySession();

function appReducer(state: CommunityWorkshopToolboardSession, action: Action): CommunityWorkshopToolboardSession {
  switch (action.type) {
    case 'ADD_RECORD': {
      const newRecord: WorkshopStation = {
        id: action.payload.id || Math.random().toString(36).substring(2, 9),
        title: action.payload.title,
        status: action.payload.status,
        forecastValue: action.payload.forecastValue,
      };
      const newRecords = [...state.records, newRecord];
      const newHistory = [...state.history, newRecords];

      return {
        ...state,
        records: newRecords,
        derived: calculateDerived(newRecords),
        history: newHistory,
      };
    }
    case 'UPDATE_RECORD': {
      const newRecords = state.records.map(record =>
        record.id === action.payload.id ? { ...record, ...action.payload } : record
      );
      const newHistory = [...state.history, newRecords];
      return {
        ...state,
        records: newRecords,
        derived: calculateDerived(newRecords),
        history: newHistory,
      };
    }
    case 'ARCHIVE_RECORD': {
      const newRecords = state.records.map(record =>
        record.id === action.payload ? { ...record, status: 'archived' as StationStatus } : record
      );
      const newHistory = [...state.history, newRecords];
      return {
        ...state,
        records: newRecords,
        derived: calculateDerived(newRecords),
        history: newHistory,
      };
    }
    case 'UNDO': {
      if (state.history.length <= 1) return state; // Nothing to undo
      const newHistory = state.history.slice(0, -1);
      const newRecords = newHistory[newHistory.length - 1];
      return {
        ...state,
        records: newRecords,
        derived: calculateDerived(newRecords),
        history: newHistory,
      };
    }
    case 'IMPORT_SESSION': {
      return action.payload;
    }
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    // Expose webmcp handlers on window
    const exportSession = () => {
      const exportedSession: CommunityWorkshopToolboardSession = {
        ...state,
        exportedAt: new Date().toISOString(),
      };
      return exportedSession;
    };

    window.webmcp_session_info = {
      task: 'eval-intelligence/frontend-planning-community-workshop-toolboard-forecast-ribbon-rn-github-issue-fields',
    };

    window.webmcp_list_tools = () => {
      return [
        {
          name: 'entity_create_record',
          description: 'Create a new workshop station record.',
          input_schema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              status: { type: 'string' },
              forecastValue: { type: 'number' }
            },
            required: ['title', 'status', 'forecastValue']
          }
        },
        {
          name: 'entity_update_record',
          description: 'Update an existing workshop station record\'s status or forecast value.',
          input_schema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              status: { type: 'string' },
              forecastValue: { type: 'number' }
            },
            required: ['id']
          }
        },
        {
          name: 'artifact_export_session_json',
          description: 'Export the current session state to JSON.',
          input_schema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'artifact_import_session_json',
          description: 'Import a session state from a JSON string.',
          input_schema: {
            type: 'object',
            properties: {
              payload_json: { type: 'string' }
            },
            required: ['payload_json']
          }
        }
      ];
    };

    window.webmcp_invoke_tool = async (toolName: string, args: any) => {
      switch (toolName) {
        case 'entity_create_record':
          dispatch({ type: 'ADD_RECORD', payload: args });
          return { status: 'success', message: 'Record created' };
        case 'entity_update_record':
          dispatch({ type: 'UPDATE_RECORD', payload: args });
          return { status: 'success', message: 'Record updated' };
        case 'artifact_export_session_json':
          return { status: 'success', data: exportSession() };
        case 'artifact_import_session_json':
          try {
            const parsed = JSON.parse(args.payload_json);
            if (parsed.schemaVersion !== 'v1') throw new Error('Invalid schemaVersion');
            const valid = {
              ...parsed,
              exportedAt: new Date().toISOString()
            };
            dispatch({ type: 'IMPORT_SESSION', payload: valid });
            return { status: 'success', message: 'Import successful' };
          } catch (e: any) {
            return { status: 'error', message: e.message };
          }
        default:
          throw new Error(`Unknown tool ${toolName}`);
      }
    };
  }, [state, dispatch]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
