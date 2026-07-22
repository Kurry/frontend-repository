import { create } from 'zustand';
import { ContinuitySessionSchema } from './types';
import type { CostumeRecord, CostumeStatus, ContinuitySession, ProvenanceAtlasState } from './types';

interface StoreState {
  records: CostumeRecord[];
  history: ContinuitySession['history'];
  selectedRecordId: string | null;
  undoStack: { records: CostumeRecord[], selectedRecordId: string | null }[];

  // Actions
  addRecord: (record: Omit<CostumeRecord, 'id' | 'status' | 'provenanceAtlasState'>) => void;
  updateRecord: (id: string, updates: Partial<CostumeRecord>) => void;
  deleteRecord: (id: string) => void;
  selectRecord: (id: string | null) => void;

  // Provenance Atlas specific
  traceAndQuarantine: (id: string, reason: string) => void;
  resolveConflict: (id: string) => void;

  undo: () => void;

  // Artifact
  exportArtifact: () => ContinuitySession;
  importArtifact: (data: unknown) => boolean;
  clearSession: () => void;
}

const calculateDerived = (records: CostumeRecord[]) => {
  const counts = { draft: 0, ready: 0, changed: 0, archived: 0 };
  records.forEach(r => counts[r.status]++);
  return {
    summary: `${records.length} total looks, ${counts.ready} ready for continuity.`,
    totalRecords: records.length,
    statusCounts: counts
  };
};

export const useStore = create<StoreState>((set, get) => ({
  records: [
    {
      id: '1',
      character: 'Protagonist',
      scene: 'Scene 1: Morning',
      description: 'Blue jacket, white shirt, jeans.',
      status: 'ready',
      provenanceAtlasState: 'idle',
      sourceEvidence: [{ id: 'e1', type: 'script', description: 'Script says blue jacket', date: new Date().toISOString() }]
    },
    {
      id: '2',
      character: 'Protagonist',
      scene: 'Scene 2: Afternoon',
      description: 'Blue jacket (dirty), white shirt, jeans.',
      status: 'draft',
      provenanceAtlasState: 'idle',
      sourceEvidence: []
    }
  ],
  history: [],
  selectedRecordId: null,
  undoStack: [],

  addRecord: (recordData) => set((state) => {
    const newRecord: CostumeRecord = {
      ...recordData,
      id: Math.random().toString(36).substring(7),
      status: 'draft',
      provenanceAtlasState: 'idle'
    };
    const newRecords = [...state.records, newRecord];
    return {
      records: newRecords,
      undoStack: [...state.undoStack, { records: state.records, selectedRecordId: state.selectedRecordId }],
      history: [...state.history, { action: 'ADD_RECORD', timestamp: new Date().toISOString(), details: { id: newRecord.id } }]
    };
  }),

  updateRecord: (id, updates) => set((state) => {
    const newRecords = state.records.map(r => r.id === id ? { ...r, ...updates } : r);
    return {
      records: newRecords,
      undoStack: [...state.undoStack, { records: state.records, selectedRecordId: state.selectedRecordId }],
      history: [...state.history, { action: 'UPDATE_RECORD', timestamp: new Date().toISOString(), details: { id, updates } }]
    };
  }),

  deleteRecord: (id) => set((state) => {
    const newRecords = state.records.filter(r => r.id !== id);
    return {
      records: newRecords,
      selectedRecordId: state.selectedRecordId === id ? null : state.selectedRecordId,
      undoStack: [...state.undoStack, { records: state.records, selectedRecordId: state.selectedRecordId }],
      history: [...state.history, { action: 'DELETE_RECORD', timestamp: new Date().toISOString(), details: { id } }]
    };
  }),

  selectRecord: (id) => set({ selectedRecordId: id }),

  traceAndQuarantine: (id, reason) => set((state) => {
    const record = state.records.find(r => r.id === id);
    if (!record) return state;

    const newRecords = state.records.map(r =>
      r.id === id
        ? { ...r, status: 'changed' as CostumeStatus, provenanceAtlasState: 'conflict' as ProvenanceAtlasState, quarantineReason: reason }
        : r
    );

    return {
      records: newRecords,
      selectedRecordId: id,
      undoStack: [...state.undoStack, { records: state.records, selectedRecordId: state.selectedRecordId }],
      history: [...state.history, { action: 'TRACE_AND_QUARANTINE', timestamp: new Date().toISOString(), details: { id, reason } }]
    };
  }),

  resolveConflict: (id) => set((state) => {
    const newRecords = state.records.map(r =>
      r.id === id
        ? { ...r, status: 'ready' as CostumeStatus, provenanceAtlasState: 'resolved' as ProvenanceAtlasState, quarantineReason: undefined }
        : r
    );
    return {
      records: newRecords,
      undoStack: [...state.undoStack, { records: state.records, selectedRecordId: state.selectedRecordId }],
      history: [...state.history, { action: 'RESOLVE_CONFLICT', timestamp: new Date().toISOString(), details: { id } }]
    };
  }),

  undo: () => set((state) => {
    if (state.undoStack.length === 0) return state;
    const previousState = state.undoStack[state.undoStack.length - 1];
    return {
      records: previousState.records,
      selectedRecordId: previousState.selectedRecordId,
      undoStack: state.undoStack.slice(0, -1),
      history: [...state.history, { action: 'UNDO', timestamp: new Date().toISOString(), details: {} }]
    };
  }),

  exportArtifact: () => {
    const state = get();
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: calculateDerived(state.records),
      history: state.history
    };
  },

  importArtifact: (data) => {
    try {
      const parsed = ContinuitySessionSchema.parse(data);
      set({
        records: parsed.records,
        history: parsed.history,
        undoStack: [],
        selectedRecordId: null
      });
      return true;
    } catch (e) {
      console.error("Invalid artifact", e);
      return false;
    }
  },

  clearSession: () => set({ records: [], history: [], undoStack: [], selectedRecordId: null })
}));
