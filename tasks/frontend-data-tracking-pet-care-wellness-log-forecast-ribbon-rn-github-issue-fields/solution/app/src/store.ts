import { create } from 'zustand';
import type { PetCareEvent, DerivedState, PetCareWellnessLogSession, EditorState } from './types';
import { v4 as uuidv4 } from 'uuid';

interface HistoryState {
  records: PetCareEvent[];
  editor: EditorState;
}

interface AppState {
  records: PetCareEvent[];
  history: HistoryState[];

  editor: EditorState;

  // Actions
  addRecord: (record: Omit<PetCareEvent, 'id'>) => void;
  updateRecord: (id: string, updates: Partial<PetCareEvent>) => void;
  deleteRecord: (id: string) => void;
  selectRecord: (id: string | null) => void;

  // History
  undo: () => void;
  canUndo: () => boolean;

  // Artifact
  exportSession: () => PetCareWellnessLogSession;
  importSession: (session: any) => boolean;
  clearSession: () => void;

  getDerivedState: () => DerivedState;
}

const computeDerivedState = (records: PetCareEvent[]): DerivedState => {
  return {
    summary: {
      totalEvents: records.length,
      completedEvents: records.filter(r => r.status === 'ready' || r.status === 'changed').length,
      upcomingEvents: records.filter(r => r.status === 'draft').length,
      archivedEvents: records.filter(r => r.status === 'archived').length,
    }
  };
};

export const useAppStore = create<AppState>((set, get) => ({
  records: [],
  history: [],
  editor: {
    selectedRecordId: null,
    ribbonProperty: null,
  },

  addRecord: (recordData) => set((state) => {
    const newRecord: PetCareEvent = { ...recordData, id: uuidv4() };
    const newRecords = [...state.records, newRecord];
    return {
      records: newRecords,
      history: [...state.history, { records: state.records, editor: state.editor }],
    };
  }),

  updateRecord: (id, updates) => set((state) => {
    const newRecords = state.records.map(r => r.id === id ? { ...r, ...updates } : r);
    return {
      records: newRecords,
      history: [...state.history, { records: state.records, editor: state.editor }],
    };
  }),

  deleteRecord: (id) => set((state) => {
    const newRecords = state.records.filter(r => r.id !== id);
    const newEditor = state.editor.selectedRecordId === id ? { ...state.editor, selectedRecordId: null } : state.editor;
    return {
      records: newRecords,
      editor: newEditor,
      history: [...state.history, { records: state.records, editor: state.editor }],
    };
  }),

  selectRecord: (id) => set((state) => {
    return {
      editor: { ...state.editor, selectedRecordId: id },
    };
  }),

  undo: () => set((state) => {
    if (state.history.length === 0) return state;
    const previousState = state.history[state.history.length - 1];
    return {
      records: previousState.records,
      editor: previousState.editor,
      history: state.history.slice(0, -1),
    };
  }),

  canUndo: () => get().history.length > 0,

  exportSession: () => {
    const state = get();
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: computeDerivedState(state.records),
      history: state.history.map(h => ({
        schemaVersion: 'v1',
        exportedAt: new Date().toISOString(),
        records: h.records,
        derived: computeDerivedState(h.records),
        history: [], // Avoid deep nesting in history serialization
      }))
    };
  },

  importSession: (session: any) => {
    if (!session || session.schemaVersion !== 'v1' || !Array.isArray(session.records)) {
      return false;
    }

    // Basic validation
    const validRecords = session.records.every((r: any) =>
      r.id && typeof r.id === 'string' &&
      r.title && typeof r.title === 'string' &&
      r.status && ['empty', 'draft', 'ready', 'changed', 'archived'].includes(r.status) &&
      r.priority && ['low', 'medium', 'high'].includes(r.priority) &&
      r.date && typeof r.date === 'string'
    );

    if (!validRecords) return false;

    // Check duplicate IDs
    const ids = new Set(session.records.map((r: any) => r.id));
    if (ids.size !== session.records.length) return false;

    set({
      records: session.records,
      history: [],
      editor: { selectedRecordId: null, ribbonProperty: null },
    });
    return true;
  },

  clearSession: () => set({
    records: [],
    history: [],
    editor: { selectedRecordId: null, ribbonProperty: null },
  }),

  getDerivedState: () => computeDerivedState(get().records),
}));
