import { create } from 'zustand';

export type BookStatus = 'draft' | 'ready' | 'changed' | 'archived';
export type BookReadiness = 'idle' | 'selected' | 'changed' | 'conflict' | 'resolved';

export interface Book {
  id: string;
  title: string;
  status: BookStatus;
  owner: string;
  readiness: BookReadiness;
  createdAt: string;
}

export interface LibraryState {
  records: Book[];
  selectedRecordId: string | null;
  history: Book[][];
  handoffOwner: string | null;
}

interface AppState extends LibraryState {
  setRecords: (records: Book[]) => void;
  addRecord: (record: Omit<Book, 'id' | 'createdAt'>) => void;
  updateRecord: (id: string, updates: Partial<Book>) => void;
  deleteRecord: (id: string) => void;
  selectRecord: (id: string | null) => void;
  undo: () => void;
  connectHandoff: (owner: string, readiness: BookReadiness) => void;
  importSession: (data: any) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useStore = create<AppState>((set, get) => ({
  records: Array.from({ length: 100 }, (_, i) => ({
    id: `book-${i}`,
    title: `Sample Book ${i + 1}`,
    status: i % 4 === 0 ? 'archived' : i % 3 === 0 ? 'draft' : 'ready',
    owner: i % 2 === 0 ? 'Alice' : 'Bob',
    readiness: 'idle',
    createdAt: new Date().toISOString()
  })),
  selectedRecordId: null,
  history: [],
  handoffOwner: null,

  setRecords: (records) => set({ records }),

  addRecord: (record) => set((state) => {
    const newRecords = [...state.records, { ...record, id: generateId(), createdAt: new Date().toISOString() }];
    return { records: newRecords, history: [...state.history, state.records] };
  }),

  updateRecord: (id, updates) => set((state) => {
    const newRecords = state.records.map(r => r.id === id ? { ...r, ...updates } : r);
    return { records: newRecords, history: [...state.history, state.records] };
  }),

  deleteRecord: (id) => set((state) => {
    const newRecords = state.records.filter(r => r.id !== id);
    return { records: newRecords, history: [...state.history, state.records] };
  }),

  selectRecord: (id) => set({ selectedRecordId: id }),

  undo: () => set((state) => {
    if (state.history.length === 0) return state;
    const previousRecords = state.history[state.history.length - 1];
    return {
      records: previousRecords,
      history: state.history.slice(0, -1),
    };
  }),

  connectHandoff: (owner, readiness) => set((state) => {
    if (!state.selectedRecordId) return state;
    const newRecords = state.records.map(r =>
      r.id === state.selectedRecordId ? { ...r, owner, readiness, status: 'changed' as BookStatus } : r
    );
    return {
      records: newRecords,
      history: [...state.history, state.records],
    };
  }),

  importSession: (data) => set({
    records: data.records,
    history: [],
    selectedRecordId: null,
  })
}));
