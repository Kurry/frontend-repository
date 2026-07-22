import { create } from 'zustand';
import { PracticeSegment, SessionArtifact, SessionArtifactSchema, DomainState, Readiness } from '../types';

export interface AppState {
  records: PracticeSegment[];
  history: { action: string; timestamp: string; previousRecords: PracticeSegment[] }[];
  filterStatus: DomainState | 'all';
  selectedRecordId: string | null;

  // Actions
  setFilterStatus: (status: DomainState | 'all') => void;
  setSelectedRecordId: (id: string | null) => void;

  // CRUD
  addRecord: (record: Omit<PracticeSegment, 'id'>) => void;
  updateRecord: (id: string, updates: Partial<PracticeSegment>) => void;
  deleteRecord: (id: string) => void;

  // Signature Mutation
  assignOwnerAndReadiness: (id: string, owner: string, readiness: Readiness) => void;

  // Undo/History
  undo: () => void;

  // Artifact
  exportArtifact: () => SessionArtifact;
  importArtifact: (data: unknown) => { success: boolean; error?: any };
  clear: () => void;
}

const generateSeedData = (): PracticeSegment[] => {
  const data: PracticeSegment[] = [];
  for (let i = 1; i <= 105; i++) {
    data.push({
      id: `seg-${i}`,
      name: `Practice Loop ${i}`,
      domainState: i % 10 === 0 ? 'archived' : (i % 3 === 0 ? 'changed' : 'draft'),
      owner: null,
      readiness: 'not_ready',
    });
  }
  return data;
};

const initialRecords = generateSeedData();

export const useAppStore = create<AppState>((set, get) => ({
  records: initialRecords,
  history: [],
  filterStatus: 'all',
  selectedRecordId: null,

  setFilterStatus: (status) => set({ filterStatus: status }),
  setSelectedRecordId: (id) => set({ selectedRecordId: id }),

  addRecord: (recordData) => {
    const newRecord: PracticeSegment = {
      ...recordData,
      id: `seg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    set((state) => ({
      history: [...state.history, { action: 'addRecord', timestamp: new Date().toISOString(), previousRecords: state.records }],
      records: [...state.records, newRecord],
    }));
  },

  updateRecord: (id, updates) => {
    set((state) => {
      const newRecords = state.records.map((r) => (r.id === id ? { ...r, ...updates } : r));
      return {
        history: [...state.history, { action: 'updateRecord', timestamp: new Date().toISOString(), previousRecords: state.records }],
        records: newRecords,
      };
    });
  },

  deleteRecord: (id) => {
    set((state) => ({
      history: [...state.history, { action: 'deleteRecord', timestamp: new Date().toISOString(), previousRecords: state.records }],
      records: state.records.filter((r) => r.id !== id),
      selectedRecordId: state.selectedRecordId === id ? null : state.selectedRecordId,
    }));
  },

  assignOwnerAndReadiness: (id, owner, readiness) => {
    set((state) => {
      const record = state.records.find(r => r.id === id);
      if (!record) return state;

      const newDomainState: DomainState = readiness === 'handoff_complete' ? 'resolved' : (readiness === 'ready_for_handoff' ? 'ready' : 'changed');

      const newRecords = state.records.map((r) =>
        r.id === id ? { ...r, owner, readiness, domainState: newDomainState } : r
      );

      return {
        history: [...state.history, { action: 'assignOwnerAndReadiness', timestamp: new Date().toISOString(), previousRecords: state.records }],
        records: newRecords,
      };
    });
  },

  undo: () => {
    set((state) => {
      if (state.history.length === 0) return state;
      const lastState = state.history[state.history.length - 1];
      return {
        records: lastState.previousRecords,
        history: state.history.slice(0, -1),
        // reset selection if the selected record no longer exists
        selectedRecordId: lastState.previousRecords.some(r => r.id === state.selectedRecordId) ? state.selectedRecordId : null
      };
    });
  },

  exportArtifact: () => {
    const state = get();
    const readyCount = state.records.filter(r => r.readiness === 'ready_for_handoff').length;
    const completeCount = state.records.filter(r => r.readiness === 'handoff_complete').length;

    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: {
        totalSegments: state.records.length,
        readyForHandoff: readyCount,
        handoffComplete: completeCount,
      },
      history: state.history.map((h, i) => ({
        id: `hist-${i}`,
        action: h.action,
        timestamp: h.timestamp,
        details: null,
      })),
    };
  },

  importArtifact: (data) => {
    const result = SessionArtifactSchema.safeParse(data);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    // valid artifact, load it
    set({
      records: result.data.records,
      history: [], // reset local undo history on import, or we could load it but our history object has previousRecords which aren't in the artifact
      selectedRecordId: null,
      filterStatus: 'all'
    });

    return { success: true };
  },

  clear: () => {
    set({
      records: [],
      history: [],
      selectedRecordId: null,
      filterStatus: 'all'
    });
  }
}));
