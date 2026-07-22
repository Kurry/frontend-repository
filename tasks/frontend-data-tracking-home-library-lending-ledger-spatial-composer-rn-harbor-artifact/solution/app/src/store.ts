import { createContext, useContext } from 'react';

export type BookStatus = 'draft' | 'ready' | 'changed' | 'archived';

export interface SpatialComposerState {
  placed: boolean;
  x: number;
  y: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  status: BookStatus;
  capacity: number;
  spatialComposerState: SpatialComposerState;
}

export interface DerivedState {
  summary: {
    totalCapacity: number;
    placedCapacity: number;
    remainingCapacity: number;
    activeBooks: number;
  };
}

export interface LedgerSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: Book[];
  derived: DerivedState;
  history: any[];
}

export interface StoreState {
  records: Book[];
  history: StoreState[];
  selectedId: string | null;
  error: string | null;
}

type Action =
  | { type: 'ADD_BOOK'; payload: Omit<Book, 'id'> }
  | { type: 'UPDATE_BOOK'; payload: Partial<Book> & { id: string } }
  | { type: 'DELETE_BOOK'; payload: string }
  | { type: 'SELECT_BOOK'; payload: string | null }
  | { type: 'PLACE_IN_COMPOSER'; payload: { id: string; x: number; y: number; newCapacity?: number } }
  | { type: 'UNDO' }
  | { type: 'IMPORT_ARTIFACT'; payload: LedgerSession }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_ERROR'; payload: string };

const initialRecords: Book[] = [
  { id: '1', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '978-0743273565', status: 'ready', capacity: 1, spatialComposerState: { placed: false, x: 0, y: 0 } },
  { id: '2', title: '1984', author: 'George Orwell', isbn: '978-0451524935', status: 'changed', capacity: 2, spatialComposerState: { placed: true, x: 100, y: 50 } },
  { id: '3', title: 'Brave New World', author: 'Aldous Huxley', isbn: '978-0060850524', status: 'draft', capacity: 0, spatialComposerState: { placed: false, x: 0, y: 0 } },
  { id: '4', title: 'Dune', author: 'Frank Herbert', isbn: '978-0441172719', status: 'archived', capacity: 5, spatialComposerState: { placed: false, x: 0, y: 0 } },
];

const initialState: StoreState = {
  records: initialRecords,
  history: [],
  selectedId: null,
  error: null,
};

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case 'ADD_BOOK': {
      const newRecord = { ...action.payload, id: generateId() };
      return {
        ...state,
        records: [...state.records, newRecord],
        history: [...state.history, { ...state, history: [] }],
        error: null,
      };
    }
    case 'UPDATE_BOOK': {
      const newRecords = state.records.map(r => r.id === action.payload.id ? { ...r, ...action.payload } : r);
      return {
        ...state,
        records: newRecords,
        history: [...state.history, { ...state, history: [] }],
        error: null,
      };
    }
    case 'DELETE_BOOK': {
      return {
        ...state,
        records: state.records.filter(r => r.id !== action.payload),
        selectedId: state.selectedId === action.payload ? null : state.selectedId,
        history: [...state.history, { ...state, history: [] }],
        error: null,
      };
    }
    case 'SELECT_BOOK': {
      return {
        ...state,
        selectedId: action.payload,
      };
    }
    case 'PLACE_IN_COMPOSER': {
      const record = state.records.find(r => r.id === action.payload.id);
      if (!record) return state;

      const newCapacity = action.payload.newCapacity !== undefined ? action.payload.newCapacity : record.capacity;

      const newRecords = state.records.map(r => {
        if (r.id === action.payload.id) {
          return {
            ...r,
            status: 'changed' as BookStatus,
            capacity: newCapacity,
            spatialComposerState: {
              placed: true,
              x: action.payload.x,
              y: action.payload.y,
            }
          };
        }
        return r;
      });

      return {
        ...state,
        records: newRecords,
        history: [...state.history, { ...state, history: [] }],
        error: null,
      };
    }
    case 'UNDO': {
      if (state.history.length === 0) return state;
      const previousState = state.history[state.history.length - 1];
      return {
        ...previousState,
        history: state.history.slice(0, -1),
      };
    }
    case 'IMPORT_ARTIFACT': {
      return {
        records: action.payload.records,
        history: [],
        selectedId: null,
        error: null,
      };
    }
    case 'SET_ERROR': {
      return { ...state, error: action.payload };
    }
    case 'CLEAR_ERROR': {
      return { ...state, error: null };
    }
    default:
      return state;
  }
}

export const StoreContext = createContext<{
  state: StoreState;
  dispatch: React.Dispatch<Action>;
  derived: DerivedState;
} | null>(null);

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
}

export function calculateDerivedState(records: Book[]): DerivedState {
  const totalCapacity = records.reduce((sum, r) => sum + r.capacity, 0);
  const placedCapacity = records.filter(r => r.spatialComposerState.placed).reduce((sum, r) => sum + r.capacity, 0);
  const activeBooks = records.filter(r => r.status !== 'archived').length;

  return {
    summary: {
      totalCapacity,
      placedCapacity,
      remainingCapacity: totalCapacity - placedCapacity,
      activeBooks,
    }
  };
}

export { initialState, reducer };
