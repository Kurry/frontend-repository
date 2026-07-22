import { useReducer } from 'react';

export type Status = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface SleepRecord {
  id: string;
  status: Status;
  lane: 'Queue' | 'Baseline' | 'Variance';
  data: {
    durationHours: number;
    quality: number;
  };
}

export interface Derived {
  summary: string;
  totalRecords: number;
}

export interface EventHistory {
  action: string;
  timestamp: string;
}

export interface AppState {
  records: SleepRecord[];
  history: EventHistory[];
  derived: Derived;
  exportedAt?: string;
  conflictId: string | null;
}

export type Action =
  | { type: 'ADD_RECORD'; payload: SleepRecord }
  | { type: 'UPDATE_RECORD'; payload: SleepRecord }
  | { type: 'DELETE_RECORD'; payload: string }
  | { type: 'MOVE_RECORD'; payload: { id: string; targetLane: 'Queue' | 'Baseline' | 'Variance' } }
  | { type: 'RESOLVE_CONFLICT'; payload: { id: string } }
  | { type: 'UNDO' }
  | { type: 'IMPORT'; payload: AppState }
  | { type: 'CLEAR' };

export const initialState: AppState = {
  records: [
    {
      id: 'r1',
      status: 'ready',
      lane: 'Baseline',
      data: { durationHours: 7, quality: 8 },
    },
    {
      id: 'r2',
      status: 'empty',
      lane: 'Queue',
      data: { durationHours: 0, quality: 0 },
    },
    {
      id: 'r3',
      status: 'draft',
      lane: 'Variance',
      data: { durationHours: 5, quality: 4 },
    }
  ],
  history: [],
  derived: { summary: 'Initialized', totalRecords: 3 },
  conflictId: null,
};

const MAX_HISTORY = 50;

function computeDerived(records: SleepRecord[]): Derived {
  return {
    summary: `${records.length} total records`,
    totalRecords: records.length,
  };
}

let stateHistory: AppState[] = [];

export function appReducer(state: AppState, action: Action): AppState {
  let newState = state;

  switch (action.type) {
    case 'ADD_RECORD':
      newState = {
        ...state,
        records: [...state.records, action.payload],
        history: [...state.history, { action: 'Added record', timestamp: new Date().toISOString() }],
        conflictId: null,
      };
      break;

    case 'UPDATE_RECORD':
      newState = {
        ...state,
        records: state.records.map((r) => (r.id === action.payload.id ? action.payload : r)),
        history: [...state.history, { action: 'Updated record', timestamp: new Date().toISOString() }],
        conflictId: null,
      };
      break;

    case 'DELETE_RECORD':
      newState = {
        ...state,
        records: state.records.filter((r) => r.id !== action.payload),
        history: [...state.history, { action: 'Deleted record', timestamp: new Date().toISOString() }],
        conflictId: null,
      };
      break;

    case 'MOVE_RECORD': {
      const record = state.records.find((r) => r.id === action.payload.id);
      if (!record) return state;

      let isConflict = false;
      let newStatus = record.status;

      if (action.payload.targetLane === 'Variance' && record.status === 'ready') {
         isConflict = true;
         newStatus = 'changed';
      }

      newState = {
        ...state,
        records: state.records.map((r) =>
          r.id === action.payload.id ? { ...r, lane: action.payload.targetLane, status: newStatus } : r
        ),
        conflictId: isConflict ? action.payload.id : null,
        history: [...state.history, { action: `Moved record to ${action.payload.targetLane}`, timestamp: new Date().toISOString() }],
      };
      break;
    }

    case 'RESOLVE_CONFLICT':
      newState = {
        ...state,
        conflictId: null,
        records: state.records.map((r) =>
          r.id === action.payload.id ? { ...r, status: 'ready' } : r
        ),
        history: [...state.history, { action: 'Resolved conflict', timestamp: new Date().toISOString() }],
      };
      break;

    case 'UNDO':
      if (stateHistory.length > 0) {
        return stateHistory.pop()!;
      }
      return state;

    case 'IMPORT':
      newState = action.payload;
      stateHistory = [];
      break;

    case 'CLEAR':
      newState = {
        records: [],
        history: [],
        derived: { summary: 'Cleared', totalRecords: 0 },
        conflictId: null,
      };
      stateHistory = [];
      break;

    default:
      return state;
  }

  // @ts-ignore
  if (action.type !== 'UNDO' && action.type !== 'IMPORT' && action.type !== 'CLEAR') {
    stateHistory.push(state);
    if (stateHistory.length > MAX_HISTORY) stateHistory.shift();
  }

  if (action.type !== 'IMPORT') {
      newState.derived = computeDerived(newState.records);
  }

  return newState;
}

export function useAppStore() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return { state, dispatch };
}
