import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { GlazeRecord, ConstraintLane, Status, HistoryEvent, Session } from './types';

interface AppState {
  records: GlazeRecord[];
  history: HistoryEvent[];
  selectedRecordId: string | null;

  // Actions
  addRecord: (record: Omit<GlazeRecord, 'id' | 'lane'>) => void;
  updateRecord: (id: string, updates: Partial<GlazeRecord>) => void;
  deleteRecord: (id: string) => void;
  archiveRecord: (id: string) => void;

  moveRecordLane: (id: string, newLane: ConstraintLane, newStatus: Status) => void;

  setSelectedRecordId: (id: string | null) => void;

  undoLastAction: () => void;

  importSession: (session: Session) => void;
  clearSession: () => void;

  // History stack for undo
  pastStates: { records: GlazeRecord[], history: HistoryEvent[] }[];
}

const generateDerived = (records: GlazeRecord[]) => {
  return {
    summary: `Managing ${records.length} glaze tests`,
    totalCount: records.length,
    conflictCount: records.filter(r => r.status === 'conflict').length,
  };
};

const createHistoryEvent = (action: string, recordId?: string, details?: string): HistoryEvent => ({
  timestamp: new Date().toISOString(),
  action,
  recordId,
  details
});

const saveToPast = (state: AppState) => {
  const newPast = [...state.pastStates, { records: [...state.records], history: [...state.history] }];
  // Limit undo history to 50 items to avoid memory bloat
  if (newPast.length > 50) newPast.shift();
  return newPast;
};

export const useStore = create<AppState>((set) => ({
  records: [
    { id: uuid(), name: 'Celadon Base', baseGlaze: 'Clear', status: 'ready', lane: 'unassigned', temperature: 1220 },
    { id: uuid(), name: 'Tenmoku Deep', baseGlaze: 'Iron', status: 'draft', lane: 'unassigned', temperature: 1240 },
    { id: uuid(), name: 'Shino Opaque', baseGlaze: 'Feldspar', status: 'empty', lane: 'unassigned', temperature: 1200 },
    { id: uuid(), name: 'Copper Red', baseGlaze: 'Copper', status: 'conflict', lane: 'temperature', temperature: 1280 }
  ],
  history: [],
  selectedRecordId: null,
  pastStates: [],

  addRecord: (recordData) => set((state) => {
    const newRecord: GlazeRecord = { ...recordData, id: uuid(), lane: 'unassigned' };
    return {
      pastStates: saveToPast(state),
      records: [...state.records, newRecord],
      history: [...state.history, createHistoryEvent('CREATE_RECORD', newRecord.id, `Created ${newRecord.name}`)]
    };
  }),

  updateRecord: (id, updates) => set((state) => {
    const pastStates = saveToPast(state);
    return {
      pastStates,
      records: state.records.map(r => r.id === id ? { ...r, ...updates } : r),
      history: [...state.history, createHistoryEvent('UPDATE_RECORD', id, `Updated record`)]
    };
  }),

  deleteRecord: (id) => set((state) => {
    const pastStates = saveToPast(state);
    return {
      pastStates,
      records: state.records.filter(r => r.id !== id),
      selectedRecordId: state.selectedRecordId === id ? null : state.selectedRecordId,
      history: [...state.history, createHistoryEvent('DELETE_RECORD', id)]
    };
  }),

  archiveRecord: (id) => set((state) => {
    const pastStates = saveToPast(state);
    return {
      pastStates,
      records: state.records.map(r => r.id === id ? { ...r, status: 'archived' } : r),
      history: [...state.history, createHistoryEvent('ARCHIVE_RECORD', id)]
    };
  }),

  moveRecordLane: (id, newLane, newStatus) => set((state) => {
    const pastStates = saveToPast(state);
    return {
      pastStates,
      records: state.records.map(r => r.id === id ? { ...r, lane: newLane, status: newStatus } : r),
      history: [...state.history, createHistoryEvent('MOVE_RECORD', id, `Moved to ${newLane} as ${newStatus}`)]
    };
  }),

  setSelectedRecordId: (id) => set({ selectedRecordId: id }),

  undoLastAction: () => set((state) => {
    if (state.pastStates.length === 0) return state;
    const previous = state.pastStates[state.pastStates.length - 1];
    return {
      records: previous.records,
      history: previous.history,
      pastStates: state.pastStates.slice(0, -1)
    };
  }),

  importSession: (session) => set(() => ({
    records: session.records,
    history: session.history,
    pastStates: [],
    selectedRecordId: null
  })),

  clearSession: () => set({
    records: [],
    history: [],
    pastStates: [],
    selectedRecordId: null
  })
}));

export const getDerivedState = () => generateDerived(useStore.getState().records);
