import { create } from 'zustand';
import { z } from 'zod';

export type RecordStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface AuditLensState {
  evidence: string;
  discrepancy: string;
  resolved: boolean;
}

export interface SoundLayerRecord {
  id: string;
  name: string;
  status: RecordStatus;
  volume: number;
  auditLensState: AuditLensState;
}

export interface MutationEvent {
  id: string;
  timestamp: string;
  type: string;
  recordId: string;
  details: string;
}

export interface AppState {
  records: SoundLayerRecord[];
  history: MutationEvent[];
  selectedRecordId: string | null;
  lastState: { records: SoundLayerRecord[]; history: MutationEvent[] } | null;
}

const auditLensSchema = z.object({
  evidence: z.string(),
  discrepancy: z.string(),
  resolved: z.boolean(),
});

const recordSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['empty', 'draft', 'ready', 'changed', 'archived']),
  volume: z.number().min(0).max(100),
  auditLensState: auditLensSchema,
});

export const sessionSchema = z.object({
  schemaVersion: z.literal('soundscape-scene-v1'),
  exportedAt: z.string(),
  records: z.array(recordSchema),
  derived: z.object({
    resolvedCount: z.number(),
    totalVolume: z.number(),
  }),
  history: z.array(
    z.object({
      id: z.string(),
      timestamp: z.string(),
      type: z.string(),
      recordId: z.string(),
      details: z.string(),
    })
  ),
});

interface StoreActions {
  addRecord: (record: SoundLayerRecord) => void;
  updateRecord: (id: string, updates: Partial<SoundLayerRecord>) => void;
  deleteRecord: (id: string) => void;
  selectRecord: (id: string | null) => void;
  attachEvidenceAndResolve: (id: string, evidence: string, discrepancy: string) => void;
  undo: () => void;
  importSession: (sessionJson: string) => { success: boolean; error?: string };
  exportSession: () => string;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const initialState: AppState = {
  records: [
    {
      id: '1',
      name: 'Ambient Room Tone',
      status: 'ready',
      volume: 45,
      auditLensState: { evidence: '', discrepancy: '', resolved: false },
    },
    {
      id: '2',
      name: 'Foley Footsteps',
      status: 'draft',
      volume: 80,
      auditLensState: { evidence: '', discrepancy: 'Missing sync marker', resolved: false },
    },
    {
      id: '3',
      name: 'Dialogue Track',
      status: 'changed',
      volume: 60,
      auditLensState: { evidence: 'Verified sync at 01:23:04', discrepancy: 'Audio drifted 2 frames', resolved: true },
    },
    {
      id: '4',
      name: 'Empty Slot',
      status: 'empty',
      volume: 0,
      auditLensState: { evidence: '', discrepancy: '', resolved: false },
    }
  ],
  history: [],
  selectedRecordId: null,
  lastState: null,
};

export const useStore = create<AppState & StoreActions>((set, get) => ({
  ...initialState,

  addRecord: (record) => {
    set((state) => ({
      lastState: { records: state.records, history: state.history },
      records: [...state.records, record],
      history: [
        ...state.history,
        {
          id: generateId(),
          timestamp: new Date().toISOString(),
          type: 'CREATE',
          recordId: record.id,
          details: `Created record ${record.name}`,
        },
      ],
    }));
  },

  updateRecord: (id, updates) => {
    set((state) => ({
      lastState: { records: state.records, history: state.history },
      records: state.records.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      history: [
        ...state.history,
        {
          id: generateId(),
          timestamp: new Date().toISOString(),
          type: 'UPDATE',
          recordId: id,
          details: `Updated record ${id}`,
        },
      ],
    }));
  },

  deleteRecord: (id) => {
    set((state) => ({
      lastState: { records: state.records, history: state.history },
      records: state.records.filter((r) => r.id !== id),
      selectedRecordId: state.selectedRecordId === id ? null : state.selectedRecordId,
      history: [
        ...state.history,
        {
          id: generateId(),
          timestamp: new Date().toISOString(),
          type: 'DELETE',
          recordId: id,
          details: `Deleted record ${id}`,
        },
      ],
    }));
  },

  selectRecord: (id) => set({ selectedRecordId: id }),

  attachEvidenceAndResolve: (id, evidence, discrepancy) => {
    set((state) => {
      const record = state.records.find((r) => r.id === id);
      if (!record) return state;

      const newRecord: SoundLayerRecord = {
        ...record,
        status: 'ready',
        auditLensState: {
          evidence,
          discrepancy,
          resolved: true,
        },
      };

      return {
        lastState: { records: state.records, history: state.history },
        records: state.records.map((r) => (r.id === id ? newRecord : r)),
        history: [
          ...state.history,
          {
            id: generateId(),
            timestamp: new Date().toISOString(),
            type: 'RESOLVE_AUDIT',
            recordId: id,
            details: `Attached evidence and resolved audit for ${id}`,
          },
        ],
      };
    });
  },

  undo: () => {
    set((state) => {
      if (!state.lastState) return state;
      return {
        records: state.lastState.records,
        history: state.lastState.history,
        lastState: null,
      };
    });
  },

  importSession: (sessionJson) => {
    try {
      const parsed = JSON.parse(sessionJson);
      const result = sessionSchema.safeParse(parsed);
      if (!result.success) {
        return { success: false, error: 'Validation failed: ' + result.error.message };
      }

      const uniqueIds = new Set(result.data.records.map(r => r.id));
      if (uniqueIds.size !== result.data.records.length) {
        return { success: false, error: 'Duplicate IDs found in records.' };
      }

      set({
        records: result.data.records,
        history: result.data.history,
        selectedRecordId: null,
        lastState: null,
      });

      return { success: true };
    } catch (e) {
      return { success: false, error: 'Malformed JSON.' };
    }
  },

  exportSession: () => {
    const state = get();
    const resolvedCount = state.records.filter((r) => r.auditLensState.resolved).length;
    const totalVolume = state.records.reduce((acc, r) => acc + r.volume, 0);

    const session = {
      schemaVersion: 'soundscape-scene-v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: {
        resolvedCount,
        totalVolume,
      },
      history: state.history,
    };

    return JSON.stringify(session, null, 2);
  },
}));
