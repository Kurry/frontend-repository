import type { AppState, AppAction, Record, DerivedState } from './types';

const initialRecords: Record[] = [
  { id: '1', status: 'draft', title: 'Keynote', speaker: 'Alice', time: '09:00', forecastScore: 80 },
  { id: '2', status: 'ready', title: 'React Performance', speaker: 'Bob', time: '10:00', forecastScore: 90 },
  { id: '3', status: 'empty', title: '', speaker: '', time: '11:00', forecastScore: 0 },
  { id: '4', status: 'changed', title: 'Future of AI', speaker: 'Charlie', time: '13:00', forecastScore: 95 },
  { id: '5', status: 'archived', title: 'Old Talk', speaker: 'Dave', time: '14:00', forecastScore: 50 },
];

const initialState: AppState = {
  records: initialRecords,
  history: [],
  selectedRecordId: null,
  undoStack: [],
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'CREATE_RECORD':
      return {
        ...state,
        records: [...state.records, action.payload],
        undoStack: [...state.undoStack, state.records],
        history: [...state.history, { action: 'create', timestamp: new Date().toISOString(), recordId: action.payload.id }],
      };
    case 'UPDATE_RECORD':
      return {
        ...state,
        records: state.records.map(r => r.id === action.payload.id ? action.payload : r),
        undoStack: [...state.undoStack, state.records],
        history: [...state.history, { action: 'update', timestamp: new Date().toISOString(), recordId: action.payload.id }],
      };
    case 'DELETE_RECORD':
      return {
        ...state,
        records: state.records.filter(r => r.id !== action.payload),
        undoStack: [...state.undoStack, state.records],
        history: [...state.history, { action: 'delete', timestamp: new Date().toISOString(), recordId: action.payload }],
        selectedRecordId: state.selectedRecordId === action.payload ? null : state.selectedRecordId,
      };
    case 'SELECT_RECORD':
      return {
        ...state,
        selectedRecordId: action.payload,
      };
    case 'SET_RECORDS':
      return {
        ...state,
        records: action.payload.records,
        history: action.payload.history,
        undoStack: [],
        selectedRecordId: null,
      };
    case 'UNDO':
      if (state.undoStack.length === 0) return state;
      const prevRecords = state.undoStack[state.undoStack.length - 1];
      return {
        ...state,
        records: prevRecords,
        undoStack: state.undoStack.slice(0, -1),
        history: [...state.history, { action: 'undo', timestamp: new Date().toISOString() }],
      };
    default:
      return state;
  }
}

export function computeDerivedState(records: Record[]): DerivedState {
  const totalRecords = records.length;
  const averageScore = totalRecords > 0 ? records.reduce((sum, r) => sum + r.forecastScore, 0) / totalRecords : 0;
  const statusCounts = records.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });
  return { totalRecords, averageScore, statusCounts };
}

export { initialState, appReducer };
