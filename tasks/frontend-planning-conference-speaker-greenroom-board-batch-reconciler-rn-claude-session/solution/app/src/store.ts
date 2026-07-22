import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type SlotStatus = 'draft' | 'ready' | 'changed' | 'archived' | 'conflict' | 'resolved';

export interface SpeakerSlot {
  id: string;
  speakerName: string;
  topic: string;
  startTime: string; // HH:mm format
  durationMinutes: number;
  status: SlotStatus;
  batchReconcilerState?: 'selected' | 'idle';
}

export interface DerivedState {
  summary: {
    totalSlots: number;
    totalDuration: number;
    readyCount: number;
    archivedCount: number;
  };
}

export interface SessionHistoryEntry {
  timestamp: string;
  action: string;
  details: string;
}

export interface ConferenceSpeakerGreenroomBoardSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: SpeakerSlot[];
  derived: DerivedState;
  history: SessionHistoryEntry[];
}

export interface AppState {
  records: SpeakerSlot[];
  history: SessionHistoryEntry[];
  selectedIds: Set<string>;
  pastStates: { records: SpeakerSlot[], history: SessionHistoryEntry[], selectedIds: Set<string> }[];

  // Actions
  addRecord: (record: Omit<SpeakerSlot, 'id' | 'status'>) => void;
  updateRecord: (id: string, updates: Partial<Omit<SpeakerSlot, 'id'>>) => void;
  deleteRecord: (id: string) => void;
  archiveRecord: (id: string) => void;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;

  // Batch action
  reconcileBatch: () => void;

  // Undo
  undo: () => void;

  // Export/Import
  exportSession: () => ConferenceSpeakerGreenroomBoardSession;
  importSession: (session: any) => { success: boolean; error?: string };
}

const calculateDerived = (records: SpeakerSlot[]): DerivedState => {
  return {
    summary: {
      totalSlots: records.length,
      totalDuration: records.reduce((acc, r) => acc + (r.status !== 'archived' ? r.durationMinutes : 0), 0),
      readyCount: records.filter(r => r.status === 'ready').length,
      archivedCount: records.filter(r => r.status === 'archived').length,
    }
  };
};

const INITIAL_RECORDS: SpeakerSlot[] = [
  { id: '1', speakerName: 'Alice Smith', topic: 'Future of UI', startTime: '09:00', durationMinutes: 45, status: 'ready', batchReconcilerState: 'idle' },
  { id: '2', speakerName: 'Bob Jones', topic: 'State Machines in React', startTime: '10:00', durationMinutes: 30, status: 'draft', batchReconcilerState: 'idle' },
  { id: '3', speakerName: 'Carol White', topic: 'CSS Architecture', startTime: '10:45', durationMinutes: 45, status: 'draft', batchReconcilerState: 'idle' }
];

