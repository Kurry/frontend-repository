import { create } from 'zustand';
import type { BrewExperiment, CoffeeBrewExperimentLogSession, HistoryEntry, HandoffMapState } from './types';


export interface AppState {
  records: BrewExperiment[];
  history: HistoryEntry[];
  activeRecordId: string | null;
  undoStack: CoffeeBrewExperimentLogSession[];

  createRecord: (record: Omit<BrewExperiment, 'id' | 'status' | 'handoffMapState'>) => void;
  updateRecord: (id: string, record: Partial<Omit<BrewExperiment, 'id'>>) => void;
  deleteRecord: (id: string) => void;
  selectRecord: (id: string | null) => void;

  // The canonical domain mutation
  connectRecordToHandoffOwner: (id: string, owner: string, readiness: HandoffMapState['readiness']) => void;

  undo: () => void;
  clear: () => void;
  importSession: (session: CoffeeBrewExperimentLogSession) => void;
  getDerivedState: () => { summary: string };
  exportSession: () => CoffeeBrewExperimentLogSession;

  // internal helpers to manage state and history
  _pushState: (action: string, recordId?: string, details?: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const INITIAL_RECORDS: BrewExperiment[] = [
  {
    id: 'rec-1',
    title: 'Morning V60',
    beanWeight: 15,
    waterVolume: 250,
    temperature: 92,
    status: 'draft',
    handoffMapState: { owner: '', readiness: 'low' }
  },
  {
    id: 'rec-2',
    title: 'Afternoon AeroPress',
    beanWeight: 18,
    waterVolume: 200,
    temperature: 85,
    status: 'ready',
    handoffMapState: { owner: 'Alice', readiness: 'high' }
  },
  {
    id: 'rec-3',
    title: 'Espresso Test',
    beanWeight: 18,
    waterVolume: 36,
    temperature: 94,
    status: 'changed',
    handoffMapState: { owner: 'Bob', readiness: 'medium' }
  }
];

export const useStore = create<AppState>((set, get) => ({
  records: INITIAL_RECORDS,
  history: [],
  activeRecordId: null,
  undoStack: [],

  _pushState: (action: string, recordId?: string, details: string = '') => {
    set((state) => {
      const currentSession = get().exportSession();
      return {
        undoStack: [...state.undoStack, currentSession],
        history: [...state.history, { timestamp: new Date().toISOString(), action, recordId, details }]
      };
    });
  },

  createRecord: (recordData) => {
    get()._pushState('create_record');
    const newRecord: BrewExperiment = {
      ...recordData,
      id: generateId(),
      status: 'draft',
      handoffMapState: { owner: '', readiness: 'low' }
    };
    set((state) => ({
      records: [...state.records, newRecord]
    }));
  },

  updateRecord: (id, updates) => {
    get()._pushState('update_record', id);
    set((state) => ({
      records: state.records.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      )
    }));
  },

  deleteRecord: (id) => {
    get()._pushState('delete_record', id);
    set((state) => ({
      records: state.records.filter((r) => r.id !== id),
      activeRecordId: state.activeRecordId === id ? null : state.activeRecordId
    }));
  },

  selectRecord: (id) => {
    set({ activeRecordId: id });
  },

  connectRecordToHandoffOwner: (id, owner, readiness) => {
    get()._pushState('connect_handoff_owner', id, `Connected to ${owner} with readiness ${readiness}`);
    set((state) => ({
      records: state.records.map((r) => {
        if (r.id === id) {
          const newStatus = owner && readiness === 'high' ? 'ready' : (owner ? 'changed' : 'draft');
          return {
            ...r,
            status: newStatus,
            handoffMapState: { ...r.handoffMapState, owner, readiness }
          };
        }
        return r;
      }),
      activeRecordId: id
    }));
  },

  undo: () => {
    set((state) => {
      if (state.undoStack.length === 0) return state;
      const prevSession = state.undoStack[state.undoStack.length - 1];
      return {
        records: prevSession.records,
        history: prevSession.history,
        undoStack: state.undoStack.slice(0, -1),
      };
    });
  },

  clear: () => {
    set({
      records: [],
      history: [],
      undoStack: [],
      activeRecordId: null
    });
  },

  importSession: (session: CoffeeBrewExperimentLogSession) => {
    set({
      records: session.records,
      history: session.history,
      undoStack: [],
      activeRecordId: null
    });
  },

  getDerivedState: () => {
    const { records } = get();
    const readyCount = records.filter(r => r.status === 'ready').length;
    return {
      summary: `${records.length} total experiments, ${readyCount} ready for handoff.`
    };
  },

  exportSession: () => {
    const state = get();
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: [...state.records],
      derived: state.getDerivedState(),
      history: [...state.history]
    };
  }
}));
