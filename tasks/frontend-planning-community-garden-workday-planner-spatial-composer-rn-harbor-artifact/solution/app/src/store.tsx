import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { WorkdayTask, CommunityGardenWorkdayPlannerSession } from './schemas';

// --- State Types ---
export interface AppState {
  records: WorkdayTask[];
  history: any[];
  filterStatus: string | null;
  selectedTaskId: string | null;
}

export type Action =
  | { type: 'CREATE_TASK'; payload: WorkdayTask }
  | { type: 'UPDATE_TASK'; payload: WorkdayTask }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_FILTER'; payload: string | null }
  | { type: 'SELECT_TASK'; payload: string | null }
  | { type: 'PLACE_IN_COMPOSER'; payload: { taskId: string; x: number; y: number; zone: string; rebalanceCapacity: number } }
  | { type: 'UNDO' }
  | { type: 'IMPORT_STATE'; payload: CommunityGardenWorkdayPlannerSession }
  | { type: 'CLEAR_STATE' };

const INITIAL_RECORDS: WorkdayTask[] = Array.from({ length: 100 }, (_, i) => ({
  id: `task-${i + 1}`,
  title: `Work Task ${i + 1}`,
  status: i % 5 === 0 ? 'empty' : i % 5 === 1 ? 'draft' : i % 5 === 2 ? 'ready' : i % 5 === 3 ? 'changed' : 'archived',
  assignedCapacity: Math.floor(Math.random() * 20) + 5,
}));

const INITIAL_STATE: AppState = {
  records: INITIAL_RECORDS,
  history: [],
  filterStatus: null,
  selectedTaskId: null,
};

let stateHistory: AppState[] = [];
const saveHistory = (state: AppState) => {
    stateHistory.push(state);
    if(stateHistory.length > 50) stateHistory.shift();
}

export const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'CREATE_TASK': {
      saveHistory(state);
      const newRecord = action.payload;
      return {
        ...state,
        records: [...state.records, newRecord],
        history: [...state.history, { id: crypto.randomUUID(), type: 'CREATE', timestamp: new Date().toISOString(), recordId: newRecord.id }]
      };
    }
    case 'UPDATE_TASK': {
      saveHistory(state);
      const newRecords = state.records.map(r => r.id === action.payload.id ? action.payload : r);
      return {
        ...state,
        records: newRecords,
        history: [...state.history, { id: crypto.randomUUID(), type: 'UPDATE', timestamp: new Date().toISOString(), recordId: action.payload.id }]
      };
    }
    case 'DELETE_TASK': {
      saveHistory(state);
      return {
        ...state,
        records: state.records.filter(r => r.id !== action.payload),
        history: [...state.history, { id: crypto.randomUUID(), type: 'DELETE', timestamp: new Date().toISOString(), recordId: action.payload }],
        selectedTaskId: state.selectedTaskId === action.payload ? null : state.selectedTaskId
      };
    }
    case 'SET_FILTER':
      return { ...state, filterStatus: action.payload };
    case 'SELECT_TASK':
      return { ...state, selectedTaskId: action.payload };
    case 'PLACE_IN_COMPOSER': {
        saveHistory(state);
        const { taskId, x, y, zone, rebalanceCapacity } = action.payload;
        const newRecords = state.records.map(r => {
            if (r.id === taskId) {
                return {
                    ...r,
                    status: 'changed' as const, // Force type to TaskStatus
                    assignedCapacity: rebalanceCapacity,
                    'spatial-composerState': { placed: true, x, y, zone }
                };
            }
            return r;
        });

        return {
            ...state,
            records: newRecords,
            history: [...state.history, { id: crypto.randomUUID(), type: 'PLACE', timestamp: new Date().toISOString(), recordId: taskId }]
        };
    }
    case 'UNDO': {
        if (stateHistory.length > 0) {
            const prevState = stateHistory.pop()!;
            return {
                ...prevState,
                filterStatus: state.filterStatus
            };
        }
        return state;
    }
    case 'IMPORT_STATE': {
      saveHistory(state);
      return {
          ...state,
          records: action.payload.records,
          history: action.payload.history,
          selectedTaskId: null
      };
    }
    case 'CLEAR_STATE': {
        saveHistory(state);
        return {
            ...INITIAL_STATE,
            records: [],
            history: []
        };
    }
    default:
      return state;
  }
};

export const computeDerived = (records: WorkdayTask[]) => {
    let totalCapacity = 0;
    let placedCount = 0;

    for (const r of records) {
        if (r['spatial-composerState']?.placed) {
            placedCount++;
            totalCapacity += r.assignedCapacity;
        }
    }

    return {
        totalCapacity,
        placedCount,
        unplacedCount: records.length - placedCount,
        rebalanced: placedCount > 0
    };
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  derived: ReturnType<typeof computeDerived>;
} | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE);
  const derived = computeDerived(state.records);

  return (
    <AppContext.Provider value={{ state, dispatch, derived }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
};
