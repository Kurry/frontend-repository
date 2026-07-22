import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { formatRFC3339 } from 'date-fns';
import { QuiltBlockType, SessionArtifactType, SessionArtifact } from './schema';

interface AppState {
  records: QuiltBlockType[];
  history: QuiltBlockType[][]; // Store past states for exact undo
  eventHistory: { id: string; type: string; timestamp: string; details: string }[];
  activeRecordId: string | null;

  createBlock: (block: Omit<QuiltBlockType, 'id' | 'createdAt' | 'updatedAt' | 'provenanceState'>) => void;
  editBlock: (id: string, updates: Partial<QuiltBlockType>) => void;
  deleteBlock: (id: string) => void;

  // Signature mutation
  traceAndQuarantineLineage: (id: string, lineageInfo: string) => void;

  undo: () => void;

  importSession: (json: string) => { success: boolean; error?: string };
  exportSession: () => SessionArtifactType;
  clearSession: () => void;
  setActiveRecordId: (id: string | null) => void;
}

const getDerivedState = (records: QuiltBlockType[]) => {
  return {
    summary: `Collection of ${records.length} blocks`,
    totalBlocks: records.length,
    archivedCount: records.filter(r => r.status === 'archived').length,
    quarantinedCount: records.filter(r => r.provenanceState === 'conflict' || r.provenanceState === 'resolved').length,
  };
};

export const useStore = create<AppState>((set, get) => ({
  records: [],
  history: [],
  eventHistory: [],
  activeRecordId: null,

  setActiveRecordId: (id) => set({ activeRecordId: id }),

  createBlock: (block) => set((state) => {
    const newRecord: QuiltBlockType = {
      ...block,
      id: uuidv4(),
      createdAt: formatRFC3339(new Date()),
      updatedAt: formatRFC3339(new Date()),
      provenanceState: 'idle'
    };
    const newRecords = [...state.records, newRecord];
    return {
      records: newRecords,
      history: [...state.history, state.records],
      eventHistory: [...state.eventHistory, {
        id: uuidv4(), type: 'CREATE', timestamp: formatRFC3339(new Date()), details: `Created block ${newRecord.name}`
      }]
    };
  }),

  editBlock: (id, updates) => set((state) => {
    const newRecords = state.records.map(r =>
      r.id === id ? { ...r, ...updates, updatedAt: formatRFC3339(new Date()) } : r
    );
    return {
      records: newRecords,
      history: [...state.history, state.records],
      eventHistory: [...state.eventHistory, {
        id: uuidv4(), type: 'EDIT', timestamp: formatRFC3339(new Date()), details: `Edited block ${id}`
      }]
    };
  }),

  deleteBlock: (id) => set((state) => {
    const newRecords = state.records.filter(r => r.id !== id);
    return {
      records: newRecords,
      history: [...state.history, state.records],
      eventHistory: [...state.eventHistory, {
        id: uuidv4(), type: 'DELETE', timestamp: formatRFC3339(new Date()), details: `Deleted block ${id}`
      }],
      activeRecordId: state.activeRecordId === id ? null : state.activeRecordId
    };
  }),

  traceAndQuarantineLineage: (id, lineageInfo) => set((state) => {
    const newRecords = state.records.map(r =>
      r.id === id ? {
        ...r,
        provenanceState: 'conflict' as const,
        status: 'archived' as const,
        lineageInfo: lineageInfo,
        updatedAt: formatRFC3339(new Date())
      } : r
    );
    return {
      records: newRecords,
      history: [...state.history, state.records],
      eventHistory: [...state.eventHistory, {
        id: uuidv4(), type: 'QUARANTINE', timestamp: formatRFC3339(new Date()), details: `Quarantined lineage for block ${id}`
      }],
      activeRecordId: id
    };
  }),

  undo: () => set((state) => {
    if (state.history.length === 0) return {};
    const newRecords = state.history[state.history.length - 1];
    const newHistory = state.history.slice(0, -1);
    const newActiveId = newRecords.find(r => r.id === state.activeRecordId) ? state.activeRecordId : null;
    return {
      records: newRecords,
      history: newHistory,
      activeRecordId: newActiveId,
      eventHistory: [...state.eventHistory, {
        id: uuidv4(), type: 'UNDO', timestamp: formatRFC3339(new Date()), details: `Undid last mutation`
      }]
    };
  }),

  importSession: (jsonStr) => {
    try {
      const data = JSON.parse(jsonStr);
      const result = SessionArtifact.safeParse(data);
      if (result.success) {
        set({
          records: result.data.records,
          history: [],
          eventHistory: result.data.history,
          activeRecordId: null
        });
        return { success: true };
      } else {
        return { success: false, error: 'Validation failed' };
      }
    } catch (e) {
      return { success: false, error: 'Invalid JSON format' };
    }
  },

  exportSession: () => {
    const state = get();
    return {
      schemaVersion: 'v1' as const,
      exportedAt: formatRFC3339(new Date()),
      records: state.records,
      derived: getDerivedState(state.records),
      history: state.eventHistory
    };
  },

  clearSession: () => set({
    records: [],
    history: [],
    eventHistory: [],
    activeRecordId: null
  })
}));
