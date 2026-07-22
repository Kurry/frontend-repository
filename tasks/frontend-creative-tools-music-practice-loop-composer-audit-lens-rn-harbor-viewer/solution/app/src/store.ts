import { create } from 'zustand';
import { PracticeSegment, AuditLensState, MusicPracticeLoopComposerSession, DomainStatus } from './types';

export interface AppState {
  records: PracticeSegment[];
  auditLens: AuditLensState;
  history: any[];

  addRecord: (record: PracticeSegment) => void;
  updateRecord: (id: string, updates: Partial<PracticeSegment>) => void;
  deleteRecord: (id: string) => void;
  reorderRecords: (newOrder: PracticeSegment[]) => void;

  selectRecordForAudit: (id: string | null) => void;
  attachEvidence: (id: string, evidence: string) => void;
  resolveConflict: (id: string) => void;
  undoLastMutation: () => void;

  exportSession: () => MusicPracticeLoopComposerSession;
  importSession: (session: MusicPracticeLoopComposerSession) => void;
  clearSession: () => void;

  pastStates: { records: PracticeSegment[]; auditLens: AuditLensState; history: any[] }[];
}

export const useStore = create<AppState>((set, get) => ({
  records: [],
  auditLens: { selectedRecordId: null, mode: 'idle' },
  history: [],
  pastStates: [],

  addRecord: (record) => set((state) => {
    const newRecords = [...state.records, record];
    return {
      records: newRecords,
      pastStates: [...state.pastStates, { records: state.records, auditLens: state.auditLens, history: state.history }],
      history: [...state.history, { type: 'add_record', id: record.id, timestamp: new Date().toISOString() }]
    };
  }),

  updateRecord: (id, updates) => set((state) => {
    const newRecords = state.records.map(r => r.id === id ? { ...r, ...updates } : r);
    return {
      records: newRecords,
      pastStates: [...state.pastStates, { records: state.records, auditLens: state.auditLens, history: state.history }],
      history: [...state.history, { type: 'update_record', id, updates, timestamp: new Date().toISOString() }]
    };
  }),

  deleteRecord: (id) => set((state) => {
    const newRecords = state.records.filter(r => r.id !== id);
    const newAuditLens = state.auditLens.selectedRecordId === id
      ? { selectedRecordId: null, mode: 'idle' as const }
      : state.auditLens;
    return {
      records: newRecords,
      auditLens: newAuditLens,
      pastStates: [...state.pastStates, { records: state.records, auditLens: state.auditLens, history: state.history }],
      history: [...state.history, { type: 'delete_record', id, timestamp: new Date().toISOString() }]
    };
  }),

  reorderRecords: (newOrder) => set((state) => ({
    records: newOrder,
    pastStates: [...state.pastStates, { records: state.records, auditLens: state.auditLens, history: state.history }]
  })),

  selectRecordForAudit: (id) => set((state) => {
    const record = state.records.find(r => r.id === id);
    let mode: AuditLensState['mode'] = 'selected';
    if (record?.auditConflict && !record?.auditEvidence) mode = 'conflict';
    else if (record?.auditEvidence && !record?.auditConflict) mode = 'resolved';

    return {
      auditLens: { selectedRecordId: id, mode: id ? mode : 'idle' },
      pastStates: [...state.pastStates, { records: state.records, auditLens: state.auditLens, history: state.history }]
    };
  }),

  attachEvidence: (id, evidence) => set((state) => {
    if (state.auditLens.selectedRecordId !== id) return state;

    const record = state.records.find(r => r.id === id);
    if (!record) return state;

    if (!evidence.trim()) {
      return state;
    }

    const newRecords = state.records.map(r =>
      r.id === id ? { ...r, auditEvidence: evidence, status: 'changed' as DomainStatus } : r
    );

    return {
      records: newRecords,
      auditLens: { ...state.auditLens, mode: 'changed' },
      pastStates: [...state.pastStates, { records: state.records, auditLens: state.auditLens, history: state.history }],
      history: [...state.history, { type: 'attach_evidence', id, evidence, timestamp: new Date().toISOString() }]
    };
  }),

  resolveConflict: (id) => set((state) => {
    if (state.auditLens.selectedRecordId !== id) return state;

    const newRecords = state.records.map(r =>
      r.id === id ? { ...r, status: 'ready' as DomainStatus, auditConflict: undefined } : r
    );

    return {
      records: newRecords,
      auditLens: { ...state.auditLens, mode: 'resolved' },
      pastStates: [...state.pastStates, { records: state.records, auditLens: state.auditLens, history: state.history }],
      history: [...state.history, { type: 'resolve_conflict', id, timestamp: new Date().toISOString() }]
    };
  }),

  undoLastMutation: () => set((state) => {
    if (state.pastStates.length === 0) return state;
    const previousState = state.pastStates[state.pastStates.length - 1];
    return {
      records: previousState.records,
      auditLens: previousState.auditLens,
      history: previousState.history,
      pastStates: state.pastStates.slice(0, -1)
    };
  }),

  exportSession: () => {
    const state = get();
    const readyCount = state.records.filter(r => r.status === 'ready').length;
    const conflictCount = state.records.filter(r => !!r.auditConflict).length;

    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: {
        totalRecords: state.records.length,
        readyCount,
        conflictCount
      },
      history: state.history
    };
  },

  importSession: (session) => set(() => ({
    records: session.records,
    auditLens: { selectedRecordId: null, mode: 'idle' },
    history: session.history,
    pastStates: []
  })),

  clearSession: () => set(() => ({
    records: [],
    auditLens: { selectedRecordId: null, mode: 'idle' },
    history: [],
    pastStates: []
  }))
}));