export const useStore = create<AppState>((set, get) => ({
  records: INITIAL_RECORDS,
  history: [],
  selectedIds: new Set<string>(),
  pastStates: [],

  addRecord: (record) => set((state) => {
    const newRecord: SpeakerSlot = {
      ...record,
      id: uuidv4(),
      status: 'draft',
      batchReconcilerState: 'idle'
    };
    const newRecords = [...state.records, newRecord];
    const newHistory = [...state.history, { timestamp: new Date().toISOString(), action: 'create', details: `Created slot for ${record.speakerName}` }];

    return {
      pastStates: [...state.pastStates, { records: state.records, history: state.history, selectedIds: state.selectedIds }],
      records: newRecords,
      history: newHistory
    };
  }),

  updateRecord: (id, updates) => set((state) => {
    const newRecords = state.records.map(r => r.id === id ? { ...r, ...updates, status: updates.status || 'changed' as SlotStatus } : r);
    const newHistory = [...state.history, { timestamp: new Date().toISOString(), action: 'update', details: `Updated slot ${id}` }];

    return {
      pastStates: [...state.pastStates, { records: state.records, history: state.history, selectedIds: state.selectedIds }],
      records: newRecords,
      history: newHistory
    };
  }),

  deleteRecord: (id) => set((state) => {
    const newRecords = state.records.filter(r => r.id !== id);
    const newSelected = new Set(state.selectedIds);
    newSelected.delete(id);
    const newHistory = [...state.history, { timestamp: new Date().toISOString(), action: 'delete', details: `Deleted slot ${id}` }];

    return {
      pastStates: [...state.pastStates, { records: state.records, history: state.history, selectedIds: state.selectedIds }],
      records: newRecords,
      selectedIds: newSelected,
      history: newHistory
    };
  }),

  archiveRecord: (id) => set((state) => {
    const newRecords = state.records.map(r => r.id === id ? { ...r, status: 'archived' as SlotStatus, batchReconcilerState: 'idle' as const } : r);
    const newSelected = new Set(state.selectedIds);
    newSelected.delete(id);
    const newHistory = [...state.history, { timestamp: new Date().toISOString(), action: 'archive', details: `Archived slot ${id}` }];

    return {
      pastStates: [...state.pastStates, { records: state.records, history: state.history, selectedIds: state.selectedIds }],
      records: newRecords,
      selectedIds: newSelected,
      history: newHistory
    };
  }),

  toggleSelection: (id) => set((state) => {
    const newSelected = new Set(state.selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    const newRecords = state.records.map(r =>
      r.id === id ? { ...r, batchReconcilerState: newSelected.has(id) ? 'selected' as const : 'idle' as const } : r
    );
    return {
      records: newRecords,
      selectedIds: newSelected
    };
  }),

  selectAll: () => set((state) => {
    const activeRecords = state.records.filter(r => r.status !== 'archived');
    const newSelected = new Set(activeRecords.map(r => r.id));
    const newRecords = state.records.map(r =>
      newSelected.has(r.id) ? { ...r, batchReconcilerState: 'selected' as const } : r
    );
    return {
      records: newRecords,
      selectedIds: newSelected
    };
  }),

  clearSelection: () => set((state) => {
    const newRecords = state.records.map(r => ({ ...r, batchReconcilerState: 'idle' as const }));
    return {
      records: newRecords,
      selectedIds: new Set()
    };
  }),

  reconcileBatch: () => set((state) => {
    if (state.selectedIds.size === 0) return state;

    const newRecords = state.records.map(r => {
      if (state.selectedIds.has(r.id)) {
        // Resolve the slots to ready and clear their selection
        return { ...r, status: 'ready' as SlotStatus, batchReconcilerState: 'idle' as const };
      }
      return r;
    });

    const newHistory = [...state.history, {
      timestamp: new Date().toISOString(),
      action: 'batch_reconcile',
      details: `Reconciled ${state.selectedIds.size} slots to ready state`
    }];

    return {
      pastStates: [...state.pastStates, { records: state.records, history: state.history, selectedIds: state.selectedIds }],
      records: newRecords,
      selectedIds: new Set(),
      history: newHistory
    };
  }),

  undo: () => set((state) => {
    if (state.pastStates.length === 0) return state;

    const previousState = state.pastStates[state.pastStates.length - 1];
    return {
      records: previousState.records,
      history: previousState.history,
      selectedIds: previousState.selectedIds,
      pastStates: state.pastStates.slice(0, -1)
    };
  }),

  exportSession: () => {
    const state = get();
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: calculateDerived(state.records),
      history: state.history
    };
  },

  importSession: (session: any) => {
    if (!session || session.schemaVersion !== 'v1' || !Array.isArray(session.records)) {
      return { success: false, error: 'Malformed schema or invalid version' };
    }

    // Basic validation
    const hasInvalidStatus = session.records.some((r: any) => !['draft', 'ready', 'changed', 'archived', 'conflict', 'resolved'].includes(r.status));
    if (hasInvalidStatus) return { success: false, error: 'Invalid bounds/enums' };

    const ids = new Set(session.records.map((r: any) => r.id));
    if (ids.size !== session.records.length) return { success: false, error: 'Duplicate IDs' };

    set({
      records: session.records,
      history: Array.isArray(session.history) ? session.history : [],
      selectedIds: new Set(),
      pastStates: []
    });

    return { success: true };
  }
}));
