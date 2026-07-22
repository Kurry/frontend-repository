import { createContext, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type LessonStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface ScenarioState {
  isBranched: boolean;
  baseRecordId: string | null;
  outcomeNotes: string;
}

export interface LessonBlock {
  id: string;
  title: string;
  details: string;
  status: LessonStatus;
  scenarioState: ScenarioState;
  createdAt: string;
  updatedAt: string;
}

export interface DerivedState {
  summary: {
    totalBlocks: number;
    readyBlocks: number;
    scenarioBranches: number;
  };
}

export interface EventHistory {
  action: string;
  timestamp: string;
  recordId?: string;
}

export interface AppState {
  schemaVersion: 'v1';
  exportedAt: string;
  records: LessonBlock[];
  derived: DerivedState;
  history: EventHistory[];

  // App internal state (not exported in exact same form if not needed, but keeps track of UI)
  selectedRecordId: string | null;
  historyStack: { records: LessonBlock[]; derived: DerivedState; history: EventHistory[] }[];
}

export type Action =
  | { type: 'CREATE_RECORD'; payload: { title: string; details: string; status: LessonStatus } }
  | { type: 'UPDATE_RECORD'; payload: { id: string; title: string; details: string; status: LessonStatus } }
  | { type: 'DELETE_RECORD'; payload: string }
  | { type: 'SELECT_RECORD'; payload: string | null }
  | { type: 'BRANCH_SCENARIO'; payload: { id: string; outcomeNotes: string } }
  | { type: 'UNDO' }
  | { type: 'IMPORT_STATE'; payload: AppState }
  | { type: 'CLEAR_STATE' };

const computeDerivedState = (records: LessonBlock[]): DerivedState => {
  return {
    summary: {
      totalBlocks: records.filter(r => r.status !== 'archived').length,
      readyBlocks: records.filter(r => r.status === 'ready').length,
      scenarioBranches: records.filter(r => r.scenarioState.isBranched).length,
    }
  };
};

export const initialState: AppState = {
  schemaVersion: 'v1',
  exportedAt: new Date().toISOString(),
  records: [],
  derived: { summary: { totalBlocks: 0, readyBlocks: 0, scenarioBranches: 0 } },
  history: [],
  selectedRecordId: null,
  historyStack: [],
};

// Seeding 100+ items as required by AC-09 (Performance) - we will do this via a function
export const seedRecords = (count: number): LessonBlock[] => {
  const statuses: LessonStatus[] = ['empty', 'draft', 'ready', 'changed', 'archived'];
  const records: LessonBlock[] = [];
  for (let i = 0; i < count; i++) {
    records.push({
      id: uuidv4(),
      title: `Lesson Block ${i + 1}`,
      details: `Details for lesson block ${i + 1}...`,
      status: statuses[i % statuses.length],
      scenarioState: { isBranched: false, baseRecordId: null, outcomeNotes: '' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  return records;
};

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'CREATE_RECORD': {
      const newRecord: LessonBlock = {
        id: uuidv4(),
        title: action.payload.title,
        details: action.payload.details,
        status: action.payload.status,
        scenarioState: { isBranched: false, baseRecordId: null, outcomeNotes: '' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const newRecords = [...state.records, newRecord];
      const newHistory = [...state.history, { action: 'CREATE', timestamp: new Date().toISOString(), recordId: newRecord.id }];
      return {
        ...state,
        records: newRecords,
        derived: computeDerivedState(newRecords),
        history: newHistory,
        historyStack: [...state.historyStack, { records: state.records, derived: state.derived, history: state.history }],
      };
    }
    case 'UPDATE_RECORD': {
      const newRecords = state.records.map(r =>
        r.id === action.payload.id ? { ...r, ...action.payload, updatedAt: new Date().toISOString() } : r
      );
      const newHistory = [...state.history, { action: 'UPDATE', timestamp: new Date().toISOString(), recordId: action.payload.id }];
      return {
        ...state,
        records: newRecords,
        derived: computeDerivedState(newRecords),
        history: newHistory,
        historyStack: [...state.historyStack, { records: state.records, derived: state.derived, history: state.history }],
      };
    }
    case 'DELETE_RECORD': {
      const newRecords = state.records.map(r =>
        r.id === action.payload ? { ...r, status: 'archived' as LessonStatus, updatedAt: new Date().toISOString() } : r
      );
      const newHistory = [...state.history, { action: 'DELETE (ARCHIVE)', timestamp: new Date().toISOString(), recordId: action.payload }];
      return {
        ...state,
        records: newRecords,
        selectedRecordId: state.selectedRecordId === action.payload ? null : state.selectedRecordId,
        derived: computeDerivedState(newRecords),
        history: newHistory,
        historyStack: [...state.historyStack, { records: state.records, derived: state.derived, history: state.history }],
      };
    }
    case 'SELECT_RECORD': {
      return { ...state, selectedRecordId: action.payload };
    }
    case 'BRANCH_SCENARIO': {
      // Signature mutation: branch a selected record into a scenario and compare linked outcomes
      const baseRecord = state.records.find(r => r.id === action.payload.id);
      if (!baseRecord) return state;

      const branchedRecord: LessonBlock = {
        ...baseRecord,
        id: uuidv4(),
        status: 'changed',
        scenarioState: {
          isBranched: true,
          baseRecordId: baseRecord.id,
          outcomeNotes: action.payload.outcomeNotes,
        },
        updatedAt: new Date().toISOString(),
      };

      const newRecords = [...state.records, branchedRecord];
      const newHistory = [...state.history, { action: 'BRANCH_SCENARIO', timestamp: new Date().toISOString(), recordId: branchedRecord.id }];

      return {
        ...state,
        records: newRecords,
        selectedRecordId: branchedRecord.id,
        derived: computeDerivedState(newRecords),
        history: newHistory,
        historyStack: [...state.historyStack, { records: state.records, derived: state.derived, history: state.history }],
      };
    }
    case 'UNDO': {
      if (state.historyStack.length === 0) return state;
      const previousState = state.historyStack[state.historyStack.length - 1];

      // If the selected record no longer exists, deselect
      const selectedStillExists = previousState.records.some(r => r.id === state.selectedRecordId);

      return {
        ...state,
        records: previousState.records,
        derived: previousState.derived,
        history: previousState.history,
        selectedRecordId: selectedStillExists ? state.selectedRecordId : null,
        historyStack: state.historyStack.slice(0, -1),
      };
    }
    case 'IMPORT_STATE': {
      return {
        ...action.payload,
        selectedRecordId: null,
        historyStack: [],
      };
    }
    case 'CLEAR_STATE': {
      return {
        ...initialState,
      };
    }
    default:
      return state;
  }
}

export const StateContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | undefined>(undefined);

export const useStateContext = () => {
  const context = useContext(StateContext);
  if (!context) throw new Error('useStateContext must be used within StateProvider');
  return context;
};
