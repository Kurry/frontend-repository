import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import { HomeAirQualityTrendbookSessionSchema } from './types';
import type { HomeAirQualityTrendbookSession, AirQualityRecord, AirQualityStatusType } from './types';

// Actions
export type Action =
  | { type: 'CREATE_RECORD'; payload: AirQualityRecord }
  | { type: 'UPDATE_RECORD'; payload: AirQualityRecord }
  | { type: 'DELETE_RECORD'; payload: { id: string } }
  | { type: 'UPDATE_RECORD_STATUS'; payload: { id: string; status: AirQualityStatusType } }
  | { type: 'IMPORT_SESSION'; payload: HomeAirQualityTrendbookSession }
  | { type: 'UNDO' }
  | { type: 'CLEAR_HISTORY' };

interface AppState extends HomeAirQualityTrendbookSession {
  past: HomeAirQualityTrendbookSession[];
}

const getInitialSession = (): HomeAirQualityTrendbookSession => ({
  schemaVersion: 'v1',
  exportedAt: new Date().toISOString(),
  records: [
    { id: '1', status: 'Draft', reading: 45, room: 'Living Room', timestamp: new Date().toISOString() },
    { id: '2', status: 'Ready', reading: 120, room: 'Kitchen', timestamp: new Date().toISOString() },
    { id: '3', status: 'Draft', reading: 80, room: 'Bedroom', timestamp: new Date().toISOString() },
  ],
  derived: { summary: {} },
  history: []
});

const calculateDerived = (records: AirQualityRecord[]) => {
  const summary: Record<string, number> = {};
  records.forEach(r => {
    summary[r.status] = (summary[r.status] || 0) + 1;
  });
  return { summary };
};

const getInitialState = (): AppState => {
  const session = getInitialSession();
  session.derived = calculateDerived(session.records);
  return {
    ...session,
    past: []
  };
};

const reducer = (state: AppState, action: Action): AppState => {
  let newState = { ...state };
  let newRecords = [...state.records];
  let newHistory = [...state.history];

  if (action.type !== 'UNDO' && action.type !== 'CLEAR_HISTORY' && action.type !== 'IMPORT_SESSION') {
    newState.past = [...state.past, {
      schemaVersion: state.schemaVersion,
      exportedAt: state.exportedAt,
      records: [...state.records],
      derived: { ...state.derived },
      history: [...state.history]
    }];
  }

  switch (action.type) {
    case 'CREATE_RECORD':
      newRecords.push(action.payload);
      newHistory.push({ action: 'CREATE_RECORD', recordId: action.payload.id, timestamp: new Date().toISOString() });
      break;
    case 'UPDATE_RECORD':
      newRecords = newRecords.map(r => r.id === action.payload.id ? action.payload : r);
      newHistory.push({ action: 'UPDATE_RECORD', recordId: action.payload.id, timestamp: new Date().toISOString() });
      break;
    case 'DELETE_RECORD':
      newRecords = newRecords.filter(r => r.id !== action.payload.id);
      newHistory.push({ action: 'DELETE_RECORD', recordId: action.payload.id, timestamp: new Date().toISOString() });
      break;
    case 'UPDATE_RECORD_STATUS':
      newRecords = newRecords.map(r => r.id === action.payload.id ? { ...r, status: action.payload.status } : r);
      newHistory.push({ action: 'UPDATE_RECORD_STATUS', recordId: action.payload.id, timestamp: new Date().toISOString() });
      break;
    case 'IMPORT_SESSION':
      const result = HomeAirQualityTrendbookSessionSchema.safeParse(action.payload);
      if (result.success) {
        return {
          ...result.data,
          exportedAt: new Date().toISOString(), // regenerate
          past: []
        };
      } else {
        return state; // No-op on invalid import
      }
    case 'UNDO':
      if (state.past.length > 0) {
        const previousState = state.past[state.past.length - 1];
        return {
          ...previousState,
          past: state.past.slice(0, -1)
        };
      }
      return state;
    case 'CLEAR_HISTORY':
      return { ...state, past: [] };
    default:
      return state;
  }

  newState.records = newRecords;
  newState.history = newHistory;
  newState.derived = calculateDerived(newRecords);

  return newState;
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, getInitialState());

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
