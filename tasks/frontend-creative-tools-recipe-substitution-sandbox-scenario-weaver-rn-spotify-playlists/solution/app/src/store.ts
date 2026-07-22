import { create } from 'zustand';
import type { RecipeIngredient, RecipeSubstitutionSandboxSession, Summary, HistoryEvent } from './schema';
import { initialRecords } from './schema';

export type ScenarioWeaverState = {
  activeScenario: string | null;
  traceId: string | null;
};

export type AppState = {
  records: RecipeIngredient[];
  history: HistoryEvent[];
  undoStack: RecipeIngredient[][];
  activeScenario: string | null;
  traceId: string | null;
  addRecord: (record: Omit<RecipeIngredient, 'id' | 'scenario-weaverState'>) => void;
  updateRecord: (id: string, updates: Partial<RecipeIngredient>) => void;
  deleteRecord: (id: string) => void;
  branchScenario: (id: string, substitute: string, ratio: string) => void;
  undo: () => void;
  importSession: (session: RecipeSubstitutionSandboxSession) => void;
  exportSession: () => RecipeSubstitutionSandboxSession;
  getDerivedSummary: () => Summary;
};

const generateId = () => Math.random().toString(36).substring(2, 9);
const getTimestamp = () => new Date().toISOString();

export const useStore = create<AppState>((set, get) => ({
  records: initialRecords,
  history: [],
  undoStack: [],
  activeScenario: null,
  traceId: null,

  addRecord: (recordData) => {
    set((state) => {
      const newRecord: RecipeIngredient = {
        ...recordData,
        id: generateId(),
        'scenario-weaverState': 'idle',
      };
      const newRecords = [...state.records, newRecord];
      return {
        undoStack: [...state.undoStack, state.records],
        records: newRecords,
        history: [...state.history, { id: generateId(), action: `Created record ${newRecord.name}`, timestamp: getTimestamp() }],
      };
    });
  },

  updateRecord: (id, updates) => {
    set((state) => {
      const newRecords = state.records.map((r) => (r.id === id ? { ...r, ...updates } : r));
      return {
        undoStack: [...state.undoStack, state.records],
        records: newRecords,
        history: [...state.history, { id: generateId(), action: `Updated record ${id}`, timestamp: getTimestamp() }],
      };
    });
  },

  deleteRecord: (id) => {
    set((state) => {
      const newRecords = state.records.filter((r) => r.id !== id);
      return {
        undoStack: [...state.undoStack, state.records],
        records: newRecords,
        history: [...state.history, { id: generateId(), action: `Deleted record ${id}`, timestamp: getTimestamp() }],
      };
    });
  },

  branchScenario: (id, substitute, ratio) => {
    set((state) => {
      const target = state.records.find((r) => r.id === id);
      if (!target) return state;

      // Simple validation for conflict rejection
      if (target.status === 'empty' || !substitute) {
        return state; // reject incomplete mutation
      }

      const newRecords = state.records.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            substitute,
            substituteRatio: ratio,
            status: 'changed',
            'scenario-weaverState': 'changed',
          } as RecipeIngredient;
        }
        return r;
      });

      return {
        undoStack: [...state.undoStack, state.records],
        records: newRecords,
        activeScenario: id,
        history: [...state.history, { id: generateId(), action: `Branched scenario for ${target.name}`, timestamp: getTimestamp() }],
      };
    });
  },

  undo: () => {
    set((state) => {
      if (state.undoStack.length === 0) return state;
      const prevRecords = state.undoStack[state.undoStack.length - 1];
      const newUndoStack = state.undoStack.slice(0, -1);
      return {
        records: prevRecords,
        undoStack: newUndoStack,
        history: [...state.history, { id: generateId(), action: `Undo action`, timestamp: getTimestamp() }],
      };
    });
  },

  importSession: (session) => {
    set({
      records: session.records,
      history: session.history,
      undoStack: [],
      activeScenario: null,
      traceId: null,
    });
  },

  exportSession: () => {
    const state = get();
    return {
      schemaVersion: 'v1',
      exportedAt: getTimestamp(),
      records: state.records,
      derived: {
        summary: state.getDerivedSummary(),
      },
      history: state.history,
    };
  },

  getDerivedSummary: () => {
    const records = get().records;
    const modifiedItems = records.filter(r => r.status === 'changed' || r['scenario-weaverState'] === 'changed').length;
    return {
      totalItems: records.length,
      modifiedItems,
    };
  },
}));