import { create } from 'zustand';
import type { DomainState, DrillCheckpoint, EmergencyDrillEvacuationPlannerSession, RecoveryState, SessionHistoryEvent } from './types';
import { formatISO } from 'date-fns';

export interface AppState {
  records: DrillCheckpoint[];
  recoveryState: RecoveryState;
  selectedRecordId: string | null;
  history: SessionHistoryEvent[];
  undoStack: DrillCheckpoint[][];

  seed: (records: DrillCheckpoint[]) => void;
  createRecord: (record: Omit<DrillCheckpoint, 'id' | 'status'>) => void;
  updateRecord: (id: string, record: Partial<DrillCheckpoint>) => void;
  deleteRecord: (id: string) => void;
  setFilter: (filter: DomainState | 'all') => void;
  filter: DomainState | 'all';

  selectForRecovery: (id: string) => void;
  resolveRecovery: (id: string, newStatus: DomainState, repairData?: Partial<DrillCheckpoint>) => void;
  undo: () => void;

  importSession: (session: EmergencyDrillEvacuationPlannerSession) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useStore = create<AppState>((set) => ({
  records: [],
  recoveryState: 'idle',
  selectedRecordId: null,
  history: [],
  undoStack: [],
  filter: 'all',

  seed: (records) => set({ records }),

  createRecord: (data) => set((state) => {
    const newRecord: DrillCheckpoint = {
      ...data,
      id: generateId(),
      status: 'draft',
    };
    const newHistory: SessionHistoryEvent = { action: 'create', timestamp: formatISO(new Date()), recordId: newRecord.id };
    return {
      records: [...state.records, newRecord],
      history: [...state.history, newHistory],
      undoStack: [...state.undoStack, state.records],
    };
  }),

  updateRecord: (id, data) => set((state) => {
    const newRecords = state.records.map(r => r.id === id ? { ...r, ...data } : r);
    const newHistory: SessionHistoryEvent = { action: 'update', timestamp: formatISO(new Date()), recordId: id };
    return {
      records: newRecords,
      history: [...state.history, newHistory],
      undoStack: [...state.undoStack, state.records],
    };
  }),

  deleteRecord: (id) => set((state) => {
    const newRecords = state.records.filter(r => r.id !== id);
    const newHistory: SessionHistoryEvent = { action: 'delete', timestamp: formatISO(new Date()), recordId: id };
    return {
      records: newRecords,
      history: [...state.history, newHistory],
      undoStack: [...state.undoStack, state.records],
      selectedRecordId: state.selectedRecordId === id ? null : state.selectedRecordId,
      recoveryState: state.selectedRecordId === id ? 'idle' : state.recoveryState,
    };
  }),

  setFilter: (filter) => set({ filter }),

  selectForRecovery: (id) => set(() => ({
    selectedRecordId: id,
    recoveryState: 'selected',
  })),

  resolveRecovery: (id, newStatus, repairData = {}) => set((state) => {
    const newRecords = state.records.map(r => r.id === id ? { ...r, status: newStatus, ...repairData } : r);
    const newHistory: SessionHistoryEvent = { action: 'resolve_recovery', timestamp: formatISO(new Date()), recordId: id };
    return {
      records: newRecords,
      recoveryState: 'resolved',
      history: [...state.history, newHistory],
      undoStack: [...state.undoStack, state.records],
    };
  }),

  undo: () => set((state) => {
    if (state.undoStack.length === 0) return state;
    const previousRecords = state.undoStack[state.undoStack.length - 1];
    const newHistory: SessionHistoryEvent = { action: 'undo', timestamp: formatISO(new Date()) };
    return {
      records: previousRecords,
      undoStack: state.undoStack.slice(0, -1),
      history: [...state.history, newHistory],
    };
  }),

  importSession: (session) => set({
    records: session.records,
    history: session.history,
    undoStack: [],
    recoveryState: 'idle',
    selectedRecordId: null,
  }),
}));

export const getDerivedState = (records: DrillCheckpoint[]) => {
  const drafts = records.filter(r => r.status === 'draft').length;
  const ready = records.filter(r => r.status === 'ready').length;
  const archived = records.filter(r => r.status === 'archived').length;
  return {
    summary: `Drafts: ${drafts} | Ready: ${ready} | Archived: ${archived}`,
    totalDrafts: drafts,
    totalReady: ready,
    totalArchived: archived,
  };
};
