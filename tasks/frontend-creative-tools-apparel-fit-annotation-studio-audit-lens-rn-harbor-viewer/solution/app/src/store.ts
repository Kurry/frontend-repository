import { create } from 'zustand';
import {
  ApparelFitAnnotationStudioSessionSchema
} from './schemas';

import type {
  FitAnnotation,
  DerivedState,
  HistoryEvent,
  ApparelFitAnnotationStudioSession
} from './schemas';

// Generate some deterministic seeds
const seedRecords: FitAnnotation[] = Array.from({ length: 110 }).map((_, i) => {
  const id = `rec-${i + 1}`;
  let status: FitAnnotation['status'] = 'draft';
  let auditLensState: FitAnnotation['auditLensState'] = 'idle';
  let evidenceAttached = false;
  let discrepancyResolved = false;

  if (i === 0) {
    status = 'ready';
  } else if (i === 1) {
    status = 'empty';
  } else if (i === 2) {
    auditLensState = 'conflict';
    evidenceAttached = true;
  }

  return {
    id,
    title: `Annotation ${i + 1}`,
    status,
    measurement: 10 + i,
    evidenceAttached,
    auditLensState,
    discrepancyResolved
  };
});

function calculateDerived(records: FitAnnotation[]): DerivedState {
  const resolved = records.filter(r => r.discrepancyResolved).length;
  return {
    summary: `${resolved} of ${records.length} resolved`,
    totalRecords: records.length,
    resolvedCount: resolved
  };
}

const initialSession: ApparelFitAnnotationStudioSession = {
  schemaVersion: 'fit-annotations-v1',
  exportedAt: new Date().toISOString(),
  records: seedRecords,
  derived: calculateDerived(seedRecords),
  history: []
};

type StoreState = {
  session: ApparelFitAnnotationStudioSession;
  pastSessions: ApparelFitAnnotationStudioSession[];

  // Fit Annotations CRUD
  addRecord: (record: FitAnnotation) => void;
  updateRecord: (id: string, record: Partial<FitAnnotation>) => void;
  deleteRecord: (id: string) => void;

  // Audit Lens
  attachEvidenceAndResolve: (id: string) => { success: boolean; error?: string };

  // Artifact
  importSession: (sessionData: unknown) => { success: boolean; error?: string };
  clearSession: () => void;

  // General
  undo: () => void;
};

function logHistory(
  history: HistoryEvent[],
  action: string,
  recordId?: string
): HistoryEvent[] {
  return [
    ...history,
    {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      action,
      recordId
    }
  ];
}

export const useStore = create<StoreState>((set, get) => ({
  session: initialSession,
  pastSessions: [],

  addRecord: (record) => {
    set((state) => {
      const newRecords = [...state.session.records, record];
      const newSession = {
        ...state.session,
        records: newRecords,
        derived: calculateDerived(newRecords),
        history: logHistory(state.session.history, 'CREATE_RECORD', record.id)
      };
      return {
        pastSessions: [...state.pastSessions, state.session],
        session: newSession
      };
    });
  },

  updateRecord: (id, updates) => {
    set((state) => {
      const newRecords = state.session.records.map(r => r.id === id ? { ...r, ...updates } : r);
      const newSession = {
        ...state.session,
        records: newRecords,
        derived: calculateDerived(newRecords),
        history: logHistory(state.session.history, 'UPDATE_RECORD', id)
      };
      return {
        pastSessions: [...state.pastSessions, state.session],
        session: newSession
      };
    });
  },

  deleteRecord: (id) => {
    set((state) => {
      const newRecords = state.session.records.filter(r => r.id !== id);
      const newSession = {
        ...state.session,
        records: newRecords,
        derived: calculateDerived(newRecords),
        history: logHistory(state.session.history, 'DELETE_RECORD', id)
      };
      return {
        pastSessions: [...state.pastSessions, state.session],
        session: newSession
      };
    });
  },

  attachEvidenceAndResolve: (id) => {
    const { session, pastSessions } = get();
    const record = session.records.find(r => r.id === id);
    if (!record) return { success: false, error: 'Record not found' };

    // Conflicting or incomplete mutation rejected
    if (record.auditLensState === 'conflict' && record.evidenceAttached) {
       return { success: false, error: 'Cannot attach evidence to a conflicting record without clearing it first.' };
    }

    const newRecords = session.records.map(r => {
      if (r.id === id) {
        return {
          ...r,
          evidenceAttached: true,
          discrepancyResolved: true,
          auditLensState: 'resolved' as const,
          status: 'ready' as const
        };
      }
      return r;
    });

    const newSession = {
      ...session,
      records: newRecords,
      derived: calculateDerived(newRecords),
      history: logHistory(session.history, 'ATTACH_EVIDENCE_RESOLVE', id)
    };

    set({
      pastSessions: [...pastSessions, session],
      session: newSession
    });

    return { success: true };
  },

  importSession: (sessionData) => {
    const result = ApparelFitAnnotationStudioSessionSchema.safeParse(sessionData);
    if (!result.success) {
      return { success: false, error: 'Malformed schema or invalid bounds' };
    }

    // duplicate IDs check
    const ids = new Set();
    for (const r of result.data.records) {
      if (ids.has(r.id)) {
        return { success: false, error: 'Duplicate IDs found in records' };
      }
      ids.add(r.id);
    }

    set((state) => ({
      pastSessions: [...state.pastSessions, state.session],
      session: {
        ...result.data,
        exportedAt: new Date().toISOString()
      }
    }));
    return { success: true };
  },

  clearSession: () => {
    set((state) => ({
      pastSessions: [...state.pastSessions, state.session],
      session: {
        schemaVersion: 'fit-annotations-v1',
        exportedAt: new Date().toISOString(),
        records: [],
        derived: calculateDerived([]),
        history: logHistory(state.session.history, 'CLEAR_SESSION')
      }
    }));
  },

  undo: () => {
    set((state) => {
      if (state.pastSessions.length === 0) return state;
      const previousSession = state.pastSessions[state.pastSessions.length - 1];
      return {
        pastSessions: state.pastSessions.slice(0, -1),
        session: previousSession
      };
    });
  }
}));
