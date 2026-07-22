import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { AppState, WorkRecord, RecordStatus, ForecastOutcome, ArtifactSession, DerivedStats, HistoryEvent } from './types';
import { formatISO } from 'date-fns';

const INITIAL_RECORDS: WorkRecord[] = [
  { id: '1', title: 'Prepare soil beds', status: 'ready', assignedDate: '2025-04-10', effort: 4 },
  { id: '2', title: 'Plant tomato seedlings', status: 'draft', assignedDate: '2025-04-12', effort: 2 },
  { id: '3', title: 'Build new compost bin', status: 'empty', assignedDate: '', effort: 0 },
  { id: '4', title: 'Repair fence', status: 'draft', assignedDate: '2025-04-15', effort: 8 },
];

export const calculateDerivedStats = (records: WorkRecord[], selectedId: string | null, forecastRecord: WorkRecord | null): DerivedStats => {
  let totalEffort = 0;
  let readyCount = 0;
  let draftCount = 0;
  let conflictCount = 0;

  for (const r of records) {
    const recordToCount = r.id === selectedId && forecastRecord ? forecastRecord : r;
    totalEffort += recordToCount.effort;
    if (recordToCount.status === 'ready') readyCount++;
    if (recordToCount.status === 'draft') draftCount++;
  }

  const dateMap = new Map<string, number>();
  for (const r of records) {
      const recordToCount = r.id === selectedId && forecastRecord ? forecastRecord : r;
      if (recordToCount.assignedDate && recordToCount.status !== 'archived') {
          dateMap.set(recordToCount.assignedDate, (dateMap.get(recordToCount.assignedDate) || 0) + recordToCount.effort);
      }
  }

  for (const effort of dateMap.values()) {
      if (effort > 8) conflictCount++;
  }


  return { totalEffort, readyCount, draftCount, conflictCount };
};

interface Store extends AppState {
  // Actions
  addRecord: (record: Omit<WorkRecord, 'id'>) => void;
  updateRecord: (id: string, updates: Partial<WorkRecord>) => void;
  deleteRecord: (id: string) => void;
  setFilter: (status: RecordStatus | 'all') => void;

  // Ribbon
  selectRecord: (id: string | null) => void;
  setRibbonOutcome: (outcome: ForecastOutcome) => void;

  // Forecast Mutation
  forecastRecord: WorkRecord | null;
  updateForecast: (updates: Partial<WorkRecord>) => void;
  applyForecast: () => void;

  undo: () => void;

  // Artifact
  importArtifact: (session: ArtifactSession) => void;
  clearState: () => void;

  // Snapshot for undo
  pastStates: Omit<AppState, 'pastStates'>[];
}

export const useStore = create<Store>((set) => ({
  records: INITIAL_RECORDS,
  history: [],
  selectedRecordId: null,
  ribbonOutcome: 'idle',
  filterStatus: 'all',
  forecastRecord: null,
  pastStates: [],

  addRecord: (recordData) => set((state) => {
    const newRecord = { ...recordData, id: uuidv4() };
    const historyEvent: HistoryEvent = { timestamp: formatISO(new Date()), action: 'create', recordId: newRecord.id };
    return {
      records: [...state.records, newRecord],
      history: [...state.history, historyEvent],
      pastStates: [...state.pastStates, { records: state.records, history: state.history, selectedRecordId: state.selectedRecordId, ribbonOutcome: state.ribbonOutcome, filterStatus: state.filterStatus }]
    };
  }),

  updateRecord: (id, updates) => set((state) => {
    const newRecords = state.records.map(r => r.id === id ? { ...r, ...updates } : r);
    const historyEvent: HistoryEvent = { timestamp: formatISO(new Date()), action: 'update', recordId: id, changes: updates };
    return {
      records: newRecords,
      history: [...state.history, historyEvent],
      pastStates: [...state.pastStates, { records: state.records, history: state.history, selectedRecordId: state.selectedRecordId, ribbonOutcome: state.ribbonOutcome, filterStatus: state.filterStatus }]
    };
  }),

  deleteRecord: (id) => set((state) => {
    const newRecords = state.records.filter(r => r.id !== id);
    const historyEvent: HistoryEvent = { timestamp: formatISO(new Date()), action: 'delete', recordId: id };
    return {
      records: newRecords,
      history: [...state.history, historyEvent],
      pastStates: [...state.pastStates, { records: state.records, history: state.history, selectedRecordId: state.selectedRecordId, ribbonOutcome: state.ribbonOutcome, filterStatus: state.filterStatus }]
    };
  }),

  setFilter: (status) => set({ filterStatus: status }),

  selectRecord: (id) => set((state) => {
      const record = id ? state.records.find(r => r.id === id) || null : null;
      return {
          selectedRecordId: id,
          forecastRecord: record,
          ribbonOutcome: id ? 'selected' : 'idle'
      };
  }),

  setRibbonOutcome: (outcome) => set({ ribbonOutcome: outcome }),

  updateForecast: (updates) => set((state) => {
      if (!state.forecastRecord) return state;
      const updated = { ...state.forecastRecord, ...updates };

      const dateMap = new Map<string, number>();
      for (const r of state.records) {
          if (r.id !== state.selectedRecordId && r.assignedDate && r.status !== 'archived') {
              dateMap.set(r.assignedDate, (dateMap.get(r.assignedDate) || 0) + r.effort);
          }
      }
      if (updated.assignedDate && updated.status !== 'archived') {
           dateMap.set(updated.assignedDate, (dateMap.get(updated.assignedDate) || 0) + updated.effort);
      }
      let hasConflict = false;
      for (const effort of dateMap.values()) {
          if (effort > 8) hasConflict = true;
      }

      return {
          forecastRecord: updated,
          ribbonOutcome: hasConflict ? 'conflict' : 'changed'
      };
  }),

  applyForecast: () => set((state) => {
      if (!state.selectedRecordId || !state.forecastRecord || state.ribbonOutcome === 'conflict') return state;

      const newRecords = state.records.map(r => r.id === state.selectedRecordId ? state.forecastRecord! : r);
      const historyEvent: HistoryEvent = { timestamp: formatISO(new Date()), action: 'forecast_apply', recordId: state.selectedRecordId };
      return {
          records: newRecords,
          history: [...state.history, historyEvent],
          ribbonOutcome: 'resolved',
          pastStates: [...state.pastStates, { records: state.records, history: state.history, selectedRecordId: state.selectedRecordId, ribbonOutcome: state.ribbonOutcome, filterStatus: state.filterStatus }]
      };
  }),

  undo: () => set((state) => {
    if (state.pastStates.length === 0) return state;
    const previous = state.pastStates[state.pastStates.length - 1];
    return {
      records: previous.records,
      history: previous.history,
      selectedRecordId: previous.selectedRecordId,
      ribbonOutcome: previous.ribbonOutcome,
      filterStatus: previous.filterStatus,
      forecastRecord: previous.selectedRecordId ? previous.records.find(r => r.id === previous.selectedRecordId) || null : null,
      pastStates: state.pastStates.slice(0, -1)
    };
  }),

  importArtifact: (session) => set({
      records: session.records,
      history: session.history,
      pastStates: [],
      selectedRecordId: null,
      forecastRecord: null,
      ribbonOutcome: 'idle',
      filterStatus: 'all'
  }),

  clearState: () => set({
      records: [],
      history: [],
      pastStates: [],
      selectedRecordId: null,
      forecastRecord: null,
      ribbonOutcome: 'idle',
      filterStatus: 'all'
  })
}));
